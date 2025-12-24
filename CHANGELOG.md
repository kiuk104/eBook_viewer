# Change Log

모든 주요 변경사항은 이 파일에 기록됩니다.

이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.

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

