/**
 * 뷰어 모듈
 * 파일 처리 및 UI 조작 관련 기능
 */

import { formatFileSize, formatTimestamp } from './utils.js';
import { getHistory, setHistory } from './settings.js';

// 파일 배열 관리 (전역 상태)
let files = [];
let currentFileIndex = -1;

/**
 * 파일 배열 가져오기
 * @returns {Array} 파일 배열
 */
export function getFiles() {
    return files;
}

/**
 * 파일 배열 설정
 * @param {Array} newFiles - 새로운 파일 배열
 */
export function setFiles(newFiles) {
    files = newFiles;
}

/**
 * 현재 파일 인덱스 가져오기
 * @returns {number} 현재 파일 인덱스
 */
export function getCurrentFileIndex() {
    return currentFileIndex;
}

/**
 * 현재 파일 인덱스 설정
 * @param {number} index - 파일 인덱스
 */
export function setCurrentFileIndex(index) {
    currentFileIndex = index;
}

/**
 * 파일 선택 (파일 입력 클릭)
 */
export function selectFiles() {
    document.getElementById('fileInput').click();
}

/**
 * 파일 처리
 * @param {FileList|Array<File>} fileList - 처리할 파일 목록
 */
export async function processFiles(fileList) {
    files = [];
    currentFileIndex = -1;
    
    const filePromises = fileList.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const decoder = new TextDecoder('UTF-8');
                files.push({
                    name: file.name,
                    size: file.size,
                    content: decoder.decode(e.target.result),
                    lastModified: file.lastModified
                });
                resolve();
            };
            reader.readAsArrayBuffer(file);
        });
    });

    await Promise.all(filePromises);
    
    if (files.length > 0) {
        document.getElementById('mainContent').classList.remove('hidden');
        displayFileContent(files[0]);
        
        // Auto collapse upload
        const uploadContent = document.getElementById('uploadSectionContent');
        if(uploadContent && !uploadContent.classList.contains('collapsed')) {
            toggleUploadSection();
        }
    }
}

/**
 * 파일 내용 표시
 * @param {Object} file - 파일 객체 {name, size, content, lastModified}
 */
export function displayFileContent(file) {
    const viewer = document.getElementById('viewerContent');
    const title = document.getElementById('currentFileName');
    const info = document.getElementById('fileInfo');
    
    viewer.textContent = file.content;
    title.textContent = file.name;
    info.textContent = `${formatFileSize(file.size)} | ${formatTimestamp(file.lastModified)}`;
    
    // Add to history
    addToHistory(file);
}

/**
 * 히스토리에 파일 추가
 * @param {Object} file - 파일 객체
 */
function addToHistory(file) {
    const history = getHistory();
    const newItem = { name: file.name, timestamp: Date.now() };
    const updatedHistory = [newItem, ...history.filter(h => h.name !== file.name)].slice(0, 20);
    setHistory(updatedHistory);
    displayUploadHistory();
}

/**
 * 업로드 히스토리 표시
 */
export function displayUploadHistory() {
    const container = document.getElementById('uploadHistoryList');
    const empty = document.getElementById('uploadHistoryEmpty');
    if(!container) return;
    
    const history = getHistory();
    container.innerHTML = '';
    if (history.length === 0) {
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'p-2 border rounded hover:bg-gray-50 cursor-pointer';
            div.innerHTML = `<div class="font-bold">${item.name}</div><div class="text-xs text-gray-500">${formatTimestamp(item.timestamp)}</div>`;
            container.appendChild(div);
        });
    }
}

/**
 * 북마크 표시
 */
export function displayUploadBookmarks() {
    // Placeholder implementation
    const empty = document.getElementById('uploadBookmarksEmpty');
    const bookmarks = []; // TODO: settings.js에서 가져오기
    if(bookmarks.length === 0 && empty) empty.style.display = 'block';
}

/**
 * 설정 패널 토글
 */
export function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel) {
        panel.classList.toggle('hidden');
    }
}

/**
 * 업로드 섹션 토글
 */
export function toggleUploadSection() {
    const content = document.getElementById('uploadSectionContent');
    const btn = document.getElementById('uploadToggleIcon');
    if (content) {
        content.classList.toggle('collapsed');
        if (btn) {
            btn.textContent = content.classList.contains('collapsed') ? '▼' : '▲';
        }
    }
}

// 전역으로 노출 (HTML의 onclick에서 사용)
window.selectFiles = selectFiles;
window.toggleSettings = toggleSettings;
window.toggleUploadSection = toggleUploadSection;
window.displayFileContent = displayFileContent;

