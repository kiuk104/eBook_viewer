/**
 * 뷰어 모듈 - 클래스 기반 모듈 패턴
 * 뷰어 모듈 진입점
 */

import { FileManager } from './modules/FileManager.js';
import { ContentRenderer } from './modules/ContentRenderer.js';
import { BookmarkManager } from './modules/BookmarkManager.js';
import { HistoryManager } from './modules/HistoryManager.js';
import { StyleManager } from './modules/StyleManager.js';
import { formatFileSize, formatTimestamp } from './utils.js';
import { saveReadingProgress, loadReadingProgress } from './settings.js';
import { HighlightManager } from './modules/HighlightManager.js';

/**
 * 뷰어 코디네이터 클래스
 */
export class ViewerCoordinator {
    #fileManager;
    #renderer;
    #bookmarkManager;
    #historyManager;
    #styleManager;
    #scrollSaveTimer = null;
    #highlightManager;
    #appInfoHideTimer = null;  // ← 추가
    #lastScrollY = 0;            // ← 추가
    // 편집 관련 (추가)
    #editHistory = [];           // 편집 히스토리
    #editHistoryIndex = -1;      // 현재 히스토리 인덱스
    #isEditMode = false;         // 편집 모드 활성화 여부
    #originalContent = '';       // 원본 콘텐츠
    #lastSaveTime = null;        // 마지막 저장 시간
    // 디버깅 서비스 관련
    #debugServiceAvailable = null; // null: 미확인, true: 사용 가능, false: 사용 불가
    // 선택 영역 만료 타이머
    #selectionExpireTimer = null;
    // 자동 저장 타이머
    #autoSaveTimer = null;
    // 자동 저장 함수들
    #autoSaveFunctions = null;
    // 로컬스토리지 자동 저장 타이머
    #localStorageAutoSaveTimer = null;

