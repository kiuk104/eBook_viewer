/**
 * 에이전트 2 제안: 순수 함수형 파이프라인
 * 
 * 렌더링 함수 모듈
 * 모든 렌더링 함수는 순수 함수로 작성됩니다.
 */

/**
 * 파일명이 마크다운 파일인지 확인
 * @param {string} fileName - 파일명
 * @returns {boolean} 마크다운 파일 여부
 */
export const isMarkdownFile = (fileName) => 
    fileName.toLowerCase().endsWith('.md');

/**
 * 텍스트 내용을 HTML로 변환하는 순수 함수
 * @param {string} content - 파일 내용
 * @param {string} fileName - 파일명
 * @returns {Object} 렌더링 결과 { html, isMarkdown, wrapMode }
 */
export const convertToHTML = (content, fileName) => {
    const isMarkdown = isMarkdownFile(fileName);
    
    if (isMarkdown && typeof marked !== 'undefined') {
        return {
            html: marked.parse(content, { breaks: true, gfm: true }),
            isMarkdown: true,
            wrapMode: 'normal'
        };
    }
    
    return {
        html: escapeHTML(content),
        isMarkdown: false,
        wrapMode: 'pre-wrap'
    };
};

/**
 * HTML 이스케이프 (XSS 방지)
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 HTML
 */
const escapeHTML = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

/**
 * 줄바꿈 모드에 따른 CSS 클래스 결정
 * @param {string} wrapMode - 줄바꿈 모드 ('auto' | 'original' | 'normal')
 * @returns {Object} CSS 스타일 객체
 */
export const getWrapModeStyles = (wrapMode) => {
    const styles = {
        auto: { whiteSpace: 'pre-wrap' },
        original: { whiteSpace: 'pre' },
        normal: { whiteSpace: 'normal' }
    };
    return styles[wrapMode] || styles.auto;
};

/**
 * 렌더링 설정 객체 생성
 * @param {Object} options - 렌더링 옵션
 * @param {string} options.content - 파일 내용
 * @param {string} options.fileName - 파일명
 * @param {string} options.wrapMode - 줄바꿈 모드
 * @returns {Object} 렌더링 설정 객체
 */
export const createRenderConfig = ({ content, fileName, wrapMode = 'auto' }) => {
    const { html, isMarkdown } = convertToHTML(content, fileName);
    const wrapStyles = getWrapModeStyles(wrapMode);
    
    return {
        html,
        isMarkdown,
        className: isMarkdown ? 'markdown-mode' : '',
        styles: wrapStyles,
        wrapMode
    };
};

/**
 * DOM 렌더링 (사이드 이펙트)
 * @param {string} elementId - 대상 요소 ID
 * @param {Object} config - 렌더링 설정 객체
 * @returns {HTMLElement | null} 렌더링된 요소
 */
export const renderToDOM = (elementId, config) => {
    const element = document.getElementById(elementId);
    if (!element) return null;
    
    element.innerHTML = config.html;
    
    // 클래스 관리
    if (config.isMarkdown) {
        element.classList.add(config.className);
    } else {
        element.classList.remove('markdown-mode');
    }
    
    // 스타일 적용
    Object.entries(config.styles).forEach(([prop, value]) => {
        element.style[prop] = value;
    });
    
    return element;
};

/**
 * 렌더링 파이프라인 (함수 체이닝)
 * @param {Object} params - 렌더링 파라미터
 * @param {string} params.content - 파일 내용
 * @param {string} params.fileName - 파일명
 * @param {string} params.wrapMode - 줄바꿈 모드
 * @param {string} params.elementId - 대상 요소 ID
 * @returns {HTMLElement | null} 렌더링된 요소
 */
export const renderPipeline = (params) => {
    const { content, fileName, wrapMode, elementId } = params;
    const config = createRenderConfig({ content, fileName, wrapMode });
    return renderToDOM(elementId || 'viewerContent', config);
};

