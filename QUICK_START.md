# 🚀 빠른 시작 가이드

## 현재 위치 확인

현재 프로젝트 루트 디렉토리에 있습니다:
```
C:\Users\kiuk1\.cursor\worktrees\eBook_viewer\gsb
```

## 테스트 방법

### ✅ 방법 1: PowerShell 스크립트 사용 (추천)

현재 디렉토리에서 바로 실행:

```powershell
# 에이전트 1 테스트
.\scripts\test-agent.ps1 -Agent 1

# 에이전트 2 테스트
.\scripts\test-agent.ps1 -Agent 2

# 에이전트 3 테스트
.\scripts\test-agent.ps1 -Agent 3

# 원본으로 복원
.\scripts\test-agent.ps1 -Agent original
```

### ✅ 방법 2: 파일 직접 교체

```powershell
# 에이전트 1로 전환
.\scripts\switch-viewer.ps1 -Version agent1

# 원본으로 복원
.\scripts\switch-viewer.ps1 -Version original
```

### ✅ 방법 3: 모든 에이전트 순차 테스트

```powershell
.\scripts\test-all-agents.ps1
```

## 테스트 순서

1. **로컬 서버 실행** (별도 터미널)
   ```powershell
   python -m http.server 8000
   ```

2. **스크립트 실행** (현재 터미널)
   ```powershell
   .\scripts\test-agent.ps1 -Agent 1
   ```

3. **브라우저에서 테스트**
   - `http://localhost:8000/ebook_viewer.html` 열기
   - **Ctrl+Shift+R** (강력 새로고침)
   - 기능 테스트

4. **다음 에이전트로 전환**
   ```powershell
   .\scripts\test-agent.ps1 -Agent 2
   ```
   브라우저 새로고침 후 테스트 반복

## 문제 해결

### 스크립트 실행 권한 오류

PowerShell에서 실행 정책 변경:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 파일을 찾을 수 없음

현재 디렉토리 확인:
```powershell
Get-Location
```

프로젝트 루트로 이동 (필요한 경우):
```powershell
cd C:\Users\kiuk1\.cursor\worktrees\eBook_viewer\gsb
```

### 브라우저 캐시 문제

- **Ctrl+Shift+R**: 강력 새로고침
- 또는 개발자 도구(F12) → Network 탭 → "Disable cache" 체크

## 확인 사항

✅ 현재 위치에 다음 파일들이 있어야 합니다:
- `src/js/viewer.js`
- `src/js/main.js`
- `scripts/test-agent.ps1`
- `src/js/viewer/agent1_class-based/index.js`

---

**작성일**: 2026-01-02

