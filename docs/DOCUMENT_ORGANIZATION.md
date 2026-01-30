# 📁 문서 구조 및 분류 가이드

이 문서는 프로젝트의 문서들을 어떻게 구성하고 관리해야 하는지에 대한 가이드입니다.

---

## 📍 루트에 유지해야 할 문서

### 필수 문서 (표준 관례)

1. **README.md** ✅
   - **위치**: 루트
   - **이유**: GitHub에서 자동으로 표시되는 프로젝트 소개 문서
   - **용도**: 프로젝트 개요, 빠른 시작, 주요 기능 소개
   - **대상**: 모든 사용자 (개발자, 사용자)

2. **CHANGELOG.md** ✅
   - **위치**: 루트
   - **이유**: 표준 관례 (Keep a Changelog)
   - **용도**: 버전별 변경 이력 기록
   - **대상**: 모든 사용자

### 사용자 접근성 문서

3. **QUICKSTART.md** ✅
   - **위치**: 루트
   - **이유**: 사용자가 빠르게 시작할 수 있도록 루트에 배치
   - **용도**: 3단계 빠른 시작 가이드
   - **대상**: 새로운 사용자

---

## 📂 docs 폴더로 이동해야 할 문서

### 개발자용 문서

1. **DEV_NOTE.md** → `docs/DEV_NOTE.md`
   - **현재**: 루트와 docs 폴더에 중복 존재
   - **이유**: 개발 규칙 및 문제 해결 가이드 (개발자 전용)
   - **조치**: 루트의 DEV_NOTE.md를 docs로 이동하고 중복 제거

2. **GITHUB_DEPLOY_GUIDE.md** → `docs/GITHUB_DEPLOY_GUIDE.md`
   - **현재**: 루트와 docs 폴더에 중복 존재
   - **이유**: 배포 가이드는 개발자/배포 담당자용
   - **조치**: 루트의 GITHUB_DEPLOY_GUIDE.md를 docs로 이동하고 중복 제거

3. **TEST_CHECKLIST.md** → `docs/TEST_CHECKLIST.md`
   - **현재**: 루트와 docs 폴더에 중복 존재
   - **이유**: 테스트 체크리스트는 개발자용
   - **조치**: 루트의 TEST_CHECKLIST.md를 docs로 이동하고 중복 제거

---

## 🗑️ 삭제해야 할 파일

1. **FILE_LIST.txt**
   - **이유**: 임시 파일, 자동 생성 가능
   - **조치**: 삭제 또는 .gitignore에 추가

2. **HTTP_Server_Log.txt**
   - **이유**: 로그 파일은 저장소에 포함하지 않음
   - **조치**: 삭제 및 .gitignore에 `*.log`, `logs/` 추가

---

## 📋 최종 문서 구조

```
eBook_viewer/
├── README.md                    # ✅ 루트 유지 (프로젝트 소개)
├── CHANGELOG.md                 # ✅ 루트 유지 (변경 이력)
├── QUICKSTART.md                # ✅ 루트 유지 (빠른 시작)
│
└── docs/
    ├── INDEX.md                 # 문서 목차
    ├── PROJECT_BRIEF.md         # 프로젝트 브리핑 (개발자용)
    ├── DEV_NOTE.md              # 개발 규칙 및 문제 해결
    ├── GITHUB_DEPLOY_GUIDE.md   # GitHub 배포 가이드
    ├── TEST_CHECKLIST.md        # 테스트 체크리스트
    │
    ├── 01_architecture/          # 아키텍처 문서
    ├── 02_features/             # 기능 명세서
    ├── 03_troubleshooting/      # 트러블슈팅 문서
    └── 04_guides/               # 기타 가이드
        ├── local_server_setup.md
        ├── google_oauth_setup_guide.md
        ├── google_drive_architecture.md
        ├── GIT_GUIDE.md
        ├── CURSOR_CHAT_SYNC_GUIDE.md
        └── CURSOR_COMPLETE_SYNC_GUIDE.md
```

---

## 🔄 문서 이동 체크리스트

### 1단계: 중복 문서 확인
- [ ] `DEV_NOTE.md` (루트) vs `docs/DEV_NOTE.md` 내용 비교
- [ ] `GITHUB_DEPLOY_GUIDE.md` (루트) vs `docs/GITHUB_DEPLOY_GUIDE.md` 내용 비교
- [ ] `TEST_CHECKLIST.md` (루트) vs `docs/TEST_CHECKLIST.md` 내용 비교

### 2단계: 최신 버전 확인
- [ ] 각 문서의 최종 수정 날짜 확인
- [ ] 최신 버전을 docs 폴더에 유지

### 3단계: 문서 이동
- [ ] 루트의 중복 문서 삭제
- [ ] README.md에서 문서 링크 업데이트 (docs 폴더 경로로)

### 4단계: 참조 업데이트
- [ ] 다른 문서에서 루트 경로로 참조하는 부분 수정
- [ ] `docs/INDEX.md` 업데이트

### 5단계: 불필요한 파일 삭제
- [ ] `FILE_LIST.txt` 삭제 또는 .gitignore 추가
- [ ] `HTTP_Server_Log.txt` 삭제 및 .gitignore 업데이트

---

## 📝 문서 작성 규칙

### 루트 문서 (README.md, CHANGELOG.md, QUICKSTART.md)
- **대상**: 모든 사용자 (개발자, 사용자)
- **목적**: 프로젝트 이해 및 빠른 시작
- **스타일**: 간결하고 명확하게

### docs 폴더 문서
- **대상**: 개발자, 기여자
- **목적**: 상세한 기술 문서, 가이드, 트러블슈팅
- **스타일**: 상세하고 체계적으로

---

## 🔗 문서 간 참조

### README.md에서 참조
```markdown
## 📚 추가 문서

- [빠른 시작 가이드](./QUICKSTART.md)
- [변경 이력](./CHANGELOG.md)
- [프로젝트 브리핑](./docs/PROJECT_BRIEF.md)
- [개발 규칙](./docs/DEV_NOTE.md)
- [문서 목차](./docs/INDEX.md)
```

### docs/INDEX.md에서 참조
- 모든 docs 폴더 내 문서를 체계적으로 정리
- 루트 문서도 포함하여 전체 문서 구조 제공

---

**마지막 업데이트**: 2026-01-30  
**버전**: v0.2.4.1
