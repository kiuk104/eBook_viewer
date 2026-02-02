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

            // 저장 (위치 정보 포함)
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
     * 하이라이트 데이터 저장 (정확한 위치 정보 포함)
     */
    #saveHighlightData(id, color, text) {
        if (!this.#currentFileKey) return;

        if (!this.#highlights[this.#currentFileKey]) {
            this.#highlights[this.#currentFileKey] = [];
        }

        // 정확한 위치 계산
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) {
            console.warn('viewerContent를 찾을 수 없습니다.');
            return;
        }

        const highlightSpan = document.querySelector(`[data-highlight-id="${id}"]`);
        if (!highlightSpan) {
            console.warn('하이라이트 요소를 찾을 수 없습니다.');
            return;
        }

        const { startIndex, endIndex } = this.#calculateTextIndices(highlightSpan, viewerContent);

        this.#highlights[this.#currentFileKey].push({
            id,
            color,
            text: text.substring(0, 50), // 미리보기용
            startIndex,
            endIndex,
            timestamp: Date.now()
        });
        
        this.#saveToStorage();
        console.log(`💾 하이라이트 저장: ${startIndex}-${endIndex} (${text.length}자)`);
    }

    /**
     * 텍스트 인덱스 계산 (하이라이트 요소의 위치)
     */
    #calculateTextIndices(element, container) {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let currentIndex = 0;
        let startIndex = -1;
        let endIndex = -1;

        while (walker.nextNode()) {
            const node = walker.currentNode;
            const nodeLength = node.textContent.length;

            // element 내부의 텍스트 노드인지 확인
            if (element.contains(node)) {
                if (startIndex === -1) {
                    startIndex = currentIndex;
                }
                endIndex = currentIndex + nodeLength;
            }

            currentIndex += nodeLength;
        }

        return { startIndex, endIndex };
    }

    #saveToStorage() {
        localStorage.setItem('ebook_highlights', JSON.stringify(this.#highlights));
    }
    
    /**
     * 현재 파일의 하이라이트 데이터를 반환 (저장용)
     */
    getData(fileKey) {
        return this.#highlights[fileKey] || [];
    }

    /**
     * 외부에서 가져온 하이라이트 데이터를 강제 주입 (복원용)
     */
    importData(fileKey, dataList) {
        if (!fileKey || !dataList || !Array.isArray(dataList)) return;
        
        // 기존 데이터에 덮어쓰기 (또는 병합)
        this.#highlights[fileKey] = dataList;
        this.#saveToStorage();
        console.log(`✅ 하이라이트 ${dataList.length}개 임포트 완료`);
    }

    /**
     * 저장된 하이라이트 복원
     * 렌더링이 완료된 후 호출되어야 함
     */
    restoreHighlights() {
        const fileKey = this.#currentFileKey;
        if (!fileKey) {
            console.warn('⚠️ 현재 파일 키가 없어 하이라이트를 복원할 수 없습니다.');
            return;
        }

        const highlights = this.getData(fileKey);
        if (!highlights || highlights.length === 0) {
            console.log('💡 복원할 하이라이트가 없습니다.');
            return;
        }

        console.log(`🎨 하이라이트 복원 시작: ${highlights.length}개`);

        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) {
            console.error('❌ viewerContent 요소를 찾을 수 없습니다.');
            return;
        }

        // startIndex/endIndex가 있는 하이라이트만 복원
        const validHighlights = highlights.filter(hl => 
            hl.startIndex !== undefined && hl.endIndex !== undefined
        );

        if (validHighlights.length === 0) {
            console.log('💡 위치 정보가 있는 하이라이트가 없습니다.');
            return;
        }

        // 뒤에서부터 복원 (인덱스 변경 방지)
        let successCount = 0;
        let failCount = 0;
        const failedHighlights = [];
        
        for (let i = validHighlights.length - 1; i >= 0; i--) {
            const hl = validHighlights[i];
            try {
                const result = this.#applyHighlight(hl.startIndex, hl.endIndex, hl.color, hl.id);
                if (result !== false) {
                    successCount++;
                } else {
                    failCount++;
                    failedHighlights.push({ index: i, startIndex: hl.startIndex, endIndex: hl.endIndex, id: hl.id });
                    console.warn(`⚠️ 하이라이트 복원 실패 [${i}]: startIndex=${hl.startIndex}, endIndex=${hl.endIndex}, id=${hl.id}`);
                }
            } catch (e) {
                failCount++;
                failedHighlights.push({ index: i, startIndex: hl.startIndex, endIndex: hl.endIndex, id: hl.id, error: e.message });
                console.error(`❌ 하이라이트 복원 실패 [${i}]:`, e);
            }
        }

        if (failCount > 0) {
            console.log(`✅ 하이라이트 복원 완료: ${successCount}개 성공, ${failCount}개 실패 (총 ${validHighlights.length}개)`);
            console.log(`📋 실패한 하이라이트:`, failedHighlights);
        } else {
            console.log(`✅ 하이라이트 복원 완료: ${successCount}개`);
        }
    }

    /**
     * 하이라이트 적용 (복원용 내부 메서드)
     * @private
     */
    #applyHighlight(startIndex, endIndex, color, highlightId) {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return;

        const range = document.createRange();

        // TreeWalker로 텍스트 노드 탐색
        const walker = document.createTreeWalker(
            viewerContent,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let currentIndex = 0;
        let startNode = null, startOffset = 0;
        let endNode = null, endOffset = 0;

        while (walker.nextNode()) {
            const node = walker.currentNode;
            const nodeLength = node.textContent.length;

            // 시작 노드 찾기
            if (startNode === null && currentIndex + nodeLength > startIndex) {
                startNode = node;
                startOffset = startIndex - currentIndex;
            }

            // 끝 노드 찾기
            if (currentIndex + nodeLength >= endIndex) {
                endNode = node;
                endOffset = endIndex - currentIndex;
                break;
            }

            currentIndex += nodeLength;
        }

        if (!startNode || !endNode) {
            console.warn('⚠️ 하이라이트 범위를 찾을 수 없습니다.');
            return false;
        }

        try {
            // Range offset 검증 및 설정
            const safeStartOffset = Math.max(0, Math.min(startOffset, startNode.textContent.length));
            const safeEndOffset = Math.max(0, Math.min(endOffset, endNode.textContent.length));
            
            range.setStart(startNode, safeStartOffset);
            range.setEnd(endNode, safeEndOffset);

            // Range가 유효한지 확인
            if (range.collapsed) {
                console.warn('⚠️ 하이라이트 범위가 비어있습니다.');
                return false;
            }

            // Range가 텍스트 노드 경계를 넘지 않는지 확인
            if (startNode !== endNode && startOffset >= startNode.textContent.length) {
                console.warn('⚠️ 시작 offset이 노드 길이를 초과합니다.');
                return false;
            }
            
            if (endOffset > endNode.textContent.length) {
                console.warn('⚠️ 끝 offset이 노드 길이를 초과합니다.');
                return false;
            }

            // 기존 하이라이트 제거 (중복 방지)
            const existingHighlights = viewerContent.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
            existingHighlights.forEach(el => {
                const parent = el.parentNode;
                while (el.firstChild) {
                    parent.insertBefore(el.firstChild, el);
                }
                parent.removeChild(el);
            });

            // 새 하이라이트 적용 (더 안전한 방법)
            const span = document.createElement('span');
            span.style.backgroundColor = color;
            span.style.cursor = 'pointer';
            span.className = 'highlight-span';
            span.dataset.highlightId = highlightId;

            // surroundContents 대신 extractContents와 insertNode 사용
            try {
                const contents = range.extractContents();
                span.appendChild(contents);
                range.insertNode(span);
            } catch (extractError) {
                // extractContents 실패 시 surroundContents 시도
                try {
                    range.surroundContents(span);
                } catch (surroundError) {
                    // 둘 다 실패하면 경고만 출력
                    console.warn('⚠️ 하이라이트 적용 실패 (복잡한 구조):', surroundError);
                    return false;
                }
            }

            return true; // 성공

        } catch (e) {
            console.error('하이라이트 적용 중 오류:', e);
            return false;
        }
    }
}