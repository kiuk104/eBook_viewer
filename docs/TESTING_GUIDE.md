# 🧪 viewer.js 리팩토링 제안 테스트 가이드

각 에이전트의 제안을 실제 뷰어에서 테스트하는 방법입니다.

---

## 📋 목차

1. [사전 준비](#사전-준비)
2. [테스트 방법 1: 임시 import 경로 변경](#테스트-방법-1-임시-import-경로-변경) (추천 ⭐)
3. [테스트 방법 2: 파일 교체](#테스트-방법-2-파일-교체)
4. [테스트 체크리스트](#테스트-체크리스트)
5. [문제 해결](#문제-해결)

---

## 사전 준비

### 1. 원본 파일 백업

```bash
# PowerShell 또는 Git Bash에서 실행
cp src/js/viewer.js src/js/viewer.js.backup
```

또는 Git을 사용하는 경우:

```bash
git add src/js/viewer.js
git commit -m "백업: 원본 viewer.js 보존"
```

### 2. 현재 상태 확인

브라우저에서 뷰어가 정상 작동하는지 확인:

1. 로컬 서버 실행
   ```powershell
   python -m http.server 8000
   ```

2. 브라우저에서 `http://localhost:8000/ebook_viewer.html` 접속

3. 기본 기능 테스트:
   - [ ] 파일 업로드
   - [ ] 마크다운 파일 렌더링
   - [ ] 북마크 추가/삭제
   - [ ] 히스토리 표시
   - [ ] 스타일 변경

---

## 테스트 방법 1: 임시 import 경로 변경 (추천 ⭐)

**장점**: 원본 파일을 건드리지 않음, 빠른 전환 가능

### 단계

1. **`src/js/main.js` 파일 열기**

2. **import 구문 찾기** (대략 9번째 줄):
   ```javascript
   import { displayUploadHistory, displayUploadBookmarks, ... } from './viewer.js';
   ```

3. **임시로 에이전트 경로로 변경**:

   #### 에이전트 1 테스트
   ```javascript
   import { displayUploadHistory, displayUploadBookmarks, ... } from './viewer/agent1_class-based/index.js';
   ```

   #### 에이전트 2 테스트
   ```javascript
   import { displayUploadHistory, displayUploadBookmarks, ... } from './viewer/agent2_functional-pipeline/index.js';
   ```

   #### 에이전트 3 테스트
   ```javascript
   import { displayUploadHistory, displayUploadBookmarks, ... } from './viewer/agent3_event-based/index.js';
   ```

4. **브라우저 새로고침 후 테스트**

5. **다른 에이전트 테스트**: import 경로만 변경하고 새로고침

### 빠른 전환 스크립트

PowerShell 스크립트를 만들어 자동화할 수 있습니다:

```powershell
# test-agent.ps1
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet(1,2,3)]
    [int]$Agent
)

$mainJsPath = "src/js/main.js"
$backupPath = "src/js/main.js.backup"

# 백업 생성
if (-not (Test-Path $backupPath)) {
    Copy-Item $mainJsPath $backupPath
}

# 백업에서 복원
Copy-Item $backupPath $mainJsPath

# import 경로 변경
$content = Get-Content $mainJsPath -Raw
$content = $content -replace "from './viewer\.js'", "from './viewer/agent${Agent}_*/index.js'"

# 정확한 경로로 변경
switch ($Agent) {
    1 { $content = $content -replace "from './viewer\.js'", "from './viewer/agent1_class-based/index.js'" }
    2 { $content = $content -replace "from './viewer\.js'", "from './viewer/agent2_functional-pipeline/index.js'" }
    3 { $content = $content -replace "from './viewer\.js'", "from './viewer/agent3_event-based/index.js'" }
}

Set-Content $mainJsPath $content -NoNewline
Write-Host "✅ 에이전트 $Agent 로 전환 완료"
Write-Host "브라우저를 새로고침하세요."
```

사용법:
```powershell
.\test-agent.ps1 -Agent 1  # 에이전트 1 테스트
.\test-agent.ps1 -Agent 2  # 에이전트 2 테스트
.\test-agent.ps1 -Agent 3  # 에이전트 3 테스트
```

---

## 테스트 방법 2: 파일 교체

**장점**: 완전히 독립적인 테스트

### 단계

1. **원본 viewer.js 백업**
   ```bash
   cp src/js/viewer.js src/js/viewer.js.backup
   ```

2. **에이전트 파일을 viewer.js로 복사**

   #### 에이전트 1
   ```bash
   cp src/js/viewer/agent1_class-based/index.js src/js/viewer.js
   ```

   #### 에이전트 2
   ```bash
   cp src/js/viewer/agent2_functional-pipeline/index.js src/js/viewer.js
   ```

   #### 에이전트 3
   ```bash
   cp src/js/viewer/agent3_event-based/index.js src/js/viewer.js
   ```

3. **브라우저 새로고침 후 테스트**

4. **원본 복원** (다른 에이전트 테스트 전)
   ```bash
   cp src/js/viewer.js.backup src/js/viewer.js
   ```

### 자동화 스크립트

```powershell
# switch-viewer.ps1
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("original", "agent1", "agent2", "agent3")]
    [string]$Version
)

$viewerPath = "src/js/viewer.js"
$backupPath = "src/js/viewer.js.backup"

# 백업이 없으면 생성
if (-not (Test-Path $backupPath)) {
    Copy-Item $viewerPath $backupPath
    Write-Host "✅ 원본 파일 백업 완료"
}

# 파일 교체
switch ($Version) {
    "original" {
        Copy-Item $backupPath $viewerPath
        Write-Host "✅ 원본 viewer.js로 복원"
    }
    "agent1" {
        Copy-Item "src/js/viewer/agent1_class-based/index.js" $viewerPath
        Write-Host "✅ 에이전트 1 (클래스 기반)로 전환"
    }
    "agent2" {
        Copy-Item "src/js/viewer/agent2_functional-pipeline/index.js" $viewerPath
        Write-Host "✅ 에이전트 2 (함수형)로 전환"
    }
    "agent3" {
        Copy-Item "src/js/viewer/agent3_event-based/index.js" $viewerPath
        Write-Host "✅ 에이전트 3 (이벤트 기반)로 전환"
    }
}

Write-Host "브라우저를 새로고침하세요."
```

사용법:
```powershell
.\switch-viewer.ps1 -Version agent1    # 에이전트 1 테스트
.\switch-viewer.ps1 -Version original  # 원본으로 복원
```

---

## 테스트 체크리스트

각 에이전트 테스트 시 다음 기능들이 정상 작동하는지 확인하세요:

### 기본 기능

- [ ] **파일 업로드**
  - 로컬 `.txt` 파일 업로드
  - 로컬 `.md` 파일 업로드
  - 드래그 앤 드롭

- [ ] **파일 표시**
  - 파일명 표시
  - 파일 정보 (크기, 날짜) 표시
  - 텍스트 내용 정확히 표시

### 마크다운 렌더링

- [ ] `.md` 파일 자동 감지
- [ ] 마크다운이 HTML로 렌더링됨
- [ ] 제목, 리스트, 링크 등 정상 표시

### 북마크 기능

- [ ] 북마크 추가 버튼 클릭
- [ ] 컨텍스트 메뉴에서 북마크 추가
- [ ] 북마크 목록 표시
- [ ] 북마크 클릭 시 해당 위치로 이동
- [ ] 북마크 삭제

### 히스토리 기능

- [ ] 읽은 파일이 히스토리에 추가됨
- [ ] 히스토리 목록 표시
- [ ] 히스토리 항목 클릭 (로컬 파일은 경고만)
- [ ] 히스토리 항목 삭제

### 스타일 기능

- [ ] **마크다운 스타일**
  - 제목 글씨체 변경
  - 제목 크기 슬라이더
  - 제목 색상 변경
  - 목차 색상 변경

- [ ] **본문 스타일**
  - 줄간격 조절
  - 글씨체 변경
  - 텍스트 색상 변경
  - 텍스트 스트로크 조절

- [ ] **뷰어 설정**
  - 뷰어 너비 조절
  - 전체 너비 모드 토글

### UI 기능

- [ ] 패널 접기/펼치기
- [ ] 설정 패널 토글
- [ ] 히스토리 섹션 접기/펼치기
- [ ] 북마크 섹션 접기/펼치기
- [ ] 줄바꿈 모드 토글

### 상태 저장

- [ ] 읽기 위치 자동 저장
- [ ] 파일 다시 열 때 위치 복원
- [ ] 스타일 설정 저장
- [ ] 설정 새로고침 후 유지

### 스크롤 기능

- [ ] 진행 바 표시
- [ ] 스크롤 시 진행 바 업데이트
- [ ] 읽기 위치 복원 시 정확한 위치

### 에러 처리

- [ ] 빈 파일 처리
- [ ] 잘못된 파일 타입 처리
- [ ] 파일 키 없을 때 북마크 추가 시도 (경고 메시지)

---

## 문제 해결

### 문제 1: "Module not found" 오류

**증상**: 브라우저 콘솔에 `Failed to resolve module specifier` 오류

**해결**:
1. import 경로가 정확한지 확인
2. 파일 경로에 오타가 없는지 확인
3. 브라우저 캐시 삭제 후 새로고침 (Ctrl+Shift+R)

### 문제 2: 함수가 정의되지 않았다는 오류

**증상**: `XXX is not defined` 오류

**해결**:
1. 해당 함수가 에이전트의 `index.js`에서 export되었는지 확인
2. `main.js`에서 import 목록에 포함되었는지 확인

### 문제 3: 기능이 작동하지 않음

**증상**: 특정 기능이 동작하지 않음

**해결**:
1. 브라우저 콘솔에서 에러 확인
2. 해당 기능이 에이전트 구현에 포함되었는지 확인
3. 원본 `viewer.js`와 비교하여 누락된 로직 확인

### 문제 4: 하이라이트 기능 작동 안 함

**원인**: 현재 에이전트 제안에는 하이라이트 기능이 포함되지 않음

**해결**:
- 원본 `viewer.js`의 하이라이트 관련 함수를 별도 모듈로 분리 후 import 필요

---

## 빠른 테스트 스크립트

다음 스크립트를 `scripts/test-agents.ps1`로 저장:

```powershell
# test-agents.ps1
# 모든 에이전트를 순차적으로 테스트하는 스크립트

$agents = @(
    @{ Name = "원본"; Path = "src/js/viewer.js.backup" }
    @{ Name = "에이전트 1 (클래스 기반)"; Path = "src/js/viewer/agent1_class-based/index.js" }
    @{ Name = "에이전트 2 (함수형)"; Path = "src/js/viewer/agent2_functional-pipeline/index.js" }
    @{ Name = "에이전트 3 (이벤트 기반)"; Path = "src/js/viewer/agent3_event-based/index.js" }
)

$viewerPath = "src/js/viewer.js"
$backupPath = "src/js/viewer.js.backup"

# 원본 백업
if (-not (Test-Path $backupPath)) {
    Copy-Item $viewerPath $backupPath
    Write-Host "✅ 원본 파일 백업 완료`n"
}

foreach ($agent in $agents) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host "테스트 중: $($agent.Name)"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"
    
    # 파일 교체
    if ($agent.Path -eq $backupPath) {
        Copy-Item $backupPath $viewerPath
    } else {
        Copy-Item $agent.Path $viewerPath
    }
    
    Write-Host "✅ 전환 완료"
    Write-Host "브라우저를 새로고침하고 테스트하세요."
    Write-Host "다음 에이전트로 넘어가려면 아무 키나 누르세요...`n"
    
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# 원본으로 복원
Copy-Item $backupPath $viewerPath
Write-Host "`n✅ 모든 테스트 완료. 원본 파일로 복원했습니다."
```

사용법:
```powershell
.\scripts\test-agents.ps1
```

---

## 📝 테스트 결과 기록

각 에이전트 테스트 후 다음을 기록하세요:

| 항목 | 원본 | 에이전트 1 | 에이전트 2 | 에이전트 3 |
|------|------|-----------|-----------|-----------|
| 기본 기능 | ✅ | | | |
| 마크다운 렌더링 | ✅ | | | |
| 북마크 기능 | ✅ | | | |
| 히스토리 기능 | ✅ | | | |
| 스타일 기능 | ✅ | | | |
| 성능 | - | | | |
| 코드 가독성 | - | | | |
| 확장성 | - | | | |

---

**작성일**: 2026-01-02  
**업데이트**: 각 에이전트 테스트 시 체크리스트 업데이트 필요

