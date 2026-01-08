# test-agent.ps1
# 특정 에이전트로 전환하는 스크립트

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet(1,2,3,"original")]
    [string]$Agent
)

$mainJsPath = "src/js/main.js"
$backupPath = "src/js/main.js.backup"

# 백업 생성
if (-not (Test-Path $backupPath)) {
    Copy-Item $mainJsPath $backupPath
    Write-Host "✅ main.js 백업 생성 완료"
}

# 백업에서 복원
Copy-Item $backupPath $mainJsPath

# import 경로 변경
$content = Get-Content $mainJsPath -Raw -Encoding UTF8

switch ($Agent) {
    "original" {
        # 원본으로 복원 (이미 복원됨)
        Write-Host "✅ 원본 viewer.js로 전환 완료"
    }
    "1" {
        $content = $content -replace "from '\./viewer\.js'", "from './viewer/agent1_class-based/index.js'"
        Set-Content $mainJsPath $content -NoNewline -Encoding UTF8
        Write-Host "✅ 에이전트 1 (클래스 기반)로 전환 완료"
    }
    "2" {
        $content = $content -replace "from '\./viewer\.js'", "from './viewer/agent2_functional-pipeline/index.js'"
        Set-Content $mainJsPath $content -NoNewline -Encoding UTF8
        Write-Host "✅ 에이전트 2 (함수형 파이프라인)로 전환 완료"
    }
    "3" {
        $content = $content -replace "from '\./viewer\.js'", "from './viewer/agent3_event-based/index.js'"
        Set-Content $mainJsPath $content -NoNewline -Encoding UTF8
        Write-Host "✅ 에이전트 3 (이벤트 기반)로 전환 완료"
    }
}

Write-Host ""
Write-Host "브라우저를 새로고침하세요 (Ctrl+Shift+R 권장)"
Write-Host ""

