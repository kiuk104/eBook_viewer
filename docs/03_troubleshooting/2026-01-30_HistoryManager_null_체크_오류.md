# 🐛 HistoryManager null 체크 오류 해결 (v0.2.4.3)

## 📌 문제 상황

**증상:** 
- 로컬 파일 선택 시 화면이 표시되지 않음
- 히스토리가 로드되지 않음
- 앱 초기화가 중단됨

**로그 오류:**
```javascript
HistoryManager.js:119 Uncaught TypeError: Cannot read properties of null (reading 'startsWith')
    at #createHistoryItem (HistoryManager.js:119:44)
```

---

## 🔍 원인 분석

### 근본 원인

**HistoryManager.js 119번째 줄:**
```javascript
// ❌ 오류 발생 코드
const isGoogleDrive = item.fileKey.startsWith('gdrive_');
```

**문제:**
- 히스토리 데이터에 `fileKey: null`인 항목이 있음
- `null.startsWith()`를 호출하려고 해서 `TypeError` 발생
- 오류로 인해 `initApp()` 실행 중단
- 이벤트 리스너가 등록되지 않음
- 파일 선택 기능 작동 안 함

### 데이터 확인

**localStorage의 히스토리 첫 번째 항목:**
```json
{
  "name": "PR0123_cleaned.md",
  "fileKey": null,  // ← null 값!
  "timestamp": 1769785699972,
  "preview": "## POLARIS RHAPSODY..."
}
```

---

## 🔧 수정 내용

### HistoryManager.js (119번째 줄)

**Before:**
```javascript
#createHistoryItem(item, index, onItemClick) {
    const isGoogleDrive = item.fileKey.startsWith('gdrive_');  // ❌ null 체크 없음
    // ...
}
```

**After:**
```javascript
#createHistoryItem(item, index, onItemClick) {
    // fileKey가 null이면 로컬 파일로 간주
    const isGoogleDrive = item.fileKey ? item.fileKey.startsWith('gdrive_') : false;  // ✅ null 체크 추가
    // ...
}
```

**변경 사항:**
- `item.fileKey`가 `null` 또는 `undefined`일 때 안전하게 처리
- 삼항 연산자로 null 체크 추가
- fileKey가 없으면 로컬 파일로 간주 (`false`)

---

## ✅ 수정 효과

### 1. 앱 초기화 완료
- ✅ `initApp()` 정상 실행
- ✅ 히스토리 표시 성공
- ✅ 이벤트 리스너 등록 완료

### 2. 파일 로딩 작동
- ✅ "내 컴퓨터 파일" 버튼 작동
- ✅ 파일 선택 다이얼로그 열림
- ✅ 파일 내용 화면에 표시

### 3. 히스토리 표시
- ✅ fileKey가 null인 항목도 정상 표시
- ✅ 로컬/Drive 구분 정상 작동
- ✅ 47개 히스토리 항목 모두 표시

---

## 💡 왜 fileKey가 null인가?

### 가능한 원인

1. **구버전 데이터**
   - 이전 버전에서 fileKey를 저장하지 않았음
   - 마이그레이션 누락

2. **데이터 손상**
   - localStorage 데이터가 부분적으로 손상됨
   - 브라우저 크래시 등으로 불완전한 저장

3. **코드 버그**
   - 과거 버전에서 fileKey 저장 로직 오류
   - null 체크 누락

### 해결 방법

**임시 해결:** null 체크 추가 (현재 수정)

**장기 해결:** 데이터 마이그레이션
```javascript
// settings.js에 추가
function migrateHistoryData() {
    const history = loadHistory();
    let updated = false;
    
    history.forEach(item => {
        if (!item.fileKey) {
            // fileKey 생성
            item.fileKey = `local_${item.name}_${Date.now()}`;
            updated = true;
        }
    });
    
    if (updated) {
        localStorage.setItem('readerHistory', JSON.stringify(history));
        console.log('✅ 히스토리 데이터 마이그레이션 완료');
    }
}
```

---

## 🧪 테스트 결과

### 테스트 환경
- 로그 파일: `localhost-1769786869086.log`
- 히스토리 항목: 47개 (fileKey null 포함)
- 북마크 항목: 8개 파일, 47개 북마크

### 수정 전
```
❌ HistoryManager.js:119 TypeError
❌ initApp() 중단
❌ 파일 로딩 안 됨
❌ 이벤트 리스너 미등록
```

### 수정 후
```
✅ 히스토리 정상 표시
✅ initApp() 완료
✅ 파일 로딩 작동
✅ 모든 기능 정상
```

---

## 🎓 배운 점

### 1. Null 안전성의 중요성
```javascript
// ❌ 위험
item.fileKey.startsWith('gdrive_')

// ✅ 안전 (Optional Chaining)
item.fileKey?.startsWith('gdrive_') ?? false

// ✅ 안전 (구버전 JS)
item.fileKey ? item.fileKey.startsWith('gdrive_') : false
```

### 2. 방어적 프로그래밍
- 외부 데이터(localStorage)는 항상 검증
- null/undefined 체크 필수
- 기본값 제공

### 3. 오류 전파 차단
```javascript
// 한 곳의 오류가 전체 앱 중단
try {
    displayHistory(); // 오류 발생
} catch (error) {
    console.error('히스토리 표시 오류:', error);
    // 앱은 계속 실행
}
```

---

## 🔒 예방 조치

### 1. TypeScript 도입 검토
```typescript
interface HistoryItem {
    name: string;
    fileKey: string | null;  // 명시적 타입
    timestamp: number;
    preview?: string;
}
```

### 2. 데이터 검증 함수
```javascript
function validateHistoryItem(item) {
    return {
        name: item.name || 'Unknown',
        fileKey: item.fileKey || `local_${item.name}_${Date.now()}`,
        timestamp: item.timestamp || Date.now(),
        preview: item.preview || ''
    };
}
```

### 3. 단위 테스트
```javascript
test('HistoryManager handles null fileKey', () => {
    const item = { name: 'test.md', fileKey: null };
    const element = historyManager.createHistoryItem(item);
    expect(element).toBeDefined();
});
```

---

## 📋 관련 파일

### 수정된 파일
- `src/js/modules/HistoryManager.js` - null 체크 추가

### 영향받는 파일
- `src/js/main.js` - initApp()에서 HistoryManager 사용
- `src/js/viewer.js` - ViewerCoordinator에서 HistoryManager 사용
- `src/js/settings.js` - 히스토리 데이터 로드

---

## 📚 참고 문서

- [프로젝트 브리핑](../PROJECT_BRIEF.md)
- [개발 규칙](../DEV_NOTE.md)
- [변경 이력](../../CHANGELOG.md)

---

**버전**: v0.2.4.3  
**수정 날짜**: 2026-01-30  
**중요도**: 🔴 긴급 수정 (Critical Bugfix)  
**상태**: ✅ 해결 완료
