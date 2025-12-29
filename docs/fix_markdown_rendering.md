# Markdown 렌더링 문제 해결 가이드

## 문제 상황

마크다운 파일(`.md`)을 뷰어에서 열었을 때, 마크다운이 HTML로 렌더링되지 않고 일반 텍스트로 표시되거나, 코드 블록으로 감싸져서 표시되는 문제가 발생했습니다.

### 증상

1. **마크다운이 일반 텍스트로 표시됨**
   - `## 제목` 같은 마크다운 문법이 그대로 텍스트로 보임
   - 줄바꿈이 제대로 작동하지 않음
   - HTML 태그가 렌더링되지 않음

2. **마크다운이 코드 블록으로 감싸져서 표시됨**
   - 전체 내용이 `<pre><code class="language-markdown">` 태그로 감싸져서 표시됨
   - 마크다운 문법이 파싱되지 않고 그대로 텍스트로 보임

## 원인 분석

### 근본 원인

AI 변환 기능을 통해 생성된 마크다운 파일이 다음과 같은 형태로 저장되었습니다:

```markdown
```markdown
## 일식(日蝕)

저 자 : 히라노 게이치로
...
```

즉, 실제 마크다운 내용이 코드 블록(` ```markdown ... ``` `)으로 감싸져 있었습니다. 이는 AI가 응답을 코드 블록 형식으로 반환했기 때문입니다.

### 문제 발생 과정

1. **파일 내용 확인**
   - 파일이 ` ```markdown`으로 시작함
   - 파일 끝에 ` ``` `가 없거나 있더라도 정규식으로 매칭되지 않음

2. **기존 로직의 한계**
   - 정규식 패턴 `/^```[\w]*\s*\n([\s\S]*?)\n\s*```\s*$/`이 완전한 코드 블록만 매칭
   - 닫는 마커(` ``` `)가 없거나 파일 끝에 있지 않으면 매칭 실패
   - 라인 기반 로직이 마지막 3줄만 확인하여 닫는 마커를 찾지 못함

3. **렌더링 결과**
   - `marked.js`가 코드 블록으로 감싸진 내용을 그대로 코드 블록으로 렌더링
   - 결과적으로 `<pre><code class="language-markdown">` 태그로 감싸져서 표시됨

## 해결 방법

### 해결 전략

1. **정규식으로 완전한 코드 블록 감지 및 제거**
   - 시작 마커(` ```markdown` 또는 ` ``` `)와 끝 마커(` ``` `)가 모두 있는 경우

2. **라인 기반 폴백 로직**
   - 정규식 매칭 실패 시 라인 단위로 처리
   - 마지막 5줄까지 확인하여 닫는 마커 검색
   - 닫는 마커가 있으면 첫 줄과 마지막 ``` 줄 제거
   - **닫는 마커가 없으면 첫 줄만 제거** (핵심 수정 사항)

### 구현 코드

```191:241:src/js/viewer.js
// 코드 블록으로 시작하는 경우 제거 (```markdown ... ``` 또는 ``` ... ``` 또는 ```로 시작만 하는 경우)
// 더 강력한 제거 로직: 정규식으로 코드 블록 패턴 찾기 (멀티라인, 공백 허용)
const codeBlockPattern = /^```[\w]*\s*\n([\s\S]*?)\n\s*```\s*$/;
const codeBlockMatch = contentToParse.match(codeBlockPattern);

if (codeBlockMatch && codeBlockMatch[1]) {
    // 정규식으로 코드 블록 내용 추출 (완전한 코드 블록)
    contentToParse = codeBlockMatch[1].trim();
    console.log('✅ 코드 블록 래퍼 제거됨 (정규식)');
} else if (contentToParse.startsWith('```')) {
    // 정규식 매칭 실패 시 라인 기반 로직 사용
    const lines = contentToParse.split('\n');
    
    if (lines.length >= 1 && lines[0].trim().startsWith('```')) {
        // 마지막 줄들을 확인하여 ``` 찾기 (마지막 5줄까지 확인)
        let endIndex = lines.length;
        for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
            const trimmedLine = lines[i].trim();
            if (trimmedLine === '```' || trimmedLine.startsWith('```')) {
                endIndex = i;
                break;
            }
        }
        
        // 첫 줄과 마지막 ``` 줄 제거 (닫는 마커가 있으면)
        if (endIndex < lines.length) {
            contentToParse = lines.slice(1, endIndex).join('\n');
            console.log('✅ 코드 블록 래퍼 제거됨 (라인 기반, 닫는 마커 있음)');
        } else {
            // 닫는 마커가 없으면 첫 줄만 제거
            contentToParse = lines.slice(1).join('\n');
            console.log('✅ 코드 블록 시작 마커만 제거됨 (닫는 마커 없음)');
        }
    }
}
```

### 핵심 수정 사항

**이전 로직의 문제점:**
- 닫는 마커(` ``` `)가 없으면 아무것도 제거하지 않음
- 결과적으로 ` ```markdown`으로 시작하는 첫 줄이 그대로 남아서 `marked.js`가 코드 블록으로 인식

**수정된 로직:**
- 닫는 마커가 없어도 첫 줄(` ```markdown`)을 제거
- 이렇게 하면 실제 마크다운 내용만 `marked.js`에 전달되어 정상적으로 렌더링됨

## 테스트 방법

1. **코드 블록으로 감싸진 마크다운 파일 테스트**
   ```markdown
   ```markdown
   ## 제목
   내용
   ```
   ```

2. **닫는 마커가 없는 마크다운 파일 테스트**
   ```markdown
   ```markdown
   ## 제목
   내용
   ```

3. **일반 마크다운 파일 테스트**
   ```markdown
   ## 제목
   내용
   ```

## 예상 결과

- 모든 경우에서 마크다운이 정상적으로 HTML로 렌더링됨
- 제목, 목록, 강조 등 마크다운 문법이 올바르게 표시됨
- 코드 블록 래퍼가 자동으로 제거되어 실제 내용만 표시됨

## 관련 파일

- `src/js/viewer.js` - `displayFileContent()` 함수 (191-241줄)
- `src/css/styles.css` - `.markdown-mode` 스타일 정의
- `ebook_viewer.html` - `marked.js` 라이브러리 로드

## 참고 사항

- 이 문제는 AI 변환 기능을 통해 생성된 마크다운 파일에서 주로 발생
- 향후 AI 변환 기능에서 코드 블록 래퍼를 제거하고 저장하도록 개선 가능
- 현재는 뷰어에서 자동으로 처리하여 사용자 경험을 개선

