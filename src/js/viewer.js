/**
 * 뷰어 모듈 - 클래스 기반 모듈 패턴
 * 
 * 뷰어 모듈 진입점 - 모든 관리자 클래스를 통합
 * 
 * 설계 철학:
 * - 각 클래스는 단일 책임 원칙(SRP) 준수
 * - 클래스 간 느슨한 결합 (의존성 주입 가능)
 * - 명확한 public API 제공
 * - JSDoc을 통한 타입 안정성 향상
 */

import { FileManager } from './modules/FileManager.js';
import { ContentRenderer } from './modules/ContentRenderer.js';
import { BookmarkManager } from './modules/BookmarkManager.js';
import { HistoryManager } from './modules/HistoryManager.js';
import { StyleManager } from './modules/StyleManager.js';
import { formatFileSize, formatTimestamp } from './utils.js';
import { saveReadingProgress, loadReadingProgress } from './settings.js';
import { HighlightManager } from './modules/HighlightManager.js';

/**
 * 뷰어 코디네이터 클래스
 * 모든 관리자 클래스를 조율하여 뷰어 기능을 제공합니다.
 */
export class ViewerCoordinator {
    /**
     * @private
     * @type {FileManager}
     */
    #fileManager;

    /**
     * @private
     * @type {ContentRenderer}
     */
    #renderer;

    /**
     * @private
     * @type {BookmarkManager}
     */
    #bookmarkManager;

    /**
     * @private
     * @type {HistoryManager}
     */
    #historyManager;

    /**
     * @private
     * @type {StyleManager}
     */
    #styleManager;

    /**
     * @private
     * @type {number | null}
     */
    #scrollSaveTimer = null;

    /**
     * @private
     * @type {HighlightManager}
     */    
    #highlightManager;

    /**
     * 생성자
     */
    constructor() {
        // [🚨 핵심 수정] 이 줄을 추가해서 전역에서 뷰어를 찾을 수 있게 합니다.
        window.viewer = this; 

        this.#fileManager = new FileManager();
        this.#renderer = new ContentRenderer();
        this.#bookmarkManager = new BookmarkManager();
        this.#historyManager = new HistoryManager();
        this.#styleManager = new StyleManager();
        this.#highlightManager = new HighlightManager();

        // 렌더러 초기화
        this.#renderer.setViewerElement('viewerContent');
        
        // 이벤트 리스너 설정
        this.#setupEventListeners();
    }

    /**
     * 이벤트 리스너 설정
     * @private
     */
    #setupEventListeners() {
        window.addEventListener('scroll', () => this.#handleScroll(), { passive: true });
    }

    /**
     * 스크롤 핸들러
     * @private
     */
    #handleScroll() {
        const fileKey = this.#fileManager.getCurrentFileKey();
        if (!fileKey) return;

        this.#updateProgressBar();

        if (this.#scrollSaveTimer) {
            clearTimeout(this.#scrollSaveTimer);
        }

        this.#scrollSaveTimer = setTimeout(() => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;
            const progress = scrollHeight > clientHeight
                ? (scrollTop / (scrollHeight - clientHeight)) * 100
                : 0;
            saveReadingProgress(fileKey, progress);
        }, 500);
    }

    /**
     * 진행 바 업데이트
     * @private
     */
    #updateProgressBar() {
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
    }

    /**
     * 파일 처리
     * @param {FileList} fileList - 파일 목록
     */
    processFiles(fileList) {
        const file = this.#fileManager.processFiles(fileList);
        if (!file) return;

        // UI 업데이트
        const uploadSection = document.getElementById('page-upload');
        const mainContent = document.getElementById('mainContent');
        if (uploadSection && mainContent) {
            const uploadContent = document.getElementById('uploadSectionContent');
            if (uploadContent && !uploadContent.classList.contains('hidden')) {
                this.toggleUploadSection();
            }
            mainContent.classList.remove('hidden');
        }

        this.displayFileContent(file);
    }

