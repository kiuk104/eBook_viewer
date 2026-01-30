# 📚 eBook Viewer 프로젝트 브리핑

**버전**: v0.2.4.5  
**최종 업데이트**: 2026-01-30  
**목적**: 개발자용 인수인계 문서 - AI가 프로젝트 맥락을 빠르게 파악할 수 있도록 작성

---

## 1. 프로젝트 개요

### 프로젝트명
**eBook Viewer** (또는 **Web eBook Viewer**)

### 핵심 기능 요약
웹 기반 이북 텍스트 뷰어로, 다음 기능을 제공합니다:

- ✅ **로컬 파일 읽기**: `.txt`, `.md` 파일 업로드 및 드래그 앤 드롭 지원
- ✅ **Google Drive 통합**: Google Drive에서 파일 선택 및 읽기
- ✅ **AI 텍스트 변환**: Google Gemini API를 통한 텍스트 → 마크다운 자동 변환
- ✅ **마크다운 렌더링**: `.md` 파일을 HTML로 렌더링 (marked.js 사용)
- ✅ **읽기 히스토리**: 최근 읽은 파일 목록 저장
- ✅ **북마크 기능**: 현재 읽기 위치에 북마크 추가/삭제
- ✅ **텍스트 하이라이트**: 형광펜으로 텍스트 강조 표시 (5가지 색상, 여러 줄 지원)
- ✅ **데이터 백업/복원**: 북마크, 히스토리, 하이라이트를 JSON 파일로 백업 및 복원
- ✅ **테마 지원**: 라이트, 다크, 세피아, 그린, 사용자 지정 테마
- ✅ **스타일 커스터마이징**: 폰트 크기, 본문 스타일, 마크다운 스타일, 뷰어 넓이 조절

### 주요 사용 사례
- 로컬 텍스트 파일 읽기 및 편집
- Google Drive에 저장된 문서 읽기
- AI를 통한 텍스트 정리 및 마크다운 변환
- 마크다운 파일 뷰어로 활용

---

## 2. 프로젝트 구조

```
eBook_viewer/
├── ebook_viewer.html          # 메인 애플리케이션 HTML 파일
├── index.html                  # 랜딩 페이지
├── README.md                   # 사용자 가이드
├── CHANGELOG.md               # 버전별 변경 이력
│
├── src/
│   ├── css/
│   │   └── styles.css         # 모든 스타일 정의 (테마, 마크다운, 반응형)
│   │
│   └── js/
│       ├── main.js            # 앱 초기화 및 진입점
│       ├── config.js          # 버전 정보 및 설정 상수
│       ├── viewer.js          # 뷰어 렌더링 및 파일 처리 (핵심 모듈)
│       ├── ai_service.js      # Google Gemini API 연동
│       ├── google_drive.js     # Google Drive API 통합
│       ├── settings.js         # 설정 관리 (테마, 폰트, 히스토리, 북마크)
│       ├── utils.js           # 유틸리티 함수 (파일 키 생성, 다운로드 등)
│       └── modules/           # 클래스 기반 모듈
│           ├── FileManager.js      # 파일 관리 클래스
│           ├── ContentRenderer.js  # 콘텐츠 렌더링 클래스
│           ├── BookmarkManager.js  # 북마크 관리 클래스
│           ├── HistoryManager.js   # 히스토리 관리 클래스
│           └── StyleManager.js      # 스타일 관리 클래스
│
├── docs/
│   ├── PROJECT_BRIEF.md       # 이 문서 (프로젝트 브리핑)
│   ├── INDEX.md                # 문서 목차
│   ├── 01_architecture/        # 아키텍처 문서
│   ├── 02_features/            # 기능 명세서
│   ├── 03_troubleshooting/     # 버그 해결 일지
│   │   ├── 2025-12-26_Gemini_API_404_오류.md
│   │   └── 2025-12-26_Markdown_렌더링_문제.md
│   ├── 04_guides/              # 사용 가이드
│   ├── local_server_setup.md   # 로컬 서버 구동 가이드
│   ├── google_oauth_setup_guide.md
│   └── google_drive_architecture.md
│
├── scripts/
│   ├── start_server.ps1        # PowerShell 서버 시작 스크립트
│   └── start_server.bat        # 배치 파일 서버 시작 스크립트
│
└── logs/                       # 서버 로그 파일들
```

---

## 3. 핵심 모듈 설명 (`src/js/`)

