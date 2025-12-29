# Change Log

모든 주요 변경사항은 이 파일에 기록됩니다.

이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.

---

## [v0.2.3] - 2025-12-26

### ✨ 추가됨 (Added)
- **텍스트 하이라이트 기능**
  - 우클릭 메뉴에서 형광펜 색상 선택 (노랑, 초록, 파랑, 분홍, 보라)
  - 여러 줄에 걸친 텍스트 하이라이트 지원 (TreeWalker API 사용)
  - 하이라이트 클릭 시 수정/삭제 메뉴 표시
  - 하이라이트 색상 변경 기능
  - 하이라이트 정보 자동 저장 및 복구 (localStorage)
  - 파일 열기 시 저장된 하이라이트 자동 복원

- **데이터 백업 및 복원 기능**
  - 북마크, 히스토리, 하이라이트, 설정 등을 JSON 파일로 내보내기
  - JSON 파일을 불러와서 데이터 복원
  - 읽기 위치 정보도 함께 백업/복원
  - 설정 패널에서 "데이터 백업 & 복원" 섹션 추가

- **우클릭 메뉴 개선**
  - 형광펜 팔레트 추가 (5가지 색상)
  - 하이라이트 삭제 메뉴 추가 (하이라이트 클릭 시 표시)
  - 패널 펼치기 버튼 추가 (상단 패널을 빠르게 열기)
  - 메뉴 모드 토글 (일반 모드 / 수정 모드)

### ♻️ 변경됨 (Changed)
- **하이라이트 저장 구조 개선**
  - 파일별 하이라이트 데이터 분리 저장 (`ebook_highlights`)
  - 하위 호환성을 위해 기존 `textHighlights` 형식도 유지
  - 오프셋 기반 정확한 위치 저장 및 복원

- **컨텍스트 메뉴 동작 개선**
  - 하이라이트 클릭 시 수정 모드로 전환
  - 일반 텍스트 선택 시 일반 모드로 동작
  - 메뉴 항목 동적 표시/숨김

### 🐛 수정됨 (Fixed)
- **하이라이트 복원 안정성 개선**
  - 뒤에서부터 복원하여 인덱스 변경 방지
  - 오프셋 정보가 없는 하이라이트 필터링
  - 복원 실패 시 경고 메시지 출력

---

## [v0.2.2] - 2025-12-26

### ✨ 추가됨 (Added)
- **북마크 및 히스토리 개별 삭제 기능**
  - 각 히스토리 항목에 삭제 버튼 추가 (호버 시 표시)
  - 각 북마크 항목에 삭제 버튼 추가 (호버 시 표시)
  - 삭제 확인 다이얼로그로 실수 방지
  - 삭제 후 목록 즉시 갱신

- **텍스트 스트로크(외곽선 두께) 조절 기능**
  - 본문 스타일 섹션에 스트로크 조절 슬라이더 추가
  - 0px ~ 1.5px 범위에서 조절 가능 (0.05px 단위)
  - 얇은 폰트를 진하게 만드는 효과
  - `-webkit-text-stroke-width` 및 `currentColor` 사용

### ♻️ 변경됨 (Changed)
- **북마크 목록 개선**
  - 모든 파일의 북마크를 통합하여 최신순 정렬
  - 현재 열린 파일의 북마크만 표시하도록 변경
  - 북마크 클릭 시 파일 열기 대신 현재 파일 내 위치로 이동

- **히스토리 목록 개선**
  - 최신순 정렬 (timestamp 기준 내림차순)
  - 최근에 읽은 파일이 목록 상단에 표시

- **마크다운 헤더 폰트 스타일 개선**
  - 동적 스타일 태그 주입 방식으로 변경
  - `!important`를 사용하여 Tailwind `.prose` 클래스 우선순위 우회
  - 제목 폰트가 확실하게 적용되도록 개선

### 🐛 수정됨 (Fixed)
- **북마크 저장 시 파일 인식 개선**
  - `currentFileKey`가 없어도 본문 내용이 있으면 임시 파일 정보 생성
  - Google Drive 파일 등 다양한 상황에서 북마크 저장 안정성 향상

---

## [v0.2.1] - 2025-12-26

