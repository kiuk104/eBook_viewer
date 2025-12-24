/**
 * 뷰어 모듈
 * 파일 처리 및 UI 조작 관련 기능
 */

import { formatFileSize, formatTimestamp, generateFileKey } from './utils.js';
import { getHistory, setHistory, saveReadingProgress, loadReadingProgress, getBookmarks, getBookmarksByFileKey, setBookmarks, saveLastReadFile, loadLastReadFile } from './settings.js';

// 파일 배열 관리 (전역 상태)
let files = [];
let currentFileIndex = -1;
let currentFileKey = null; // 현재 열린 파일의 고유 키
let scrollSaveTimer = null; // 스크롤 저장 디바운스 타이머

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
                const fileObj = {
                    name: file.name,
                    size: file.size,
                    content: decoder.decode(e.target.result),
                    lastModified: file.lastModified
                    // fileId는 없음 (로컬 파일)
                };
                files.push(fileObj);
                resolve();
            };
            reader.readAsArrayBuffer(file);
        });
    });

    await Promise.all(filePromises);
    
    if (files.length > 0) {
        currentFileIndex = 0;
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
 * 파일 처리 (이어보기 지원)
 * @param {FileList|Array<File>} fileList - 처리할 파일 목록
 */
export async function processFilesWithResume(fileList) {
    await processFiles(fileList);
    
    // 마지막 읽은 파일과 비교하여 읽기 위치 복원
    const lastReadFile = loadLastReadFile();
    if (lastReadFile && files.length > 0) {
        const currentFile = files[0];
        const currentFileKey = generateFileKey(currentFile);
        
        // 같은 파일이면 저장된 위치로 복원 (이미 displayFileContent에서 처리됨)
        if (currentFileKey === lastReadFile.fileKey) {
            console.log('이전 읽기 위치 복원:', lastReadFile.fileName);
        }
        
        // 북마크에서 열기 요청이 있었는지 확인
        if (window.pendingBookmarkRestore) {
            const { fileKey: pendingFileKey, position } = window.pendingBookmarkRestore;
            if (currentFileKey === pendingFileKey) {
                console.log(`🔍 북마크 위치로 복원: ${position}%`);
                setTimeout(() => {
                    const viewer = document.getElementById('viewerContent');
                    if (viewer) {
                        const scrollHeight = viewer.scrollHeight;
                        const clientHeight = viewer.clientHeight;
                        if (scrollHeight > clientHeight) {
                            const scrollTop = (position / 100) * (scrollHeight - clientHeight);
                            viewer.scrollTop = scrollTop;
                            console.log(`✅ 북마크 위치로 이동 완료: ${position}%`);
                        }
                    }
                    // 임시 저장 제거
                    window.pendingBookmarkRestore = null;
                }, 300);
            }
        }
    }
}

/**
 * 북마크 복원을 위한 임시 저장 (로컬 파일용)
 */
window.setPendingBookmarkRestore = function(fileKey, position) {
    window.pendingBookmarkRestore = { fileKey, position };
    console.log(`🔍 북마크 복원 대기: [${fileKey}] 위치 ${position}%`);
};

/**
 * 파일 내용 표시
 * @param {Object} file - 파일 객체 {name, size, content, lastModified, fileId?}
 */
export function displayFileContent(file) {
    const viewer = document.getElementById('viewerContent');
    const title = document.getElementById('currentFileName');
    const info = document.getElementById('fileInfo');
    
    // File Key 생성 및 저장
    currentFileKey = generateFileKey(file);
    console.log(`📂 현재 파일 키 설정: ${currentFileKey}`);
    
    viewer.textContent = file.content;
    title.textContent = file.name;
    info.textContent = `${formatFileSize(file.size)} | ${formatTimestamp(file.lastModified)}`;
    
    // 마지막 읽은 파일 정보 저장
    saveLastReadFile({
        fileKey: currentFileKey,
        fileName: file.name,
        fileId: file.fileId || null,
        isGoogleDrive: !!file.fileId
    });
    
    // Add to history
    addToHistory(file);
    
    // 스크롤 이벤트 리스너 설정
    setupScrollListener();
    
    // 북마크 목록 업데이트
    displayUploadBookmarks();
    
    // 저장된 읽기 위치로 복원
    restoreReadingPosition();
}

/**
 * 스크롤 이벤트 리스너 설정
 */
function setupScrollListener() {
    const viewer = document.getElementById('viewerContent');
    if (!viewer) return;
    
    // 기존 리스너 제거 (중복 방지)
    viewer.removeEventListener('scroll', handleScroll);
    
    // 새 리스너 추가
    viewer.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * 스크롤 이벤트 핸들러 (디바운스 적용)
 */
function handleScroll() {
    if (!currentFileKey) return;
    
    const viewer = document.getElementById('viewerContent');
    if (!viewer) return;
    
    // 디바운스: 500ms마다 저장
    if (scrollSaveTimer) {
        clearTimeout(scrollSaveTimer);
    }
    
    scrollSaveTimer = setTimeout(() => {
        const scrollTop = viewer.scrollTop;
        const scrollHeight = viewer.scrollHeight;
        const clientHeight = viewer.clientHeight;
        
        // 스크롤 진행률 계산 (퍼센트)
        const progress = scrollHeight > clientHeight 
            ? (scrollTop / (scrollHeight - clientHeight)) * 100 
            : 0;
        
        // 진행 상황 저장
        saveReadingProgress(currentFileKey, progress);
    }, 500);
}

/**
 * 저장된 읽기 위치로 복원
 */
function restoreReadingPosition() {
    if (!currentFileKey) {
        console.log('🔍 읽기 위치 복원: currentFileKey가 없음');
        return;
    }
    
    console.log(`🔍 불러오기 시도: [${currentFileKey}]로 검색한 결과`);
    const savedPosition = loadReadingProgress(currentFileKey);
    console.log(`🔍 불러오기 결과: ${savedPosition !== null ? `위치 ${savedPosition}%` : 'null (저장된 위치 없음)'}`);
    
    if (savedPosition === null) return;
    
    const viewer = document.getElementById('viewerContent');
    if (!viewer) return;
    
    // DOM이 완전히 렌더링된 후 스크롤 복원
    setTimeout(() => {
        const scrollHeight = viewer.scrollHeight;
        const clientHeight = viewer.clientHeight;
        
        if (scrollHeight > clientHeight) {
            const scrollTop = (savedPosition / 100) * (scrollHeight - clientHeight);
            viewer.scrollTop = scrollTop;
            console.log(`✅ 읽기 위치 복원 완료: ${savedPosition}% (${scrollTop}px)`);
        }
    }, 100);
}

/**
 * 히스토리에 파일 추가
 * @param {Object} file - 파일 객체
 */
function addToHistory(file) {
    const history = getHistory();
    const fileKey = generateFileKey(file);
    const newItem = { 
        name: file.name, 
        fileKey: fileKey,
        timestamp: Date.now() 
    };
    console.log(`💾 히스토리 저장 시도: [${fileKey}] ->`, newItem);
    // fileKey 기준으로 중복 제거
    const updatedHistory = [newItem, ...history.filter(h => h.fileKey !== fileKey)].slice(0, 20);
    console.log(`💾 히스토리 업데이트: 총 ${updatedHistory.length}개 항목`);
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
    console.log(`🔍 히스토리 표시: ${history.length}개 항목 불러옴`);
    if (history.length > 0) {
        console.log(`🔍 히스토리 항목들:`, history);
    }
    container.innerHTML = '';
    if (history.length === 0) {
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'p-2 border rounded hover:bg-gray-50 cursor-pointer';
            div.innerHTML = `<div class="font-bold">${item.name}</div><div class="text-xs text-gray-500">${formatTimestamp(item.timestamp)}</div>`;
            // 클릭 시 해당 파일로 이동 (향후 구현 가능)
            div.addEventListener('click', () => {
                // TODO: 파일 다시 열기 기능
                console.log('히스토리 항목 클릭:', item);
            });
            container.appendChild(div);
        });
    }
}

