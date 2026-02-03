# 📚 프로젝트 문서화 인덱스

이 문서는 eBook Viewer 프로젝트의 모든 문서에 대한 목차입니다.

## 🚀 빠른 시작

**새로운 개발자나 AI가 프로젝트를 이해하려면 먼저 다음 문서를 읽으세요:**

- **[PROJECT_BRIEF.md](./PROJECT_BRIEF.md)** - 프로젝트 전체 브리핑 (개발자 인수인계 문서)

> ⚠️ **중요**: 향후 모든 신규 기능은 **Electron 버전**을 중심으로 개발됩니다.  
> 개발 환경 설정은 [Electron 가이드](./04_guides/electron/README.md)를 참고하세요.

---

## 📁 문서 구조

### [01_architecture/](./01_architecture/)
**구조 및 설계 결정 문서**

프로젝트의 아키텍처, 설계 결정, 시스템 구조에 대한 문서를 포함합니다.

- 시스템 아키텍처 다이어그램
- 주요 설계 결정 사항 (Architecture Decision Records)
- 모듈 구조 및 의존성
- 데이터 흐름도

**관련 문서:**
- `docs/google_drive_architecture.md` - Google Drive 통합 아키텍처

---

### [02_features/](./02_features/)
**기능 명세서**

각 기능의 상세 명세, 사용 방법, 구현 세부사항을 포함합니다.

- 기능별 상세 명세
- API 명세서
- 사용자 인터페이스 가이드
- 기능별 구현 가이드

---

### [03_troubleshooting/](./03_troubleshooting/)
**버그 및 문제 해결 일지**

발생한 버그, 문제 해결 과정, 원인 분석을 기록합니다.

각 문서는 다음 형식을 따릅니다:
- **문제 (Symptoms)**: 발생한 문제의 증상
- **원인 (Root Cause)**: 문제의 근본 원인
- **해결 (Solution)**: 해결 방법 및 과정
- **결과 (Result)**: 해결 후 결과 및 검증

**기록된 이슈:**
- `2025-12-26_Gemini_API_404_오류.md` - Google Gemini API 404 오류 해결
- `2025-12-26_Markdown_렌더링_문제.md` - 마크다운 렌더링 문제 해결
- `2025-12-26_모든_버튼_작동_불가_문제.md` - ES6 모듈 로딩 오류 및 `onclick` 속성 충돌 문제
- `2026-01-02_하이라이트_및_컨텍스트_메뉴_개선.md` - 하이라이트 클릭 자동 선택, 커스텀 메뉴 비활성화, 토글 동기화, Ctrl+우클릭, 파일 출처 구분 기능

---

### [04_guides/](./04_guides/)
**사용 가이드 및 튜토리얼**

사용자 및 개발자를 위한 가이드 문서를 포함합니다.

- 설치 및 설정 가이드
- 사용자 매뉴얼
- 개발 환경 설정
- 배포 가이드

#### Electron 가이드
- **[electron/README.md](./04_guides/electron/README.md)** - Electron 앱 전체 가이드
- **[electron/INTEGRATION.md](./04_guides/electron/INTEGRATION.md)** - 웹 앱과 Electron 통합 방법
- **[electron/CONVERSION_COMPLETE.md](./04_guides/electron/CONVERSION_COMPLETE.md)** - 변환 완료 요약

**관련 문서:**
- `docs/local_server_setup.md` - 로컬 서버 구동 가이드
- `docs/google_oauth_setup_guide.md` - Google OAuth 설정 가이드
- `docs/fix_korean_encoding.md` - PowerShell 한글 인코딩 문제 해결
- `docs/fix_markdown_rendering.md` - 마크다운 렌더링 문제 해결

---

## 📝 기타 문서

다음 문서들은 루트 `docs/` 폴더에 위치하며, 향후 적절한 카테고리로 이동될 예정입니다:

- `DEV_NOTE.md` - 개발 노트
- `GIT_GUIDE.md` - Git 사용 가이드
- `INTEGRITY_CHECK.md` - 무결성 검사
- `REFACTORING.md` - 리팩토링 상세 내역
- `REFACTORING_SUMMARY.md` - 리팩토링 요약

---

## 🔄 문서 업데이트 규칙

1. **새로운 이슈 발생 시**: `03_troubleshooting/` 폴더에 날짜와 문제명으로 파일 생성
2. **새로운 기능 추가 시**: `02_features/` 폴더에 기능 명세서 작성
3. **아키텍처 변경 시**: `01_architecture/` 폴더에 설계 결정 문서 작성
4. **가이드 문서 작성 시**: `04_guides/` 폴더에 추가

---

**마지막 업데이트**: 2026-02-01

