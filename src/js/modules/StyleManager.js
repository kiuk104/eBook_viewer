/**
 * 에이전트 1 제안: 클래스 기반 모듈 패턴
 * 
 * 스타일 관리 전담 클래스
 * 단일 책임: 마크다운/본문/뷰어 스타일 관리 및 적용
 */

/**
 * 스타일 관리자 클래스
 * 마크다운, 본문, 뷰어 스타일을 관리하고 동적 스타일을 적용합니다.
 */
export class StyleManager {
    /**
     * @private
     * @type {HTMLElement | null}
     */
    #viewerElement = null;

    /**
     * @private
     * @type {HTMLElement | null}
     */
    #containerElement = null;

    /**
     * @private
     * @type {HTMLElement | null}
     */
    #styleElement = null;

    /**
     * 생성자
     * @param {string} viewerId - 뷰어 요소 ID
     * @param {string} containerId - 컨테이너 요소 ID
     */
    constructor(viewerId = 'viewerContent', containerId = 'mainTextContainer') {
        this.#viewerElement = document.getElementById(viewerId);
        this.#containerElement = document.getElementById(containerId);
        this.#initializeStyleElement();
    }

    /**
     * 동적 스타일 요소 초기화
     * @private
     */
    #initializeStyleElement() {
        this.#styleElement = document.getElementById('dynamicHeadingStyle');
        if (!this.#styleElement) {
            this.#styleElement = document.createElement('style');
            this.#styleElement.id = 'dynamicHeadingStyle';
            document.head.appendChild(this.#styleElement);
        }
    }

