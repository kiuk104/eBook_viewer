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

/**
 * 파일의 고유 식별자(File Key) 생성
 * 
 * 이 함수는 모든 모듈에서 파일 키를 생성할 때 사용해야 합니다.
 * 다른 방식으로 키를 생성하면 안 됩니다.
 * 
 * @param {Object} file - 파일 객체 {name, size, fileId?, id?}
 * @returns {string} 파일 고유 키
 * 
 * 규칙:
 * - Google Drive 파일: file.id 또는 file.fileId가 있으면 `gdrive_{id}` 형식
 * - 로컬 파일: `local_{fileName}_{fileSize}` 형식 (파일명만 쓰면 중복 위험)
 */
export function generateFileKey(file) {
    if (!file) {
        console.error('❌ generateFileKey: file 객체가 없습니다');
        return null;
    }
    
    let fileKey;
    
    // Google Drive 파일: file.id 또는 file.fileId 사용 (우선순위: id > fileId)
    const driveFileId = file.id || file.fileId;
    if (driveFileId) {
        fileKey = `gdrive_${driveFileId}`;
    } else {
        // 로컬 파일: fileName + fileSize 조합 (파일명만 쓰면 중복 위험)
        if (!file.name || file.size === undefined) {
            console.error('❌ generateFileKey: 로컬 파일에 name 또는 size가 없습니다', file);
            return null;
        }
        fileKey = `local_${file.name}_${file.size}`;
    }
    
    console.log(`📂 현재 파일 키 생성: [${file.name || 'unknown'}] -> ${fileKey}`);
    return fileKey;
}

