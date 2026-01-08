/**
 * 에이전트 3 제안: 이벤트 기반 아키텍처
 * 
 * 중앙 이벤트 버스
 * Pub/Sub 패턴으로 모듈 간 통신
 */

/**
 * 이벤트 버스 클래스
 * 이벤트 발행(Publish) 및 구독(Subscribe) 기능 제공
 */
export class EventBus {
    /**
     * @private
     * @type {Map<string, Array<Function>>}
     */
    #listeners = new Map();

    /**
     * 이벤트 구독
     * @param {string} eventName - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     * @returns {Function} 구독 해제 함수
     */
    on(eventName, callback) {
        if (!this.#listeners.has(eventName)) {
            this.#listeners.set(eventName, []);
        }
        this.#listeners.get(eventName).push(callback);

        // 구독 해제 함수 반환
        return () => this.off(eventName, callback);
    }

    /**
     * 이벤트 구독 해제
     * @param {string} eventName - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     */
    off(eventName, callback) {
        if (!this.#listeners.has(eventName)) return;

        const callbacks = this.#listeners.get(eventName);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * 이벤트 발행
     * @param {string} eventName - 이벤트 이름
     * @param {*} data - 이벤트 데이터
     */
    emit(eventName, data) {
        if (!this.#listeners.has(eventName)) return;

        const callbacks = this.#listeners.get(eventName);
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`이벤트 핸들러 오류 [${eventName}]:`, error);
            }
        });
    }

    /**
     * 모든 이벤트 리스너 제거
     */
    clear() {
        this.#listeners.clear();
    }
}

// 싱글톤 인스턴스
export const eventBus = new EventBus();

