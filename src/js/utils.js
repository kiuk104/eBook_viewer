/**
 * 유틸리티 함수 모듈
 */

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 * @param {number} bytes - 바이트 단위 파일 크기
 * @returns {string} 포맷된 파일 크기 문자열
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 타임스탬프를 로컬 날짜/시간 문자열로 변환
 * @param {number|string} timestamp - 타임스탬프
 * @returns {string} 포맷된 날짜/시간 문자열
 */
export function formatTimestamp(timestamp) {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString();
}