### 3.1 `viewer.js` (핵심 모듈)
**역할**: 뷰어 렌더링, 파일 처리, UI 상호작용

**아키텍처**: 클래스 기반 모듈 패턴
- `ViewerCoordinator` 클래스: 모든 관리자 클래스를 조율
- 각 기능별로 독립된 클래스 모듈 사용 (단일 책임 원칙)
- 싱글톤 패턴으로 인스턴스 관리

**주요 export 함수**:
- `displayFileContent()`: 파일 내용 렌더링 (텍스트/마크다운 구분)
- `processFiles()`: 파일 업로드 및 처리
- `toggleWrapMode()`: 줄바꿈 모드 전환 (자동/원본)
- `handleAIClean()`: AI 변환 기능 호출
- `downloadAsMarkdown()`: 마크다운 파일 다운로드
- `toggleBookmark()`: 북마크 추가/삭제
- `displayUploadHistory()`: 히스토리 표시
- `displayUploadBookmarks()`: 북마크 목록 표시
- `updateMarkdownStyles()`: 마크다운 스타일 업데이트 (제목 크기, 색상, 글씨체)
- `updateBodyStyles()`: 본문 스타일 업데이트 (글씨체, 줄간격, 색상)
- `updateViewerWidth()`: 뷰어 넓이 조절
- `toggleFavorite()`: 즐겨찾기 토글
- `resetAllSettings()`: 모든 설정 초기화
- `exportData()`: 데이터 백업 (JSON 파일)
- `importData()`: 데이터 복원 (JSON 파일)
- `handleImportDataFile()`: 파일 복원 처리
- `restoreContextMenuSetting()`: 컨텍스트 메뉴 설정 복원
- `toggleContextMenuSetting()`: 컨텍스트 메뉴 설정 토글

**특징**:
- 마크다운 파일은 `marked.js`로 HTML 변환
- 코드 블록 래퍼(` ```markdown ... ``` `) 자동 제거 로직 포함
- 파일 키 기반으로 히스토리/북마크 관리
- localStorage를 통한 읽기 위치 자동 저장
- 클래스 기반 구조로 유지보수성 향상

### 3.2 `ai_service.js`
**역할**: Google Gemini API 연동

**주요 기능**:
- `cleanTextWithAI()`: 텍스트를 마크다운으로 변환
- 모델 재시도 로직: `gemini-1.5-flash-002` → `gemini-2.0-flash-exp` (폴백)

**API 엔드포인트**:
```
https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
```

**중요 사항**:
- API 키는 `settings.js`의 `getGeminiKey()`로 가져옴
- 텍스트가 30,000자 이상이면 확인 메시지 표시
- 시스템 프롬프트로 마크다운 변환 규칙 정의

### 3.3 `google_drive.js`
**역할**: Google Drive API 통합

**주요 기능**:
- `loadGoogleDriveFiles()`: Google Drive 파일 선택 (Picker API)
- `loadLastReadGoogleDriveFile()`: 마지막 읽은 파일 복원
- OAuth 2.0 인증 처리
- 폴더 탐색 지원 (더블클릭으로 하위 폴더 이동)

**의존성**:
- Google Picker API
- Google Identity Services (OAuth 2.0)

### 3.4 `settings.js`
**역할**: 설정 관리 및 상태 저장

**주요 기능**:
- `loadSettings()`: localStorage에서 설정 로드
- `saveSettings()`: 설정 저장
- `setTheme()`: 테마 변경 (light, dark, sepia, green, custom)
- `setFontSize()`: 폰트 크기 조절
- `loadHistory()` / `saveHistory()`: 읽기 히스토리 관리
- `loadBookmarks()` / `saveBookmarks()`: 북마크 관리
- `saveGeminiApiKey()` / `getGeminiKey()`: Gemini API 키 관리
- `saveGoogleDriveSettings()` / `loadGoogleDriveSettings()`: Google Drive 설정 관리

**데이터 구조**:
- 히스토리: `[{name, fileKey, timestamp, ...}]`
- 북마크: `{fileKey: [{position, preview, timestamp, ...}]}`

### 3.5 `utils.js`
**역할**: 유틸리티 함수

**주요 기능**:
- `formatFileSize()`: 파일 크기 포맷팅
- `formatTimestamp()`: 타임스탬프 포맷팅
- `generateFileKey()`: 파일 고유 키 생성
  - Google Drive: `gdrive_{fileId}`
  - 로컬 파일: `local_{fileName}_{fileSize}`
