/**
 * 에이전트 1 제안: 클래스 기반 모듈 패턴
 * 
 * 북마크 관리 전담 클래스
 * 단일 책임: 북마크 추가/삭제/조회, 북마크 UI 표시
 */

import { getBookmarks, setBookmarks } from '../settings.js';

/**
 * 북마크 관리자 클래스
 * 파일별 북마크를 관리하고 UI에 표시합니다.
 */
export class BookmarkManager {
    /**
     * @private
     * @type {string | null}
     */
    #currentFileKey = null;

    /**
     * 현재 파일 키 설정
     * @param {string | null} fileKey - 파일 키
     */
    setCurrentFileKey(fileKey) {
        this.#currentFileKey = fileKey;
    }

    /**
     * 현재 파일의 북마크 가져오기
     * @returns {Array} 북마크 배열
     */
    getCurrentBookmarks() {
        if (!this.#currentFileKey) return [];
        
        const allBookmarks = getBookmarks();
        return allBookmarks[this.#currentFileKey] || [];
    }

    /**
     * 북마크 추가
     * @param {Object} options - 북마크 옵션
     * @param {string} options.fileName - 파일명
     * @param {string} [options.preview] - 미리보기 텍스트
     * @param {number} [options.position] - 스크롤 위치 (퍼센트)
     * @param {number} [options.yOffset] - Y 오프셋
     * @returns {Object | null} 추가된 북마크 또는 null
     */
    addBookmark(options) {
        if (!this.#currentFileKey) {
            throw new Error('파일을 먼저 열어주세요');
        }

        const {
            fileName,
            preview = `읽던 위치 (${new Date().toLocaleTimeString()})`,
            position = this.#calculateScrollPosition(),
            yOffset = window.scrollY
        } = options;

        const bookmark = {
            fileKey: this.#currentFileKey,
            fileName,
            preview,
            position,
            yOffset,
            timestamp: Date.now(),
            type: 'bookmark'
        };

        const allBookmarks = getBookmarks();
        if (!allBookmarks[this.#currentFileKey]) {
            allBookmarks[this.#currentFileKey] = [];
        }
        allBookmarks[this.#currentFileKey].push(bookmark);
        setBookmarks(allBookmarks);

        return bookmark;
    }

    /**
     * 북마크 삭제
     * @param {number} timestamp - 북마크 타임스탬프
     * @returns {boolean} 삭제 성공 여부
     */
    removeBookmark(timestamp) {
        if (!this.#currentFileKey) return false;

        const allBookmarks = getBookmarks();
        const fileBookmarks = allBookmarks[this.#currentFileKey];
        if (!fileBookmarks) return false;

        const initialLength = fileBookmarks.length;
        allBookmarks[this.#currentFileKey] = fileBookmarks.filter(
            bm => bm.timestamp !== timestamp
        );

        if (allBookmarks[this.#currentFileKey].length < initialLength) {
            setBookmarks(allBookmarks);
            return true;
        }

        return false;
    }

    /**
     * 북마크로 이동
     * @param {Object} bookmark - 북마크 객체
     */
    jumpToBookmark(bookmark) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({
            top: (bookmark.position / 100) * h,
            behavior: 'smooth'
        });
    }

    /**
     * 현재 스크롤 위치 계산 (퍼센트)
     * @private
     * @returns {number} 스크롤 위치 (0-100)
     */
    #calculateScrollPosition() {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        return docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    }

    /**
     * 북마크 목록 UI 표시
     * @param {string} listId - 목록 요소 ID (기본: 'uploadBookmarksList')
     * @param {string} emptyId - 빈 목록 요소 ID (기본: 'uploadBookmarksEmpty')
     */
    displayBookmarks(listId = 'uploadBookmarksList', emptyId = 'uploadBookmarksEmpty') {
        const list = document.getElementById(listId);
        const emptyElement = document.getElementById(emptyId);
        
        if (!list) return;

        const bookmarks = this.getCurrentBookmarks();
        list.innerHTML = '';

        if (!this.#currentFileKey || bookmarks.length === 0) {
            if (emptyElement) emptyElement.style.display = 'block';
            return;
        }

        if (emptyElement) emptyElement.style.display = 'none';

        const isGoogleDrive = this.#currentFileKey.startsWith('gdrive_');
        const borderColor = isGoogleDrive ? 'border-l-4 border-blue-500' : 'border-l-4 border-gray-400';
        const bookmarkIcon = isGoogleDrive ? '🔖' : '📌';
        const iconColor = isGoogleDrive ? 'text-blue-600' : 'text-gray-600';

        bookmarks.forEach(bm => {
            const item = this.#createBookmarkItem(bm, borderColor, bookmarkIcon, iconColor);
            list.appendChild(item);
        });
    }

    /**
     * 북마크 항목 UI 생성
     * @private
     * @param {Object} bookmark - 북마크 객체
     * @param {string} borderColor - 테두리 색상 클래스
     * @param {string} icon - 아이콘
     * @param {string} iconColor - 아이콘 색상 클래스
     * @returns {HTMLElement} 북마크 항목 요소
     */
    #createBookmarkItem(bookmark, borderColor, icon, iconColor) {
        const div = document.createElement('div');
        div.className = `flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors leading-tight theme-item-bg group ${borderColor}`;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex flex-col overflow-hidden flex-1 pr-2';
        infoDiv.innerHTML = `
            <div class="font-medium text-sm truncate leading-tight theme-text-body ${iconColor}">
                <span class="mr-1">${icon}</span>${bookmark.preview || '북마크'}
            </div>
            <div class="text-[10px] theme-text-body opacity-70 leading-tight">
                위치: ${bookmark.position.toFixed(1)}%
            </div>
        `;
        
        infoDiv.onclick = () => this.jumpToBookmark(bookmark);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 flex-shrink-0';
        delBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        `;
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm('삭제하시겠습니까?')) {
                this.removeBookmark(bookmark.timestamp);
                this.displayBookmarks();
            }
        };
        
        div.appendChild(infoDiv);
        div.appendChild(delBtn);
        
        return div;
    }
// src/js/modules/BookmarkManager.js 클래스 내부 맨 아래

    /**
     * [수정됨] 현재 파일의 북마크 데이터 반환 (settings.js 연동)
     */
    getData(fileKey) {
        if (!fileKey) return [];
        const allBookmarks = getBookmarks(); // settings.js에서 가져오기
        return allBookmarks[fileKey] || [];
    }

    /**
     * [수정됨] 외부 데이터(MD 파일)에서 북마크 복원
     */
    importData(fileKey, dataList) {
        if (!fileKey || !dataList || !Array.isArray(dataList)) return;
        
        const allBookmarks = getBookmarks();
        allBookmarks[fileKey] = dataList;
        
        setBookmarks(allBookmarks); // settings.js를 통해 저장
        console.log(`🔖 북마크 ${dataList.length}개 복원 완료`);
        
        // 화면 갱신
        this.displayBookmarks(); 
    }}

