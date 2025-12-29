/**
 * 뷰어 모듈
 * 파일 처리, UI 조작, 스크롤 및 북마크 관련 기능 (통합 수정본)
 */

import { formatFileSize, formatTimestamp, generateFileKey, downloadAsMarkdown as downloadMarkdown } from './utils.js';
import { getHistory, setHistory, saveReadingProgress, loadReadingProgress, getBookmarks, getBookmarksByFileKey, setBookmarks, saveLastReadFile, loadLastReadFile } from './settings.js';
import { cleanTextWithAI } from './ai_service.js';

// 전역 상태
let files = [];
let currentFileIndex = -1;
let currentFileKey = null;
let scrollSaveTimer = null;
let lastSelectionRange = null; // 선택 영역 저장을 위한 변수

// 현재 파일 이름 가져오기
function getCurrentFileName() {
    // 1. files 배열에서 찾기 (로컬 파일)
    if (files && files[currentFileIndex]) {
        return files[currentFileIndex].name;
    }
    
    // 2. 히스토리에서 currentFileKey로 찾기 (Google Drive 파일 등)
    if (currentFileKey) {
        const history = getHistory();
        const historyItem = history.find(h => h.fileKey === currentFileKey);
        if (historyItem && historyItem.name) {
            return historyItem.name;
        }
    }
    
    // 3. 마지막 읽은 파일 정보에서 찾기
    const lastReadFile = loadLastReadFile();
    if (lastReadFile && lastReadFile.fileKey === currentFileKey && lastReadFile.name) {
        return lastReadFile.name;
    }
    
    return '알 수 없는 파일';
}

// 메타데이터 분리 및 파싱 함수
function parseAndRemoveMetadata(fullContent) {
    // 정규식: 파일 끝의 HTML 주석 패턴 찾기
    // <!-- EBOOK_VIEWER_METADATA: {...} -->
    // 여러 줄 JSON을 포함할 수 있으므로 [\s\S]*? 사용 (non-greedy)
    const metadataMarker = /<!--\s*EBOOK_VIEWER_METADATA:\s*([\s\S]*?)\s*-->\s*$/;
    const match = fullContent.match(metadataMarker);
    
    let content = fullContent;
    let metadata = null;

    if (match && match[1]) {
        try {
            metadata = JSON.parse(match[1]);
            // 뷰어에 보여줄 때는 주석 부분을 제거하고 순수 본문만 리턴
            content = fullContent.replace(match[0], '').trim();
            console.log("📂 파일 내부 메타데이터 발견:", metadata);
        } catch (e) {
            console.error("메타데이터 파싱 실패:", e);
        }
    }
    
    return { content, metadata };
}

// 메타데이터 생성 함수 (북마크 정보 포함)
function generateMetadata() {
    if (!currentFileKey) return null;
    
    const bookmarks = getBookmarks();
    const fileBookmarks = bookmarks[currentFileKey] || [];
    
    if (fileBookmarks.length === 0) return null;
    
    return {
        version: '1.0',
        fileKey: currentFileKey,
        fileName: getCurrentFileName(),
        bookmarks: fileBookmarks.map(bm => ({
            preview: bm.preview,
            position: bm.position,
            yOffset: bm.yOffset,
            timestamp: bm.timestamp,
            type: bm.type
        })),
        exportedAt: Date.now()
    };
}

// 메타데이터로부터 북마크 복원 함수
function restoreBookmarksFromMetadata(metadata) {
    if (!metadata || !metadata.bookmarks || !metadata.fileKey) {
        return;
    }
    
    try {
        // 현재 파일의 fileKey와 메타데이터의 fileKey가 일치하는지 확인
        // 파일을 열 때 currentFileKey가 이미 설정되어 있어야 함
        if (!currentFileKey || currentFileKey !== metadata.fileKey) {
            console.warn("⚠️ 메타데이터의 fileKey와 현재 파일의 fileKey가 일치하지 않습니다.", {
                metadataFileKey: metadata.fileKey,
                currentFileKey: currentFileKey
            });
            // fileKey가 다르더라도 현재 파일의 fileKey로 북마크를 복원
            // (파일명이 같지만 다른 경로에서 열었을 수 있음)
        }
        
        const bookmarks = getBookmarks();
        // 현재 파일의 fileKey 사용 (메타데이터의 fileKey가 아닌)
        const targetFileKey = currentFileKey || metadata.fileKey;
        const existingBookmarks = bookmarks[targetFileKey] || [];
        
        // 기존 북마크와 병합 (중복 제거)
        const mergedBookmarks = [...existingBookmarks];
        metadata.bookmarks.forEach(importedBm => {
            // 같은 위치의 북마크가 있는지 확인 (0.1% 오차 허용)
            const isDuplicate = mergedBookmarks.some(existingBm => 
                Math.abs(existingBm.position - importedBm.position) < 0.1
            );
            
            if (!isDuplicate) {
                mergedBookmarks.push({
                    fileKey: targetFileKey,
                    fileName: metadata.fileName || getCurrentFileName(),
                    preview: importedBm.preview,
                    position: importedBm.position,
                    yOffset: importedBm.yOffset,
                    timestamp: importedBm.timestamp || Date.now(),
                    type: importedBm.type || 'bookmark'
                });
            }
        });
        
        if (mergedBookmarks.length > existingBookmarks.length) {
            bookmarks[targetFileKey] = mergedBookmarks;
            setBookmarks(bookmarks);
            displayUploadBookmarks();
            console.log(`✅ ${mergedBookmarks.length - existingBookmarks.length}개의 북마크가 파일에서 복원되었습니다.`);
        }
    } catch (e) {
        console.error("북마크 복원 실패:", e);
    }
}

// ==========================================
// [핵심 수정 1] Window 기준 스크롤/프로그래스바
// ==========================================

function setupScrollListener() {
    // 기존 리스너 제거 후 Window 스크롤 감시 등록
    window.removeEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll, { passive: true });
}

// 컨텍스트 메뉴 리스너 설정
function setupContextMenuListener() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:53',message:'setupContextMenuListener 호출',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const viewerContent = document.getElementById('viewerContent');
    const contextMenu = document.getElementById('contextMenu');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:57',message:'요소 존재 확인',data:{viewerContentExists:!!viewerContent,contextMenuExists:!!contextMenu},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!viewerContent || !contextMenu) return;
    
    // 기존 리스너 제거
    viewerContent.removeEventListener('contextmenu', handleContextMenu);
    document.removeEventListener('click', hideContextMenu);
    
    // 새 리스너 등록
    viewerContent.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', hideContextMenu);
    
    // 메뉴 항목 클릭 이벤트
    const ctxBookmark = document.getElementById('ctxBookmark');
    const ctxNote = document.getElementById('ctxNote');
    const ctxShare = document.getElementById('ctxShare');
    const ctxMenuInternalToggle = document.getElementById('ctxMenuInternalToggle');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:73',message:'ctxBookmark 요소 확인',data:{ctxBookmarkExists:!!ctxBookmark},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (ctxBookmark) {
        ctxBookmark.removeEventListener('click', handleBookmarkFromContext);
        ctxBookmark.addEventListener('click', handleBookmarkFromContext);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:76',message:'ctxBookmark 이벤트 리스너 등록 완료',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
    }
    
    if (ctxNote) {
        ctxNote.removeEventListener('click', handleNoteFromContext);
        ctxNote.addEventListener('click', handleNoteFromContext);
    }
    
    if (ctxShare) {
        ctxShare.removeEventListener('click', handleShareFromContext);
        ctxShare.addEventListener('click', handleShareFromContext);
    }
    
    // 메뉴 내부 스위치 이벤트
    if (ctxMenuInternalToggle) {
        ctxMenuInternalToggle.removeEventListener('change', handleContextMenuToggle);
        ctxMenuInternalToggle.addEventListener('change', handleContextMenuToggle);
        // 스위치 클릭 시 메뉴가 닫히지 않도록
        ctxMenuInternalToggle.addEventListener('click', (e) => e.stopPropagation());
    }
    
    // 스위치 컨테이너 클릭 시 메뉴가 닫히지 않도록
    const toggleContainer = ctxMenuInternalToggle?.closest('div');
    if (toggleContainer) {
        toggleContainer.addEventListener('click', (e) => e.stopPropagation());
    }
    
    // 설정 복원
    restoreContextMenuSetting();
}