/**
 * 북마크 추가
 * @param {string} fileKey - 파일 고유 키 (generateFileKey로 생성된 키만 사용)
 * @param {string} fileName - 파일 이름
 * @param {number} position - 북마크 위치 (퍼센트)
 */
export function addBookmark(fileKey, fileName, position) {
    if (!fileKey) {
        console.error('❌ addBookmark: fileKey가 없습니다');
        return;
    }
    
    console.log(`💾 북마크 저장 시도: [${fileKey}] -> 위치 ${position}%`);
    const allBookmarks = getBookmarks();
    
    // fileKey로 해당 파일의 북마크 배열 가져오기 (없으면 생성)
    if (!allBookmarks[fileKey]) {
        allBookmarks[fileKey] = [];
    }
    
    const fileBookmarks = allBookmarks[fileKey];
    
    // 중복 제거 (같은 위치의 북마크)
    const filteredBookmarks = fileBookmarks.filter(
        b => Math.abs(b.position - position) >= 1
    );
    
    // 미리보기 텍스트 추출 (현재 위치 주변 텍스트)
    const viewer = document.getElementById('viewerContent');
    let preview = '';
    if (viewer) {
        const scrollTop = viewer.scrollTop;
        const scrollHeight = viewer.scrollHeight;
        const clientHeight = viewer.clientHeight;
        const targetScrollTop = (position / 100) * (scrollHeight - clientHeight);
        
        // 텍스트 내용에서 해당 위치 주변 추출
        const text = viewer.textContent || '';
        const textLength = text.length;
        const targetIndex = Math.floor((targetScrollTop / scrollHeight) * textLength);
        const startIndex = Math.max(0, targetIndex - 50);
        const endIndex = Math.min(textLength, targetIndex + 50);
        preview = text.substring(startIndex, endIndex).trim().replace(/\s+/g, ' ');
        if (preview.length > 100) {
            preview = preview.substring(0, 100) + '...';
        }
    }
    
    // 새 북마크 추가
    const newBookmark = {
        fileKey: fileKey,        // 파일 키 (필수)
        fileName: fileName,       // 파일 이름 (표시용)
        position: position,      // 북마크 위치 (퍼센트)
        preview: preview,         // 미리보기 텍스트
        timestamp: Date.now()     // 타임스탬프
    };
    
    filteredBookmarks.push(newBookmark);
    
    // 최대 50개로 제한
    allBookmarks[fileKey] = filteredBookmarks.slice(-50);
    
    console.log(`💾 북마크 데이터:`, newBookmark);
    console.log(`💾 북마크 업데이트: [${fileKey}] 파일에 ${allBookmarks[fileKey].length}개 북마크`);
    setBookmarks(allBookmarks);
    displayUploadBookmarks();
}

