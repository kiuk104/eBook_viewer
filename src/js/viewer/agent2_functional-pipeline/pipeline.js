/**
 * 에이전트 2 제안: 순수 함수형 파이프라인
 * 
 * 함수 파이프라인 조합 유틸리티
 * 여러 함수를 체이닝하여 데이터 변환을 수행합니다.
 */

/**
 * 함수 파이프라인 실행 (왼쪽에서 오른쪽으로)
 * pipe(f, g, h)(x) === h(g(f(x)))
 * 
 * @param {...Function} fns - 실행할 함수들
 * @returns {Function} 파이프라인 함수
 * 
 * @example
 * const process = pipe(
 *   (x) => x * 2,
 *   (x) => x + 1,
 *   (x) => x.toString()
 * );
 * process(5); // "11"
 */
export const pipe = (...fns) => (value) => 
    fns.reduce((acc, fn) => fn(acc), value);

/**
 * 함수 컴포지션 (오른쪽에서 왼쪽으로)
 * compose(f, g, h)(x) === f(g(h(x)))
 * 
 * @param {...Function} fns - 실행할 함수들
 * @returns {Function} 컴포지션 함수
 * 
 * @example
 * const process = compose(
 *   (x) => x.toString(),
 *   (x) => x + 1,
 *   (x) => x * 2
 * );
 * process(5); // "11"
 */
export const compose = (...fns) => (value) => 
    fns.reduceRight((acc, fn) => fn(acc), value);

/**
 * 조건부 실행 함수
 * @param {Function} predicate - 조건 함수
 * @param {Function} fn - 실행할 함수
 * @returns {Function} 조건부 함수
 */
export const when = (predicate, fn) => (value) => 
    predicate(value) ? fn(value) : value;

/**
 * 여러 함수 중 첫 번째로 성공한 결과 반환
 * @param {...Function} fns - 시도할 함수들
 * @returns {Function} fallback 함수
 */
export const tryCatch = (...fns) => (value) => {
    for (const fn of fns) {
        try {
            return fn(value);
        } catch (e) {
            continue;
        }
    }
    return value;
};

/**
 * 함수 결과를 로깅하는 디버깅 헬퍼
 * @param {string} label - 로그 레이블
 * @returns {Function} 로깅 함수
 */
export const tap = (label = '') => (value) => {
    console.log(`${label}:`, value);
    return value;
};

/**
 * 비동기 함수 파이프라인
 * @param {...Function} fns - 실행할 비동기 함수들
 * @returns {Function} 비동기 파이프라인 함수
 */
export const pipeAsync = (...fns) => async (value) => {
    let result = value;
    for (const fn of fns) {
        result = await fn(result);
    }
    return result;
};

