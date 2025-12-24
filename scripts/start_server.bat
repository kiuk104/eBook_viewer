@echo off
chcp 65001 >nul
echo ========================================
echo   이북 뷰어 로컬 서버 시작
echo ========================================
echo.

cd /d "%~dp0"

echo 현재 디렉토리: %CD%
echo.

REM Python 설치 확인
python --version >nul 2>&1
if errorlevel 1 (
    echo 오류: Python이 설치되어 있지 않습니다.
    echo Python을 설치하거나 다른 방법을 사용해주세요.
    pause
    exit /b 1
)

python --version
echo.

set PORT=8000
echo 서버 포트: %PORT%
echo.

echo ========================================
echo   서버 시작 중...
echo ========================================
echo.
echo 브라우저에서 다음 주소로 접속하세요:
echo   http://localhost:%PORT%/ebook_viewer.html
echo.
echo 서버를 중지하려면 Ctrl + C 를 누르세요
echo.

python -m http.server %PORT%

pause