- `downloadFile()`: 파일 다운로드
- `downloadMarkdown()`: 마크다운 파일 다운로드

### 3.6 `main.js`
**역할**: 앱 초기화 및 진입점

**주요 기능**:
- `initApp()`: 앱 초기화
  - 설정 로드
  - 이벤트 리스너 등록
  - 마지막 읽은 파일 복원
- `restoreWrapMode()`: 줄바꿈 모드 복원
- `restoreLastReadFile()`: 마지막 읽은 파일 복원
- 전역 함수 노출 (HTML의 `onclick`에서 사용)

### 3.7 `config.js`
**역할**: 버전 정보 및 설정 상수

**내용**:
- `APP_VERSION`: '0.2.4.5'
- `APP_NAME`: 'Web eBook Viewer'
- `RELEASE_DATE`: '2026-01-30'

---

## 4. 최근 변경 내역 (Recent Changes)

### v0.2.4.5 (2026-01-30)

#### ✨ 텍스트 하이라이트(형광펜) 시스템 구현
1. **하이라이트 기능 추가**
   - `HighlightManager.js` 모듈 신설 (하이라이트 저장, 삭제, 데이터 관리)
   - 컨텍스트 메뉴에 형광펜 색상 팔레트(5색) UI 추가
   - 텍스트 선택 후 우클릭하여 하이라이트 적용 기능 연결
   - 하이라이트된 영역 우클릭 시 '삭제' 기능 구현

#### 🐛 버그 수정
1. **AI 텍스트 변환 오류 수정**
   - Google Gemini API 모델명 변경 (`gemini-2.0-flash` 적용, 단종된 `exp` 모델 제거)
   - 변환 완료 후 파일 확장자가 `.txt`로 남아 렌더링되지 않던 문제를 `.md` 강제 변환으로 수정
   - 파일 로드 시 `file.content` 메모리 누락 문제 해결

2. **다운로드 기능 오류 수정**
   - `ViewerCoordinator`에 누락되었던 `getCurrentFileName` 메서드 추가

3. **컨텍스트 메뉴 버그 수정**
   - 메뉴 HTML 구조 깨짐(중첩 태그 오류) 수정
   - 하이라이트 위에서 우클릭 시 일반 메뉴(북마크 등)가 사라지는 로직 수정 (Toggle 로직 개선)

#### 💄 스타일/UI 개선
1. **마크다운 가독성 개선**
   - `StyleManager.js`: 제목(H1)과 서지 정보(H3)의 크기 배율을 조정하여 시각적 계층 구조 강화

2. **다크 모드 가독성 개선**
   - 컨텍스트 메뉴에 다크 모드 텍스트 색상(`dark:text-gray-200`)을 명시하여 글씨가 안 보이는 문제 해결

### v0.2.4.4 (2026-01-30)

#### ✨ 커스텀 컨텍스트 메뉴 기능 구현
1. **커스텀 메뉴 기능 추가**
   - 우클릭 시 커스텀 메뉴 표시 기능 구현
   - `setupContextMenuListener()`: 이벤트 리스너 등록 함수
   - `handleContextMenu()`: 우클릭 이벤트 처리 (Ctrl+우클릭 지원)
   - `hideContextMenu()`: 메뉴 숨기기 함수
   - `handleMouseUp()`: 텍스트 선택 영역 자동 저장
   - `setupContextMenuItems()`: 메뉴 항목 클릭 이벤트 설정

2. **메뉴 항목 기능**
   - 북마크 추가: 현재 위치에 북마크 추가
   - 텍스트 공유: 선택한 텍스트를 클립보드에 복사
   - 뷰어 설정: 설정 패널 열기
   - 패널 펼치기: 업로드 섹션 토글
   - 하이라이트 삭제: 하이라이트된 텍스트 제거
   - 형광펜 팔레트: 5가지 색상 선택 (준비 중)

3. **Ctrl + 우클릭 지원**
   - Windows/Linux: Ctrl + 우클릭 → 브라우저 기본 메뉴
   - Mac: Cmd + 우클릭 → 브라우저 기본 메뉴
   - 커스텀 메뉴와 브라우저 메뉴를 모두 사용 가능

4. **설정 함수 개선**
   - `toggleContextMenuSetting()`: 설정 변경 시 리스너 자동 재등록
   - `restoreContextMenuSetting()`: 두 토글 동기화 개선
   - 설정 패널과 컨텍스트 메뉴의 토글이 완전히 동기화됨

