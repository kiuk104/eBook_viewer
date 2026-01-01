/**
 * Google Drive 통합 모듈
 * Google API 인증, Picker, 파일 다운로드 관련 기능
 */

import { getGoogleDriveSettings, loadLastReadFile } from './settings.js';

// Google Drive 상태
let gapiInitialized = false;
let pickerApiLoaded = false;
let tokenClient = null;
let accessToken = null;

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

/**
 * Google Drive 재초기화 (설정 변경 시)
 */
export function resetGoogleDrive() {
    gapiInitialized = false;
    pickerApiLoaded = false;
    accessToken = null;
    tokenClient = null;
}

// 전역으로 노출하여 settings.js에서 호출 가능하게
window.resetGoogleDrive = resetGoogleDrive;

/**
 * Initialize Google API Client
 */
async function initGoogleAPI() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:33',message:'initGoogleAPI called',data:{gapiInitialized,gapiExists:typeof gapi !== 'undefined',googleExists:typeof google !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (gapiInitialized) return true;
    const s = getGoogleDriveSettings();
    if (!s.clientId || !s.apiKey) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:37',message:'Missing settings in initGoogleAPI',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        throw new Error('설정에서 Google API 정보를 입력해주세요.');
    }

    return new Promise((resolve, reject) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:41',message:'Before gapi.load',data:{gapiExists:typeof gapi !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.log('🔍 initGoogleAPI: gapi 상태 확인', { gapiExists: typeof gapi !== 'undefined' });
        if (typeof gapi === 'undefined') {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:42',message:'gapi is undefined',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            console.error('❌ gapi가 정의되지 않았습니다. Google API 스크립트가 로드되지 않았습니다.');
            reject(new Error('Google API 스크립트가 로드되지 않았습니다. 페이지를 새로고침해주세요.'));
            return;
        }
        console.log('🔵 gapi.load("client") 호출 중...');
        gapi.load('client', async () => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:45',message:'gapi.load callback executed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            console.log('✅ gapi.load("client") 콜백 실행됨');
            try {
                console.log('🔵 gapi.client.init 호출 중...');
                await gapi.client.init({ 
                    apiKey: s.apiKey, 
                    discoveryDocs: DISCOVERY_DOCS 
                });
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:50',message:'gapi.client.init completed',data:{googleExists:typeof google !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                console.log('✅ gapi.client.init 완료');
                console.log('🔍 google 객체 상태:', { googleExists: typeof google !== 'undefined' });
                if (typeof google === 'undefined') {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:52',message:'google is undefined',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    console.error('❌ google 객체가 정의되지 않았습니다.');
                    reject(new Error('Google Identity Services 스크립트가 로드되지 않았습니다.'));
                    return;
                }
                console.log('🔵 google.accounts.oauth2.initTokenClient 호출 중...');
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: s.clientId,
                    scope: SCOPES,
                    callback: ''
                });
                gapiInitialized = true;
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:60',message:'initGoogleAPI success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                console.log('✅ initGoogleAPI 성공');
                resolve(true);
            } catch (err) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:64',message:'initGoogleAPI error',data:{errorMessage:err.message,errorStack:err.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                console.error('❌ initGoogleAPI 오류:', err);
                console.error('❌ 오류 상세:', { message: err.message, stack: err.stack, name: err.name });
                reject(err);
            }
        });
    });
}

/**
 * Load Picker API
 */
async function loadPickerAPI() {
    if (pickerApiLoaded) {
        console.log('✅ Picker API 이미 로드됨');
        return true;
    }
    
    console.log('🔵 loadPickerAPI: gapi.load("picker") 호출 중...');
    return new Promise((resolve, reject) => {
        gapi.load('picker', {
            callback: () => {
                pickerApiLoaded = true;
                console.log('✅ Picker API 로드 완료');
                resolve(true);
            },
            onerror: (error) => {
                console.error('❌ Picker API 로드 실패:', error);
                reject(new Error('Picker API 로드 실패: ' + error));
            }
        });
    });
}

/**
 * Sign in and get access token
 */