/**
 * 파일 내용 표시
     * @param {File} file - 파일 객체
     */
    async displayFileContent(file) {
        if (!file) return;

        // 파일 정보 표시
        const fileNameEl = document.getElementById('currentFileName');
        const fileInfoEl = document.getElementById('fileInfo');
        if (fileNameEl) fileNameEl.textContent = file.name;
        if (fileInfoEl) {
            fileInfoEl.textContent = `${formatFileSize(file.size)} | ${formatTimestamp(file.lastModified)}`;
        }

        // 파일 키 업데이트
        const fileKey = this.#fileManager.getCurrentFileKey();
        this.#bookmarkManager.setCurrentFileKey(fileKey);
        this.#highlightManager.setCurrentFileKey(fileKey);

        // 파일 내용 읽기
        let content = '';
        if (typeof file.content === 'string') {
            content = file.content;
            this.#renderContent(content, file.name);
    } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                content = e.target.result;
                file.content = content; // 파일 객체에 저장
                this.#renderContent(content, file.name);
                this.#historyManager.addHistoryItem(file.name, fileKey, content);
            };
            reader.readAsText(file);
            return;
        }

        this.#historyManager.addHistoryItem(file.name, fileKey, content);
    }

    /**
     * 현재 보고 있는 파일 다운로드 (내용 보장)
     */
    downloadCurrentFile() {
        const file = this.#fileManager.getCurrentFile();
        
        // 1. 파일이나 내용이 없으면 중단
        if (!file || !file.content) {
            alert('저장할 내용이 없습니다.');
            return;
        }

        // 2. 현재 메모리에 있는 텍스트(file.content)로 새로운 Blob 생성
        // (이 과정이 있어야 빈 파일이 되지 않습니다)
        const blob = new Blob([file.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        // 3. 가짜 링크를 만들어 다운로드 실행
        const a = document.createElement('a');
        a.href = url;
        // 파일명이 .md로 안 끝나면 붙여줌
        a.download = file.name.endsWith('.md') ? file.name : file.name + '.md';
        
        document.body.appendChild(a);
        a.click();
        
        // 4. 뒷정리
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 콘텐츠 렌더링
     * @private
     * @param {string} content - 파일 내용
     * @param {string} fileName - 파일명
     */
    #renderContent(content, fileName) {
        const wrapMode = localStorage.getItem('wrapMode') || 'auto';
        this.#renderer.render(content, fileName, { wrapMode });

        // 읽기 위치 복원
        this.#restoreReadingPosition();

        // 하이라이트 복원 (별도 모듈에서 처리)
        setTimeout(() => {
            if (window.restoreHighlights) {
                window.restoreHighlights();
            }
        }, 100);

        // 진행 바 업데이트
        setTimeout(() => this.#updateProgressBar(), 100);

        // 북마크 목록 새로고침
        this.#bookmarkManager.displayBookmarks();
    }

    /**
     * 읽기 위치 복원
     * @private
     */
    #restoreReadingPosition() {
        const fileKey = this.#fileManager.getCurrentFileKey();
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
                this.#updateProgressBar();
            }, 150);
        }
    }

    // === Public API ===
    // [Public API 메서드 추가]
    applyHighlight(range, color) {
        return this.#highlightManager.addHighlight(range, color);
    }

    removeHighlight(element) {
        this.#highlightManager.removeHighlight(element);
    }

    /**
     * 북마크 토글 (현재 위치에 북마크 추가)
     */
    toggleBookmark() {
        try {
            const fileName = this.#fileManager.getCurrentFileName();
            const bookmark = this.#bookmarkManager.addBookmark({ fileName });
            this.#bookmarkManager.displayBookmarks();
            alert('북마크가 추가되었습니다.');
        } catch (error) {
            alert(error.message);
        }
    }

    /**
     * 줄바꿈 모드 토글
     * @returns {string} 새 모드
     */
    toggleWrapMode() {
        const newMode = this.#renderer.toggleWrapMode();
        const btn = document.getElementById('wrapModeBtn');
        if (btn) {
            btn.textContent = `줄바꿈: ${newMode === 'auto' ? '자동' : '원본'}`;
        }
        return newMode;
    }

    /**
     * 업로드 섹션 토글
     */
    toggleUploadSection() {
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
    }

    /**
     * 히스토리 표시
     */
    displayUploadHistory() {
        this.#historyManager.displayHistory();
    }

    /**
     * 북마크 표시
     */
    displayUploadBookmarks() {
        this.#bookmarkManager.displayBookmarks();
    }

    /**
     * 파일 선택
     */
    selectFiles() {
        this.#fileManager.selectFiles();
    }

    /**
     * 설정 패널 토글
     */
    toggleSettings() {
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
}