    /**
     * 자동 저장 설정 (5분마다)
     */
    #setupAutoSave() {
        // 편집 모드 활성화 시 타이머 시작
        const startAutoSave = () => {
            if (this.#autoSaveTimer) {
                clearInterval(this.#autoSaveTimer);
            }
            
            // 5분마다 자동 저장
            this.#autoSaveTimer = setInterval(() => {
                if (this.#isEditMode) {
                    const viewerContent = document.getElementById('viewerContent');
                    if (viewerContent && viewerContent.innerHTML !== this.#originalContent) {
                        this.saveEditedContentNow();
                        console.log('🕐 자동 저장 완료');
                    }
                }
            }, 5 * 60 * 1000); // 5분
        };
        
        // 편집 모드 비활성화 시 타이머 정지
        const stopAutoSave = () => {
            if (this.#autoSaveTimer) {
                clearInterval(this.#autoSaveTimer);
                this.#autoSaveTimer = null;
            }
        };
        
        return { startAutoSave, stopAutoSave };
    }

    /**
     * 선택 영역 자동 저장 설정
     */
    #setupSelectionSaving() {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return;
        
        // mouseup 이벤트로 선택 영역 저장
        viewerContent.addEventListener('mouseup', () => {
            if (!this.#isEditMode) return;
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
                // 기존 만료 타이머 취소
                if (this.#selectionExpireTimer) {
                    clearTimeout(this.#selectionExpireTimer);
                }
                
                // 선택 영역을 전역 변수에 저장
                window.lastSelectionRange = selection.getRangeAt(0).cloneRange();
                const selectedText = selection.toString();
                
                console.log('💾 선택 영역 저장됨:', selectedText.substring(0, 30) + '...');
                
                // 선택 영역 표시 UI (토스트 메시지)
                const previewText = selectedText.length > 20 
                    ? selectedText.substring(0, 20) + '...' 
                    : selectedText;
                this.#showToast(`💾 "${previewText}" 저장됨`, 1000);
                
                // 5초 후 선택 영역 자동 삭제
                this.#selectionExpireTimer = setTimeout(() => {
                    if (window.lastSelectionRange) {
                        window.lastSelectionRange = null;
                        console.log('⏰ 선택 영역 만료됨 (5초)');
                    }
                }, 5000);
            }
        });
        
        console.log('✅ 선택 영역 자동 저장 활성화');
    }

    /**
     * 링크 수정/삭제 이벤트 설정
     */
    #setupLinkEvents() {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return;
        
        // 더블클릭: 링크 수정
        viewerContent.addEventListener('dblclick', (e) => {
            if (!this.#isEditMode) return;
            
            const link = e.target.closest('a');
            if (link) {
                e.preventDefault();
                e.stopPropagation();
                this.#editLink(link);
            }
        });
        
        // Alt+클릭: 링크 삭제
        viewerContent.addEventListener('click', (e) => {
            if (!this.#isEditMode) return;
            
            const link = e.target.closest('a');
            if (link && e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                this.#removeLink(link);
            }
        });
        
        // 우클릭: 컨텍스트 메뉴
        viewerContent.addEventListener('contextmenu', (e) => {
            if (!this.#isEditMode) return;
            
            const link = e.target.closest('a');
            if (link) {
                e.preventDefault();
                e.stopPropagation();
                this.#showLinkContextMenu(e, link);
            }
        });
        
        console.log('✅ 링크 수정/삭제 이벤트 설정 완료');
    }

    /**
     * 링크 URL 수정
     */
    #editLink(link) {
        const currentUrl = link.href;
        const currentText = link.textContent;
        
        // URL 수정 대화상자
        const newUrl = prompt('링크 URL을 수정하세요:', currentUrl);
        
        // 취소 버튼 클릭 시
        if (newUrl === null) return;
        
        // URL이 비어있으면 링크 삭제
        if (!newUrl.trim()) {
            this.#removeLink(link);
            return;
        }
        
        // URL 유효성 검사
        try {
            new URL(newUrl.trim());
        } catch {
            this.#showToast('⚠️ 올바른 URL 형식이 아닙니다');
            return;
        }
        
        // URL 업데이트
        link.href = newUrl.trim();
        
        // 링크 텍스트도 수정할지 확인
        const changeText = confirm('링크 텍스트도 수정하시겠습니까?');
        if (changeText) {
            const newText = prompt('링크 텍스트:', currentText);
            if (newText && newText.trim()) {
                link.textContent = newText.trim();
            }
        }
        
        console.log('🔗 링크 수정됨:', newUrl);
        this.#showToast('🔗 링크가 수정되었습니다');
        
        // 히스토리 저장
        setTimeout(() => this.#saveToHistory(), 100);
    }

    /**
     * 링크 제거 (텍스트는 유지)
     */
    #removeLink(link) {
        const text = link.textContent;
        
        // 확인 대화상자
        if (!confirm(`링크를 제거하시겠습니까?\n\n"${text}"\n\n(텍스트는 유지됩니다)`)) {
            return;
        }
        
        // 텍스트 노드로 교체
        const textNode = document.createTextNode(text);
        link.parentNode.replaceChild(textNode, link);
        
        console.log('🗑️ 링크 제거됨:', text);
        this.#showToast('🗑️ 링크가 제거되었습니다');
        
        // 히스토리 저장
        setTimeout(() => this.#saveToHistory(), 100);
    }

    /**
     * 링크 컨텍스트 메뉴 표시
     */
    #showLinkContextMenu(e, link) {
        // 기존 메뉴 제거
        const oldMenu = document.getElementById('linkContextMenu');
        if (oldMenu) oldMenu.remove();
        
        // 메뉴 생성
        const menu = document.createElement('div');
        menu.id = 'linkContextMenu';
        menu.className = 'fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[200px]';
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        
        menu.innerHTML = `
            <div class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2" data-action="edit">
                <span>✏️</span>
                <span class="flex-1">링크 수정</span>
                <span class="text-xs opacity-50">더블클릭</span>
            </div>
            <div class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2" data-action="copy">
                <span>📋</span>
                <span class="flex-1">URL 복사</span>
            </div>
            <div class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2" data-action="open">
                <span>🔗</span>
                <span class="flex-1">새 탭에서 열기</span>
            </div>
            <div class="border-t border-gray-200 dark:border-gray-600 my-1"></div>
            <div class="px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer flex items-center gap-2 text-red-600 dark:text-red-400" data-action="remove">
                <span>🗑️</span>
                <span class="flex-1">링크 제거</span>
                <span class="text-xs opacity-50">Alt+클릭</span>
            </div>
        `;
        
        // 메뉴 클릭 이벤트
        menu.addEventListener('click', async (e) => {
            const item = e.target.closest('[data-action]');
            if (!item) return;
            
            const action = item.dataset.action;
            
            switch(action) {
                case 'edit':
                    this.#editLink(link);
                    break;
                case 'copy':
                    try {
                        await navigator.clipboard.writeText(link.href);
                        this.#showToast('📋 URL이 복사되었습니다');
                    } catch (err) {
                        this.#showToast('❌ 복사 실패');
                    }
                    break;
                case 'open':
                    window.open(link.href, '_blank', 'noopener,noreferrer');
                    break;
                case 'remove':
                    this.#removeLink(link);
                    break;
            }
            
            menu.remove();
        });
        
        // 외부 클릭 시 메뉴 닫기
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
        
        document.body.appendChild(menu);
    }

    /**
     * 키보드 단축키 설정
     */
    #setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z: 실행 취소
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.#undo();
            }
            
            // Ctrl+Y 또는 Ctrl+Shift+Z: 다시 실행
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                this.#redo();
            }
            
        // Ctrl+S: 즉시 저장
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (this.#isEditMode) {
                this.saveEditedContentNow(); // 즉시 저장
            }
        }
            
            // Esc: 편집 모드 종료
            if (e.key === 'Escape' && this.#isEditMode) {
                this.toggleEditPanel();
            }
        });
    }

    constructor() {
        // [중요] 전역 인스턴스 등록
        window.viewer = this; 

        this.#fileManager = new FileManager();
        this.#renderer = new ContentRenderer();
        this.#bookmarkManager = new BookmarkManager();
        this.#historyManager = new HistoryManager();
        this.#styleManager = new StyleManager();
        this.#highlightManager = new HighlightManager();

        this.#renderer.setViewerElement('viewerContent');
        this.#setupEventListeners();
        this.#restoreReadingStatsSettings();
        this.#setupKeyboardShortcuts();
        this.#setupSelectionSaving(); // 선택 영역 자동 저장
        this.#setupLinkEvents(); // 링크 수정/삭제 이벤트
        this.#autoSaveFunctions = this.#setupAutoSave(); // 자동 저장 설정
    }

    #setupEventListeners() {
        window.addEventListener('scroll', () => {
            this.#handleScroll();
            this.#handleAppInfoVisibility();
        }, { passive: true });
    }

    #handleScroll() {
        const fileKey = this.#fileManager.getCurrentFileKey();
        if (!fileKey) return;

        this.#updateProgressBar();
        this.#updateReadingStats();  // ← 추가

        if (this.#scrollSaveTimer) {
            clearTimeout(this.#scrollSaveTimer);
        }

        this.#scrollSaveTimer = setTimeout(() => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;
            const progress = scrollHeight > clientHeight
                ? (scrollTop / (scrollHeight - clientHeight)) * 100
                : 0;
            saveReadingProgress(fileKey, progress);
        }, 500);
    }

    #updateProgressBar() {
        const bar = document.getElementById('reading-progress-bar');
        const container = document.getElementById('reading-progress-container');
        if (!bar || !container) return;

        container.classList.remove('hidden');
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        const progress = scrollHeight > clientHeight
            ? (scrollTop / (scrollHeight - clientHeight)) * 100
            : 0;
        bar.style.width = `${progress}%`;
    }

    /**
     * 읽기 진행률 업데이트 (킨들 스타일)
     */
    #updateReadingStats() {
        const container = document.getElementById('reading-stats-container');
        if (!container) return;

        // 설정 확인
        const isEnabled = localStorage.getItem('showReadingStats') !== 'false';
        if (!isEnabled) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;

        // 퍼센트 계산
        const percentage = scrollHeight > clientHeight
            ? ((scrollTop / (scrollHeight - clientHeight)) * 100)
            : 0;

        // 위치 계산 (전체 높이를 1000 단위로 나눔 - 킨들 스타일)
        const location = Math.round((scrollTop / scrollHeight) * 1000);

        // DOM 업데이트
        const locationEl = document.getElementById('current-location');
        const percentageEl = document.getElementById('reading-percentage');

        if (locationEl) locationEl.textContent = location;
        if (percentageEl) percentageEl.textContent = percentage.toFixed(1);
    }

    /**
     * 앱 정보 자동 숨김 처리 (스크롤 시)
     */
    #handleAppInfoVisibility() {
        const appInfo = document.getElementById('app-info');
        if (!appInfo) return;

        const currentScrollY = window.scrollY;

        // 스크롤을 내리면 숨김 (100px 이상)
        if (currentScrollY > this.#lastScrollY && currentScrollY > 100) {
            appInfo.style.opacity = '0';
            appInfo.style.pointerEvents = 'none';
        } 
        // 스크롤을 올리거나 상단 근처면 표시
        else if (currentScrollY < this.#lastScrollY || currentScrollY < 50) {
            appInfo.style.opacity = '1';
            appInfo.style.pointerEvents = 'none';
        }

        this.#lastScrollY = currentScrollY;
    }

    /**
     * 읽기 진행률 설정 복원
     */
    #restoreReadingStatsSettings() {
        const isEnabled = localStorage.getItem('showReadingStats') !== 'false';
        const toggle = document.getElementById('showReadingStatsToggle');
        const container = document.getElementById('reading-stats-container');

        if (toggle) {
            toggle.checked = isEnabled;
        }

        if (container) {
            container.style.display = isEnabled ? 'block' : 'none';
        }

        console.log(`📊 읽기 진행률 표시 설정 복원: ${isEnabled ? 'ON' : 'OFF'}`);
    }

    /**
     * 읽기 진행률 표시 토글
     */
    toggleReadingStats() {
        const toggle = document.getElementById('showReadingStatsToggle');
        const container = document.getElementById('reading-stats-container');

        if (!toggle) return;

        const isEnabled = toggle.checked;
        localStorage.setItem('showReadingStats', isEnabled);

        if (container) {
            container.style.display = isEnabled ? 'block' : 'none';
        }

        // 현재 상태 즉시 업데이트
        if (isEnabled) {
            this.#updateReadingStats();
        }

        console.log(`📊 읽기 진행률 표시: ${isEnabled ? 'ON' : 'OFF'}`);
    }

    processFiles(fileList) {
        console.log('📂 processFiles 호출됨:', fileList);
        const file = this.#fileManager.processFiles(fileList);
        
        if (!file) {
            console.error('❌ FileManager가 유효한 파일을 반환하지 않음');
            return;
        }

        // 파일이 확인되면 즉시 displayFileContent 호출
        this.displayFileContent(file);
    }

    /**
     * 외부 디버깅 서비스 사용 가능 여부 확인 (1회만 체크)
     * @private
     * @returns {Promise<boolean>} 서비스 사용 가능 여부
     */
    async #checkDebugService() {
        // 이미 확인했으면 캐시된 값 반환
        if (this.#debugServiceAvailable !== null) {
            return this.#debugServiceAvailable;
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 500); // 0.5초 타임아웃
            
            const response = await fetch('http://127.0.0.1:7242/health', {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            this.#debugServiceAvailable = response.ok;
        } catch (error) {
            // 연결 실패 시 디버깅 서비스 사용 안 함 (에러 로그 없음)
            this.#debugServiceAvailable = false;
        }
        
        return this.#debugServiceAvailable;
    }

    /**
     * 디버깅 로그 전송 (조건부)
     * @private
     * @param {Object} logData - 로그 데이터
     */
    async #sendDebugLog(logData) {
        const serviceAvailable = await this.#checkDebugService();
        if (serviceAvailable) {
            fetch('http://127.0.0.1:7242/ingest/5e932710-e410-434a-9147-6530d2b93666', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData)
            }).catch(() => {}); // 에러 무시
        }
    }

    /**
     * [강화됨] 파일 내용 표시 (화면 강제 전환 우선 실행)
     */
    async displayFileContent(file) {
        // 디버깅 로그 전송 (조건부)
        this.#sendDebugLog({
            location: 'viewer.js:98',
            message: 'displayFileContent entry',
            data: {
                fileName: file?.name,
                hasContent: !!file?.content,
                contentLength: file?.content?.length,
                isBlob: file instanceof Blob
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'H1,H2,H3'
        });
        
        console.log('📂 displayFileContent 시작:', file.name); 

        // [핵심 1] 데이터를 읽기 전에 화면부터 "뷰어 모드"로 바꿉니다. (체감 속도 향상 및 버그 방지)
        this.#forceSwitchToViewerMode();

        if (!file) return;

        // [핵심 2] 파일 내용 읽기 (안전장치)
        if (!file.content) {
            // 디버깅 로그 전송 (조건부)
            this.#sendDebugLog({
                location: 'viewer.js:107',
                message: 'file.content is empty, attempting FileReader',
                data: {
                    isBlob: file instanceof Blob,
                    fileType: file?.constructor?.name
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'H3'
            });
            
            console.log('📖 내용이 비어있어 FileReader로 읽기를 시도합니다.');
            try {
                if (file instanceof Blob) {
                    file.content = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = (e) => reject(e);
                        reader.readAsText(file);
                    });
                    // 디버깅 로그 전송 (조건부)
                    this.#sendDebugLog({
                        location: 'viewer.js:116',
                        message: 'FileReader success',
                        data: { contentLength: file.content?.length },
                        timestamp: Date.now(),
                        sessionId: 'debug-session',
                        runId: 'run1',
                        hypothesisId: 'H3'
                    });
    } else {
                    // 디버깅 로그 전송 (조건부)
                    this.#sendDebugLog({
                        location: 'viewer.js:118',
                        message: 'Not a Blob, cannot read',
                        data: { fileType: file?.constructor?.name },
                        timestamp: Date.now(),
                        sessionId: 'debug-session',
                        runId: 'run1',
                        hypothesisId: 'H3'
                    });
                    
                    console.warn('⚠️ Blob 타입이 아니어서 내용을 읽을 수 없습니다.');
                    file.content = ""; 
                }
            } catch (e) {
                // 디버깅 로그 전송 (조건부)
                this.#sendDebugLog({
                    location: 'viewer.js:122',
                    message: 'FileReader error',
                    data: { error: e.message },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'H3'
                });
                
                console.warn('⚠️ 파일 읽기 실패:', e);
                file.content = "파일을 읽는 도중 오류가 발생했습니다."; 
            }
        }

        const safeContent = file.content || ""; 
        // 디버깅 로그 전송 (조건부)
        this.#sendDebugLog({
            location: 'viewer.js:127',
            message: 'Before metadata parsing',
            data: {
                contentLength: safeContent.length,
        fileName: file.name,
                isMarkdown: file.name?.toLowerCase().endsWith('.md')
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'H1,H4'
        });
        
        console.log(`📄 콘텐츠 길이: ${safeContent.length}자`);

        // 3. 메타데이터 파싱 (match 에러 방지됨)
        const metadataRegex = /$/;
        const match = safeContent.match(metadataRegex);
        
        // 디버깅 로그 전송 (조건부)
        this.#sendDebugLog({
            location: 'viewer.js:132',
            message: 'Metadata regex match result',
            data: {
                hasMatch: !!match,
                matchLength: match?.length,
                match1: match?.[1]
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'H4'
        });

        // 디버깅 로그 전송 (조건부)
        this.#sendDebugLog({
            location: 'viewer.js:155',
            message: 'Before setCurrentFile',
            data: { fileName: file.name },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run2',
            hypothesisId: 'H6'
        });
        try {
            this.#fileManager.setCurrentFile(file);
        } catch(e) {
            // 디버깅 로그 전송 (조건부)
            this.#sendDebugLog({
                location: 'viewer.js:158',
                message: 'setCurrentFile error',
                data: { error: e.message },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run2',
                hypothesisId: 'H6'
            });
            
            console.error('setCurrentFile error:', e);
        }
        const fileKey = this.#fileManager.getCurrentFileKey();
        
        // 디버깅 로그 전송 (조건부)
        this.#sendDebugLog({
            location: 'viewer.js:163',
            message: 'After setCurrentFile',
            data: { fileKey: fileKey },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run2',
            hypothesisId: 'H6'
        });

        if (match && match[1]) {
            try {
                const jsonStr = match[1];
                
                // 디버깅 로그 전송 (조건부)
                this.#sendDebugLog({
                    location: 'viewer.js:158',
                    message: 'Attempting to parse metadata',
                    data: {
                        jsonStr: jsonStr,
                        jsonStrType: typeof jsonStr
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'H4'
                });
                
                const metadata = JSON.parse(jsonStr);
                
                if (metadata.highlights && this.#highlightManager) {
                    this.#highlightManager.importData(fileKey, metadata.highlights);
                }
                if (metadata.bookmarks && this.#bookmarkManager) {
                    this.#bookmarkManager.importData(fileKey, metadata.bookmarks);
                }
                
                // 화면 표시용 콘텐츠에서는 메타데이터 제거
                file.content = safeContent.replace(metadataRegex, '');
            } catch (e) {
                // 디버깅 로그 전송 (조건부)
                this.#sendDebugLog({
                    location: 'viewer.js:171',
                    message: 'Metadata parsing error',
                    data: { error: e.message },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'H4'
                });
                
                console.error('메타데이터 파싱 실패:', e);
            }
    } else {
            // 디버깅 로그 전송 (조건부)
            this.#sendDebugLog({
                location: 'viewer.js:175',
                message: 'No metadata found, skipping parsing',
                data: {
                    hasMatch: !!match,
                    hasMatch1: !!match?.[1]
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'H4'
            });
        }

        this.#bookmarkManager.setCurrentFileKey(fileKey);
        this.#highlightManager.setCurrentFileKey(fileKey);
        
        // 4. 렌더링 시작
        // 디버깅 로그 전송 (조건부)
        this.#sendDebugLog({
            location: 'viewer.js:182',
            message: 'Before render call',
            data: {
                fileName: file.name,
                contentLength: file.content?.length,
                isMarkdown: file.name?.toLowerCase().endsWith('.md'),
                hasRenderer: !!this.#renderer
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'H1,H5'
        });
        
        try {
            await this.#renderer.render(file.content || "", file.name);
            
            // 렌더링 완료 후 mainContent가 확실히 보이도록 강제 확인
            const mainContent = document.getElementById('mainContent');
            if (mainContent) {
                mainContent.classList.remove('hidden');
                mainContent.style.display = 'block';
                mainContent.style.visibility = 'visible';
                mainContent.style.opacity = '1';
            }
            
            // viewerContent도 확실히 보이도록
            const viewerContent = document.getElementById('viewerContent');
            if (viewerContent) {
                viewerContent.classList.remove('hidden');
                viewerContent.style.display = '';
                viewerContent.style.visibility = 'visible';
                viewerContent.style.opacity = '1';
            }
            
            // 파일명 UI 업데이트
            this.#updateFileNameDisplay(file.name);
            
            console.log('✅ 렌더링 완료');
        } catch (renderError) {
            console.error('❌ 렌더링 중 치명적 오류:', renderError);
            alert('화면을 그리는 도중 오류가 발생했습니다.');
        }
        
        this.#restoreReadingPosition();
        
        // 하이라이트 복원 (렌더링 직후)
    setTimeout(() => {
            console.log('🎨 하이라이트 복원 시작...');
            this.#highlightManager.restoreHighlights();
            console.log('✅ 하이라이트 복원 완료');
        }, 100);
        
        setTimeout(() => this.#updateProgressBar(), 100);
        this.#bookmarkManager.displayBookmarks();
    }

    /**
     * [수정됨] UI 강제 전환 함수 (무조건 뷰어를 보여줌)
     * 
     * 중요: HTML 구조상 mainContent가 page-upload 안에 있으므로,
     * page-upload를 숨기면 mainContent도 숨겨집니다.
     * 따라서 uploadAreaContainer만 숨기고 mainContent를 표시합니다.
     */
    #forceSwitchToViewerMode() {
        const mainContent = document.getElementById('mainContent');
        const uploadAreaContainer = document.getElementById('uploadAreaContainer');
        const viewerContent = document.getElementById('viewerContent');

        console.log('🔄 UI 전환 시작 - 뷰어 모드로 전환');

        // 1. 메인 뷰어 보이기 (최우선)
        if (mainContent) {
            mainContent.classList.remove('hidden');
            mainContent.style.display = 'block';
            mainContent.style.visibility = 'visible';
            mainContent.style.opacity = '1';
            console.log('✅ mainContent 표시 완료');
        } else {
            console.error('❌ mainContent 요소를 찾을 수 없습니다!');
        }

        // 2. 업로드 패널 완전히 숨기기
        if (uploadAreaContainer) {
            // translate-y-full로 화면 밖으로 밀어냄
            uploadAreaContainer.classList.remove('translate-y-0');
            uploadAreaContainer.classList.add('-translate-y-full');
            
            // 토글 버튼 텍스트 변경
            const btnText = document.getElementById('uploadToggleText');
            const btnIcon = document.getElementById('uploadToggleIcon');
            if (btnText) btnText.textContent = '패널 펼치기';
            if (btnIcon) btnIcon.textContent = '▼';
            
            console.log('✅ uploadAreaContainer 숨김 완료');
        } else {
            console.error('❌ uploadAreaContainer 요소를 찾을 수 없습니다!');
        }

        // 3. viewerContent 요소도 확실히 보이게
        if (viewerContent) {
            viewerContent.classList.remove('hidden');
            viewerContent.style.display = 'block';
            viewerContent.style.visibility = 'visible';
            viewerContent.style.opacity = '1';
            console.log('✅ viewerContent 표시 완료');
    } else {
            console.error('❌ viewerContent 요소를 찾을 수 없습니다!');
        }

        console.log('🎉 UI 전환 완료!');
    }

    /**
     * [신규] 파일명 UI 업데이트 함수
     */
    #updateFileNameDisplay(fileName) {
        const fileNameElement = document.getElementById('currentFileName');
        const fileInfoElement = document.getElementById('fileInfo');
        
        if (fileNameElement) {
            fileNameElement.textContent = fileName || '파일명 없음';
            console.log(`📝 파일명 업데이트: ${fileName}`);
        }
        
        if (fileInfoElement) {
            const file = this.#fileManager.getCurrentFile();
            if (file && file.content) {
                const size = formatFileSize(file.content.length);
                const chars = file.content.length.toLocaleString();
                fileInfoElement.textContent = `크기: ${size} (${chars}자)`;
            }
        }
    }

    downloadCurrentFile() {
        const file = this.#fileManager.getCurrentFile();
        const fileKey = this.#fileManager.getCurrentFileKey();

        if (!file || !file.content) {
            alert('저장할 내용이 없습니다.');
        return;
    }
    
        const highlights = this.#highlightManager.getData(fileKey);
        const bookmarks = this.#bookmarkManager.getData(fileKey);

        const metadata = {
            highlights: highlights || [],
            bookmarks: bookmarks || [] 
        };

        const footer = `\n\n`;
        
        const blob = new Blob([file.content + footer], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.endsWith('.md') ? file.name : file.name + '.md';
        
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    #renderContent(content, fileName) {
        const wrapMode = localStorage.getItem('wrapMode') || 'auto';
        this.#renderer.render(content, fileName, { wrapMode });
        this.#restoreReadingPosition();
        
        setTimeout(() => {
            if (window.restoreHighlights) window.restoreHighlights();
    }, 100);

        setTimeout(() => this.#updateProgressBar(), 100);
        this.#bookmarkManager.displayBookmarks();
    }

    #restoreReadingPosition() {
        const fileKey = this.#fileManager.getCurrentFileKey();
        if (!fileKey) return;

        const savedPos = loadReadingProgress(fileKey);
        if (savedPos !== null) {
            setTimeout(() => {
                const h = document.documentElement.scrollHeight;
                const ch = window.innerHeight;
                if (h > ch) {
                    window.scrollTo({
                        top: (savedPos / 100) * (h - ch),
                        behavior: 'auto'
                    });
                }
                this.#updateProgressBar();
            }, 150);
        }
    }

    // === Public API ===

    applyHighlight(range, color) {
        return this.#highlightManager.addHighlight(range, color);
    }

    removeHighlight(element) {
        this.#highlightManager.removeHighlight(element);
    }

    toggleBookmark() {
        try {
            const fileName = this.#fileManager.getCurrentFileName();
            const bookmark = this.#bookmarkManager.addBookmark({ fileName });
            this.#bookmarkManager.displayBookmarks();
            alert('북마크가 추가되었습니다.');
        } catch (error) {
            alert(error.message);
        }
    }

    toggleWrapMode() {
        const newMode = this.#renderer.toggleWrapMode();
        const btn = document.getElementById('wrapModeBtn');
        if (btn) {
            btn.textContent = `줄바꿈: ${newMode === 'auto' ? '자동' : '원본'}`;
        }
        return newMode;
    }

    toggleUploadSection() {
        const container = document.getElementById('uploadAreaContainer');
        const btnText = document.getElementById('uploadToggleText');
        if (!container) return;

        if (container.classList.contains('translate-y-0')) {
            container.classList.remove('translate-y-0');
            container.classList.add('-translate-y-full');
            if (btnText) btnText.textContent = '패널 펼치기';
    } else {
            container.classList.remove('-translate-y-full');
            container.classList.add('translate-y-0');
            if (btnText) btnText.textContent = '패널 접기';
        }
    }

    displayUploadHistory() {
        this.#historyManager.displayHistory();
    }

    displayUploadBookmarks() {
        this.#bookmarkManager.displayBookmarks();
    }

    selectFiles() {
        this.#fileManager.selectFiles();
    }

    toggleSettings() {
        const panel = document.getElementById('settingsPanel');
        const grid = document.getElementById('uploadSectionContent');
        const btn = document.getElementById('settingsToggleBtn');
        
        if (panel && grid) {
            if (panel.classList.contains('hidden')) {
                panel.classList.remove('hidden');
                grid.classList.add('hidden');
                if (btn) btn.innerHTML = '📂 불러오기';
    } else {
                panel.classList.add('hidden');
                grid.classList.remove('hidden');
                if (btn) btn.innerHTML = '⚙️ 설정';
            }
        }
    }

    toggleHistorySection() {
        const section = document.getElementById('historySectionContent');
        if (section) section.classList.toggle('hidden');
    }

    toggleBookmarksSection() {
        const section = document.getElementById('bookmarksSectionContent');
        if (section) section.classList.toggle('hidden');
    }

    updateMarkdownStyles() {
        const fontSelect = document.getElementById('markdownHeadingFont');
        const sizeSlider = document.getElementById('headingSizeSlider');
        const headingColor = document.getElementById('headingColor');
        const tocColor = document.getElementById('tocColor');

        if (!fontSelect) return;

        this.#styleManager.updateMarkdownStyles({
            font: fontSelect.value,
            size: sizeSlider ? parseFloat(sizeSlider.value) : 1.0,
            headingColor: headingColor ? headingColor.value : '#2563eb',
            tocColor: tocColor ? tocColor.value : '#2563eb'
        });
    }

    updateBodyStyles() {
        const lineHeightSlider = document.getElementById('lineHeightSlider');
        const fontFamilySelect = document.getElementById('bodyFontFamily');
        const colorInput = document.getElementById('bodyTextColor');

        if (!lineHeightSlider || !fontFamilySelect || !colorInput) return;

        this.#styleManager.updateBodyStyles({
            lineHeight: parseFloat(lineHeightSlider.value),
            fontFamily: fontFamilySelect.value,
            color: colorInput.value
        });
    }

    updateTextStroke() {
        const slider = document.getElementById('textStrokeSlider');
        if (slider) {
            this.#styleManager.updateTextStroke(parseFloat(slider.value));
        }
    }

    updateViewerWidth() {
        const slider = document.getElementById('viewerWidthSlider');
        const toggle = document.getElementById('fullWidthToggle');
        
        if (slider) {
            const isFullWidth = toggle ? toggle.checked : false;
            this.#styleManager.updateViewerWidth(
                parseInt(slider.value),
                isFullWidth
            );
        }
    }

    toggleFullWidth() {
        const toggle = document.getElementById('fullWidthToggle');
        const slider = document.getElementById('viewerWidthSlider');
        
        if (toggle && slider) {
            const isFullWidth = toggle.checked;
            slider.disabled = isFullWidth;
            this.updateViewerWidth();
        }
    }

    restoreMarkdownStyles() {
        this.#styleManager.restoreMarkdownStyles();
    }

    restoreBodyStyles() {
        this.#styleManager.restoreBodyStyles();
    }

    restoreViewerWidth() {
        this.#styleManager.restoreViewerWidth();
    }

    restoreWrapMode() {
        const savedMode = localStorage.getItem('wrapMode') || 'auto';
        this.#renderer.restoreWrapMode(savedMode);
        
        const btn = document.getElementById('wrapModeBtn');
        if (btn) {
            btn.textContent = `줄바꿈: ${savedMode === 'auto' ? '자동' : '원본'}`;
        }
    }

    getFiles() { return this.#fileManager.getFiles(); }
    setFiles(files) { this.#fileManager.setFiles(files); }
    getCurrentFileIndex() { return this.#fileManager.getCurrentFileIndex(); }
    setCurrentFileIndex(index) { this.#fileManager.setCurrentFileIndex(index); }
    getCurrentFileKey() { return this.#fileManager.getCurrentFileKey(); }
    
    setCurrentFileKey(fileKey) {
        this.#fileManager.setCurrentFileKey(fileKey);
        this.#bookmarkManager.setCurrentFileKey(fileKey);
        if(this.#highlightManager) {
            this.#highlightManager.setCurrentFileKey(fileKey);
        }
    }

    getCurrentFileName() {
        return this.#fileManager.getCurrentFileName();
    }

    /**
     * 모든 링크 목록 가져오기
     */
    getAllLinks() {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return [];
        
        const links = viewerContent.querySelectorAll('a');
        return Array.from(links).map(link => ({
            text: link.textContent,
            url: link.href
        }));
    }

    /**
     * 편집 패널 토글 (개선)
     */
    toggleEditPanel() {
        const editPanel = document.getElementById('editPanel');
        const uploadSectionContent = document.getElementById('uploadSectionContent');
        const settingsPanel = document.getElementById('settingsPanel');
        const btn = document.getElementById('editPanelToggleBtn');
        const viewerContent = document.getElementById('viewerContent');
        
        if (editPanel && uploadSectionContent) {
            // 설정 패널이 열려있으면 닫기
            if (settingsPanel && !settingsPanel.classList.contains('hidden')) {
                settingsPanel.classList.add('hidden');
            }
            
            if (editPanel.classList.contains('hidden')) {
                // 편집 패널 열기
                editPanel.classList.remove('hidden');
                uploadSectionContent.classList.add('hidden');
                
                // 편집 모드 활성화
                this.#enableEditMode();
                
                if (btn) {
                    btn.innerHTML = '<span>✏️</span> <span>편집 중...</span>';
                    btn.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'text-white');
                    btn.classList.add('bg-red-500', 'hover:bg-red-600', 'text-white');
                }
    } else {
                // 편집 패널 닫기
                editPanel.classList.add('hidden');
                uploadSectionContent.classList.remove('hidden');
                
                // 편집 모드 비활성화
                this.#disableEditMode();
                
                if (btn) {
                    btn.innerHTML = '<span>✏️</span> <span>편집</span>';
                    btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'text-white');
                    btn.classList.add('bg-blue-500', 'hover:bg-blue-600', 'text-white');
                }
            }
    }
}

/**
     * 편집 모드 활성화
     */
    #enableEditMode() {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return;
        
        this.#isEditMode = true;
        
        // 원본 콘텐츠 저장
        this.#originalContent = viewerContent.innerHTML;
        
        // contentEditable 활성화
        viewerContent.contentEditable = 'true';
        viewerContent.style.outline = '2px dashed #3b82f6';
        viewerContent.style.outlineOffset = '4px';
        
        // 편집 히스토리 초기화
        this.#editHistory = [this.#originalContent];
        this.#editHistoryIndex = 0;
        
        // input 이벤트 리스너 추가 (자동 히스토리 저장)
        viewerContent.addEventListener('input', this.#handleContentInput.bind(this));
        
        // 로컬스토리지에서 복원 시도
        this.#restoreFromLocalStorage();
        
        // 자동 저장 시작
        if (this.#autoSaveFunctions) {
            this.#autoSaveFunctions.startAutoSave();
        }
        
        // 로컬스토리지 자동 저장 타이머 (30초마다)
        if (this.#localStorageAutoSaveTimer) {
            clearInterval(this.#localStorageAutoSaveTimer);
        }
        this.#localStorageAutoSaveTimer = setInterval(() => {
            this.#saveToLocalStorage();
            console.log('🕐 자동 저장됨 (로컬스토리지)');
        }, 30000); // 30초
        
        // 상태 표시 초기화
        this.#updateEditStatus('editing');
        
        console.log('✏️ 편집 모드 활성화됨');
    }
   
    /**
     * 편집 모드 비활성화
     */
    #disableEditMode() {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return;
        
        this.#isEditMode = false;
        
        // contentEditable 비활성화
        viewerContent.contentEditable = 'false';
        viewerContent.style.outline = 'none';
        
        // 이벤트 리스너 제거
        viewerContent.removeEventListener('input', this.#handleContentInput.bind(this));
        
        // 자동 저장 정지
        if (this.#autoSaveFunctions) {
            this.#autoSaveFunctions.stopAutoSave();
        }
        
        // 로컬스토리지 자동 저장 타이머 정지
        if (this.#localStorageAutoSaveTimer) {
            clearInterval(this.#localStorageAutoSaveTimer);
            this.#localStorageAutoSaveTimer = null;
        }
        
        // 로컬스토리지 정리
        this.#clearLocalStorage();
        
        console.log('✏️ 편집 모드 비활성화됨');
        
        // 변경사항이 있으면 확인
        if (viewerContent.innerHTML !== this.#originalContent) {
            const save = confirm('편집한 내용을 저장하시겠습니까?\n\n저장하면 현재 파일의 내용이 업데이트됩니다.');
            if (save) {
                this.saveEditedContent();
            } else {
                // 원본으로 복원
                viewerContent.innerHTML = this.#originalContent;
                console.log('🔄 원본 콘텐츠로 복원됨');
        }
    }
}

/**
     * 콘텐츠 입력 처리 (자동 히스토리 저장)
     */
    #handleContentInput = (() => {
        let timeout;
        return (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.#saveToHistory();
                this.#updateEditStatus('modified'); // 상태 업데이트
            }, 500); // 0.5초 후 히스토리 저장
        };
    })();
    
    /**
     * 히스토리에 저장
     */
    #saveToHistory() {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return;
        
        const currentContent = viewerContent.innerHTML;
        
        // 마지막 히스토리와 다른 경우에만 저장
        if (this.#editHistory[this.#editHistoryIndex] !== currentContent) {
            // 현재 인덱스 이후의 히스토리 삭제 (새로운 분기)
            this.#editHistory = this.#editHistory.slice(0, this.#editHistoryIndex + 1);
            
            // 새 히스토리 추가
            this.#editHistory.push(currentContent);
            this.#editHistoryIndex++;
            
            // 히스토리 최대 50개 유지
            if (this.#editHistory.length > 50) {
                this.#editHistory.shift();
                this.#editHistoryIndex--;
            }
            
            console.log(`📝 히스토리 저장: ${this.#editHistoryIndex + 1}/${this.#editHistory.length}`);
    }
}

