/**
 * 메인 모듈
 * 앱 초기화 및 이벤트 리스너 등록
 */

import { APP_NAME, APP_VERSION } from './config.js';
import { loadSettings, applySettings, loadHistory, loadBookmarks, loadGoogleDriveSettings, setTheme, setFontSize, saveGoogleDriveSettings, loadLastReadFile, updateCustomTheme, saveGeminiApiKey } from './settings.js';
// toggleUploadSection, toggleHistorySection, toggleBookmarksSection 추가
import { displayUploadHistory, displayUploadBookmarks, processFiles, toggleWrapMode, selectFiles, restoreBodyStyles, restoreViewerWidth, restoreMarkdownStyles, toggleSettings, toggleFavorite, toggleUploadSection, toggleHistorySection, toggleBookmarksSection, handleAIClean, downloadAsMarkdown, updateViewerWidth, toggleFullWidth, updateBodyStyles, updateMarkdownStyles, updateTextStroke, resetAllSettings, restoreContextMenuSetting, toggleContextMenuSetting, exportData, importData, handleImportDataFile } from './viewer.js';
import { loadGoogleDriveFiles, loadLastReadGoogleDriveFile } from './google_drive.js';

/**
 * 구형 localStorage 데이터 마이그레이션 및 청소
 * readingPosition_로 시작하는 구형 키들과 fileName 기반 북마크 삭제
 */
function migrateOldStorageData() {
    console.log('🧹 구형 localStorage 데이터 마이그레이션 시작');
    let cleanedCount = 0;
    
    try {
        // localStorage의 모든 키 확인
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // readingPosition_로 시작하는 구형 키 찾기
            if (key && key.startsWith('readingPosition_')) {
                keysToRemove.push(key);
            }
            // fileName 기반으로 저장된 구형 북마크 키 찾기 (예: bookmark_fileName.txt)
            if (key && (key.startsWith('bookmark_') || key.startsWith('readerPageBookmarks_'))) {
                keysToRemove.push(key);
            }
        }
        
        // 구형 키 삭제
        keysToRemove.forEach(key => {
            console.log(`🗑️ 구형 데이터 삭제: ${key}`);
            localStorage.removeItem(key);
            cleanedCount++;
        });
        
        if (cleanedCount > 0) {
            console.log(`✅ 구형 데이터 ${cleanedCount}개 삭제 완료`);
        } else {
            console.log('✅ 구형 데이터 없음');
        }
    } catch (e) {
        console.error('❌ 구형 데이터 마이그레이션 실패:', e);
    }
}

/**
 * 앱 초기화
 */
// initApp 중복 호출 방지 플래그
let initAppCalled = false;

