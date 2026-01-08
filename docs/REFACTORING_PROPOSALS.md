# 📋 viewer.js 리팩토링 제안서

8명의 에이전트가 각자 다른 설계 패턴으로 viewer.js를 리팩토링한 제안입니다.

---

## 🎯 목표

- **단일 책임 원칙(SRP)** 준수
- **관심사 분리**: UI 렌더링과 데이터 처리 로직 분리
- **가독성 향상**: 긴 함수를 모듈화하고 설정 객체/헬퍼 함수로 정리
- **확장성**: 새로운 기능 추가가 쉬운 구조
- **JSDoc 주석**: 모든 함수에 명확한 주석 추가

---

## 📚 에이전트별 제안

### 에이전트 1: 클래스 기반 모듈 패턴 ✅

**위치**: `src/js/viewer/agent1_class-based/`

**설계 철학**:
- 각 기능별로 독립적인 클래스 생성
- 클래스 간 느슨한 결합 (의존성 주입 가능)
- 명확한 public API 제공
- private 필드를 통한 캡슐화

**구조**:
```
agent1_class-based/
├── FileManager.js      # 파일 관리 전담 클래스
├── ContentRenderer.js  # 콘텐츠 렌더링 전담 클래스
├── BookmarkManager.js  # 북마크 관리 전담 클래스
├── HistoryManager.js   # 히스토리 관리 전담 클래스
├── StyleManager.js     # 스타일 관리 전담 클래스
└── index.js            # ViewerCoordinator (통합 클래스)
```

**장점**:
- ✅ 명확한 책임 분리
- ✅ 객체 지향 프로그래밍 원칙 준수
- ✅ 타입 안정성 (JSDoc 타입 주석)
- ✅ 테스트 용이성 (각 클래스 독립 테스트 가능)

**단점**:
- ⚠️ JavaScript에서 클래스 사용 시 메모리 오버헤드
- ⚠️ 상속 구조가 복잡해질 수 있음

---

### 에이전트 2: 순수 함수형 파이프라인 ✅

**위치**: `src/js/viewer/agent2_functional-pipeline/`

**설계 철학**:
- 불변성 (Immutability) 유지
- 순수 함수 (Pure Functions) 중심
- 함수 체이닝 (Function Chaining)
- 컴포지션 (Composition)

**구조**:
```
agent2_functional-pipeline/
├── state.js        # 불변 상태 관리
├── file.js         # 파일 처리 순수 함수들
├── render.js       # 렌더링 순수 함수들
├── pipeline.js     # 함수 파이프라인 유틸리티
└── index.js        # 진입점
```

**장점**:
- ✅ 부작용 없는 함수로 테스트가 매우 쉬움
- ✅ 함수 재사용성 높음
- ✅ 디버깅이 쉬움 (각 함수가 독립적)
- ✅ 함수형 프로그래밍 패러다임

**단점**:
- ⚠️ DOM 조작 등 부작용이 필요한 부분은 별도 처리 필요
- ⚠️ 상태 관리가 복잡할 수 있음

---

### 에이전트 3: 이벤트 기반 아키텍처 🔄

**위치**: `src/js/viewer/agent3_event-based/`

**설계 철학**:
- EventBus를 통한 느슨한 결합
- Pub/Sub 패턴
- 이벤트 기반 통신

**구조**:
```
agent3_event-based/
├── EventBus.js        # 중앙 이벤트 버스
├── FileService.js     # 파일 처리 서비스
├── RenderService.js   # 렌더링 서비스
├── BookmarkService.js # 북마크 서비스
└── index.js           # 진입점
```

**장점**:
- ✅ 모듈 간 완전한 분리
- ✅ 확장성 매우 높음 (새 기능 추가 시 이벤트만 추가)
- ✅ 디버깅 시 이벤트 로그로 추적 가능

**단점**:
- ⚠️ 이벤트 흐름 추적이 어려울 수 있음
- ⚠️ 메모리 누수 주의 (이벤트 리스너 정리 필요)

---

### 에이전트 4: 서비스 레이어 패턴 🔄

**위치**: `src/js/viewer/agent4_service-layer/`

**설계 철학**:
- 각 기능별 서비스 클래스
- 서비스 간 의존성 최소화
- 단일 진입점(Service Locator)

**구조**:
```
agent4_service-layer/
├── FileService.js
├── RenderService.js
├── BookmarkService.js
├── HistoryService.js
├── StyleService.js
├── ServiceLocator.js  # 서비스 등록 및 조회
└── index.js
```

**장점**:
- ✅ 서비스 단위로 테스트 가능
- ✅ 의존성 주입 패턴 적용 가능
- ✅ 서비스 교체가 쉬움

**단점**:
- ⚠️ 서비스 로케이터 패턴은 전역 상태를 만들 수 있음

---

### 에이전트 5: 팩토리 패턴 🔄

**위치**: `src/js/viewer/agent5_factory/`

**설계 철학**:
- Factory로 객체 생성 관리
- 각 객체 타입별 팩토리 클래스

**구조**:
```
agent5_factory/
├── FileFactory.js        # 파일 객체 생성
├── RendererFactory.js    # 렌더러 생성
├── BookmarkFactory.js    # 북마크 객체 생성
├── ManagerFactory.js     # 관리자 객체 생성
└── index.js
```