/**
     * 편집 내용 저장 및 다운로드
     */
    saveEditedContent() {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return;
        
        const fileKey = this.#fileManager.getCurrentFileKey();
    if (!fileKey) {
            this.#showToast('❌ 저장할 파일이 없습니다');
        return;
    }
    
        try {
            const currentFile = this.#fileManager.getFiles()[this.#fileManager.getCurrentFileIndex()];
            if (!currentFile) {
                this.#showToast('❌ 파일을 찾을 수 없습니다');
        return;
    }
    
            // HTML → 마크다운 변환
            const markdownContent = this.#htmlToMarkdown(viewerContent.innerHTML);
            
            // Blob 생성
            const blob = new Blob([markdownContent], { type: 'text/markdown; charset=utf-8' });
            
            // 파일명 생성 (타임스탬프 추가)
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const fileName = currentFile.name.replace(/\.(md|txt)$/i, `_edited_${timestamp}.md`);
            
            // 자동 다운로드
            this.#downloadFile(blob, fileName);
            
            // 메모리에도 업데이트 (선택사항)
            const newFile = new File([blob], currentFile.name, { 
                type: 'text/markdown',
                lastModified: Date.now()
            });
            const files = this.#fileManager.getFiles();
            files[this.#fileManager.getCurrentFileIndex()] = newFile;
            this.#fileManager.setFiles(files);
            
            // 원본 콘텐츠 업데이트
            this.#originalContent = viewerContent.innerHTML;
            
            // 마지막 저장 시간 업데이트
            this.#lastSaveTime = new Date();
            
            // 상태 업데이트
            this.#updateEditStatus('saved');
            
            console.log('💾 저장 및 다운로드 완료:', fileName);
            this.#showToast('💾 파일이 저장되어 다운로드되었습니다');
            
        } catch (error) {
            console.error('저장 실패:', error);
            this.#showToast('❌ 저장 중 오류가 발생했습니다');
        }
    }

    /**
     * 파일 다운로드
     */
    #downloadFile(blob, fileName) {
        // URL 생성
        const url = URL.createObjectURL(blob);
        
        // 다운로드 링크 생성
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        
        // 클릭 이벤트 트리거
        document.body.appendChild(a);
        a.click();
        
        // 정리
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log('📥 다운로드 시작:', fileName);
    }

    /**
     * 로컬스토리지에 임시 저장
     */
    #saveToLocalStorage() {
        if (!this.#isEditMode) return;
        
        const viewerContent = document.getElementById('viewerContent');
        const fileKey = this.#fileManager.getCurrentFileKey();
        
        if (viewerContent && fileKey) {
            try {
                const content = viewerContent.innerHTML;
                localStorage.setItem(`edited_${fileKey}`, content);
                localStorage.setItem(`edited_${fileKey}_timestamp`, Date.now().toString());
                console.log('💾 로컬스토리지에 저장됨');
            } catch (e) {
                console.warn('로컬스토리지 저장 실패:', e);
            }
        }
    }

    /**
     * 로컬스토리지에서 복원
     */
    #restoreFromLocalStorage() {
        const fileKey = this.#fileManager.getCurrentFileKey();
    if (!fileKey) return false;
        
        try {
            const savedContent = localStorage.getItem(`edited_${fileKey}`);
            const savedTime = localStorage.getItem(`edited_${fileKey}_timestamp`);
            
            if (savedContent) {
                const viewerContent = document.getElementById('viewerContent');
                if (viewerContent) {
                    const useStored = confirm(
                        `이전에 편집하던 내용이 있습니다.\n\n` +
                        `저장 시각: ${new Date(parseInt(savedTime)).toLocaleString()}\n\n` +
                        `복원하시겠습니까?`
                    );
                    
                    if (useStored) {
                        viewerContent.innerHTML = savedContent;
                        console.log('🔄 로컬스토리지에서 복원됨');
                        this.#showToast('🔄 이전 편집 내용이 복원되었습니다');
                        return true;
                    }
                }
            }
        } catch (e) {
            console.warn('로컬스토리지 복원 실패:', e);
        }
        
        return false;
    }

    /**
     * 로컬스토리지 임시 저장 삭제
     */
    #clearLocalStorage() {
        const fileKey = this.#fileManager.getCurrentFileKey();
        if (fileKey) {
            localStorage.removeItem(`edited_${fileKey}`);
            localStorage.removeItem(`edited_${fileKey}_timestamp`);
        }
    }

