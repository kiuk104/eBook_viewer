# Cursor 완전 동기화 가이드

Cursor IDE의 **설정, 대화 기록, 확장 프로그램**을 노트북과 데스크톱 간에 동기화하는 방법입니다.

## 📋 개요

Cursor는 기본적으로 Settings Sync 기능이 없을 수 있습니다. 이 스크립트를 사용하여 수동으로 대화 기록을 클라우드 저장소(Google Drive, OneDrive, Dropbox 등)와 동기화할 수 있습니다.

## 🚀 사용 방법

### 1. 첫 실행 (설정)

```powershell
.\scripts\sync_cursor_chat.ps1
```

첫 실행 시 클라우드 폴더 경로를 입력합니다:

**예시 경로:**
- Google Drive: `C:\Users\사용자명\Google Drive\Cursor_Sync`
- OneDrive: `C:\Users\사용자명\OneDrive\Cursor_Sync`
- Dropbox: `C:\Users\사용자명\Dropbox\Cursor_Sync`

### 2. 백업 (현재 PC → 클라우드)

1. 스크립트 실행: `.\scripts\sync_cursor_chat.ps1`
2. 메뉴에서 `1` 선택 (Backup)
3. 대화 기록이 클라우드 폴더로 복사됩니다

### 3. 복원 (클라우드 → 새 PC/노트북)

1. 스크립트 실행: `.\scripts\sync_cursor_chat.ps1`
2. 메뉴에서 `2` 선택 (Restore)
3. 확인 메시지에 `Y` 입력
4. **Cursor를 재시작**하면 대화 기록이 복원됩니다

## 📁 파일 위치

- **로컬 대화 기록**: `%APPDATA%\Cursor\User\globalStorage\state.vscdb`
- **클라우드 백업**: 설정한 클라우드 폴더의 `cursor_chat_history.vscdb`
- **설정 파일**: `scripts\cursor_sync_config.txt`

## ⚠️ 주의사항

1. **Cursor 종료 후 실행**: 스크립트 실행 전에 Cursor를 완전히 종료하세요.
2. **파일 크기**: 대화 기록 파일은 수백 MB ~ 수 GB까지 커질 수 있습니다.
3. **클라우드 동기화**: 클라우드 폴더가 자동으로 동기화되도록 설정되어 있어야 합니다.
4. **백업**: 복원 전에 자동으로 백업이 생성되지만, 중요한 대화는 별도로 백업하는 것을 권장합니다.

## 🔄 자동 동기화 설정 (선택사항)

### 작업 스케줄러 사용

Windows 작업 스케줄러를 사용하여 주기적으로 백업할 수 있습니다:

1. 작업 스케줄러 열기
2. "기본 작업 만들기" 선택
3. 트리거: 매일 또는 주간
4. 작업: PowerShell 스크립트 실행
   - 프로그램: `powershell.exe`
   - 인수: `-File "E:\Coding\eBook_viewer\scripts\sync_cursor_chat.ps1"`

### 수동 실행

필요할 때마다 수동으로 실행:
```powershell
cd E:\Coding\eBook_viewer
.\scripts\sync_cursor_chat.ps1
```

## 🛠️ 문제 해결

### 오류: "Cursor chat history file not found"

- Cursor를 최소 한 번 실행하고 채팅 기능을 사용해보세요.
- Cursor가 기본 경로에 설치되어 있는지 확인하세요.

### 오류: "No backup found in cloud folder"

- 먼저 백업(옵션 1)을 실행하세요.
- 클라우드 폴더 경로가 올바른지 확인하세요 (옵션 4로 변경 가능).

### 파일이 너무 큼

- 대화 기록이 매우 클 수 있습니다. 클라우드 동기화에 시간이 걸릴 수 있습니다.
- 클라우드 저장소 용량을 확인하세요.

## 📝 메뉴 옵션

1. **Backup**: 로컬 → 클라우드로 백업
2. **Restore**: 클라우드 → 로컬로 복원
3. **Show file info**: 로컬 및 클라우드 파일 정보 확인
4. **Change cloud folder**: 클라우드 폴더 경로 변경
5. **Exit**: 종료

## 💡 팁

- **정기적 백업**: 작업 전후로 백업하는 습관을 권장합니다.
- **클라우드 자동 동기화**: Google Drive, OneDrive 등이 자동으로 동기화되도록 설정되어 있으면, 백업 후 자동으로 클라우드에 업로드됩니다.
- **여러 기기 사용**: 각 기기에서 복원하기 전에 최신 백업이 있는지 확인하세요.