/**
     * 히스토리 섹션 토글
     */
    toggleHistorySection() {
        const section = document.getElementById('historySectionContent');
        if (section) section.classList.toggle('hidden');
    }

    /**
     * 북마크 섹션 토글
     */
    toggleBookmarksSection() {
        const section = document.getElementById('bookmarksSectionContent');
        if (section) section.classList.toggle('hidden');
    }

    /**
     * 마크다운 스타일 업데이트
     */
    updateMarkdownStyles() {
        const fontSelect = document.getElementById('markdownHeadingFont');
        const sizeSlider = document.getElementById('headingSizeSlider');
        const headingColor = document.getElementById('headingColor');
        const tocColor = document.getElementById('tocColor');

        if (!fontSelect) return;

        this.#styleManager.updateMarkdownStyles({
            font: fontSelect.value,
            size: sizeSlider ? parseFloat(sizeSlider.value) : 1.0,
            headingColor: headingColor ? headingColor.value : '#2563eb',
            tocColor: tocColor ? tocColor.value : '#2563eb'
        });
    }

    /**
     * 본문 스타일 업데이트
     */
    updateBodyStyles() {
        const lineHeightSlider = document.getElementById('lineHeightSlider');
        const fontFamilySelect = document.getElementById('bodyFontFamily');
        const colorInput = document.getElementById('bodyTextColor');

        if (!lineHeightSlider || !fontFamilySelect || !colorInput) return;

        this.#styleManager.updateBodyStyles({
            lineHeight: parseFloat(lineHeightSlider.value),
            fontFamily: fontFamilySelect.value,
            color: colorInput.value
        });
    }

    /**
     * 텍스트 스트로크 업데이트
     */
    updateTextStroke() {
        const slider = document.getElementById('textStrokeSlider');
        if (slider) {
            this.#styleManager.updateTextStroke(parseFloat(slider.value));
        }
    }

    /**
     * 뷰어 너비 업데이트
     */
    updateViewerWidth() {
        const slider = document.getElementById('viewerWidthSlider');
        const toggle = document.getElementById('fullWidthToggle');
        
        if (slider) {
            const isFullWidth = toggle ? toggle.checked : false;
            this.#styleManager.updateViewerWidth(
                parseInt(slider.value),
                isFullWidth
            );
        }
    }

    /**
     * 전체 너비 모드 토글
     */
    toggleFullWidth() {
        const toggle = document.getElementById('fullWidthToggle');
        const slider = document.getElementById('viewerWidthSlider');
        
        if (toggle && slider) {
            const isFullWidth = toggle.checked;
            slider.disabled = isFullWidth;
            this.updateViewerWidth();
        }
    }

    /**
     * 마크다운 스타일 복원
     */
    restoreMarkdownStyles() {
        this.#styleManager.restoreMarkdownStyles();
    }

    /**
     * 본문 스타일 복원
     */
    restoreBodyStyles() {
        this.#styleManager.restoreBodyStyles();
    }

    /**
     * 뷰어 너비 복원
     */
    restoreViewerWidth() {
        this.#styleManager.restoreViewerWidth();
    }

    /**
     * 줄바꿈 모드 복원
     */
    restoreWrapMode() {
        const savedMode = localStorage.getItem('wrapMode') || 'auto';
        this.#renderer.restoreWrapMode(savedMode);
        
        const btn = document.getElementById('wrapModeBtn');
        if (btn) {
            btn.textContent = `줄바꿈: ${savedMode === 'auto' ? '자동' : '원본'}`;
        }
    }

    // === Getter 메서드 (하위 호환성) ===

    /**
     * 파일 배열 가져오기
     * @returns {File[]}
     */
    getFiles() {
        return this.#fileManager.getFiles();
    }

    /**
     * 파일 배열 설정
     * @param {File[]} files
     */
    setFiles(files) {
        this.#fileManager.setFiles(files);
    }

    /**
     * 현재 파일 인덱스 가져오기
     * @returns {number}
     */
    getCurrentFileIndex() {
        return this.#fileManager.getCurrentFileIndex();
    }

    /**
     * 현재 파일 인덱스 설정
     * @param {number} index
     */
    setCurrentFileIndex(index) {
        this.#fileManager.setCurrentFileIndex(index);
    }

    /**
     * 현재 파일 키 가져오기
     * @returns {string | null}
     */
    getCurrentFileKey() {
        return this.#fileManager.getCurrentFileKey();
    }

    /**
     * 현재 파일 키 설정
     * @param {string} fileKey
     */
    setCurrentFileKey(fileKey) {
        this.#fileManager.setCurrentFileKey(fileKey);
        this.#bookmarkManager.setCurrentFileKey(fileKey);
    }
    // ▼▼▼ [viewer.getCurrentFileName() 호출이 정상적으로 FileManager로 연결 추가] ▼▼▼
    /**
     * 현재 파일명 가져오기
     * @returns {string}
     */
    getCurrentFileName() {
        return this.#fileManager.getCurrentFileName();
    }
    // ▲▲▲ [추가 끝] ▲▲▲
}