/**
     * 편집된 파일 다운로드
     */
downloadEditedFile() {
    if (!this.#isEditMode) {
        this.#showToast('⚠️ 편집 모드가 아닙니다');
        return;
    }
    
    const viewerContent = document.getElementById('viewerContent');
    if (!viewerContent) return;
    
    const fileKey = this.#fileManager.getCurrentFileKey();
    if (!fileKey) {
        this.#showToast('❌ 다운로드할 파일이 없습니다');
        return;
    }
    
    try {
        const currentFile = this.#fileManager.getFiles()[this.#fileManager.getCurrentFileIndex()];
        if (!currentFile) {
            this.#showToast('❌ 파일을 찾을 수 없습니다');
            return;
        }
        
        // HTML → 마크다운 변환
        const markdownContent = this.#htmlToMarkdown(viewerContent.innerHTML);
        
        // Blob 생성
        const blob = new Blob([markdownContent], { 
            type: 'text/markdown; charset=utf-8' 
        });
        
        // 파일명에 타임스탬프 추가
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const baseName = currentFile.name.replace(/\.(md|txt)$/i, '');
        const fileName = `${baseName}_edited_${timestamp}.md`;
        
        // 다운로드
        this.#downloadFile(blob, fileName);
        
        console.log('📥 파일 다운로드:', fileName);
        this.#showToast('📥 파일이 다운로드되었습니다');
        
    } catch (error) {
        console.error('다운로드 실패:', error);
        this.#showToast('❌ 다운로드 중 오류가 발생했습니다');
    }
}