/**
 * 북마크 삭제
 * @param {string} fileKey - 파일 고유 키 (generateFileKey로 생성된 키만 사용)
 * @param {number} position - 북마크 위치 (퍼센트)
 */
export function removeBookmark(fileKey, position) {
    if (!fileKey) {
        console.error('❌ removeBookmark: fileKey가 없습니다');
        return;
    }
    
    console.log(`🗑️ 북마크 삭제 시도: [${fileKey}] -> 위치 ${position}%`);
    const allBookmarks = getBookmarks();
    
    if (!allBookmarks[fileKey]) {
        console.log(`🗑️ 삭제할 북마크 없음: [${fileKey}] 파일에 북마크가 없습니다`);
        return;
    }
    
    const fileBookmarks = allBookmarks[fileKey];
    const beforeCount = fileBookmarks.length;
    
    // 해당 위치의 북마크 제거
    allBookmarks[fileKey] = fileBookmarks.filter(
        b => Math.abs(b.position - position) >= 1
    );
    
    const afterCount = allBookmarks[fileKey].length;
    console.log(`🗑️ 삭제 전 북마크 개수: ${beforeCount}개`);
    console.log(`🗑️ 삭제 후 북마크 개수: ${afterCount}개`);
    
    // 빈 배열이면 키 자체를 삭제
    if (allBookmarks[fileKey].length === 0) {
        delete allBookmarks[fileKey];
    }
    
    setBookmarks(allBookmarks);
    displayUploadBookmarks();
}

