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

/**
 * 텍스트 정리 함수
 * 80컬럼 강제 줄바꿈 등으로 끊긴 문장을 자연스럽게 이어주고 HTML로 구조화합니다.
 * 
 * @param {string} text - 원본 텍스트
 * @returns {string} 정리된 HTML 텍스트
 */
export function cleanUpText(text) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'utils.js:73',message:'cleanUpText entry',data:{textLength:text?.length,textType:typeof text},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!text || typeof text !== 'string') {
        return '';
    }

    // 1. 줄바꿈 문자 표준화 (\r\n -> \n)
    let processed = text.replace(/\r\n/g, '\n');

    // 2. 연속된 공백 줄을 하나로 줄임
    processed = processed.replace(/\n{2,}/g, '\n');

    // 3. 문장 병합 (문장부호로 끝나지 않는 강제 줄바꿈 제거)
    // 설명: 문장이 ., ?, !, ", ' 등으로 끝나지 않았는데 줄이 바뀌면 공백으로 치환
    // 문장 끝맺음 문자: . ? ! " ' " ' (한글 따옴표 포함)
    processed = processed.replace(/([^.!?"'"'"\n])\n(?!\n)/g, '$1 ');

    // 4. 연속된 공백 정리
    processed = processed.replace(/[ \t]+/g, ' ');

    // 5. 줄 단위 분리
    const lines = processed.split('\n');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'utils.js:95',message:'Before HTML conversion',data:{lineCount:lines.length,firstLines:lines.slice(0,3)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // 6. HTML 변환 (빈 줄은 필터링하여 여백 중복 방지)
    const htmlLines = lines
        .map(line => line.trim())
        .filter(line => line.length > 0) // 내용 없는 줄은 제거
        .map(line => {
            // 소제목 감지 로직
            // 1) 길이 50자 미만
            // 2) 문장부호나 종결어미로 끝나지 않음
            // 3) 대괄호[], 괄호<> 등으로 감싸진 경우 가산점
            const isHeader = line.length < 50 && 
                             !/[.!?"'"'"]$/.test(line) &&
                             !/(다|요|까|죠|오)$/.test(line);

            if (isHeader) {
                // 소제목: 위쪽 여백 줄임(mt-6), 아래 구분선
                const html = `<h3 class="text-xl font-bold text-blue-500 dark:text-blue-400 mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">${line}</h3>`;
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'utils.js:108',message:'Header detected',data:{line:line.substring(0,30),html:html.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                return html;
            } else {
                // 본문: 문단 간격 줄임(mb-3), 줄 간격 적절히(leading-relaxed)
                const html = `<p class="mb-3 leading-relaxed text-justify">${line}</p>`;
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'utils.js:113',message:'Paragraph created',data:{lineLength:line.length,htmlClasses:'mb-3 leading-relaxed text-justify'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-2',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
                return html;
            }
        });

    const result = htmlLines.join('\n');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'utils.js:117',message:'cleanUpText exit',data:{resultLength:result.length,htmlLineCount:htmlLines.length,firstHtml:result.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return result;
}

/**
 * HTML을 마크다운 형식으로 변환
 * @param {string} html - HTML 문자열
 * @returns {string} 마크다운 형식 문자열
 */
export function htmlToMarkdown(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    // 임시 DOM 요소 생성하여 HTML 파싱
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    let markdown = '';
    const children = tempDiv.children;

    for (let i = 0; i < children.length; i++) {
        const element = children[i];
        const tagName = element.tagName.toLowerCase();
        const text = element.textContent.trim();

        if (!text) continue; // 빈 텍스트는 건너뛰기

        if (tagName === 'h3') {
            // 소제목: ### 제목
            markdown += `### ${text}\n\n`;
        } else if (tagName === 'p') {
            // 본문: 내용 (빈 줄 추가)
            markdown += `${text}\n\n`;
        } else {
            // 기타 태그는 텍스트만 추출
            markdown += `${text}\n\n`;
        }
    }

    // 마지막 빈 줄 정리
    return markdown.trim() + '\n';
}

/**
 * 파일을 마크다운 형식으로 다운로드
 * @param {string} content - 다운로드할 내용 (HTML 또는 텍스트)
 * @param {string} fileName - 원본 파일명
 * @param {boolean} isHtml - content가 HTML인지 여부
 */
export function downloadAsMarkdown(content, fileName, isHtml = false) {
    if (!content || !fileName) {
        console.error('❌ 다운로드 실패: 내용 또는 파일명이 없습니다');
        alert('다운로드할 내용이 없습니다. 먼저 텍스트 정리를 적용해주세요.');
        return;
    }

    // HTML인 경우 마크다운으로 변환
    let markdownContent = isHtml ? htmlToMarkdown(content) : content;

    // 파일명 처리: 확장자 제거 후 _cleaned.md 추가
    const baseName = fileName.replace(/\.[^/.]+$/, ''); // 확장자 제거
    const newFileName = `${baseName}_cleaned.md`;

    // Blob 생성
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // 다운로드 링크 생성 및 클릭
    const link = document.createElement('a');
    link.href = url;
    link.download = newFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // URL 해제
    URL.revokeObjectURL(url);

    console.log(`💾 마크다운 다운로드 완료: ${newFileName}`);
}

