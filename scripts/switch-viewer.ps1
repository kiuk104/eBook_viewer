# switch-viewer.ps1
# viewer.js 파일을 직접 교체하는 스크립트

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("original", "agent1", "agent2", "agent3")]
    [string]$Version
)

$viewerPath = "src/js/viewer.js"
$backupPath = "src/js/viewer.js.backup"

# 백업이 없으면 생성
if (-not (Test-Path $backupPath)) {
    if (Test-Path $viewerPath) {
        Copy-Item $viewerPath $backupPath
        Write-Host "✅ 원본 파일 백업 완료"
    } else {
        Write-Host "❌ 원본 viewer.js 파일을 찾을 수 없습니다."
        exit 1
    }
}

# 파일 교체
switch ($Version) {
    "original" {
        Copy-Item $backupPath $viewerPath -Force
        Write-Host "✅ 원본 viewer.js로 복원 완료"
    }
    "agent1" {
        $sourcePath = "src/js/viewer/agent1_class-based/index.js"
        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath $viewerPath -Force
            Write-Host "✅ 에이전트 1 (클래스 기반)로 전환 완료"
        } else {
            Write-Host "❌ 에이전트 1 파일을 찾을 수 없습니다: $sourcePath"
            exit 1
        }
    }
    "agent2" {
        $sourcePath = "src/js/viewer/agent2_functional-pipeline/index.js"
        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath $viewerPath -Force
            Write-Host "✅ 에이전트 2 (함수형 파이프라인)로 전환 완료"
        } else {
            Write-Host "❌ 에이전트 2 파일을 찾을 수 없습니다: $sourcePath"
            exit 1
        }
    }
    "agent3" {
        $sourcePath = "src/js/viewer/agent3_event-based/index.js"
        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath $viewerPath -Force
            Write-Host "✅ 에이전트 3 (이벤트 기반)로 전환 완료"
        } else {
            Write-Host "❌ 에이전트 3 파일을 찾을 수 없습니다: $sourcePath"
            exit 1
        }
    }
}

Write-Host ""
Write-Host "브라우저를 새로고침하세요 (Ctrl+Shift+R 권장)"
Write-Host ""