**장점**:
- ✅ 객체 생성 로직 캡슐화
- ✅ 복잡한 초기화 로직을 팩토리에 집중

**단점**:
- ⚠️ 단순한 객체 생성에 오버엔지니어링 가능
- ⚠️ 팩토리 클래스가 많아질 수 있음

---

### 에이전트 6: 전략 패턴 🔄

**위치**: `src/js/viewer/agent6_strategy/`

**설계 철학**:
- 렌더링 전략, 스타일 전략 등 전략 패턴 적용
- 런타임에 전략 교체 가능

**구조**:
```
agent6_strategy/
├── strategies/
│   ├── MarkdownRenderStrategy.js
│   ├── TextRenderStrategy.js
│   ├── LightStyleStrategy.js
│   └── DarkStyleStrategy.js
├── Context.js           # 전략을 사용하는 컨텍스트
└── index.js
```

**장점**:
- ✅ 알고리즘을 런타임에 교체 가능
- ✅ 새로운 렌더링 방식 추가가 쉬움

**단점**:
- ⚠️ 전략 클래스가 많아질 수 있음
- ⚠️ 전략 선택 로직이 복잡해질 수 있음

---

### 에이전트 7: 옵저버 패턴 🔄

**위치**: `src/js/viewer/agent7_observer/`

**설계 철학**:
- Subject/Observer 패턴
- 상태 변경 시 옵저버에게 알림

**구조**:
```
agent7_observer/
├── Subject.js           # 상태 변경 주제
├── FileObserver.js      # 파일 변경 옵저버
├── RenderObserver.js    # 렌더링 변경 옵저버
├── StyleObserver.js     # 스타일 변경 옵저버
└── index.js
```

**장점**:
- ✅ 상태 변경 시 자동 업데이트
- ✅ 느슨한 결합

**단점**:
- ⚠️ 옵저버 순서에 의존할 수 있음
- ⚠️ 메모리 누수 주의

---

### 에이전트 8: 의존성 주입 패턴 🔄

**위치**: `src/js/viewer/agent8_dependency-injection/`

**설계 철학**:
- DI 컨테이너를 통한 의존성 관리
- 생성자 주입

**구조**:
```
agent8_dependency-injection/
├── DIContainer.js       # 의존성 주입 컨테이너
├── FileManager.js
├── ContentRenderer.js
├── BookmarkManager.js
└── index.js
```

**장점**:
- ✅ 의존성 명시적 선언
- ✅ 테스트 시 Mock 주입 쉬움
- ✅ 의존성 역전 원칙 준수

**단점**:
- ⚠️ DI 컨테이너 설정이 복잡할 수 있음
- ⚠️ JavaScript에서는 오버엔지니어링 가능

---

## 🏆 추천안

### 가장 추천: **에이전트 1 (클래스 기반 모듈 패턴)**

**이유**:
1. ✅ **명확한 책임 분리**: 각 클래스가 단일 책임을 가짐
2. ✅ **가독성**: 클래스 이름만으로 역할 파악 가능
3. ✅ **확장성**: 새로운 기능 추가 시 새 클래스 추가만 하면 됨
4. ✅ **유지보수성**: 각 클래스를 독립적으로 수정 가능
5. ✅ **JSDoc 타입 안정성**: 클래스 메서드에 타입 주석 가능

### 두 번째 추천: **에이전트 2 (순수 함수형 파이프라인)**

**이유**:
1. ✅ **테스트 용이성**: 모든 함수가 순수 함수이므로 단위 테스트가 매우 쉬움
2. ✅ **재사용성**: 작은 함수들을 조합하여 새로운 기능 생성 가능
3. ✅ **디버깅**: 각 함수가 독립적이므로 문제 추적이 쉬움

---

## 📝 구현 방법

각 에이전트의 제안은 `src/js/viewer/agent{N}_*` 폴더에 구현되어 있습니다.

현재 `viewer.js`를 교체하려면:

1. 원본 `viewer.js`를 백업
2. 선택한 에이전트의 `index.js`를 `viewer.js`로 복사
3. `main.js`에서 import 경로 확인
4. 테스트 실행

---

## 🔄 마이그레이션 가이드

### 에이전트 1 사용 시

```javascript
// 기존 코드
import { processFiles, displayFileContent } from './viewer.js';

// 변경 없음 (하위 호환성 유지)
import { processFiles, displayFileContent } from './viewer.js';
```

### 에이전트 2 사용 시

```javascript
// 기존 코드
import { processFiles, displayFileContent } from './viewer.js';

// 변경 없음 (함수 시그니처 동일)
import { processFiles, displayFileContent } from './viewer.js';
```

---

## ✅ 체크리스트

각 에이전트 제안은 다음을 준수합니다:

- [x] 단일 책임 원칙 (SRP)
- [x] 관심사 분리
- [x] JSDoc 주석 작성
- [x] 하위 호환성 유지 (export 함수 시그니처 동일)
- [x] 확장 가능한 구조
- [x] 가독성 향상

---

**작성일**: 2026-01-02  
**작성자**: 8명의 AI 에이전트

