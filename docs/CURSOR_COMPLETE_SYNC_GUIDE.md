# Cursor 완전 동기화 가이드

Cursor IDE의 **설정, 대화 기록, 확장 프로그램, 스니펫**을 노트북과 데스크톱 간에 동기화하는 방법입니다.

## 📋 개요

Cursor는 기본적으로 Settings Sync 기능이 없을 수 있습니다. 이 스크립트를 사용하여 수동으로 모든 Cursor 데이터를 클라우드 저장소(Google Drive, OneDrive, Dropbox 등)와 동기화할 수 있습니다.

## 🚀 사용 방법

### 1. 첫 실행 (설정)

```powershell
.\scripts\sync_cursor_all.ps1
```

첫 실행 시 클라우드 폴더 경로를 입력합니다:

**예시 경로:**
- Google Drive: `C:\Users\사용자명\Google Drive\Cursor_Sync`
- OneDrive: `C:\Users\사용자명\OneDrive\Cursor_Sync`
- Dropbox: `C:\Users\사용자명\Dropbox\Cursor_Sync`

### 2. 전체 백업 (현재 PC → 클라우드)

1. 스크립트 실행: `.\scripts\sync_cursor_all.ps1`
2. 메뉴에서 `1` 선택 (Backup All)
3. 다음 항목들이 클라우드로 백업됩니다:
   - ✅ **Settings** - Cursor 설정
   - ✅ **Keybindings** - 키보드 단축키
   - ✅ **Snippets** - 코드 스니펫
   - ✅ **Chat History** - 대화 기록
   - ✅ **Extensions** - 설치된 확장 프로그램 목록

### 3. 전체 복원 (클라우드 → 새 PC/노트북)

1. **Cursor 완전히 종료** (중요!)
2. 스크립트 실행: `.\scripts\sync_cursor_all.ps1`
3. 메뉴에서 `2` 선택 (Restore All)
4. 확인 메시지에 `Y` 입력
5. "Press Enter when ready..." 메시지 후 Enter
6. **Cursor를 재시작**하면 모든 설정이 복원됩니다

### 4. 선택적 백업/복원

특정 항목만 백업하거나 복원할 수 있습니다:

- 옵션 `3`: 선택한 항목만 백업
- 옵션 `4`: 선택한 항목만 복원

예: 대화 기록만 복원하려면 `4` 선택 후 `4` (Chat History) 입력

## 📁 동기화되는 파일 위치

### 로컬 파일 위치:
- **Settings**: `%APPDATA%\Cursor\User\settings.json`
- **Keybindings**: `%APPDATA%\Cursor\User\keybindings.json`
- **Snippets**: `%APPDATA%\Cursor\User\snippets\`
- **Chat History**: `%APPDATA%\Cursor\User\globalStorage\state.vscdb`
- **Extensions**: `%APPDATA%\Cursor\User\extensions\` (목록만 저장)

### 클라우드 백업 위치:
- 설정한 클라우드 폴더 내:
  - `settings.json`
  - `keybindings.json`
  - `snippets\` (폴더)
  - `chat_history.vscdb`
  - `extensions_list.txt`

## ⚠️ 중요 주의사항

### 1. Cursor 종료 필수
- 백업/복원 전에 **반드시 Cursor를 완전히 종료**하세요.
- 작업 관리자에서 `Cursor.exe` 프로세스가 없는지 확인하세요.

### 2. 확장 프로그램 동기화
- 확장 프로그램 파일 자체는 동기화하지 않습니다 (용량이 너무 큼).
- 대신 **확장 프로그램 목록**을 저장하고, 복원 시 자동으로 설치합니다.
- 복원 후 모든 확장 프로그램이 자동 설치되므로 시간이 걸릴 수 있습니다.

### 3. 파일 크기
- 대화 기록 파일은 수백 MB ~ 수 GB까지 커질 수 있습니다.
- 클라우드 동기화에 시간이 걸릴 수 있습니다.

### 4. 클라우드 동기화
- 클라우드 폴더가 자동으로 동기화되도록 설정되어 있어야 합니다.
- Google Drive, OneDrive 등이 백그라운드에서 동기화되도록 설정하세요.

## 🔄 사용 시나리오

### 시나리오 1: 데스크톱 → 노트북 (처음 설정)

1. **데스크톱에서:**
   ```powershell
   .\scripts\sync_cursor_all.ps1
   # 옵션 1 선택 (Backup All)
   ```

2. **클라우드 동기화 대기** (Google Drive/OneDrive가 자동으로 업로드)

3. **노트북에서:**
   ```powershell
   .\scripts\sync_cursor_all.ps1
   # 옵션 2 선택 (Restore All)
   ```

4. **Cursor 재시작**

### 시나리오 2: 정기적 동기화

양쪽 기기에서 주기적으로 백업하여 최신 상태 유지:

```powershell
# 데스크톱에서
.\scripts\sync_cursor_all.ps1  # 옵션 1