#### 🐛 버그 수정
- 커스텀 메뉴 작동 안 함 문제 해결
  - 이벤트 리스너가 등록되지 않아 메뉴가 표시되지 않던 문제 해결
  - `main.js`의 `initApp()`에서 `setupContextMenuListener()` 호출 추가

### v0.2.4.3 (2026-01-30)

#### 🐛 긴급 버그 수정
1. **로컬 파일 로딩 오류 해결**
   - `HistoryManager.js`: `fileKey`가 `null`인 경우 처리 추가
   - 히스토리 데이터에 `fileKey: null`인 항목으로 인한 `TypeError` 해결
   - null 체크 추가로 앱 초기화 중단 문제 해결
   - 파일 선택 기능 정상 작동하도록 수정
   - **문서**: `docs/03_troubleshooting/2026-01-30_HistoryManager_null_체크_오류.md`

**기술적 세부사항:**
- `item.fileKey.startsWith('gdrive_')` → `item.fileKey ? item.fileKey.startsWith('gdrive_') : false`
- 구버전 데이터 호환성 개선
- 방어적 프로그래밍 패턴 적용

### v0.2.4.2 (2026-01-30)

#### 🐛 긴급 버그 수정
1. **Google Drive 버튼 오류 수정**
   - `ebook_viewer.html`: Google Drive 버튼에 `onclick="loadGoogleDriveFiles()"` 속성 추가
   - 버튼 클릭 시 함수 호출되지 않던 문제 해결
   - HTML onclick과 JavaScript 함수 연결 완료
   - **문서**: `docs/03_troubleshooting/2026-01-30_Google_Drive_버튼_오류.md`

**원인:**
- 이전 버전에서 이벤트 리스너 등록 코드가 누락됨
- onclick 속성도 없어 버튼이 완전히 작동하지 않음

**해결:**
- HTML onclick 속성 추가로 즉시 실행 가능하도록 수정
- 다른 버튼들과 일관된 방식으로 통일

### v0.2.4.1 (2026-01-30)

#### 🐛 주요 버그 수정
1. **모듈 import 오류 수정**
   - `main.js`의 import 문에서 누락된 `toggleBookmark` 추가
   - 모든 export 함수가 올바르게 import되도록 수정
   - 디버깅 코드 8개 제거 (fetch 호출)

2. **viewer.js 함수 추가**
   - `downloadAsMarkdown()`: 마크다운 파일 다운로드
   - `handleAIClean()`: AI 텍스트 변환
   - `toggleFavorite()`: 즐겨찾기 토글
   - `resetAllSettings()`: 모든 설정 초기화
   - `exportData()` / `importData()` / `handleImportDataFile()`: 데이터 백업/복원
   - `restoreContextMenuSetting()` / `toggleContextMenuSetting()`: 컨텍스트 메뉴 설정

3. **경로 구조 최적화**
   - `src/js/modules/` 폴더에 클래스 모듈 배치
   - 모든 import 경로 검증 및 수정

#### ✨ 새로 추가된 기능
1. **테스트 도구**
   - `test_modules.html`: 모듈 로딩 테스트용 HTML
   - 6단계 테스트 프로세스 문서화

2. **문서화 개선**
   - `GITHUB_DEPLOY_GUIDE.md`: GitHub Pages 배포 가이드
   - `QUICKSTART.md`: 3단계 빠른 시작 가이드
   - `DEV_NOTE.md`: 개발 규칙 및 트러블슈팅 가이드

### v0.2.4 (2026-01-30)

#### 🔧 리팩토링

1. **클래스 기반 모듈 구조 채택**
   - 에이전트 1 (클래스 기반 모듈 패턴)을 메인 구현으로 채택
   - `ViewerCoordinator` 클래스로 모든 관리자 클래스 통합
   - 각 기능별 독립된 클래스 모듈 (`modules/` 폴더)
   - 단일 책임 원칙(SRP) 준수
   - 싱글톤 패턴으로 인스턴스 관리

2. **누락된 함수 추가**
   - `downloadAsMarkdown()`: 마크다운 다운로드
   - `handleAIClean()`: AI 변환 처리
   - `toggleFavorite()`: 즐겨찾기 토글
   - `resetAllSettings()`: 설정 초기화
   - `exportData()` / `importData()` / `handleImportDataFile()`: 데이터 백업/복원
   - `restoreContextMenuSetting()` / `toggleContextMenuSetting()`: 컨텍스트 메뉴 설정