// 컨텍스트 메뉴 토글 (메뉴 내부 스위치에서)
function handleContextMenuToggle(e) {
    e.stopPropagation(); // 메뉴가 닫히지 않도록
    const enabled = e.target.checked;
    setContextMenuEnabled(enabled);
    
    // 설정 패널 스위치도 동기화
    const ctxMenuSettingsToggle = document.getElementById('ctxMenuSettingsToggle');
    if (ctxMenuSettingsToggle) {
        ctxMenuSettingsToggle.checked = enabled;
    }
    
    // 스위치를 끄는 순간 (기본 메뉴를 쓰고 싶을 때)
    if (!enabled) {
        // 1. 메뉴 닫기
        hideContextMenu();
        
        // 2. ★ 선택 영역 복구 (사용자가 바로 다시 우클릭할 수 있게)
        if (lastSelectionRange) {
            const sel = window.getSelection();
            sel.removeAllRanges(); // 기존 선택 제거 (혹시 있다면)
            sel.addRange(lastSelectionRange); // 아까 저장한 영역 다시 선택
        }
    }
}

// 컨텍스트 메뉴 설정 가져오기
function getContextMenuEnabled() {
    const saved = localStorage.getItem('contextMenuEnabled');
    return saved === null ? true : saved === 'true'; // 기본값: true
}

// 컨텍스트 메뉴 설정 저장
function setContextMenuEnabled(enabled) {
    localStorage.setItem('contextMenuEnabled', enabled.toString());
}

// 컨텍스트 메뉴 설정 복원
export function restoreContextMenuSetting() {
    const enabled = getContextMenuEnabled();
    const ctxMenuInternalToggle = document.getElementById('ctxMenuInternalToggle');
    const ctxMenuSettingsToggle = document.getElementById('ctxMenuSettingsToggle');
    
    if (ctxMenuInternalToggle) {
        ctxMenuInternalToggle.checked = enabled;
    }
    if (ctxMenuSettingsToggle) {
        ctxMenuSettingsToggle.checked = enabled;
    }
}

// 컨텍스트 메뉴 설정 토글 (설정 패널에서)
export function toggleContextMenuSetting() {
    const toggle = document.getElementById('ctxMenuSettingsToggle');
    if (!toggle) return;
    
    const enabled = toggle.checked;
    setContextMenuEnabled(enabled);
    
    // 메뉴 내부 스위치도 동기화
    const ctxMenuInternalToggle = document.getElementById('ctxMenuInternalToggle');
    if (ctxMenuInternalToggle) {
        ctxMenuInternalToggle.checked = enabled;
    }
}

// 컨텍스트 메뉴 표시
function handleContextMenu(e) {
    const viewerContent = document.getElementById('viewerContent');
    const contextMenu = document.getElementById('contextMenu');
    const selection = window.getSelection();
    
    if (!viewerContent || !contextMenu) return;
    
    // viewerContent 내부에서만 동작
    if (!viewerContent.contains(e.target)) {
        hideContextMenu();
        return;
    }
    
    // 1. 설정이 꺼져있는 경우 (스위치를 끈 직후)
    if (!getContextMenuEnabled()) {
        // [핵심 로직] 이번만 기본 메뉴를 허용하고, 즉시 설정을 다시 켬 (자동 복구)
        setContextMenuEnabled(true);
        restoreContextMenuSetting(); // UI 동기화
        return; // preventDefault()를 호출하지 않아 브라우저 기본 메뉴가 뜸
    }
    
    // 2. 텍스트가 선택된 경우 -> 커스텀 메뉴 표시
    if (selection && selection.toString().trim().length > 0) {
        e.preventDefault(); // 기본 메뉴 차단
        e.stopPropagation();
        
        // ★ 핵심: 현재 선택 영역의 위치 정보를 저장해둠
        if (selection.rangeCount > 0) {
            lastSelectionRange = selection.getRangeAt(0).cloneRange();
        }
        
        const selectedText = selection.toString().trim(); // 선택 텍스트 저장
        contextMenu.dataset.selectedText = selectedText;
        
        // 메뉴 위치 계산 (화면 밖으로 나가지 않게)
        let x = e.clientX;
        let y = e.clientY;
        const menuWidth = 200;
        const menuHeight = 180; // 스위치 영역 포함 높이 고려
        
        if (x + menuWidth > window.innerWidth) x -= menuWidth;
        if (y + menuHeight > window.innerHeight) y -= menuHeight;
        
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.classList.remove('hidden');
        
        // 메뉴 표시 시 내부 스위치 UI도 '켜짐' 상태로 시각적 동기화
        const ctxToggle = document.getElementById('ctxMenuInternalToggle');
        if (ctxToggle) ctxToggle.checked = true;
    } 
    // 3. 선택된 텍스트가 없는 경우 -> 메뉴 숨김
    else {
        hideContextMenu();
    }
}

// 컨텍스트 메뉴 숨김
function hideContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
        contextMenu.classList.add('hidden');
    }
}

