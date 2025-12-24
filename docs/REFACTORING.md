# 리팩토링 작업 내역

## 📋 작업 개요

**작업 일자**: 2024년  
**작업 목적**: `ebook_viewer.html` 파일의 비대화 문제 해결 및 코드 모듈화  
**작업 범위**: CSS와 JavaScript 코드를 별도 파일로 분리하여 유지보수성 향상

---

## 🎯 작업 목표

1. **CSS 분리**: 인라인 스타일을 별도 CSS 파일로 분리
2. **JavaScript 모듈화**: 기능별로 모듈 분리 (ES6 모듈 시스템 사용)
3. **의존성 관리**: 명확한 import/export 구조로 의존성 관리
4. **기능 보존**: 기존 기능이 정상 작동하도록 보장

---

## 📁 파일 구조 변경

### 작업 전
```
eBook_viewer/
├── ebook_viewer.html  (700줄 - CSS + HTML + JavaScript 모두 포함)
└── ...
```

### 작업 후
```
eBook_viewer/
├── ebook_viewer.html  (131줄 - HTML 구조만)
├── src/
│   ├── css/
│   │   └── styles.css       (CSS 스타일)
│   └── js/
│       ├── utils.js         (유틸리티 함수)
│       ├── settings.js      (설정 관리)
│       ├── google_drive.js  (Google Drive 통합)
│       ├── viewer.js        (뷰어 기능)
│       └── main.js          (초기화 및 진입점)
└── ...
```

---

## 📦 모듈별 상세 설명

### 1. `src/css/styles.css`
**역할**: 모든 CSS 스타일 정의

**포함 내용**:
- 기본 레이아웃 스타일 (body, viewer-container, ebook-content)
- 폰트 클래스 정의 (font-system, font-nanum, 등)
- 테마 스타일 (theme-light, theme-dark, theme-sepia, theme-green)
- UI 컴포넌트 스타일 (settings-panel, theme-option, 등)
- 애니메이션 및 전환 효과

**변경 사항**:
- 기존 `<style>` 태그 내용을 그대로 이동
- HTML에서 `<link rel="stylesheet" href="src/css/styles.css">`로 참조

---

### 2. `src/js/utils.js`
**역할**: 범용 유틸리티 함수

**주요 함수**:
- `formatFileSize(bytes)`: 파일 크기를 읽기 쉬운 형식으로 변환 (Bytes, KB, MB, GB, TB)
- `formatTimestamp(timestamp)`: 타임스탬프를 로컬 날짜/시간 문자열로 변환

**의존성**: 없음 (순수 함수)

---

### 3. `src/js/settings.js`
**역할**: 애플리케이션 설정 및 상태 관리

**주요 기능**:
- 테마 관리 (light, dark, sepia, green)
- 폰트 크기 설정
- 로컬 스토리지 관리 (히스토리, 북마크)
- Google Drive 설정 관리

**주요 함수**:
- `loadSettings()`: 저장된 설정 불러오기
- `applySettings()`: 설정을 DOM에 적용
- `setTheme(themeName, save)`: 테마 변경
- `setFontSize(size, save)`: 폰트 크기 변경
- `loadHistory()`: 읽기 히스토리 불러오기
- `loadBookmarks()`: 북마크 불러오기
- `getGoogleDriveSettings()`: Google Drive 설정 가져오기
- `loadGoogleDriveSettings()`: Google Drive 설정을 UI에 로드
- `saveGoogleDriveSettings()`: Google Drive 설정 저장

**의존성**: 없음

**상태 관리**:
- `currentTheme`: 현재 테마
- `currentFontSize`: 현재 폰트 크기
- `history`: 읽기 히스토리 배열
- `bookmarks`: 북마크 배열

---

### 4. `src/js/google_drive.js`
**역할**: Google Drive API 통합 및 파일 선택

**주요 기능**:
- Google API 클라이언트 초기화
- OAuth 2.0 인증
- Google Picker API 로드 및 사용
- Google Drive 파일 다운로드