/**
     * 즉시 저장 (확인 없이)
     */
saveEditedContentNow() {
    if (!this.#isEditMode) {
        this.#showToast('⚠️ 편집 모드가 아닙니다');
        return;
    }
    
    const viewerContent = document.getElementById('viewerContent');
    if (!viewerContent) return;
    
    const fileKey = this.#fileManager.getCurrentFileKey();
    if (!fileKey) {
        this.#showToast('❌ 저장할 파일이 없습니다');
        return;
    }
    
    try {
        // 현재 파일 가져오기
        const currentFile = this.#fileManager.getFiles()[this.#fileManager.getCurrentFileIndex()];
        if (!currentFile) {
            this.#showToast('❌ 파일을 찾을 수 없습니다');
            return;
        }
        
        // HTML → 마크다운 변환
        const markdownContent = this.#htmlToMarkdown(viewerContent.innerHTML);
        
        // 새 파일 생성
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const newFile = new File([blob], currentFile.name, { 
            type: 'text/markdown',
            lastModified: Date.now()
        });
        
        // 파일 업데이트
        const files = this.#fileManager.getFiles();
        files[this.#fileManager.getCurrentFileIndex()] = newFile;
        this.#fileManager.setFiles(files);
        
        // 원본 콘텐츠 업데이트 (저장 후에는 현재 내용이 새 원본)
        this.#originalContent = viewerContent.innerHTML;
        
        // 마지막 저장 시간 업데이트
        this.#lastSaveTime = new Date();
        
        // 상태 업데이트
        this.#updateEditStatus('saved');
        
        console.log('💾 즉시 저장 완료:', currentFile.name);
        this.#showToast('💾 저장되었습니다');
        
    } catch (error) {
        console.error('저장 실패:', error);
        this.#showToast('❌ 저장 중 오류가 발생했습니다');
    }
}

/**
     * 원본으로 되돌리기
     */
restoreOriginal() {
    if (!this.#isEditMode) {
        this.#showToast('⚠️ 편집 모드가 아닙니다');
        return;
    }
    
    const viewerContent = document.getElementById('viewerContent');
    if (!viewerContent) return;
    
    // 변경사항이 있는지 확인
    if (viewerContent.innerHTML === this.#originalContent) {
        this.#showToast('ℹ️ 변경된 내용이 없습니다');
        return;
    }
    
    // 확인 대화상자
    const confirm = window.confirm(
        '원본으로 되돌리시겠습니까?\n\n현재 편집한 모든 내용이 삭제됩니다.'
    );
    
    if (confirm) {
        // 원본 복원
        viewerContent.innerHTML = this.#originalContent;
        
        // 히스토리 초기화
        this.#editHistory = [this.#originalContent];
        this.#editHistoryIndex = 0;
        
        // 상태 업데이트
        this.#updateEditStatus('restored');
        
        console.log('🔄 원본으로 복원됨');
        this.#showToast('🔄 원본으로 되돌렸습니다');
    }
}

/**
     * 편집 패널 닫기 (저장 여부 확인)
     */
closeEditPanel() {
    const viewerContent = document.getElementById('viewerContent');
    if (!viewerContent) {
        this.toggleEditPanel();
        return;
    }
    
    // 변경사항이 있으면 저장 여부 확인
    if (this.#isEditMode && viewerContent.innerHTML !== this.#originalContent) {
        const save = confirm(
            '편집한 내용을 저장하시겠습니까?\n\n' +
            '예: 저장 후 닫기\n' +
            '아니오: 저장하지 않고 닫기\n' +
            '취소: 계속 편집'
        );
        
        if (save === null) {
            // 취소 - 계속 편집
            return;
        } else if (save) {
            // 예 - 저장 후 닫기
            this.saveEditedContentNow();
        }
        // 아니오 - 저장하지 않고 닫기 (아래로 계속)
    }
    
    // 편집 패널 닫기
    this.toggleEditPanel();
}

/**
     * 편집 상태 표시 업데이트
     */
    #updateEditStatus(status) {
    const statusElement = document.getElementById('editStatus');
    if (!statusElement) return;
    
    const viewerContent = document.getElementById('viewerContent');
    const isModified = viewerContent && viewerContent.innerHTML !== this.#originalContent;
    const count = this.#editHistory.length - 1; // 원본 제외한 변경 횟수
    
    switch(status) {
        case 'saved':
            if (this.#lastSaveTime) {
                statusElement.innerHTML = `
                    <span class="text-green-600 dark:text-green-400">✅ 저장됨</span>
                    <span class="text-xs opacity-50">
                        (${this.#lastSaveTime.toLocaleTimeString()})
                    </span>
                `;
        } else {
                statusElement.innerHTML = '<span class="text-green-600 dark:text-green-400">✅ 저장됨</span>';
            }
            break;
        case 'modified':
            statusElement.innerHTML = `
                <span class="text-orange-600 dark:text-orange-400">✏️ 수정됨</span>
                <span class="text-xs opacity-50">(${count}회)</span>
            `;
            break;
        case 'restored':
            statusElement.innerHTML = '<span class="text-blue-600 dark:text-blue-400">🔄 복원됨</span>';
            break;
        default:
            if (isModified) {
                statusElement.innerHTML = `
                    <span class="text-orange-600 dark:text-orange-400">✏️ 수정됨</span>
                    <span class="text-xs opacity-50">(${count}회)</span>
                `;
            } else {
                statusElement.innerHTML = '<span class="opacity-70">편집 중...</span>';
            }
    }
}