async function signInToGoogle() {
    if (!gapiInitialized) await initGoogleAPI();
    
    return new Promise((resolve, reject) => {
        tokenClient.callback = (resp) => {
            if (resp.error) {
                reject(resp);
                return;
            }
            accessToken = resp.access_token;
            resolve(true);
        };
        tokenClient.requestAccessToken({ prompt: '' });
    });
}

/**
 * Download Google Drive file content
 * @param {string} fileId - Google Drive 파일 ID
 * @returns {Promise<string>} 파일 내용
 */
async function downloadGoogleDriveFile(fileId) {
    if (!gapiInitialized) {
        await initGoogleAPI();
    }
    
    if (!accessToken) {
        await signInToGoogle();
    }
    
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        return response.body;
    } catch (error) {
        console.error('파일 다운로드 오류:', error);
        throw new Error('파일을 다운로드할 수 없습니다: ' + (error.message || '알 수 없는 오류'));
    }
}

/**
 * Picker callback function
 * @param {Object} data - Picker 응답 데이터
 */
async function pickerCallback(data) {
    if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        const docs = data[google.picker.Response.DOCUMENTS];
        const downloadedFiles = [];
        
        for (const doc of docs) {
            try {
                const fileId = doc[google.picker.Document.ID];
                const fileName = doc[google.picker.Document.NAME];
                const mimeType = doc[google.picker.Document.MIME_TYPE];
                
                // Skip folders (folders are navigated by double-clicking in Picker)
                if (mimeType === 'application/vnd.google-apps.folder') {
                    console.log('폴더는 선택할 수 없습니다. 폴더를 더블클릭하여 탐색하세요.');
                    continue;
                }
                
                // Download file content
                const content = await downloadGoogleDriveFile(fileId);
                
                // Add to downloaded files array
                downloadedFiles.push({
                    name: fileName,
                    size: content.length,
                    content: content,
                    lastModified: Date.now(),
                    id: fileId,      // Google Drive 파일 ID (generateFileKey에서 우선 사용)
                    fileId: fileId   // 하위 호환성을 위해 유지
                });
            } catch (error) {
                console.error('파일 다운로드 실패:', error);
                alert('파일 다운로드 실패: ' + doc[google.picker.Document.NAME]);
            }
        }
        
        // Display first file if any (viewer.js의 함수 사용)
        if (downloadedFiles.length > 0) {
            // viewer.js의 함수들을 동적으로 import하여 사용
            const { addFile, setFiles, setCurrentFileIndex, displayFileContent, toggleUploadSection } = await import('./viewer.js');
            
            // 파일 배열 업데이트
            setFiles(downloadedFiles);
            setCurrentFileIndex(0);
            
            document.getElementById('mainContent').classList.remove('hidden');
            displayFileContent(downloadedFiles[0]);
            
            // Auto collapse upload section
            const uploadContent = document.getElementById('uploadSectionContent');
            if (uploadContent && !uploadContent.classList.contains('hidden')) {
                toggleUploadSection();
            }
        }
    } else if (data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
        console.log('Picker 취소됨');
    }
}

/**
 * Create and show Google Picker
 */
