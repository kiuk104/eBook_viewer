# Google OAuth 2.0 설정 가이드

## 현재 설정 상태 확인

이미지에서 확인된 설정:
- ✅ **승인된 JavaScript 원본**: `http://localhost:8000` (설정 완료)
- ⚠️ **승인된 리디렉션 URI**: 비어있음 (선택 사항)

## 설정 완료 체크리스트

### 필수 설정 (완료됨)
- [x] 승인된 JavaScript 원본에 `http://localhost:8000` 추가

### 선택적 설정 (권장)
- [ ] 승인된 리디렉션 URI에 `http://localhost:8000` 추가 (팝업 인증 실패 시 대체용)

## 추가 설정 방법

### 승인된 리디렉션 URI 추가 (권장)

1. Google Cloud Console에서 현재 보고 있는 OAuth 2.0 클라이언트 ID 설정 페이지로 이동
2. **승인된 리디렉션 URI** 섹션에서 `+ URI 추가` 버튼 클릭
3. 다음 URI 추가:
   ```
   http://localhost:8000
   ```
4. **저장** 버튼 클릭

### 다른 포트를 사용하는 경우

만약 다른 포트(예: 3000, 8080)를 사용한다면:

**승인된 JavaScript 원본에 추가:**
```
http://localhost:3000
http://127.0.0.1:3000
```

**승인된 리디렉션 URI에 추가:**
```
http://localhost:3000
http://127.0.0.1:3000
```

## 애플리케이션 설정

### 클라이언트 ID 설정

앱의 설정 패널에서 다음 정보를 입력:

1. **클라이언트 ID**: 
   ```
   709167036904-180g6nf0u40hr02fmuotec1jtc1v6f9o.apps.googleusercontent.com
   ```

2. **API 키**: 
   - Google Cloud Console > API 및 서비스 > 사용자 인증 정보
   - "API 키 만들기" 또는 기존 API 키 사용
   - Google Drive API가 활성화되어 있어야 함

### 설정 위치

앱에서:
1. 설정 패널 열기
2. "Google Drive 설정" 섹션 찾기
3. 클라이언트 ID와 API 키 입력
4. 저장

## 테스트 방법

1. 로컬 서버 시작:
   ```powershell
   .\start_server.ps1
   ```

2. 브라우저에서 접속:
   ```
   http://localhost:8000/ebook_viewer.html
   ```

3. Google Drive 버튼 클릭

4. 예상 동작:
   - Google 로그인 팝업 표시
   - 권한 승인 후 파일 목록 표시

## 문제 해결

### "idpiframe_initialization_failed" 오류

**원인**: 승인된 JavaScript 원본에 현재 URL이 등록되지 않음

**해결**:
1. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 설정 확인
2. "승인된 JavaScript 원본"에 `http://localhost:8000` 추가
3. 저장 후 5분~몇 시간 대기 (설정 적용 시간)
4. 브라우저 캐시 지우기 (Ctrl + Shift + Delete)
5. 하드 리프레시 (Ctrl + Shift + R)

### "redirect_uri_mismatch" 오류

**원인**: 승인된 리디렉션 URI에 현재 URL이 등록되지 않음

**해결**:
1. "승인된 리디렉션 URI"에 `http://localhost:8000` 추가
2. 저장 후 대기
3. 브라우저 재시작

### "access_denied" 오류

**원인**: 사용자가 권한을 거부함

**해결**:
1. Google 계정 설정에서 앱 권한 확인
2. 권한 제거 후 다시 시도
3. Google 계정 > 보안 > 타사 앱 액세스에서 권한 관리

## 보안 주의사항

⚠️ **중요**: 
- 클라이언트 보안 비밀번호(Client Secret)는 **절대** 코드에 포함하지 마세요
- 클라이언트 보안 비밀번호는 서버 측 애플리케이션에서만 사용합니다
- 이 앱은 클라이언트 측 JavaScript만 사용하므로 보안 비밀번호가 필요 없습니다

## 프로덕션 배포 시

프로덕션 환경으로 배포할 때는:

1. **승인된 JavaScript 원본**에 프로덕션 도메인 추가:
   ```
   https://yourdomain.com
   ```

2. **승인된 리디렉션 URI**에 프로덕션 도메인 추가:
   ```
   https://yourdomain.com
   ```

3. 로컬 개발용 URI는 제거하거나 유지 (개발 환경용)

## 현재 사용 중인 API 범위

```
https://www.googleapis.com/auth/drive.readonly
```

이 범위는:
- ✅ Google Drive 파일 읽기만 가능
- ✅ 파일 목록 조회 가능
- ✅ 파일 다운로드 가능
- ❌ 파일 업로드 불가
- ❌ 파일 수정 불가
- ❌ 파일 삭제 불가

읽기 전용이므로 안전합니다.

