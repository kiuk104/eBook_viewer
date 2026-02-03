const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 개발 모드 확인
const isDev = process.argv.includes('--dev');

// 메인 윈도우 변수
let mainWindow;

// 앱이 준비되었을 때
app.whenReady().then(() => {
  createMainWindow();
  createApplicationMenu();

  app.on('activate', () => {
    // macOS에서 독 아이콘 클릭 시 창 재생성
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// 모든 창이 닫혔을 때
app.on('window-all-closed', () => {
  // macOS가 아니면 앱 종료
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 메인 윈도우 생성
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#ffffff',
    show: false
  });

  // 창이 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // index.html 로드 (랜딩 페이지)
  mainWindow.loadFile('index.html');

  // 개발 모드에서는 개발자 도구 열기
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // 외부 링크는 기본 브라우저에서 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// 애플리케이션 메뉴 생성
function createApplicationMenu() {
  const template = [
    {
      label: '파일',
      submenu: [
        {
          label: '파일 열기',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            openFileDialog();
          }
        },
        { type: 'separator' },
        {
          label: '뷰어로 이동',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.loadFile('ebook_viewer.html');
          }
        },
        {
          label: '홈으로 이동',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow.loadFile('index.html');
          }
        },
        { type: 'separator' },
        {
          label: '종료',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '편집',
      submenu: [
        { role: 'undo', label: '실행 취소' },
        { role: 'redo', label: '다시 실행' },
        { type: 'separator' },
        { role: 'cut', label: '잘라내기' },
        { role: 'copy', label: '복사' },
        { role: 'paste', label: '붙여넣기' },
        { role: 'selectAll', label: '전체 선택' }
      ]
    },
    {
      label: '보기',
      submenu: [
        { role: 'reload', label: '새로고침' },
        { role: 'forceReload', label: '강제 새로고침' },
        { type: 'separator' },
        { role: 'resetZoom', label: '확대/축소 초기화' },
        { role: 'zoomIn', label: '확대' },
        { role: 'zoomOut', label: '축소' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '전체화면' }
      ]
    },
    {
      label: '개발자',
      submenu: [
        { role: 'toggleDevTools', label: '개발자 도구' }
      ]
    },
    {
      label: '도움말',
      submenu: [
        {
          label: 'GitHub 저장소',
          click: async () => {
            await shell.openExternal('https://github.com/YOUR_USERNAME/YOUR_REPO');
          }
        },
        {
          label: '정보',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'eBook Viewer 정보',
              message: 'eBook Viewer',
              detail: `버전: ${app.getVersion()}\n\n간편한 텍스트 파일 뷰어\nGoogle Drive 연동 지원`,
              buttons: ['확인']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 파일 열기 대화상자
function openFileDialog() {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '텍스트 파일', extensions: ['txt', 'md'] },
      { name: '모든 파일', extensions: ['*'] }
    ]
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      readAndSendFile(filePath);
    }
  }).catch(err => {
    console.error('파일 열기 오류:', err);
  });
}

// 파일 읽기 및 렌더러로 전송
function readAndSendFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const stats = fs.statSync(filePath);

    // 뷰어 페이지로 이동
    mainWindow.loadFile('ebook_viewer.html').then(() => {
      // 파일 정보 전송
      mainWindow.webContents.send('file-opened', {
        name: fileName,
        content: content,
        size: stats.size,
        path: filePath
      });
    });
  } catch (err) {
    dialog.showErrorBox('파일 읽기 오류', `파일을 읽을 수 없습니다:\n${err.message}`);
  }
}

// 아이콘 경로 가져오기
function getIconPath() {
  if (process.platform === 'win32') {
    return path.join(__dirname, '../build/icon.ico');
  } else if (process.platform === 'darwin') {
    return path.join(__dirname, '../build/icon.icns');
  } else {
    return path.join(__dirname, '../build/icon.png');
  }
}

// IPC 핸들러: 파일 저장
ipcMain.handle('save-file', async (event, { fileName, content }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: fileName,
      filters: [
        { name: '텍스트 파일', extensions: ['txt', 'md'] },
        { name: '모든 파일', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content, 'utf-8');
      return { success: true, path: result.filePath };
    }
    return { success: false, canceled: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC 핸들러: 앱 버전 가져오기
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});
