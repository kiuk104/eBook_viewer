# 🔧 Electron 통합 가이드

이 문서는 웹 앱을 Electron 환경에서 작동하도록 수정하는 방법을 설명합니다.

## 📝 수정이 필요한 파일들

### 1. `src/js/main.js` 또는 `src/js/viewer.js`

파일 저장 기능을 Electron API를 사용하도록 수정:

```javascript
// 파일 저장 함수 추가 (기존 코드에 추가)
export async function saveFileElectron(fileName, content) {
    // Electron 환경 체크
    if (window.isElectron && window.electronAPI) {
        try {
            const result = await window.electronAPI.saveFile(fileName, content);
            if (result.success) {
                alert(`파일이 저장되었습니다: ${result.path}`);
                return true;
            } else if (result.canceled) {
                console.log('저장 취소됨');
                return false;
            } else {
                alert(`저장 실패: ${result.error}`);
                return false;
            }
        } catch (err) {
            console.error('Electron 파일 저장 오류:', err);
            alert(`오류: ${err.message}`);
            return false;
        }
    } else {
        // 웹 브라우저 환경: 기존 다운로드 방식 사용
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    }
}
```

### 2. `ebook_viewer.html`

Electron에서 파일을 열었을 때 자동으로 로드하는 스크립트 추가:

```html
<!-- ebook_viewer.html의 </body> 태그 직전에 추가 -->
<script type="module">
    // Electron 환경에서 파일 열기 이벤트 처리
    if (window.isElectron && window.electronAPI) {
        window.electronAPI.onFileOpened((fileData) => {
            console.log('Electron에서 파일 열림:', fileData.name);
            
            // 파일 객체 생성
            const file = new File([fileData.content], fileData.name, {
                type: 'text/plain'
            });
            file.content = fileData.content;
            
            // 기존 파일 표시 함수 호출
            import('./src/js/viewer.js').then(viewer => {
                viewer.displayFileContent(file);
            });
        });
    }
</script>
```

### 3. 다운로드 버튼 수정

AI 변환 후 저장 버튼이나 다른 다운로드 버튼에서 Electron API 사용:

```javascript
// 기존 다운로드 함수 수정
async function downloadFile(fileName, content) {
    // Electron 환경 체크
    if (window.isElectron && window.electronAPI) {
        // Electron 파일 저장 다이얼로그 사용
        return await window.electronAPI.saveFile(fileName, content);
    } else {
        // 웹 환경: 기존 방식
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true };
    }
}
```

## 🔄 자동 전환 패턴

웹과 Electron 환경을 자동으로 감지하는 패턴:

```javascript
// 환경 감지
function isElectronEnvironment() {
    return window.isElectron === true;
}

// 파일 저장 (환경에 맞게 자동 선택)
async function saveFile(fileName, content) {
    if (isElectronEnvironment()) {
        return await electronSaveFile(fileName, content);
    } else {
        return await webDownloadFile(fileName, content);
    }
}

// Electron 저장
async function electronSaveFile(fileName, content) {
    const result = await window.electronAPI.saveFile(fileName, content);
    return result;
}

// 웹 다운로드
function webDownloadFile(fileName, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true };
}
```

## 🎯 추천 수정 순서

1. **테스트 환경 설정**
   ```bash
   npm install
   npm run dev
   ```

2. **viewer.js 수정**
   - `saveFileElectron()` 함수 추가
   - 기존 다운로드 함수들을 환경 감지 로직으로 감싸기

3. **ebook_viewer.html 수정**
   - Electron 파일 열기 이벤트 리스너 추가

4. **테스트**
   - 파일 열기 (Ctrl+O)
   - 파일 저장 (AI 변환 후)
   - 북마크, 히스토리 등 기존 기능

5. **빌드 및 배포**
   ```bash
   npm run build:win
   ```

## 💡 주의사항

### localStorage 사용
- Electron에서도 localStorage는 정상 작동합니다
- 각 앱 인스턴스마다 독립적인 저장소
- 설정, 북마크, 히스토리 모두 유지됨

### Google Drive API
- 웹과 동일하게 작동
- OAuth 인증도 동일
- 추가 설정 불필요

### 파일 경로
- Electron에서는 절대 경로 사용 가능
- `file://` 프로토콜 사용 가능
- 상대 경로는 웹과 동일하게 작동

## 🧪 테스트 체크리스트

개발 모드에서 다음 항목들을 테스트:

- [ ] 앱 시작 (npm run dev)
- [ ] 홈 페이지 → 뷰어 페이지 이동
- [ ] 메뉴에서 파일 열기 (Ctrl+O)
- [ ] 파일 내용 표시
- [ ] 테마 변경
- [ ] 폰트 크기 조절
- [ ] 북마크 추가/삭제
- [ ] 히스토리 저장/불러오기
- [ ] AI 변환 (API 키 필요)
- [ ] 파일 저장/다운로드
- [ ] Google Drive 연동 (선택사항)
- [ ] 앱 재시작 후 설정 유지

## 🔧 선택적 개선사항

### 1. 드래그 앤 드롭 지원

`ebook_viewer.html`에 추가:

```html
<script>
    // 드래그 앤 드롭 방지 (보안)
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (window.isElectron) {
            // Electron에서는 IPC로 처리
            alert('메뉴에서 파일 → 파일 열기를 사용해주세요 (Ctrl+O)');
        }
    });
</script>
```

### 2. 최근 파일 목록

`electron/main.js`에 추가:

```javascript
// 최근 파일 목록 관리
const recentFiles = [];

function addRecentFile(filePath) {
    const index = recentFiles.indexOf(filePath);
    if (index > -1) {
        recentFiles.splice(index, 1);
    }
    recentFiles.unshift(filePath);
    if (recentFiles.length > 10) {
        recentFiles.pop();
    }
    // 메뉴 업데이트
    updateRecentFilesMenu();
}
```

### 3. 자동 저장

`src/js/settings.js`에 추가:

```javascript
// 자동 저장 간격 (5분)
if (window.isElectron) {
    setInterval(() => {
        // 현재 상태 저장
        localStorage.setItem('autoSaveTimestamp', Date.now());
    }, 5 * 60 * 1000);
}
```

## 📚 참고 자료

- [Electron 공식 문서](https://www.electronjs.org/docs)
- [Electron IPC 통신](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [contextBridge API](https://www.electronjs.org/docs/latest/api/context-bridge)

## 🆘 문제 해결

### Electron API가 undefined
- `preload.js`가 올바르게 로드되었는지 확인
- `webPreferences.preload` 경로 확인

### 파일 열기가 작동하지 않음
- IPC 통신 확인
- 개발자 도구 콘솔에서 오류 확인
- `onFileOpened` 리스너가 등록되었는지 확인

### localStorage가 비어있음
- Electron의 userData 경로 확인
- 각 앱마다 독립적인 저장소 사용

---

**다음 단계**: 수정 완료 후 `npm run build:win`으로 빌드하여 테스트!
