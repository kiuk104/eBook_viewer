/**
 * 뷰어 모듈 (viewer.js) - 최종 통합본 (모든 기능 복구)
 */

import { formatFileSize, formatTimestamp, generateFileKey, downloadAsMarkdown as downloadMarkdown } from './utils.js';
import { getHistory, setHistory, saveReadingProgress, loadReadingProgress, getBookmarks, getBookmarksByFileKey, setBookmarks, saveLastReadFile, loadLastReadFile } from './settings.js';
import { cleanTextWithAI } from './ai_service.js';

// ==========================================
// [1] 전역 변수 및 초기화
// ==========================================
let files = [];
let currentFileIndex = -1;
let currentFileKey = null;
let scrollSaveTimer = null;
let lastSelectionRange = null; 
let activeHighlightSpan = null; 
let fileHighlights = JSON.parse(localStorage.getItem('ebook_highlights') || '{}');

// ==========================================
// [2] 헬퍼 함수 (반드시 상단 위치)
// ==========================================

// 선택 영역의 절대 오프셋 계산
function getSelectionOffsetRelativeTo(container, selection) {
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    return { start: start, end: start + range.toString().length };
}

// 오프셋으로 Range 복구
function createRangeFromOffset(container, start, end) {
    let charCount = 0;
    const range = document.createRange();
    range.setStart(container, 0);
    range.setEnd(container, 0);
    let startFound = false;
    const nodeIterator = document.createNodeIterator(container, NodeFilter.SHOW_TEXT);
    let currentNode;
    while (currentNode = nodeIterator.nextNode()) {
        const textLength = currentNode.length;
        const nextCharCount = charCount + textLength;
        if (!startFound && start >= charCount && start < nextCharCount) {
            range.setStart(currentNode, start - charCount);
            startFound = true;
        }
        if (startFound && end >= charCount && end <= nextCharCount) {
            range.setEnd(currentNode, end - charCount);
            return range;
        }
        charCount = nextCharCount;
    }
    return null;
}

// ==========================================
// [3] 핵심 기능: 하이라이트
// ==========================================

// 하이라이트 클릭 핸들러
function handleHighlightClick(e) {
    e.stopPropagation();
    e.preventDefault();
    const targetSpan = e.target;
    const highlightId = targetSpan.dataset.highlightId;
    if (!highlightId) return;

    const relatedSpans = document.querySelectorAll(`span[data-highlight-id="${highlightId}"]`);
    activeHighlightSpan = targetSpan; 
    const selectedText = Array.from(relatedSpans).map(s => s.innerText || s.textContent || '').join('');
    
    // 하이라이트된 영역을 자동으로 선택
    const selection = window.getSelection();
    selection.removeAllRanges();
    
    if (relatedSpans.length > 0) {
        const range = document.createRange();
        const firstSpan = relatedSpans[0];
        const lastSpan = relatedSpans[relatedSpans.length - 1];
        
        try {
            range.setStartBefore(firstSpan);
            range.setEndAfter(lastSpan);
            selection.addRange(range);
            lastSelectionRange = range.cloneRange(); // 선택 영역 저장
            console.log('✅ 하이라이트 클릭: 영역 자동 선택됨 (' + selectedText.length + '자)');
        } catch (err) {
            console.error('하이라이트 영역 선택 실패:', err);
        }
    }
    
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
        contextMenu.dataset.selectedText = selectedText;
        toggleMenuMode(true);
        let x = e.clientX;
        let y = e.clientY;
        const w = 200, h = 300;
        if (x + w > window.innerWidth) x -= w;
        if (y + h > window.innerHeight) y -= h;
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.classList.remove('hidden');
    }
}