function initApp() {
    // 중복 호출 방지
    if (initAppCalled) {
        console.warn('[initApp] 이미 호출되었습니다. 중복 호출을 방지합니다.');
        return;
    }
    initAppCalled = true;
    
    console.log('[DOMContentLoaded] Start');
    
    // 구형 데이터 마이그레이션 (가장 먼저 실행)
    migrateOldStorageData();
    
    // 버전 정보 표시
    const appInfoElement = document.getElementById('app-info');
    if (appInfoElement) {
        appInfoElement.textContent = `${APP_NAME} | Version ${APP_VERSION}`;
    }
    
    // 설정 로드
    console.log('🚀 앱 초기화: 설정 및 데이터 로드 시작');
    loadSettings();
    loadHistory();
    loadBookmarks();
    loadGoogleDriveSettings();
    console.log('🚀 앱 초기화: 설정 및 데이터 로드 완료');

    // 설정 적용
    applySettings();
    displayUploadHistory();
    displayUploadBookmarks();
    
    // 줄바꿈 모드 복원
    restoreWrapMode();
    
    // 뷰어 넓이 복원
    restoreViewerWidth();
    
    // 본문 스타일 복원
    restoreBodyStyles();
    
    // 마크다운 스타일 복원
    restoreMarkdownStyles();
    
    // 마크다운 스타일 이벤트 리스너 연결 (HTML의 onchange 속성과 함께 작동)
    const headingSelect = document.getElementById('markdownHeadingFont');
    const headingSizeSlider = document.getElementById('headingSizeSlider');
    const headingColor = document.getElementById('headingColor');
    const tocColor = document.getElementById('tocColor');
    
    if (headingSelect) {
        headingSelect.addEventListener('change', updateMarkdownStyles);
    }
    if (headingSizeSlider) {
        headingSizeSlider.addEventListener('input', updateMarkdownStyles);
    }
    if (headingColor) {
        headingColor.addEventListener('change', updateMarkdownStyles);
    }
    if (tocColor) {
        tocColor.addEventListener('change', updateMarkdownStyles);
    }
    
    // 텍스트 스트로크 이벤트 리스너 연결 (HTML의 oninput 속성과 함께 작동)
    const strokeSlider = document.getElementById('textStrokeSlider');
    if (strokeSlider) {
        strokeSlider.addEventListener('input', updateTextStroke);
    }
    
    // 컨텍스트 메뉴 설정 복원
    restoreContextMenuSetting();

    // 마지막 읽은 파일 복원 시도
    restoreLastReadFile();

    // 파일 입력 이벤트 리스너
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                processFiles(e.target.files);
                // ★ 핵심: 파일을 처리한 후 input 값을 비워줘야 
                // 다음에 같은 파일을 다시 선택해도 'change' 이벤트가 발생합니다.
                e.target.value = ''; 
            }
        });
    }

    // Google Drive 버튼 클릭 이벤트 리스너 추가
    const loadGoogleDriveBtn = document.getElementById('loadGoogleDriveBtn');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:152',message:'Looking for loadGoogleDriveBtn',data:{buttonFound:!!loadGoogleDriveBtn,windowLoadGoogleDriveFiles:typeof window.loadGoogleDriveFiles,loadGoogleDriveFilesType:typeof loadGoogleDriveFiles},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.log('🔍 Google Drive 버튼 찾기:', { 
        buttonFound: !!loadGoogleDriveBtn,
        windowLoadGoogleDriveFiles: typeof window.loadGoogleDriveFiles,
        loadGoogleDriveFilesType: typeof loadGoogleDriveFiles
    });
    
    if (loadGoogleDriveBtn) {
        // 중복 등록 방지: 기존 리스너 제거 후 재등록
        const existingListener = loadGoogleDriveBtn._clickListener;
        if (existingListener) {
            loadGoogleDriveBtn.removeEventListener('click', existingListener);
        }
        
        // 이벤트 리스너로 직접 처리 (onclick 속성 제거됨)
        const clickListener = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:163',message:'Google Drive button clicked',data:{windowLoadGoogleDriveFiles:typeof window.loadGoogleDriveFiles,loadGoogleDriveFilesType:typeof loadGoogleDriveFiles},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            console.log('🔵 Google Drive 버튼 클릭 이벤트 리스너 실행');
            console.log('🔍 함수 상태:', { 
                windowLoadGoogleDriveFiles: typeof window.loadGoogleDriveFiles,
                loadGoogleDriveFilesType: typeof loadGoogleDriveFiles,
                directLoadGoogleDriveFiles: typeof loadGoogleDriveFiles
            });
            
            // 직접 import한 함수 사용 (가장 안전)
            if (typeof loadGoogleDriveFiles === 'function') {
                try {
                    console.log('✅ loadGoogleDriveFiles 직접 호출');
                    await loadGoogleDriveFiles();
                } catch (error) {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:171',message:'loadGoogleDriveFiles error in listener',data:{errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    console.error('❌ loadGoogleDriveFiles 실행 중 오류:', error);
                    console.error('❌ 오류 상세:', { message: error.message, stack: error.stack, name: error.name });
                }
            } else if (typeof window.loadGoogleDriveFiles === 'function') {
                // 폴백: window 객체를 통해 호출
                try {
                    console.log('✅ window.loadGoogleDriveFiles 호출 (폴백)');
                    await window.loadGoogleDriveFiles();
                } catch (error) {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:171',message:'window.loadGoogleDriveFiles error in listener',data:{errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    console.error('❌ window.loadGoogleDriveFiles 실행 중 오류:', error);
                    console.error('❌ 오류 상세:', { message: error.message, stack: error.stack, name: error.name });
                }
            } else {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:174',message:'loadGoogleDriveFiles not found anywhere',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                console.error('❌ loadGoogleDriveFiles 함수를 찾을 수 없습니다.');
                alert('Google Drive 기능을 사용할 수 없습니다. 페이지를 새로고침해주세요.');
            }
        };
        
        loadGoogleDriveBtn._clickListener = clickListener; // 참조 저장
        loadGoogleDriveBtn.addEventListener('click', clickListener, { capture: false, passive: false });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:180',message:'Google Drive button listener registered',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.log('✅ Google Drive 버튼 이벤트 리스너 등록 완료');
    } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:182',message:'loadGoogleDriveBtn not found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.warn('⚠️ loadGoogleDriveBtn 요소를 찾을 수 없습니다.');
    }

    // 드래그 앤 드롭 이벤트 리스너
    const uploadBox = document.getElementById('uploadBox');
    if (uploadBox) {
        uploadBox.addEventListener('dragover', (e) => { 
            e.preventDefault(); 
            uploadBox.classList.add('bg-gray-100'); 
        });
        uploadBox.addEventListener('dragleave', (e) => { 
            e.preventDefault(); 
            uploadBox.classList.remove('bg-gray-100'); 
        });
        uploadBox.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadBox.classList.remove('bg-gray-100');
            const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.txt') || f.name.endsWith('.md'));
            if (droppedFiles.length) {
                const { processFilesWithResume } = await import('./viewer.js');
                await processFilesWithResume(droppedFiles);
            }
        });
    }

    // 검색 입력 이벤트 리스너 (있는 경우)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // TODO: 검색 기능 구현
        searchInput.addEventListener('input', () => {
            // displayFiles 함수가 필요하면 viewer.js에 추가
        });
    }

    // 데이터 백업/복원 버튼 이벤트 리스너
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            exportData();
        });
    }

    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
        importDataBtn.addEventListener('click', () => {
            importData();
        });
    }

    // 파일 선택 후 실제 복원 로직
    const importDataInput = document.getElementById('importDataInput');
    if (importDataInput) {
        importDataInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleImportDataFile(file);
            }
            e.target.value = ''; // 입력 초기화 (같은 파일 다시 선택 가능하게)
        });
    }

    console.log('[DOMContentLoaded] Complete');
}