3. **프로젝트 구조 정리**
   - 중복된 `viewer/` 폴더 제거
   - 클래스 파일들을 `modules/` 폴더로 통합
   - 사용하지 않는 에이전트 제안 파일 삭제 (agent2, agent3)
   - 관련 테스트 스크립트 및 문서 정리

### v0.2.3.2 (2026-01-02)

#### 🔧 개선됨
- **하이라이트 기능 개선**
  - 하이라이트 클릭 시 자동으로 텍스트 선택되어 색상 변경 가능
  - 텍스트 선택 영역 자동 저장 (mouseup 이벤트)
  - 하이라이트 적용 시 에러 처리 강화

- **컨텍스트 메뉴 개선**
  - 커스텀 메뉴 비활성화 시 브라우저 기본 메뉴 정상 표시
  - Ctrl + 우클릭 (Mac: Cmd + 우클릭)으로 브라우저 기본 메뉴 접근 가능
  - 설정 패널과 컨텍스트 메뉴의 토글 동기화
  - 토글 클릭 시 즉시 UI 업데이트

- **파일 출처 시각적 구분**
  - 히스토리 목록에서 Google Drive 파일과 로컬 파일 구분 (색상, 뱃지)
  - 북마크 목록에서 파일 출처 구분 (아이콘, 색상)
  - Google Drive: 파란색 + "Drive" 뱃지
  - 로컬 파일: 회색 + "Local" 뱃지

#### 🐛 수정됨
- 존재하지 않는 `showLocalFileResumeMessage` 함수 호출 제거
- 컨텍스트 메뉴 닫을 때 `activeHighlightSpan` 초기화

### v0.2.3 (2025-12-26)

#### ✨ 새로 추가된 기능

1. **텍스트 하이라이트 기능**
   - 우클릭 메뉴에서 형광펜 색상 선택 (노랑, 초록, 파랑, 분홍, 보라)
   - 여러 줄에 걸친 텍스트 하이라이트 지원 (TreeWalker API 사용)
   - 하이라이트 클릭 시 수정/삭제 메뉴 표시
   - 하이라이트 색상 변경 기능
   - 하이라이트 정보 자동 저장 및 복구 (localStorage)
   - 파일 열기 시 저장된 하이라이트 자동 복원

2. **데이터 백업 및 복원 기능**
   - 북마크, 히스토리, 하이라이트, 설정 등을 JSON 파일로 내보내기
   - JSON 파일을 불러와서 데이터 복원
   - 읽기 위치 정보도 함께 백업/복원
   - 설정 패널에서 "데이터 백업 & 복원" 섹션 추가

3. **우클릭 메뉴 개선**
   - 형광펜 팔레트 추가 (5가지 색상)
   - 하이라이트 삭제 메뉴 추가 (하이라이트 클릭 시 표시)
   - 패널 펼치기 버튼 추가 (상단 패널을 빠르게 열기)
   - 메뉴 모드 토글 (일반 모드 / 수정 모드)

#### ♻️ 변경된 기능

- 하이라이트 저장 구조 개선: 파일별 하이라이트 데이터 분리 저장
- 컨텍스트 메뉴 동작 개선: 하이라이트 클릭 시 수정 모드로 전환

#### 🐛 해결된 버그

- 하이라이트 복원 안정성 개선: 뒤에서부터 복원하여 인덱스 변경 방지

---

### v0.2.2 (2025-12-26)

#### ✨ 새로 추가된 기능

1. **북마크 및 히스토리 개별 삭제 기능**
   - 각 히스토리 항목에 삭제 버튼 추가 (호버 시 표시)
   - 각 북마크 항목에 삭제 버튼 추가 (호버 시 표시)

2. **텍스트 스트로크(외곽선 두께) 조절 기능**
   - 본문 스타일 섹션에 스트로크 조절 슬라이더 추가
   - 0px ~ 1.5px 범위에서 조절 가능

---

### v0.2.1 (2025-12-26)

#### ✨ 새로 추가된 기능

1. **뷰어 너비 조절 기능**
   - 슬라이더로 800px~2000px 범위에서 조절
   - 꽉 찬 화면 모드 지원

2. **본문 스타일 커스터마이징**
   - 줄간격, 글씨체, 색상 조절

