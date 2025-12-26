# 로컬 서버 구동 방법

이 프로젝트는 Google Drive API를 사용하므로 `file://` 프로토콜이 아닌 HTTP 서버를 통해 실행해야 합니다.

## 방법 1: Python HTTP Server (권장)

### Python 3 사용

```powershell
# 프로젝트 디렉토리로 이동
cd E:\Coding\eBook_viewer

# 포트 8000에서 서버 실행
python -m http.server 8000
```

또는 다른 포트 사용:

```powershell
# 포트 3000에서 서버 실행
python -m http.server 3000
```

### Python 2 사용 (구버전)

```powershell
python -m SimpleHTTPServer 8000
```

### 서버 접속

서버 실행 후 브라우저에서 다음 주소로 접속:

```
http://localhost:8000/ebook_viewer.html
```

또는

```
http://127.0.0.1:8000/ebook_viewer.html
```

### 서버 중지

터미널에서 `Ctrl + C`를 눌러 서버를 중지합니다.

## 방법 2: Node.js HTTP Server

### http-server 패키지 사용

```powershell
# http-server 전역 설치 (최초 1회만)
npm install -g http-server

# 서버 실행
http-server -p 8000
```

### npx 사용 (설치 없이)

```powershell
npx http-server -p 8000
```

### 서버 접속

```
http://localhost:8000/ebook_viewer.html
```

## 방법 3: PHP 내장 서버

```powershell
# PHP가 설치되어 있는 경우
php -S localhost:8000
```

### 서버 접속

```
http://localhost:8000/ebook_viewer.html
```

## 방법 4: VS Code Live Server 확장

1. VS Code에서 "Live Server" 확장 설치
2. `ebook_viewer.html` 파일을 우클릭
3. "Open with Live Server" 선택

자동으로 브라우저가 열리고 서버가 실행됩니다.

## 방법 5: Python 서버를 백그라운드로 실행 (Windows)

PowerShell에서:

```powershell
# 백그라운드로 서버 실행
Start-Process python -ArgumentList "-m","http.server","8000" -WindowStyle Hidden

# 서버 중지 (프로세스 찾아서 종료)
Get-Process python | Where-Object {$_.CommandLine -like "*http.server*"} | Stop-Process
```

## Google Drive API 설정 주의사항

로컬 서버를 사용할 때는 Google Cloud Console에서 다음을 설정해야 합니다:

1. **승인된 JavaScript 원본**에 다음 주소 추가:
   - `http://localhost:8000`
   - `http://127.0.0.1:8000`
   - 사용하는 포트 번호에 맞게 변경

2. **승인된 리디렉션 URI**에 다음 주소 추가:
   - `http://localhost:8000`
   - `http://127.0.0.1:8000`

## 빠른 시작 스크립트

### start_server.ps1 (PowerShell)

```powershell
# start_server.ps1
Write-Host "로컬 서버를 시작합니다..." -ForegroundColor Green
Write-Host "브라우저에서 http://localhost:8000/ebook_viewer.html 로 접속하세요" -ForegroundColor Yellow
python -m http.server 8000
```

사용 방법:

프로젝트 루트 디렉토리에서:

```powershell
.\scripts\start_server.ps1
```

또는 scripts 폴더에서:

```powershell
cd scripts
.\start_server.ps1
```

### start_server.bat (배치 파일)

```batch
@echo off
echo 로컬 서버를 시작합니다...
echo 브라우저에서 http://localhost:8000/ebook_viewer.html 로 접속하세요
python -m http.server 8000
pause
```

사용 방법:

프로젝트 루트 디렉토리에서:

```cmd
scripts\start_server.bat
```

또는 scripts 폴더에서:

```cmd
cd scripts
start_server.bat
```

## 포트 충돌 해결

다른 포트가 사용 중인 경우:

```powershell
# 사용 가능한 포트 확인 (예: 3000)
python -m http.server 3000
```

또는 다른 포트 사용:

```powershell
python -m http.server 8080
```

접속 주소도 변경:

```
http://localhost:3000/ebook_viewer.html
```

## 문제 해결

### "포트가 이미 사용 중입니다" 오류

다른 포트를 사용하거나, 해당 포트를 사용하는 프로세스를 종료:

```powershell
# 포트 8000을 사용하는 프로세스 찾기
netstat -ano | findstr :8000

# 프로세스 ID 확인 후 종료 (PID는 위 명령 결과에서 확인)
taskkill /PID <프로세스ID> /F
```

### Python이 설치되어 있지 않은 경우

1. [Python 공식 사이트](https://www.python.org/downloads/)에서 Python 3.x 다운로드
2. 설치 시 "Add Python to PATH" 옵션 체크
3. 설치 후 PowerShell 재시작

### 서버는 실행되지만 페이지가 로드되지 않는 경우

1. 브라우저 캐시 지우기 (Ctrl + Shift + Delete)
2. 하드 리프레시 (Ctrl + Shift + R)
3. 서버 로그 확인 (터미널에서 오류 메시지 확인)

## 권장 설정

가장 간단하고 안정적인 방법은 **Python HTTP Server**입니다:

```powershell
cd E:\Coding\eBook_viewer
python -m http.server 8000
```

그 다음 브라우저에서 `http://localhost:8000/ebook_viewer.html`로 접속하세요.

