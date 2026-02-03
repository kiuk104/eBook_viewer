# 📚 eBook Viewer - Electron 앱 버전

웹 기반 eBook Viewer를 Electron 데스크톱 앱으로 변환한 버전입니다.

> 🚀 **메인 개발 플랫폼**: 향후 모든 신규 기능은 Electron 버전을 중심으로 개발됩니다.

## 🚀 빠른 시작

### 📋 체크리스트

시작하기 전에 다음 항목을 확인하세요:

- [ ] Node.js 18.x 이상 설치 ([다운로드](https://nodejs.org/))
- [ ] npm이 설치되어 있는지 확인 (`npm --version`)
- [ ] 프로젝트 파일이 모두 있는지 확인

### 1️⃣ 필수 요구사항

- **Node.js** 18.x 이상 ([다운로드](https://nodejs.org/))
- **npm** (Node.js와 함께 설치됨)

### 2️⃣ 설치 (처음 한 번만)

```bash
# 의존성 설치
npm install
```

**설치 중 문제가 발생하면:**
```bash
# 캐시 정리
npm cache clean --force

# 재설치
npm install
```

### 3️⃣ 개발 모드 실행

**Windows:**
```cmd
# 방법 1: npm 명령어
npm run dev

# 방법 2: 배치 파일
electron\start.bat
```

**macOS/Linux:**
```bash
npm run dev
```

**개발 모드 특징:**
- 개발자 도구 자동 열림
- 코드 변경 시 수동 새로고침 (Ctrl+R)
- 디버깅 용이

**일반 실행:**
```bash
npm start
```

### 4️⃣ 빌드 (배포용 실행 파일 생성)

```bash
# Windows 버전 빌드
npm run build:win

# macOS 버전 빌드 (macOS에서만 가능)
npm run build:mac

# Linux 버전 빌드
npm run build:linux

# 모든 플랫폼 빌드 (macOS에서만 가능)
npm run build:all

# Windows에서 배치 파일 사용
electron\build.bat
```

빌드된 실행 파일은 `dist/` 폴더에 생성됩니다.

**빌드 결과물:**
- Windows: `dist/eBook Viewer Setup.exe` (설치 프로그램), `dist/eBook Viewer.exe` (포터블)
- macOS: `dist/eBook Viewer.dmg`, `dist/eBook Viewer-mac.zip`
- Linux: `dist/eBook Viewer.AppImage`, `dist/ebook-viewer_0.3.0_amd64.deb`

## 📁 프로젝트 구조

```
eBook_viewer/
├── electron/               # Electron 관련 파일
│   ├── main.js            # 메인 프로세스
│   ├── preload.js         # Preload 스크립트
│   ├── start.bat          # Windows 실행 스크립트
│   └── build.bat          # Windows 빌드 스크립트
├── src/                   # 웹 앱 소스 코드
│   ├── css/
│   └── js/
├── build/                 # 앱 아이콘 (생성 필요)
│   ├── icon.ico          # Windows 아이콘
│   ├── icon.icns         # macOS 아이콘
│   └── icon.png          # Linux 아이콘
├── ebook_viewer.html      # 메인 뷰어 페이지
├── index.html             # 랜딩 페이지
├── package.json           # Node.js 프로젝트 설정
└── docs/04_guides/electron/  # Electron 문서
    ├── README.md          # 이 문서
    ├── QUICKSTART.md      # 빠른 시작 가이드
    ├── INTEGRATION.md     # 통합 가이드
    └── CONVERSION_COMPLETE.md  # 변환 완료 요약
```

## 🎨 앱 아이콘 설정

빌드하기 전에 `build/` 폴더에 아이콘 파일을 준비해야 합니다:

### Windows (icon.ico)
- 크기: 256x256 픽셀 권장
- 형식: .ico
- 온라인 변환 도구: [ConvertICO](https://convertico.com/)

### macOS (icon.icns)
- 크기: 512x512 또는 1024x1024 픽셀
- 형식: .icns
- 생성 도구: macOS에서 `iconutil` 명령어 사용

### Linux (icon.png)
- 크기: 512x512 픽셀
- 형식: .png

아이콘 파일이 없으면 빌드 시 기본 Electron 아이콘이 사용됩니다.

## ✨ Electron 버전의 주요 기능

### 데스크톱 앱 기능
- ✅ 독립 실행형 데스크톱 애플리케이션
- ✅ 파일 메뉴에서 파일 열기 (Ctrl+O)
- ✅ 네이티브 파일 저장 다이얼로그
- ✅ 창 크기 및 위치 자동 저장
- ✅ 시스템 트레이 통합 준비
- ✅ 자동 업데이트 기능 준비

### 기존 웹 기능 유지
- ✅ Google Drive 연동
- ✅ AI 텍스트 변환 (Gemini API)
- ✅ 북마크 및 히스토리
- ✅ 마크다운 렌더링
- ✅ 테마 변경 (라이트/다크/세피아/그린)
- ✅ 글꼴 및 스타일 커스터마이징

## ⌨️ 단축키

| 기능 | 단축키 |
|------|--------|
| 파일 열기 | Ctrl+O (Cmd+O) |
| 뷰어로 이동 | Ctrl+1 (Cmd+1) |
| 홈으로 이동 | Ctrl+H (Cmd+H) |
| 새로고침 | Ctrl+R (Cmd+R) |
| 개발자 도구 | Ctrl+Shift+I (Cmd+Opt+I) |
| 전체화면 | F11 |
| 종료 | Ctrl+Q (Cmd+Q) |

## 🔧 개발자 가이드

### 개발 모드 특징
- 개발자 도구 자동 열림
- Hot Reload 지원 (코드 변경 시 자동 새로고침)
- 디버깅 로그 출력

### 코드 수정 후 테스트
```bash
# 개발 모드로 실행
npm run dev

# 변경사항 확인 후 빌드
npm run build:win
```

### 디버깅
```javascript
// 렌더러 프로세스 (웹 페이지)
console.log('렌더러:', data);

// 메인 프로세스 (터미널 출력)
console.log('메인:', data);
```

## 📦 빌드 결과물

### Windows
- **NSIS 설치 프로그램**: `eBook Viewer Setup.exe`
- **포터블 버전**: `eBook Viewer.exe` (설치 불필요)

### macOS
- **DMG 이미지**: `eBook Viewer.dmg`
- **ZIP 압축**: `eBook Viewer-mac.zip`

### Linux
- **AppImage**: `eBook Viewer.AppImage` (실행 권한 필요)
- **DEB 패키지**: `ebook-viewer_version_amd64.deb`

## 🔍 문제 해결

### "npm install" 실패
```bash
# npm 캐시 정리
npm cache clean --force

# 재시도
npm install
```

### 빌드 오류
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install

# 빌드 재시도
npm run build:win
```

### 앱이 시작되지 않음
1. Node.js 버전 확인: `node --version` (18.x 이상)
2. 개발자 도구에서 오류 확인 (Ctrl+Shift+I)
3. 메인 프로세스 로그 확인 (터미널 출력)

## 🌐 웹 버전과의 차이점

| 기능 | 웹 버전 | Electron 버전 |
|------|---------|---------------|
| 실행 방식 | 브라우저 필요 | 독립 실행 |
| 파일 접근 | 제한적 | 네이티브 접근 |
| 설치 | 불필요 | 설치 가능 |
| 업데이트 | 즉시 | 자동/수동 |
| 오프라인 | 제한적 | 완전 지원 |

## 📝 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 🤝 기여

이슈 및 풀 리퀘스트 환영합니다!

## 📮 문의

- GitHub Issues: [링크]
- Email: your.email@example.com

---

**현재 버전**: 0.2.4.10  
**Electron 버전**: 28.x  
**Node.js 버전**: 18.x 이상
