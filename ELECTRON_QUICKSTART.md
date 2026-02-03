# 🚀 Electron 앱 빠른 시작 가이드

## 📋 체크리스트

시작하기 전에 다음 항목을 확인하세요:

- [ ] Node.js 18.x 이상 설치 (https://nodejs.org/)
- [ ] npm이 설치되어 있는지 확인 (`npm --version`)
- [ ] 프로젝트 파일이 모두 있는지 확인

## 1️⃣ 의존성 설치 (처음 한 번만)

### Windows
```cmd
npm install
```

### macOS/Linux
```bash
npm install
```

설치 중 문제가 발생하면:
```bash
# 캐시 정리
npm cache clean --force

# 재설치
npm install
```

## 2️⃣ 개발 모드로 실행

### Windows
```cmd
# 방법 1: npm 명령어
npm run dev

# 방법 2: 배치 파일
electron\start.bat
```

### macOS/Linux
```bash
npm run dev
```

**개발 모드 특징:**
- 개발자 도구 자동 열림
- 코드 변경 시 수동 새로고침 (Ctrl+R)
- 콘솔 로그 확인 가능

## 3️⃣ 일반 모드로 실행

```bash
npm start
```

## 4️⃣ 빌드 (실행 파일 생성)

### Windows 실행 파일 생성
```bash
npm run build:win
```

결과물:
- `dist/eBook Viewer Setup.exe` - 설치 프로그램
- `dist/eBook Viewer.exe` - 포터블 버전

### macOS 실행 파일 생성 (macOS에서만)
```bash
npm run build:mac
```

결과물:
- `dist/eBook Viewer.dmg`
- `dist/eBook Viewer-mac.zip`

### Linux 실행 파일 생성
```bash
npm run build:linux
```

결과물:
- `dist/eBook Viewer.AppImage`
- `dist/ebook-viewer_0.2.4.10_amd64.deb`

### Windows에서 빌드 메뉴 사용
```cmd
electron\build.bat
```

## 📱 앱 사용법

### 파일 열기
1. **메뉴 사용**: 파일 → 파일 열기 (Ctrl+O)
2. **드래그 앤 드롭**: 파일을 창에 드롭 (향후 구현 예정)

### 페이지 이동
- **홈으로**: Ctrl+H
- **뷰어로**: Ctrl+1

### 기타 단축키
- **새로고침**: Ctrl+R
- **전체화면**: F11
- **개발자 도구**: Ctrl+Shift+I
- **종료**: Ctrl+Q

## 🎨 아이콘 설정 (선택사항)

빌드 전에 앱 아이콘을 커스터마이징하려면:

1. `build/ICON_GUIDE.md` 참고
2. 아이콘 파일 준비:
   - `build/icon.ico` (Windows)
   - `build/icon.icns` (macOS)
   - `build/icon.png` (Linux)

임시 아이콘으로 시작하려면:
```bash
cd build
./create_placeholder_icons.sh  # Linux/macOS
```

## 🔍 문제 해결

### "Cannot find module 'electron'" 오류
```bash
npm install
```

### 빌드 실패
```bash
# 1. node_modules 삭제
rm -rf node_modules

# 2. 재설치
npm install

# 3. 캐시 정리
npm cache clean --force

# 4. 재빌드
npm run build:win
```

### 앱이 실행되지 않음
1. Node.js 버전 확인: `node --version` (18.x 이상 필요)
2. 개발 모드로 실행하여 오류 확인: `npm run dev`
3. 콘솔 로그 확인 (Ctrl+Shift+I)

### Windows에서 "script not found" 오류
```bash
# package.json의 스크립트 확인
npm run

# npm 업데이트
npm install -g npm@latest
```

## 📚 다음 단계

1. **기능 테스트**
   - 파일 열기/저장 테스트
   - Google Drive 연동 테스트
   - 북마크 및 히스토리 테스트

2. **커스터마이징**
   - 앱 아이콘 변경
   - 메뉴 항목 수정 (`electron/main.js`)
   - 창 크기 조정 (`electron/main.js`)

3. **배포**
   - 빌드 테스트
   - 다른 컴퓨터에서 실행 테스트
   - GitHub Release 업로드

## 📖 추가 문서

- **전체 가이드**: `README_ELECTRON.md`
- **아이콘 가이드**: `build/ICON_GUIDE.md`
- **웹 버전 문서**: `README.md`

## 🆘 도움말

문제가 계속되면:
1. GitHub Issues에 문제 등록
2. `npm run dev`로 실행하여 오류 로그 확인
3. 터미널 출력을 스크린샷으로 캡처

---

**준비 완료!** 이제 `npm run dev` 명령으로 앱을 실행해보세요! 🎉
