# Git & GitHub 사용 가이드

이 문서는 프로젝트에서 Git과 GitHub를 사용하는 방법을 안내합니다.

---

## 📋 목차

1. [기본 설정](#기본-설정)
2. [일반적인 작업 흐름](#일반적인-작업-흐름)
3. [커밋 메시지 작성 규칙](#커밋-메시지-작성-규칙)
4. [한글 인코딩 문제 해결](#한글-인코딩-문제-해결)
5. [자주 사용하는 명령어](#자주-사용하는-명령어)
6. [문제 해결](#문제-해결)

---

## 기본 설정

### 1. Git 사용자 정보 설정

```bash
# 전역 설정 (모든 프로젝트에 적용)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 현재 프로젝트만 설정
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 2. 한글 인코딩 설정 (Windows)

```bash
# 커밋 메시지 인코딩
git config --global i18n.commitencoding utf-8

# 로그 출력 인코딩
git config --global i18n.logoutputencoding utf-8

# 파일명 인코딩
git config --global core.quotepath false
```

### 3. 원격 저장소 연결 확인

```bash
# 원격 저장소 목록 확인
git remote -v

# 원격 저장소 추가 (처음 한 번만)
git remote add origin https://github.com/username/repository.git

# 원격 저장소 URL 변경
git remote set-url origin https://github.com/username/repository.git
```

---

## 일반적인 작업 흐름

### 기본 워크플로우

```bash
# 1. 현재 상태 확인
git status

# 2. 변경된 파일 스테이징
git add .                    # 모든 변경사항
git add 파일명                # 특정 파일만
git add src/js/              # 특정 디렉토리만

# 3. 커밋
git commit -m "커밋 메시지"

# 4. 원격 저장소에 푸시
git push origin main
```

### 단계별 예시

#### 예시 1: 새 기능 추가 후 커밋

```bash
# 1. 작업 완료 후 상태 확인
git status

# 2. 변경사항 스테이징
git add src/js/viewer.js
git add src/js/settings.js

# 3. 커밋
git commit -m "feat: 북마크 기능 추가"

# 4. 푸시
git push origin main
```

#### 예시 2: 여러 파일 한 번에 커밋

```bash
# 모든 변경사항 스테이징
git add .

# 커밋
git commit -m "feat: 버전 관리 시스템 구축

- config.js 추가
- CHANGELOG.md 생성
- 버전 정보 자동 연동"

# 푸시
git push origin main
```

---

## 커밋 메시지 작성 규칙

### 기본 형식

```
<타입>: <제목>

<본문>

<푸터>
```

### 타입 (Type)

- **feat**: 새로운 기능 추가
- **fix**: 버그 수정
- **docs**: 문서 수정
- **style**: 코드 포맷팅, 세미콜론 누락 등
- **refactor**: 코드 리팩토링
- **test**: 테스트 코드 추가/수정
- **chore**: 빌드 업무 수정, 패키지 매니저 설정 등

### 예시

#### 간단한 커밋

```bash
git commit -m "feat: 북마크 기능 추가"
git commit -m "fix: localStorage 저장 오류 수정"
git commit -m "docs: README 업데이트"
```

#### 상세한 커밋 (여러 줄)

```bash
git commit -m "feat: 북마크 저장 구조 개선" -m "- fileKey 기반 객체 구조로 변경" -m "- 미리보기 텍스트 자동 추출" -m "- 클릭 시 파일 열기 기능 추가"
```

또는 에디터에서:

```bash
git commit
# 에디터가 열리면:
# feat: 북마크 저장 구조 개선
#
# - fileKey 기반 객체 구조로 변경
# - 미리보기 텍스트 자동 추출
# - 클릭 시 파일 열기 기능 추가
```

### 좋은 커밋 메시지 예시

✅ **좋은 예시:**
```
feat: 북마크 저장 구조를 fileKey 기반으로 변경

- 배열 구조에서 객체 구조로 변경
- fileKey를 키로 사용하여 파일별 그룹화
- 구형 데이터 자동 마이그레이션 추가
```

❌ **나쁜 예시:**
```
수정
버그 수정
업데이트
```

---

## 한글 인코딩 문제 해결

### 문제 상황

PowerShell에서 한글이 포함된 커밋 메시지를 작성할 때 인코딩 오류가 발생할 수 있습니다.

### 해결 방법

#### 방법 1: 영어로 커밋 메시지 작성 (권장)

```bash
git commit -m "feat: Add bookmark feature"
git commit -m "fix: Fix localStorage save error"
```

#### 방법 2: Git 인코딩 설정

```bash
# 전역 설정
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
git config --global core.quotepath false

# PowerShell 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
```

#### 방법 3: 커밋 메시지 파일 사용

```bash
# 메시지 파일 생성 (UTF-8 인코딩)
echo "feat: 북마크 기능 추가" > commit_msg.txt

# 파일로 커밋
git commit -F commit_msg.txt

# 파일 삭제
rm commit_msg.txt
```

#### 방법 4: Git 에디터 사용

```bash
# 기본 에디터로 커밋 메시지 작성
git commit

# VS Code를 에디터로 설정
git config --global core.editor "code --wait"
```

자세한 내용은 `docs/fix_korean_encoding.md`를 참고하세요.

---

## 자주 사용하는 명령어

### 상태 확인

```bash
# 현재 상태 확인
git status

# 변경사항 요약
git status -s

# 커밋 히스토리
git log

# 간단한 로그
git log --oneline

# 그래프 형태 로그
git log --oneline --graph --all
```

### 파일 관리

```bash
# 변경사항 스테이징
git add 파일명
git add .                    # 모든 파일
git add src/                 # 특정 디렉토리

# 스테이징 취소
git reset HEAD 파일명
git reset HEAD .             # 모든 파일

# 변경사항 취소 (주의!)
git restore 파일명           # 변경사항 폐기
git restore --staged 파일명  # 스테이징만 취소
```

### 커밋 관리

```bash
# 커밋
git commit -m "메시지"

# 마지막 커밋 메시지 수정
git commit --amend -m "새 메시지"

# 마지막 커밋에 파일 추가
git add 파일명
git commit --amend --no-edit

# 커밋 취소 (로컬에서만)
git reset --soft HEAD~1      # 커밋만 취소, 변경사항은 유지
git reset --hard HEAD~1      # 커밋과 변경사항 모두 취소 (주의!)
```

### 원격 저장소

```bash
# 원격 저장소에 푸시
git push origin main

# 강제 푸시 (주의! 협업 시 사용 금지)
git push origin main --force

# 원격 저장소에서 가져오기
git fetch origin

# 가져오기 + 병합
git pull origin main

# 원격 저장소 정보 확인
git remote -v
```

### 브랜치 관리

```bash
# 브랜치 목록
git branch                   # 로컬 브랜치
git branch -a                # 모든 브랜치

# 새 브랜치 생성
git branch 브랜치명

# 브랜치 전환
git checkout 브랜치명
git switch 브랜치명          # Git 2.23+

# 브랜치 생성 + 전환
git checkout -b 브랜치명
git switch -c 브랜치명

# 브랜치 삭제
git branch -d 브랜치명       # 안전한 삭제
git branch -D 브랜치명       # 강제 삭제
```

---

## 문제 해결

### 1. 커밋 메시지 인코딩 오류

**증상:**
```
ParserError: '-' 뒤에 식이 필요합니다.
```

**해결:**
- 영어로 커밋 메시지 작성
- 또는 Git 인코딩 설정 적용
- 또는 커밋 메시지 파일 사용

### 2. 파일이 추적되지 않음

**증상:**
```
Untracked files: ...
```

**해결:**
```bash
# 파일 추가
git add 파일명

# .gitignore 확인 (의도적으로 무시된 파일인지 확인)
cat .gitignore
```

### 3. 커밋 후 파일 수정이 필요함

**해결:**
```bash
# 파일 수정 후
git add 파일명
git commit --amend --no-edit  # 마지막 커밋에 추가
```

### 4. 잘못된 커밋 메시지 수정

**해결:**
```bash
git commit --amend -m "올바른 메시지"
```

### 5. 원격 저장소와 충돌

**해결:**
```bash
# 원격 변경사항 가져오기
git fetch origin

# 병합
git merge origin/main

# 또는 리베이스
git rebase origin/main
```

### 6. 실수로 삭제한 파일 복구

**해결:**
```bash
# 최근 커밋에서 복구
git checkout HEAD -- 파일명

# 특정 커밋에서 복구
git checkout 커밋해시 -- 파일명
```

---

## 실전 예시

### 시나리오 1: 새 기능 개발 후 커밋

```bash
# 1. 작업 시작 전 최신 상태로 업데이트
git pull origin main

# 2. 작업 수행 (파일 수정)

# 3. 변경사항 확인
git status

# 4. 변경사항 스테이징
git add src/js/viewer.js
git add src/js/settings.js

# 5. 커밋
git commit -m "feat: 북마크 기능 추가" -m "- fileKey 기반 저장" -m "- UI 렌더링 개선"

# 6. 푸시
git push origin main
```

### 시나리오 2: 버그 수정 후 커밋

```bash
# 1. 버그 수정

# 2. 변경사항 확인
git diff

# 3. 스테이징 및 커밋
git add .
git commit -m "fix: 북마크 저장 오류 수정"

# 4. 푸시
git push origin main
```

### 시나리오 3: 여러 파일을 단계적으로 커밋

```bash
# 1. 관련 파일만 스테이징
git add src/js/viewer.js
git add src/js/settings.js
git commit -m "feat: 북마크 저장 로직 개선"

# 2. 다른 파일 스테이징
git add src/js/main.js
git commit -m "feat: 북마크 UI 렌더링 개선"

# 3. 문서 업데이트
git add README.md
git commit -m "docs: README 업데이트"

# 4. 모두 푸시
git push origin main
```

---

## .gitignore 확인

프로젝트의 `.gitignore` 파일을 확인하여 의도적으로 제외된 파일을 확인하세요:

```bash
cat .gitignore
```

일반적으로 제외되는 파일:
- `logs/` - 로그 파일
- `*.log` - 로그 파일
- `node_modules/` - 의존성 패키지
- `.env` - 환경 변수 파일

---

## 유용한 팁

### 1. 변경사항 미리보기

```bash
# 스테이징 전 변경사항 확인
git diff

# 스테이징 후 변경사항 확인
git diff --staged

# 특정 파일만 확인
git diff 파일명
```

### 2. 커밋 히스토리 탐색

```bash
# 간단한 로그
git log --oneline -10        # 최근 10개

# 그래프 형태
git log --oneline --graph --all

# 특정 파일의 히스토리
git log --oneline 파일명
```

### 3. 특정 커밋으로 되돌리기

```bash
# 커밋 해시 확인
git log --oneline

# 특정 커밋으로 이동 (임시)
git checkout 커밋해시

# 다시 최신으로 돌아오기
git checkout main
```

### 4. 변경사항 임시 저장

```bash
# 작업 중인 변경사항 임시 저장
git stash

# 저장된 변경사항 목록
git stash list

# 저장된 변경사항 복구
git stash pop

# 저장된 변경사항 삭제
git stash drop
```

---

## 참고 자료

- [Git 공식 문서](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [한글 인코딩 문제 해결](./fix_korean_encoding.md)

---

**작성일**: 2025-12-24  
**최종 수정일**: 2025-12-24