// 북마크 추가 (컨텍스트 메뉴에서)
function handleBookmarkFromContext(e) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:239',message:'handleBookmarkFromContext 호출',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    e.stopPropagation();
    const contextMenu = document.getElementById('contextMenu');
    const selectedText = contextMenu?.dataset.selectedText || '';
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:245',message:'선택된 텍스트 확인',data:{selectedTextLength:selectedText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // 1. 뷰어에 내용이 있는지 확인
    const viewer = document.getElementById('viewerContent');
    const contentText = viewer ? viewer.innerText.trim() : '';
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:250',message:'본문 내용 확인',data:{contentTextLength:contentText.length,viewerExists:!!viewer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (contentText.length === 0) {
        alert("저장할 본문 내용이 없습니다.");
        hideContextMenu();
        return;
    }
    
    // 2. 파일명이 없다면 강제 생성 (로컬 파일 오류 방지)
    let currentFileName = getCurrentFileName();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:257',message:'파일 정보 확인',data:{currentFileKey:currentFileKey,currentFileName:currentFileName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    if (!currentFileKey || currentFileName === '알 수 없는 파일') {
        // 현재 날짜로 임시 파일명 생성
        const now = new Date();
        const tempFileName = `Local_File_${now.getHours()}${now.getMinutes()}${now.getSeconds()}.txt`;
        console.log("임시 파일명 할당:", tempFileName);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:264',message:'임시 파일명 생성',data:{tempFileName:tempFileName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        // 임시 fileKey 생성
        currentFileKey = `local_${tempFileName}_${contentText.length}`;
        currentFileName = tempFileName;
        
        // 임시 파일 정보를 files 배열에 추가
        if (!files) files = [];
        if (files.length === 0) {
            files.push({
                name: tempFileName,
                size: contentText.length,
                lastModified: Date.now(),
                content: contentText
            });
            currentFileIndex = 0;
        }
        
        // 히스토리에도 강제 추가
        addToHistory(tempFileName, currentFileKey, contentText);
    }

    // 3. 북마크 데이터 생성 (기존 로직 유지)
    const bookmarkTitle = selectedText 
        ? (selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText)
        : `읽던 위치 (${new Date().toLocaleTimeString()})`;

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;

    const newBookmark = {
        fileKey: currentFileKey,
        fileName: currentFileName,
        preview: bookmarkTitle,
        position: scrollPercent,
        yOffset: window.scrollY,
        timestamp: Date.now(),
        type: 'bookmark'
    };

    // 4. 저장 및 UI 갱신
    const bookmarks = getBookmarks();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:310',message:'북마크 저장 전 상태',data:{currentFileKey:currentFileKey,bookmarksKeys:Object.keys(bookmarks).length,newBookmark:newBookmark},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    if (!bookmarks[currentFileKey]) {
        bookmarks[currentFileKey] = [];
    }
    bookmarks[currentFileKey].push(newBookmark);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:318',message:'북마크 배열에 추가 완료',data:{bookmarksCount:bookmarks[currentFileKey].length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    setBookmarks(bookmarks);
    displayUploadBookmarks();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:323',message:'북마크 저장 및 UI 갱신 완료',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    // 5. 패널 열기 (설정창 닫고 목록 보이기)
    const settingsPanel = document.getElementById('settingsPanel');
    const mainGrid = document.getElementById('uploadSectionContent');
    const panelContainer = document.getElementById('uploadAreaContainer');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:365',message:'패널 상태 확인',data:{settingsPanelExists:!!settingsPanel,mainGridExists:!!mainGrid,panelContainerExists:!!panelContainer,settingsPanelHidden:settingsPanel?.classList.contains('hidden'),mainGridHidden:mainGrid?.classList.contains('hidden'),panelContainerHidden:panelContainer?.classList.contains('-translate-y-full')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion

    if (settingsPanel) settingsPanel.classList.add('hidden');
    if (mainGrid) mainGrid.classList.remove('hidden');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:373',message:'패널 상태 변경 후',data:{settingsPanelHidden:settingsPanel?.classList.contains('hidden'),mainGridHidden:mainGrid?.classList.contains('hidden')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion

    if (panelContainer && panelContainer.classList.contains('-translate-y-full')) {
        panelContainer.classList.remove('-translate-y-full');
        panelContainer.classList.add('translate-y-0');
        
        // 버튼 텍스트/아이콘 동기화
        const btnText = document.getElementById('uploadToggleText');
        const btnIcon = document.getElementById('uploadToggleIcon');
        if (btnText) btnText.textContent = '패널 접기';
        if (btnIcon) btnIcon.textContent = '▲';
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:384',message:'패널 열기 완료',data:{panelContainerHidden:panelContainer.classList.contains('-translate-y-full'),panelContainerVisible:panelContainer.classList.contains('translate-y-0')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
    } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:390',message:'패널이 이미 열려있음',data:{panelContainerHidden:panelContainer?.classList.contains('-translate-y-full'),panelContainerVisible:panelContainer?.classList.contains('translate-y-0')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
    }
    
    // 메뉴 닫기
    hideContextMenu();
}

// 각주/메모 달기 (컨텍스트 메뉴에서)
function handleNoteFromContext(e) {
    e.stopPropagation();
    const contextMenu = document.getElementById('contextMenu');
    const selectedText = contextMenu?.dataset.selectedText;
    
    if (!selectedText) {
        alert('선택된 텍스트가 없습니다.');
        hideContextMenu();
        return;
    }
    
    // 간단한 메모 입력 다이얼로그
    const note = prompt(`선택한 텍스트에 메모를 추가하세요:\n\n"${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"\n\n메모:`, '');
    
    if (note !== null && note.trim()) {
        // TODO: 메모 저장 기능 구현
        alert(`메모가 추가되었습니다: "${note}"`);
    }
    
    hideContextMenu();
}

// 텍스트 공유 (컨텍스트 메뉴에서)
function handleShareFromContext(e) {
    e.stopPropagation();
    const contextMenu = document.getElementById('contextMenu');
    const selectedText = contextMenu?.dataset.selectedText;
    
    if (!selectedText) {
        alert('선택된 텍스트가 없습니다.');
        hideContextMenu();
        return;
    }
    
    // 클립보드에 복사
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(selectedText).then(() => {
            alert('텍스트가 클립보드에 복사되었습니다.');
        }).catch(() => {
            // 폴백: 수동 복사
            const textarea = document.createElement('textarea');
            textarea.value = selectedText;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('텍스트가 클립보드에 복사되었습니다.');
        });
    } else {
        // 폴백: 수동 복사
        const textarea = document.createElement('textarea');
        textarea.value = selectedText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('텍스트가 클립보드에 복사되었습니다.');
    }
    
    hideContextMenu();
}

function updateProgressBar() {
    const progressBar = document.getElementById('reading-progress-bar');
    const container = document.getElementById('reading-progress-container');
    
    if (!progressBar || !container) return;

    // Window 기준 스크롤 정보
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    
    // 컨테이너 표시
    container.classList.remove('hidden');
    container.style.display = 'block';
    
    // 진행률 계산
    let progress = 0;
    if (scrollHeight > clientHeight) {
        progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        progress = Math.max(0, Math.min(100, progress));
    }
    
    progressBar.style.width = `${progress}%`;
}

function handleScroll() {
    if (!currentFileKey) return;
    
    updateProgressBar();
    
    // 읽기 위치 저장 (디바운스)
    if (scrollSaveTimer) clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        
        let progress = 0;
        if (scrollHeight > clientHeight) {
            progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        }
        saveReadingProgress(currentFileKey, progress);
    }, 500);
}

function restoreReadingPosition() {
    if (!currentFileKey) return;
    
    const savedPosition = loadReadingProgress(currentFileKey);
    
    if (savedPosition !== null) {
        setTimeout(() => {
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;
            
            if (scrollHeight > clientHeight) {
                const scrollTop = (savedPosition / 100) * (scrollHeight - clientHeight);
                window.scrollTo({ top: scrollTop, behavior: 'auto' });
            }
            updateProgressBar();
        }, 150);
    }
}

// ==========================================
// [기존 기능 복구] 파일 처리 및 UI 렌더링
// ==========================================

export function getFiles() { return files; }
export function setFiles(newFiles) { files = newFiles; }
export function getCurrentFileIndex() { return currentFileIndex; }
export function setCurrentFileIndex(index) { currentFileIndex = index; }

