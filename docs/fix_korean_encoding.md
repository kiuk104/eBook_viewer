# PowerShell 한글 인코딩 문제 해결 방법

## 문제 상황
PowerShell에서 한글 커밋 메시지를 사용할 때 인코딩 오류가 발생합니다.

## 해결 방법

### 방법 1: Git 인코딩 설정 (권장)

```powershell
# UTF-8로 커밋 메시지 인코딩 설정
git config --global i18n.commitencoding utf-8

# 출력 인코딩도 UTF-8로 설정
git config --global i18n.logoutputencoding utf-8

# Windows에서 파일 이름 인코딩 설정
git config --global core.quotepath false
```

### 방법 2: PowerShell 출력 인코딩 설정

```powershell
# 현재 세션에서만 적용
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 영구적으로 적용하려면 PowerShell 프로필에 추가
# 프로필 경로 확인: $PROFILE
# 프로필에 다음 추가:
# $OutputEncoding = [System.Text.Encoding]::UTF8
# [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

### 방법 3: 환경 변수 설정

```powershell
# 시스템 환경 변수에 추가
[System.Environment]::SetEnvironmentVariable("PYTHONIOENCODING", "utf-8", "User")
[System.Environment]::SetEnvironmentVariable("LANG", "ko_KR.UTF-8", "User")
```

### 방법 4: PowerShell 프로필 설정 (영구 적용)

```powershell
# 프로필 파일 열기 (없으면 생성)
if (!(Test-Path -Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force
}
notepad $PROFILE

# 프로필에 다음 내용 추가:
# ============================================
# 한글 인코딩 설정
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# Git 인코딩 설정
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
git config --global core.quotepath false
# ============================================
```

### 방법 5: 커밋 메시지 파일 사용

한글 커밋 메시지를 파일로 작성하여 사용:

```powershell
# 메시지 파일 생성
@"
Google Drive 통합 및 에러 처리 개선

- 에러 객체 전체 구조 로깅 추가
- undefined 에러 메시지 표시 문제 해결
- 에러 메시지 추출 로직 개선
- Google Drive 아키텍처 다이어그램 추가
"@ | Out-File -FilePath commit_msg.txt -Encoding UTF8

# 파일을 사용하여 커밋
git commit -F commit_msg.txt

# 파일 삭제
Remove-Item commit_msg.txt
```

## 즉시 적용 방법 (현재 세션)

다음 명령을 실행하면 현재 PowerShell 세션에서 바로 적용됩니다:

```powershell
# Git 설정
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
git config --global core.quotepath false

# PowerShell 인코딩 설정
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

## 테스트

설정 후 다음 명령으로 테스트:

```powershell
# 한글 커밋 메시지 테스트
git commit --allow-empty -m "테스트: 한글 인코딩 확인"

# 또는 파일 사용
echo "테스트: 한글 인코딩 확인" | Out-File -FilePath test_msg.txt -Encoding UTF8
git commit --allow-empty -F test_msg.txt
Remove-Item test_msg.txt
```

## 가장 실용적인 해결 방법

PowerShell에서 한글 커밋 메시지를 사용할 때 가장 확실한 방법은 **커밋 메시지 파일을 사용**하는 것입니다:

```powershell
# 1. UTF-8 인코딩으로 메시지 파일 생성
$message = @"
Google Drive 통합 및 에러 처리 개선

- 에러 객체 전체 구조 로깅 추가
- undefined 에러 메시지 표시 문제 해결
- 에러 메시지 추출 로직 개선
- Google Drive 아키텍처 다이어그램 추가
"@
$message | Out-File -FilePath commit_msg.txt -Encoding UTF8

# 2. 파일을 사용하여 커밋
git commit -F commit_msg.txt

# 3. 파일 삭제
Remove-Item commit_msg.txt
```

또는 한 줄로:

```powershell
"한글 커밋 메시지" | Out-File -FilePath msg.txt -Encoding UTF8; git commit -F msg.txt; Remove-Item msg.txt
```

## 참고사항

- **방법 1 (Git 설정)**: 이미 적용됨 ✅
- **방법 5 (파일 사용)**: 가장 확실하고 안전한 방법 (권장)
- PowerShell 콘솔 출력은 깨질 수 있지만, Git 저장소에는 UTF-8로 정상 저장됩니다.
- GitHub, GitLab 등 웹 인터페이스에서는 한글이 정상적으로 표시됩니다.

