/**
 * 에이전트 2 제안: 순수 함수형 파이프라인
 * 
 * 상태 관리 모듈
 * 모든 상태는 불변 객체로 관리됩니다.
 */

/**
 * 초기 상태 객체
 * @type {Object}
 */
export const initialState = Object.freeze({
    files: [],
    currentFileIndex: -1,
    currentFileKey: null,
    scrollPosition: 0,
    wrapMode: 'auto',
    markdownStyles: {
        font: 'inherit',
        size: 1.0,
        headingColor: '#2563eb',
        tocColor: '#2563eb'
    },
    bodyStyles: {
        lineHeight: 1.8,
        fontFamily: "'Noto Sans KR', sans-serif",
        color: '#374151',
        strokeWidth: 0
    },
    viewerWidth: {
        width: 1400,
        isFullWidth: false
    }
});

/**
 * 상태 업데이트 헬퍼 (불변성 유지)
 * @param {Object} state - 현재 상태
 * @param {Object} updates - 업데이트할 속성들
 * @returns {Object} 새 상태 객체
 */
export const updateState = (state, updates) => ({
    ...state,
    ...updates
});

/**
 * 파일 상태 업데이트
 * @param {Object} state - 현재 상태
 * @param {File[]} files - 새 파일 배열
 * @returns {Object} 새 상태 객체
 */
export const setFiles = (state, files) => updateState(state, {
    files: [...files],
    currentFileIndex: files.length > 0 ? 0 : -1
});

/**
 * 현재 파일 인덱스 업데이트
 * @param {Object} state - 현재 상태
 * @param {number} index - 새 인덱스
 * @returns {Object} 새 상태 객체
 */
export const setCurrentFileIndex = (state, index) => {
    if (index >= 0 && index < state.files.length) {
        return updateState(state, { currentFileIndex: index });
    }
    return state;
};

/**
 * 현재 파일 키 업데이트
 * @param {Object} state - 현재 상태
 * @param {string | null} fileKey - 파일 키
 * @returns {Object} 새 상태 객체
 */
export const setCurrentFileKey = (state, fileKey) => 
    updateState(state, { currentFileKey: fileKey });

/**
 * 현재 파일 가져오기
 * @param {Object} state - 현재 상태
 * @returns {File | null} 현재 파일 또는 null
 */
export const getCurrentFile = (state) => {
    if (state.currentFileIndex >= 0 && state.currentFileIndex < state.files.length) {
        return state.files[state.currentFileIndex];
    }
    return null;
};

/**
 * 스크롤 위치 업데이트
 * @param {Object} state - 현재 상태
 * @param {number} position - 스크롤 위치 (퍼센트)
 * @returns {Object} 새 상태 객체
 */
export const setScrollPosition = (state, position) => 
    updateState(state, { scrollPosition: position });

/**
 * 줄바꿈 모드 업데이트
 * @param {Object} state - 현재 상태
 * @param {string} mode - 줄바꿈 모드 ('auto' | 'original')
 * @returns {Object} 새 상태 객체
 */
export const setWrapMode = (state, mode) => 
    updateState(state, { wrapMode: mode });

/**
 * 마크다운 스타일 업데이트
 * @param {Object} state - 현재 상태
 * @param {Object} styles - 스타일 속성
 * @returns {Object} 새 상태 객체
 */
export const setMarkdownStyles = (state, styles) => 
    updateState(state, {
        markdownStyles: {
            ...state.markdownStyles,
            ...styles
        }
    });

/**
 * 본문 스타일 업데이트
 * @param {Object} state - 현재 상태
 * @param {Object} styles - 스타일 속성
 * @returns {Object} 새 상태 객체
 */
export const setBodyStyles = (state, styles) => 
    updateState(state, {
        bodyStyles: {
            ...state.bodyStyles,
            ...styles
        }
    });

/**
 * 뷰어 너비 업데이트
 * @param {Object} state - 현재 상태
 * @param {Object} widthConfig - 너비 설정
 * @returns {Object} 새 상태 객체
 */
export const setViewerWidth = (state, widthConfig) => 
    updateState(state, {
        viewerWidth: {
            ...state.viewerWidth,
            ...widthConfig
        }
    });

