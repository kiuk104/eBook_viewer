# 📋 문서 분류 기준

## ✅ 루트에 유지해야 할 문서

### 1. README.md
- **이유**: GitHub에서 자동으로 표시되는 프로젝트 소개 문서
- **대상**: 모든 사용자
- **용도**: 프로젝트 개요, 빠른 시작, 주요 기능

### 2. CHANGELOG.md
- **이유**: 표준 관례 (Keep a Changelog)
- **대상**: 모든 사용자
- **용도**: 버전별 변경 이력

### 3. QUICKSTART.md
- **이유**: 사용자가 빠르게 시작할 수 있도록 루트에 배치
- **대상**: 새로운 사용자
- **용도**: 3단계 빠른 시작 가이드

---

## 📂 docs 폴더로 이동해야 할 문서

### 1. DEV_NOTE.md
- **현재 상태**: 
  - 루트: 2026-01-30 (최신) ✅
  - docs: 2025-12-26 (구버전)
- **조치**: 
  1. 루트의 최신 버전을 docs로 복사
  2. 루트의 DEV_NOTE.md 삭제
  3. README.md에서 링크 업데이트

### 2. GITHUB_DEPLOY_GUIDE.md
- **현재 상태**: 루트와 docs에 중복 존재
- **조치**: 
  1. 내용 비교 후 최신 버전 확인
  2. 루트의 파일 삭제
  3. README.md에서 링크 업데이트

### 3. TEST_CHECKLIST.md
- **현재 상태**: 루트와 docs에 중복 존재
- **조치**: 
  1. 내용 비교 후 최신 버전 확인
  2. 루트의 파일 삭제
  3. README.md에서 링크 업데이트

---

## 🗑️ 삭제해야 할 파일

### 1. FILE_LIST.txt
- **이유**: 임시 파일, 자동 생성 가능
- **조치**: 삭제

### 2. HTTP_Server_Log.txt
- **이유**: 로그 파일은 저장소에 포함하지 않음
- **조치**: 삭제 및 .gitignore에 추가

---

## 📊 최종 문서 구조

```
eBook_viewer/
├── README.md                    # ✅ 프로젝트 소개
├── CHANGELOG.md                 # ✅ 변경 이력
├── QUICKSTART.md                # ✅ 빠른 시작
│
└── docs/
    ├── INDEX.md                 # 문서 목차
    ├── PROJECT_BRIEF.md         # 프로젝트 브리핑
    ├── DEV_NOTE.md              # 개발 규칙 (이동 필요)
    ├── GITHUB_DEPLOY_GUIDE.md   # 배포 가이드 (이동 필요)
    ├── TEST_CHECKLIST.md        # 테스트 체크리스트 (이동 필요)
    │
    ├── 01_architecture/         # 아키텍처 문서
    ├── 02_features/             # 기능 명세서
    ├── 03_troubleshooting/      # 트러블슈팅
    └── 04_guides/               # 기타 가이드
```

---

## 🔄 실행 계획

### 단계 1: 중복 문서 확인 및 정리
1. DEV_NOTE.md: 루트의 최신 버전을 docs로 복사
2. GITHUB_DEPLOY_GUIDE.md: 내용 비교 후 정리
3. TEST_CHECKLIST.md: 내용 비교 후 정리

### 단계 2: 루트 정리
1. 중복 문서 삭제
2. FILE_LIST.txt 삭제
3. HTTP_Server_Log.txt 삭제

### 단계 3: 참조 업데이트
1. README.md의 문서 링크 업데이트
2. docs/INDEX.md 업데이트

---

**작성일**: 2026-01-30
