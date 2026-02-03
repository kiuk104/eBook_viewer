# 📚 이북 텍스트 뷰어

로컬 텍스트 파일과 Google Drive 파일을 읽을 수 있는 이북 뷰어입니다.

> 🚀 **주요 개발 플랫폼: Electron 데스크톱 앱**  
> 향후 모든 신규 기능은 Electron 버전을 중심으로 개발됩니다.  
> [Electron 버전 가이드](./docs/04_guides/electron/README.md)를 참고하여 개발 환경을 설정하세요.

> 💡 **웹 버전도 사용 가능합니다**  
> 기존 웹 버전은 유지되며, 로컬 서버를 통해 브라우저에서 실행할 수 있습니다.

## 📦 두 가지 버전

이북 뷰어는 **Electron 데스크톱 앱 버전**과 **웹 버전** 두 가지로 제공됩니다.

- **Electron 버전** (권장) ⭐: 독립 실행형 데스크톱 애플리케이션
- **웹 버전**: 브라우저에서 실행 (로컬 서버 필요)

---

## 🖥️ Electron 데스크톱 앱 버전 (권장)

### 🚀 빠른 시작

#### 1️⃣ 필수 요구사항
- **Node.js** 18.x 이상 ([다운로드](https://nodejs.org/))
- **npm** (Node.js와 함께 설치됨)

#### 2️⃣ 설치 및 실행
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

#### 3️⃣ 빌드 (배포용 실행 파일 생성)
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
| 파일 열기 | Ctrl+O (Cmd+O) |
| 홈으로 이동 | Ctrl+H (Cmd+H) |
| 새로고침 | Ctrl+R (Cmd+R) |
| 전체화면 | F11 |
| 개발자 도구 | Ctrl+Shift+I (Cmd+Opt+I) |

---

## 🌐 웹 버전

### 🚀 빠른 시작

#### 방법 1: 스크립트 사용 (가장 간단)

##### PowerShell 사용:
```powershell
.\scripts\start_server.ps1
```

##### 배치 파일 사용:
```cmd
scripts\start_server.bat
```

#### 방법 2: 직접 명령어 실행

##### Python HTTP Server (권장)
```powershell
# 프로젝트 디렉토리로 이동
cd E:\Coding\eBook_viewer

# 서버 실행 (포트 8000)
python -m http.server 8000
```

##### 다른 포트 사용
```powershell
python -m http.server 3000
```

### 브라우저 접속

서버 실행 후 브라우저에서 다음 주소로 접속:

```
http://localhost:8000/ebook_viewer.html
```

또는

```
http://127.0.0.1:8000/ebook_viewer.html
```

## 📋 사전 요구사항

### Electron 버전
- **Node.js** 18.x 이상
- **npm** (Node.js와 함께 설치됨)

### 웹 버전
- **Python 3.x** (또는 Python 2.x)
- **웹 브라우저** (Chrome, Edge, Firefox 등)
- **Google Drive API 설정** (Google Drive 기능 사용 시)

## ⚙️ Google Drive 설정

Google Drive 기능을 사용하려면:

1. **Google Cloud Console**에서 OAuth 2.0 클라이언트 ID 생성
2. **승인된 JavaScript 원본**에 다음 주소 추가:
   - `http://localhost:8000`
   - `http://127.0.0.1:8000`
   - (사용하는 포트에 맞게 변경)
3. 애플리케이션의 **설정** 메뉴에서 Client ID와 API 키 입력

자세한 설정 방법은 `docs/google_oauth_setup_guide.md`를 참고하세요.

## 🎯 주요 기능

- ✅ 로컬 텍스트 파일 업로드 및 읽기
- ✅ Google Drive 파일 선택 및 읽기
- ✅ 폴더 탐색 지원 (Google Drive)
- ✅ 다중 파일 선택
- ✅ 테마 변경 (라이트, 다크, 세피아, 그린)
- ✅ 폰트 크기 조절
- ✅ 읽기 히스토리 저장
- ✅ 북마크 기능

## 📁 프로젝트 구조

```
eBook_viewer/
├── electron/              # Electron 관련 파일
│   ├── main.js           # Electron 메인 프로세스
│   ├── preload.js        # Preload 스크립트
│   ├── start.bat         # Windows 실행 스크립트
│   └── build.bat         # Windows 빌드 스크립트
├── src/                   # 웹 앱 소스 코드
│   ├── css/
│   └── js/
├── build/                 # 빌드 리소스
│   ├── icon.ico          # Windows 아이콘
│   ├── icon.icns         # macOS 아이콘
│   └── icon.png          # Linux 아이콘
├── scripts/               # 웹 버전 실행 스크립트
│   ├── start_server.ps1   # PowerShell 서버 시작 스크립트
│   └── start_server.bat   # 배치 파일 서버 시작 스크립트
├── ebook_viewer.html      # 메인 애플리케이션 파일
├── index.html             # 인덱스 파일
├── package.json           # Node.js 프로젝트 설정
├── docs/                  # 문서
│   ├── 04_guides/electron/  # Electron 가이드
│   ├── local_server_setup.md
│   ├── google_oauth_setup_guide.md
│   └── ...
└── logs/                  # 로그 파일
```

## 🛠️ 문제 해결

### 포트가 이미 사용 중인 경우

다른 포트를 사용하세요:
```powershell
python -m http.server 3000
```

또는 해당 포트를 사용하는 프로세스를 종료:
```powershell
# 포트 8000을 사용하는 프로세스 찾기
netstat -ano | findstr :8000

# 프로세스 종료 (PID는 위 명령 결과에서 확인)
taskkill /PID <프로세스ID> /F
```

### Python이 설치되어 있지 않은 경우

1. [Python 공식 사이트](https://www.python.org/downloads/)에서 Python 3.x 다운로드
2. 설치 시 **"Add Python to PATH"** 옵션 체크
3. 설치 후 PowerShell 재시작

### 서버는 실행되지만 페이지가 로드되지 않는 경우

1. 브라우저 캐시 지우기 (`Ctrl + Shift + Delete`)
2. 하드 리프레시 (`Ctrl + Shift + R`)
3. 서버 로그 확인 (터미널에서 오류 메시지 확인)

### Google Drive 로그인 오류

- Google Cloud Console에서 **승인된 JavaScript 원본**이 올바르게 설정되었는지 확인
- 사용 중인 포트 번호가 등록되어 있는지 확인
- Client ID와 API 키가 올바르게 입력되었는지 확인

## 📚 추가 문서

### 빠른 시작
- [빠른 시작 가이드](./QUICKSTART.md) - Electron 및 웹 버전 빠른 시작
- [변경 이력](./CHANGELOG.md) - 버전별 변경 사항

### Electron 버전
- [Electron 버전 전체 가이드](./docs/04_guides/electron/README.md) - 상세한 사용법 및 개발 가이드
- [Electron 통합 가이드](./docs/04_guides/electron/INTEGRATION.md) - 웹 앱과 Electron 통합 방법
- [Electron 변환 완료 요약](./docs/04_guides/electron/CONVERSION_COMPLETE.md) - 변환 작업 요약

### 개발자 문서
- [프로젝트 브리핑](./docs/PROJECT_BRIEF.md) - 프로젝트 전체 개요 및 아키텍처
- [개발 규칙 및 문제 해결](./docs/DEV_NOTE.md) - 개발 규칙 및 트러블슈팅 가이드
- [문서 목차](./docs/INDEX.md) - 모든 문서 인덱스

### 웹 버전 가이드
- [로컬 서버 구동 가이드](./docs/local_server_setup.md) - 로컬 서버 구동 방법 상세 가이드
- [Google OAuth 설정 가이드](./docs/google_oauth_setup_guide.md) - Google OAuth 설정 가이드
- [Google Drive 통합 아키텍처](./docs/google_drive_architecture.md) - Google Drive 통합 아키텍처
- [GitHub 배포 가이드](./docs/GITHUB_DEPLOY_GUIDE.md) - GitHub Pages 배포 가이드
- [테스트 체크리스트](./docs/TEST_CHECKLIST.md) - 테스트 프로세스 가이드

## 📝 라이선스

이 프로젝트는 개인 사용 목적으로 제작되었습니다.

## 🔄 버전 정보

현재 버전: **v0.3.0** (2024-02-03)

---

**서버 중지**: 터미널에서 `Ctrl + C`를 눌러 서버를 중지합니다.