**주요 함수**:
- `initGoogleAPI()`: Google API 클라이언트 초기화
- `loadPickerAPI()`: Picker API 로드
- `signInToGoogle()`: Google 로그인 및 액세스 토큰 획득
- `createPicker()`: Google Picker 생성 및 표시
- `pickerCallback(data)`: Picker 선택 콜백 처리
- `downloadGoogleDriveFile(fileId)`: Google Drive 파일 다운로드
- `loadGoogleDriveFiles(event)`: Google Drive 파일 로드 (진입점)
- `resetGoogleDrive()`: Google Drive 재초기화 (설정 변경 시)

**의존성**:
- `settings.js`: `getGoogleDriveSettings()` 사용
- `viewer.js`: 동적 import로 파일 표시 함수 사용 (순환 의존성 방지)

**상태 관리**:
- `gapiInitialized`: Google API 초기화 여부
- `pickerApiLoaded`: Picker API 로드 여부
- `tokenClient`: OAuth 토큰 클라이언트
- `accessToken`: 액세스 토큰

**특징**:
- 폴더 탐색 지원 (더블클릭으로 하위 폴더 이동)
- 여러 파일 동시 선택 가능
- 폴더와 텍스트 파일 필터링

---

### 5. `src/js/viewer.js`
**역할**: 파일 처리 및 뷰어 UI 조작

**주요 기능**:
- 로컬 파일 처리
- 파일 내용 표시
- 히스토리 관리
- UI 토글 기능

**주요 함수**:
- `selectFiles()`: 파일 선택 다이얼로그 열기
- `processFiles(fileList)`: 파일 목록 처리 및 읽기
- `displayFileContent(file)`: 파일 내용을 뷰어에 표시
- `addToHistory(file)`: 히스토리에 파일 추가
- `displayUploadHistory()`: 업로드 히스토리 UI 표시
- `displayUploadBookmarks()`: 북마크 UI 표시
- `toggleSettings()`: 설정 패널 토글
- `toggleUploadSection()`: 업로드 섹션 토글

**파일 배열 관리 함수**:
- `getFiles()`: 파일 배열 가져오기
- `setFiles(newFiles)`: 파일 배열 설정
- `getCurrentFileIndex()`: 현재 파일 인덱스 가져오기
- `setCurrentFileIndex(index)`: 현재 파일 인덱스 설정

**의존성**:
- `utils.js`: `formatFileSize`, `formatTimestamp` 사용
- `settings.js`: `getHistory`, `setHistory` 사용

**전역 노출**:
- `window.selectFiles`
- `window.toggleSettings`
- `window.toggleUploadSection`
- `window.displayFileContent`

---

### 6. `src/js/main.js`
**역할**: 애플리케이션 초기화 및 진입점

**주요 기능**:
- DOM 로드 완료 시 앱 초기화
- 이벤트 리스너 등록
- 전역 함수 노출 (HTML onclick 속성용)

**초기화 순서**:
1. 버전 정보 표시
2. 설정 로드 (테마, 폰트, 히스토리, 북마크, Google Drive)
3. 설정 적용 (DOM 업데이트)
4. UI 표시 (히스토리, 북마크)
5. 이벤트 리스너 등록 (파일 입력, 드래그 앤 드롭)

**전역 함수 노출**:
- `window.setTheme`
- `window.setFontSize`
- `window.saveGoogleDriveSettings`
- `window.loadGoogleDriveFiles`

**의존성**:
- `settings.js`: 설정 관련 함수들
- `viewer.js`: 뷰어 관련 함수들
- `google_drive.js`: Google Drive 함수

---

## 🔗 의존성 관계도

```
main.js (진입점)
├── settings.js
│   └── (로컬 스토리지)
├── viewer.js
│   ├── utils.js
│   └── settings.js
└── google_drive.js
    ├── settings.js
    └── viewer.js (동적 import)
```

**의존성 규칙**:
- `utils.js`: 독립적 (의존성 없음)
- `settings.js`: 독립적 (로컬 스토리지만 사용)
- `viewer.js`: `utils.js`, `settings.js` 의존
- `google_drive.js`: `settings.js` 의존, `viewer.js`는 동적 import로 순환 의존성 방지
- `main.js`: 모든 모듈 의존

---

## 🔄 주요 변경 사항

### 1. CSS 분리
- **이전**: `<style>` 태그 내 인라인 CSS (74줄)
- **이후**: `src/css/styles.css` 별도 파일
- **효과**: 스타일 관리 용이, 재사용성 향상

