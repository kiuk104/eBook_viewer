# 프로젝트 파일 구조 정리 스크립트
# 이 스크립트는 루트 디렉토리의 파일들을 적절한 폴더로 이동시킵니다.

Write-Host "=== 프로젝트 파일 구조 정리 시작 ===" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# 1. logs 폴더 생성 및 .log 파일, HTTP_Server_Log.txt 이동
Write-Host "[1/3] logs 폴더 정리 중..." -ForegroundColor Yellow

if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
    Write-Host "  - logs 폴더 생성 완료" -ForegroundColor Green
}

# .log 파일 이동
$logFiles = Get-ChildItem -Path "." -Filter "*.log" -File
if ($logFiles.Count -gt 0) {
    foreach ($file in $logFiles) {
        $destination = Join-Path "logs" $file.Name
        Move-Item -Path $file.FullName -Destination $destination -Force
        Write-Host "  - 이동: $($file.Name) -> logs/" -ForegroundColor Gray
    }
    Write-Host "  - $($logFiles.Count)개의 .log 파일 이동 완료" -ForegroundColor Green
} else {
    Write-Host "  - 이동할 .log 파일이 없습니다" -ForegroundColor Gray
}

# HTTP_Server_Log.txt 이동
if (Test-Path "HTTP_Server_Log.txt") {
    Move-Item -Path "HTTP_Server_Log.txt" -Destination "logs\HTTP_Server_Log.txt" -Force
    Write-Host "  - 이동: HTTP_Server_Log.txt -> logs/" -ForegroundColor Gray
    Write-Host "  - HTTP_Server_Log.txt 이동 완료" -ForegroundColor Green
} else {
    Write-Host "  - HTTP_Server_Log.txt 파일이 없습니다" -ForegroundColor Gray
}

Write-Host ""

# 2. docs 폴더 생성 및 .md 파일 이동 (README.md 제외)
Write-Host "[2/3] docs 폴더 정리 중..." -ForegroundColor Yellow

if (-not (Test-Path "docs")) {
    New-Item -ItemType Directory -Path "docs" | Out-Null
    Write-Host "  - docs 폴더 생성 완료" -ForegroundColor Green
}

# .md 파일 이동 (README.md 제외)
$mdFiles = Get-ChildItem -Path "." -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" }
if ($mdFiles.Count -gt 0) {
    foreach ($file in $mdFiles) {
        $destination = Join-Path "docs" $file.Name
        Move-Item -Path $file.FullName -Destination $destination -Force
        Write-Host "  - 이동: $($file.Name) -> docs/" -ForegroundColor Gray
    }
    Write-Host "  - $($mdFiles.Count)개의 .md 파일 이동 완료" -ForegroundColor Green
} else {
    Write-Host "  - 이동할 .md 파일이 없습니다" -ForegroundColor Gray
}

Write-Host ""

# 3. scripts 폴더 생성 및 .bat, .ps1 파일 이동
Write-Host "[3/3] scripts 폴더 정리 중..." -ForegroundColor Yellow

if (-not (Test-Path "scripts")) {
    New-Item -ItemType Directory -Path "scripts" | Out-Null
    Write-Host "  - scripts 폴더 생성 완료" -ForegroundColor Green
}

# .bat 파일 이동
$batFiles = Get-ChildItem -Path "." -Filter "*.bat" -File
if ($batFiles.Count -gt 0) {
    foreach ($file in $batFiles) {
        $destination = Join-Path "scripts" $file.Name
        Move-Item -Path $file.FullName -Destination $destination -Force
        Write-Host "  - 이동: $($file.Name) -> scripts/" -ForegroundColor Gray
    }
    Write-Host "  - $($batFiles.Count)개의 .bat 파일 이동 완료" -ForegroundColor Green
} else {
    Write-Host "  - 이동할 .bat 파일이 없습니다" -ForegroundColor Gray
}

# .ps1 파일 이동 (organize_files.ps1 제외 - 현재 실행 중인 스크립트)
$ps1Files = Get-ChildItem -Path "." -Filter "*.ps1" -File | Where-Object { $_.Name -ne "organize_files.ps1" }
if ($ps1Files.Count -gt 0) {
    foreach ($file in $ps1Files) {
        $destination = Join-Path "scripts" $file.Name
        Move-Item -Path $file.FullName -Destination $destination -Force
        Write-Host "  - 이동: $($file.Name) -> scripts/" -ForegroundColor Gray
    }
    Write-Host "  - $($ps1Files.Count)개의 .ps1 파일 이동 완료" -ForegroundColor Green
} else {
    Write-Host "  - 이동할 .ps1 파일이 없습니다" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== 파일 구조 정리 완료 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "정리된 구조:" -ForegroundColor White
Write-Host "  - logs/     : 로그 파일들" -ForegroundColor Gray
Write-Host "  - docs/     : 문서 파일들 (.md)" -ForegroundColor Gray
Write-Host "  - scripts/  : 스크립트 파일들 (.bat, .ps1)" -ForegroundColor Gray
Write-Host "  - 루트      : ebook_viewer.html, index.html (유지)" -ForegroundColor Gray
Write-Host ""

