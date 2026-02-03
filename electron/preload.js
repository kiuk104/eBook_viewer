const { contextBridge, ipcRenderer } = require('electron');

// 안전한 API를 렌더러 프로세스에 노출
contextBridge.exposeInMainWorld('electronAPI', {
  // 파일 저장
  saveFile: (fileName, content) => ipcRenderer.invoke('save-file', { fileName, content }),
  
  // 앱 버전 가져오기
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 파일 열기 이벤트 리스너
  onFileOpened: (callback) => {
    ipcRenderer.on('file-opened', (event, fileData) => callback(fileData));
  }
});

// Electron 환경임을 알리는 플래그
contextBridge.exposeInMainWorld('isElectron', true);
