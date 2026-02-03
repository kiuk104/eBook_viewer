@echo off
chcp 65001 >nul
echo ========================================
echo   eBook Viewer - Electron App
echo ========================================
echo.

REM Node.js 설치 확인
where node >nul 2>&1
if errorlevel 1 (
    echo 오류: Node.js가 설치되어 있지 않습니다.
    echo Node.js를 설치해주세요: https://nodejs.org/
    pause
    exit /b 1
)

REM node_modules 존재 확인
if not exist "node_modules\" (
    echo Node 모듈이 설치되지 않았습니다.
    echo 설치 중...
    call npm install
    echo.
)

echo Electron 앱을 시작합니다...
echo.

npm start

pause
