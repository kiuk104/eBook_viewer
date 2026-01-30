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
     * 생성자
     */
    constructor() {
        this.#fileManager = new FileManager();
        this.#renderer = new ContentRenderer();
        this.#bookmarkManager = new BookmarkManager();
        this.#historyManager = new HistoryManager();
        this.#styleManager = new StyleManager();

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
    // AI 변환 처리
    const viewerElement = document.getElementById('viewerContent');
    const content = viewerElement ? viewerElement.textContent : '';
    
    if (!content) {
        alert('변환할 텍스트가 없습니다.');
        return;
    }
    
    if (confirm('AI 변환을 시작하시겠습니까? 시간이 걸릴 수 있습니다.')) {
        try {
            const aiService = await import('./ai_service.js');
            const cleanedText = await aiService.cleanTextWithAI(content, (progress) => {
                console.log(progress);
                // 진행 상황 표시 (선택사항)
            });
            
            // 변환된 내용으로 업데이트
            viewer.displayContent(cleanedText, viewer.getCurrentFileName());
            alert('AI 변환이 완료되었습니다!');
        } catch (error) {
            console.error('AI 변환 오류:', error);
            alert('AI 변환 중 오류가 발생했습니다: ' + error.message);
        }
    }
};

export const toggleFavorite = () => {
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
        version: '0.2.4.1',
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

export const restoreContextMenuSetting = () => {
    const setting = localStorage.getItem('ctxMenuInternalToggle');
    const toggle = document.getElementById('ctxMenuInternalToggle');
    if (toggle && setting !== null) {
        toggle.checked = setting === 'true';
    }
};

export const toggleContextMenuSetting = (id) => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
        localStorage.setItem(id, checkbox.checked.toString());
    }
};