// 싱글톤 인스턴스 생성 및 export
let viewerInstance = null;

/**
 * 뷰어 인스턴스 가져오기 (싱글톤)
 * @returns {ViewerCoordinator}
 */
export function getViewerInstance() {
    if (!viewerInstance) {
        viewerInstance = new ViewerCoordinator();
    }
    return viewerInstance;
}

// 기존 export 함수들 (하위 호환성 유지)
const viewer = getViewerInstance();

export const processFiles = (fileList) => viewer.processFiles(fileList);
export const displayFileContent = (file) => viewer.displayFileContent(file);
export const toggleBookmark = () => viewer.toggleBookmark();
export const toggleWrapMode = () => viewer.toggleWrapMode();
export const toggleUploadSection = () => viewer.toggleUploadSection();
export const displayUploadHistory = () => viewer.displayUploadHistory();
export const displayUploadBookmarks = () => viewer.displayUploadBookmarks();
export const selectFiles = () => viewer.selectFiles();
export const toggleSettings = () => viewer.toggleSettings();
export const toggleHistorySection = () => viewer.toggleHistorySection();
export const toggleBookmarksSection = () => viewer.toggleBookmarksSection();
export const updateMarkdownStyles = () => viewer.updateMarkdownStyles();
export const updateBodyStyles = () => viewer.updateBodyStyles();
export const updateTextStroke = () => viewer.updateTextStroke();
export const updateViewerWidth = () => viewer.updateViewerWidth();
export const toggleFullWidth = () => viewer.toggleFullWidth();
export const restoreMarkdownStyles = () => viewer.restoreMarkdownStyles();
export const restoreBodyStyles = () => viewer.restoreBodyStyles();
export const restoreViewerWidth = () => viewer.restoreViewerWidth();
export const restoreWrapMode = () => viewer.restoreWrapMode();
export const getFiles = () => viewer.getFiles();
export const setFiles = (files) => viewer.setFiles(files);
export const getCurrentFileIndex = () => viewer.getCurrentFileIndex();
export const setCurrentFileIndex = (index) => viewer.setCurrentFileIndex(index);

// 추가 export 함수들
export const downloadAsMarkdown = () => {
    // 현재 파일 내용을 마크다운으로 다운로드
    const viewerElement = document.getElementById('viewerContent');
    const fileName = viewer.getCurrentFileName();
    if (viewerElement && fileName) {
        const content = viewerElement.textContent || viewerElement.innerHTML;
        const isHtml = viewerElement.innerHTML !== viewerElement.textContent;
        
        // utils.js의 downloadAsMarkdown 함수 사용
        import('./utils.js').then(module => {
            module.downloadAsMarkdown(content, fileName, isHtml);
        });
    } else {
        alert('다운로드할 내용이 없습니다.');
    }
};