export function displayUploadHistory() {
    const historyList = document.getElementById('uploadHistoryList');
    const emptyState = document.getElementById('uploadHistoryEmpty');
    if (!historyList) return;

    const history = getHistory();
    historyList.innerHTML = ''; // 초기화

    // [확실한 정렬] 날짜 문자열 비교하여 내림차순 정렬
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (history.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    history.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors leading-tight theme-item-bg group';
        
        // 왼쪽 영역: 파일 정보 (클릭 시 파일 열기)
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex items-center gap-2 overflow-hidden flex-1 pr-2';
        infoDiv.onclick = () => {
            // 히스토리 항목 클릭 시 로직
            if (item.fileKey.startsWith('gdrive_')) {
                 // Google Drive 파일
                 if (window.loadLastReadGoogleDriveFile) {
                     window.loadLastReadGoogleDriveFile(item.fileKey.replace('gdrive_', ''));
                 }
            } else {
                // 로컬 파일 (재선택 필요 안내)
                alert('로컬 파일은 보안상 자동으로 다시 열 수 없습니다.\n파일 열기 버튼으로 다시 선택해주세요.');
            }
        };
        infoDiv.innerHTML = `
            <span class="text-lg">${item.name.endsWith('.md') ? '📝' : '📄'}</span>
            <div class="flex flex-col overflow-hidden leading-tight">
                <span class="font-medium truncate text-sm theme-text-body">${item.name}</span>
                <span class="text-[10px] theme-text-body opacity-70">${formatTimestamp(item.timestamp)}</span>
            </div>
        `;
        
        // 오른쪽 영역: 삭제 버튼
        const delBtn = document.createElement('button');
        delBtn.className = 'p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 flex-shrink-0';
        delBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        `;
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`"${item.name}" 항목을 삭제하시겠습니까?`)) {
                const history = getHistory();
                history.splice(index, 1);
                setHistory(history);
                displayUploadHistory();
            }
        };
        
        div.appendChild(infoDiv);
        div.appendChild(delBtn);
        historyList.appendChild(div);
    });
}

export function displayUploadBookmarks() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:571',message:'displayUploadBookmarks 호출',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    const bookmarksList = document.getElementById('uploadBookmarksList');
    const emptyState = document.getElementById('uploadBookmarksEmpty');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:576',message:'요소 존재 확인',data:{bookmarksListExists:!!bookmarksList,emptyStateExists:!!emptyState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    if (!bookmarksList) return;

    const bookmarks = getBookmarks();
    
    // 현재 열린 파일의 북마크만 가져오기
    const currentBookmarks = currentFileKey && bookmarks[currentFileKey] ? bookmarks[currentFileKey] : [];
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:727',message:'북마크 데이터 확인',data:{currentFileKey:currentFileKey,currentBookmarksCount:currentBookmarks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    
    bookmarksList.innerHTML = '';

    if (!currentFileKey || currentBookmarks.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';

    // 현재 파일의 북마크를 최신순 정렬 (timestamp 내림차순)
    const sortedBookmarks = [...currentBookmarks].sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA; // 내림차순 (최신이 위로)
    });
    
    // 정렬된 북마크를 화면에 표시
    sortedBookmarks.forEach((bm, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors leading-tight theme-item-bg group';
        
        // 왼쪽 영역: 북마크 정보 (클릭 시 해당 위치로 이동)
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex flex-col overflow-hidden flex-1 pr-2';
        infoDiv.innerHTML = `
            <div class="font-medium text-sm truncate leading-tight theme-text-body">🔖 ${bm.fileName || '알 수 없는 파일'}</div>
            <div class="text-[10px] theme-text-body opacity-70 leading-tight">위치: ${bm.position.toFixed(1)}%</div>
        `;
        // 북마크 클릭 기능: 해당 위치로 스크롤 이동
        infoDiv.onclick = () => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:771',message:'북마크 클릭 - 위치 이동',data:{position:bm.position,yOffset:bm.yOffset},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
            // #endregion
            
            // 북마크 위치로 스크롤
            if (bm.yOffset !== undefined) {
                window.scrollTo({ top: bm.yOffset, behavior: 'smooth' });
            } else if (bm.position !== undefined) {
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollTop = (bm.position / 100) * docHeight;
                window.scrollTo({ top: scrollTop, behavior: 'smooth' });
            }
        };
        
        // 오른쪽 영역: 삭제 버튼
        const delBtn = document.createElement('button');
        delBtn.className = 'p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 flex-shrink-0';
        delBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        `;
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`"${bm.fileName || '알 수 없는 파일'}" 북마크를 삭제하시겠습니까?`)) {
                const bookmarks = getBookmarks();
                
                if (bookmarks[currentFileKey]) {
                    // 원본 배열에서 정확한 북마크 찾기 (timestamp, position, fileName으로 식별)
                    const bookmarkIndex = bookmarks[currentFileKey].findIndex(b => 
                        b.timestamp === bm.timestamp && 
                        b.position === bm.position &&
                        b.fileName === bm.fileName
                    );
                    
                    if (bookmarkIndex !== -1) {
                        bookmarks[currentFileKey].splice(bookmarkIndex, 1);
                        
                        // 빈 배열이면 파일 키 제거
                        if (bookmarks[currentFileKey].length === 0) {
                            delete bookmarks[currentFileKey];
                        }
                        
                        setBookmarks(bookmarks);
                        displayUploadBookmarks();
                    }
                }
            }
        };
        
        div.appendChild(infoDiv);
        div.appendChild(delBtn);
        bookmarksList.appendChild(div);
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:797',message:'북마크 렌더링 완료',data:{currentFileKey:currentFileKey,totalBookmarks:sortedBookmarks.length,renderedCount:bookmarksList.children.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
}

export async function processFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    
    files = Array.from(fileList);
    currentFileIndex = 0;
    
    const uploadSection = document.getElementById('page-upload');
    const mainContent = document.getElementById('mainContent');
    
    if (uploadSection && mainContent) {
        // 업로드 섹션 접기 (UI 로직)
        const uploadContent = document.getElementById('uploadSectionContent');
        if (uploadContent && !uploadContent.classList.contains('hidden')) {
            toggleUploadSection(); 
        }
        mainContent.classList.remove('hidden');
    }
    
    displayFileContent(files[0]);
}

export async function processFilesWithResume(fileList) {
    await processFiles(fileList);
}

// [추가/수정] 히스토리 추가 함수
function addToHistory(fileName, fileKey, content) {
    const history = getHistory();
    
    // 이미 존재하는 파일인지 확인 (fileKey 기준)
    const existingIndex = history.findIndex(item => item.fileKey === fileKey);
    
    if (existingIndex !== -1) {
        // 이미 있으면 배열에서 제거 (맨 위로 다시 넣기 위해)
        history.splice(existingIndex, 1);
    }
    
    // 새 항목 생성 (항상 현재 시간으로 갱신)
    const newItem = {
        name: fileName,
        fileKey: fileKey,
        timestamp: Date.now(), // ★ 시간 갱신
        preview: content ? content.substring(0, 100) : '' // 미리보기용
    };
    
    // 배열 맨 앞에 추가 (unshift)
    history.unshift(newItem);
    
    // 최대 50개까지만 유지
    if (history.length > 50) {
        history.splice(50);
    }
    
    // 로컬 스토리지 저장 및 목록 갱신
    setHistory(history);
    displayUploadHistory();
}

