# 📂 개발 규칙 및 문제 해결 (DEV_NOTE)

## 1. 개발 규칙 및 베스트 프랙티스

### 1.1 Git 관리 규칙

#### 🚫 로그 파일 업로드 금지
- **이유:** 로그 파일(`*.log`)은 소스 코드가 아니며, 개인 정보나 경로가 포함될 수 있어 보안상 위험함.
- **해결 방법:** 
  1. 프로젝트 루트에 `.gitignore` 파일을 만든다.
  2. 아래 내용을 추가하여 깃이 무시하게 설정한다.
     ```text
     *.log
     logs/
     ```
  3. 이미 올라갔다면 `git rm --cached *.log` 명령어로 깃에서만 제거한다.

#### 📝 커밋 메시지 규칙
- **형식:** `type: 간단한 설명`
- **타입:**
  - `feat`: 새 기능 추가
  - `fix`: 버그 수정
  - `docs`: 문서 수정
  - `refactor`: 코드 리팩토링
  - `test`: 테스트 추가/수정
  - `chore`: 빌드/설정 변경
- **예시:**
  ```bash
  git commit -m "fix: toggleBookmark import 추가"
  git commit -m "feat: 즐겨찾기 기능 추가"
  git commit -m "docs: DEV_NOTE.md 업데이트"
  ```

---

### 1.2 ES6 모듈 사용 규칙

#### ✅ 필수 규칙
1. **HTML `onclick` 속성 사용 금지**
   ```html
   <!-- ❌ 잘못된 방법 -->
   <button onclick="selectFiles()">파일 선택</button>
   
   <!-- ✅ 올바른 방법 -->
   <button id="selectFilesBtn">파일 선택</button>
   ```
   ```javascript
   // main.js
   document.getElementById('selectFilesBtn').addEventListener('click', selectFiles);
   ```

2. **모든 함수는 export/import 확인**
   ```javascript
   // viewer.js
   export function myFunction() { ... }
   
   // main.js
   import { myFunction } from './viewer.js';
   window.myFunction = myFunction;  // HTML에서 사용 시
   ```

3. **상대 경로 정확성**
   ```javascript
   // ✅ 올바른 경로
   import { FileManager } from './modules/FileManager.js';
   import { utils } from '../utils.js';
   
   // ❌ 잘못된 경로
   import { FileManager } from './FileManager';  // .js 확장자 누락
   import { FileManager } from './filemanager.js';  // 대소문자 오류
   ```

4. **웹 서버 필수 사용**
   - ES6 모듈은 CORS 정책 때문에 `file://` 프로토콜에서 작동하지 않음
   - 반드시 웹 서버 사용: `python -m http.server 8000`

---

### 1.3 코드 품질 규칙

#### 🧹 디버깅 코드 제거
- **프로덕션 코드에는 디버깅 코드를 남기지 않음**
  ```javascript
  // ❌ 제거해야 할 코드
  fetch('http://localhost:7242/ingest', { ... });
  console.log('디버깅:', variable);
  
  // ✅ 프로덕션 코드
  // 디버깅 코드 없음
  ```

#### 📝 JSDoc 주석 작성
- **모든 export 함수에 JSDoc 주석 추가**
  ```javascript
  /**
   * 파일 내용을 뷰어에 표시합니다.
   * @param {File} file - 표시할 파일 객체
   * @param {number} index - 파일 인덱스
   */
  export function displayFileContent(file, index) {
      // ...
  }
  ```

