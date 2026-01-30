/**
 * 에이전트 1 제안: 클래스 기반 모듈 패턴
 * 
 * 파일 관리 전담 클래스
 * 단일 책임: 파일 배열 관리, 파일 키 생성, 파일 선택
 */

import { generateFileKey } from '../../utils.js';
import { saveLastReadFile } from '../../settings.js';

/**
 * 파일 관리자 클래스
 * 파일 목록, 현재 파일 인덱스, 파일 키를 관리합니다.
 */
export class FileManager {
    /**
     * @private
     * @type {File[]}
     */
    #files = [];

    /**
     * @private
     * @type {number}
     */
    #currentFileIndex = -1;

    /**
     * @private
     * @type {string | null}
     */
    #currentFileKey = null;

    /**
     * 파일 목록 가져오기
     * @returns {File[]} 파일 배열
     */
    getFiles() {
        return [...this.#files]; // 복사본 반환 (불변성 유지)
    }

    /**
     * 파일 목록 설정
     * @param {File[]} files - 새 파일 배열
     */
    setFiles(files) {
        this.#files = Array.isArray(files) ? [...files] : [];
    }

    /**
     * 현재 파일 인덱스 가져오기
     * @returns {number} 현재 파일 인덱스
     */
    getCurrentFileIndex() {
        return this.#currentFileIndex;
    }

    /**
     * 현재 파일 인덱스 설정
     * @param {number} index - 새 인덱스
     */
    setCurrentFileIndex(index) {
        if (index >= 0 && index < this.#files.length) {
            this.#currentFileIndex = index;
        }
    }

    /**
     * 현재 파일 가져오기
     * @returns {File | null} 현재 파일 또는 null
     */
    getCurrentFile() {
        return this.#files[this.#currentFileIndex] || null;
    }

    /**
     * 파일 목록 처리 및 현재 파일 설정
     * @param {FileList} fileList - 파일 목록
     * @returns {File | null} 첫 번째 파일 또는 null
     */
    processFiles(fileList) {
        if (!fileList || fileList.length === 0) return null;
        
        this.setFiles(Array.from(fileList));
        this.setCurrentFileIndex(0);
        
        const currentFile = this.getCurrentFile();
        if (currentFile) {
            this.#updateCurrentFileKey(currentFile);
        }
        
        return currentFile;
    }

    /**
     * 현재 파일 키 업데이트
     * @private
     * @param {File} file - 파일 객체
     */
    #updateCurrentFileKey(file) {
        this.#currentFileKey = generateFileKey(file);
        saveLastReadFile(file, this.#currentFileKey);
    }

    /**
     * 현재 파일 키 가져오기
     * @returns {string | null} 파일 키 또는 null
     */
    getCurrentFileKey() {
        return this.#currentFileKey;
    }

    /**
     * 현재 파일 키 설정 (Google Drive 등 외부 소스에서 설정)
     * @param {string} fileKey - 파일 키
     */
    setCurrentFileKey(fileKey) {
        this.#currentFileKey = fileKey;
    }

    /**
     * 현재 파일명 가져오기
     * @returns {string} 파일명 또는 '알 수 없는 파일'
     */
    getCurrentFileName() {
        const currentFile = this.getCurrentFile();
        if (currentFile) return currentFile.name;
        return '알 수 없는 파일';
    }

    /**
     * 파일 선택 다이얼로그 열기
     * @param {string} inputId - 파일 입력 요소 ID (기본: 'file-input')
     */
    selectFiles(inputId = 'file-input') {
        const input = document.getElementById(inputId);
        if (input) input.click();
    }
}

