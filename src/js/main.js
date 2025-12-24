/**
 * 메인 모듈
 * 앱 초기화 및 이벤트 리스너 등록
 */

import { loadSettings, applySettings, loadHistory, loadBookmarks, loadGoogleDriveSettings, setTheme, setFontSize, saveGoogleDriveSettings } from './settings.js';
import { displayUploadHistory, displayUploadBookmarks, processFiles } from './viewer.js';
import { loadGoogleDriveFiles } from './google_drive.js';

// 앱 버전
const APP_VERSION = '1.0.0-fix';

/**
 * 앱 초기화
 */
function initApp() {
    console.log('[DOMContentLoaded] Start');
    
    // 버전 정보 표시
    const versionElement = document.getElementById('versionNumber');
    if (versionElement) {
        versionElement.textContent = APP_VERSION;
    }
    
    // 설정 로드
    loadSettings();
    loadHistory();
    loadBookmarks();
    loadGoogleDriveSettings();

    // 설정 적용
    applySettings();
    displayUploadHistory();
    displayUploadBookmarks();

    // 파일 입력 이벤트 리스너
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            await processFiles(Array.from(e.target.files));
        });
    }

    // 드래그 앤 드롭 이벤트 리스너
    const uploadBox = document.getElementById('uploadBox');
    if (uploadBox) {
        uploadBox.addEventListener('dragover', (e) => { 
            e.preventDefault(); 
            uploadBox.classList.add('bg-gray-100'); 
        });
        uploadBox.addEventListener('dragleave', (e) => { 
            e.preventDefault(); 
            uploadBox.classList.remove('bg-gray-100'); 
        });
        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.classList.remove('bg-gray-100');
            const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.txt'));
            if (droppedFiles.length) processFiles(droppedFiles);
        });
    }

    // 검색 입력 이벤트 리스너 (있는 경우)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // TODO: 검색 기능 구현
        searchInput.addEventListener('input', () => {
            // displayFiles 함수가 필요하면 viewer.js에 추가
        });
    }

    console.log('[DOMContentLoaded] Complete');
}

// 전역 함수 노출 (HTML의 onclick에서 사용)
window.setTheme = setTheme;
window.setFontSize = setFontSize;
window.saveGoogleDriveSettings = saveGoogleDriveSettings;
window.loadGoogleDriveFiles = loadGoogleDriveFiles;

// DOM 로드 완료 시 초기화
window.addEventListener('DOMContentLoaded', initApp);

