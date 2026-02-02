/**
 * 에이전트 1 제안: 클래스 기반 모듈 패턴
 * 
 * 콘텐츠 렌더링 전담 클래스
 * 단일 책임: 파일 내용을 HTML로 렌더링, 마크다운 처리
 */

/**
 * 콘텐츠 렌더러 클래스
 * 텍스트 및 마크다운 파일을 HTML로 변환하여 표시합니다.
 */
export class ContentRenderer {
    /**
     * @private
     * @type {HTMLElement | null}
     */
    #viewerElement = null;

    /**
     * @private
     * @type {boolean}
     */
    #isMarkdownMode = false;

    /**
     * @private
     * @type {boolean | null}
     * 외부 디버깅 서비스 사용 가능 여부 (null: 미확인, true: 사용 가능, false: 사용 불가)
     */
    #debugServiceAvailable = null;

    /**
     * 뷰어 요소 설정
     * @param {string} elementId - 뷰어 요소 ID (기본: 'viewerContent')
     */
    setViewerElement(elementId = 'viewerContent') {
        this.#viewerElement = document.getElementById(elementId);
    }

    /**
     * 마크다운 모드 여부 확인
     * @returns {boolean} 마크다운 모드 여부
     */
    isMarkdownMode() {
        return this.#isMarkdownMode;
    }