/**
 * 현재 위치에 북마크가 있는지 확인
 * @param {string} fileKey - 파일 고유 키 (generateFileKey로 생성된 키만 사용)
 * @param {number} position - 현재 위치 (퍼센트)
 * @returns {boolean} 북마크 존재 여부
 */
export function hasBookmarkAt(fileKey, position) {
    if (!fileKey) return false;
    const allBookmarks = getBookmarks();
    const fileBookmarks = allBookmarks[fileKey] || [];
    return fileBookmarks.some(b => Math.abs(b.position - position) < 1);
}

/**
 * 북마크 표시
 * fileKey 기반으로 모든 북마크를 표시
 */
export function displayUploadBookmarks() {
    const container = document.getElementById('uploadBookmarksList');
    const empty = document.getElementById('uploadBookmarksEmpty');
    if(!container) return;
    
    const allBookmarks = getBookmarks();
    const totalBookmarks = Object.values(allBookmarks).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`🔍 북마크 표시: ${Object.keys(allBookmarks).length}개 파일, 총 ${totalBookmarks}개 항목 불러옴`);
    
    if (totalBookmarks > 0) {
        console.log(`🔍 북마크 항목들:`, allBookmarks);
    }
    
    container.innerHTML = '';
    
    if (totalBookmarks === 0) {
        if (empty) empty.style.display = 'block';
    } else {
        if (empty) empty.style.display = 'none';
        
        // 모든 북마크를 평탄화하여 표시 (fileKey 포함)
        const allBookmarksList = [];
        Object.keys(allBookmarks).forEach(fileKey => {
            const fileBookmarks = allBookmarks[fileKey];
            fileBookmarks.forEach(bookmark => {
                allBookmarksList.push({
                    ...bookmark,
                    fileKey: fileKey // fileKey 명시적으로 포함
                });
            });
        });
        
        // 타임스탬프 기준으로 최신순 정렬
        allBookmarksList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        console.log(`🔍 평탄화된 북마크 목록:`, allBookmarksList);
        
        // 각 북마크를 카드로 표시
        allBookmarksList.forEach(bookmark => {
            const div = document.createElement('div');
            div.className = 'p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors mb-2';
            
            // 현재 파일의 북마크인지 확인
            const isCurrentFile = currentFileKey && bookmark.fileKey === currentFileKey;
            
            div.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="font-bold text-sm mb-1">${bookmark.fileName || bookmark.fileKey || '북마크'}</div>
                        ${bookmark.preview ? `<div class="text-xs text-gray-600 mb-1 line-clamp-2">${bookmark.preview}</div>` : ''}
                        <div class="text-xs text-gray-500">
                            ${formatTimestamp(bookmark.timestamp)} | 위치: ${bookmark.position.toFixed(1)}%
                            ${isCurrentFile ? ' | <span class="text-blue-600">현재 파일</span>' : ''}
                        </div>
                    </div>
                    ${isCurrentFile ? `
                        <button class="text-red-500 hover:text-red-700 text-sm ml-2" onclick="removeBookmarkAtPosition(${bookmark.position})">
                            삭제
                        </button>
                    ` : ''}
                </div>
            `;
            
            // 클릭 이벤트: 해당 파일 열기 및 위치로 이동
            div.addEventListener('click', (e) => {
                // 삭제 버튼 클릭은 무시
                if (e.target.tagName === 'BUTTON') return;
                
                openFileFromBookmark(bookmark.fileKey, bookmark.position);
            });
            
            container.appendChild(div);
        });
    }
}

/**
 * 북마크에서 파일 열기
 * @param {string} fileKey - 파일 고유 키
 * @param {number} position - 북마크 위치 (퍼센트)
 */
async function openFileFromBookmark(fileKey, position) {
    if (!fileKey) {
        console.error('❌ openFileFromBookmark: fileKey가 없습니다');
        return;
    }
    
    console.log(`🔍 북마크에서 파일 열기: [${fileKey}] 위치 ${position}%`);
    
    // fileKey에서 파일 타입 확인
    if (fileKey.startsWith('gdrive_')) {
        // Google Drive 파일
        const fileId = fileKey.replace('gdrive_', '');
        console.log(`🔍 Google Drive 파일 열기: ${fileId}`);
        
        // Google Drive 파일 로드 함수 호출
        if (window.restoreGoogleDriveFile) {
            await window.restoreGoogleDriveFile(fileId);
            
            // 위치로 이동 (약간의 지연 후)
            setTimeout(() => {
                const viewer = document.getElementById('viewerContent');
                if (viewer) {
                    const scrollHeight = viewer.scrollHeight;
                    const clientHeight = viewer.clientHeight;
                    if (scrollHeight > clientHeight) {
                        const scrollTop = (position / 100) * (scrollHeight - clientHeight);
                        viewer.scrollTop = scrollTop;
                        console.log(`✅ 북마크 위치로 이동: ${position}% (${scrollTop}px)`);
                    }
                }
            }, 500);
        } else {
            alert('Google Drive 파일을 열 수 없습니다. Google Drive 기능이 초기화되지 않았습니다.');
        }
    } else if (fileKey.startsWith('local_')) {
        // 로컬 파일 - 파일 선택 안내
        const fileNameMatch = fileKey.match(/^local_(.+)_(\d+)$/);
        if (fileNameMatch) {
            const fileName = fileNameMatch[1];
            alert(`로컬 파일 "${fileName}"을 열려면 파일을 다시 선택해주세요.\n선택 후 저장된 위치로 자동 이동합니다.`);
            
            // 파일 선택 후 위치 복원을 위해 임시 저장
            if (window.setPendingBookmarkRestore) {
                window.setPendingBookmarkRestore(fileKey, position);
            }
        }
    }
}

/**
 * 특정 위치의 북마크 삭제 (전역 함수)
 */
window.removeBookmarkAtPosition = function(position) {
    if (!currentFileKey) return;
    removeBookmark(currentFileKey, position);
};

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

/**
 * 현재 위치에 북마크 토글 (추가/삭제)
 */
export function toggleBookmark() {
    if (!currentFileKey) {
        alert('파일을 먼저 열어주세요.');
        return;
    }
    
    const viewer = document.getElementById('viewerContent');
    if (!viewer) return;
    
    const scrollTop = viewer.scrollTop;
    const scrollHeight = viewer.scrollHeight;
    const clientHeight = viewer.clientHeight;
    
    if (scrollHeight <= clientHeight) {
        alert('북마크를 추가할 내용이 없습니다.');
        return;
    }
    
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    const currentFile = files[currentFileIndex] || files[0];
    
    if (hasBookmarkAt(currentFileKey, progress)) {
        removeBookmark(currentFileKey, progress);
        alert('북마크가 삭제되었습니다.');
    } else {
        addBookmark(currentFileKey, currentFile.name, progress);
        alert('북마크가 추가되었습니다.');
    }
    
    // 북마크 목록 업데이트
    displayUploadBookmarks();
}

/**
 * 로컬 파일 안내 메시지 표시
 * @param {string} fileName - 파일 이름
 */
export function showLocalFileResumeMessage(fileName) {
    const viewer = document.getElementById('viewerContent');
    if (!viewer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'text-center py-8 px-4 bg-blue-50 border-2 border-blue-200 rounded-lg mb-4';
    messageDiv.innerHTML = `
        <div class="text-4xl mb-4">📖</div>
        <h3 class="text-xl font-bold text-blue-800 mb-2">이어서 읽기</h3>
        <p class="text-gray-700 mb-4">
            마지막에 읽던 <strong>"${fileName}"</strong>을 계속 읽으려면<br>
            파일을 다시 선택해주세요.
        </p>
        <button onclick="selectFiles()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            파일 선택하기
        </button>
    `;
    
    // 기존 내용을 숨기고 메시지 표시
    const emptyState = document.getElementById('viewerEmptyState');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    viewer.innerHTML = '';
    viewer.appendChild(messageDiv);
}

// 전역으로 노출 (HTML의 onclick에서 사용)
window.selectFiles = selectFiles;
window.toggleSettings = toggleSettings;
window.toggleUploadSection = toggleUploadSection;
window.displayFileContent = displayFileContent;
window.toggleBookmark = toggleBookmark;