/**
     * HTML을 마크다운으로 변환 (간단한 버전)
     */
    #htmlToMarkdown(html) {
        let markdown = html;
        
        // 기본 변환 규칙
        markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n');
        markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n');
        markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n');
        markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, '#### $1\n');
        markdown = markdown.replace(/<h5>(.*?)<\/h5>/g, '##### $1\n');
        markdown = markdown.replace(/<h6>(.*?)<\/h6>/g, '###### $1\n');
        
        markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
        markdown = markdown.replace(/<b>(.*?)<\/b>/g, '**$1**');
        markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
        markdown = markdown.replace(/<i>(.*?)<\/i>/g, '*$1*');
        markdown = markdown.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
        markdown = markdown.replace(/<del>(.*?)<\/del>/g, '~~$1~~');
        
        markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
        markdown = markdown.replace(/<br\s*\/?>/g, '\n');
        markdown = markdown.replace(/<div>(.*?)<\/div>/g, '$1\n');
        
        // HTML 태그 제거
        markdown = markdown.replace(/<[^>]+>/g, '');
        
        // HTML 엔티티 디코딩
        markdown = markdown.replace(/&nbsp;/g, ' ');
        markdown = markdown.replace(/&lt;/g, '<');
        markdown = markdown.replace(/&gt;/g, '>');
        markdown = markdown.replace(/&amp;/g, '&');
        
        return markdown.trim();
    }

    /**
     * 편집 액션 처리 (개선)
     */
    handleEditAction(action) {
        const selection = window.getSelection();
        const viewerContent = document.getElementById('viewerContent');
        
        switch(action) {
            case 'copy':
                try {
                    document.execCommand('copy');
                    console.log('📋 복사됨');
                    this.#showToast('📋 복사되었습니다');
                } catch (e) {
                    console.error('복사 실패:', e);
                }
                break;
                
            case 'cut':
                try {
                    document.execCommand('cut');
                    console.log('✂️ 잘라내기');
                    this.#showToast('✂️ 잘라냈습니다');
                    if (this.#isEditMode) this.#saveToHistory();
                } catch (e) {
                    console.error('잘라내기 실패:', e);
                }
                break;
                
            case 'paste':
                try {
                    document.execCommand('paste');
                    console.log('📌 붙여넣기');
                    this.#showToast('📌 붙여넣었습니다');
                    if (this.#isEditMode) {
                        setTimeout(() => this.#saveToHistory(), 100);
                    }
                } catch (e) {
                    console.warn('붙여넣기는 보안상 제한될 수 있습니다:', e);
                    this.#showToast('⚠️ 붙여넣기 실패 (보안 제한)');
                }
                break;
                
            case 'selectAll':
                if (viewerContent) {
                    const range = document.createRange();
                    range.selectNodeContents(viewerContent);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    console.log('✅ 전체 선택됨');
                    this.#showToast('✅ 전체 선택되었습니다');
                }
                break;
                
            case 'undo':
                this.#undo();
                break;
                
            case 'redo':
                this.#redo();
                break;
        }
        
        // 컨텍스트 메뉴 닫기
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.classList.add('hidden');
        }
    }
    
    /**
     * 실행 취소
     */
    #undo() {
        if (!this.#isEditMode) {
            this.#showToast('⚠️ 편집 모드에서만 실행 취소가 가능합니다');
        return;
    }
    
        if (this.#editHistoryIndex > 0) {
            this.#editHistoryIndex--;
            const viewerContent = document.getElementById('viewerContent');
            if (viewerContent) {
                viewerContent.innerHTML = this.#editHistory[this.#editHistoryIndex];
                console.log(`↩️ 실행 취소: ${this.#editHistoryIndex + 1}/${this.#editHistory.length}`);
                this.#showToast(`↩️ 실행 취소 (${this.#editHistoryIndex + 1}/${this.#editHistory.length})`);
            }
        } else {
            console.log('↩️ 더 이상 실행 취소할 수 없습니다');
            this.#showToast('↩️ 더 이상 실행 취소할 수 없습니다');
        }
    }
    
    /**
     * 다시 실행
     */
    #redo() {
        if (!this.#isEditMode) {
            this.#showToast('⚠️ 편집 모드에서만 다시 실행이 가능합니다');
            return;
        }
        
        if (this.#editHistoryIndex < this.#editHistory.length - 1) {
            this.#editHistoryIndex++;
            const viewerContent = document.getElementById('viewerContent');
            if (viewerContent) {
                viewerContent.innerHTML = this.#editHistory[this.#editHistoryIndex];
                console.log(`↪️ 다시 실행: ${this.#editHistoryIndex + 1}/${this.#editHistory.length}`);
                this.#showToast(`↪️ 다시 실행 (${this.#editHistoryIndex + 1}/${this.#editHistory.length})`);
            }
    } else {
            console.log('↪️ 더 이상 다시 실행할 수 없습니다');
            this.#showToast('↪️ 더 이상 다시 실행할 수 없습니다');
    }
}

/**
     * 실행 취소 (public wrapper)
     */
    undo() {
        this.#undo();
    }

    /**
     * 다시 실행 (public wrapper)
     */
    redo() {
        this.#redo();
    }

/**
     * 토스트 메시지 표시
     * @param {string} message - 표시할 메시지
     * @param {number} duration - 표시 시간 (밀리초, 기본값: 2000)
     */
    #showToast(message, duration = 2000) {
        // 기존 토스트 제거
        const existingToast = document.getElementById('editToast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 새 토스트 생성
        const toast = document.createElement('div');
        toast.id = 'editToast';
        toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
        toast.style.animation = `fadeInOut ${duration}ms ease-in-out`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // duration 후 제거
        setTimeout(() => {
            toast.remove();
        }, duration);
    }
    
    /**
     * 텍스트 포맷 적용 (개선)
     */
    applyTextFormat(format) {
        if (!this.#isEditMode) {
            this.#showToast('⚠️ 먼저 편집 모드를 활성화하세요');
        return;
    }
    
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            this.#showToast('⚠️ 텍스트를 먼저 선택하세요');
        return;
    }
    
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        
        if (!selectedText) {
            this.#showToast('⚠️ 텍스트를 먼저 선택하세요');
        return;
    }
    
        let element;
        
        switch(format) {
            case 'bold':
                element = document.createElement('strong');
                break;
            case 'italic':
                element = document.createElement('em');
                break;
            case 'underline':
                element = document.createElement('u');
                break;
            case 'strikethrough':
                element = document.createElement('del');
                break;
        }
        
        try {
            element.textContent = selectedText;
            range.deleteContents();
            range.insertNode(element);
            
            console.log(`✨ ${format} 적용됨`);
            this.#showToast(`✨ ${format} 적용됨`);
            
            // 히스토리 저장
            setTimeout(() => this.#saveToHistory(), 100);
        } catch (e) {
            console.error('포맷 적용 실패:', e);
            this.#showToast('❌ 포맷 적용 실패');
        }
    }

    /**
     * 마크다운 변환 (실제 HTML 요소로 삽입)
     */
    convertToMarkdown(type) {
        if (!this.#isEditMode) {
            this.#showToast('⚠️ 먼저 편집 모드를 활성화하세요');
            return;
        }
        
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            alert('텍스트를 먼저 선택하세요.');
            return;
        }
    
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        
        if (!selectedText) {
            alert('텍스트를 먼저 선택하세요.');
            return;
        }
        
        let element;
        
        try {
            switch(type) {
                case 'heading':
                    element = document.createElement('h2');
                    element.textContent = selectedText;
                    break;
                case 'quote':
                    element = document.createElement('blockquote');
                    element.textContent = selectedText;
                    break;
                case 'list':
                    element = document.createElement('ul');
                    const lines = selectedText.split('\n').filter(line => line.trim().length > 0);
                    lines.forEach(line => {
                        const li = document.createElement('li');
                        li.textContent = line.trim();
                        element.appendChild(li);
                    });
                    break;
                case 'code':
                    element = document.createElement('code');
                    element.textContent = selectedText;
                    break;
            }
            
            if (element) {
                range.deleteContents();
                range.insertNode(element);
                
                // 히스토리 저장
                setTimeout(() => this.#saveToHistory(), 100);
                
                console.log(`🔄 ${type} 변환 완료`);
                this.#showToast(`✨ ${type} 적용됨`);
            }
        } catch (e) {
            console.error('변환 실패:', e);
            this.#showToast('❌ 변환 실패');
        }
    }

    /**
     * 텍스트 정렬
     */
    alignText(alignment) {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return;
        
        viewerContent.style.textAlign = alignment;
        console.log(`📐 ${alignment} 정렬 적용`);
    }

    /**
     * 링크 삽입 (실제 HTML 요소로 삽입)
     */
    insertLink() {
        if (!this.#isEditMode) {
            this.#showToast('⚠️ 먼저 편집 모드를 활성화하세요');
        return;
    }
    
        const urlInput = document.getElementById('linkUrlInput');
        if (!urlInput) return;
        
        const url = urlInput.value.trim();
        if (!url) {
            this.#showToast('⚠️ URL을 입력하세요');
            return;
        }
    
        // 선택 영역 가져오기 (현재 선택 또는 저장된 선택 영역)
        const selection = window.getSelection();
        let range = null;
        let selectedText = '';
        
        // 현재 선택 영역이 있으면 사용
        if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
            range = selection.getRangeAt(0);
            selectedText = selection.toString();
        } 
        // 저장된 선택 영역이 있으면 사용
        else if (window.lastSelectionRange) {
            range = window.lastSelectionRange.cloneRange();
            selectedText = range.toString() || '링크';
        }
        // 둘 다 없으면 경고
        else {
            this.#showToast('⚠️ 텍스트를 선택한 후 URL을 입력하세요');
            return;
        }
        
        if (range) {
            try {
                const link = document.createElement('a');
                link.href = url;
                link.textContent = selectedText || '링크';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.title = `${url}\n\n더블클릭: 수정 | Alt+클릭: 삭제 | 우클릭: 메뉴`;
                
                range.deleteContents();
                range.insertNode(link);
                
                urlInput.value = '';
                
                // 선택 영역 초기화
                if (window.lastSelectionRange) {
                    window.lastSelectionRange = null;
                }
                
                // 히스토리 저장
                setTimeout(() => this.#saveToHistory(), 100);
                
                console.log('🔗 링크 삽입됨');
                this.#showToast('🔗 링크 삽입됨');
            } catch (e) {
                console.error('링크 삽입 실패:', e);
                this.#showToast('❌ 링크 삽입 실패');
            }
        }
    }

    /**
     * 이미지 삽입 (실제 HTML 요소로 삽입)
     */
    insertImage() {
        if (!this.#isEditMode) {
            this.#showToast('⚠️ 먼저 편집 모드를 활성화하세요');
        return;
    }
    
        const urlInput = document.getElementById('imageUrlInput');
        if (!urlInput) return;
        
        const url = urlInput.value.trim();
        if (!url) {
            this.#showToast('⚠️ 이미지 URL을 입력하세요');
            return;
        }
        
        // 선택 영역 가져오기 (현재 선택 또는 저장된 선택 영역)
        const selection = window.getSelection();
        let range = null;
        
        // 현재 선택 영역이 있으면 사용
        if (selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
        } 
        // 저장된 선택 영역이 있으면 사용
        else if (window.lastSelectionRange) {
            range = window.lastSelectionRange.cloneRange();
        }
        // 둘 다 없으면 커서 위치에 삽입
        else {
            // 커서 위치에 삽입
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                range = selection.getRangeAt(0);
    } else {
                const viewerContent = document.getElementById('viewerContent');
                if (viewerContent) {
                    range = document.createRange();
                    range.selectNodeContents(viewerContent);
                    range.collapse(false); // 끝으로 이동
                }
            }
        }
        
        if (range) {
            try {
                const img = document.createElement('img');
                img.src = url;
                img.alt = '이미지';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                
                // 줄바꿈을 위해 div로 감싸기
                const container = document.createElement('div');
                container.appendChild(img);
                
                range.insertNode(container);
                urlInput.value = '';
                
                // 선택 영역 초기화
                if (window.lastSelectionRange) {
                    window.lastSelectionRange = null;
                }
                
                // 히스토리 저장
                setTimeout(() => this.#saveToHistory(), 100);
                
                console.log('🖼️ 이미지 삽입됨');
                this.#showToast('🖼️ 이미지 삽입됨');
            } catch (e) {
                console.error('이미지 삽입 실패:', e);
                this.#showToast('❌ 이미지 삽입 실패');
            }
    }
}