    /**
     * 파일명으로 파일 타입 판단
     * @param {string} fileName - 파일명
     * @returns {boolean} 마크다운 파일 여부
     */
    #isMarkdownFile(fileName) {
        return fileName.toLowerCase().endsWith('.md');
    }

    /**
     * 콘텐츠 렌더링
     * @param {string} content - 파일 내용
     * @param {string} fileName - 파일명
     * @param {Object} options - 렌더링 옵션
     * @param {boolean} [options.wrapMode='auto'] - 줄바꿈 모드 ('auto' | 'original')
     */
    render(content, fileName, options = {}) {
        // 디버깅 로그 전송 (조건부)
        this.#sendDebugLog({
            location: 'ContentRenderer.js:57',
            message: 'render entry',
            data: {
                hasViewerElement: !!this.#viewerElement,
                fileName: fileName,
                fileNameType: typeof fileName,
                contentLength: content?.length,
                hasMarked: typeof marked !== 'undefined'
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'H1,H5'
        });
        
        if (!this.#viewerElement) {
            console.error('뷰어 요소가 설정되지 않았습니다.');
            return;
        }

        const { wrapMode = 'auto' } = options;
        this.#isMarkdownMode = this.#isMarkdownFile(fileName);
        
        // 디버깅 로그 전송 (조건부)
        this.#sendDebugLog({
            location: 'ContentRenderer.js:64',
            message: 'Markdown mode check',
            data: {
                isMarkdownMode: this.#isMarkdownMode,
                fileName: fileName,
                willRenderMarkdown: this.#isMarkdownMode && typeof marked !== 'undefined'
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'H1,H5'
        });

        if (this.#isMarkdownMode && typeof marked !== 'undefined') {
            this.#renderMarkdown(content);
        } else {
            this.#renderText(content, wrapMode);
        }
    }

    /**
     * 외부 디버깅 서비스 사용 가능 여부 확인 (1회만 체크)
     * @private
     * @returns {Promise<boolean>} 서비스 사용 가능 여부
     */
    async #checkDebugService() {
        // 이미 확인했으면 캐시된 값 반환
        if (this.#debugServiceAvailable !== null) {
            return this.#debugServiceAvailable;
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 500); // 0.5초 타임아웃
            
            const response = await fetch('http://127.0.0.1:7242/health', {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            this.#debugServiceAvailable = response.ok;
        } catch (error) {
            // 연결 실패 시 디버깅 서비스 사용 안 함 (에러 로그 없음)
            this.#debugServiceAvailable = false;
        }
        
        return this.#debugServiceAvailable;
    }

    /**
     * 디버깅 로그 전송 (조건부)
     * @private
     * @param {Object} logData - 로그 데이터
     */
    async #sendDebugLog(logData) {
        const serviceAvailable = await this.#checkDebugService();
        if (serviceAvailable) {
            fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData)
            }).catch(() => {}); // 에러 무시
        }
    }

    /**
     * 마크다운 렌더링
     * @private
     * @param {string} content - 마크다운 내용
     */
    async #renderMarkdown(content) {
        if (!this.#viewerElement) return;

        try {
            const html = marked.parse(content, {
                breaks: true,
                gfm: true
            });
            
            // 디버깅 로그 전송 (조건부)
            this.#sendDebugLog({
                location: 'ContentRenderer.js:88',
                message: 'Before setting innerHTML',
                data: {
                    htmlLength: html?.length,
                    viewerElementId: this.#viewerElement?.id,
                    isHidden: this.#viewerElement?.classList?.contains('hidden'),
                    displayStyle: this.#viewerElement?.style?.display,
                    parentHidden: this.#viewerElement?.parentElement?.classList?.contains('hidden')
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run3',
                hypothesisId: 'H7,H8'
            });
            
            this.#viewerElement.innerHTML = html;
            this.#viewerElement.classList.add('markdown-mode');
            this.#viewerElement.style.whiteSpace = 'normal';
            
            // 디버깅 로그 전송 (조건부)
            this.#sendDebugLog({
                location: 'ContentRenderer.js:95',
                message: 'After setting innerHTML',
                data: {
                    innerHTMLLength: this.#viewerElement?.innerHTML?.length,
                    textContentLength: this.#viewerElement?.textContent?.length,
                    hasMarkdownMode: this.#viewerElement?.classList?.contains('markdown-mode')
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run3',
                hypothesisId: 'H7,H8'
            });
        } catch (error) {
            // 디버깅 로그 전송 (조건부)
            this.#sendDebugLog({
                location: 'ContentRenderer.js:97',
                message: 'Markdown render error',
                data: { error: error.message },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run3',
                hypothesisId: 'H7'
            });
            
            console.error('마크다운 렌더링 실패:', error);
            this.#viewerElement.textContent = content;
        }
    }

    /**
     * 일반 텍스트 렌더링
     * @private
     * @param {string} content - 텍스트 내용
     * @param {string} wrapMode - 줄바꿈 모드
     */
    #renderText(content, wrapMode) {
        if (!this.#viewerElement) return;

        this.#viewerElement.textContent = content;
        this.#viewerElement.classList.remove('markdown-mode');
        
        if (wrapMode === 'original') {
            this.#viewerElement.style.whiteSpace = 'pre';
        } else {
            this.#viewerElement.style.whiteSpace = 'pre-wrap';
        }
    }

    /**
     * 줄바꿈 모드 토글
     * @returns {string} 새 줄바꿈 모드 ('auto' | 'original')
     */
    toggleWrapMode() {
        if (!this.#viewerElement) return 'auto';

        const isPre = this.#viewerElement.classList.contains('whitespace-pre');
        const isPreWrap = this.#viewerElement.classList.contains('whitespace-pre-wrap');

        if (isPre || this.#viewerElement.style.whiteSpace === 'pre') {
            this.#viewerElement.style.whiteSpace = 'pre-wrap';
            this.#viewerElement.classList.remove('whitespace-pre');
            this.#viewerElement.classList.add('whitespace-pre-wrap');
            localStorage.setItem('wrapMode', 'auto');
            return 'auto';
        } else {
            this.#viewerElement.style.whiteSpace = 'pre';
            this.#viewerElement.classList.remove('whitespace-pre-wrap');
            this.#viewerElement.classList.add('whitespace-pre');
            localStorage.setItem('wrapMode', 'original');
            return 'original';
        }
    }

    /**
     * 줄바꿈 모드 복원
     * @param {string} savedMode - 저장된 모드 ('auto' | 'original')
     */
    restoreWrapMode(savedMode) {
        if (!this.#viewerElement) return;

        if (savedMode === 'original') {
            this.#viewerElement.style.whiteSpace = 'pre';
            this.#viewerElement.classList.remove('whitespace-pre-wrap');
            this.#viewerElement.classList.add('whitespace-pre');
        } else {
            this.#viewerElement.style.whiteSpace = 'pre-wrap';
            this.#viewerElement.classList.remove('whitespace-pre');
            this.#viewerElement.classList.add('whitespace-pre-wrap');
        }
    }

    /**
     * 뷰어 요소 가져오기
     * @returns {HTMLElement | null} 뷰어 요소
     */
    getViewerElement() {
        return this.#viewerElement;
    }
}