export function displayFileContent(file) {
    if (!file) return;

    const viewerContent = document.getElementById('viewerContent');
    const fileNameEl = document.getElementById('currentFileName');
    const fileInfoEl = document.getElementById('fileInfo');

    // 1. 전역 변수에 파일명 즉시 할당 (가장 중요)
    // 파일명은 file.name으로 직접 접근 가능하므로 별도 변수 불필요
    // 대신 currentFileKey를 설정하여 파일 식별

    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileInfoEl) fileInfoEl.textContent = `${formatFileSize(file.size)} | ${formatTimestamp(file.lastModified)}`;

    // 현재 파일 키 생성 및 저장
    currentFileKey = generateFileKey(file);
    saveLastReadFile(file, currentFileKey);

    // 파일 내용 읽기 및 표시
    let fileContent = '';
    if (typeof file.content === 'string') {
        fileContent = file.content;
        
        // 메타데이터 파싱 및 제거
        const { content: cleanContent, metadata } = parseAndRemoveMetadata(fileContent);
        
        // 메타데이터에서 북마크 복원
        if (metadata) {
            restoreBookmarksFromMetadata(metadata);
        }
        
        renderContent(cleanContent, file.name);
        fileContent = cleanContent; // 히스토리에는 메타데이터 제거된 내용 저장
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            const rawContent = e.target.result;
            
            // 1. 메타데이터 추출
            const { content: cleanContent, metadata } = parseAndRemoveMetadata(rawContent);
            
            // 2. 뷰어에는 '메타데이터가 제거된' 순수 본문만 표시
            renderContent(cleanContent, file.name);
            
            // 3. 파일 키는 이미 displayFileContent 시작 부분에서 설정됨 (currentFileKey)
            // currentFileKey는 generateFileKey(file)로 이미 설정되어 있음
            
            // 4. ★ 북마크 복원 로직
            if (metadata && metadata.bookmarks && Array.isArray(metadata.bookmarks)) {
                // restoreBookmarksFromMetadata 함수가 이미 구현되어 있으므로 사용
                // 이 함수는 currentFileKey를 사용하여 북마크를 복원함
                restoreBookmarksFromMetadata(metadata);
            }
            
            // 5. 히스토리 추가 및 시간 갱신 (메타데이터 제거된 순수 content만 저장)
            addToHistory(file.name, currentFileKey, cleanContent);
        };
        reader.readAsText(file);
        // 비동기 읽기이므로 여기서는 히스토리 추가 안 함
        return; // reader.onload에서 처리
    }
    
    // 3. 히스토리 저장 및 시간 갱신 (동기 읽기인 경우, 메타데이터 제거된 내용)
    addToHistory(file.name, currentFileKey, fileContent);
}

function renderContent(content, fileName) {
    const viewerContent = document.getElementById('viewerContent');
    
    // 마크다운 변환 또는 텍스트 표시
    if (fileName.toLowerCase().endsWith('.md') && typeof marked !== 'undefined') {
        viewerContent.innerHTML = marked.parse(content);
        viewerContent.classList.add('markdown-mode');
    } else {
        viewerContent.textContent = content;
        viewerContent.classList.remove('markdown-mode');
        // 줄바꿈 처리
        viewerContent.style.whiteSpace = 'pre-wrap';
    }

    // 스크롤 리스너 설정 및 위치 복원
    setupScrollListener();
    restoreReadingPosition();
    
    // 컨텍스트 메뉴 리스너 설정
    setupContextMenuListener();
    
    // 프로그래스바 강제 업데이트
    setTimeout(updateProgressBar, 100);
}

// [수정 5] 북마크 토글 (에러 해결됨)
export function toggleBookmark() {
    if (!currentFileKey) {
        alert('파일을 먼저 열어주세요.');
        return;
    }
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    
    let progress = 0;
    if (scrollHeight > clientHeight) {
        progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    }
    
    const currentFile = files[currentFileIndex];
    if (getBookmarksByFileKey(currentFileKey).some(b => Math.abs(b.position - progress) < 0.1)) {
        alert('이미 북마크가 존재합니다.');
    } else {
        const bookmarks = getBookmarks();
        if (!bookmarks[currentFileKey]) bookmarks[currentFileKey] = [];
        bookmarks[currentFileKey].push({
            fileKey: currentFileKey,
            fileName: currentFile.name,
            position: progress,
            timestamp: Date.now()
        });
        setBookmarks(bookmarks);
        displayUploadBookmarks();
        alert('북마크가 추가되었습니다.');
    }
}

// 기타 UI 토글 함수들 (main.js에서 호출됨)
export function toggleUploadSection() {
    const container = document.getElementById('uploadAreaContainer');
    const btnText = document.getElementById('uploadToggleText');
    const icon = document.getElementById('uploadToggleIcon');
    
    if (!container) return;
    
    // 드로어 상태 확인: translate-y-0이면 보임, -translate-y-full이면 숨김
    const isVisible = container.classList.contains('translate-y-0');
    
    if (isVisible) {
        // 패널 숨기기: 위로 슬라이드
        container.classList.remove('translate-y-0');
        container.classList.add('-translate-y-full');
        btnText.textContent = '패널 펼치기';
        icon.textContent = '▼';
    } else {
        // 패널 보이기: 아래로 슬라이드
        container.classList.remove('-translate-y-full');
        container.classList.add('translate-y-0');
        btnText.textContent = '패널 접기';
        icon.textContent = '▲';
    }
}

export function toggleHistorySection() {
    const content = document.getElementById('historySectionContent');
    if (content) content.classList.toggle('hidden');
}

export function toggleBookmarksSection() {
    const content = document.getElementById('bookmarksSectionContent');
    if (content) content.classList.toggle('hidden');
}

export function toggleWrapMode() {
    const viewer = document.getElementById('viewerContent');
    const btn = document.getElementById('wrapModeBtn');
    
    if (viewer.classList.contains('whitespace-pre')) {
        viewer.classList.remove('whitespace-pre');
        viewer.classList.add('whitespace-pre-wrap');
        btn.textContent = '줄바꿈: 자동';
        localStorage.setItem('wrapMode', 'auto');
    } else {
        viewer.classList.remove('whitespace-pre-wrap');
        viewer.classList.add('whitespace-pre');
        btn.textContent = '줄바꿈: 원본';
        localStorage.setItem('wrapMode', 'original');
    }
}

export function showLocalFileResumeMessage(fileName) {
    // 로컬 파일 재열기 안내 (간소화)
    console.log(`마지막 읽은 파일: ${fileName} (다시 선택 필요)`);
}

export function selectFiles() {
    document.getElementById('file-input').click();
}

