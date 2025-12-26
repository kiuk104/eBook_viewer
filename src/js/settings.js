/**
 * 설정 관리 모듈
 * 테마, 폰트 크기, 로컬 스토리지 관련 기능
 */

// 설정 상태
let currentTheme = 'light';
let currentFontSize = 16;
let history = [];
let bookmarks = {}; // fileKey를 키로 하는 객체 구조로 변경

/**
 * 설정 불러오기
 */
export function loadSettings() {
    try {
        const savedTheme = localStorage.getItem('readerTheme');
        if (savedTheme) currentTheme = savedTheme;

        const savedFontSize = localStorage.getItem('readerFontSize');
        if (savedFontSize) currentFontSize = parseInt(savedFontSize);

        // API 키 로드
        const apiKey = localStorage.getItem('geminiApiKey');
        const apiKeyInput = document.getElementById('geminiApiKey');
        if (apiKey && apiKeyInput) {
            apiKeyInput.value = apiKey;
        }

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
    
    // 커스텀 테마 색상 피커 UI 업데이트
    if (currentTheme === 'custom') {
        const customTheme = getCustomTheme();
        if (customTheme) {
            const bgColorPicker = document.getElementById('customBgColor');
            const textColorPicker = document.getElementById('customTextColor');
            if (bgColorPicker) bgColorPicker.value = customTheme.backgroundColor;
            if (textColorPicker) textColorPicker.value = customTheme.textColor;
        }
    }
}

/**
 * 히스토리 불러오기
 */
export function loadHistory() {
    try {
        console.log('🔍 히스토리 불러오기 시도');
        const savedHistory = localStorage.getItem('readerHistory');
        console.log(`🔍 localStorage에서 읽은 원본 데이터:`, savedHistory);
        if (savedHistory) {
            history = JSON.parse(savedHistory);
            console.log(`🔍 히스토리 불러오기 결과: ${history.length}개 항목`, history);
        } else {
            console.log('🔍 히스토리 불러오기 결과: null (저장된 데이터 없음)');
            history = [];
        }
    } catch (e) {
        console.error('❌ 히스토리 불러오기 실패:', e);
        history = [];
    }
}

/**
 * 북마크 불러오기
 * 
 * 구형 데이터(배열 형태)를 새로운 구조(객체 형태)로 마이그레이션
 */
export function loadBookmarks() {
    try {
        console.log('🔍 북마크 불러오기 시도');
        const savedBookmarks = localStorage.getItem('readerBookmarks');
        console.log(`🔍 localStorage에서 읽은 원본 데이터:`, savedBookmarks);
        
        if (savedBookmarks) {
            const parsed = JSON.parse(savedBookmarks);
            
            // 구형 데이터(배열)인지 확인하고 마이그레이션
            if (Array.isArray(parsed)) {
                console.log('🔄 구형 북마크 데이터(배열) 발견, 객체 구조로 마이그레이션 중...');
                bookmarks = {};
                
                // 배열을 fileKey 기반 객체로 변환
                parsed.forEach(bookmark => {
                    const fileKey = bookmark.fileKey || bookmark.fileName; // 구형 데이터 대응
                    
                    // fileName으로 저장된 구형 데이터는 무시
                    if (!fileKey || fileKey === bookmark.fileName) {
                        console.log(`⚠️ 구형 북마크 데이터 무시 (fileKey 없음):`, bookmark);
                        return;
                    }
                    
                    if (!bookmarks[fileKey]) {
                        bookmarks[fileKey] = [];
                    }
                    bookmarks[fileKey].push({
                        position: bookmark.position,
                        timestamp: bookmark.timestamp || Date.now(),
                        fileName: bookmark.fileName // 참고용으로 유지
                    });
                });
                
                console.log(`🔄 마이그레이션 완료: ${Object.keys(bookmarks).length}개 파일의 북마크`);
                // 마이그레이션된 데이터 저장
                setBookmarks(bookmarks);
            } else {
                // 새로운 구조(객체)
                bookmarks = parsed || {};
            }
            
            const totalBookmarks = Object.values(bookmarks).reduce((sum, arr) => sum + arr.length, 0);
            console.log(`🔍 북마크 불러오기 결과: ${Object.keys(bookmarks).length}개 파일, 총 ${totalBookmarks}개 북마크`, bookmarks);
        } else {
            console.log('🔍 북마크 불러오기 결과: null (저장된 데이터 없음)');
            bookmarks = {};
        }
    } catch (e) {
        console.error('❌ 북마크 불러오기 실패:', e);
        bookmarks = {};
    }
}

/**
 * 테마 설정
 * @param {string} themeName - 테마 이름 ('light', 'dark', 'sepia', 'green', 'custom')
 * @param {boolean} save - localStorage에 저장할지 여부
 */
export function setTheme(themeName, save = true) {
    currentTheme = themeName;
    const body = document.getElementById('bodyElement');
    const content = document.getElementById('mainContent');
    
    // 모든 테마 클래스 제거 (body, content, viewer-container 등 모든 요소에서)
    const allThemeClasses = ['theme-light', 'theme-dark', 'theme-sepia', 'theme-green', 'theme-custom'];
    allThemeClasses.forEach(t => {
        body.classList.remove(t);
        if (content) content.classList.remove(t);
        // viewer-container도 확인
        const viewerContainer = document.querySelector('.viewer-container');
        if (viewerContainer) viewerContainer.classList.remove(t);
    });

    // 커스텀 테마 섹션 표시/숨김
    const customThemeSection = document.getElementById('customThemeSection');
    if (customThemeSection) {
        if (themeName === 'custom') {
            customThemeSection.classList.remove('hidden');
        } else {
            customThemeSection.classList.add('hidden');
        }
    }

    // 커스텀 테마인 경우
    if (themeName === 'custom') {
        const customTheme = getCustomTheme();
        if (customTheme) {
            // body에 직접 색상 적용 (인라인 스타일)
            document.body.style.backgroundColor = customTheme.backgroundColor;
            document.body.style.color = customTheme.textColor;
            if (content) {
                content.style.backgroundColor = customTheme.backgroundColor;
                content.style.color = customTheme.textColor;
            }
        } else {
            // 기본값 설정
            const defaultBg = '#ffffff';
            const defaultText = '#1f2937';
            document.body.style.backgroundColor = defaultBg;
            document.body.style.color = defaultText;
            if (content) {
                content.style.backgroundColor = defaultBg;
                content.style.color = defaultText;
            }
            saveCustomTheme(defaultBg, defaultText);
        }
        body.classList.add('theme-custom');
        if (content) content.classList.add('theme-custom');
    } else {
        // 기본 테마인 경우 - 인라인 스타일 초기화
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
        if (content) {
            content.style.backgroundColor = '';
            content.style.color = '';
        }
        
        // 기본 테마 클래스 추가
        const themeClass = `theme-${themeName}`;
        body.classList.add(themeClass);
        if (content) content.classList.add(themeClass);
        
        // body 배경색과 텍스트 색상도 적용
        applyThemeColors(themeName);
    }

    // Update Active UI
    document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
    const activeOption = document.querySelector(`.theme-option[data-theme="${themeName}"]`);
    if (activeOption) activeOption.classList.add('active');
    
    if (save) {
        localStorage.setItem('readerTheme', themeName);
    }
}

/**
 * 테마 색상 적용 (body 배경색 포함)
 * @param {string} themeName - 테마 이름
 */
function applyThemeColors(themeName) {
    const themeColors = {
        'light': { bg: '#ffffff', text: '#1f2937' },
        'dark': { bg: '#1f2937', text: '#f3f4f6' },
        'sepia': { bg: '#fef9e7', text: '#78350f' },
        'green': { bg: '#f0fdf4', text: '#14532d' }
    };
    
    const colors = themeColors[themeName];
    if (colors) {
        document.body.style.backgroundColor = colors.bg;
        document.body.style.color = colors.text;
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
    const historyJson = JSON.stringify(history);
    console.log(`💾 히스토리 저장 시도: ${history.length}개 항목`);
    console.log(`💾 저장할 데이터:`, history);
    localStorage.setItem('readerHistory', historyJson);
    console.log(`💾 localStorage 저장 완료: readerHistory`);
    // localStorage 전체 상태 출력
    console.log('📦 localStorage 전체 상태:', {
        readerHistory: localStorage.getItem('readerHistory'),
        readerBookmarks: localStorage.getItem('readerBookmarks'),
        readingProgress: localStorage.getItem('readingProgress'),
        lastReadFile: localStorage.getItem('lastReadFile')
    });
}

/**
 * 북마크 가져오기 (전체)
 * @returns {Object} fileKey를 키로 하는 북마크 객체
 */
export function getBookmarks() {
    return bookmarks;
}

/**
 * 특정 파일의 북마크 가져오기
 * @param {string} fileKey - 파일 고유 키
 * @returns {Array} 해당 파일의 북마크 배열
 */
export function getBookmarksByFileKey(fileKey) {
    if (!fileKey) return [];
    return bookmarks[fileKey] || [];
}

/**
 * 북마크 저장
 * @param {Object} newBookmarks - fileKey를 키로 하는 북마크 객체
 */
export function setBookmarks(newBookmarks) {
    bookmarks = newBookmarks;
    const bookmarksJson = JSON.stringify(bookmarks);
    const totalBookmarks = Object.values(bookmarks).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`💾 북마크 저장 시도: ${Object.keys(bookmarks).length}개 파일, 총 ${totalBookmarks}개 항목`);
    console.log(`💾 저장할 데이터:`, bookmarks);
    localStorage.setItem('readerBookmarks', bookmarksJson);
    console.log(`💾 localStorage 저장 완료: readerBookmarks`);
    // localStorage 전체 상태 출력
    console.log('📦 localStorage 전체 상태:', {
        readerHistory: localStorage.getItem('readerHistory'),
        readerBookmarks: localStorage.getItem('readerBookmarks'),
        readingProgress: localStorage.getItem('readingProgress'),
        lastReadFile: localStorage.getItem('lastReadFile')
    });
}

/**
 * 읽기 진행 상황 저장
 * 
 * 모든 진행 상황은 'readingProgress' 객체 안에 fileKey를 키로 하여 저장됩니다.
 * 구조: readingProgress = { "gdrive_abc123": { position: 50, timestamp: ... }, "local_book_999": { ... } }
 * 
 * @param {string} fileKey - 파일 고유 키 (generateFileKey로 생성된 키만 사용)
 * @param {number} position - 스크롤 위치 (퍼센트)
 */
export function saveReadingProgress(fileKey, position) {
    try {
        if (!fileKey) {
            console.error('❌ saveReadingProgress: fileKey가 없습니다');
            return;
        }
        
        console.log(`💾 읽기 진행 상황 저장 시도: [${fileKey}] -> 위치 ${position}%`);
        
        // readingProgress 객체 가져오기 (없으면 빈 객체)
        const progressData = JSON.parse(localStorage.getItem('readingProgress') || '{}');
        
        // fileKey를 키로 하여 저장
        progressData[fileKey] = {
            position: position,
            timestamp: Date.now()
        };
        
        const progressJson = JSON.stringify(progressData);
        localStorage.setItem('readingProgress', progressJson);
        console.log(`💾 읽기 진행 상황 저장 완료:`, progressData);
    } catch (e) {
        console.error('❌ 읽기 진행 상황 저장 실패:', e);
    }
}

/**
 * 읽기 진행 상황 불러오기
 * @param {string} fileKey - 파일 고유 키
 * @returns {number|null} 저장된 스크롤 위치 (없으면 null)
 */
export function loadReadingProgress(fileKey) {
    try {
        console.log(`🔍 읽기 진행 상황 불러오기 시도: [${fileKey}]로 검색`);
        const progressData = JSON.parse(localStorage.getItem('readingProgress') || '{}');
        console.log(`🔍 읽기 진행 상황 전체 데이터:`, progressData);
        const result = progressData[fileKey] ? progressData[fileKey].position : null;
        console.log(`🔍 불러오기 결과: ${result !== null ? `위치 ${result}%` : 'null (저장된 위치 없음)'}`);
        return result;
    } catch (e) {
        console.error('❌ 읽기 진행 상황 불러오기 실패:', e);
        return null;
    }
}

/**
 * 마지막으로 읽은 파일 정보 저장
 * @param {Object} fileInfo - 파일 정보 {fileKey, fileName, fileId?, isGoogleDrive}
 */
export function saveLastReadFile(fileInfo) {
    try {
        localStorage.setItem('lastReadFile', JSON.stringify(fileInfo));
    } catch (e) {
        console.error('Failed to save last read file:', e);
    }
}

/**
 * 마지막으로 읽은 파일 정보 불러오기
 * @returns {Object|null} 파일 정보 또는 null
 */
export function loadLastReadFile() {
    try {
        const saved = localStorage.getItem('lastReadFile');
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    } catch (e) {
        console.error('Failed to load last read file:', e);
        return null;
    }
}

/**
 * 커스텀 테마 색상 가져오기
 * @returns {Object|null} {backgroundColor, textColor} 또는 null
 */
export function getCustomTheme() {
    try {
        const saved = localStorage.getItem('customTheme');
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    } catch (e) {
        console.error('Failed to load custom theme:', e);
        return null;
    }
}

/**
 * 커스텀 테마 색상 저장
 * @param {string} backgroundColor - 배경색 (hex)
 * @param {string} textColor - 텍스트 색상 (hex)
 */
export function saveCustomTheme(backgroundColor, textColor) {
    try {
        const customTheme = { backgroundColor, textColor };
        localStorage.setItem('customTheme', JSON.stringify(customTheme));
        console.log('Custom theme saved:', customTheme);
        
        // 현재 테마가 커스텀인 경우에만 즉시 적용
        if (currentTheme === 'custom') {
            document.body.style.backgroundColor = backgroundColor;
            document.body.style.color = textColor;
            const content = document.getElementById('mainContent');
            if (content) {
                content.style.backgroundColor = backgroundColor;
                content.style.color = textColor;
            }
        }
    } catch (e) {
        console.error('Failed to save custom theme:', e);
    }
}

/**
 * 커스텀 테마 업데이트 (컬러 피커 변경 시 호출)
 */
export function updateCustomTheme() {
    const bgColorPicker = document.getElementById('customBgColor');
    const textColorPicker = document.getElementById('customTextColor');
    
    if (bgColorPicker && textColorPicker) {
        const bgColor = bgColorPicker.value;
        const textColor = textColorPicker.value;
        saveCustomTheme(bgColor, textColor);
        // 커스텀 테마로 즉시 전환하여 색상 적용
        setTheme('custom', true);
    }
    
}

/**
 * Gemini API 키 저장
 */
export function saveGeminiApiKey() {
    try {
        const apiKeyInput = document.getElementById('geminiApiKey');
        if (!apiKeyInput) {
            console.error('API 키 입력 필드를 찾을 수 없습니다.');
            return;
        }
        
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            alert('API 키를 입력해주세요.');
            return;
        }
        
        localStorage.setItem('geminiApiKey', apiKey);
        alert('API 키가 저장되었습니다.');
        console.log('Gemini API 키 저장 완료');
    } catch (e) {
        console.error('API 키 저장 실패:', e);
        alert('API 키 저장에 실패했습니다.');
    }
}

/**
 * Gemini API 키 가져오기
 */
export function getGeminiKey() {
    return localStorage.getItem('geminiApiKey');
}