#### 🔒 Private 필드 사용
- **클래스 내부 데이터는 private 필드(#)로 보호**
  ```javascript
  class FileManager {
      #files = [];  // private 필드
      
      addFile(file) {
          this.#files.push(file);
      }
      
      getFiles() {
          return [...this.#files];  // 복사본 반환
      }
  }
  ```

---

### 1.4 API 사용 규칙

#### Google Gemini API
- **구체적인 버전 번호 사용 필수**
  ```javascript
  // ❌ 잘못된 방법
  const model = 'gemini-1.5-flash';  // 별칭, 폐기됨
  const model = 'gemini-1.5-flash-latest';  // 별칭, 폐기됨
  
  // ✅ 올바른 방법
  const model = 'gemini-1.5-flash-002';  // 구체적인 버전
  ```

- **재시도 로직 구현**
  ```javascript
  try {
      return await tryModel('gemini-1.5-flash-002');
  } catch (error) {
      return await tryModel('gemini-2.0-flash-exp');  // 폴백
  }
  ```

#### Google Drive API
- **API 키 설정 시 필수 라이브러리 활성화**
  - Google Picker API
  - Google Drive API
  - Google Identity Services

---

### 1.5 버전 관리 규칙

#### Semantic Versioning 준수
- **형식:** `MAJOR.MINOR.PATCH`
  - `MAJOR`: 호환되지 않는 API 변경
  - `MINOR`: 하위 호환되는 기능 추가
  - `PATCH`: 하위 호환되는 버그 수정

#### 버전 업데이트 체크리스트
- [ ] `src/js/config.js`: `APP_VERSION` 업데이트
- [ ] `src/js/viewer.js`: `exportData()` 함수의 `version` 필드 업데이트
- [ ] `ebook_viewer.html`: `<title>` 태그의 버전 번호 업데이트
- [ ] `CHANGELOG.md`: 새 버전 항목 추가
- [ ] 관련 문서 업데이트 (`PROJECT_BRIEF.md`, `QUICKSTART.md` 등)

---

## 2. 오늘의 배움

### 2026-02-01: Electron 데스크톱 앱 통합 (v0.3.0)

#### 🎯 주요 작업

1. **Electron 프로젝트 구조 구축**
   - `package.json` 생성 및 설정
   - `electron/main.js`: 메인 프로세스 구현
   - `electron/preload.js`: 보안 브리지 스크립트
   - `build/` 폴더: 빌드 리소스 및 아이콘 가이드

2. **Electron 앱 기능 구현**
   - 네이티브 파일 시스템 접근 (파일 열기/저장 다이얼로그)
   - 애플리케이션 메뉴 (파일, 편집, 보기, 개발자, 도움말)
   - 키보드 단축키 (Ctrl+O, Ctrl+H, Ctrl+R, F11)
   - 창 관리 (최소/최대화, 크기 조절, 전체화면)

3. **빌드 시스템 구축**
   - electron-builder 통합
   - Windows, macOS, Linux 빌드 설정
   - npm 스크립트로 간편한 빌드

4. **문서 작성**
   - `README_ELECTRON.md`: Electron 버전 메인 문서
   - `ELECTRON_QUICKSTART.md`: 빠른 시작 가이드
   - `ELECTRON_INTEGRATION.md`: 웹 앱과 Electron 통합 방법
   - `ELECTRON_CONVERSION_COMPLETE.md`: 변환 완료 요약

#### 배운 점

- **Electron 아키텍처 이해**
  - 메인 프로세스와 렌더러 프로세스 분리
  - IPC (Inter-Process Communication) 통신
  - 보안 컨텍스트 브리지 (preload.js)

- **웹 앱과 데스크톱 앱 통합**
  - 기존 웹 기능 100% 유지
  - 환경 감지 (`window.isElectron`)
  - 조건부 코드 분기

- **빌드 시스템**
  - electron-builder 설정
  - 플랫폼별 빌드 타겟
  - 아이콘 및 메타데이터 설정

#### 해결 과정

1. Electron 프로젝트 초기화
2. 메인 프로세스 구현 (창 생성, 메뉴, 파일 다이얼로그)
3. Preload 스크립트 구현 (IPC 브리지)
4. 빌드 시스템 설정
5. 문서 작성

#### 개선 사항

- 네이티브 앱처럼 동작
- 시스템 메뉴 통합
- 파일 시스템 직접 접근
- 독립 실행형 앱

---

### 2026-02-01: 편집 패널 UI 개선 및 자동 저장 시스템 구현 (v0.2.4.13)

#### 🎯 주요 작업

1. **편집 패널 UI 대폭 개선**
   - 버튼 재구성: 메모리 저장 / 파일 저장 / 원본으로 / 닫기
   - 중앙 상태 표시 영역 추가 (변경 횟수, 저장 시간)
   - 시각적 구분 강화

2. **즉시 저장 기능 구현**
   - `saveEditedContentNow()` 메서드 추가
   - 확인 없이 즉시 저장 (메모리)
   - 마지막 저장 시간 표시

3. **원본 복원 기능 구현**
   - `restoreOriginal()` 메서드 추가
   - 확인 대화상자로 원본으로 되돌리기
   - 편집 히스토리 초기화

4. **편집 패널 닫기 기능 구현**
   - `closeEditPanel()` 메서드 추가
   - 변경사항이 있으면 저장 여부 확인
   - 예/아니오/취소 옵션 제공

5. **파일 다운로드 기능 구현**
   - `downloadEditedFile()` 메서드 추가
   - 편집 내용을 파일로 다운로드
   - 파일명에 타임스탬프 자동 추가

6. **자동 저장 시스템 구현**
   - 5분마다 자동 저장 (`saveEditedContentNow()`)
   - 편집 모드 활성화 시 자동 시작
   - 편집 모드 비활성화 시 자동 정지

7. **로컬스토리지 임시 저장 구현**
   - 30초마다 자동 저장 (로컬스토리지)
   - 브라우저 새로고침 시 복원 기능
   - 저장 시각 표시 및 확인 대화상자
   - 편집 모드 종료 시 자동 정리

#### 배운 점

- **자동 저장 시스템 설계**
  - 두 가지 자동 저장 방식 (메모리 저장 vs 로컬스토리지)
  - 타이머 관리 및 정리 중요성
  - 사용자 경험 개선 (브라우저 새로고침 시 복원)

- **편집 상태 관리**
  - 변경 횟수 추적
  - 마지막 저장 시간 표시
  - 상태별 색상 구분

- **UI/UX 개선**
  - 버튼 그룹화 및 역할 명확화
  - 상태 표시 영역 추가
  - 툴팁으로 사용법 안내

#### 해결 과정

1. 편집 패널 버튼 재구성
2. 즉시 저장 기능 구현
3. 원본 복원 기능 구현
4. 편집 패널 닫기 기능 구현
5. 파일 다운로드 기능 구현
6. 자동 저장 시스템 구현
7. 로컬스토리지 임시 저장 구현
8. 편집 상태 표시 개선

#### 개선 사항

- 편집 패널 UI 개선
- 자동 저장 시스템 구축
- 브라우저 새로고침 시 복원 기능
- 편집 상태 표시 개선
- 단축키 개선 (Ctrl+S)

---

### 2026-02-01: 링크 수정 및 삭제 기능 구현 (v0.2.4.11)

#### 🎯 주요 작업

1. **링크 수정 및 삭제 기능 구현**
   - 더블클릭으로 링크 URL 및 텍스트 수정
   - Alt+클릭으로 링크 삭제 (텍스트는 유지)
   - 우클릭 컨텍스트 메뉴 (수정/복사/열기/삭제)
   - URL 유효성 검사 (`new URL()` 사용)
   - 링크 목록 조회 기능 (`getAllLinks()` 메서드)

2. **선택 영역 자동 저장 시스템**
   - 편집 모드에서 텍스트 선택 시 자동 저장
   - 5초 후 자동 만료 (타이머 관리)
   - 링크/이미지/테이블 삽입 시 저장된 선택 영역 사용
   - 선택 영역 저장 시 토스트 메시지 표시

3. **링크 스타일 및 UI 개선**
   - 기본 링크 스타일 추가 (파란색 밑줄)
   - 편집 모드에서 링크 강조 (점선 테두리)
   - 편집 패널 사용 방법 안내 추가
   - 링크 삽입 시 툴팁 추가

#### 📚 배운 점

1. **이벤트 리스너 관리**
   - `closest('a')`로 링크 요소 찾기
   - `preventDefault()`와 `stopPropagation()`으로 기본 동작 방지
   - 이벤트 버블링 제어

2. **URL 유효성 검사**
   - `new URL()` 생성자로 URL 형식 검증
   - try-catch로 에러 처리

3. **선택 영역 관리**
   - `window.getSelection()`과 `Range` 객체 사용
   - `cloneRange()`로 선택 영역 복사
   - 전역 변수(`window.lastSelectionRange`)로 선택 영역 저장

4. **컨텍스트 메뉴 구현**
   - 동적 메뉴 생성 및 위치 조정
   - 외부 클릭 시 자동 닫기
   - 다크 모드 지원

#### 🔧 해결 과정

1. **선택 영역 해제 문제**
   - 문제: 링크 삽입 시 선택 영역이 해제됨
   - 해결: `mouseup` 이벤트로 선택 영역 자동 저장
   - 결과: 선택 영역이 유지되어 링크 삽입 가능

2. **URL 유효성 검사**
   - 문제: 잘못된 URL 형식도 저장됨
   - 해결: `new URL()` 생성자로 검증
   - 결과: 유효한 URL만 저장

3. **컨텍스트 메뉴 위치**
   - 문제: 메뉴가 화면 밖으로 나감
   - 해결: `getBoundingClientRect()`로 위치 조정
   - 결과: 화면 내에 메뉴 표시

#### 💡 개선 사항

1. **사용자 경험 개선**
   - 링크 관리 단축키 안내
   - 토스트 메시지로 피드백 제공
   - 편집 모드에서 링크 시각적 강조

2. **코드 구조 개선**
   - 이벤트 리스너를 `#setupLinkEvents()`로 분리
   - 링크 관련 메서드를 private 메서드로 캡슐화
   - `getAllLinks()` public 메서드로 외부 접근 가능

---

### 2026-02-01: 편집 기능 및 UI 개선 (v0.2.4.10)

#### 🎯 주요 개선사항

1. **ERR_CONNECTION_REFUSED 에러 메시지 제거**
   - 외부 디버깅 서비스 사용 가능 여부를 1회만 체크
   - 서비스가 사용 불가능하면 fetch 호출 자체를 하지 않아 콘솔 에러 제거
   - `ContentRenderer.js`와 `viewer.js`에 조건부 로그 전송 로직 추가

2. **편집 기능 개선**
   - 제목, 인용, 코드, 목록 변환 시 마크다운 문법 텍스트 대신 실제 HTML 요소로 삽입
   - 링크 삽입 시 실제 `<a>` 태그로 삽입
   - 이미지 삽입 시 실제 `<img>` 태그로 삽입
   - 테이블 삽입 시 실제 `<table>` HTML 구조로 삽입
   - 모든 편집 기능에 편집 모드 체크 및 히스토리 저장 기능 추가

3. **UI 개선**
   - 읽기 진행률 표시 상자 테두리 제거
   - 상단 버튼을 파스텔톤 색상으로 변경
   - 버튼 배경색 채도 낮춤
   - 모든 버튼 텍스트 색상을 `text-gray-800`으로 통일

#### 📚 배운 점

- **조건부 네트워크 요청**
  - 서비스 사용 가능 여부를 캐싱하여 불필요한 요청 방지
  - 사용자 경험 개선 (콘솔 에러 제거)

- **편집 모드에서의 HTML 요소 삽입**
  - contentEditable 환경에서는 마크다운 문법이 아닌 실제 HTML 요소로 삽입해야 함
  - 사용자가 즉시 시각적으로 확인 가능

#### 🔧 기술적 세부사항

1. **조건부 디버깅 로그 전송**
```javascript
async #checkDebugService() {
    if (this.#debugServiceAvailable !== null) {
        return this.#debugServiceAvailable;
    }
    try {
        const response = await fetch('http://127.0.0.1:7242/health', {
            method: 'GET',
            signal: AbortSignal.timeout(500)
        });
        this.#debugServiceAvailable = response.ok;
    } catch (error) {
        this.#debugServiceAvailable = false;
    }
    return this.#debugServiceAvailable;
}
```

2. **HTML 요소로 변환 삽입**
```javascript
convertToMarkdown(type) {
    let element;
    switch(type) {
        case 'heading':
            element = document.createElement('h2');
            element.textContent = selectedText;
            break;
        case 'quote':
            element = document.createElement('blockquote');
            element.textContent = selectedText;
            break;
        // ...
    }
    range.deleteContents();
    range.insertNode(element);
}
```

---

### 2026-02-01: 편집 기능 대폭 개선 (v0.2.4.9)

#### 🎯 주요 개선사항

1. **편집 모드 시스템**
   - contentEditable 활성화로 직접 텍스트 편집 가능
   - 편집 중인 영역에 파란색 점선 테두리 표시
   - 편집 패널 닫을 때 저장 여부 확인

2. **편집 히스토리 시스템**
   - 0.5초마다 변경사항 자동 저장
   - 최대 50개 편집 상태 유지
   - 중간 상태에서 편집 시 새로운 분기 생성

3. **실행 취소/다시 실행**
   - Ctrl+Z: 최대 50단계 실행 취소
   - Ctrl+Y: 다시 실행
   - 토스트 알림으로 현재 상태 표시

4. **키보드 단축키**
   - Ctrl+Z/Y: 실행 취소/다시 실행
   - Ctrl+S: 저장
   - Esc: 편집 모드 종료

5. **토스트 알림 시스템**
   - 성공/경고 메시지 표시
   - 2초 후 자동 사라짐
   - fadeInOut 애니메이션

6. **저장 기능**
   - HTML → 마크다운 자동 변환
   - 파일 객체 업데이트
   - 다운로드 권장 안내

#### 📚 배운 점

- **contentEditable 활용**
  - 브라우저 네이티브 편집 기능 활용
  - HTML 구조를 유지하면서 편집 가능
  - 포맷 버튼과 연동하여 스타일 적용

- **편집 히스토리 관리**
  - 배열 기반 히스토리 저장
  - 인덱스로 현재 상태 추적
  - 분기 처리로 새로운 편집 경로 지원

- **사용자 피드백**
  - 토스트 알림으로 즉각적인 피드백
  - 시각적 표시 (테두리, 버튼 색상)
  - 상태 표시 (실행 취소 3/10)

#### 🔧 기술적 세부사항

1. **편집 히스토리 저장**
```javascript
#saveToHistory() {
    const currentContent = viewerContent.innerHTML;
    if (this.#editHistory[this.#editHistoryIndex] !== currentContent) {
        // 현재 인덱스 이후의 히스토리 삭제 (새로운 분기)
        this.#editHistory = this.#editHistory.slice(0, this.#editHistoryIndex + 1);
        // 새 히스토리 추가
        this.#editHistory.push(currentContent);
        this.#editHistoryIndex++;
        // 최대 50개 유지
        if (this.#editHistory.length > 50) {
            this.#editHistory.shift();
            this.#editHistoryIndex--;
        }
    }
}
```

2. **토스트 알림**
```javascript
#showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
    toast.style.animation = 'fadeInOut 2s ease-in-out';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}
```

#### 📝 관련 문서
- `EDIT_IMPROVEMENT_COMPLETE_GUIDE.md`
- `IMPROVED_EDIT_FUNCTIONS.js`
- `EDIT_HTML_CSS_ADDITIONS.md`

---

### 2026-02-01: 편집 메뉴 및 읽기 진행률 추가 (v0.2.4.7-8)

#### 🎯 주요 개선사항

1. **킨들 스타일 읽기 진행률 표시 (v0.2.4.7)**
   - 좌측 하단에 위치와 퍼센트 표시
   - 설정 토글로 ON/OFF 가능
   - 앱 정보 자동 숨김 기능
   
2. **편집 메뉴 서브메뉴 (v0.2.4.8)**
   - Google Docs 스타일 계층형 메뉴
   - CSS 애니메이션 (slideInRight)
   - 호버 시 자동 표시

#### 📚 배운 점

- **CSS 서브메뉴 구현**
  - `:hover` 선택자로 서브메뉴 표시/숨김
  - `position: absolute`와 `left-full`로 위치 조정
  - CSS 애니메이션으로 자연스러운 전환
  
- **읽기 진행률 계산**
  - 킨들 스타일: `(scrollTop / scrollHeight) * 1000`
  - 퍼센트: `(scrollTop / (scrollHeight - clientHeight)) * 100`
  
- **테마 클래스 활용**
  - `theme-panel-bg`, `theme-border`, `theme-text-body`
  - 테마 변경 시 자동으로 색상 적용

#### 🔧 기술적 세부사항

1. **서브메뉴 CSS**
```css
.context-menu-item:hover .submenu {
    display: block !important;
}

.submenu {
    animation: slideInRight 0.15s ease-out;
}

@keyframes slideInRight {
    from { opacity: 0; transform: translateX(-5px); }
    to { opacity: 1; transform: translateX(0); }
}
```

2. **읽기 진행률 계산**
```javascript
// 위치 (0-1000)
const location = Math.round((scrollTop / scrollHeight) * 1000);

// 퍼센트 (0-100%)
const percentage = ((scrollTop / (scrollHeight - clientHeight)) * 100).toFixed(1);
```

#### 📝 관련 문서
- `docs/03_troubleshooting/2026-02-01_UI_전환_실패.md`
- `docs/03_troubleshooting/2026-02-01_편집_메뉴_및_읽기_진행률.md`

---

### 2026-02-01: v0.2.4.7 - UI 전환 실패 및 하이라이트 복원 문제 해결

#### 🎯 주요 작업
1. **UI 전환 실패 문제 해결**
   - HTML 구조상 `mainContent`가 `page-upload` 내부에 위치하여 부모를 숨기면 자식도 숨겨지는 문제 발견
   - `uploadAreaContainer`만 `-translate-y-full`로 화면 밖으로 이동하도록 수정
   - `mainContent` 명시적 표시 (`display: block`, `visibility: visible`, `opacity: 1`)
   - 토글 버튼 아이콘(▼)과 텍스트("패널 펼치기") 동기화

2. **파일명 미표시 문제 해결**
   - `#updateFileNameDisplay()` 함수 추가
   - `currentFileName` 요소에 파일명 표시
   - `fileInfo` 요소에 파일 크기 및 글자 수 표시

3. **하이라이트 복원 기능 추가**
   - `#calculateTextIndices()` 메서드로 정확한 텍스트 위치(startIndex/endIndex) 계산
   - `#saveHighlightData()` 함수에 위치 정보 저장 로직 추가
   - `restoreHighlights()` 메서드로 파일 재업로드 시 하이라이트 자동 복원
   - `#applyHighlight()` 메서드로 TreeWalker API 사용하여 정확한 위치 복원
   - 위치 정보가 없는 하이라이트 필터링 (기존 데이터 호환성)
   - 뒤에서부터 복원하여 인덱스 변경 방지

4. **디버깅 로그 개선**
   - UI 전환 과정 로그 추가 (🔄, ✅, 🎉 이모지 사용)
   - 하이라이트 저장/복원 과정 로그 추가 (💾, 🎨, ✅ 이모지 사용)
   - 에러 발생 시 명확한 경고 메시지 출력

#### 📚 배운 점
1. **HTML 구조 이해의 중요성**
   - 부모 요소를 숨기면 자식 요소도 함께 숨겨짐
   - CSS 클래스와 inline style의 우선순위 확인 필요
   - DOM 구조를 정확히 파악한 후 수정해야 함

2. **데이터 저장 시 위치 정보 포함**
   - DOM 요소 기반 저장은 재렌더링 시 실패
   - 텍스트 인덱스 기반 저장이 더 안정적
   - TreeWalker API로 정확한 텍스트 위치 계산 가능

3. **복원 순서의 중요성**
   - 앞에서부터 복원하면 인덱스가 변경됨
   - 뒤에서부터 복원하여 인덱스 변경 방지
   - 배열을 역순으로 순회하는 패턴 유용

4. **UI 상태 동기화**
   - 토글 버튼의 아이콘과 텍스트를 함께 업데이트해야 함
   - 명시적인 스타일 설정으로 CSS 우선순위 문제 방지
   - 여러 요소의 상태를 일관되게 유지

#### 🔧 해결 과정
1. **UI 전환 실패 디버깅**
   ```
   문제: 파일 업로드 후 패널이 사라지지 않음
   원인 분석:
   - page-upload를 숨기면 mainContent도 함께 숨겨짐
   - HTML 구조를 정확히 파악하지 못함
   해결:
   - uploadAreaContainer만 translate-y-full로 이동
   - mainContent 명시적 표시
   ```

2. **파일명 미표시 디버깅**
   ```
   문제: 상단에 "파일을 선택하세요" 텍스트가 남아있음
   원인: 파일명 업데이트 로직 누락
   해결: #updateFileNameDisplay() 함수 추가
   ```

3. **하이라이트 복원 실패 디버깅**
   ```
   문제: 하이라이트가 복원되지 않음
   원인:
   - 위치 정보(startIndex/endIndex)를 저장하지 않음
   - restoreHighlights() 메서드 미구현
   해결:
   - TreeWalker API로 정확한 위치 계산
   - 위치 정보 저장 및 복원 로직 구현
   - 뒤에서부터 복원하여 인덱스 변경 방지
   ```

#### 💡 개선 사항
- **HTML 구조 이해**: DOM 구조를 정확히 파악한 후 수정
- **데이터 저장 전략**: 텍스트 인덱스 기반 저장으로 안정성 향상
- **복원 알고리즘**: 역순 복원으로 인덱스 변경 방지
- **UI 상태 관리**: 명시적 스타일 설정으로 CSS 우선순위 문제 해결
- **디버깅 로그**: 이모지를 사용한 직관적인 로그 메시지

---


### 2026-02-01: v0.2.4.6 - 디버깅 로그 추가 및 문제 발견

#### 🎯 주요 작업
1. **Google Drive API 디버깅 로그 추가**
   - `initGoogleAPI()` 함수에 상세한 로그 추가 (🔍, 🔵, ✅, ❌ 이모지 사용)
   - `gapi` 및 `google` 객체 로드 상태 확인 로그
   - `loadPickerAPI()` 함수에 로그 추가
   - `createPicker()` 함수에 단계별 로그 추가
   - `waitForGoogleAPIScripts()` 함수 추가 (스크립트 로드 대기 기능)
   - 에러 발생 시 상세 정보 출력 (message, stack, name)

2. **viewer.js 디버깅 로그 추가**
   - `displayFileContent()` 함수에 단계별 로그 추가
   - 파일 내용 읽기 과정 로그 (FileReader 사용 여부)
   - 메타데이터 파싱 과정 로그
   - 렌더링 전후 상태 로그
   - fetch를 통한 외부 로깅 시스템 연동 (디버깅 모드)

3. **문제 발견 및 분석**
   - UI 전환 실패 문제 발견 (파일 업로드 후 패널이 사라지지 않음)
   - 파일명 미표시 문제 발견 (상단에 "파일을 선택하세요" 텍스트가 남아있음)
   - 하이라이트 복원 실패 문제 발견 (북마크는 정상 작동하나 하이라이트는 복원 안 됨)
   - HTML 구조 분석 시작 (mainContent와 page-upload 관계 파악)

4. **디버깅 인프라 구축**
   - 외부 로깅 서버 연동 (fetch를 통한 로그 전송)
   - 가설 기반 디버깅 접근법 적용 (H1, H2, H3 등 가설 ID 부여)
   - 단계별 로그로 문제 발생 지점 추적

#### 📚 배운 점
1. **체계적인 디버깅 접근법**
   - 가설 생성 → 로그 추가 → 재현 → 분석 → 수정의 순환 과정
   - 각 단계마다 명확한 로그 포인트 설정
   - 이모지를 사용한 직관적인 로그 메시지

2. **Google API 스크립트 로드 타이밍 문제**
   - `gapi`와 `google` 객체가 비동기적으로 로드됨
   - 스크립트 로드 대기 함수(`waitForGoogleAPIScripts`) 필요
   - 타임아웃 설정으로 무한 대기 방지

3. **디버깅 로그의 중요성**
   - 문제 재현 시 정확한 상태 파악 가능
   - 단계별 로그로 문제 발생 지점 정확히 추적
   - 외부 로깅 시스템으로 브라우저 콘솔 외부에서도 확인 가능

4. **HTML 구조 이해의 중요성**
   - 부모-자식 관계를 정확히 파악해야 함
   - CSS 클래스만으로는 충분하지 않을 수 있음
   - 명시적인 스타일 설정이 필요할 때가 있음

#### 🔧 해결 과정
1. **Google Drive API 디버깅**
   ```
   문제: Google Drive 버튼 클릭 시 오류 발생
   원인 분석:
   - gapi 또는 google 객체가 로드되지 않음
   - 스크립트 로드 타이밍 문제
   해결:
   - waitForGoogleAPIScripts() 함수 추가
   - 각 단계마다 상세한 로그 추가
   - 에러 발생 시 명확한 메시지 출력
   ```

2. **UI 전환 문제 발견**
   ```
   문제: 파일 업로드 후 패널이 사라지지 않음
   발견 과정:
   - 디버깅 로그로 UI 전환 과정 추적
   - HTML 구조 분석 시작
   - mainContent와 page-upload 관계 파악
   ```

3. **하이라이트 복원 문제 발견**
   ```
   문제: 하이라이트가 복원되지 않음
   발견 과정:
   - 북마크는 정상 작동하나 하이라이트는 복원 안 됨
   - 하이라이트 저장/복원 로직 분석 시작
   - 위치 정보 저장 여부 확인 필요
   ```

#### 💡 개선 사항
- **디버깅 인프라**: 외부 로깅 시스템 연동으로 문제 추적 용이
- **로그 가독성**: 이모지를 사용한 직관적인 로그 메시지
- **에러 처리**: 상세한 에러 정보 출력으로 문제 파악 용이
- **단계별 추적**: 각 단계마다 로그를 추가하여 문제 발생 지점 정확히 파악

---


### 2026-01-30: v0.2.4.5 - 하이라이트 시스템 구현 및 버그 수정

#### 🎯 주요 작업
1. **텍스트 하이라이트(형광펜) 시스템 구현**
   - `HighlightManager.js` 모듈 신설
   - 컨텍스트 메뉴에 형광펜 색상 팔레트(5색) UI 추가
   - 텍스트 선택 후 우클릭하여 하이라이트 적용 기능 연결
   - 하이라이트된 영역 우클릭 시 '삭제' 기능 구현
   - 하이라이트 데이터 저장 및 복원 기능

2. **AI 텍스트 변환 오류 수정**
   - Google Gemini API 모델명 변경: `gemini-2.0-flash-exp` → `gemini-2.0-flash` (단종된 exp 모델 제거)
   - 변환 완료 후 파일 확장자가 `.txt`로 남아 렌더링되지 않던 문제 해결
   - 파일 로드 시 `file.content` 메모리 누락 문제 해결

3. **다운로드 기능 오류 수정**
   - `ViewerCoordinator`에 누락되었던 `getCurrentFileName` 메서드 추가
   - 다운로드 시 파일명을 올바르게 가져오도록 수정

4. **컨텍스트 메뉴 버그 수정**
   - 메뉴 HTML 구조 깨짐(중첩 태그 오류) 수정
   - 하이라이트 위에서 우클릭 시 일반 메뉴(북마크 등)가 사라지는 로직 수정
   - Toggle 로직 개선으로 하이라이트 모드와 일반 모드 전환 안정화

5. **UI/UX 개선**
   - 마크다운 가독성 개선: `StyleManager.js`에서 제목(H1)과 서지 정보(H3)의 크기 배율 조정
   - 다크 모드 가독성 개선: 컨텍스트 메뉴에 다크 모드 텍스트 색상(`dark:text-gray-200`) 명시

6. **🐛 긴급 버그 수정 (Hotfix)**
   - **파일 저장 기능 정상화**
     - 상단 툴바의 'MD 저장' 버튼(`downloadMdBtn`) 클릭 시 0바이트(빈 파일)로 저장되던 문제 해결
     - 기존 저장 버튼 이벤트를 `viewer.downloadCurrentFile()` 메서드로 재연결하여 메모리 내 최신 데이터를 저장하도록 수정
   - **뷰어 초기화 오류 수정**
     - `ViewerCoordinator` 생성자에서 `window.viewer` 전역 인스턴스 할당 누락 수정 ("뷰어가 초기화되지 않았습니다" 오류 해결)
   - **HTML 구조 및 중복 ID 정리**
     - `ebook_viewer.html`: 컨텍스트 메뉴 내 중복된 `ctxRemoveHighlight` 버튼 제거
     - '커스텀 메뉴 사용' 토글 스위치가 컨텍스트 메뉴 영역 밖으로 이탈해 있던 HTML 구조 수정

#### 📚 배운 점
1. **하이라이트 시스템 설계**
   - 클래스 기반 모듈 패턴으로 `HighlightManager` 독립 구현
   - 파일별 하이라이트 데이터 분리 저장으로 확장성 확보
   - 컨텍스트 메뉴와의 통합으로 사용자 경험 개선

2. **API 모델 버전 관리의 중요성**
   - 실험적 모델(`exp`)은 단종될 수 있으므로 안정적인 버전 사용
   - 모델명 변경 시 재시도 로직도 함께 업데이트 필요
   - API 문서를 정기적으로 확인하여 최신 정보 유지

3. **파일 처리 시 메모리 관리**
   - `file.content` 같은 큰 데이터는 참조가 끊기지 않도록 주의
   - 파일 객체를 전달할 때 모든 필수 속성 포함 확인
   - 파일 확장자 변경 시 파일명도 함께 업데이트 필요

4. **컨텍스트 메뉴 상태 관리**
   - 하이라이트 모드와 일반 모드를 명확히 구분
   - Toggle 로직으로 상태 전환 안정화
   - HTML 구조 검증으로 중첩 태그 오류 방지

#### 🔧 해결 과정
1. **AI 변환 오류 디버깅**
   ```
   문제: 변환된 파일이 렌더링되지 않음
   원인 분석:
   - 파일 확장자가 .txt로 남아있음
   - file.content가 undefined로 전달됨
   해결:
   - 파일명을 .md로 강제 변환
   - file 객체에 content 속성 명시적으로 포함
   ```

2. **다운로드 기능 오류 디버깅**
   ```
   문제: 다운로드 시 파일명이 undefined
   원인: ViewerCoordinator에 getCurrentFileName 메서드 누락
   해결: 메서드 추가 및 파일명 가져오기 로직 구현
   ```

3. **컨텍스트 메뉴 버그 디버깅**
   ```
   문제: 하이라이트 위에서 우클릭 시 일반 메뉴가 사라짐
   원인: Toggle 로직이 단순히 display: none으로 처리
   해결: 상태 기반으로 메뉴 항목 표시/숨김 로직 개선
   ```

4. **파일 저장 기능 오류 디버깅**
   ```
   문제: MD 저장 버튼 클릭 시 0바이트 파일로 저장됨
   원인: 저장 버튼 이벤트가 잘못된 함수에 연결되어 있음
   해결: viewer.downloadCurrentFile() 메서드로 재연결하여 메모리 내 최신 데이터 저장
   ```

5. **뷰어 초기화 오류 디버깅**
   ```
   문제: "뷰어가 초기화되지 않았습니다" 오류 발생
   원인: ViewerCoordinator 생성자에서 window.viewer 전역 인스턴스 할당 누락
   해결: 생성자에 window.viewer = this; 추가
   ```

6. **HTML 구조 오류 디버깅**
   ```
   문제: 중복된 ID와 잘못된 HTML 구조
   원인: 컨텍스트 메뉴 내 중복된 ctxRemoveHighlight 버튼, 토글 스위치 위치 오류
   해결: 중복 ID 제거 및 HTML 구조 정리
   ```

#### 💡 개선 사항
- **모듈화**: 하이라이트 기능을 독립 모듈로 분리하여 유지보수성 향상
- **에러 처리**: 파일 처리 시 null/undefined 체크 강화
- **사용자 경험**: 다크 모드에서도 텍스트가 명확히 보이도록 색상 명시
- **전역 인스턴스 관리**: ViewerCoordinator 생성 시 window.viewer에 할당하여 전역 접근성 보장
- **HTML 구조 검증**: 중복 ID 제거 및 구조 정리로 렌더링 안정성 향상
- **파일 저장 안정성**: 메모리 내 최신 데이터를 직접 참조하여 저장하도록 개선

---

### 2026-01-30: 문서화 체계화 및 개발 규칙 정리

#### 🎯 주요 작업
1. **RELEASE_NOTES 기반 문서 업데이트**
   - `RELEASE_NOTES_v0.2.4.1.md`를 참고하여 모든 문서의 버전 번호 일관성 유지
   - `CHANGELOG.md`, `PROJECT_BRIEF.md`, `QUICKSTART.md`, `GITHUB_DEPLOY_GUIDE.md` 등 업데이트
   - 버전 번호가 있는 모든 파일 동기화 (config.js, viewer.js, HTML 타이틀)

2. **DEV_NOTE.md 체계화**
   - 개발 규칙 및 베스트 프랙티스 섹션 강화
   - 트러블슈팅 가이드를 심각도별로 재구성
   - 실제 발생한 이슈 7개를 체계적으로 정리
   - 빠른 참조 섹션 추가 (표 형식)

3. **트러블슈팅 가이드 개선**
   - 심각도별 분류: 높음(Critical), 중간(Medium), 낮음(Low)
   - 각 문제별 해결 방법, 체크리스트, 관련 문서 링크 제공
   - 일반적인 디버깅 절차 문서화

#### 📚 배운 점
1. **문서 일관성의 중요성**
   - 버전 번호가 여러 파일에 분산되어 있으면 업데이트 시 누락 위험
   - 체크리스트를 만들어 놓으면 실수 방지
   - RELEASE_NOTES를 기준으로 모든 문서를 업데이트하는 것이 효율적

2. **트러블슈팅 문서화의 가치**
   - 실제 발생한 문제를 기록해두면 향후 유사한 문제 해결 시간 단축
   - 심각도별 분류로 우선순위 파악 용이
   - 체크리스트 제공으로 빠른 진단 가능

3. **개발 규칙 명확화의 효과**
   - 베스트 프랙티스를 문서화하면 코드 품질 일관성 유지
   - 새 팀원 온보딩 시간 단축
   - 코드 리뷰 시 기준 명확

#### 🔧 적용된 개선사항
- **버전 업데이트 체크리스트**: 8개 항목으로 체계화
- **코드 리뷰 체크리스트**: 필수/선택 항목 구분
- **빠른 참조 표**: 자주 발생하는 문제와 해결책 한눈에 확인
- **참고 자료 섹션**: 관련 문서 링크 정리

#### 📝 문서화 워크플로우
```
1. RELEASE_NOTES 작성 (변경사항 요약)
   ↓
2. 버전 번호 업데이트 (config.js, viewer.js, HTML)
   ↓
3. CHANGELOG.md 업데이트 (상세 변경 이력)
   ↓
4. 관련 문서 업데이트 (PROJECT_BRIEF.md, QUICKSTART.md 등)
   ↓
5. DEV_NOTE.md 업데이트 (개발 규칙, 트러블슈팅)
   ↓
6. 커밋 및 푸시
```

---

### 2026-01-30: v0.2.4.1 최종 완료 및 문서 업데이트
#### ✅ 완료된 작업
1. **v0.2.4.1 릴리스 완료**
   - 모든 모듈 import 오류 수정
   - 디버깅 코드 완전 제거
   - 프로덕션 준비 완료 상태

2. **문서 업데이트 작업**
   - 모든 문서의 버전 번호를 v0.2.4.1로 업데이트
   - `CHANGELOG.md`: v0.2.4.1 항목 추가
   - `PROJECT_BRIEF.md`: 최신 변경사항 반영
   - `QUICKSTART.md`: 버전 정보 업데이트
   - `GITHUB_DEPLOY_GUIDE.md`: 배포 가이드 업데이트
   - `DEV_NOTE.md`: 개발 규칙 문서화
   - `ebook_viewer.html`: 타이틀 버전 업데이트
   - `src/js/config.js`: APP_VERSION 업데이트
   - `src/js/viewer.js`: exportData 함수의 version 필드 업데이트

3. **새로 추가된 문서**
   - `TEST_CHECKLIST.md`: 6단계 테스트 프로세스
   - `GITHUB_DEPLOY_GUIDE.md`: GitHub Pages 배포 가이드
   - `QUICKSTART.md`: 3단계 빠른 시작 가이드
   - `RELEASE_NOTES_v0.2.4.1.md`: 릴리스 노트
   - `test_modules.html`: 모듈 로딩 테스트 도구

#### 🎯 주요 해결 과제
- **문제:** 버튼 클릭 시 "함수가 정의되지 않음" 오류
- **원인 분석:**
  1. `main.js`에 디버깅 코드(fetch 호출) 8개 남아있음
  2. `viewer.js`에서 export된 함수들이 `main.js`의 import에 누락
  3. `toggleBookmark` 함수가 import 목록에 없음
  
#### 💡 해결 방법
1. **디버깅 코드 제거**
   ```bash
   # 디버깅 fetch 호출 제거
   sed '/fetch.*7242.*ingest/d' main.js > main_clean.js
   ```

2. **누락된 함수 추가 (viewer.js)**
   - `downloadAsMarkdown()` - 마크다운 다운로드
   - `handleAIClean()` - AI 변환
   - `toggleFavorite()` - 즐겨찾기
   - `resetAllSettings()` - 설정 초기화
   - `exportData()` / `importData()` - 데이터 백업/복원
   - `restoreContextMenuSetting()` - 컨텍스트 메뉴 설정

3. **import 구문 수정 (main.js)**
   ```javascript
   // ❌ 이전 (toggleBookmark 누락)
   import { ..., toggleBookmarksSection, handleAIClean, ... }
   
   // ✅ 수정 (toggleBookmark 추가)
   import { ..., toggleBookmarksSection, toggleBookmark, handleAIClean, ... }
   ```

4. **window 객체에 전역 함수 할당**
   ```javascript
   // 모든 함수를 window에 할당하여 HTML onclick에서 사용 가능하게 함
   window.toggleBookmark = toggleBookmark;
   window.downloadAsMarkdown = downloadAsMarkdown;
   window.handleAIClean = handleAIClean;
   // ... 기타 함수들
   ```

#### 📚 배운 점
1. **ES6 모듈 시스템의 이해**
   - export된 함수는 반드시 import해야 함
   - HTML의 onclick 속성에서 사용하려면 window 객체에 할당 필요
   - 상대 경로는 정확해야 함 (`./`, `../`)

2. **클래스 기반 구조의 장점**
   - 캡슐화: 각 클래스가 독립적으로 작동
   - 유지보수: 한 클래스만 수정하면 다른 부분에 영향 없음
   - 확장성: 새 기능 추가 시 새 클래스만 만들면 됨
   ```javascript
   // 예: FileManager 수정 시 다른 부분에 영향 없음
   class FileManager {
       #files = [];  // private 필드로 데이터 보호
       
       addFile(file) { ... }
       searchFiles(query) { ... }  // 새 기능 추가 용이
   }
   ```

3. **디버깅 전략**
   - **test_modules.html 활용**: 각 모듈을 순차적으로 로드하여 어느 부분에서 실패하는지 정확히 파악
   - **브라우저 콘솔 활용**: `console.log(typeof window.functionName)` 으로 함수 할당 확인
   - **import 경로 검증**: 상대 경로가 정확한지 확인 (대소문자, .js 확장자)

#### 🔧 모듈 구조 최종 확정
```
src/js/
├── main.js                    # 앱 초기화, 전역 함수 할당
├── config.js                  # 버전 정보
├── utils.js                   # 유틸리티 함수
├── settings.js                # 설정 관리
├── ai_service.js              # AI 변환
├── google_drive.js            # Google Drive 연동
├── viewer.js                  # 뷰어 코디네이터 (ViewerCoordinator 클래스)
└── modules/                   # 클래스 모듈
    ├── BookmarkManager.js     # 북마크 관리
    ├── ContentRenderer.js     # 콘텐츠 렌더링
    ├── FileManager.js         # 파일 관리
    ├── HistoryManager.js      # 히스토리 관리
    └── StyleManager.js        # 스타일 관리
```

#### 📝 체크리스트: 모듈 오류 해결
- [x] 1. **test_modules.html 실행**: 모든 모듈이 로드되는지 확인 ✅
- [x] 2. **브라우저 콘솔 확인**: "모든 전역 함수 할당 완료" 메시지 확인 ✅
- [x] 3. **함수 존재 확인**: `console.log(typeof window.functionName)` ✅
- [x] 4. **import 검증**: viewer.js의 export와 main.js의 import 일치 확인 ✅
- [x] 5. **경로 확인**: 상대 경로 정확성 (`./`, `../`) ✅
- [x] 6. **강제 새로고침**: Ctrl + Shift + R (캐시 문제 방지) ✅
- [x] 7. **디버깅 코드 제거**: 모든 fetch 디버깅 호출 제거 ✅
- [x] 8. **문서 업데이트**: 모든 문서의 버전 번호 일치 확인 ✅

#### ⚠️ 주의사항
1. **file:// 프로토콜 사용 금지**
   - ES6 모듈은 CORS 정책 때문에 file:// 에서 작동 안 함
   - 반드시 웹 서버 사용: `python -m http.server 8000`

2. **import 순서**
   - 의존성이 있는 모듈을 먼저 import
   - 예: viewer.js → modules/*.js → utils.js, settings.js

3. **대소문자 구분**
   - Linux/Unix 시스템은 대소문자를 구분함
   - `FileManager.js` ≠ `filemanager.js`

---

### 2026-01-30: 클래스 기반 모듈 구조 채택 (v0.2.4)
#### 🔧 주요 변경사항
1. **에이전트 1 채택**
   - 클래스 기반 모듈 패턴을 메인 구현으로 채택
   - `ViewerCoordinator` 클래스로 모든 관리자 클래스 통합
   - `src/js/modules/` 폴더에 클래스 모듈 배치

2. **파일 구조 정리**
   - 중복된 `src/js/viewer/` 폴더 제거
   - 사용하지 않는 에이전트 제안 파일 삭제 (agent2, agent3)
   - 관련 테스트 스크립트 및 문서 정리
   - `viewer.js.backup` 파일 제거

3. **누락된 함수 추가**
   - `downloadAsMarkdown()`: 마크다운 파일 다운로드
   - `handleAIClean()`: AI 변환 처리
   - `toggleFavorite()`: 즐겨찾기 토글
   - `resetAllSettings()`: 모든 설정 초기화
   - `exportData()` / `importData()` / `handleImportDataFile()`: 데이터 백업/복원
   - `restoreContextMenuSetting()` / `toggleContextMenuSetting()`: 컨텍스트 메뉴 설정

#### 📚 배운 점
- **클래스 기반 설계의 실전 적용**
  - 단일 책임 원칙(SRP) 준수로 코드 유지보수성 향상
  - 싱글톤 패턴으로 인스턴스 관리 단순화
  - private 필드(#)로 데이터 캡슐화

---

### 2026-01-02: 하이라이트 및 컨텍스트 메뉴 개선 (v0.2.3.2)
#### 🎯 주요 개선사항
1. **하이라이트 기능 개선**
   - 하이라이트 클릭 시 자동으로 텍스트 선택되어 색상 변경 가능
   - 텍스트 선택 영역 자동 저장 (mouseup 이벤트)
   - 하이라이트 적용 시 에러 처리 강화

2. **컨텍스트 메뉴 개선**
   - 커스텀 메뉴 비활성화 시 브라우저 기본 메뉴 정상 표시
   - Ctrl + 우클릭으로 브라우저 기본 메뉴 접근 가능
   - 토글 UI 동기화 문제 해결

3. **파일 출처 시각적 구분**
   - Google Drive 파일과 로컬 파일을 시각적으로 구분
   - 히스토리 및 북마크 목록에 출처 표시

#### 📝 관련 문서
- `docs/03_troubleshooting/2026-01-02_하이라이트_및_컨텍스트_메뉴_개선.md`

---

### 2025-12-24: Cursor 활용법 및 Google Picker
- **Cursor 활용법:** 무작정 코드를 고쳐달라고 하기보다, 먼저 **"Plan 모드"**처럼 단계별 계획을 물어보는 것이 더 안전하다.
- **Google Picker:** API 키 설정 시 'Google Picker API' 라이브러리를 꼭 켜야 한다.

---

## 3. 프로젝트 철학

### 클래스 기반 설계를 선택한 이유
1. **단일 책임 원칙 (SRP)**
   - 각 클래스는 하나의 책임만 가짐
   - 예: FileManager는 파일 관리만, BookmarkManager는 북마크만

2. **캡슐화를 통한 부작용 최소화**
   - private 필드(#)로 내부 데이터 보호
   - 한 클래스 수정이 다른 클래스에 영향 없음

3. **확장 가능성**
   ```javascript
   // 새 기능 추가 시 새 클래스만 만들면 됨
   export class SearchManager {
       searchText(query) { ... }
       highlightResults() { ... }
   }
   ```

4. **테스트 용이성**
   ```javascript
   // 각 클래스를 독립적으로 테스트 가능
   const fileManager = new FileManager();
   fileManager.addFile(testFile);
   assert(fileManager.getFiles().length === 1);
   ```

---

## 4. 트러블슈팅 가이드

### 🔴 심각도: 높음 (Critical)

#### 문제 1: 모든 버튼 작동 불가
**증상:**
```
Uncaught ReferenceError: selectFiles is not defined
Uncaught ReferenceError: loadGoogleDriveFiles is not defined
Uncaught SyntaxError: The requested module './viewer.js' does not provide an export named 'restoreBodyStyles'
```

**원인:**
1. ES6 모듈과 HTML `onclick` 속성 충돌
2. 함수가 export되지 않아 import 실패
3. 모듈 로딩 실패로 인한 전역 함수 미할당

**해결 방법:**
1. **HTML에서 `onclick` 속성 제거**
   ```html
   <!-- ❌ 잘못된 방법 -->
   <button onclick="selectFiles()">파일 선택</button>
   
   <!-- ✅ 올바른 방법 -->
   <button id="selectFilesBtn">파일 선택</button>
   ```

2. **JavaScript에서 이벤트 리스너 추가**
   ```javascript
   // main.js
   const selectFilesBtn = document.getElementById('selectFilesBtn');
   selectFilesBtn.addEventListener('click', selectFiles);
   ```

3. **함수 export 확인**
   ```javascript
   // viewer.js
   export function restoreBodyStyles() { ... }
   
   // main.js
   import { restoreBodyStyles } from './viewer.js';
   window.restoreBodyStyles = restoreBodyStyles;
   ```

**체크리스트:**
- [ ] HTML에 `onclick` 속성이 없는가?
- [ ] 모든 함수가 `export`되어 있는가?
- [ ] `main.js`에서 모든 함수를 import하고 있는가?
- [ ] `window` 객체에 함수가 할당되어 있는가?
- [ ] 브라우저 콘솔에 모듈 로딩 오류가 없는가?

**관련 문서:** `docs/03_troubleshooting/2025-12-26_모든_버튼_작동_불가_문제.md`

---

#### 문제 2: Google Gemini API 404 오류
**증상:**
```
HTTP 404: Model not found
AI 변환 기능이 작동하지 않음
```

**원인:**
- Google Gemini API의 모델 정책 변경
- 별칭 모델명(`gemini-1.5-flash`, `latest`) 폐기
- 구체적인 버전 번호 필요

**해결 방법:**
```javascript
// ❌ 잘못된 방법 (별칭 사용)
const model = 'gemini-1.5-flash';  // 404 오류 발생
const model = 'gemini-1.5-flash-latest';  // 404 오류 발생

// ✅ 올바른 방법 (구체적인 버전 사용)
const model = 'gemini-1.5-flash-002';  // 안정적
const fallbackModel = 'gemini-2.0-flash-exp';  // 폴백
```

**재시도 로직:**
```javascript
// ai_service.js
try {
    return await tryModel('gemini-1.5-flash-002');
} catch (error) {
    console.warn(`기본 모델 실패: ${error.message}`);
    return await tryModel('gemini-2.0-flash-exp');
}
```

**체크리스트:**
- [ ] 모델명이 구체적인 버전 번호인가? (예: `gemini-1.5-flash-002`)
- [ ] 별칭(`latest`, `-latest`)을 사용하지 않았는가?
- [ ] 재시도 로직이 구현되어 있는가?
- [ ] API 키가 올바르게 설정되어 있는가?

**관련 문서:** `docs/03_troubleshooting/2025-12-26_Gemini_API_404_오류.md`

---

### 🟡 심각도: 중간 (Medium)

#### 문제 3: Markdown 렌더링 문제
**증상:**
- 마크다운 파일이 일반 텍스트로 표시됨
- 코드 블록으로 감싸져서 표시됨
- `## 제목` 같은 문법이 그대로 보임

**원인:**
- AI 변환으로 생성된 파일이 ` ```markdown ... ``` ` 형태로 저장됨
- 코드 블록 래퍼가 제거되지 않아 `marked.js`가 코드 블록으로 인식

**해결 방법:**
```javascript
// viewer.js - displayFileContent()
// 1. 정규식으로 완전한 코드 블록 감지
const codeBlockPattern = /^```[\w]*\s*\n([\s\S]*?)\n\s*```\s*$/;
const codeBlockMatch = content.match(codeBlockPattern);

if (codeBlockMatch) {
    content = codeBlockMatch[1].trim();
} else if (content.startsWith('```')) {
    // 2. 폴백: 라인 기반 처리
    const lines = content.split('\n');
    if (lines[0].trim().startsWith('```')) {
        // 닫는 마커가 없어도 첫 줄 제거
        content = lines.slice(1).join('\n');
    }
}
```

**체크리스트:**
- [ ] 코드 블록 래퍼 제거 로직이 있는가?
- [ ] 정규식과 라인 기반 폴백 로직이 모두 있는가?
- [ ] 닫는 마커가 없는 경우도 처리되는가?

**관련 문서:** `docs/03_troubleshooting/2025-12-26_Markdown_렌더링_문제.md`

---

#### 문제 4: 모듈 import 오류 (v0.2.4.1)
**증상:**
```
Uncaught SyntaxError: The requested module './viewer.js' does not provide an export named 'toggleBookmark'
```

**원인:**
- `viewer.js`에서 export된 함수가 `main.js`의 import 목록에 누락
- 디버깅 코드(fetch 호출)가 남아있어 코드 품질 저하

**해결 방법:**
1. **import 목록 확인**
   ```javascript
   // main.js - 모든 export 함수를 import
   import { 
       toggleBookmark,  // ✅ 추가
       downloadAsMarkdown,
       handleAIClean,
       // ... 기타 함수들
   } from './viewer.js';
   ```

2. **디버깅 코드 제거**
   ```javascript
   // ❌ 제거해야 할 코드
   fetch('http://localhost:7242/ingest', { ... });
   ```

3. **window 객체 할당 확인**
   ```javascript
   // main.js
   window.toggleBookmark = toggleBookmark;
   ```

**체크리스트:**
- [ ] `viewer.js`의 모든 `export` 함수가 `main.js`에 import되어 있는가?
- [ ] 디버깅 코드가 제거되었는가?
- [ ] `window` 객체에 모든 함수가 할당되어 있는가?

---

#### 문제 8: Google Drive 버튼 작동 안 함 (v0.2.4.2)
**증상:**
- Google Drive 버튼 클릭 시 아무 반응 없음
- 브라우저 콘솔에 오류 없음 (함수는 정의되어 있음)

**원인:**
- HTML 버튼에 `onclick` 속성 누락
- 이벤트 리스너 등록 코드도 없음
- 다른 버튼들은 onclick 속성이 있으나 Google Drive 버튼만 누락

**해결 방법:**
```html
<!-- ❌ 잘못된 방법 -->
<button id="loadGoogleDriveBtn" class="...">
    Google Drive
</button>

<!-- ✅ 올바른 방법 -->
<button id="loadGoogleDriveBtn" onclick="loadGoogleDriveFiles()" class="...">
    Google Drive
</button>
```

**체크리스트:**
- [ ] HTML 버튼에 `onclick` 속성이 있는가?
- [ ] 함수명이 정확한가? (`loadGoogleDriveFiles`)
- [ ] `window.loadGoogleDriveFiles`가 정의되어 있는가?
- [ ] 다른 버튼들과 일관된 방식인가?

**관련 문서:** `docs/03_troubleshooting/2026-01-30_Google_Drive_버튼_오류.md`

---

#### 문제 9: 로컬 파일 로딩 오류 (v0.2.4.3)
**증상:**
```
HistoryManager.js:119 Uncaught TypeError: Cannot read properties of null (reading 'startsWith')
로컬 파일 선택 시 화면이 표시되지 않음
앱 초기화가 중단됨
```

**원인:**
- 히스토리 데이터에 `fileKey: null`인 항목이 있음
- `item.fileKey.startsWith('gdrive_')` 호출 시 null 체크 없음
- 구버전 데이터 또는 데이터 손상으로 인한 문제

**해결 방법:**
```javascript
// ❌ 잘못된 방법
const isGoogleDrive = item.fileKey.startsWith('gdrive_');

// ✅ 올바른 방법 (null 체크 추가)
const isGoogleDrive = item.fileKey ? item.fileKey.startsWith('gdrive_') : false;

// ✅ 더 안전한 방법 (Optional Chaining)
const isGoogleDrive = item.fileKey?.startsWith('gdrive_') ?? false;
```

**방어적 프로그래밍:**
- localStorage 데이터는 항상 검증 필요
- null/undefined 체크 필수
- 기본값 제공

**체크리스트:**
- [ ] localStorage 데이터에 null 값이 있는지 확인했는가?
- [ ] null 체크 로직이 추가되었는가?
- [ ] 기본값이 제공되는가?
- [ ] 구버전 데이터 호환성을 고려했는가?

**관련 문서:** `docs/03_troubleshooting/2026-01-30_HistoryManager_null_체크_오류.md`

---

#### 문제 10: AI 텍스트 변환 오류 (v0.2.4.5)
**증상:**
- AI 변환 후 파일이 렌더링되지 않음
- 파일 확장자가 `.txt`로 남아있음
- `file.content`가 `undefined`로 전달됨

**원인:**
1. **모델명 문제**: `gemini-2.0-flash-exp` 모델이 단종됨
2. **파일 확장자 문제**: 변환 후 파일명이 `.txt`로 유지됨
3. **메모리 누락**: 파일 객체에 `content` 속성이 포함되지 않음

**해결 방법:**
1. **모델명 변경**
   ```javascript
   // ❌ 잘못된 방법 (단종된 모델)
   const model = 'gemini-2.0-flash-exp';
   
   // ✅ 올바른 방법
   const model = 'gemini-2.0-flash';
   ```

2. **파일 확장자 강제 변환**
   ```javascript
   // ai_service.js 또는 viewer.js
   const fileName = file.name.replace(/\.txt$/i, '.md');
   const newFile = {
       ...file,
       name: fileName,
       content: convertedContent
   };
   ```

3. **파일 객체에 content 포함**
   ```javascript
   // 파일 객체 생성 시 content 명시
   const fileObj = {
       name: fileName,
       size: content.length,
       content: content,  // ✅ 명시적으로 포함
       lastModified: Date.now()
   };
   ```

**체크리스트:**
- [ ] 모델명이 최신 안정 버전인가? (`gemini-2.0-flash`)
- [ ] 파일 확장자가 올바르게 변경되었는가? (`.txt` → `.md`)
- [ ] 파일 객체에 `content` 속성이 포함되어 있는가?
- [ ] 파일 전달 시 모든 필수 속성이 포함되어 있는가?

---

#### 문제 11: 다운로드 기능 오류 (v0.2.4.5)
**증상:**
- 다운로드 시 파일명이 `undefined`로 표시됨
- 다운로드 기능이 작동하지 않음

**원인:**
- `ViewerCoordinator` 클래스에 `getCurrentFileName` 메서드가 누락됨
- 다운로드 함수에서 현재 파일명을 가져올 수 없음

**해결 방법:**
```javascript
// viewer.js - ViewerCoordinator 클래스에 추가
getCurrentFileName() {
    const currentFile = this.#fileManager.getCurrentFile();
    return currentFile ? currentFile.name : 'untitled.txt';
}
```

**체크리스트:**
- [ ] `ViewerCoordinator`에 `getCurrentFileName` 메서드가 있는가?
- [ ] 현재 파일이 존재하는지 확인하는 로직이 있는가?
- [ ] 기본 파일명이 제공되는가? (`untitled.txt`)

---

#### 문제 12: 컨텍스트 메뉴 버그 (v0.2.4.5)
**증상:**
- 하이라이트 위에서 우클릭 시 일반 메뉴(북마크 등)가 사라짐
- 메뉴 HTML 구조가 깨져서 일부 항목이 표시되지 않음
- 중첩 태그 오류로 인한 렌더링 문제

**원인:**
1. **Toggle 로직 문제**: 하이라이트 모드와 일반 모드를 전환할 때 단순히 `display: none`으로 처리
2. **HTML 구조 오류**: 태그가 중첩되어 올바르게 닫히지 않음

**해결 방법:**
1. **상태 기반 메뉴 표시**
   ```javascript
   // viewer.js - handleContextMenu()
   if (highlightSpan) {
       // 하이라이트 모드: 삭제 버튼만 표시
       document.getElementById('ctxRemoveHighlight').classList.remove('hidden');
       document.getElementById('normalMenuOptions').style.display = 'none';
   } else {
       // 일반 모드: 모든 메뉴 표시
       document.getElementById('ctxRemoveHighlight').classList.add('hidden');
       document.getElementById('normalMenuOptions').style.display = 'block';
   }
   ```

2. **HTML 구조 검증**
   ```html
   <!-- ❌ 잘못된 방법 (중첩 태그) -->
   <div id="normalMenuOptions">
       <button>북마크 추가</button>
       <div>  <!-- 닫는 태그 누락 -->
   
   <!-- ✅ 올바른 방법 -->
   <div id="normalMenuOptions">
       <button>북마크 추가</button>
   </div>
   ```

**체크리스트:**
- [ ] 하이라이트 모드와 일반 모드가 명확히 구분되는가?
- [ ] HTML 태그가 올바르게 닫혀있는가?
- [ ] 메뉴 항목이 상태에 따라 올바르게 표시/숨김되는가?
- [ ] 브라우저 개발자 도구에서 HTML 구조 오류가 없는가?

---

#### 문제 13: 파일 저장 기능 오류 (v0.2.4.5 Hotfix)
**증상:**
- 상단 툴바의 'MD 저장' 버튼(`downloadMdBtn`) 클릭 시 0바이트(빈 파일)로 저장됨
- 저장된 파일이 비어있거나 내용이 없음

**원인:**
- 저장 버튼 이벤트가 잘못된 함수에 연결되어 있음
- 메모리 내 최신 데이터를 참조하지 않고 오래된 데이터를 저장함

**해결 방법:**
```javascript
// main.js 또는 viewer.js
// ❌ 잘못된 방법
document.getElementById('downloadMdBtn').addEventListener('click', () => {
    downloadFile(...);  // 오래된 데이터 참조
});

// ✅ 올바른 방법
document.getElementById('downloadMdBtn').addEventListener('click', () => {
    if (window.viewer) {
        window.viewer.downloadCurrentFile();  // 메모리 내 최신 데이터 저장
    }
});
```

**체크리스트:**
- [ ] 저장 버튼 이벤트가 올바른 함수에 연결되어 있는가?
- [ ] `viewer.downloadCurrentFile()` 메서드를 사용하는가?
- [ ] 메모리 내 최신 데이터를 참조하는가?

---

#### 문제 14: 뷰어 초기화 오류 (v0.2.4.5 Hotfix)
**증상:**
- "뷰어가 초기화되지 않았습니다" 오류 발생
- `window.viewer`가 `undefined`로 표시됨
- 뷰어 관련 기능이 작동하지 않음

**원인:**
- `ViewerCoordinator` 생성자에서 `window.viewer` 전역 인스턴스 할당 누락
- 다른 모듈에서 `window.viewer`를 참조할 수 없음

**해결 방법:**
```javascript
// viewer.js - ViewerCoordinator 클래스
constructor() {
    this.#fileManager = new FileManager();
    this.#contentRenderer = new ContentRenderer();
    this.#bookmarkManager = new BookmarkManager();
    this.#historyManager = new HistoryManager();
    this.#styleManager = new StyleManager();
    this.#highlightManager = new HighlightManager();
    
    // ✅ 전역 인스턴스 할당 추가
    window.viewer = this;
}
```

**체크리스트:**
- [ ] `ViewerCoordinator` 생성자에 `window.viewer = this;`가 있는가?
- [ ] 다른 모듈에서 `window.viewer`를 참조할 수 있는가?
- [ ] 뷰어 초기화 후 `window.viewer`가 정의되어 있는가?

---

#### 문제 15: HTML 구조 및 중복 ID 오류 (v0.2.4.5 Hotfix)
**증상:**
- 컨텍스트 메뉴 내 중복된 `ctxRemoveHighlight` 버튼이 존재함
- '커스텀 메뉴 사용' 토글 스위치가 컨텍스트 메뉴 영역 밖으로 이탈
- HTML 구조 오류로 인한 렌더링 문제

**원인:**
- HTML 구조가 잘못되어 중복된 ID가 생성됨
- 토글 스위치의 위치가 잘못된 부모 요소 안에 있음

**해결 방법:**
1. **중복 ID 제거**
   ```html
   <!-- ❌ 잘못된 방법 (중복 ID) -->
   <div id="contextMenu">
       <button id="ctxRemoveHighlight">하이라이트 삭제</button>
       <button id="ctxRemoveHighlight">하이라이트 삭제</button>  <!-- 중복 -->
   </div>
   
   <!-- ✅ 올바른 방법 -->
   <div id="contextMenu">
       <button id="ctxRemoveHighlight">하이라이트 삭제</button>
   </div>
   ```

2. **토글 스위치 위치 수정**
   ```html
   <!-- ❌ 잘못된 방법 (토글이 메뉴 밖으로 이탈) -->
   <div id="contextMenu">
       <!-- 메뉴 항목들 -->
   </div>
   <div>  <!-- 잘못된 위치 -->
       <input type="checkbox" id="customMenuToggle">
   </div>
   
   <!-- ✅ 올바른 방법 -->
   <div id="contextMenu">
       <!-- 메뉴 항목들 -->
       <div>  <!-- 메뉴 내부에 위치 -->
           <input type="checkbox" id="customMenuToggle">
       </div>
   </div>
   ```

**체크리스트:**
- [ ] HTML에 중복된 ID가 없는가?
- [ ] 토글 스위치가 올바른 부모 요소 안에 있는가?
- [ ] 브라우저 개발자 도구에서 HTML 구조 오류가 없는가?
- [ ] 모든 태그가 올바르게 닫혀있는가?

---

#### 문제 16: UI 전환 실패 및 하이라이트 복원 문제 (v0.2.4.7)
**증상:**
- 파일 업로드 후 패널이 사라지지 않음
- 상단에 "파일을 선택하세요" 텍스트가 남아있음
- 하이라이트가 복원되지 않음 (북마크는 정상 작동)

**원인:**
1. **HTML 구조 오해**: `mainContent`가 `page-upload` 내부에 위치하여 부모를 숨기면 자식도 숨겨짐
2. **파일명 업데이트 로직 누락**: 파일명을 표시하는 함수가 없음
3. **하이라이트 위치 정보 미저장**: DOM 요소 기반 저장으로 재렌더링 시 실패

**근본 원인 분석:**

**문제 1: UI 전환 실패**

HTML 구조:
```html
<!-- 실제 HTML 구조 -->
<div id="page-upload" class="page-section active">
    <div id="uploadAreaContainer">...</div>
    
    <!-- mainContent가 page-upload 안에 있음! -->
    <div id="mainContent" class="hidden">...</div>
</div>
```

**기존 코드** (viewer.js:266-270):
```javascript
// ❌ 잘못된 코드
if (uploadSection) {
    uploadSection.classList.add('hidden');
    uploadSection.style.display = 'none'; // ← 부모를 숨기면 자식도 숨겨짐!
}
```

**문제 2: 파일명 미표시**
- 파일명 업데이트 로직이 없어서 `currentFileName` 요소가 업데이트되지 않음

**문제 3: 하이라이트 복원 실패**
- 하이라이트 저장 시 위치 정보(startIndex/endIndex)를 저장하지 않음
- `restoreHighlights()` 메서드 미구현

**해결 방법:**

1. **UI 전환 수정** (viewer.js)
   ```javascript
   #forceSwitchToViewerMode() {
       // ❌ page-upload 숨기기 제거
       // ✅ uploadAreaContainer만 화면 밖으로 이동
       if (uploadAreaContainer) {
           uploadAreaContainer.classList.remove('translate-y-0');
           uploadAreaContainer.classList.add('-translate-y-full');
           
           const btnText = document.getElementById('uploadToggleText');
           const btnIcon = document.getElementById('uploadToggleIcon');
           if (btnText) btnText.textContent = '패널 펼치기';
           if (btnIcon) btnIcon.textContent = '▼';
       }
       
       // ✅ mainContent 명시적으로 표시
       if (mainContent) {
           mainContent.classList.remove('hidden');
           mainContent.style.display = 'block';
           mainContent.style.visibility = 'visible';
           mainContent.style.opacity = '1';
       }
   }
   ```

2. **파일명 업데이트 추가** (viewer.js)
   ```javascript
   #updateFileNameDisplay(fileName) {
       const fileNameElement = document.getElementById('currentFileName');
       const fileInfoElement = document.getElementById('fileInfo');
       
       if (fileNameElement) {
           fileNameElement.textContent = fileName || '파일명 없음';
       }
       
       if (fileInfoElement) {
           const file = this.#fileManager.getCurrentFile();
           if (file && file.content) {
               const size = formatFileSize(file.content.length);
               const chars = file.content.length.toLocaleString();
               fileInfoElement.textContent = `크기: ${size} (${chars}자)`;
           }
       }
   }
   ```

3. **하이라이트 복원 기능 추가** (HighlightManager.js)

   **3-1. 위치 정보 저장**:
   ```javascript
   #calculateTextIndices(element, container) {
       const walker = document.createTreeWalker(
           container,
           NodeFilter.SHOW_TEXT,
           null,
           false
       );
       
       let currentIndex = 0;
       let startIndex = -1, endIndex = -1;
       
       while (walker.nextNode()) {
           const node = walker.currentNode;
           const nodeLength = node.textContent.length;
           
           if (element.contains(node)) {
               if (startIndex === -1) startIndex = currentIndex;
               endIndex = currentIndex + nodeLength;
           }
           
           currentIndex += nodeLength;
       }
       
       return { startIndex, endIndex };
   }
   ```

   **3-2. 하이라이트 복원**:
   ```javascript
   restoreHighlights() {
       const highlights = this.getData(this.#currentFileKey);
       const validHighlights = highlights.filter(hl => 
           hl.startIndex !== undefined && hl.endIndex !== undefined
       );
       
       // 뒤에서부터 복원 (인덱스 변경 방지)
       for (let i = validHighlights.length - 1; i >= 0; i--) {
           const hl = validHighlights[i];
           this.#applyHighlight(hl.startIndex, hl.endIndex, hl.color, hl.id);
       }
   }
   ```

**테스트 결과:**

**Before (v0.2.4.6)**
- ❌ 파일 업로드 후 패널이 남아있음
- ❌ "파일을 선택하세요" 텍스트 표시
- ❌ 하이라이트 복원 안 됨

**After (v0.2.4.7)**
- ✅ 파일 업로드 후 즉시 뷰어 모드로 전환
- ✅ 파일명과 크기 정보 표시
- ✅ 하이라이트 자동 복원 (위치 정보 기반)

**체크리스트:**
- [ ] HTML 구조를 정확히 파악했는가? (부모-자식 관계)
- [ ] 부모 요소를 숨기지 않고 자식만 표시하는 방법을 사용했는가?
- [ ] 파일명 업데이트 함수가 구현되어 있는가?
- [ ] 하이라이트 저장 시 위치 정보(startIndex/endIndex)를 포함하는가?
- [ ] 복원 시 뒤에서부터 복원하는가? (인덱스 변경 방지)
- [ ] 기존 데이터 호환성을 고려했는가? (위치 정보 없는 하이라이트 필터링)

**교훈:**
1. **HTML 구조 이해의 중요성**
   - 부모 요소를 숨기면 자식 요소도 함께 숨겨짐
   - CSS 클래스와 inline style의 우선순위 확인 필요

2. **데이터 저장 시 위치 정보 포함**
   - DOM 요소 기반 저장은 재렌더링 시 실패
   - 텍스트 인덱스 기반 저장이 더 안정적

3. **복원 순서의 중요성**
   - 앞에서부터 복원하면 인덱스가 변경됨
   - 뒤에서부터 복원하여 인덱스 변경 방지

**관련 파일:**
- `src/js/viewer.js`
- `src/js/modules/HighlightManager.js`
- `CHANGELOG.md`

**관련 문서:** `docs/03_troubleshooting/2026-02-01_UI_전환_실패.md`

---

### 🟢 심각도: 낮음 (Low)

#### 문제 5: "함수가 정의되지 않음"
```
Uncaught ReferenceError: toggleSettings is not defined
```

**체크리스트:**
1. viewer.js에서 export 확인: `export const toggleSettings = ...`
2. main.js에서 import 확인: `import { toggleSettings } from './viewer.js'`
3. main.js에서 window 할당 확인: `window.toggleSettings = toggleSettings`
4. 브라우저 콘솔에서 확인: `console.log(typeof window.toggleSettings)`
5. 캐시 문제: Ctrl + Shift + R로 강제 새로고침

---

#### 문제 6: "모듈을 찾을 수 없음"
```
Failed to resolve module specifier "./modules/FileManager.js"
```

**체크리스트:**
1. 파일 존재 확인: `ls src/js/modules/FileManager.js`
2. 대소문자 정확히 확인 (`FileManager.js` ≠ `filemanager.js`)
3. .js 확장자 포함 확인
4. 웹 서버 실행 확인 (file:// 불가)
5. 상대 경로 정확성 확인 (`./`, `../`)

---

#### 문제 7: CORS 오류
```
Access to script ... has been blocked by CORS policy
```

**해결:**
```bash
# file:// 대신 웹 서버 사용
python -m http.server 8000
# 또는
npx http-server -p 8000
```

---

### 📋 일반적인 디버깅 절차

1. **브라우저 콘솔 확인** (F12)
   - 오류 메시지 확인
   - 스택 트레이스 분석
   - 네트워크 탭에서 모듈 로딩 확인

2. **test_modules.html 실행**
   - 각 모듈을 순차적으로 로드하여 어느 부분에서 실패하는지 확인
   - `http://localhost:8000/test_modules.html`

3. **import/export 검증**
   ```bash
   # export 확인
   grep -E "export" src/js/viewer.js
   
   # import 확인
   grep -E "import.*from.*viewer" src/js/main.js
   ```

4. **강제 새로고침**
   - Ctrl + Shift + R (캐시 무시)
   - 또는 개발자 도구에서 "Disable cache" 체크

5. **로컬 서버 재시작**
   ```bash
   # 서버 중지 후 재시작
   python -m http.server 8000
   ```

---

## 5. 버전 업데이트 워크플로우

### 새 버전 릴리스 시 체크리스트
1. **코드 변경사항 확인**
   - [ ] 모든 기능이 정상 작동하는지 확인
   - [ ] 테스트 완료 (test_modules.html)
   - [ ] 브라우저 콘솔 오류 없음

2. **버전 번호 업데이트**
   - [ ] `src/js/config.js`: `APP_VERSION` 업데이트
   - [ ] `src/js/viewer.js`: `exportData()` 함수의 `version` 필드 업데이트
   - [ ] `ebook_viewer.html`: `<title>` 태그의 버전 번호 업데이트

3. **문서 업데이트**
   - [ ] `CHANGELOG.md`: 새 버전 항목 추가 (변경사항 상세 기록)
   - [ ] `PROJECT_BRIEF.md`: 버전 정보 및 변경 내역 업데이트
   - [ ] `QUICKSTART.md`: 버전 정보 업데이트
   - [ ] `GITHUB_DEPLOY_GUIDE.md`: 버전 정보 업데이트
   - [ ] `DEV_NOTE.md`: 변경사항 기록

4. **릴리스 노트 작성** (선택사항)
   - [ ] `RELEASE_NOTES_v{version}.md` 작성
   - [ ] 주요 변경사항 요약
   - [ ] 테스트 방법 안내
   - [ ] 배포 방법 안내

5. **Git 커밋 및 푸시**
   ```bash
   git add .
   git commit -m "release: v{version} - {변경사항 요약}"
   git push origin main
   ```

### 버전 번호 규칙
- **Semantic Versioning** 사용: `MAJOR.MINOR.PATCH`
  - `MAJOR`: 호환되지 않는 API 변경
  - `MINOR`: 하위 호환되는 기능 추가
  - `PATCH`: 하위 호환되는 버그 수정
- 예: `0.2.4.1` → `0.2.4`의 패치 버전

---

## 6. 개발 워크플로우

### ⚠️ 중요: 개발 플랫폼 우선순위

**향후 모든 신규 기능은 Electron 버전을 중심으로 개발됩니다.**

#### 개발 우선순위
1. **Electron 버전** (메인 개발 플랫폼)
   - 모든 신규 기능은 Electron 환경에서 먼저 개발 및 테스트
   - Electron 전용 기능 (네이티브 파일 시스템, 메뉴 등) 우선 구현
   - 개발 환경: `npm run dev`로 실행하여 테스트

2. **웹 버전** (호환성 유지)
   - 기존 기능은 유지
   - Electron 전용 기능은 `window.isElectron` 플래그로 조건부 처리
   - 웹 버전에서 사용 불가능한 기능은 자동으로 비활성화

#### 환경별 분기 처리
```javascript
// Electron 전용 기능
if (window.isElectron && window.electronAPI) {
    // Electron API 사용
    await window.electronAPI.saveFile(fileName, content);
} else {
    // 웹 브라우저 폴백
    downloadFile(fileName, content);
}
```

### 새 기능 추가 시
1. **계획 수립**: 어떤 클래스에 추가할지 결정
2. **Electron 환경에서 개발**: `npm run dev`로 실행하여 개발
3. **클래스 수정**: 해당 클래스에 메서드 추가
4. **환경 분기 처리**: Electron 전용 기능은 조건부 처리
5. **export 추가**: 필요 시 viewer.js에 export 함수 추가
6. **import 추가**: main.js에 import 추가
7. **window 할당**: HTML onclick 사용 시 window에 할당
8. **테스트**: 
   - Electron 버전: `npm run dev`로 테스트
   - 웹 버전: 로컬 서버로 테스트 (호환성 확인)
9. **문서화**: 
   - `CHANGELOG.md` 업데이트
   - 버전 번호 업데이트 (`config.js`, `viewer.js`, HTML 타이틀, `package.json`)
   - 관련 문서 업데이트 (`PROJECT_BRIEF.md`, `DEV_NOTE.md` 등)

### 코드 리뷰 체크리스트

#### 필수 체크 항목
- [ ] **모듈 시스템**
  - [ ] export/import 일치하는가?
  - [ ] window 객체 할당 필요한가? (HTML에서 사용 시)
  - [ ] 경로가 정확한가? (`./`, `../`)
  - [ ] .js 확장자 포함했는가?
  
- [ ] **코드 품질**
  - [ ] private 필드(#) 사용했는가? (클래스 내부 데이터)
  - [ ] JSDoc 주석 작성했는가? (export 함수)
  - [ ] 에러 처리 했는가? (try-catch, null 체크)
  - [ ] 디버깅 코드 제거했는가? (fetch, console.log)
  
- [ ] **API 사용**
  - [ ] Google Gemini API 모델명이 구체적인 버전인가?
  - [ ] 재시도 로직이 구현되어 있는가?
  
- [ ] **문서화**
  - [ ] 버전 번호 일치하는가? (config.js, viewer.js, HTML)
  - [ ] CHANGELOG.md 업데이트 했는가?
  - [ ] 관련 문서 업데이트 했는가? (PROJECT_BRIEF.md 등)

#### 선택 체크 항목
- [ ] 테스트 코드 작성했는가?
- [ ] 성능 최적화를 고려했는가?
- [ ] 접근성(a11y)을 고려했는가?
- [ ] 반응형 디자인을 고려했는가?

---

## 7. 유용한 명령어

### 디버깅
```bash
# 디버깅 코드 찾기
grep -n "console.log\|fetch.*7242" src/js/*.js

# import/export 확인
grep -E "(export|import)" src/js/viewer.js

# 파일 크기 확인
wc -l src/js/*.js
```

### 테스트
```bash
# 로컬 서버 실행
python -m http.server 8000

# 파일 구조 확인
tree src/

# 특정 함수 검색
grep -r "toggleBookmark" src/js/
```

### Git
```bash
# 변경사항 확인
git status
git diff

# 커밋
git add .
git commit -m "fix: toggleBookmark import 추가"

# 푸시
git push origin main
```

---

---

## 8. 빠른 참조 (Quick Reference)

### 자주 발생하는 문제와 해결책

| 문제 | 원인 | 해결책 | 문서 |
|------|------|--------|------|
| 모든 버튼 작동 안 함 | ES6 모듈과 onclick 충돌 | HTML에서 onclick 제거, 이벤트 리스너 사용 | [문서](#문제-1-모든-버튼-작동-불가) |
| Google Gemini 404 오류 | 별칭 모델명 사용 | 구체적인 버전 번호 사용 (`gemini-1.5-flash-002`) | [문서](#문제-2-google-gemini-api-404-오류) |
| 마크다운 렌더링 안 됨 | 코드 블록 래퍼 | 코드 블록 제거 로직 추가 | [문서](#문제-3-markdown-렌더링-문제) |
| 모듈 import 오류 | 함수 export 누락 | export/import 일치 확인 | [문서](#문제-4-모듈-import-오류-v0241) |
| Google Drive 버튼 작동 안 함 | onclick 속성 누락 | HTML에 onclick 속성 추가 | [문서](#문제-8-google-drive-버튼-작동-안-함-v0242) |
| 로컬 파일 로딩 오류 | fileKey null 체크 누락 | null 체크 로직 추가 | [문서](#문제-9-로컬-파일-로딩-오류-v0243) |
| AI 텍스트 변환 오류 | 모델명 단종, 파일 확장자 문제, content 누락 | 모델명 변경, 확장자 강제 변환, content 포함 | [문서](#문제-10-ai-텍스트-변환-오류-v0245) |
| 다운로드 기능 오류 | getCurrentFileName 메서드 누락 | ViewerCoordinator에 메서드 추가 | [문서](#문제-11-다운로드-기능-오류-v0245) |
| 컨텍스트 메뉴 버그 | Toggle 로직 문제, HTML 구조 오류 | 상태 기반 메뉴 표시, HTML 구조 검증 | [문서](#문제-12-컨텍스트-메뉴-버그-v0245) |
| 파일 저장 기능 오류 | 저장 버튼 이벤트 잘못 연결 | viewer.downloadCurrentFile() 메서드로 재연결 | [문서](#문제-13-파일-저장-기능-오류-v0245-hotfix) |
| 뷰어 초기화 오류 | window.viewer 할당 누락 | ViewerCoordinator 생성자에 window.viewer = this 추가 | [문서](#문제-14-뷰어-초기화-오류-v0245-hotfix) |
| HTML 구조 및 중복 ID 오류 | 중복 ID, 토글 스위치 위치 오류 | 중복 ID 제거, HTML 구조 정리 | [문서](#문제-15-html-구조-및-중복-id-오류-v0245-hotfix) |
| UI 전환 실패 및 하이라이트 복원 문제 | HTML 구조 오해, 위치 정보 미저장 | uploadAreaContainer만 숨김, 텍스트 인덱스 기반 저장 | [문서](#문제-16-ui-전환-실패-및-하이라이트-복원-문제-v0247) |
| CORS 오류 | file:// 프로토콜 사용 | 웹 서버 사용 (`python -m http.server 8000`) | [문서](#문제-7-cors-오류) |

### 개발 워크플로우 요약

```
1. 계획 수립
   ↓
2. 클래스/함수 구현
   ↓
3. export/import 확인
   ↓
4. window 객체 할당 (필요 시)
   ↓
5. 테스트 (test_modules.html)
   ↓
6. 디버깅 코드 제거
   ↓
7. 문서 업데이트 (CHANGELOG.md)
   ↓
8. 버전 업데이트
   ↓
9. 커밋 및 푸시
```

### 필수 체크리스트 (코드 작성 후)

- [ ] HTML에 `onclick` 속성이 없는가?
- [ ] 모든 함수가 `export`되어 있는가?
- [ ] `main.js`에서 모든 함수를 import하고 있는가?
- [ ] `window` 객체에 함수가 할당되어 있는가?
- [ ] 디버깅 코드가 제거되었는가?
- [ ] 브라우저 콘솔에 오류가 없는가?
- [ ] `test_modules.html`로 모듈 로딩 확인했는가?

---

## 9. 참고 자료

### 트러블슈팅 문서
- `docs/03_troubleshooting/2025-12-26_Gemini_API_404_오류.md` - Google Gemini API 404 오류 해결
- `docs/03_troubleshooting/2025-12-26_Markdown_렌더링_문제.md` - 마크다운 렌더링 문제 해결
- `docs/03_troubleshooting/2025-12-26_모든_버튼_작동_불가_문제.md` - ES6 모듈과 onclick 충돌 해결
- `docs/03_troubleshooting/2026-01-02_하이라이트_및_컨텍스트_메뉴_개선.md` - 하이라이트 기능 개선
- `docs/03_troubleshooting/2026-01-30_Google_Drive_버튼_오류.md` - Google Drive 버튼 onclick 속성 누락 해결 (v0.2.4.2)
- `docs/03_troubleshooting/2026-02-01_UI_전환_실패.md` - UI 전환 실패 및 하이라이트 복원 문제 해결 (v0.2.4.7)
- `docs/03_troubleshooting/2026-02-01_편집_메뉴_및_읽기_진행률.md` - 편집 메뉴 및 읽기 진행률 구현 (v0.2.4.7-8)
- `docs/03_troubleshooting/2026-01-30_HistoryManager_null_체크_오류.md` - HistoryManager null 체크 오류 해결 (v0.2.4.3)
- `docs/03_troubleshooting/2026-02-01_UI_전환_실패.md` - UI 전환 실패 및 하이라이트 복원 문제 해결 (v0.2.4.7)

### 프로젝트 문서
- `CHANGELOG.md` - 버전별 변경 이력
- `PROJECT_BRIEF.md` - 프로젝트 개요 및 아키텍처
- `QUICKSTART.md` - 빠른 시작 가이드
- `GITHUB_DEPLOY_GUIDE.md` - GitHub Pages 배포 가이드
- `TEST_CHECKLIST.md` - 테스트 체크리스트

### 외부 참고 자료
- [ES6 Modules - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Semantic Versioning](https://semver.org/lang/ko/)
- [Google Gemini API 문서](https://ai.google.dev/docs)
- [Google Drive API 문서](https://developers.google.com/drive)

---

**마지막 업데이트**: 2026-02-01  
**버전**: v0.3.0  
**작성자**: Development Team