// 본문 스타일 업데이트 함수
// 마크다운 헤더 스타일 업데이트 함수 (동적 스타일 태그 주입 방식)
export function updateMarkdownStyles() {
    const fontSelect = document.getElementById('markdownHeadingFont');
    const headingSizeSlider = document.getElementById('headingSizeSlider');
    const headingSizeValue = document.getElementById('headingSizeValue');
    const headingColor = document.getElementById('headingColor');
    const tocColor = document.getElementById('tocColor');
    
    if (!fontSelect) return;

    const selectedFont = fontSelect.value;
    const headingSize = headingSizeSlider ? parseFloat(headingSizeSlider.value) || 1.0 : 1.0;
    const headingColorValue = headingColor ? headingColor.value : '#2563eb';
    const tocColorValue = tocColor ? tocColor.value : '#2563eb';
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:1090',message:'updateMarkdownStyles 호출',data:{selectedFont:selectedFont,headingSize:headingSize,headingColorValue:headingColorValue,tocColorValue:tocColorValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // 1. 동적 스타일 태그 찾기 (없으면 생성)
    let styleTag = document.getElementById('dynamicHeadingStyle');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamicHeadingStyle';
        document.head.appendChild(styleTag);
    }

    // 2. CSS 규칙 주입
    if (selectedFont === 'inherit') {
        // '본문과 동일' 선택 시 폰트는 제거하되, 크기와 색상은 유지
        styleTag.innerHTML = `
            #viewerContent h1, #viewerContent h2, #viewerContent h3, 
            #viewerContent h4, #viewerContent h5, #viewerContent h6 {
                font-size: calc(1em * ${headingSize}) !important;
                color: ${headingColorValue} !important;
            }
            #viewerContent .toc a {
                color: ${tocColorValue} !important;
            }
        `;
    } else {
        // 선택된 폰트를 !important로 강제 적용
        styleTag.innerHTML = `
            #viewerContent h1, #viewerContent h2, #viewerContent h3, 
            #viewerContent h4, #viewerContent h5, #viewerContent h6 {
                font-family: ${selectedFont} !important;
                font-size: calc(1em * ${headingSize}) !important;
                color: ${headingColorValue} !important;
            }
            #viewerContent .toc a {
                color: ${tocColorValue} !important;
            }
        `;
    }
    
    // 슬라이더 값 표시 업데이트
    if (headingSizeValue) {
        headingSizeValue.textContent = `${headingSize.toFixed(1)}x`;
    }
    
    // localStorage에 저장
    try {
        localStorage.setItem('markdownHeadingFont', selectedFont);
        localStorage.setItem('markdownHeadingSize', headingSize.toString());
        localStorage.setItem('markdownHeadingColor', headingColorValue);
        localStorage.setItem('markdownTocColor', tocColorValue);
    } catch (e) {
        console.error('마크다운 스타일 저장 실패:', e);
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:1130',message:'updateMarkdownStyles 완료',data:{styleTagExists:!!styleTag,styleTagContent:styleTag.innerHTML.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
}

// 본문 스타일 업데이트 함수
export function updateBodyStyles() {
    const viewerContent = document.getElementById('viewerContent');
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    const lineHeightValue = document.getElementById('lineHeightValue');
    const bodyFontFamily = document.getElementById('bodyFontFamily');
    const bodyTextColor = document.getElementById('bodyTextColor');
    
        // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:359',message:'updateBodyStyles 호출',data:{viewerContentExists:!!viewerContent,lineHeightSliderExists:!!lineHeightSlider,lineHeightValue:lineHeightSlider?.value,bodyFontFamilyExists:!!bodyFontFamily,bodyTextColorExists:!!bodyTextColor},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
        // #endregion
    
    if (!viewerContent) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:365',message:'viewerContent를 찾지 못함',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return;
    }
    
    // 줄간격 설정
    if (lineHeightSlider) {
        const lineHeight = parseFloat(lineHeightSlider.value);
        viewerContent.style.setProperty('--user-line-height', lineHeight.toString(), 'important');
        
        if (lineHeightValue) {
            lineHeightValue.textContent = lineHeight.toFixed(1);
        }
        
        // localStorage에 저장
        localStorage.setItem('bodyLineHeight', lineHeight.toString());
        
        // #region agent log
        const computedStyle = window.getComputedStyle(viewerContent);
        const computedLineHeight = computedStyle.getPropertyValue('--user-line-height') || computedStyle.lineHeight;
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:378',message:'줄간격 설정 후',data:{lineHeight,computedLineHeight,computedStyleLineHeight:computedStyle.lineHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
        // #endregion
    }
    
    // 글씨체 설정
    if (bodyFontFamily) {
        const fontFamily = bodyFontFamily.value;
        viewerContent.style.setProperty('font-family', fontFamily, 'important');
        localStorage.setItem('bodyFontFamily', fontFamily);
    }
    
    // 본문 색상 설정
    if (bodyTextColor) {
        const textColor = bodyTextColor.value;
        viewerContent.style.setProperty('color', textColor, 'important');
        localStorage.setItem('bodyTextColor', textColor);
    }
}

// 텍스트 스트로크(외곽선 두께) 업데이트 함수
export function updateTextStroke() {
    const slider = document.getElementById('textStrokeSlider');
    const display = document.getElementById('textStrokeValue');
    const viewer = document.getElementById('viewerContent');

    if (!slider || !viewer) return;

    const val = parseFloat(slider.value);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:1200',message:'updateTextStroke 호출',data:{val:val,sliderExists:!!slider,viewerExists:!!viewer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // 1. 값 표시 업데이트
    if (display) {
        display.innerText = `${val}px`;
    }

    // 2. 뷰어에 스타일 적용
    // -webkit-text-stroke-width: 테두리 두께 설정
    // -webkit-text-stroke-color: 현재 글자색(currentColor)을 따라감 -> 자연스러운 두께 증가 효과
    viewer.style.webkitTextStrokeWidth = `${val}px`;
    viewer.style.webkitTextStrokeColor = 'currentColor';
    
    // localStorage에 저장
    localStorage.setItem('textStrokeWidth', val.toString());
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewer.js:1225',message:'updateTextStroke 완료',data:{val:val,computedStrokeWidth:viewer.style.webkitTextStrokeWidth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
}

// 마크다운 스타일 복원 함수
export function restoreMarkdownStyles() {
    const fontSelect = document.getElementById('markdownHeadingFont');
    const headingSizeSlider = document.getElementById('headingSizeSlider');
    const headingColor = document.getElementById('headingColor');
    const tocColor = document.getElementById('tocColor');
    
    if (!fontSelect) return;
    
    // localStorage에서 값 불러오기
    const savedFont = localStorage.getItem('markdownHeadingFont') || 'inherit';
    const savedSize = parseFloat(localStorage.getItem('markdownHeadingSize')) || 1.0;
    const savedHeadingColor = localStorage.getItem('markdownHeadingColor') || '#2563eb';
    const savedTocColor = localStorage.getItem('markdownTocColor') || '#2563eb';
    
    // UI 복원
    if (fontSelect) {
        fontSelect.value = savedFont;
    }
    if (headingSizeSlider) {
        headingSizeSlider.value = savedSize.toString();
    }
    if (headingColor) {
        headingColor.value = savedHeadingColor;
    }
    if (tocColor) {
        tocColor.value = savedTocColor;
    }
    
    // 스타일 적용
    updateMarkdownStyles();
}

