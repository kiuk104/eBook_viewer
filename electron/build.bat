@echo off
chcp 65001 >nul
echo ========================================
echo   eBook Viewer - 빌드 도구
echo ========================================
echo.

REM Node.js 설치 확인
where node >nul 2>&1
if errorlevel 1 (
    echo 오류: Node.js가 설치되어 있지 않습니다.
    pause
    exit /b 1
)

echo 빌드 옵션을 선택하세요:
echo   1. Windows만 빌드
echo   2. macOS만 빌드 (macOS에서만 가능)
echo   3. Linux만 빌드
echo   4. 모든 플랫폼 빌드 (macOS에서만 가능)
echo.

set /p choice="선택 (1-4): "

if "%choice%"=="1" (
    echo Windows 버전을 빌드합니다...
    call npm run build:win
) else if "%choice%"=="2" (
    echo macOS 버전을 빌드합니다...
    call npm run build:mac
) else if "%choice%"=="3" (
    echo Linux 버전을 빌드합니다...
    call npm run build:linux
) else if "%choice%"=="4" (
    echo 모든 플랫폼 버전을 빌드합니다...
    call npm run build:all
) else (
    echo 잘못된 선택입니다.
    pause
    exit /b 1
)

echo.
echo 빌드 완료!
echo 결과물은 dist 폴더에 생성되었습니다.
echo.

pause
