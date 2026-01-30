/**
 * 에이전트 1 제안: 클래스 기반 모듈 패턴
 * 
 * 히스토리 관리 전담 클래스
 * 단일 책임: 읽기 히스토리 추가/삭제/조회, 히스토리 UI 표시
 */

import { getHistory, setHistory } from '../../settings.js';
import { formatTimestamp } from '../../utils.js';

/**
 * 히스토리 관리자 클래스
 * 파일 읽기 히스토리를 관리하고 UI에 표시합니다.
 */
export class HistoryManager {
    /**
     * 히스토리 항목 추가
     * @param {string} fileName - 파일명
     * @param {string} fileKey - 파일 키
     * @param {string} content - 파일 내용 (미리보기용)
     * @returns {Object} 추가된 히스토리 항목
     */
    addHistoryItem(fileName, fileKey, content = '') {
        const history = getHistory();
        const existingIndex = history.findIndex(item => item.fileKey === fileKey);
        
        if (existingIndex !== -1) {
            history.splice(existingIndex, 1);
        }
        
        const historyItem = {
            name: fileName,
            fileKey: fileKey,
            timestamp: Date.now(),
            preview: content ? content.substring(0, 100) : ''
        };
        
        history.unshift(historyItem);
        
        // 최대 50개로 제한
        if (history.length > 50) {
            history.splice(50);
        }
        
        setHistory(history);
        return historyItem;
    }

    /**
     * 히스토리 항목 삭제
     * @param {number} index - 삭제할 인덱스
     * @returns {boolean} 삭제 성공 여부
     */
    removeHistoryItem(index) {
        const history = getHistory();
        if (index >= 0 && index < history.length) {
            history.splice(index, 1);
            setHistory(history);
            return true;
        }
        return false;
    }

    /**
     * 전체 히스토리 가져오기
     * @returns {Array} 히스토리 배열
     */
    getHistory() {
        return getHistory();
    }

    /**
     * 파일 키로 히스토리 항목 찾기
     * @param {string} fileKey - 파일 키
     * @returns {Object | null} 히스토리 항목 또는 null
     */
    findHistoryByFileKey(fileKey) {
        const history = getHistory();
        return history.find(item => item.fileKey === fileKey) || null;
    }

    /**
     * 히스토리 목록 UI 표시
     * @param {string} listId - 목록 요소 ID (기본: 'uploadHistoryList')
     * @param {string} emptyId - 빈 목록 요소 ID (기본: 'uploadHistoryEmpty')
     * @param {Function} [onItemClick] - 항목 클릭 핸들러
     */
    displayHistory(listId = 'uploadHistoryList', emptyId = 'uploadHistoryEmpty', onItemClick = null) {
        const list = document.getElementById(listId);
        const emptyElement = document.getElementById(emptyId);
        
        if (!list) return;

        const history = this.getHistory();
        list.innerHTML = '';

        if (history.length === 0) {
            if (emptyElement) emptyElement.style.display = 'block';
            return;
        }

        if (emptyElement) emptyElement.style.display = 'none';

        history.forEach((item, index) => {
            const listItem = this.#createHistoryItem(item, index, onItemClick);
            list.appendChild(listItem);
        });
    }

    /**
     * 히스토리 항목 UI 생성
     * @private
     * @param {Object} item - 히스토리 항목
     * @param {number} index - 인덱스
     * @param {Function | null} onItemClick - 클릭 핸들러
     * @returns {HTMLElement} 히스토리 항목 요소
     */
    #createHistoryItem(item, index, onItemClick) {
        const isGoogleDrive = item.fileKey.startsWith('gdrive_');
        const isMdFile = item.name.endsWith('.md');
        const icon = isMdFile ? '📝' : '📄';
        const iconColor = isGoogleDrive ? 'text-blue-600' : 'text-gray-600';
        const borderColor = isGoogleDrive ? 'border-l-4 border-blue-500' : 'border-l-4 border-gray-400';
        const badge = isGoogleDrive
            ? '<span class="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">Drive</span>'
            : '<span class="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-semibold">Local</span>';

        const div = document.createElement('div');
        div.className = `flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors leading-tight theme-item-bg group ${borderColor}`;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex items-center gap-2 overflow-hidden flex-1 pr-2';
        infoDiv.innerHTML = `
            <span class="text-lg ${iconColor}">${icon}</span>
            <div class="flex flex-col overflow-hidden leading-tight flex-1">
                <div class="flex items-center gap-1.5">
                    <span class="font-medium truncate text-sm theme-text-body">${item.name}</span>
                    ${badge}
                </div>
                <span class="text-[10px] theme-text-body opacity-70">${formatTimestamp(item.timestamp)}</span>
            </div>
        `;
        
        if (onItemClick) {
            infoDiv.onclick = () => onItemClick(item);
        } else {
            infoDiv.onclick = () => {
                if (item.fileKey.startsWith('gdrive_')) {
                    if (window.loadLastReadGoogleDriveFile) {
                        window.loadLastReadGoogleDriveFile(item.fileKey.replace('gdrive_', ''));
                    }
                } else {
                    alert('로컬 파일은 보안상 자동으로 다시 열 수 없습니다. 파일을 다시 선택해주세요.');
                }
            };
        }
        
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
                this.removeHistoryItem(index);
                this.displayHistory(listId, emptyId, onItemClick);
            }
        };
        
        div.appendChild(infoDiv);
        div.appendChild(delBtn);
        
        return div;
    }
}

