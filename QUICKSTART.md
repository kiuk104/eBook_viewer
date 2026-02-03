# 이북 뷰어 v0.3.0 - 빠른 시작 가이드

## 📦 두 가지 버전

이북 뷰어는 **웹 버전**과 **Electron 데스크톱 앱 버전** 두 가지로 제공됩니다.

- **웹 버전**: 브라우저에서 실행 (로컬 서버 필요)
- **Electron 버전**: 독립 실행형 데스크톱 앱 (권장) ⭐

---

## 🖥️ Electron 데스크톱 앱 버전 (권장)

### 🎯 3단계로 시작하기

### 1️⃣ 필수 요구사항
- **Node.js** 18.x 이상 ([다운로드](https://nodejs.org/))
- **npm** (Node.js와 함께 설치됨)

### 2️⃣ 설치 및 실행
```bash
# 프로젝트 클론
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# 의존성 설치 (처음 한 번만)
npm install

# 개발 모드 실행 (개발자 도구 자동 열림)
npm run dev

# 또는 일반 실행
npm start
```

### 3️⃣ 빌드 (배포용 실행 파일 생성)
```bash
# Windows 버전 빌드
npm run build:win

# macOS 버전 빌드 (macOS에서만 가능)
npm run build:mac

# Linux 버전 빌드
npm run build:linux
```

빌드된 실행 파일은 `dist/` 폴더에 생성됩니다.

### ✨ Electron 전용 기능
- ✅ 독립 실행형 데스크톱 애플리케이션
- ✅ 파일 메뉴에서 파일 열기 (Ctrl+O)
- ✅ 네이티브 파일 저장 다이얼로그
- ✅ 애플리케이션 메뉴 (파일, 편집, 보기, 도움말)
- ✅ 키보드 단축키 (Ctrl+O, Ctrl+H, Ctrl+R, F11)
- ✅ 창 관리 (최소/최대화, 크기 조절, 전체화면)

### ⌨️ Electron 단축키
| 기능 | 단축키 |
|------|--------|
| 파일 열기 | Ctrl+O |
| 홈으로 이동 | Ctrl+H |
| 새로고침 | Ctrl+R |
| 전체화면 | F11 |
| 개발자 도구 | Ctrl+Shift+I |

---

## 🌐 웹 버전

### 🎯 3단계로 시작하기

### 1️⃣ 파일 다운로드
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2️⃣ 로컬 서버 실행
```bash
# Python 사용
python -m http.server 8000

# 또는 Node.js 사용
npx http-server -p 8000
```

### 3️⃣ 브라우저에서 열기
```
http://localhost:8000/ebook_viewer.html
```

## ✨ 핵심 기능 빠르게 사용하기

### 📁 파일 열기
1. **내 컴퓨터 파일** 버튼 클릭
2. `.txt` 또는 `.md` 파일 선택
3. 즉시 읽기 시작!

### 📑 북마크 추가
1. 텍스트 선택 → 우클릭
2. "북마크 추가" 클릭
3. 왼쪽 패널에서 북마크 확인

### 🎨 테마 변경
1. ⚙️ 설정 버튼 클릭
2. 색상 테마 선택 (라이트/다크/세피아/그린/커스텀)
3. 자동 저장!

### 🔤 글꼴 조절
1. ⚙️ 설정 버튼 클릭
2. **본문 스타일** 섹션에서:
   - 글씨체 선택
   - 글자 크기 슬라이더 조절
   - 줄 간격 슬라이더 조절

## 🚀 고급 기능

### Google Drive 연동
1. ⚙️ 설정 → Google Drive 섹션
2. Client ID와 API Key 입력 ([발급 방법](./GITHUB_DEPLOY_GUIDE.md#google-drive-api-설정))
3. **Google Drive** 버튼으로 파일 열기

### 🤖 AI 텍스트 변환
1. ⚙️ 설정 → Gemini AI 섹션
2. API Key 입력 ([발급 방법](https://aistudio.google.com/app/apikey))
3. 파일 열기 → **🤖 AI 변환 & 저장** 클릭

## ⌨️ 웹 버전 단축키

| 기능 | 단축키 |
|------|--------|
| 패널 열기/닫기 | 상단 버튼 클릭 |
| 컨텍스트 메뉴 | 우클릭 |
| 브라우저 메뉴 | Ctrl + 우클릭 |

## 💾 데이터 백업

1. ⚙️ 설정 → 데이터 백업 & 복원
2. **📤 내보내기** 클릭
3. JSON 파일 저장
4. 복원 시: **📥 불러오기** 클릭

## 🔍 문제 해결

### 버튼이 작동하지 않아요
- F12 키로 콘솔 확인
- 웹 서버에서 실행 중인지 확인 (file:// 불가)

### 설정이 저장되지 않아요
- 시크릿 모드에서는 저장 불가
- 브라우저 쿠키/LocalStorage 설정 확인

### Google Drive 버튼이 안 돼요
- API 키 설정 확인
- 승인된 JavaScript 출처 확인
- 브라우저 콘솔에서 오류 확인

## 📚 더 알아보기

### Electron 버전
- [Electron 버전 전체 가이드](./docs/04_guides/electron/README.md) - 상세한 사용법 및 개발 가이드
- [Electron 통합 가이드](./docs/04_guides/electron/INTEGRATION.md) - 웹 앱과 Electron 통합 방법

### 웹 버전
- [전체 배포 가이드](./GITHUB_DEPLOY_GUIDE.md)
- [GitHub 이슈](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/issues)

## 🎉 즐거운 독서 되세요!

---

**버전**: v0.3.0 | **날짜**: 2024-02-03