export const handleAIClean = async () => {
    // 1. 현재 파일 가져오기
    const files = viewer.getFiles();
    const currentIndex = viewer.getCurrentFileIndex();
    
    if (currentIndex === -1 || !files[currentIndex]) {
        alert('변환할 파일이 없습니다.');
        return;
    }

    const currentFile = files[currentIndex];
    const content = currentFile.content; 
    
    if (!content) {
        alert('변환할 텍스트 내용이 비어있습니다. 파일을 다시 열어주세요.');
        return;
    }
    
    if (confirm('AI 변환을 시작하시겠습니까? 시간이 걸릴 수 있습니다.')) {
        try {
            const aiService = await import('./ai_service.js');
            // 진행 상황 콜백과 함께 AI 요청
            const cleanedText = await aiService.cleanTextWithAI(content, (progress) => {
                console.log(progress);
            });
            
            // [핵심] 확장자를 .md로 변경한 '새로운 파일 객체' 생성
            const newFileName = currentFile.name.replace(/\.[^/.]+$/, "") + ".md";
            const newFile = new File([cleanedText], newFileName, { type: "text/markdown" });
            newFile.content = cleanedText; // 내용 강제 주입

            // 파일 목록 교체
            const newFiles = [...files];
            newFiles[currentIndex] = newFile;
            viewer.setFiles(newFiles);

            // 화면 갱신 (마크다운 모드로 렌더링됨)
            viewer.displayFileContent(newFile);
            
            alert('AI 변환이 완료되었습니다! (마크다운 포맷 적용됨)');
            
        } catch (error) {
            console.error('AI 변환 오류:', error);
            alert('AI 변환 중 오류가 발생했습니다: ' + error.message);
        }
    }

};export const toggleFavorite = () => {
    // 즐겨찾기 토글 (북마크와 유사한 기능)
    alert('즐겨찾기 기능은 곧 추가될 예정입니다.');
};export const resetAllSettings = () => {
    if (confirm('모든 설정을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        localStorage.clear();
        alert('모든 설정이 초기화되었습니다. 페이지를 새로고침합니다.');
        window.location.reload();
    }
};

export const exportData = () => {
    // 데이터 내보내기
    const data = {
        bookmarks: localStorage.getItem('readerBookmarks'),
        history: localStorage.getItem('readerHistory'),
        settings: {
            theme: localStorage.getItem('readerTheme'),
            fontSize: localStorage.getItem('readerFontSize'),
        },
        version: '0.2.4.5',
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebook_viewer_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importData = () => {
    const input = document.getElementById('importDataInput');
    if (input) {
        input.click();
    }
};

export const handleImportDataFile = (file) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.bookmarks) localStorage.setItem('readerBookmarks', data.bookmarks);
            if (data.history) localStorage.setItem('readerHistory', data.history);
            if (data.settings) {
                if (data.settings.theme) localStorage.setItem('readerTheme', data.settings.theme);
                if (data.settings.fontSize) localStorage.setItem('readerFontSize', data.settings.fontSize);
            }
            
            alert('데이터를 성공적으로 불러왔습니다. 페이지를 새로고침합니다.');
            window.location.reload();
        } catch (error) {
            alert('데이터 불러오기 실패: ' + error.message);
        }
    };
    reader.readAsText(file);
};

// 컨텍스트 메뉴 관련 변수
let lastSelectionRange = null;
let activeHighlightSpan = null;

/**
 * 컨텍스트 메뉴 표시 위치 설정
 * @param {number} x - X 좌표
 * @param {number} y - Y 좌표
 */
function showMenuAt(x, y) {
    const contextMenu = document.getElementById('contextMenu');
    if (!contextMenu) return;
    
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.classList.remove('hidden');
}

/**
 * 컨텍스트 메뉴 숨기기
 */
function hideContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
        contextMenu.classList.add('hidden');
    }
    activeHighlightSpan = null;
}

/**
 * 텍스트 선택 영역 저장 (mouseup 이벤트)
 */
function handleMouseUp() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
        lastSelectionRange = selection.getRangeAt(0).cloneRange();
        console.log('✅ mouseup: 선택 영역 자동 저장됨 (' + selection.toString().trim().length + '자)');
    }
}

/**
 * 컨텍스트 메뉴 핸들러 (우클릭 이벤트)
 * @param {MouseEvent} e - 마우스 이벤트
 */
/**
 * 우클릭 컨텍스트 메뉴 처리 핸들러
 * - 하이라이트 위에서 클릭 시: 삭제 버튼 표시 + 일반 메뉴 유지
 * - 텍스트 선택 시: 형광펜 팔레트 표시
 */