3. **설정 초기화 기능**
   - 모든 설정을 기본값으로 되돌리기

4. **한글 웹폰트 추가**
   - 고운 바탕, 고운 도움, IBM Plex Sans KR, 리디바탕

---

### v0.2.0 (2025-12-26)

#### ✨ 새로 추가된 기능

1. **AI 변환 기능**
   - Google Gemini API를 통한 텍스트 → 마크다운 자동 변환
   - AI 변환 버튼 추가 (🤖 AI 변환 & 저장)
   - 변환된 마크다운 파일 자동 다운로드
   - 모델 재시도 로직 (gemini-1.5-flash-002 → gemini-2.0-flash-exp)

2. **마크다운 파일 지원**
   - `.md` 파일 읽기 및 렌더링
   - marked.js를 통한 HTML 변환
   - 마크다운 전용 스타일링 (`.markdown-mode`)
   - 코드 블록 래퍼 자동 제거 기능

3. **스타일 커스터마이징**
   - 본문 스타일 편집 (글씨체, 줄간격, 색상)
   - 마크다운 렌더링 옵션 (제목 크기, 색상, 글씨체, 목차 색상)
   - 뷰어 넓이 조절 (800px ~ 2000px)

4. **UI 개선**
   - 접기/펼치기 버튼 텍스트 동적 변경
   - 히스토리/북마크 섹션 접기 기능 추가

#### 🐛 해결된 버그

1. **Google Gemini API 404 오류**
   - 문제: `gemini-1.5-flash` 및 `latest` 모델명 사용 시 404 오류
   - 원인: Google API 정책 변경으로 별칭 모델 폐기
   - 해결: `gemini-1.5-flash-002`로 변경 및 재시도 로직 추가
   - 문서: `docs/03_troubleshooting/2025-12-26_Gemini_API_404_오류.md`

2. **마크다운 렌더링 문제**
   - 문제: AI 변환 파일이 코드 블록으로 감싸져 일반 텍스트로 표시됨
   - 원인: 파일이 ` ```markdown ... ``` ` 형태로 저장됨
   - 해결: 코드 블록 래퍼 자동 제거 로직 추가 (정규식 + 라인 기반)
   - 문서: `docs/03_troubleshooting/2025-12-26_Markdown_렌더링_문제.md`

3. **Google Drive 불러오기 기능**
   - 문제: `loadGoogleDriveFiles is not defined` 오류
   - 원인: ES6 모듈 로딩 타이밍 문제
   - 해결: 전역 함수 노출 로직 개선

#### ♻️ 변경된 기능

- 텍스트 정리 기능 제거 (AI 변환으로 대체)
- 마크다운 렌더링 시 자동 줄바꿈 적용
- 파일 선택 다이얼로그에 `.md` 확장자 추가

---

## 5. 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: 커스텀 스타일 (`src/css/styles.css`)
- **JavaScript (ES6 Modules)**: 모듈화된 코드 구조

### 라이브러리 및 CDN
- **Tailwind CSS** (CDN): 유틸리티 기반 CSS 프레임워크
  ```html
  <script src="https://cdn.tailwindcss.com"></script>
  ```

- **marked.js** (CDN): 마크다운 파서
  ```html
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  ```

- **Google APIs**:
  - Google Drive API (`https://apis.google.com/js/api.js`)
  - Google Identity Services (`https://accounts.google.com/gsi/client`)

- **Google Fonts**:
  - Noto Sans KR
  - Noto Serif KR
  - Nanum Gothic
  - Nanum Myeongjo

### 외부 API
- **Google Gemini API**: 텍스트 → 마크다운 변환
  - 엔드포인트: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
  - 모델: `gemini-1.5-flash-002` (기본), `gemini-2.0-flash-exp` (폴백)

- **Google Drive API**: 파일 선택 및 읽기
  - Picker API: 파일 선택 UI
  - Drive API: 파일 내용 읽기

### 데이터 저장
- **localStorage**: 모든 설정 및 데이터 저장
  - 테마, 폰트 크기
  - 읽기 히스토리
  - 북마크
  - API 키 (Google Drive, Gemini)
  - 읽기 위치
  - 마지막 읽은 파일 정보

### 개발 환경
- **로컬 서버**: Python HTTP Server (포트 8000)
- **스크립트**: PowerShell (`start_server.ps1`), 배치 파일 (`start_server.bat`)

