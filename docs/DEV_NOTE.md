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

### 새 기능 추가 시
1. **계획 수립**: 어떤 클래스에 추가할지 결정
2. **클래스 수정**: 해당 클래스에 메서드 추가
3. **export 추가**: 필요 시 viewer.js에 export 함수 추가
4. **import 추가**: main.js에 import 추가
5. **window 할당**: HTML onclick 사용 시 window에 할당
6. **테스트**: test_modules.html로 모듈 로딩 확인
7. **문서화**: 
   - `CHANGELOG.md` 업데이트
   - 버전 번호 업데이트 (`config.js`, `viewer.js`, HTML 타이틀)
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
- `docs/03_troubleshooting/2026-01-30_HistoryManager_null_체크_오류.md` - HistoryManager null 체크 오류 해결 (v0.2.4.3)

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

**마지막 업데이트**: 2026-01-30  
**버전**: v0.2.4.3  
**작성자**: Development Team