### 2. JavaScript 모듈화
- **이전**: 단일 `<script>` 태그 내 모든 코드 (약 500줄)
- **이후**: 5개 모듈로 분리
- **효과**: 
  - 기능별 코드 분리로 유지보수 용이
  - 모듈 단위 테스트 가능
  - 코드 재사용성 향상

### 3. 전역 변수 관리
- **이전**: 전역 스코프에 변수 선언
- **이후**: 모듈 내부에서 관리, 필요한 경우만 export
- **효과**: 네임스페이스 오염 방지, 캡슐화

### 4. 의존성 관리
- **이전**: 암묵적 의존성 (전역 변수 공유)
- **이후**: 명시적 import/export
- **효과**: 의존성 파악 용이, 순환 의존성 방지

### 5. HTML 간소화
- **이전**: 700줄 (CSS + HTML + JavaScript)
- **이후**: 131줄 (HTML 구조만)
- **효과**: 가독성 향상, 구조 명확화

---

## 🛠️ 기술 스택

- **모듈 시스템**: ES6 Modules (`import`/`export`)
- **스크립트 타입**: `type="module"` (ES6 모듈 지원)
- **의존성 해결**: 동적 import (순환 의존성 방지)

---

## ✅ 검증 사항

### 기능 검증
- [x] 로컬 파일 업로드 및 읽기
- [x] 드래그 앤 드롭 파일 처리
- [x] Google Drive 파일 선택 및 다운로드
- [x] 폴더 탐색 기능
- [x] 테마 변경 (라이트, 다크, 세피아, 그린)
- [x] 폰트 크기 조절
- [x] 히스토리 저장 및 표시
- [x] 설정 저장 및 불러오기

### 코드 품질
- [x] 린터 오류 없음
- [x] 순환 의존성 없음
- [x] 전역 함수 정상 노출 (HTML onclick용)
- [x] 모듈 간 명확한 의존성

---

## 📝 사용 방법

### 개발 환경
1. HTTP 서버 실행 (Google Drive API 사용을 위해 필요)
   ```powershell
   python -m http.server 8000
   ```

2. 브라우저에서 접속
   ```
   http://localhost:8000/ebook_viewer.html
   ```

### 모듈 추가/수정 시 주의사항
1. **의존성 확인**: import/export 문이 올바른지 확인
2. **전역 노출**: HTML의 `onclick`에서 사용하는 함수는 `window` 객체에 노출 필요
3. **순환 의존성**: 모듈 간 순환 참조가 없도록 주의
4. **동적 import**: 순환 의존성이 필요한 경우 동적 import 사용

---

## 🔍 코드 예시

### 모듈 export 예시
```javascript
// utils.js
export function formatFileSize(bytes) {
    // ...
}
```

### 모듈 import 예시
```javascript
// viewer.js
import { formatFileSize, formatTimestamp } from './utils.js';
```

### 동적 import 예시 (순환 의존성 방지)
```javascript
// google_drive.js
const { displayFileContent } = await import('./viewer.js');
```

### 전역 함수 노출 예시
```javascript
// viewer.js
window.selectFiles = selectFiles;
```

---

## 🚀 향후 개선 가능 사항

1. **타입 안정성**: TypeScript 도입 검토
2. **번들링**: Webpack 또는 Vite로 번들링하여 성능 최적화
3. **테스트**: 각 모듈별 단위 테스트 추가
4. **상태 관리**: 전역 상태 관리 라이브러리 도입 검토 (필요 시)
5. **에러 핸들링**: 통합 에러 핸들링 시스템 구축

---

## 📚 관련 문서

- [로컬 서버 구동 방법](./local_server_setup.md)
- [Google OAuth 설정 가이드](./google_oauth_setup_guide.md)
- [Google Drive 아키텍처](./google_drive_architecture.md)

---

## 📌 변경 이력

- **2024년**: 초기 리팩토링 작업 완료
  - CSS 분리
  - JavaScript 모듈화 (5개 모듈)
  - HTML 간소화 (700줄 → 131줄)

---

**작성자**: AI Assistant  
**최종 수정일**: 2024년

