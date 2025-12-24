/**
 * 설정 관리 모듈
 * 테마, 폰트 크기, 로컬 스토리지 관련 기능
 */

// 설정 상태
let currentTheme = 'light';
let currentFontSize = 16;
let history = [];
let bookmarks = [];

/**
 * 설정 불러오기
 */
export function loadSettings() {
    try {
        const savedTheme = localStorage.getItem('readerTheme');
        if (savedTheme) currentTheme = savedTheme;

        const savedFontSize = localStorage.getItem('readerFontSize');
        if (savedFontSize) currentFontSize = parseInt(savedFontSize);

        console.log('Settings loaded:', { currentTheme, currentFontSize });
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
}

/**
 * 설정 적용하기 (DOM 업데이트)
 */
export function applySettings() {
    // 테마 적용
    setTheme(currentTheme, false); // false = don't save again
    // 폰트 크기 적용
    setFontSize(currentFontSize, false);
    
    // 슬라이더 UI 업데이트
    const fontSlider = document.getElementById('fontSizeSlider');
    if (fontSlider) fontSlider.value = currentFontSize;
}

/**
 * 히스토리 불러오기
 */
export function loadHistory() {
    try {
        const savedHistory = localStorage.getItem('readerHistory');
        if (savedHistory) {
            history = JSON.parse(savedHistory);
        }
    } catch (e) {
        console.error('Failed to load history:', e);
        history = [];
    }
}

/**
 * 북마크 불러오기
 */
export function loadBookmarks() {
    try {
        const savedBookmarks = localStorage.getItem('readerBookmarks');
        if (savedBookmarks) {
            bookmarks = JSON.parse(savedBookmarks);
        }
    } catch (e) {
        console.error('Failed to load bookmarks:', e);
        bookmarks = [];
    }
}

/**
 * 테마 설정
 * @param {string} themeName - 테마 이름 ('light', 'dark', 'sepia', 'green')
 * @param {boolean} save - localStorage에 저장할지 여부
 */
export function setTheme(themeName, save = true) {
    currentTheme = themeName;
    const body = document.getElementById('bodyElement');
    const content = document.getElementById('mainContent');
    
    // Remove old themes
    ['theme-light', 'theme-dark', 'theme-sepia', 'theme-green'].forEach(t => {
        body.classList.remove(t);
        if (content) content.classList.remove(t);
    });

    // Add new theme
    const themeClass = `theme-${themeName}`;
    body.classList.add(themeClass);
    if (content) content.classList.add(themeClass);

    // Update Active UI
    document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
    
    if (save) {
        localStorage.setItem('readerTheme', themeName);
    }
}

/**
 * 폰트 크기 설정
 * @param {number|string} size - 폰트 크기
 * @param {boolean} save - localStorage에 저장할지 여부
 */
export function setFontSize(size, save = true) {
    currentFontSize = size;
    const content = document.getElementById('viewerContent');
    const label = document.getElementById('fontSizeValue');
    
    if (content) content.style.fontSize = `${size}px`;
    if (label) label.textContent = size;
    
    if (save) {
        localStorage.setItem('readerFontSize', size);
    }
}

/**
 * Google Drive 설정 가져오기
 * @returns {Object} {clientId, apiKey}
 */
export function getGoogleDriveSettings() {
    return {
        clientId: localStorage.getItem('googleClientId') || '',
        apiKey: localStorage.getItem('googleApiKey') || ''
    };
}

/**
 * Google Drive 설정 로드 (UI에 반영)
 */
export function loadGoogleDriveSettings() {
    const s = getGoogleDriveSettings();
    const cidInput = document.getElementById('googleClientId');
    const keyInput = document.getElementById('googleApiKey');
    if (cidInput) cidInput.value = s.clientId;
    if (keyInput) keyInput.value = s.apiKey;
}

/**
 * Google Drive 설정 저장
 */
export function saveGoogleDriveSettings() {
    const cid = document.getElementById('googleClientId').value.trim();
    const key = document.getElementById('googleApiKey').value.trim();
    if(!cid || !key) return alert('모두 입력해주세요.');
    localStorage.setItem('googleClientId', cid);
    localStorage.setItem('googleApiKey', key);
    alert('저장되었습니다.');
    
    // Google Drive 모듈에 재초기화 신호 전달
    if (window.resetGoogleDrive) {
        window.resetGoogleDrive();
    }
}

// 내보내기: 상태 접근 함수들
export function getCurrentTheme() {
    return currentTheme;
}

export function getCurrentFontSize() {
    return currentFontSize;
}

export function getHistory() {
    return history;
}

export function setHistory(newHistory) {
    history = newHistory;
    localStorage.setItem('readerHistory', JSON.stringify(history));
}

export function getBookmarks() {
    return bookmarks;
}

export function setBookmarks(newBookmarks) {
    bookmarks = newBookmarks;
    localStorage.setItem('readerBookmarks', JSON.stringify(bookmarks));
}