function handleContextMenu(e) {
    // Ctrl 키를 누른 상태라면 브라우저 기본 메뉴 허용
    if (e.ctrlKey) return;

    e.preventDefault();

    const contextMenu = document.getElementById('contextMenu');
    const ctxRemoveHighlight = document.getElementById('ctxRemoveHighlight');
    const highlightPalette = document.getElementById('highlightPalette');
    const normalMenuOptions = document.getElementById('normalMenuOptions'); // 일반 메뉴 그룹 ID

    if (!contextMenu) return;

    // 1. 클릭 타겟 확인 (하이라이트된 스팬인지?)
    const target = e.target;
    const isHighlight = target.classList.contains('highlight-span');
    
    // 전역 변수에 현재 선택된 하이라이트 요소 저장 (삭제 기능을 위해)
    activeHighlightSpan = isHighlight ? target : null;

    // 2. [수정 핵심] 메뉴 표시 로직 변경
    
    // (A) 하이라이트 삭제 버튼: 하이라이트 위에서만 보임
    if (ctxRemoveHighlight) {
        if (isHighlight) {
            ctxRemoveHighlight.classList.remove('hidden');
            ctxRemoveHighlight.classList.add('flex'); // flex로 보여야 아이콘 정렬됨
        } else {
            ctxRemoveHighlight.classList.add('hidden');
            ctxRemoveHighlight.classList.remove('flex');
        }
    }

    // (B) 형광펜 팔레트: 텍스트가 드래그(선택)되어 있을 때만 보임
    const selection = window.getSelection();
    const hasSelection = selection.toString().trim().length > 0;
    
    if (highlightPalette) {
        if (hasSelection) {
            highlightPalette.classList.remove('hidden');
            highlightPalette.classList.add('flex');
            
            // 드래그된 텍스트 범위 저장 (형광펜 칠하기 위해)
            if (selection.rangeCount > 0) {
                lastSelectionRange = selection.getRangeAt(0).cloneRange();
            }
    } else {
            // 선택된 텍스트가 없으면 팔레트 숨김
            highlightPalette.classList.add('hidden');
            highlightPalette.classList.remove('flex');
            lastSelectionRange = null;
        }
    }

    // (C) [해결] 일반 메뉴(북마크 등)는 항상 보임
    // 기존 코드에서 여기서 else { hide() } 처리를 해서 안 보였던 것입니다.
    if (normalMenuOptions) {
        normalMenuOptions.classList.remove('hidden');
    }

    // 3. 메뉴 위치 계산 (화면 밖으로 나가지 않도록)
    const x = e.clientX;
    const y = e.clientY;
    
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    
    // 메뉴 표시
    contextMenu.classList.remove('hidden');

    // 화면 오른쪽/아래 넘침 방지 로직
    const rect = contextMenu.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) {
        contextMenu.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (y + rect.height > window.innerHeight) {
        contextMenu.style.top = `${window.innerHeight - rect.height - 10}px`;
    }
}

/**
 * 컨텍스트 메뉴 이벤트 리스너 설정
 */
export function setupContextMenuListener() {
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
        viewerContent.addEventListener('mouseup', handleMouseUp);
        console.log('✅ 커스텀 컨텍스트 메뉴 활성화됨');
    } else {
        console.log('⚠️ 커스텀 컨텍스트 메뉴 비활성화됨 - 브라우저 기본 메뉴 사용');
    }
}

/**
 * 컨텍스트 메뉴 설정 복원
 */
export const restoreContextMenuSetting = () => {
    const enabled = localStorage.getItem('contextMenuEnabled') !== 'false';
    
    // 두 토글 모두 동기화
    const toggleSettings = document.getElementById('ctxMenuSettingsToggle');
    const toggleInternal = document.getElementById('ctxMenuInternalToggle');
    
    if (toggleSettings) toggleSettings.checked = enabled;
    if (toggleInternal) toggleInternal.checked = enabled;
    
    console.log(`🔄 컨텍스트 메뉴 설정 복원: ${enabled ? '활성화' : '비활성화'}`);
};

/**
 * 컨텍스트 메뉴 설정 토글
 * @param {string} id - 토글 ID
 */
export const toggleContextMenuSetting = (id) => {
    const toggleSettings = document.getElementById('ctxMenuSettingsToggle');
    const toggleInternal = document.getElementById('ctxMenuInternalToggle');
    
    // 클릭된 토글의 상태를 가져옴
    const clickedToggle = document.getElementById(id);
    const enabled = clickedToggle ? clickedToggle.checked : true;
    
    console.log(`🔄 토글 클릭: ${id}, 새 값: ${enabled}`);
    
    // localStorage에 저장
    localStorage.setItem('contextMenuEnabled', enabled.toString());
    
    // 두 토글 모두 동기화
    if (toggleSettings) toggleSettings.checked = enabled;
    if (toggleInternal) toggleInternal.checked = enabled;
    
    // 설정 변경 시 컨텍스트 메뉴 리스너 재등록
    setupContextMenuListener();
    console.log(`✅ 컨텍스트 메뉴 설정 완료: ${enabled ? '활성화' : '비활성화'}`);
};

