/**
 * 메인 모듈
 * 앱 초기화 및 이벤트 리스너 등록
 */

import { APP_NAME, APP_VERSION } from './config.js';
import { loadSettings, applySettings, loadHistory, loadBookmarks, loadGoogleDriveSettings, setTheme, setFontSize, saveGoogleDriveSettings, loadLastReadFile } from './settings.js';
import { displayUploadHistory, displayUploadBookmarks, processFiles, showLocalFileResumeMessage } from './viewer.js';
import { loadGoogleDriveFiles, loadLastReadGoogleDriveFile } from './google_drive.js';

/**
 * 구형 localStorage 데이터 마이그레이션 및 청소
 * readingPosition_로 시작하는 구형 키들과 fileName 기반 북마크 삭제
 */
function migrateOldStorageData() {
    console.log('🧹 구형 localStorage 데이터 마이그레이션 시작');
    let cleanedCount = 0;
    
    try {
        // localStorage의 모든 키 확인
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // readingPosition_로 시작하는 구형 키 찾기
            if (key && key.startsWith('readingPosition_')) {
                keysToRemove.push(key);
            }
            // fileName 기반으로 저장된 구형 북마크 키 찾기 (예: bookmark_fileName.txt)
            if (key && (key.startsWith('bookmark_') || key.startsWith('readerPageBookmarks_'))) {
                keysToRemove.push(key);
            }
        }
        
        // 구형 키 삭제
        keysToRemove.forEach(key => {
            console.log(`🗑️ 구형 데이터 삭제: ${key}`);
            localStorage.removeItem(key);
            cleanedCount++;
        });
        
        if (cleanedCount > 0) {
            console.log(`✅ 구형 데이터 ${cleanedCount}개 삭제 완료`);
        } else {
            console.log('✅ 구형 데이터 없음');
        }
    } catch (e) {
        console.error('❌ 구형 데이터 마이그레이션 실패:', e);
    }
}

/**
 * 앱 초기화
 */
function initApp() {
    console.log('[DOMContentLoaded] Start');
    
    // 구형 데이터 마이그레이션 (가장 먼저 실행)
    migrateOldStorageData();
    
    // 버전 정보 표시
    const appInfoElement = document.getElementById('app-info');
    if (appInfoElement) {
        appInfoElement.textContent = `${APP_NAME} | Version ${APP_VERSION}`;
    }
    
    // 설정 로드
    console.log('🚀 앱 초기화: 설정 및 데이터 로드 시작');
    loadSettings();
    loadHistory();
    loadBookmarks();
    loadGoogleDriveSettings();
    console.log('🚀 앱 초기화: 설정 및 데이터 로드 완료');

    // 설정 적용
    applySettings();
    displayUploadHistory();
    displayUploadBookmarks();

    // 마지막 읽은 파일 복원 시도
    restoreLastReadFile();

    // 파일 입력 이벤트 리스너
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const { processFilesWithResume } = await import('./viewer.js');
            await processFilesWithResume(Array.from(e.target.files));
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
        uploadBox.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadBox.classList.remove('bg-gray-100');
            const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.txt'));
            if (droppedFiles.length) {
                const { processFilesWithResume } = await import('./viewer.js');
                await processFilesWithResume(droppedFiles);
            }
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

/**
 * 마지막 읽은 파일 복원
 */
async function restoreLastReadFile() {
    const lastReadFile = loadLastReadFile();
    if (!lastReadFile) return;
    
    if (lastReadFile.isGoogleDrive && lastReadFile.fileId) {
        // Case A: Google Drive 파일 - 로그인 후 자동 로드
        console.log('마지막 읽은 Google Drive 파일 복원 시도:', lastReadFile.fileName);
        // Google Drive 모듈에서 처리하도록 신호 전달
        if (window.restoreGoogleDriveFile) {
            window.restoreGoogleDriveFile(lastReadFile.fileId);
        } else {
            // Google Drive가 아직 초기화되지 않았으면 나중에 시도
            setTimeout(() => {
                if (window.restoreGoogleDriveFile) {
                    window.restoreGoogleDriveFile(lastReadFile.fileId);
                }
            }, 1000);
        }
    } else {
        // Case B: 로컬 파일 - 안내 메시지 표시
        console.log('마지막 읽은 로컬 파일:', lastReadFile.fileName);
        showLocalFileResumeMessage(lastReadFile.fileName);
    }
}

// 전역 함수 노출 (HTML의 onclick에서 사용)
window.setTheme = setTheme;
window.setFontSize = setFontSize;
window.saveGoogleDriveSettings = saveGoogleDriveSettings;
window.loadGoogleDriveFiles = loadGoogleDriveFiles;

// DOM 로드 완료 시 초기화
window.addEventListener('DOMContentLoaded', initApp);