/**
 * 줄바꿈 모드 복원
 */
function restoreWrapMode() {
    try {
        const savedMode = localStorage.getItem('wrapMode');
        if (savedMode === 'original') {
            const viewer = document.getElementById('viewerContent');
            const btn = document.getElementById('wrapModeBtn');
            if (viewer && btn) {
                // 기존 클래스 제거 후 새로운 클래스 추가
                viewer.classList.remove('wrap-original', 'force-original-break');
                viewer.classList.add('nowrap-mode');
                btn.textContent = '줄바꿈: 원본(가로스크롤)';
                btn.classList.remove('bg-purple-500');
                btn.classList.add('bg-purple-600');
                console.log('✅ 줄바꿈 모드 복원: 원본 보기 모드');
            }
        } else {
            // 자동 모드인 경우 클래스 제거
            const viewer = document.getElementById('viewerContent');
            const btn = document.getElementById('wrapModeBtn');
            if (viewer && btn) {
                viewer.classList.remove('nowrap-mode', 'wrap-original', 'force-original-break');
                btn.textContent = '줄바꿈: 자동';
                btn.classList.remove('bg-purple-600');
                btn.classList.add('bg-purple-500');
                console.log('✅ 줄바꿈 모드 복원: 자동 줄바꿈 모드');
            }
        }
    } catch (e) {
        console.error('❌ 줄바꿈 모드 복원 실패:', e);
    }
}