// 컨텍스트 메뉴 항목 클릭 이벤트 설정
function setupContextMenuItems() {
    // 북마크 추가
    const ctxBookmark = document.getElementById('ctxBookmark');
    if (ctxBookmark) {
        ctxBookmark.addEventListener('click', () => {
            toggleBookmark();
            hideContextMenu();
        });
    }
    
    // 각주/메모 달기
    const ctxNote = document.getElementById('ctxNote');
    if (ctxNote) {
        ctxNote.addEventListener('click', () => {
            alert('각주/메모 기능은 곧 추가될 예정입니다.');
            hideContextMenu();
        });
    }
    
    // 텍스트 공유
    const ctxShare = document.getElementById('ctxShare');
    if (ctxShare) {
        ctxShare.addEventListener('click', () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();
            if (text) {
                navigator.clipboard.writeText(text).then(() => {
                    alert('텍스트가 클립보드에 복사되었습니다.');
                }).catch(() => {
                    alert('텍스트 복사 실패');
                });
            } else {
                alert('공유할 텍스트를 선택해주세요.');
            }
            hideContextMenu();
        });
    }
    
    // 뷰어 설정
    const ctxSettings = document.getElementById('ctxSettings');
    if (ctxSettings) {
        ctxSettings.addEventListener('click', () => {
            toggleSettings();
            hideContextMenu();
        });
    }
    
    // 패널 펼치기
    const ctxExpandPanel = document.getElementById('ctxExpandPanel');
    if (ctxExpandPanel) {
        ctxExpandPanel.addEventListener('click', () => {
            toggleUploadSection();
            hideContextMenu();
        });
    }
    
    // [수정 1] 하이라이트 삭제 로직 (기능 연결)
    const ctxRemoveHighlight = document.getElementById('ctxRemoveHighlight');
    if (ctxRemoveHighlight) {
        ctxRemoveHighlight.addEventListener('click', () => {
            if (activeHighlightSpan) {
                // [변경] 단순히 태그만 지우는 게 아니라 매니저를 통해 데이터까지 삭제
                if (window.viewer) {
                    window.viewer.removeHighlight(activeHighlightSpan);
                } else if (typeof viewer !== 'undefined') {
                    viewer.removeHighlight(activeHighlightSpan);
                }
                
                activeHighlightSpan = null;
                hideContextMenu();
            }
        });
    }

    // [수정 2] 형광펜 팔레트 로직 (기능 연결)
        const highlightPalette = document.getElementById('highlightPalette');
        if (highlightPalette) {
            highlightPalette.addEventListener('click', (e) => {
                const button = e.target.closest('button[data-color]');
                if (button) {
                    const color = button.dataset.color;
                    
                    // [변경] console.log만 있던 부분을 실제 로직으로 교체
                    if (lastSelectionRange) {
                        // viewer 인스턴스를 통해 하이라이트 적용
                        if (window.viewer) {
                            window.viewer.applyHighlight(lastSelectionRange, color);
                        } else if (typeof viewer !== 'undefined') {
                            viewer.applyHighlight(lastSelectionRange, color);
                        }
                        lastSelectionRange = null; // 사용 후 초기화
                    } else {
                        alert('텍스트를 먼저 선택해주세요.');
                    }
                    
                    hideContextMenu();            }
            });
    }
    // setupContextMenuItems 함수 내부

    // [추가] 다운로드 버튼 이벤트 연결
    const ctxDownload = document.getElementById('ctxDownload');
    if (ctxDownload) {
        ctxDownload.addEventListener('click', () => {
            if (window.viewer) {
                window.viewer.downloadCurrentFile();
            }
            hideContextMenu();
        });
    }
    
}

// DOM 로드 후 메뉴 항목 이벤트 설정
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupContextMenuItems);
} else {
    setupContextMenuItems();

// [기존 저장 버튼 수리 완료]
// 확인된 ID: downloadMdBtn
document.addEventListener('DOMContentLoaded', () => {
    const existingSaveBtn = document.getElementById('downloadMdBtn'); // ID 수정됨
    
    if (existingSaveBtn) {
        // 기존의 downloadAsMarkdown() 함수 호출을 막고, 새로운 저장 기능으로 교체
        existingSaveBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation(); 
            
            if (window.viewer) {
                // 내용이 보장된 강력한 저장 함수 호출
                window.viewer.downloadCurrentFile(); 
                console.log('💾 상단 버튼으로 파일 저장 완료');
            } else {
                alert('뷰어가 초기화되지 않았습니다.');
            }
        };
    }
});

}