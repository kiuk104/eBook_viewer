/**
 * 에이전트 2 제안: 순수 함수형 파이프라인
 * 
 * 진입점 모듈
 * 함수형 프로그래밍 패러다임으로 뷰어 기능을 제공합니다.
 */

import { initialState, setFiles, setCurrentFileKey, setWrapMode, getCurrentFile } from './state.js';
import { renderPipeline, getWrapModeStyles } from './render.js';
import { pipe } from './pipeline.js';
import { formatFileSize, formatTimestamp, generateFileKey } from '../../utils.js';
import { saveReadingProgress, loadReadingProgress, getHistory, setHistory, getBookmarks, setBookmarks } from '../../settings.js';

/**
 * @type {Object} 애플리케이션 상태
 */
let appState = { ...initialState };

/**
 * 상태 업데이트 헬퍼
 * @param {Function} updater - 상태 업데이트 함수
 */
const updateState = (updater) => {
    appState = updater(appState);
};

/**
 * 파일 처리 파이프라인
 * @param {FileList} fileList - 파일 목록
 */
export const processFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    
    const files = Array.from(fileList);
    
    updateState((state) => {
        const newState = setFiles(state, files);
        const file = getCurrentFile(newState);
        if (file) {
            const fileKey = generateFileKey(file);
            return setCurrentFileKey(newState, fileKey);
        }
        return newState;
    });
    
    const file = getCurrentFile(appState);
    if (file) {
        displayFileContent(file);
        
        // UI 업데이트
        const uploadSection = document.getElementById('page-upload');
        const mainContent = document.getElementById('mainContent');
        if (uploadSection && mainContent) {
            const uploadContent = document.getElementById('uploadSectionContent');
            if (uploadContent && !uploadContent.classList.contains('hidden')) {
                toggleUploadSection();
            }
            mainContent.classList.remove('hidden');
        }
    }
};

/**
 * 파일 내용 표시 파이프라인
 * @param {File} file - 파일 객체
 */
export const displayFileContent = (file) => {
    if (!file) return;
    
    // 파일 정보 표시
    const fileNameEl = document.getElementById('currentFileName');
    const fileInfoEl = document.getElementById('fileInfo');
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileInfoEl) {
        fileInfoEl.textContent = `${formatFileSize(file.size)} | ${formatTimestamp(file.lastModified)}`;
    }
    
    // 파일 키 설정
    const fileKey = generateFileKey(file);
    updateState((state) => setCurrentFileKey(state, fileKey));
    
    // 파일 내용 읽기
    let content = '';
    if (typeof file.content === 'string') {
        content = file.content;
        renderContent(content, file.name);
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            content = e.target.result;
            file.content = content;
            renderContent(content, file.name);
            addToHistory(file.name, fileKey, content);
        };
        reader.readAsText(file);
        return;
    }
    
    addToHistory(file.name, fileKey, content);
};

/**
 * 콘텐츠 렌더링
 * @param {string} content - 파일 내용
 * @param {string} fileName - 파일명
 */
const renderContent = (content, fileName) => {
    const wrapMode = localStorage.getItem('wrapMode') || 'auto';
    
    // 렌더링 파이프라인 실행
    renderPipeline({
        content,
        fileName,
        wrapMode,
        elementId: 'viewerContent'
    });
    
    // 읽기 위치 복원
    restoreReadingPosition();
    
    // 하이라이트 복원
    setTimeout(() => {
        if (window.restoreHighlights) {
            window.restoreHighlights();
        }
    }, 100);
    
    // 진행 바 업데이트
    setTimeout(() => updateProgressBar(), 100);
    
    // 북마크 목록 새로고침
    displayUploadBookmarks();
};

/**
 * 읽기 위치 복원
 */
const restoreReadingPosition = () => {
    const fileKey = appState.currentFileKey;
    if (!fileKey) return;
    
    const savedPos = loadReadingProgress(fileKey);
    if (savedPos !== null) {
        setTimeout(() => {
            const h = document.documentElement.scrollHeight;
            const ch = window.innerHeight;
            if (h > ch) {
                window.scrollTo({
                    top: (savedPos / 100) * (h - ch),
                    behavior: 'auto'
                });
            }
            updateProgressBar();
        }, 150);
    }
};