### ✨ 추가됨 (Added)
- 뷰어 너비 조절 기능 (슬라이더, 꽉 찬 화면 모드)
- 본문 스타일 커스터마이징 (줄간격, 글씨체, 색상)
- 설정 초기화 기능
- 한글 웹폰트 추가 (고운 바탕, 고운 도움, IBM Plex Sans KR, 리디바탕)
- 커스텀 컨텍스트 메뉴 (우클릭 메뉴)
- 히스토리 및 북마크 목록 압축 (높이 및 간격 축소)

### 🐛 수정됨 (Fixed)
- 뷰어 너비 조절 버그 (CSS 우선순위 문제 해결)
- 줄간격 적용 버그 (`updateBodyStyles()` 함수 구현)
- 레이아웃 개선 (너비 제한 제거)

### ♻️ 변경됨 (Changed)
- UI 개선 (기능 버튼 그룹을 상단 패널 헤더로 이동)
- 설정 패널 레이아웃 통합 (단일 회색 패널로 변경)
- 상단 패널을 드로어 형태로 변경

---

## [v0.2.0] - 2025-12-26

### 🐛 수정됨 (Fixed)
- **파일 선택 버튼 동작 문제 해결**
  - `main.js`: DOM 요소 ID 불일치 수정 (`getElementById` 타겟을 `fileInput`에서 `file-input`으로 변경)
  - `viewer.js`: DOM 요소 ID 불일치 수정 (`getElementById` 타겟을 `fileInput`에서 `file-input`으로 변경)
  - `ebook_viewer.html`: 파일 입력 요소 ID를 `fileInput`에서 `file-input`으로 변경
  - `ebook_viewer.html`: 파일 선택 버튼(`#selectFilesBtn`)에 `onclick="document.getElementById('file-input').click()"` 속성 추가
  - `ebook_viewer.html`: Google Drive 버튼(`#loadGoogleDriveBtn`)에 `onclick="loadGoogleDriveFiles()"` 속성 추가
  - 이벤트 리스너 중복 등록 방지 로직 개선 (함수 참조 저장 방식으로 변경)

### ✨ 추가됨 (Added)
- **AI 변환 기능**
  - Google Gemini API를 통한 텍스트 마크다운 변환
  - AI 변환 버튼 추가 (🤖 AI 변환 & 저장)
  - 변환된 마크다운 파일 자동 다운로드
  - Gemini 1.5 Flash 및 2.0 Flash 모델 지원

- **마크다운 파일 지원**
  - `.md` 파일 읽기 및 렌더링 기능
  - marked.js를 통한 마크다운 HTML 변환
  - 마크다운 전용 스타일링 (`.markdown-mode`)
  - 코드 블록 래퍼 자동 제거 기능
  - 마크다운 파일 북마크 및 읽기 위치 저장 지원

- **API 키 관리**
  - Google Gemini API 키 저장 기능
  - 설정 패널에 API 키 입력 및 저장 버튼 추가

### ♻️ 변경됨 (Changed)
- **기능 개선**
  - 텍스트 정리 기능 제거 (AI 변환으로 대체)
  - 마크다운 렌더링 시 자동 줄바꿈 적용
  - 파일 선택 다이얼로그에 `.md` 확장자 추가

- **스타일링**
  - 마크다운 모드 전용 CSS 스타일 추가
  - 제목, 본문, 리스트 등 마크다운 요소 스타일링
  - 다크 모드에서의 마크다운 스타일 지원

### 🐛 수정됨 (Fixed)
- **Google Drive 통합**
  - `loadGoogleDriveFiles` 함수 전역 노출 문제 수정
  - Google Drive 불러오기 기능 정상 작동
  - Google Drive 피커에서 마크다운(.md) 파일 인식 문제 해결
    - `createPicker` 함수의 `view.setMimeTypes` 설정에서 MIME 타입 문자열 오류 수정
    - 오타 수정: `application/octet-stream.folder` -> `application/octet-stream,application/vnd.google-apps.folder` (콤마 누락 수정 및 폴더 MIME 타입 명시)
    - 이제 구글 드라이브에서 .md 파일 인식 및 폴더 탐색이 정상적으로 작동함

- **파일 처리**
  - 드래그 앤 드롭 시 `.md` 파일 필터링 추가
  - 마크다운 파일 렌더링 후 스크롤 위치 복원 개선

### 🗑️ 제거됨 (Removed)
- 텍스트 정리 기능 및 관련 버튼 제거
- `cleanUpText` 함수 사용 중단

