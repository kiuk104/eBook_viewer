/**
 * 하이라이트 관리 클래스
 * 텍스트 강조, 저장, 복원 기능 담당
 */
export class HighlightManager {
    #highlights = {};
    #currentFileKey = null;

    constructor() {
        this.#highlights = JSON.parse(localStorage.getItem('ebook_highlights') || '{}');
    }

    setCurrentFileKey(fileKey) {
        this.#currentFileKey = fileKey;
    }

    /**
     * 하이라이트 적용
     */
    addHighlight(range, color) {
        if (!range || !this.#currentFileKey) return null;

        try {
            const span = document.createElement('span');
            span.style.backgroundColor = color;
            span.dataset.highlightId = Date.now().toString();
            span.className = 'highlight-span';
            span.style.cursor = 'pointer';

            // 간단한 선택 영역 처리 (블록 요소를 가로지르지 않는 경우)
            range.surroundContents(span);

            // 저장
            this.#saveHighlightData(span.dataset.highlightId, color, span.textContent);
            return span;
        } catch (e) {
            console.warn('복잡한 영역(여러 문단 등)은 하이라이트 할 수 없습니다.', e);
            alert('여러 문단에 걸친 하이라이트는 아직 지원되지 않습니다. 문단별로 시도해주세요.');
            return null;
        }
    }

    /**
     * 하이라이트 삭제
     */
    removeHighlight(element) {
        if (!element || !element.classList.contains('highlight-span')) return;
        
        const id = element.dataset.highlightId;
        const text = element.textContent;
        const parent = element.parentNode;
        
        // 태그 벗기기 (텍스트만 남기기)
        parent.replaceChild(document.createTextNode(text), element);
        parent.normalize(); // 텍스트 노드 합치기

        // 데이터 삭제
        this.#deleteHighlightData(id);
    }

    /**
     * 저장된 하이라이트 데이터 삭제
     */
    #deleteHighlightData(id) {
        if (!this.#currentFileKey || !this.#highlights[this.#currentFileKey]) return;
        
        const fileHighlights = this.#highlights[this.#currentFileKey];
        const index = fileHighlights.findIndex(h => h.id === id);
        
        if (index > -1) {
            fileHighlights.splice(index, 1);
            this.#saveToStorage();
        }
    }

    /**
     * 하이라이트 데이터 저장
     */
    #saveHighlightData(id, color, text) {
        if (!this.#currentFileKey) return;

        if (!this.#highlights[this.#currentFileKey]) {
            this.#highlights[this.#currentFileKey] = [];
        }

        // 실제 위치 저장은 복잡하므로, 현재는 '저장되었다'는 기록만 남깁니다.
        // (완벽한 위치 복원을 위해서는 TreeWalker 등을 이용한 오프셋 계산 로직이 추가로 필요합니다)
        this.#highlights[this.#currentFileKey].push({
            id,
            color,
            text: text.substring(0, 20) + '...', // 미리보기용
            timestamp: Date.now()
        });
        
        this.#saveToStorage();
    }

    #saveToStorage() {
        localStorage.setItem('ebook_highlights', JSON.stringify(this.#highlights));
    }
}