// 본문 스타일 복원 함수
export function restoreBodyStyles() {
    const viewerContent = document.getElementById('viewerContent');
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    const lineHeightValue = document.getElementById('lineHeightValue');
    const bodyFontFamily = document.getElementById('bodyFontFamily');
    const bodyTextColor = document.getElementById('bodyTextColor');
    
    if (!viewerContent) return;
    
    // localStorage에서 값 불러오기
    const savedLineHeight = localStorage.getItem('bodyLineHeight') || '1.8';
    const savedFontFamily = localStorage.getItem('bodyFontFamily') || "'Noto Sans KR', sans-serif";
    const savedTextColor = localStorage.getItem('bodyTextColor') || '#374151';
    
    // 줄간격 복원
    if (lineHeightSlider) {
        lineHeightSlider.value = savedLineHeight;
    }
    if (lineHeightValue) {
        lineHeightValue.textContent = parseFloat(savedLineHeight).toFixed(1);
    }
    viewerContent.style.setProperty('--user-line-height', savedLineHeight, 'important');
    
    // 글씨체 복원
    if (bodyFontFamily) {
        bodyFontFamily.value = savedFontFamily;
    }
    viewerContent.style.setProperty('font-family', savedFontFamily, 'important');
    
    // 본문 색상 복원
    if (bodyTextColor) {
        bodyTextColor.value = savedTextColor;
    }
    viewerContent.style.setProperty('color', savedTextColor, 'important');
    
    // 텍스트 스트로크 복원
    const textStrokeSlider = document.getElementById('textStrokeSlider');
    const textStrokeValue = document.getElementById('textStrokeValue');
    if (textStrokeSlider) {
        const savedStrokeWidth = localStorage.getItem('textStrokeWidth') || '0';
        textStrokeSlider.value = savedStrokeWidth;
        // 값 표시 업데이트
        if (textStrokeValue) {
            textStrokeValue.innerText = `${savedStrokeWidth}px`;
        }
        // 스타일 적용
        const strokeWidth = parseFloat(savedStrokeWidth);
        viewerContent.style.webkitTextStrokeWidth = `${strokeWidth}px`;
        viewerContent.style.webkitTextStrokeColor = 'currentColor';
    }
}

// 모든 설정 초기화 함수
export function resetAllSettings() {
    // 확인 다이얼로그
    const confirmMessage = '모든 설정을 초기화하시겠습니까?\n\n초기화되는 항목:\n- 뷰어 스타일 (폰트, 줄간격, 색상)\n- 레이아웃 설정 (너비, 꽉 찬 화면)\n- 테마 설정\n- 마크다운 스타일\n\n히스토리와 북마크는 유지됩니다.';
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // 뷰어 스타일 설정 초기화
    localStorage.removeItem('bodyLineHeight');
    localStorage.removeItem('bodyFontFamily');
    localStorage.removeItem('bodyTextColor');
    localStorage.removeItem('textStrokeWidth');
    localStorage.removeItem('readerFontSize');
    
    // 레이아웃 설정 초기화
    localStorage.removeItem('viewerWidth');
    localStorage.removeItem('fullWidthMode');
    
    // 테마 설정 초기화
    localStorage.removeItem('readerTheme');
    localStorage.removeItem('customTheme');
    
    // 마크다운 스타일 초기화 (저장 키 확인 필요)
    // localStorage.removeItem('markdownHeadingFont');
    // localStorage.removeItem('headingSize');
    // localStorage.removeItem('headingColor');
    // localStorage.removeItem('tocColor');
    
    // 줄바꿈 모드 초기화
    localStorage.removeItem('wrapMode');
    
    // UI 업데이트를 위해 페이지 새로고침
    if (confirm('설정이 초기화되었습니다. 페이지를 새로고침하시겠습니까?')) {
        window.location.reload();
    } else {
        // 수동으로 설정 복원
        restoreBodyStyles();
        restoreViewerWidth();
        
        // 테마 복원 (전역 함수 사용)
        if (typeof window.setTheme === 'function') {
            window.setTheme('light');
        }
        
        // 폰트 크기 복원 (전역 함수 사용)
        if (typeof window.setFontSize === 'function') {
            window.setFontSize(16);
        }
        
        // 줄바꿈 모드 복원
    const viewer = document.getElementById('viewerContent');
        if (viewer) {
            viewer.classList.remove('whitespace-pre');
            viewer.classList.add('whitespace-pre-wrap');
        }
        const wrapBtn = document.getElementById('wrapModeBtn');
        if (wrapBtn) {
            wrapBtn.textContent = '줄바꿈: 자동';
        }
    }
}

// 뷰어 너비 조절 함수 (슬라이더)
export function updateViewerWidth() {
    const slider = document.getElementById('viewerWidthSlider');
    const widthValueDisplay = document.getElementById('viewerWidthValue');
    const container = document.getElementById('mainTextContainer'); // 타겟 컨테이너
    const isFullWidth = document.getElementById('fullWidthToggle')?.checked;

    if (!slider || !container) return;

    // 현재 값 표시 업데이트
    if (widthValueDisplay) {
        widthValueDisplay.innerText = `${slider.value}px`;
    }

    // 꽉 찬 화면이 아닐 때만 슬라이더 값 적용
    if (!isFullWidth) {
        const newWidth = `${slider.value}px`;
        // !important로 강제 적용하고, viewerContent의 max-width도 제거
        container.style.setProperty('max-width', newWidth, 'important');
        container.style.setProperty('width', 'auto', 'important');
        
        // viewerContent의 max-width 제한도 제거
        const viewerContent = document.getElementById('viewerContent');
        if (viewerContent) {
            viewerContent.style.setProperty('max-width', '100%', 'important');
        }
        
        // localStorage에 저장
        localStorage.setItem('viewerWidth', slider.value);
    }
}

// 꽉 찬 화면 토글 함수 (체크박스)
export function toggleFullWidth() {
    const toggle = document.getElementById('fullWidthToggle');
    const container = document.getElementById('mainTextContainer');
    const slider = document.getElementById('viewerWidthSlider');

    if (!toggle || !container) return;

    if (toggle.checked) {
        // 꽉 찬 화면: 최대 너비를 100%로 설정하고 좌우 패딩을 약간 유지
        container.style.setProperty('max-width', '100%', 'important');
        container.style.setProperty('width', '100%', 'important');
        if (slider) slider.disabled = true; // 슬라이더 비활성화
        
        // viewerContent의 max-width 제한도 제거
        const viewerContent = document.getElementById('viewerContent');
        if (viewerContent) {
            viewerContent.style.setProperty('max-width', '100%', 'important');
        }
        
        localStorage.setItem('fullWidthMode', 'true');
    } else {
        // 해제 시: 슬라이더 값으로 복귀
        if (slider) {
            const newWidth = `${slider.value}px`;
            container.style.setProperty('max-width', newWidth, 'important');
            container.style.setProperty('width', 'auto', 'important');
            slider.disabled = false; // 슬라이더 활성화
            
            // viewerContent의 max-width 제한도 제거
            const viewerContent = document.getElementById('viewerContent');
            if (viewerContent) {
                viewerContent.style.setProperty('max-width', '100%', 'important');
            }
        } else {
            container.style.setProperty('max-width', '896px', 'important'); // 기본값 (max-w-4xl)
        }
        localStorage.setItem('fullWidthMode', 'false');
    }
}