---

## 6. 주요 데이터 구조

### 파일 키 (File Key)
모든 파일은 고유 키로 식별됩니다:

```javascript
// Google Drive 파일
fileKey = `gdrive_${fileId}`

// 로컬 파일
fileKey = `local_${fileName}_${fileSize}`
```

### 히스토리 구조
```javascript
history = [
  {
    name: "파일명.txt",
    fileKey: "local_파일명.txt_12345",
    timestamp: 1733456789000,
    // ... 기타 메타데이터
  }
]
```

### 북마크 구조
```javascript
bookmarks = {
  "local_파일명.txt_12345": [
    {
      fileKey: "local_파일명.txt_12345",
      fileName: "파일명.txt",
      position: 45.5,  // 퍼센트
      preview: "미리보기 텍스트...",
      timestamp: 1733456789000
    }
  ]
}
```

---

## 7. 주요 설정 옵션

### 테마
- `light`: 라이트 모드 (기본)
- `dark`: 다크 모드
- `sepia`: 세피아 톤
- `green`: 그린 톤
- `custom`: 사용자 지정 (배경색, 글자색)

### 마크다운 스타일
- 제목 글씨체: 기본, Noto Sans KR, Noto Serif KR, Nanum Gothic, Nanum Myeongjo
- 제목 크기 배율: 0.5x ~ 2.0x
- 제목 색상: 컬러 피커
- 목차 색상: 컬러 피커

### 본문 스타일
- 본문 글씨체: Noto Sans KR, Noto Serif KR, Nanum Gothic, Nanum Myeongjo, Courier New
- 본문 줄간격: 1.0 ~ 3.0
- 본문 색상: 컬러 피커

### 뷰어 설정
- 뷰어 최대 넓이: 800px ~ 2000px (50px 단위)
- 폰트 크기: 12px ~ 32px
- 줄바꿈 모드: 자동 / 원본(가로스크롤)

---

## 8. 개발 가이드

### 로컬 서버 실행
```powershell
# PowerShell
.\scripts\start_server.ps1

# 또는 직접 실행
python -m http.server 8000
```

### 브라우저 접속
```
http://localhost:8000/ebook_viewer.html
```

### 주요 개발 파일
- **HTML**: `ebook_viewer.html`
- **CSS**: `src/css/styles.css`
- **JavaScript**: `src/js/*.js`

### 코드 스타일
- ES6 Modules 사용
- 함수별 모듈 분리
- JSDoc 주석 작성
- console.log로 디버깅

### 디버깅 팁
- 브라우저 개발자 도구 콘솔 확인
- localStorage 데이터 확인: `Application > Local Storage`
- 네트워크 탭에서 API 호출 확인

---

## 9. 알려진 이슈 및 제한사항

### 제한사항
- 로컬 파일은 브라우저 세션 동안만 유지 (새로고침 시 사라짐)
- Google Drive 파일은 OAuth 인증 필요
- AI 변환은 API 키 필요 (무료 키 발급 가능)

### 향후 개선 사항
- [ ] 검색 기능
- [ ] 텍스트 하이라이트
- [ ] 다중 파일 동시 읽기
- [ ] 내보내기 기능 (PDF, EPUB 등)

---

## 10. 참고 문서

- **사용자 가이드**: `README.md`
- **변경 이력**: `CHANGELOG.md`
- **문서 목차**: `docs/INDEX.md`
- **로컬 서버 설정**: `docs/local_server_setup.md`
- **Google OAuth 설정**: `docs/google_oauth_setup_guide.md`
- **Google Drive 아키텍처**: `docs/google_drive_architecture.md`
- **트러블슈팅**: `docs/03_troubleshooting/`

---

## 11. 빠른 참조

### 주요 함수 호출 경로
```
HTML onclick → window.{functionName} → viewer.js export function
```

### 설정 저장 위치
```javascript
localStorage.setItem('key', value)
localStorage.getItem('key')
```

### 파일 키 생성
```javascript
import { generateFileKey } from './utils.js'
const fileKey = generateFileKey(file)
```

### 마크다운 렌더링
```javascript
import { marked } from 'marked'  // 전역으로 로드됨
const html = marked.parse(markdownText, { breaks: true, gfm: true })
```

---

**마지막 업데이트**: 2025-12-26  
**문서 작성자**: AI Assistant  
**목적**: 개발자 인수인계 및 AI 컨텍스트 제공