/**
 * 마지막 읽은 파일 복원
 */
async function restoreLastReadFile() {
    const lastReadFile = loadLastReadFile();
    if (!lastReadFile) return;
    
    if (lastReadFile.isGoogleDrive && lastReadFile.fileId) {
        // Case A: Google Drive 파일 - 로그인 후 자동 로드
        console.log('마지막 읽은 Google Drive 파일 복원 시도:', lastReadFile.fileName);
        // Google Drive 모듈에서 처리하도록 신호 전달
        if (window.restoreGoogleDriveFile) {
            window.restoreGoogleDriveFile(lastReadFile.fileId);
        } else {
            // Google Drive가 아직 초기화되지 않았으면 나중에 시도
            setTimeout(() => {
                if (window.restoreGoogleDriveFile) {
                    window.restoreGoogleDriveFile(lastReadFile.fileId);
                }
            }, 1000);
        }
    } else {
        // Case B: 로컬 파일 - 안내 메시지 표시
        console.log('마지막 읽은 로컬 파일:', lastReadFile.fileName);
        // showLocalFileResumeMessage 함수가 viewer.js에 없으므로 주석 처리
        // showLocalFileResumeMessage(lastReadFile.fileName);
        console.log('로컬 파일을 다시 열려면 파일을 업로드해주세요:', lastReadFile.fileName);
    }
}

// 전역 함수 노출 (HTML의 onclick에서 사용)
// 모듈 로드 즉시 할당하여 HTML의 onclick이 작동하도록 보장
window.setTheme = setTheme;
window.setFontSize = setFontSize;
window.saveGoogleDriveSettings = saveGoogleDriveSettings;
window.loadGoogleDriveFiles = loadGoogleDriveFiles;
// #region agent log
fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:314',message:'window.loadGoogleDriveFiles assigned',data:{isFunction:typeof loadGoogleDriveFiles === 'function',functionName:loadGoogleDriveFiles?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
console.log('✅ window.loadGoogleDriveFiles 할당 완료', { 
    isFunction: typeof loadGoogleDriveFiles === 'function',
    functionName: loadGoogleDriveFiles?.name,
    windowLoadGoogleDriveFiles: typeof window.loadGoogleDriveFiles === 'function'
});
window.updateCustomTheme = updateCustomTheme;
window.toggleWrapMode = toggleWrapMode; // 줄바꿈 모드 토글 함수 노출
window.selectFiles = selectFiles; // 파일 선택 함수 노출
window.saveGeminiApiKey = saveGeminiApiKey; // Gemini API 키 저장 함수 노출
window.toggleSettings = toggleSettings;
window.toggleFavorite = toggleFavorite;

// [추가] 접기/펼치기 함수 노출
window.toggleUploadSection = toggleUploadSection;
window.toggleHistorySection = toggleHistorySection;
window.toggleBookmarksSection = toggleBookmarksSection;

// [추가] AI 변환 및 다운로드 함수 노출
window.handleAIClean = handleAIClean;
window.downloadAsMarkdown = downloadAsMarkdown;

// [추가] 뷰어 너비 조절 함수 노출
window.updateViewerWidth = updateViewerWidth;
window.toggleFullWidth = toggleFullWidth;

// [추가] 본문 스타일 함수 노출
window.updateBodyStyles = updateBodyStyles;

// [추가] 마크다운 스타일 함수 노출
window.updateMarkdownStyles = updateMarkdownStyles;

// [추가] 텍스트 스트로크 함수 노출
window.updateTextStroke = updateTextStroke;

// [추가] 설정 초기화 함수 노출
window.resetAllSettings = resetAllSettings;

// [추가] 컨텍스트 메뉴 설정 함수 노출
window.toggleContextMenuSetting = toggleContextMenuSetting;

// [추가] 데이터 백업/복원 함수 노출
window.exportData = exportData;
window.importData = importData;

// DOM 로드 완료 시 초기화
window.addEventListener('DOMContentLoaded', initApp);