    /**
     * 마크다운 스타일 업데이트
     * @param {Object} options - 스타일 옵션
     * @param {string} [options.font] - 제목 글씨체
     * @param {number} [options.size] - 제목 크기 배율
     * @param {string} [options.headingColor] - 제목 색상
     * @param {string} [options.tocColor] - 목차 색상
     */
    updateMarkdownStyles(options = {}) {
        const {
            font = 'inherit',
            size = 1.0,
            headingColor = '#2563eb',
            tocColor = '#2563eb'
        } = options;

        if (!this.#styleElement) return;

        const fontFamily = font === 'inherit' ? '' : `font-family: ${font} !important;`;
        
        // 개선된 코드 (확실한 크기 차이 + H1 강조)
        const styles = `
            #viewerContent h1 { 
                ${fontFamily} 
                font-size: calc(1em * ${size * 2.0}) !important; /* 1.4 -> 2.0 (훨씬 크게) */
                color: ${headingColor} !important; 
                border-bottom: 2px solid ${headingColor}33;
                padding-bottom: 0.3em;
                margin-top: 0.5em;
                line-height: 1.2;
                font-weight: 700; /* 굵게 */
            }
            #viewerContent h2 { 
                ${fontFamily} 
                font-size: calc(1em * ${size * 1.5}) !important; /* 1.2 -> 1.5 */
                color: ${headingColor} !important; 
                margin-top: 1.5em;
                font-weight: 600;
            }
            #viewerContent h3 { 
                ${fontFamily} 
                font-size: calc(1em * ${size * 1.1}) !important; /* 1.0 -> 1.1 (약간만 크게) */
                color: ${headingColor} !important; 
                opacity: 0.85; /* 투명도 유지 */
                margin-bottom: 0.2em;
                font-weight: normal; /* 보통 굵기 */
            }
            #viewerContent .toc a { color: ${tocColor} !important; }
        `;
        // UI 업데이트
        const sizeValueEl = document.getElementById('headingSizeValue');
        if (sizeValueEl) sizeValueEl.textContent = `${size}x`;

        // localStorage 저장
        localStorage.setItem('markdownHeadingFont', font);
        localStorage.setItem('markdownHeadingSize', size);
        localStorage.setItem('markdownHeadingColor', headingColor);
        localStorage.setItem('markdownTocColor', tocColor);
    }

    /**
     * 본문 스타일 업데이트
     * @param {Object} options - 스타일 옵션
     * @param {number} [options.lineHeight] - 줄간격
     * @param {string} [options.fontFamily] - 글씨체
     * @param {string} [options.color] - 텍스트 색상
     */
    updateBodyStyles(options = {}) {
        if (!this.#viewerElement) return;

        const {
            lineHeight = 1.8,
            fontFamily = "'Noto Sans KR', sans-serif",
            color = '#374151'
        } = options;

        this.#viewerElement.style.setProperty('--user-line-height', lineHeight, 'important');
        this.#viewerElement.style.setProperty('font-family', fontFamily, 'important');
        this.#viewerElement.style.setProperty('color', color, 'important');

        // UI 업데이트
        const lineHeightValueEl = document.getElementById('lineHeightValue');
        if (lineHeightValueEl) lineHeightValueEl.textContent = lineHeight;

        // localStorage 저장
        localStorage.setItem('bodyLineHeight', lineHeight);
        localStorage.setItem('bodyFontFamily', fontFamily);
        localStorage.setItem('bodyTextColor', color);
    }

    /**
     * 텍스트 스트로크 업데이트
     * @param {number} strokeWidth - 스트로크 두께 (px)
     */
    updateTextStroke(strokeWidth = 0) {
        if (!this.#viewerElement) return;

        this.#viewerElement.style.webkitTextStrokeWidth = `${strokeWidth}px`;
        this.#viewerElement.style.webkitTextStrokeColor = 'currentColor';

        const strokeValueEl = document.getElementById('textStrokeValue');
        if (strokeValueEl) strokeValueEl.textContent = `${strokeWidth}px`;

        localStorage.setItem('textStrokeWidth', strokeWidth);
    }

    /**
     * 뷰어 너비 업데이트
     * @param {number} width - 너비 (px)
     * @param {boolean} isFullWidth - 전체 너비 모드 여부
     */
    updateViewerWidth(width = 1400, isFullWidth = false) {
        if (!this.#containerElement) return;

        if (isFullWidth) {
            this.#containerElement.style.setProperty('max-width', '100%', 'important');
        } else {
            this.#containerElement.style.setProperty('max-width', `${width}px`, 'important');
        }

        const widthValueEl = document.getElementById('viewerWidthValue');
        if (widthValueEl) widthValueEl.innerText = `${width}px`;

        localStorage.setItem('viewerWidth', width);
        localStorage.setItem('fullWidthMode', isFullWidth.toString());
    }

    /**
     * 마크다운 스타일 복원
     */
    restoreMarkdownStyles() {
        const font = localStorage.getItem('markdownHeadingFont') || 'inherit';
        const size = parseFloat(localStorage.getItem('markdownHeadingSize') || '1.0');
        const headingColor = localStorage.getItem('markdownHeadingColor') || '#2563eb';
        const tocColor = localStorage.getItem('markdownTocColor') || '#2563eb';

        this.updateMarkdownStyles({ font, size, headingColor, tocColor });

        // UI 요소 업데이트
        const fontSelect = document.getElementById('markdownHeadingFont');
        const sizeSlider = document.getElementById('headingSizeSlider');
        const headingColorInput = document.getElementById('headingColor');
        const tocColorInput = document.getElementById('tocColor');

        if (fontSelect) fontSelect.value = font;
        if (sizeSlider) sizeSlider.value = size;
        if (headingColorInput) headingColorInput.value = headingColor;
        if (tocColorInput) tocColorInput.value = tocColor;
    }

    /**
     * 본문 스타일 복원
     */
    restoreBodyStyles() {
        const lineHeight = parseFloat(localStorage.getItem('bodyLineHeight') || '1.8');
        const fontFamily = localStorage.getItem('bodyFontFamily') || "'Noto Sans KR', sans-serif";
        const color = localStorage.getItem('bodyTextColor') || '#374151';
        const strokeWidth = parseFloat(localStorage.getItem('textStrokeWidth') || '0');

        this.updateBodyStyles({ lineHeight, fontFamily, color });
        this.updateTextStroke(strokeWidth);

        // UI 요소 업데이트
        const lineHeightSlider = document.getElementById('lineHeightSlider');
        const fontFamilySelect = document.getElementById('bodyFontFamily');
        const colorInput = document.getElementById('bodyTextColor');
        const strokeSlider = document.getElementById('textStrokeSlider');

        if (lineHeightSlider) lineHeightSlider.value = lineHeight;
        if (fontFamilySelect) fontFamilySelect.value = fontFamily;
        if (colorInput) colorInput.value = color;
        if (strokeSlider) {
            strokeSlider.value = strokeWidth;
        }
    }

    /**
     * 뷰어 너비 복원
     */
    restoreViewerWidth() {
        const width = parseInt(localStorage.getItem('viewerWidth') || '1400');
        const isFullWidth = localStorage.getItem('fullWidthMode') === 'true';

        this.updateViewerWidth(width, isFullWidth);

        // UI 요소 업데이트
        const widthSlider = document.getElementById('viewerWidthSlider');
        const fullWidthToggle = document.getElementById('fullWidthToggle');

        if (widthSlider) {
            widthSlider.value = width;
            widthSlider.disabled = isFullWidth;
        }
        if (fullWidthToggle) fullWidthToggle.checked = isFullWidth;
    }
}