/**
 * 진행 바 업데이트
 */
const updateProgressBar = () => {
    const bar = document.getElementById('reading-progress-bar');
    const container = document.getElementById('reading-progress-container');
    if (!bar || !container) return;
    
    container.classList.remove('hidden');
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const progress = scrollHeight > clientHeight
        ? (scrollTop / (scrollHeight - clientHeight)) * 100
        : 0;
    bar.style.width = `${progress}%`;
};

/**
 * 스크롤 핸들러
 */
let scrollSaveTimer = null;

const handleScroll = () => {
    const fileKey = appState.currentFileKey;
    if (!fileKey) return;
    
    updateProgressBar();
    
    if (scrollSaveTimer) {
        clearTimeout(scrollSaveTimer);
    }
    
    scrollSaveTimer = setTimeout(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        const progress = scrollHeight > clientHeight
            ? (scrollTop / (scrollHeight - clientHeight)) * 100
            : 0;
        saveReadingProgress(fileKey, progress);
    }, 500);
};

// 스크롤 이벤트 리스너 등록
window.addEventListener('scroll', handleScroll, { passive: true });

/**
 * 히스토리에 추가
 * @param {string} fileName - 파일명
 * @param {string} fileKey - 파일 키
 * @param {string} content - 파일 내용
 */
const addToHistory = (fileName, fileKey, content) => {
    const history = getHistory();
    const existingIndex = history.findIndex(item => item.fileKey === fileKey);
    
    if (existingIndex !== -1) {
        history.splice(existingIndex, 1);
    }
    
    history.unshift({
        name: fileName,
        fileKey: fileKey,
        timestamp: Date.now(),
        preview: content ? content.substring(0, 100) : ''
    });
    
    if (history.length > 50) {
        history.splice(50);
    }
    
    setHistory(history);
    displayUploadHistory();
};

/**
 * 북마크 토글
 */
export const toggleBookmark = () => {
    const fileKey = appState.currentFileKey;
    if (!fileKey) {
        alert('파일을 먼저 열어주세요');
        return;
    }
    
    const file = getCurrentFile(appState);
    if (!file) return;
    
    const bookmarks = getBookmarks();
    if (!bookmarks[fileKey]) {
        bookmarks[fileKey] = [];
    }
    
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    
    bookmarks[fileKey].push({
        fileKey: fileKey,
        fileName: file.name,
        preview: `읽던 위치 (${new Date().toLocaleTimeString()})`,
        position: scrollPercent,
        timestamp: Date.now()
    });
    
    setBookmarks(bookmarks);
    displayUploadBookmarks();
    alert('북마크가 추가되었습니다.');
};

/**
 * 줄바꿈 모드 토글
 */
export const toggleWrapMode = () => {
    const viewer = document.getElementById('viewerContent');
    const btn = document.getElementById('wrapModeBtn');
    
    if (!viewer) return;
    
    const currentMode = appState.wrapMode;
    const newMode = currentMode === 'auto' ? 'original' : 'auto';
    
    updateState((state) => setWrapMode(state, newMode));
    
    const styles = getWrapModeStyles(newMode);
    Object.entries(styles).forEach(([prop, value]) => {
        viewer.style[prop] = value;
    });
    
    if (btn) {
        btn.textContent = `줄바꿈: ${newMode === 'auto' ? '자동' : '원본'}`;
    }
    
    localStorage.setItem('wrapMode', newMode);
    return newMode;
};

/**
 * 업로드 섹션 토글
 */
export const toggleUploadSection = () => {
    const container = document.getElementById('uploadAreaContainer');
    const btnText = document.getElementById('uploadToggleText');
    if (!container) return;
    
    if (container.classList.contains('translate-y-0')) {
        container.classList.remove('translate-y-0');
        container.classList.add('-translate-y-full');
        if (btnText) btnText.textContent = '패널 펼치기';
    } else {
        container.classList.remove('-translate-y-full');
        container.classList.add('translate-y-0');
        if (btnText) btnText.textContent = '패널 접기';
    }
};