async function createPicker() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:190',message:'createPicker called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    console.log('🔵 createPicker 호출됨');
    
    const s = getGoogleDriveSettings();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:193',message:'Google Drive settings retrieved',data:{hasClientId:!!s.clientId,hasApiKey:!!s.apiKey,clientIdLength:s.clientId?.length || 0,apiKeyLength:s.apiKey?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    console.log('🔍 Google Drive 설정:', { 
        hasClientId: !!s.clientId, 
        hasApiKey: !!s.apiKey,
        clientIdPreview: s.clientId ? s.clientId.substring(0, 20) + '...' : '없음',
        apiKeyPreview: s.apiKey ? s.apiKey.substring(0, 20) + '...' : '없음'
    });
    
    if (!s.clientId || !s.apiKey) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:196',message:'Missing Google Drive settings',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.error('❌ Google Drive 설정이 없습니다.');
        alert('설정에서 Google Client ID와 API 키를 입력해주세요.');
        return;
    }

    try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:201',message:'Before initGoogleAPI',data:{gapiInitialized,gapiExists:typeof gapi !== 'undefined',googleExists:typeof google !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // Initialize APIs
        await initGoogleAPI();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:204',message:'initGoogleAPI completed',data:{gapiInitialized},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        await loadPickerAPI();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:206',message:'loadPickerAPI completed',data:{pickerApiLoaded},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // Get access token if not available
        if (!accessToken) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:209',message:'Before signInToGoogle',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            console.log('🔵 signInToGoogle 호출 중...');
            await signInToGoogle();
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:212',message:'signInToGoogle completed',data:{hasAccessToken:!!accessToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            console.log('✅ signInToGoogle 완료', { hasAccessToken: !!accessToken });
        } else {
            console.log('✅ Access token 이미 있음');
        }

        // DocsView(파일 목록) 설정
        const view = new google.picker.DocsView(google.picker.ViewId.DOCS);

        // [핵심 1] 이동 활성화: 텍스트 파일과 '폴더'를 모두 허용
        // 이렇게 해야 폴더가 활성화되어 더블클릭 이동이 가능함
        // 폴더(application/vnd.google-apps.folder)를 명시적으로 추가하고 오타 수정
        view.setMimeTypes('text/plain,text/markdown,text/x-markdown,application/octet-stream,application/vnd.google-apps.folder');
        view.setIncludeFolders(true);

        // [핵심 2] 기본 시작 위치 지정
        // 'root'는 내 드라이브 최상위입니다. 특정 폴더 ID를 넣을 수도 있습니다.
        view.setParent('root');

        // Picker 생성
        const picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.NAV_HIDDEN) // 상단 네비게이션 숨김 (선택사항)
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED) // 여러 파일 선택 허용
            .setAppId(s.clientId)
            .setOAuthToken(accessToken)
            .setDeveloperKey(s.apiKey)
            .addView(view) // 메인 파일 목록 뷰
            .addView(new google.picker.DocsView(google.picker.ViewId.FOLDERS)) // [핵심 3] 왼쪽에 폴더 트리 메뉴 추가
            .setCallback(pickerCallback)
            .setTitle('텍스트 파일 선택')
            .build();

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:235',message:'Before picker.setVisible',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        console.log('🔵 picker.setVisible(true) 호출 중...');
        picker.setVisible(true);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:237',message:'picker.setVisible called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        console.log('✅ Picker 표시 완료');
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:239',message:'createPicker error caught',data:{errorMessage:error.message,errorStack:error.stack,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error('❌ Picker 생성 실패:', error);
        console.error('❌ 오류 상세:', { message: error.message, stack: error.stack, name: error.name });
        alert('Google Drive 파일 선택 오류: ' + (error.message || '설정을 확인해주세요.'));
    }
}

/**
 * Wait for Google API scripts to load
 * @param {number} maxWaitMs - Maximum time to wait in milliseconds (default: 5000)
 * @returns {Promise<boolean>} - True if scripts are loaded, false if timeout
 */
async function waitForGoogleAPIScripts(maxWaitMs = 5000) {
    const startTime = Date.now();
    const checkInterval = 100; // Check every 100ms
    
    return new Promise((resolve) => {
        const checkScripts = () => {
            const hasGapi = typeof gapi !== 'undefined';
            const hasGoogle = typeof google !== 'undefined';
            const elapsed = Date.now() - startTime;
            
            if (hasGapi && hasGoogle) {
                console.log(`✅ Google API 스크립트 로드 완료 (${elapsed}ms)`);
                resolve(true);
                return;
            }
            
            if (elapsed >= maxWaitMs) {
                console.warn(`⚠️ Google API 스크립트 로드 대기 시간 초과 (${elapsed}ms)`, { hasGapi, hasGoogle });
                resolve(false);
                return;
            }
            
            setTimeout(checkScripts, checkInterval);
        };
        
        checkScripts();
    });
}

/**
 * Load Google Drive files using Picker
 */
