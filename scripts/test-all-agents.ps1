# test-all-agents.ps1
# 모든 에이전트를 순차적으로 테스트하는 스크립트

$agents = @(
    @{ Name = "원본"; Path = "src/js/viewer.js.backup"; Key = "original" }
    @{ Name = "에이전트 1 (클래스 기반)"; Path = "src/js/viewer/agent1_class-based/index.js"; Key = "agent1" }
    @{ Name = "에이전트 2 (함수형 파이프라인)"; Path = "src/js/viewer/agent2_functional-pipeline/index.js"; Key = "agent2" }
    @{ Name = "에이전트 3 (이벤트 기반)"; Path = "src/js/viewer/agent3_event-based/index.js"; Key = "agent3" }
)

$viewerPath = "src/js/viewer.js"
$backupPath = "src/js/viewer.js.backup"

# 원본 백업 확인
if (-not (Test-Path $backupPath)) {
    if (Test-Path $viewerPath) {
        Copy-Item $viewerPath $backupPath
        Write-Host "✅ 원본 파일 백업 완료`n"
    } else {
        Write-Host "❌ 원본 viewer.js 파일을 찾을 수 없습니다."
        exit 1
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "viewer.js 리팩토링 제안 테스트"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

foreach ($agent in $agents) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host "테스트 중: $($agent.Name)"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"
    
    # 파일 교체
    if ($agent.Key -eq "original") {
        Copy-Item $backupPath $viewerPath -Force
    } else {
        if (Test-Path $agent.Path) {
            Copy-Item $agent.Path $viewerPath -Force
        } else {
            Write-Host "⚠️  파일을 찾을 수 없습니다: $($agent.Path)"
            Write-Host "다음 에이전트로 넘어갑니다.`n"
            continue
        }
    }
    
    Write-Host "✅ 전환 완료"
    Write-Host ""
    Write-Host "다음 단계:"
    Write-Host "1. 브라우저에서 http://localhost:8000/ebook_viewer.html 열기"
    Write-Host "2. Ctrl+Shift+R로 강력 새로고침"
    Write-Host "3. 테스트 체크리스트에 따라 기능 테스트"
    Write-Host "4. 아래 체크리스트 결과를 기록하세요`n"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host "테스트 체크리스트:"
    Write-Host "  [ ] 파일 업로드"
    Write-Host "  [ ] 마크다운 렌더링"
    Write-Host "  [ ] 북마크 추가/삭제"
    Write-Host "  [ ] 히스토리 표시"
    Write-Host "  [ ] 스타일 변경"
    Write-Host "  [ ] 읽기 위치 저장/복원"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"
    
    $response = Read-Host "테스트 완료 후 Enter 키를 누르면 다음 에이전트로 넘어갑니다 (q 입력 시 종료)"
    
    if ($response -eq "q") {
        Write-Host "`n테스트를 중단합니다.`n"
        break
    }
}

# 원본으로 복원
Copy-Item $backupPath $viewerPath -Force
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "✅ 모든 테스트 완료. 원본 viewer.js로 복원했습니다."
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