/**
 * 히스토리 표시 (기존 로직 재사용)
 */
export const displayUploadHistory = () => {
    // 기존 viewer.js의 displayUploadHistory 로직 재사용
    if (window.displayUploadHistoryOriginal) {
        window.displayUploadHistoryOriginal();
    }
};

/**
 * 북마크 표시 (기존 로직 재사용)
 */
export const displayUploadBookmarks = () => {
    // 기존 viewer.js의 displayUploadBookmarks 로직 재사용
    if (window.displayUploadBookmarksOriginal) {
        window.displayUploadBookmarksOriginal();
    }
};

/**
 * 파일 선택
 */
export const selectFiles = () => {
    document.getElementById('file-input').click();
};

/**
 * 설정 패널 토글
 */
export const toggleSettings = () => {
    const panel = document.getElementById('settingsPanel');
    const grid = document.getElementById('uploadSectionContent');
    const btn = document.getElementById('settingsToggleBtn');
    
    if (panel && grid) {
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            grid.classList.add('hidden');
            if (btn) btn.innerHTML = '📂 불러오기';
        } else {
            panel.classList.add('hidden');
            grid.classList.remove('hidden');
            if (btn) btn.innerHTML = '⚙️ 설정';
        }
    }
};

/**
 * 히스토리 섹션 토글
 */
export const toggleHistorySection = () => {
    const section = document.getElementById('historySectionContent');
    if (section) section.classList.toggle('hidden');
};

/**
 * 북마크 섹션 토글
 */
export const toggleBookmarksSection = () => {
    const section = document.getElementById('bookmarksSectionContent');
    if (section) section.classList.toggle('hidden');
};

/**
 * 스타일 업데이트 함수들 (기존 로직 재사용)
 */
export const updateMarkdownStyles = () => {
    if (window.updateMarkdownStylesOriginal) {
        window.updateMarkdownStylesOriginal();
    }
};

export const updateBodyStyles = () => {
    if (window.updateBodyStylesOriginal) {
        window.updateBodyStylesOriginal();
    }
};

export const updateTextStroke = () => {
    if (window.updateTextStrokeOriginal) {
        window.updateTextStrokeOriginal();
    }
};

export const updateViewerWidth = () => {
    if (window.updateViewerWidthOriginal) {
        window.updateViewerWidthOriginal();
    }
};

export const toggleFullWidth = () => {
    if (window.toggleFullWidthOriginal) {
        window.toggleFullWidthOriginal();
    }
};

export const restoreMarkdownStyles = () => {
    if (window.restoreMarkdownStylesOriginal) {
        window.restoreMarkdownStylesOriginal();
    }
};

export const restoreBodyStyles = () => {
    if (window.restoreBodyStylesOriginal) {
        window.restoreBodyStylesOriginal();
    }
};

export const restoreViewerWidth = () => {
    if (window.restoreViewerWidthOriginal) {
        window.restoreViewerWidthOriginal();
    }
};

export const restoreWrapMode = () => {
    const savedMode = localStorage.getItem('wrapMode') || 'auto';
    updateState((state) => setWrapMode(state, savedMode));
    
    const viewer = document.getElementById('viewerContent');
    const btn = document.getElementById('wrapModeBtn');
    
    if (viewer) {
        const styles = getWrapModeStyles(savedMode);
        Object.entries(styles).forEach(([prop, value]) => {
            viewer.style[prop] = value;
        });
    }
    
    if (btn) {
        btn.textContent = `줄바꿈: ${savedMode === 'auto' ? '자동' : '원본'}`;
    }
};

// Getter 함수들 (하위 호환성)
export const getFiles = () => [...appState.files];
export const setFiles = (files) => {
    updateState((state) => setFiles(state, files));
};
export const getCurrentFileIndex = () => appState.currentFileIndex;
export const setCurrentFileIndex = (index) => {
    updateState((state) => setCurrentFileIndex(state, index));
};