/**
     * 테이블 생성 (실제 HTML 요소로 삽입)
     */
    insertTable() {
        if (!this.#isEditMode) {
            this.#showToast('⚠️ 먼저 편집 모드를 활성화하세요');
        return;
    }
    
        const rowsInput = document.getElementById('tableRows');
        const colsInput = document.getElementById('tableCols');
        
        if (!rowsInput || !colsInput) return;
        
        const rows = Math.min(Math.max(parseInt(rowsInput.value) || 2, 1), 10);
        const cols = Math.min(Math.max(parseInt(colsInput.value) || 2, 1), 10);
        
        // 선택 영역 가져오기 (현재 선택 또는 저장된 선택 영역)
        const selection = window.getSelection();
        let range = null;
        
        // 현재 선택 영역이 있으면 사용
        if (selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
        } 
        // 저장된 선택 영역이 있으면 사용
        else if (window.lastSelectionRange) {
            range = window.lastSelectionRange.cloneRange();
        }
        // 둘 다 없으면 커서 위치에 삽입
        else {
            const viewerContent = document.getElementById('viewerContent');
            if (viewerContent) {
                range = document.createRange();
                range.selectNodeContents(viewerContent);
                range.collapse(false); // 끝으로 이동
            }
        }
        
        if (range) {
            try {
                const table = document.createElement('table');
                table.style.borderCollapse = 'collapse';
                table.style.width = '100%';
                table.style.margin = '1em 0';
                
                // 헤더 행
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                for (let i = 0; i < cols; i++) {
                    const th = document.createElement('th');
                    th.textContent = '헤더';
                    th.style.border = '1px solid #ddd';
                    th.style.padding = '8px';
                    th.style.textAlign = 'left';
                    headerRow.appendChild(th);
                }
                thead.appendChild(headerRow);
                table.appendChild(thead);
                
                // 본문 행
                const tbody = document.createElement('tbody');
                for (let i = 0; i < rows - 1; i++) {
                    const tr = document.createElement('tr');
                    for (let j = 0; j < cols; j++) {
                        const td = document.createElement('td');
                        td.textContent = '데이터';
                        td.style.border = '1px solid #ddd';
                        td.style.padding = '8px';
                        tr.appendChild(td);
                    }
                    tbody.appendChild(tr);
                }
                table.appendChild(tbody);
                
                // 줄바꿈을 위해 div로 감싸기
                const container = document.createElement('div');
                container.appendChild(table);
                
                range.insertNode(container);
                
                // 선택 영역 초기화
                if (window.lastSelectionRange) {
                    window.lastSelectionRange = null;
                }
                
                // 히스토리 저장
                setTimeout(() => this.#saveToHistory(), 100);
                
                console.log(`📊 ${rows}×${cols} 테이블 삽입됨`);
                this.#showToast(`📊 ${rows}×${cols} 테이블 삽입됨`);
            } catch (e) {
                console.error('테이블 삽입 실패:', e);
                this.#showToast('❌ 테이블 삽입 실패');
            }
        }
    }
}

let viewerInstance = null;

export function getViewerInstance() {
    if (!viewerInstance) {
        viewerInstance = new ViewerCoordinator();
    }
    return viewerInstance;
}

const viewer = getViewerInstance();

export const processFiles = (fileList) => viewer.processFiles(fileList);
export const displayFileContent = (file) => viewer.displayFileContent(file);
export const toggleBookmark = () => viewer.toggleBookmark();
export const toggleWrapMode = () => viewer.toggleWrapMode();
export const toggleUploadSection = () => viewer.toggleUploadSection();
export const displayUploadHistory = () => viewer.displayUploadHistory();
export const displayUploadBookmarks = () => viewer.displayUploadBookmarks();
export const selectFiles = () => viewer.selectFiles();
export const toggleSettings = () => viewer.toggleSettings();
export const toggleHistorySection = () => viewer.toggleHistorySection();
export const toggleBookmarksSection = () => viewer.toggleBookmarksSection();
export const updateMarkdownStyles = () => viewer.updateMarkdownStyles();
export const updateBodyStyles = () => viewer.updateBodyStyles();
export const updateTextStroke = () => viewer.updateTextStroke();
export const updateViewerWidth = () => viewer.updateViewerWidth();
export const toggleFullWidth = () => viewer.toggleFullWidth();
export const restoreMarkdownStyles = () => viewer.restoreMarkdownStyles();
export const restoreBodyStyles = () => viewer.restoreBodyStyles();
export const restoreViewerWidth = () => viewer.restoreViewerWidth();
export const restoreWrapMode = () => viewer.restoreWrapMode();
export const getFiles = () => viewer.getFiles();
export const setFiles = (files) => viewer.setFiles(files);
export const getCurrentFileIndex = () => viewer.getCurrentFileIndex();
export const setCurrentFileIndex = (index) => viewer.setCurrentFileIndex(index);
export const getAllLinks = () => viewer.getAllLinks();
// 새로 추가
export const toggleReadingStats = () => viewer.toggleReadingStats();

export const downloadAsMarkdown = () => {
    const viewerElement = document.getElementById('viewerContent');
    const fileName = viewer.getCurrentFileName();
    if (viewerElement && fileName) {
        const content = viewerElement.textContent || viewerElement.innerHTML;
        const isHtml = viewerElement.innerHTML !== viewerElement.textContent;
        import('./utils.js').then(module => {
            module.downloadAsMarkdown(content, fileName, isHtml);
        });
    } else {
        alert('다운로드할 내용이 없습니다.');
    }
};
export const toggleEditPanel = () => viewer.toggleEditPanel();
export const handleEditAction = (action) => viewer.handleEditAction(action);
export const applyTextFormat = (format) => viewer.applyTextFormat(format);
export const convertToMarkdown = (type) => viewer.convertToMarkdown(type);
export const alignText = (alignment) => viewer.alignText(alignment);
export const insertLink = () => viewer.insertLink();
export const insertImage = () => viewer.insertImage();
export const insertTable = () => viewer.insertTable();

// 편집 기능 추가 export
export const undoEdit = () => viewer.undo();
export const redoEdit = () => viewer.redo();
export const saveEditedContent = () => viewer.saveEditedContent();
export const cancelEdit = () => viewer.toggleEditPanel();
export const saveEditedContentNow = () => viewer.saveEditedContentNow();
export const restoreOriginal = () => viewer.restoreOriginal();
export const closeEditPanel = () => viewer.closeEditPanel();
export const downloadEditedFile = () => viewer.downloadEditedFile();