# 노트북에서
.\scripts\sync_cursor_all.ps1  # 옵션 1
```

### 시나리오 3: 특정 항목만 동기화

예: 대화 기록만 동기화

```powershell
.\scripts\sync_cursor_all.ps1
# 옵션 3 선택 (Backup Selected)
# 4 입력 (Chat History)
```

## 🛠️ 메뉴 옵션 상세

1. **Backup All**: 모든 항목을 클라우드로 백업
2. **Restore All**: 모든 항목을 클라우드에서 복원
3. **Backup Selected Items**: 선택한 항목만 백업
4. **Restore Selected Items**: 선택한 항목만 복원
5. **Show sync status**: 로컬/클라우드 파일 상태 확인
6. **Change cloud folder**: 클라우드 폴더 경로 변경
7. **Exit**: 종료

## 🔍 동기화 상태 확인

옵션 `5` (Show sync status)를 사용하여:
- 로컬 파일 존재 여부 및 크기
- 클라우드 백업 존재 여부 및 크기
- 마지막 수정 시간 비교

## 💡 팁

### 1. 정기적 백업
- 작업 전후로 백업하는 습관을 권장합니다.
- 주간 또는 월간 정기 백업을 설정하세요.

### 2. 클라우드 자동 동기화
- Google Drive, OneDrive 등이 자동으로 동기화되도록 설정
- 백업 후 자동으로 클라우드에 업로드됩니다.

### 3. 여러 기기 사용
- 각 기기에서 복원하기 전에 최신 백업이 있는지 확인
- 옵션 5로 동기화 상태를 먼저 확인하세요.

### 4. 확장 프로그램
- 확장 프로그램은 목록만 저장되므로, 복원 시 재설치됩니다.
- 인터넷 연결이 필요합니다.

### 5. 대화 기록 크기 관리
- 대화 기록이 너무 크면 클라우드 동기화에 시간이 걸립니다.
- 필요시 Cursor에서 오래된 대화를 삭제할 수 있습니다.

## 🐛 문제 해결

### 오류: "Cursor chat history file not found"
- Cursor를 최소 한 번 실행하고 채팅 기능을 사용해보세요.
- Cursor가 기본 경로에 설치되어 있는지 확인하세요.

### 오류: "No backup found in cloud folder"
- 먼저 백업(옵션 1)을 실행하세요.
- 클라우드 폴더 경로가 올바른지 확인하세요 (옵션 6으로 변경 가능).

### 확장 프로그램이 설치되지 않음
- 인터넷 연결을 확인하세요.
- Cursor가 최신 버전인지 확인하세요.
- 수동으로 확장 프로그램을 설치할 수 있습니다.

### 파일이 너무 큼
- 대화 기록이 매우 클 수 있습니다. 클라우드 동기화에 시간이 걸릴 수 있습니다.
- 클라우드 저장소 용량을 확인하세요.

### 복원 후 설정이 적용되지 않음
- Cursor를 완전히 재시작하세요.
- 설정 파일이 올바르게 복사되었는지 확인하세요 (옵션 5).

## 📝 참고

- 이 스크립트는 Cursor의 로컬 데이터를 클라우드와 동기화합니다.
- Cursor 계정 자체의 동기화 기능이 있다면, 그것을 우선 사용하는 것을 권장합니다.
- 중요한 데이터는 별도로 백업하는 것을 권장합니다.

