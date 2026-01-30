# 이북 뷰어 - GitHub 레포지토리 배포 가이드

## 📦 레포지토리 구조

```
your-repository/
├── ebook_viewer.html         # 메인 HTML 파일
├── README.md                  # 이 파일
└── src/
    ├── css/
    │   └── styles.css         # 커스텀 스타일시트
    └── js/
        ├── main.js            # 앱 초기화 및 이벤트 핸들러
        ├── config.js          # 앱 설정 및 버전 정보
        ├── utils.js           # 유틸리티 함수
        ├── settings.js        # 설정 관리
        ├── ai_service.js      # AI 변환 서비스
        ├── google_drive.js    # Google Drive 연동
        ├── viewer.js          # 뷰어 메인 로직
        └── modules/           # 클래스 기반 모듈
            ├── BookmarkManager.js      # 북마크 관리
            ├── ContentRenderer.js      # 콘텐츠 렌더링
            ├── FileManager.js          # 파일 관리
            ├── HistoryManager.js       # 히스토리 관리
            └── StyleManager.js         # 스타일 관리
```

## 🚀 GitHub Pages 배포 방법

### 1. 레포지토리 생성 및 파일 업로드

```bash
# 새 레포지토리 초기화
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial commit: eBook Viewer v0.2.4.1"

# GitHub 레포지토리와 연결
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 푸시
git push -u origin main
```

### 2. GitHub Pages 활성화

1. GitHub 레포지토리로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Pages** 클릭
4. **Source** 섹션에서:
   - Branch: `main` 선택
   - Folder: `/ (root)` 선택
5. **Save** 클릭

### 3. 접속 URL

약 1-2분 후 다음 URL로 접속 가능:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/ebook_viewer.html
```

## ⚙️ 설정 필요 사항

### Google Drive API 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성
3. **API 및 서비스** → **라이브러리**에서 "Google Drive API" 활성화
4. **사용자 인증 정보** 생성:
   - OAuth 2.0 클라이언트 ID 생성
   - 승인된 JavaScript 출처 추가:
     ```
     https://YOUR_USERNAME.github.io
     ```
   - 승인된 리디렉션 URI 추가:
     ```
     https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/ebook_viewer.html
     ```
5. API 키 생성
6. 뷰어의 **설정**에서 Client ID와 API Key 입력

### Gemini AI API 설정 (선택사항)

1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. API 키 발급
3. 뷰어의 **설정**에서 Gemini API 키 입력

## 🔧 로컬 테스트

GitHub에 푸시하기 전에 로컬에서 테스트:

```bash
# Python 3 사용
python -m http.server 8000

# 또는 Node.js 사용
npx http-server -p 8000
```

브라우저에서 접속:
```
http://localhost:8000/ebook_viewer.html
```

## 📝 Import 경로 구조

### 메인 파일 (main.js)
```javascript
import { ... } from './config.js';           // 같은 폴더
import { ... } from './settings.js';         // 같은 폴더
import { ... } from './viewer.js';           // 같은 폴더
import { ... } from './google_drive.js';     // 같은 폴더
```

### 뷰어 파일 (viewer.js)
```javascript
import { ... } from './modules/FileManager.js';    // 하위 폴더
import { ... } from './modules/ContentRenderer.js'; // 하위 폴더
import { ... } from './utils.js';                   // 같은 폴더
```

### 모듈 파일 (modules/*.js)
```javascript
import { ... } from '../settings.js';  // 상위 폴더
import { ... } from '../utils.js';     // 상위 폴더
```

## 🐛 트러블슈팅

### CORS 오류 발생 시

**문제**: `file://` 프로토콜로 열면 CORS 오류 발생

**해결책**: 반드시 웹 서버를 통해 실행 (로컬 또는 GitHub Pages)

### 모듈 로드 오류

**문제**: `Failed to resolve module specifier`

**해결책**: 
1. 모든 import 경로에 `.js` 확장자 포함 확인
2. 상대 경로 확인 (`./`, `../`)
3. 파일명 대소문자 정확히 확인

### Google Drive 버튼 작동 안 함

**문제**: 버튼 클릭 시 반응 없음

**해결책**:
1. 브라우저 콘솔(F12) 확인
2. API 키가 설정에 저장되었는지 확인
3. 웹 서버에서 실행 중인지 확인 (file:// 불가)
4. 승인된 JavaScript 출처가 올바른지 확인

### 설정이 저장되지 않음

**문제**: 페이지 새로고침 시 설정 초기화

**해결책**:
1. 브라우저 쿠키/LocalStorage 설정 확인
2. 시크릿/프라이빗 모드에서는 저장 불가
3. 브라우저 저장 공간 용량 확인

## 📊 파일 크기 제한

- HTML: ~45KB
- CSS: ~8KB
- JavaScript 전체: ~105KB
- 권장 텍스트 파일: 최대 10MB

## 🔒 보안 주의사항

1. **API 키 노출 방지**
   - GitHub 레포지토리에 API 키를 직접 커밋하지 마세요
   - 사용자가 설정에서 직접 입력하도록 구현됨

2. **LocalStorage 주의**
   - 민감한 정보는 LocalStorage에 저장되지 않도록 주의
   - API 키는 암호화되지 않고 저장됨

3. **CORS 정책**
   - Google Drive API 사용 시 승인된 출처만 접근 가능
   - 개발용과 프로덕션용 URL을 모두 등록

## 🌐 브라우저 호환성

| 브라우저 | 버전 | 지원 |
|---------|------|------|
| Chrome  | 90+  | ✅ 완전 지원 |
| Edge    | 90+  | ✅ 완전 지원 |
| Firefox | 88+  | ✅ 완전 지원 |
| Safari  | 14+  | ⚠️ 부분 지원 |

## 📚 추가 리소스

- [Google Drive API 문서](https://developers.google.com/drive/api/v3/about-sdk)
- [Google AI Studio 문서](https://ai.google.dev/docs)
- [ES6 Modules 가이드](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [GitHub Pages 문서](https://docs.github.com/en/pages)

## 🆕 업데이트 및 유지보수

### 버전 업데이트 시

1. `src/js/config.js`에서 `APP_VERSION` 수정
2. 변경사항 커밋 및 푸시
3. GitHub Pages가 자동으로 업데이트 (2-3분 소요)

### 캐시 문제 해결

사용자에게 브라우저 캐시 강제 새로고침 안내:
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

## 💡 개발 팁

### 디버깅
```javascript
// 브라우저 콘솔에서 확인 가능
console.log('현재 버전:', APP_VERSION);
console.log('설정:', localStorage);
```

### 성능 모니터링
```javascript
// Performance API 사용
performance.mark('start');
// ... 작업 ...
performance.mark('end');
performance.measure('작업 시간', 'start', 'end');
```

## 📧 문의 및 지원

버그 리포트나 기능 제안은 GitHub Issues를 통해 제출해주세요.

---

**버전**: v0.2.4.5
**최종 수정**: 2026-01-30
**라이선스**: MIT