export function restoreViewerWidth() {
    const container = document.getElementById('mainTextContainer');
    const slider = document.getElementById('viewerWidthSlider');
    const widthValueDisplay = document.getElementById('viewerWidthValue');
    const toggle = document.getElementById('fullWidthToggle');
    
    if (!container) return;
    
    // localStorage에서 저장된 값 불러오기
    const savedWidth = localStorage.getItem('viewerWidth') || '1400';
    const fullWidthMode = localStorage.getItem('fullWidthMode') === 'true';
    
    // 슬라이더 값 복원
    if (slider) {
        slider.value = savedWidth;
    }
    if (widthValueDisplay) {
        widthValueDisplay.innerText = `${savedWidth}px`;
    }
    
    // 꽉 찬 화면 모드 복원
    if (toggle) {
        toggle.checked = fullWidthMode;
    }
    
    // 초기 너비 적용
    if (fullWidthMode) {
        container.style.maxWidth = '100%';
        if (slider) slider.disabled = true;
    } else {
        container.style.maxWidth = `${savedWidth}px`;
        if (slider) slider.disabled = false;
    }
}
export function toggleFavorite() { alert('즐겨찾기 기능은 준비 중입니다.'); }
export function toggleSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    const mainGridContent = document.getElementById('uploadSectionContent'); // 파일, 히스토리, 북마크가 있는 그리드 영역

    if (!settingsPanel || !mainGridContent) return;

    // 현재 설정창이 숨겨져 있는지 확인
    const isClosed = settingsPanel.classList.contains('hidden');

    if (isClosed) {
        // [설정 열기 모드]
        // 1. 설정창 표시
        settingsPanel.classList.remove('hidden');
        // 2. 메인 그리드 숨김 (깔끔한 전환을 위해)
        mainGridContent.classList.add('hidden');
    } else {
        // [설정 닫기 모드]
        // 1. 설정창 숨김
        settingsPanel.classList.add('hidden');
        // 2. 메인 그리드 다시 표시
        mainGridContent.classList.remove('hidden');
    }
}
export async function handleAIClean() {
    const files = getFiles();
    const currentFileIndex = getCurrentFileIndex();

    if (!files || !files[currentFileIndex]) {
        alert('변환할 파일이 없습니다.');
        return;
    }

    const btn = document.getElementById('aiCleanBtn');
    const originalText = btn.innerText;
    
    // 로딩 UI 시작
    btn.innerText = "⏳ 변환 중...";
    btn.disabled = true;
    document.body.style.cursor = 'wait';

    try {
        // 1. AI 변환 요청
        let cleanedText = await cleanTextWithAI(files[currentFileIndex].content);
        
        if (!cleanedText) throw new Error("변환된 내용이 비어있습니다.");

        // 2. [핵심] 강력한 코드 블록 제거 로직
        // 정규식: 백틱 3개로 감싸진 내용을 찾음 (markdown 언어 지정 여부 상관없음)
        // [\s\S]*? : 줄바꿈을 포함한 모든 문자
        const codeBlockMatch = cleanedText.match(/```(?:markdown)?\s*([\s\S]*?)\s*```/i);
        
        if (codeBlockMatch) {
            // 매칭된 경우: 코드 블록 내부의 알맹이만 추출
            cleanedText = codeBlockMatch[1].trim();
        } else {
            // 매칭되지 않은 경우 (혹은 닫는 백틱이 없는 경우):
            // 시작 부분에 백틱이 있다면 첫 줄을 강제로 제거
            if (cleanedText.trim().startsWith('```')) {
                cleanedText = cleanedText.replace(/^```[^\n]*\n?/, '').trim();
                // 끝 부분에 백틱이 있다면 제거
                cleanedText = cleanedText.replace(/```\s*$/, '').trim();
            }
        }

        // 3. 뷰어 업데이트 (테마 적용)
        const viewer = document.getElementById('viewerContent');
        
        // 중요: CSS 테마 적용을 위해 white-space 초기화 및 클래스 추가
        viewer.style.whiteSpace = 'normal'; 
        viewer.classList.add('markdown-mode');

        if (typeof marked !== 'undefined') {
            viewer.innerHTML = marked.parse(cleanedText);
        } else {
            viewer.textContent = cleanedText;
        }

        // 스크롤 맨 위로 이동
        window.scrollTo(0, 0);

        // 4. 파일 다운로드 (정제된 텍스트 사용)
        const originalName = files[currentFileIndex].name;
        const newName = originalName.replace(/\.[^/.]+$/, "") + "_cleaned.md";
        
        const blob = new Blob([cleanedText], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = newName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`✅ 변환 완료! '${newName}' 파일이 다운로드되었습니다.`);

    } catch (e) {
        console.error(e);
        alert("❌ AI 변환 실패: " + (e.message || "알 수 없는 오류"));
    } finally {
        // UI 복구
        btn.innerText = originalText;
        btn.disabled = false;
        document.body.style.cursor = 'default';
    }
}
export function downloadAsMarkdown() {
    // 파일이 없거나 currentFileKey가 없으면 종료
    if (!files[currentFileIndex] || !currentFileKey) {
        alert("저장할 파일이 없습니다.");
        return;
    }
    
    const btn = document.getElementById('downloadMdBtn');
    const originalText = btn ? btn.textContent : '💾 MD 저장';
    
    // 버튼 텍스트 변경: 저장 중 표시
    if (btn) {
        btn.textContent = '💾 저장 중...';
    }
    
    // 1. 현재 본문 내용 가져오기 (뷰어에 표시된 내용)
    const viewerContent = document.getElementById('viewerContent');
    let content = '';
    
    if (viewerContent) {
        // 마크다운 모드인 경우 innerHTML에서 텍스트 추출, 아니면 innerText 사용
        if (viewerContent.classList.contains('markdown-mode')) {
            // 마크다운 모드: innerHTML에서 텍스트 추출 (더 정확함)
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = viewerContent.innerHTML;
            content = tempDiv.innerText || tempDiv.textContent || '';
        } else {
            content = viewerContent.innerText || viewerContent.textContent || '';
        }
    }
    
    // 뷰어 내용이 없으면 원본 파일 내용 사용
    if (!content && files[currentFileIndex].content) {
        content = files[currentFileIndex].content;
    }
    
    // 2. 현재 파일의 북마크 데이터 가져오기
    const bookmarks = getBookmarks();
    const currentBookmarks = bookmarks[currentFileKey] || [];
    
    // 3. 메타데이터 생성
    const metadataObj = {
        version: "1.0",
        fileKey: currentFileKey,
        fileName: getCurrentFileName(),
        updatedAt: new Date().toISOString(),
        bookmarks: currentBookmarks.map(bm => ({
            preview: bm.preview,
            position: bm.position,
            yOffset: bm.yOffset,
            timestamp: bm.timestamp,
            type: bm.type
        }))
    };
    
    // 4. 주석 형태로 변환하여 본문 끝에 붙이기
    const metadataJson = JSON.stringify(metadataObj, null, 2);
    const metadataString = `\n\n<!-- EBOOK_VIEWER_METADATA: ${metadataJson} -->`;
    const finalContent = content + metadataString;
    
    // 5. 파일 다운로드 트리거
    const fileName = getCurrentFileName();
    const downloadFileName = fileName.endsWith('.md') ? fileName : fileName.replace(/\.[^/.]+$/, "") + '.md';
    
    const blob = new Blob([finalContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    
    // 뒷정리
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("📝 북마크 정보가 파일에 포함되었습니다.", {
        bookmarksCount: currentBookmarks.length,
        fileName: downloadFileName
    });
    
    // 다운로드 후 버튼 텍스트 복구
    setTimeout(() => {
        if (btn) {
            btn.textContent = originalText;
        }
    }, 500);
}