export async function loadGoogleDriveFiles(event) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:243',message:'loadGoogleDriveFiles called',data:{hasEvent:!!event,windowLoadGoogleDriveFiles:typeof window.loadGoogleDriveFiles},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.log('🔵 loadGoogleDriveFiles 호출됨', { event, windowLoadGoogleDriveFiles: typeof window.loadGoogleDriveFiles });
    
    // Google API 스크립트 로드 확인 및 대기
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:247',message:'Checking gapi and google objects',data:{hasGapi:typeof gapi !== 'undefined',hasGoogle:typeof google !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.log('🔍 Google API 상태 (초기 체크):', { 
        hasGapi: typeof gapi !== 'undefined', 
        hasGoogle: typeof google !== 'undefined',
        gapiType: typeof gapi,
        googleType: typeof google
    });
    
    // Google API 스크립트가 로드되지 않은 경우 대기
    if (typeof gapi === 'undefined' || typeof google === 'undefined') {
        console.log('⏳ Google API 스크립트 로드 대기 중...');
        const scriptsLoaded = await waitForGoogleAPIScripts(5000);
        
        if (!scriptsLoaded) {
            const errorMsg = 'Google API 스크립트가 로드되지 않았습니다. 네트워크 연결을 확인하고 페이지를 새로고침해주세요.';
            console.error('❌', errorMsg);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:254',message:'gapi/google undefined after wait',data:{hasGapi:typeof gapi !== 'undefined',hasGoogle:typeof google !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            alert(errorMsg);
            return;
        }
    }
    
    console.log('🔍 Google API 상태 (최종 체크):', { 
        hasGapi: typeof gapi !== 'undefined', 
        hasGoogle: typeof google !== 'undefined',
        gapiType: typeof gapi,
        googleType: typeof google
    });
    
    try {
        await createPicker();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:251',message:'createPicker completed successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.log('✅ createPicker 완료');
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google_drive.js:254',message:'createPicker failed',data:{errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('❌ Google Drive 파일 로드 실패:', error);
        console.error('❌ 오류 상세:', { message: error.message, stack: error.stack, name: error.name });
        alert('Google Drive 오류: ' + (error.message || '설정을 확인하세요.'));
    }
}

/**
 * 마지막 읽은 Google Drive 파일 자동 로드
 * @param {string} fileId - Google Drive 파일 ID
 */
export async function loadLastReadGoogleDriveFile(fileId) {
    try {
        // API 초기화 확인
        await initGoogleAPI();
        
        // 로그인 확인 및 토큰 획득
        if (!accessToken) {
            await signInToGoogle();
        }
        
        // 파일 다운로드
        const content = await downloadGoogleDriveFile(fileId);
        
        // 파일 정보 가져오기
        const fileInfo = await gapi.client.drive.files.get({
            fileId: fileId,
            fields: 'name, modifiedTime'
        });
        
        const fileName = fileInfo.result.name;
        const lastModified = new Date(fileInfo.result.modifiedTime).getTime();
        
        // viewer.js의 함수들을 동적으로 import
        const { setFiles, setCurrentFileIndex, displayFileContent, toggleUploadSection } = await import('./viewer.js');
        
        // 파일 객체 생성
        const fileObj = {
            name: fileName,
            size: content.length,
            content: content,
            lastModified: lastModified,
            id: fileId,      // Google Drive 파일 ID (generateFileKey에서 우선 사용)
            fileId: fileId   // 하위 호환성을 위해 유지
        };
        
        // 파일 배열 설정 및 표시
        setFiles([fileObj]);
        setCurrentFileIndex(0);
        
        document.getElementById('mainContent').classList.remove('hidden');
        displayFileContent(fileObj);
        
        // Auto collapse upload section
        const uploadContent = document.getElementById('uploadSectionContent');
        if (uploadContent && !uploadContent.classList.contains('hidden')) {
            toggleUploadSection();
        }
        
        console.log('마지막 읽은 Google Drive 파일 복원 완료:', fileName);
    } catch (error) {
        console.error('마지막 읽은 Google Drive 파일 복원 실패:', error);
        // 실패해도 앱은 정상 작동하도록 함
    }
}

// 전역으로 노출하여 main.js에서 호출 가능하게
window.restoreGoogleDriveFile = loadLastReadGoogleDriveFile;
window.loadLastReadGoogleDriveFile = loadLastReadGoogleDriveFile; // 북마크 클릭에서 사용