---

## [v0.1.0] - 2025-12-24

### ✨ 추가됨 (Added)
- **Google Drive 통합**
  - Google Drive 파일 탐색 및 열기 기능
  - Google Picker API를 통한 파일 선택
  - 폴더 탐색 지원 (더블클릭으로 하위 폴더 이동)
  - Google Drive 파일 자동 로드 기능 (마지막 읽은 파일 복원)

- **파일 관리 기능**
  - 로컬 파일 업로드 및 드래그 앤 드롭 지원
  - 파일 히스토리 저장 및 표시
  - 북마크 기능 (현재 위치에 북마크 추가/삭제)
  - 읽기 진행 상황 자동 저장 (스크롤 위치)
  - 마지막 읽은 파일 이어보기 기능

- **사용자 인터페이스**
  - 프로젝트 랜딩 페이지 (`index.html`) 추가
  - 테마 변경 기능 (라이트, 다크, 세피아, 그린)
  - 폰트 크기 조절 기능
  - 반응형 디자인 지원

- **설정 관리**
  - Google Drive API 설정 저장/불러오기
  - 사용자 설정 localStorage 저장
  - 버전 정보 중앙 관리 (`src/js/config.js`)

### ♻️ 변경됨 (Changed)
- **코드 구조 개선**
  - 모놀리식 코드 구조를 ES6 모듈로 리팩토링
  - CSS와 JavaScript를 별도 파일로 분리
  - 기능별 모듈 분리:
    - `utils.js`: 유틸리티 함수
    - `settings.js`: 설정 및 상태 관리
    - `google_drive.js`: Google Drive 통합
    - `viewer.js`: 뷰어 기능
    - `main.js`: 초기화 및 진입점
    - `config.js`: 버전 및 설정 정보

- **파일 구조 최적화**
  - HTML 파일 크기 감소 (700줄 → 131줄, 81% 감소)
  - CSS 파일 분리 (`src/css/styles.css`)
  - JavaScript 모듈화 (5개 모듈)

- **데이터 관리**
  - File Key 기반 파일 식별 시스템
  - Google Drive 파일: `gdrive_{fileId}` 형식
  - 로컬 파일: `local_{fileName}_{fileSize}` 형식
  - localStorage를 통한 데이터 영구 저장

### 🐛 수정됨 (Fixed)
- **localStorage 연동**
  - 히스토리 및 북마크 저장/불러오기 기능 수정
  - JSON.stringify를 통한 안전한 데이터 저장
  - 앱 초기화 시 데이터 자동 복원

- **이어보기 기능**
  - Google Drive 파일 자동 로드 로직 개선
  - 로컬 파일 안내 메시지 표시
  - 스크롤 위치 정확한 복원

### 📝 문서화
- `README.md`: 프로젝트 소개 및 실행 방법
- `CHANGELOG.md`: 버전별 변경 이력
- `docs/REFACTORING.md`: 리팩토링 작업 상세 내역
- `docs/REFACTORING_SUMMARY.md`: 리팩토링 요약
- `docs/local_server_setup.md`: 로컬 서버 구동 가이드
- `docs/google_oauth_setup_guide.md`: Google OAuth 설정 가이드
- `docs/google_drive_architecture.md`: Google Drive 통합 아키텍처

### 🔧 기술 스택
- **프론트엔드**: HTML5, CSS3, JavaScript (ES6 Modules)
- **스타일링**: Tailwind CSS
- **API 통합**: Google Drive API, Google Picker API
- **인증**: Google Identity Services (OAuth 2.0)
- **저장소**: localStorage

---

## 버전 관리 규칙

### 버전 형식
- `MAJOR.MINOR.PATCH` (예: `0.1.0`)
- **MAJOR**: 호환되지 않는 API 변경
- **MINOR**: 하위 호환성을 유지하는 기능 추가
- **PATCH**: 하위 호환성을 유지하는 버그 수정

### 변경 유형
- **✨ Added**: 새로운 기능 추가
- **♻️ Changed**: 기존 기능 변경
- **🐛 Fixed**: 버그 수정
- **🗑️ Removed**: 기능 제거
- **🔒 Security**: 보안 관련 변경
- **📝 Documentation**: 문서 변경

---

**참고**: 이전 버전의 변경 이력은 Git 히스토리에서 확인할 수 있습니다.