// 하이라이트 적용
function applyHighlight(color) {
    // 1. 기존 수정
    if (activeHighlightSpan) {
        const highlightId = activeHighlightSpan.dataset.highlightId;
        if (highlightId) {
            document.querySelectorAll(`span[data-highlight-id="${highlightId}"]`).forEach(span => {
                span.style.backgroundColor = color;
                span.dataset.highlightColor = color;
            });
            if (currentFileKey && fileHighlights[currentFileKey]) {
                const data = fileHighlights[currentFileKey].find(h => h.id === highlightId);
                if (data) {
                    data.color = color;
                    localStorage.setItem('ebook_highlights', JSON.stringify(fileHighlights));
                }
            }
        }
        hideContextMenu();
        return;
    }

    // 2. 신규 생성
    if (!lastSelectionRange) {
        console.error('❌ lastSelectionRange가 null입니다.');
        alert("선택된 영역이 없습니다.\n\n텍스트를 먼저 선택한 후 우클릭하여 하이라이트 색상을 선택해주세요.");
        return;
    }
    
    // lastSelectionRange의 내용 확인
    const selectionText = lastSelectionRange.toString().trim();
    if (!selectionText || selectionText.length === 0) {
        console.error('❌ lastSelectionRange에 텍스트가 없습니다.');
        alert("선택된 텍스트가 없습니다.\n\n텍스트를 먼저 선택한 후 우클릭하여 하이라이트 색상을 선택해주세요.");
        lastSelectionRange = null; // 초기화
        return;
    }
    
    console.log('✅ 하이라이트 적용 시작:', {
        color: color,
        textLength: selectionText.length,
        preview: selectionText.substring(0, 50)
    });

    const viewer = document.getElementById('viewerContent');
    if (!viewer) return;

    try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(lastSelectionRange.cloneRange());
        
        const offset = getSelectionOffsetRelativeTo(viewer, sel);
        if (!offset) {
            console.error('오프셋 계산 실패');
            return;
        }
        
        const highlightId = `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const highlightData = {
            id: highlightId,
            start: offset.start,
            end: offset.end,
            color: color,
            text: sel.toString(),
            fileKey: currentFileKey,
            timestamp: Date.now()
        };

        if (!fileHighlights[currentFileKey]) fileHighlights[currentFileKey] = [];
        fileHighlights[currentFileKey].push(highlightData);
        localStorage.setItem('ebook_highlights', JSON.stringify(fileHighlights));

        // 안전한 래핑
        const range = lastSelectionRange;
        const safeNodes = [];
        if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
            safeNodes.push(range.commonAncestorContainer);
        } else {
            const treeWalker = document.createTreeWalker(
                range.commonAncestorContainer,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        try { return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } 
                        catch (e) { return NodeFilter.FILTER_REJECT; }
                    }
                }
            );
            let currentNode = treeWalker.nextNode();
            while (currentNode) {
                safeNodes.push(currentNode);
                currentNode = treeWalker.nextNode();
            }
        }

        if (safeNodes.length === 0) return;

        safeNodes.forEach(node => {
            const span = document.createElement('span');
            span.style.backgroundColor = color;
            span.className = 'highlight-text rounded-sm px-0.5 cursor-pointer hover:opacity-80 transition-opacity';
            span.title = '클릭하여 수정/삭제';
            span.dataset.highlightColor = color;
            span.dataset.highlightId = highlightId;
            span.onclick = handleHighlightClick;

            const subRange = document.createRange();
            if (node === range.startContainer) subRange.setStart(node, range.startOffset);
            else subRange.setStart(node, 0);

            if (node === range.endContainer) subRange.setEnd(node, range.endOffset);
            else subRange.setEnd(node, node.length);

            if (subRange.toString().length > 0) {
                try {
                    subRange.surroundContents(span);
                } catch (e) {
                    try {
                        const contents = subRange.extractContents();
                        span.appendChild(contents);
                        subRange.insertNode(span);
                    } catch (e2) {}
                }
            }
        });

        window.getSelection().removeAllRanges();
        lastSelectionRange = null;
        hideContextMenu(); // 메뉴 닫기 (activeHighlightSpan도 함께 초기화됨)

    } catch (e) {
        console.error('하이라이트 적용 중 예외:', e);
    }
}

// 하이라이트 복원
function restoreHighlights() {
    if (!currentFileKey || !fileHighlights[currentFileKey]) return;
    const viewer = document.getElementById('viewerContent');
    if (!viewer) return;
    
    try {
        const list = fileHighlights[currentFileKey];
        const highlightsWithOffset = list.filter(h => h.start !== undefined && h.end !== undefined);
        highlightsWithOffset.sort((a, b) => b.start - a.start);
        
        highlightsWithOffset.forEach(data => {
            const range = createRangeFromOffset(viewer, data.start, data.end);
            if (!range) return;
            const span = document.createElement('span');
            span.style.backgroundColor = data.color || '#fef08a';
            span.className = 'highlight-text rounded-sm px-0.5 cursor-pointer hover:opacity-80 transition-opacity';
            span.dataset.highlightColor = data.color || '#fef08a';
            span.dataset.highlightId = data.id;
            span.onclick = handleHighlightClick;
            try { range.surroundContents(span); } catch (e) {}
        });
    } catch (e) { console.error('하이라이트 복원 실패:', e); }
}

// ==========================================
// [4] 파일 처리
// ==========================================

function getCurrentFileName() {
    if (files && files[currentFileIndex]) return files[currentFileIndex].name;
    if (currentFileKey) {
        const history = getHistory();
        const historyItem = history.find(h => h.fileKey === currentFileKey);
        if (historyItem) return historyItem.name;
    }
    const lastReadFile = loadLastReadFile();
    if (lastReadFile && lastReadFile.fileKey === currentFileKey) return lastReadFile.name;
    return '알 수 없는 파일';
}

function parseAndRemoveMetadata(fullContent) {
    const metadataMarker = /\s*$/;
    const match = fullContent.match(metadataMarker);
    let content = fullContent;
    let metadata = null;
    if (match && match[1]) {
        try {
            metadata = JSON.parse(match[1]);
            content = fullContent.replace(match[0], '').trim();
        } catch (e) {}
    }
    return { content, metadata };
}

function restoreBookmarksFromMetadata(metadata) {
    if (!metadata || !metadata.bookmarks || !metadata.fileKey) return;
    const bookmarks = getBookmarks();
    const targetFileKey = currentFileKey || metadata.fileKey;
    const existingBookmarks = bookmarks[targetFileKey] || [];
    const mergedBookmarks = [...existingBookmarks];
    
    metadata.bookmarks.forEach(importedBm => {
        const isDuplicate = mergedBookmarks.some(existingBm => Math.abs(existingBm.position - importedBm.position) < 0.1);
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
    }
}

// ==========================================
// [5] UI 이벤트 및 기능 (복구된 코드들)
// ==========================================

function setupScrollListener() {
    window.removeEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll, { passive: true });
}

function setupContextMenuListener() {
    const viewerContent = document.getElementById('viewerContent');
    const contextMenu = document.getElementById('contextMenu');
    if (!viewerContent || !contextMenu) return;
    
    // 먼저 설정 복원 (중요: 리스너 등록 전에 실행)
    restoreContextMenuSetting();
    
    // 기존 리스너 제거
    viewerContent.removeEventListener('contextmenu', handleContextMenu);
    viewerContent.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('click', hideContextMenu);
    
    // 커스텀 메뉴가 활성화되어 있을 때만 리스너 등록
    const isEnabled = localStorage.getItem('contextMenuEnabled') !== 'false';
    
    if (isEnabled) {
        viewerContent.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('click', hideContextMenu);
        
        // 텍스트 선택 시 자동으로 lastSelectionRange 저장 (커스텀 메뉴 활성화 시에만)
        viewerContent.addEventListener('mouseup', handleMouseUp);
        
        console.log('✅ 커스텀 컨텍스트 메뉴 활성화됨');
    } else {
        console.log('⚠️ 커스텀 컨텍스트 메뉴 비활성화됨 - 브라우저 기본 메뉴 사용');
    }
    
    const highlightPalette = document.getElementById('highlightPalette');
    if (highlightPalette) {
        highlightPalette.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.hasAttribute('data-color')) {
                e.stopPropagation();
                applyHighlight(e.target.getAttribute('data-color'));
            }
        });
    }
    
    const bindMenu = (id, handler) => {
        const el = document.getElementById(id);
        if (el) {
            el.removeEventListener('click', handler);
            el.addEventListener('click', handler);
        }
    };
    bindMenu('ctxBookmark', handleBookmarkFromContext);
    bindMenu('ctxNote', handleNoteFromContext);
    bindMenu('ctxShare', handleShareFromContext);
    
    const ctxSettings = document.getElementById('ctxSettings');
    if (ctxSettings) ctxSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        hideContextMenu();
        toggleUploadSection(); 
    });

    const ctxRemoveHighlight = document.getElementById('ctxRemoveHighlight');
    if (ctxRemoveHighlight) ctxRemoveHighlight.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeHighlightSpan) {
            const id = activeHighlightSpan.dataset.highlightId;
            document.querySelectorAll(`span[data-highlight-id="${id}"]`).forEach(s => {
                const parent = s.parentNode;
                while(s.firstChild) parent.insertBefore(s.firstChild, s);
                parent.removeChild(s);
            });
            if (currentFileKey && fileHighlights[currentFileKey]) {
                fileHighlights[currentFileKey] = fileHighlights[currentFileKey].filter(h => h.id !== id);
                localStorage.setItem('ebook_highlights', JSON.stringify(fileHighlights));
            }
            activeHighlightSpan = null;
        }
        toggleMenuMode(false);
        hideContextMenu();
    });

    const ctxExpandPanel = document.getElementById('ctxExpandPanel');
    if (ctxExpandPanel) ctxExpandPanel.addEventListener('click', (e) => {
        e.stopPropagation();
        hideContextMenu();
        toggleUploadSection();
    });
}

// mouseup 핸들러를 별도 함수로 분리
function handleMouseUp() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
        lastSelectionRange = selection.getRangeAt(0).cloneRange();
        console.log('✅ mouseup: 선택 영역 자동 저장됨 (' + selection.toString().trim().length + '자)');
    }
}

function handleContextMenu(e) {
    const viewerContent = document.getElementById('viewerContent');
    const contextMenu = document.getElementById('contextMenu');
    const selection = window.getSelection();
    
    if (!viewerContent.contains(e.target)) {
        hideContextMenu();
        return;
    }

    // Ctrl 키(Windows/Linux) 또는 Cmd 키(Mac)를 누르고 우클릭하면 브라우저 기본 메뉴 표시
    if (e.ctrlKey || e.metaKey) {
        console.log('🌐 Ctrl + 우클릭: 브라우저 기본 메뉴 표시');
        hideContextMenu();
        return; // 기본 동작 허용
    }

    const clickedElement = e.target.closest('.highlight-text');
    if (clickedElement) {
        e.preventDefault();
        e.stopPropagation();
        activeHighlightSpan = clickedElement;
        contextMenu.dataset.selectedText = clickedElement.innerText;
        toggleMenuMode(true);
        showMenuAt(e.clientX, e.clientY);
        return;
    }

    if (selection && selection.toString().trim().length > 0) {
        e.preventDefault();
        e.stopPropagation();
        toggleMenuMode(false);
        if (selection.rangeCount > 0) lastSelectionRange = selection.getRangeAt(0).cloneRange();
        contextMenu.dataset.selectedText = selection.toString().trim();
        showMenuAt(e.clientX, e.clientY);
    } else {
        hideContextMenu();
    }
}

function showMenuAt(x, y) {
    const menu = document.getElementById('contextMenu');
    const w = 200, h = 300;
    if (x + w > window.innerWidth) x -= w;
    if (y + h > window.innerHeight) y -= h;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove('hidden');
}

function hideContextMenu() {
    document.getElementById('contextMenu').classList.add('hidden');
    activeHighlightSpan = null; // 메뉴를 닫을 때 activeHighlightSpan 초기화
}

function toggleMenuMode(isEditMode) {
    const normal = document.getElementById('normalMenuOptions');
    const remove = document.getElementById('ctxRemoveHighlight');
    if (isEditMode) {
        if (remove) remove.classList.remove('hidden');
        if (normal) normal.classList.remove('hidden');
    } else {
        if (remove) remove.classList.add('hidden');
        if (normal) normal.classList.remove('hidden');
        activeHighlightSpan = null;
    }
}

function handleBookmarkFromContext(e) {
    e.stopPropagation();
    const contextMenu = document.getElementById('contextMenu');
    const selectedText = contextMenu?.dataset.selectedText || '';
    
    if (!currentFileKey) {
        alert("먼저 파일을 열어주세요.");
        hideContextMenu();
        return;
    }

    const bookmarkTitle = selectedText 
        ? (selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText)
        : `읽던 위치 (${new Date().toLocaleTimeString()})`;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;

    const newBookmark = {
        fileKey: currentFileKey,
        fileName: getCurrentFileName(),
        preview: bookmarkTitle,
        position: scrollPercent,
        yOffset: window.scrollY,
        timestamp: Date.now(),
        type: 'bookmark'
    };

    const bookmarks = getBookmarks();
    if (!bookmarks[currentFileKey]) bookmarks[currentFileKey] = [];
    bookmarks[currentFileKey].push(newBookmark);
    setBookmarks(bookmarks);
    displayUploadBookmarks();
    
    // UI 전환
    const settingsPanel = document.getElementById('settingsPanel');
    const mainGrid = document.getElementById('uploadSectionContent');
    const panelContainer = document.getElementById('uploadAreaContainer');
    
    if (settingsPanel) settingsPanel.classList.add('hidden');
    if (mainGrid) mainGrid.classList.remove('hidden');
    if (panelContainer) {
        panelContainer.classList.remove('-translate-y-full');
        panelContainer.classList.add('translate-y-0');
    }
    const btnText = document.getElementById('uploadToggleText');
    if (btnText) btnText.textContent = '패널 접기';

    hideContextMenu();
}

function handleNoteFromContext(e) { 
    e.stopPropagation();
    const selected = document.getElementById('contextMenu').dataset.selectedText;
    if(selected) {
        const note = prompt("메모를 입력하세요:", "");
        if(note) alert("메모 기능은 준비 중입니다.");
    }
    hideContextMenu(); 
}

function handleShareFromContext(e) { 
    e.stopPropagation();
    const selected = document.getElementById('contextMenu').dataset.selectedText;
    if(selected) {
        navigator.clipboard.writeText(selected).then(() => alert("복사되었습니다."));
    }
    hideContextMenu(); 
}

function updateProgressBar() {
    const bar = document.getElementById('reading-progress-bar');
    const container = document.getElementById('reading-progress-container');
    if (!bar || !container) return;
    container.classList.remove('hidden');
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    let progress = 0;
    if (scrollHeight > clientHeight) {
        progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    }
    bar.style.width = `${progress}%`;
}

function handleScroll() {
    if (!currentFileKey) return;
    updateProgressBar();
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
    const savedPos = loadReadingProgress(currentFileKey);
    if (savedPos !== null) {
        setTimeout(() => {
            const h = document.documentElement.scrollHeight;
            const ch = window.innerHeight;
            if (h > ch) {
                window.scrollTo({ top: (savedPos / 100) * (h - ch), behavior: 'auto' });
            }
            updateProgressBar();
        }, 150);
    }
}

// Exported Functions (main.js에서 사용)
export function getFiles() { return files; }
export function setFiles(newFiles) { files = newFiles; }
export function getCurrentFileIndex() { return currentFileIndex; }
export function setCurrentFileIndex(index) { currentFileIndex = index; }

export async function processFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    files = Array.from(fileList);
    currentFileIndex = 0;
    const uploadSection = document.getElementById('page-upload');
    const mainContent = document.getElementById('mainContent');
    if (uploadSection && mainContent) {
        const uploadContent = document.getElementById('uploadSectionContent');
        if (uploadContent && !uploadContent.classList.contains('hidden')) toggleUploadSection();
        mainContent.classList.remove('hidden');
    }
    displayFileContent(files[0]);
}

export function displayFileContent(file) {
    if (!file) return;
    const fileNameEl = document.getElementById('currentFileName');
    const fileInfoEl = document.getElementById('fileInfo');
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileInfoEl) fileInfoEl.textContent = `${formatFileSize(file.size)} | ${formatTimestamp(file.lastModified)}`;
    
    currentFileKey = generateFileKey(file);
    saveLastReadFile(file, currentFileKey);
    
    let fileContent = '';
    if (typeof file.content === 'string') {
        const { content: cleanContent, metadata } = parseAndRemoveMetadata(file.content);
        if (metadata) restoreBookmarksFromMetadata(metadata);
        renderContent(cleanContent, file.name);
        fileContent = cleanContent;
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            const rawContent = e.target.result;
            
            // [수정 1] 파일 객체에 읽어온 내용을 반드시 저장해야 합니다.
            file.content = rawContent; 

            const { content: cleanContent, metadata } = parseAndRemoveMetadata(rawContent);
            renderContent(cleanContent, file.name);
            if (metadata) restoreBookmarksFromMetadata(metadata);
            addToHistory(file.name, currentFileKey, cleanContent);
        };
        reader.readAsText(file);
        return;
    }
    addToHistory(file.name, currentFileKey, fileContent);
}

function addToHistory(fileName, fileKey, content) {
    const history = getHistory();
    const idx = history.findIndex(item => item.fileKey === fileKey);
    if (idx !== -1) history.splice(idx, 1);
    
    history.unshift({
        name: fileName,
        fileKey: fileKey,
        timestamp: Date.now(),
        preview: content ? content.substring(0, 100) : ''
    });
    if (history.length > 50) history.splice(50);
    setHistory(history);
    displayUploadHistory();
}

function renderContent(content, fileName) {
    const viewerContent = document.getElementById('viewerContent');
    if (fileName.toLowerCase().endsWith('.md') && typeof marked !== 'undefined') {
        viewerContent.innerHTML = marked.parse(content);
        viewerContent.classList.add('markdown-mode');
    } else {
        viewerContent.textContent = content;
        viewerContent.classList.remove('markdown-mode');
        viewerContent.style.whiteSpace = 'pre-wrap';
    }
    setupScrollListener();
    restoreReadingPosition();
    setupContextMenuListener();
    setTimeout(() => restoreHighlights(), 100);
    setTimeout(updateProgressBar, 100);
}

export function toggleUploadSection() {
    const container = document.getElementById('uploadAreaContainer');
    const btnText = document.getElementById('uploadToggleText');
    if (!container) return;
    
    if (container.classList.contains('translate-y-0')) {
        container.classList.remove('translate-y-0');
        container.classList.add('-translate-y-full');
        if(btnText) btnText.textContent = '패널 펼치기';
    } else {
        container.classList.remove('-translate-y-full');
        container.classList.add('translate-y-0');
        if(btnText) btnText.textContent = '패널 접기';
    }
}

export function selectFiles() {
    document.getElementById('file-input').click();
}

export function restoreContextMenuSetting() {
    const enabled = localStorage.getItem('contextMenuEnabled') !== 'false';
    
    // 두 토글 모두 동기화
    const toggleSettings = document.getElementById('ctxMenuSettingsToggle');
    const toggleInternal = document.getElementById('ctxMenuInternalToggle');
    
    if (toggleSettings) toggleSettings.checked = enabled;
    if (toggleInternal) toggleInternal.checked = enabled;
    
    console.log(`🔄 컨텍스트 메뉴 설정 복원: ${enabled ? '활성화' : '비활성화'}`);
}

export function toggleContextMenuSetting(toggleId) {
    const toggleSettings = document.getElementById('ctxMenuSettingsToggle');
    const toggleInternal = document.getElementById('ctxMenuInternalToggle');
    
    // 클릭된 토글의 상태를 가져옴
    const clickedToggle = document.getElementById(toggleId);
    const enabled = clickedToggle ? clickedToggle.checked : true;
    
    console.log(`🔄 토글 클릭: ${toggleId}, 새 값: ${enabled}`);
    
    // localStorage에 저장
    localStorage.setItem('contextMenuEnabled', enabled.toString());
    
    // 두 토글 모두 동기화
    if (toggleSettings) toggleSettings.checked = enabled;
    if (toggleInternal) toggleInternal.checked = enabled;
    
    // 설정 변경 시 컨텍스트 메뉴 리스너 재등록
    setupContextMenuListener();
    console.log(`✅ 컨텍스트 메뉴 설정 완료: ${enabled ? '활성화' : '비활성화'}`);
}

export function displayUploadHistory() { 
    const historyList = document.getElementById('uploadHistoryList');
    if(!historyList) return;
    const history = getHistory();
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        document.getElementById('uploadHistoryEmpty').style.display = 'block';
        return;
    }
    document.getElementById('uploadHistoryEmpty').style.display = 'none';

    history.forEach((item, index) => {
        // 파일 출처 확인
        const isGoogleDrive = item.fileKey.startsWith('gdrive_');
        const isMdFile = item.name.endsWith('.md');
        
        // 아이콘과 색상 설정
        let icon, iconColor, borderColor;
        if (isGoogleDrive) {
            icon = isMdFile ? '📝' : '📄';
            iconColor = 'text-blue-600'; // Google Drive 파일은 파란색
            borderColor = 'border-l-4 border-blue-500';
        } else {
            icon = isMdFile ? '📝' : '📄';
            iconColor = 'text-gray-600'; // 로컬 파일은 회색
            borderColor = 'border-l-4 border-gray-400';
        }
        
        const div = document.createElement('div');
        div.className = `flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors leading-tight theme-item-bg group ${borderColor}`;
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex items-center gap-2 overflow-hidden flex-1 pr-2';
        
        // Google Drive 뱃지 추가
        const badge = isGoogleDrive 
            ? '<span class="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">Drive</span>' 
            : '<span class="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-semibold">Local</span>';
        
        infoDiv.innerHTML = `<span class="text-lg ${iconColor}">${icon}</span><div class="flex flex-col overflow-hidden leading-tight flex-1"><div class="flex items-center gap-1.5"><span class="font-medium truncate text-sm theme-text-body">${item.name}</span>${badge}</div><span class="text-[10px] theme-text-body opacity-70">${formatTimestamp(item.timestamp)}</span></div>`;
        infoDiv.onclick = () => {
            if(item.fileKey.startsWith('gdrive_')) {
                if(window.loadLastReadGoogleDriveFile) window.loadLastReadGoogleDriveFile(item.fileKey.replace('gdrive_', ''));
            } else {
                alert('로컬 파일은 보안상 자동으로 다시 열 수 없습니다. 파일을 다시 선택해주세요.');
            }
        };
        const delBtn = document.createElement('button');
        delBtn.className = 'p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 flex-shrink-0';
        delBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`삭제하시겠습니까?`)) {
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
    const list = document.getElementById('uploadBookmarksList');
    if(!list) return;
    const bookmarks = getBookmarks();
    const current = currentFileKey && bookmarks[currentFileKey] ? bookmarks[currentFileKey] : [];
    list.innerHTML = '';
    
    if (!currentFileKey || current.length === 0) {
        document.getElementById('uploadBookmarksEmpty').style.display = 'block';
        return;
    }
    document.getElementById('uploadBookmarksEmpty').style.display = 'none';

    // 현재 파일이 Google Drive 파일인지 확인
    const isGoogleDrive = currentFileKey.startsWith('gdrive_');
    const borderColor = isGoogleDrive ? 'border-l-4 border-blue-500' : 'border-l-4 border-gray-400';
    const bookmarkIcon = isGoogleDrive ? '🔖' : '📌';
    const iconColor = isGoogleDrive ? 'text-blue-600' : 'text-gray-600';

    current.forEach(bm => {
        const div = document.createElement('div');
        div.className = `flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors leading-tight theme-item-bg group ${borderColor}`;
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex flex-col overflow-hidden flex-1 pr-2';
        infoDiv.innerHTML = `<div class="font-medium text-sm truncate leading-tight theme-text-body ${iconColor}"><span class="mr-1">${bookmarkIcon}</span>${bm.preview || '북마크'}</div><div class="text-[10px] theme-text-body opacity-70 leading-tight">위치: ${bm.position.toFixed(1)}%</div>`;
        infoDiv.onclick = () => {
            const h = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo({ top: (bm.position / 100) * h, behavior: 'smooth' });
        };
        const delBtn = document.createElement('button');
        delBtn.className = 'p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 flex-shrink-0';
        delBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`삭제하시겠습니까?`)) {
                bookmarks[currentFileKey] = bookmarks[currentFileKey].filter(b => b.timestamp !== bm.timestamp);
                setBookmarks(bookmarks);
                displayUploadBookmarks();
            }
        };
        div.appendChild(infoDiv);
        div.appendChild(delBtn);
        list.appendChild(div);
    });
}

export function toggleBookmark() { 
    if(!currentFileKey) return alert("파일을 먼저 열어주세요");
    const bookmarks = getBookmarks();
    if(!bookmarks[currentFileKey]) bookmarks[currentFileKey] = [];
    const pos = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    bookmarks[currentFileKey].push({
        fileKey: currentFileKey,
        fileName: getCurrentFileName(),
        preview: `읽던 위치 (${new Date().toLocaleTimeString()})`,
        position: pos,
        timestamp: Date.now()
    });
    setBookmarks(bookmarks);
    displayUploadBookmarks();
    alert("북마크가 추가되었습니다.");
}

export function toggleSettings() { 
    const panel = document.getElementById('settingsPanel');
    const grid = document.getElementById('uploadSectionContent');
    const btn = document.getElementById('settingsToggleBtn');
    if(panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        grid.classList.add('hidden');
        if(btn) btn.innerHTML = '📂 불러오기';
    } else {
        panel.classList.add('hidden');
        grid.classList.remove('hidden');
        if(btn) btn.innerHTML = '⚙️ 설정';
    }
}

export function toggleHistorySection() { document.getElementById('historySectionContent').classList.toggle('hidden'); }
export function toggleBookmarksSection() { document.getElementById('bookmarksSectionContent').classList.toggle('hidden'); }

export function toggleWrapMode() { 
    const viewer = document.getElementById('viewerContent');
    const btn = document.getElementById('wrapModeBtn');
    if(viewer.classList.contains('whitespace-pre')) {
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

export function updateMarkdownStyles() {
    const fontSelect = document.getElementById('markdownHeadingFont');
    const headingSizeSlider = document.getElementById('headingSizeSlider');
    const headingColor = document.getElementById('headingColor');
    const tocColor = document.getElementById('tocColor');
    if (!fontSelect) return;
    
    let styleTag = document.getElementById('dynamicHeadingStyle');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamicHeadingStyle';
        document.head.appendChild(styleTag);
    }
    
    const font = fontSelect.value === 'inherit' ? '' : `font-family: ${fontSelect.value} !important;`;
    const baseSize = headingSizeSlider ? parseFloat(headingSizeSlider.value) : 1.0;
    const hColor = headingColor ? headingColor.value : '#2563eb';
    const tColor = tocColor ? tocColor.value : '#2563eb';
    
    // [수정 핵심] h1, h2, h3의 크기를 각각 다르게 배율 설정
    // H1 (메인 제목): 설정값의 1.8배
    // H2 (챕터 제목): 설정값의 1.4배
    // H3 (서지 정보): 설정값의 1.1배 (약간 작게)
    styleTag.innerHTML = `
        #viewerContent h1 { 
            ${font} 
            font-size: calc(1em * ${baseSize * 1.4}) !important; 
            color: ${hColor} !important; 
            border-bottom: 2px solid ${hColor}33; /* 연한 밑줄 추가 */
            padding-bottom: 0.3em;
            margin-top: 0.5em;
        }
        #viewerContent h2 { 
            ${font} 
            font-size: calc(1em * ${baseSize * 1.2}) !important; 
            color: ${hColor} !important; 
            margin-top: 1.5em;
        }
        #viewerContent h3 { 
            ${font} 
            font-size: calc(1em * ${baseSize * 1.0}) !important; 
            color: ${hColor} !important; 
            opacity: 0.85; /* 정보성 텍스트는 약간 투명하게 */
            margin-bottom: 0.2em;
        }
        #viewerContent .toc a { color: ${tColor} !important; }
    `;
    
    if(document.getElementById('headingSizeValue')) document.getElementById('headingSizeValue').textContent = `${baseSize}x`;
    localStorage.setItem('markdownHeadingFont', fontSelect.value);
    localStorage.setItem('markdownHeadingSize', baseSize);
    localStorage.setItem('markdownHeadingColor', hColor);
    localStorage.setItem('markdownTocColor', tColor);
}
export function updateBodyStyles() {
    const viewer = document.getElementById('viewerContent');
    const lh = document.getElementById('lineHeightSlider').value;
    const font = document.getElementById('bodyFontFamily').value;
    const color = document.getElementById('bodyTextColor').value;
    
    viewer.style.setProperty('--user-line-height', lh, 'important');
    viewer.style.setProperty('font-family', font, 'important');
    viewer.style.setProperty('color', color, 'important');
    
    document.getElementById('lineHeightValue').textContent = lh;
    localStorage.setItem('bodyLineHeight', lh);
    localStorage.setItem('bodyFontFamily', font);
    localStorage.setItem('bodyTextColor', color);
}

export function updateTextStroke() {
    const val = document.getElementById('textStrokeSlider').value;
    const viewer = document.getElementById('viewerContent');
    viewer.style.webkitTextStrokeWidth = `${val}px`;
    viewer.style.webkitTextStrokeColor = 'currentColor';
    document.getElementById('textStrokeValue').textContent = `${val}px`;
    localStorage.setItem('textStrokeWidth', val);
}

export function restoreMarkdownStyles() {
    const savedFont = localStorage.getItem('markdownHeadingFont');
    if(savedFont) {
        document.getElementById('markdownHeadingFont').value = savedFont;
        document.getElementById('headingSizeSlider').value = localStorage.getItem('markdownHeadingSize') || 1.0;
        document.getElementById('headingColor').value = localStorage.getItem('markdownHeadingColor') || '#2563eb';
        document.getElementById('tocColor').value = localStorage.getItem('markdownTocColor') || '#2563eb';
        updateMarkdownStyles();
    }
}

export function restoreBodyStyles() {
    const savedLh = localStorage.getItem('bodyLineHeight') || 1.8;
    document.getElementById('lineHeightSlider').value = savedLh;
    document.getElementById('bodyFontFamily').value = localStorage.getItem('bodyFontFamily') || "'Noto Sans KR', sans-serif";
    document.getElementById('bodyTextColor').value = localStorage.getItem('bodyTextColor') || '#374151';
    updateBodyStyles();
    
    const savedStroke = localStorage.getItem('textStrokeWidth') || 0;
    const strokeSlider = document.getElementById('textStrokeSlider');
    if(strokeSlider) {
        strokeSlider.value = savedStroke;
        updateTextStroke();
    }
}

export function resetAllSettings() { 
    if(confirm("모든 설정을 초기화 하시겠습니까?")) {
        localStorage.clear();
        window.location.reload();
    }
}

export function updateViewerWidth() {
    const val = document.getElementById('viewerWidthSlider').value;
    const container = document.getElementById('mainTextContainer');
    if(!document.getElementById('fullWidthToggle').checked) {
        container.style.setProperty('max-width', `${val}px`, 'important');
        localStorage.setItem('viewerWidth', val);
    }
    document.getElementById('viewerWidthValue').innerText = `${val}px`;
}

export function toggleFullWidth() {
    const isFull = document.getElementById('fullWidthToggle').checked;
    const container = document.getElementById('mainTextContainer');
    const slider = document.getElementById('viewerWidthSlider');
    if(isFull) {
        container.style.setProperty('max-width', '100%', 'important');
        slider.disabled = true;
        localStorage.setItem('fullWidthMode', 'true');
    } else {
        slider.disabled = false;
        updateViewerWidth();
        localStorage.setItem('fullWidthMode', 'false');
    }
}

export function restoreViewerWidth() {
    const savedWidth = localStorage.getItem('viewerWidth') || 1400;
    document.getElementById('viewerWidthSlider').value = savedWidth;
    const isFull = localStorage.getItem('fullWidthMode') === 'true';
    document.getElementById('fullWidthToggle').checked = isFull;
    toggleFullWidth();
}

export function toggleFavorite() { alert('즐겨찾기 기능은 준비 중입니다.'); }

// [AI 변환 기능]
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

        // [수정 2] 변환된 텍스트를 메모리에 저장 (이 코드가 없으면 원본으로 되돌아감)
        files[currentFileIndex].content = cleanedText;

        // [추가 권장] 파일 내용이 바뀌었으므로 기존 하이라이트와의 위치 불일치 방지
        if (fileHighlights[currentFileKey]) {
            console.warn('AI 변환으로 인해 기존 하이라이트 위치가 맞지 않을 수 있어 초기화합니다.');
            delete fileHighlights[currentFileKey];
            localStorage.setItem('ebook_highlights', JSON.stringify(fileHighlights));
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
    if (!files[currentFileIndex]) return alert("파일 없음");
    const blob = new Blob([files[currentFileIndex].content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = files[currentFileIndex].name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function exportData() {
    const data = {
        bookmarks: JSON.parse(localStorage.getItem('readerBookmarks') || '{}'),
        history: JSON.parse(localStorage.getItem('readerHistory') || '[]'),
        highlights: JSON.parse(localStorage.getItem('ebook_highlights') || '{}'),
        version: "1.0"
    };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebook_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function importData() { document.getElementById('importDataInput').click(); }

export function handleImportDataFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if(data.bookmarks) localStorage.setItem('readerBookmarks', JSON.stringify(data.bookmarks));
            if(data.history) localStorage.setItem('readerHistory', JSON.stringify(data.history));
            if(data.highlights) localStorage.setItem('ebook_highlights', JSON.stringify(data.highlights));
            alert("복원 완료. 새로고침합니다.");
            window.location.reload();
        } catch(err) { alert("파일 오류"); }
    };
    reader.readAsText(file);
}

export function displayFiles() {
    const files = getFiles();
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    files.forEach(file => {
        const li = document.createElement('li');
        li.textContent = file.name;
        fileList.appendChild(li);
    });
}