export const handleAIClean = async () => {
    const files = viewer.getFiles();
    const currentIndex = viewer.getCurrentFileIndex();
    
    if (currentIndex === -1 || !files[currentIndex]) {
        alert('변환할 파일이 없습니다.');
        return;
    }
    
    const currentFile = files[currentIndex];
    const content = currentFile.content; 
    
    if (!content) {
        alert('변환할 텍스트 내용이 비어있습니다. 파일을 다시 열어주세요.');
        return;
    }
    
    if (confirm('AI 변환을 시작하시겠습니까? 시간이 걸릴 수 있습니다.')) {
        try {
            const aiService = await import('./ai_service.js');
            const cleanedText = await aiService.cleanTextWithAI(content, (progress) => {
                console.log(progress);
            });
            
            const newFileName = currentFile.name.replace(/\.[^/.]+$/, "") + ".md";
            const newFile = new File([cleanedText], newFileName, { type: "text/markdown" });
            newFile.content = cleanedText;

            const newFiles = [...files];
            newFiles[currentIndex] = newFile;
            viewer.setFiles(newFiles);

            viewer.displayFileContent(newFile);
            
            alert('AI 변환이 완료되었습니다! (마크다운 포맷 적용됨)');
            
        } catch (error) {
            console.error('AI 변환 오류:', error);
            alert('AI 변환 중 오류가 발생했습니다: ' + error.message);
        }
    }
};

export const toggleFavorite = () => {
    alert('즐겨찾기 기능은 곧 추가될 예정입니다.');
};

export const resetAllSettings = () => {
    if (confirm('모든 설정을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        localStorage.clear();
        alert('모든 설정이 초기화되었습니다. 페이지를 새로고침합니다.');
        window.location.reload();
    }
};

export const exportData = () => {
    const data = {
        bookmarks: localStorage.getItem('readerBookmarks'),
        history: localStorage.getItem('readerHistory'),
        settings: {
            theme: localStorage.getItem('readerTheme'),
            fontSize: localStorage.getItem('readerFontSize'),
        },
        version: '0.3.0',
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebook_viewer_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importData = () => {
    const input = document.getElementById('importDataInput');
    if (input) {
        input.click();
    }
};

export const handleImportDataFile = (file) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.bookmarks) localStorage.setItem('readerBookmarks', data.bookmarks);
            if (data.history) localStorage.setItem('readerHistory', data.history);
            if (data.settings) {
                if (data.settings.theme) localStorage.setItem('readerTheme', data.settings.theme);
                if (data.settings.fontSize) localStorage.setItem('readerFontSize', data.settings.fontSize);
            }
            alert('데이터를 성공적으로 불러왔습니다. 페이지를 새로고침합니다.');
            window.location.reload();
        } catch (error) {
            alert('데이터 불러오기 실패: ' + error.message);
        }
    };
    reader.readAsText(file);
};

// --- 컨텍스트 메뉴 관련 함수들 ---
let lastSelectionRange = null;
window.lastSelectionRange = null; // 전역 접근을 위해 window 객체에도 할당
let activeHighlightSpan = null;

function showMenuAt(x, y) {
    const contextMenu = document.getElementById('contextMenu');
    if (!contextMenu) return;
    
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.classList.remove('hidden');
}

function hideContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
        contextMenu.classList.add('hidden');
    }
    activeHighlightSpan = null;
}

function handleMouseUp() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
        lastSelectionRange = selection.getRangeAt(0).cloneRange();
        window.lastSelectionRange = lastSelectionRange; // window 객체에도 할당
        console.log('✅ mouseup: 선택 영역 자동 저장됨');
    }
}

function handleContextMenu(e) {
    if (e.ctrlKey) return;
    e.preventDefault();

    const contextMenu = document.getElementById('contextMenu');
    const ctxRemoveHighlight = document.getElementById('ctxRemoveHighlight');
    const highlightPalette = document.getElementById('highlightPalette');
    const normalMenuOptions = document.getElementById('normalMenuOptions');

    if (!contextMenu) return;

    const target = e.target;
    const isHighlight = target.classList.contains('highlight-span');
    
    activeHighlightSpan = isHighlight ? target : null;

    if (ctxRemoveHighlight) {
        if (isHighlight) {
            ctxRemoveHighlight.classList.remove('hidden');
            ctxRemoveHighlight.classList.add('flex');
    } else {
            ctxRemoveHighlight.classList.add('hidden');
            ctxRemoveHighlight.classList.remove('flex');
        }
    }

    const selection = window.getSelection();
    const hasSelection = selection.toString().trim().length > 0;
    
    if (highlightPalette) {
        if (hasSelection) {
            highlightPalette.classList.remove('hidden');
            highlightPalette.classList.add('flex');
            if (selection.rangeCount > 0) {
                lastSelectionRange = selection.getRangeAt(0).cloneRange();
                window.lastSelectionRange = lastSelectionRange; // window 객체에도 할당
            }
    } else {
            highlightPalette.classList.add('hidden');
            highlightPalette.classList.remove('flex');
            lastSelectionRange = null;
            window.lastSelectionRange = null; // window 객체에도 할당
        }
    }

    if (normalMenuOptions) {
        normalMenuOptions.classList.remove('hidden');
    }

    const x = e.clientX;
    const y = e.clientY;
    
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.classList.remove('hidden');

    const rect = contextMenu.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) {
        contextMenu.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (y + rect.height > window.innerHeight) {
        contextMenu.style.top = `${window.innerHeight - rect.height - 10}px`;
    }
}

export function setupContextMenuListener() {
            const viewerContent = document.getElementById('viewerContent');
    const contextMenu = document.getElementById('contextMenu');
    if (!viewerContent || !contextMenu) return;
    
    restoreContextMenuSetting();
    
    viewerContent.removeEventListener('contextmenu', handleContextMenu);
    viewerContent.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('click', hideContextMenu);
    
    const isEnabled = localStorage.getItem('contextMenuEnabled') !== 'false';
    
    if (isEnabled) {
        viewerContent.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('click', hideContextMenu);
        viewerContent.addEventListener('mouseup', handleMouseUp);
        console.log('✅ 커스텀 컨텍스트 메뉴 활성화됨');
    }
}

export const restoreContextMenuSetting = () => {
    const enabled = localStorage.getItem('contextMenuEnabled') !== 'false';
    const toggleSettings = document.getElementById('ctxMenuSettingsToggle');
    const toggleInternal = document.getElementById('ctxMenuInternalToggle');
    if (toggleSettings) toggleSettings.checked = enabled;
    if (toggleInternal) toggleInternal.checked = enabled;
};

export const toggleContextMenuSetting = (id) => {
    const clickedToggle = document.getElementById(id);
    const enabled = clickedToggle ? clickedToggle.checked : true;
    localStorage.setItem('contextMenuEnabled', enabled.toString());
    
    const toggleSettings = document.getElementById('ctxMenuSettingsToggle');
    const toggleInternal = document.getElementById('ctxMenuInternalToggle');
    if (toggleSettings) toggleSettings.checked = enabled;
    if (toggleInternal) toggleInternal.checked = enabled;
    
    setupContextMenuListener();
};

function setupContextMenuItems() {
    const ctxBookmark = document.getElementById('ctxBookmark');
    if (ctxBookmark) {
        ctxBookmark.addEventListener('click', () => {
            toggleBookmark();
            hideContextMenu();
        });
    }
    
    const ctxNote = document.getElementById('ctxNote');
    if (ctxNote) {
        ctxNote.addEventListener('click', () => {
            alert('각주/메모 기능은 곧 추가될 예정입니다.');
            hideContextMenu();
        });
    }
    
    const ctxShare = document.getElementById('ctxShare');
    if (ctxShare) {
        ctxShare.addEventListener('click', () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();
            if (text) {
                navigator.clipboard.writeText(text).then(() => {
                    alert('텍스트가 클립보드에 복사되었습니다.');
                });
    } else {
                alert('공유할 텍스트를 선택해주세요.');
            }
            hideContextMenu();
        });
    }
    
    const ctxSettings = document.getElementById('ctxSettings');
    if (ctxSettings) {
        ctxSettings.addEventListener('click', () => {
            toggleSettings();
            hideContextMenu();
        });
    }
    
    const ctxExpandPanel = document.getElementById('ctxExpandPanel');
    if (ctxExpandPanel) {
        ctxExpandPanel.addEventListener('click', () => {
            toggleUploadSection();
            hideContextMenu();
        });
    }
    
    const ctxRemoveHighlight = document.getElementById('ctxRemoveHighlight');
    if (ctxRemoveHighlight) {
        ctxRemoveHighlight.addEventListener('click', () => {
            if (activeHighlightSpan) {
                if (window.viewer) {
                    window.viewer.removeHighlight(activeHighlightSpan);
                }
                activeHighlightSpan = null;
                hideContextMenu();
            }
        });
    }

    const highlightPalette = document.getElementById('highlightPalette');
    if (highlightPalette) {
        highlightPalette.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-color]');
            if (button) {
                const color = button.dataset.color;
                if (lastSelectionRange) {
                    if (window.viewer) {
                        window.viewer.applyHighlight(lastSelectionRange, color);
                    }
                    lastSelectionRange = null;
                    window.lastSelectionRange = null; // window 객체에도 할당 
                } else {
                    alert('텍스트를 먼저 선택해주세요.');
                }
                hideContextMenu();            
            }
        });
    }

    const ctxDownload = document.getElementById('ctxDownload');
    if (ctxDownload) {
        ctxDownload.addEventListener('click', () => {
            if (window.viewer) {
                window.viewer.downloadCurrentFile();
            }
            hideContextMenu();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupContextMenuItems();
    
    const existingSaveBtn = document.getElementById('downloadMdBtn');
    if (existingSaveBtn) {
        existingSaveBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation(); 
            
            if (window.viewer) {
                window.viewer.downloadCurrentFile(); 
                console.log('💾 상단 버튼으로 파일 저장 완료');
            } else {
                alert('뷰어가 초기화되지 않았습니다.');
            }
        };
    }
});