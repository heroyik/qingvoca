# QingVoca 프론트엔드 앱 개발 계획

## 목표

`$HOME/proj/kamivoca`의 Next.js 앱 구조와 학습 로직을 최대한 유지하면서, QingVoca의 중국어 데이터/유틸리티 레이어를 연결해 실제 실행 가능한 중국어 단어장 앱을 만든다.

현재 QingVoca는 데이터 변환, 타입, 퀴즈/복습/게이미피케이션/Firestore/offline/speech 유틸과 검증 스크립트가 준비된 상태다. 아직 실제 Next.js 앱, React 컴포넌트, 라우트, 빌드 설정은 없다.

## 기준 앱

Kamivoca는 Next.js App Router 앱이다.

보존할 핵심 구조:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/quiz/[unitId]/page.tsx`
- `src/app/quiz/review/page.tsx`
- `src/components/Quiz.tsx`
- `src/components/QuizLoader.tsx`
- `src/components/ReviewQuizLoader.tsx`
- `src/components/ReviewTab.tsx`
- `src/components/Leaderboard.tsx`
- `src/components/UserProfile.tsx`
- `src/components/AdminEditTab.tsx`
- `src/components/RankToast.tsx`
- `src/components/OfflineModeGate.tsx`
- `src/components/ServiceWorkerRegistrar.tsx`
- `src/components/AudioPrewarmer.tsx`
- `src/components/WeatherBackground.tsx`
- `src/contexts/GamificationContext.tsx`
- `src/hooks/useGamification.ts`
- `src/hooks/useRank.ts`
- `src/hooks/useGlobalTop20.ts`
- `src/hooks/useSound.ts`
- `src/hooks/useWeather.ts`
- `src/lib/admin.ts`
- `src/lib/constants.ts`
- `src/lib/firebase.ts`
- `src/utils/browser.ts`

삭제할 Kamivoca 기능:

- `src/components/CogniteTab.tsx`
- `src/utils/cognates.ts`
- `delete:heroyik:cognites` 계열 스크립트와 UI 진입점

## 기술 스택

Kamivoca와 동일하게 시작한다.

- Next.js App Router
- React
- TypeScript
- Firebase
- lucide-react
- Playwright
- ESLint

Next.js App Router 기준으로 `app/layout.tsx`는 루트 레이아웃이며 `<html>`과 `<body>`를 포함해야 한다. `/`는 `app/page.tsx`로 만들고, 퀴즈 동적 라우트는 `app/quiz/[unitId]/page.tsx`로 유지한다.

## 개발 원칙

1. Kamivoca 파일 구조를 먼저 복사하고, 이후 중국어 차이를 최소 패치로 적용한다.
2. 일본어 전용 필드명은 QingVoca 유틸을 통해 흡수한다.
3. UI 흐름과 점수/복습/랭크 로직은 유지한다.
4. Cognite는 재정의하지 않고 제거한다.
5. 중국어 데이터의 기준은 `src/data/vocab.json`이다.
6. Step은 1-10, Lesson은 1-20, 전체 난이도는 `HSK4`로 고정한다.
7. `ko`, `ja`, `en` 로케일은 뜻/문구 표시만 바꾸고 학습 대상 언어는 항상 중국어다.

## 단계별 계획

### 1단계: Next.js 앱 골격 이식

Kamivoca에서 아래 파일을 가져온다.

- `package.json`의 Next.js/React/Firebase/Playwright/ESLint 의존성
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/app/page.module.css`
- `src/app/quiz/[unitId]/page.tsx`
- `src/app/quiz/review/page.tsx`

QingVoca 기존 `package.json` 스크립트는 보존하고, 앱 스크립트를 추가한다.

- `dev`
- `build`
- `start`
- `lint`
- `test:e2e`

완료 기준:

- `npm install`
- `npm run lint`
- `npm run build`
- `npm run test`

### 2단계: 데이터/타입 어댑터 연결

Kamivoca의 `src/utils/vocab.ts` 로직을 가져오되, QingVoca의 기존 유틸과 맞춘다.

연결 대상:

- `src/types/chinese-vocab.ts`
- `src/utils/vocab.ts`
- `src/utils/learningExperience.ts`
- `src/utils/locale.ts`
- `src/data/vocab.json`

수정 방향:

- `getUnits()`는 Step 1-10을 반환한다.
- `unitId`는 Step ID로 해석한다.
- `word`는 중국어 단어다.
- `furigana` 직접 표시는 `getReading()` 또는 `pinyin`으로 대체한다.
- `jlpt` 표시는 `hsk`로 대체한다.
- `level`은 `step`과 동일하게 유지한다.

완료 기준:

- 홈 화면이 Step 1-10을 표시한다.
- Step 1은 Lesson 1-2, Step 10은 Lesson 19-20을 표시한다.
- 모든 카드에 단어 수와 `HSK4`가 표시된다.

### 3단계: 홈 화면 이식

Kamivoca `src/app/page.tsx`를 최대한 유지한다.

유지할 기능:

- 카드형 단원 목록
- 잠금/해금 로직
- 진행률 표시
- 리더보드
- 프로필
- 복습 탭
- 관리자 EDIT 탭
- 랭크 토스트
- 날씨 배경

변경할 부분:

- 일본어 문구를 `src/utils/ui.ts`의 중국어 문구로 교체
- Cognite 탭 제거
- `filterEasyCognates` 제거
- 단원 tier 색상은 Step 1-3, 4-7, 8-10 기준으로 매핑
- GitHub 링크가 필요하면 `heroyik/qingvoca`로 변경

완료 기준:

- `/`에서 앱 첫 화면이 바로 학습 대시보드로 표시된다.
- 마케팅/랜딩 페이지를 만들지 않는다.

### 4단계: 퀴즈 화면 이식

Kamivoca의 `Quiz.tsx`, `QuizLoader.tsx`, `ReviewQuizLoader.tsx`를 가져와 QingVoca 유틸에 연결한다.

연결 대상:

- `src/utils/quiz.ts`
- `src/utils/vocab.ts`
- `src/utils/speech.ts`
- `src/utils/locale.ts`

변경할 부분:

- 문제 카드: `word`, `pinyin`, `pos`
- 정답: 현재 로케일의 뜻
- 오답: 같은 `HSK4` 안에서 가까운 Step 우선
- 일본어 kana/kanji 판별 로직 제거
- `filterEasyCognates` 제거
- 음성은 `speakChineseWord()`로 연결

완료 기준:

- `/quiz/1`이 Lesson 1-2 단어로 퀴즈를 시작한다.
- `/quiz/10`이 Lesson 19-20 단어로 퀴즈를 시작한다.
- 정답/오답 피드백, 점수, 진행률, 사운드, 랭크 토스트가 유지된다.

### 5단계: 복습/게이미피케이션 이식

Kamivoca의 `GamificationContext`, `useGamification`, `ReviewTab` 로직을 유지하되 저장 키와 데이터셋 범위를 중국어로 분리한다.

연결 대상:

- `src/utils/gamification.ts`
- `src/utils/quiz.ts`

정책:

- localStorage prefix: `kamivoca:zh:*`
- 복습 큐에는 단어 ID만 저장
- 화면 표시 시 현재 로케일로 뜻을 다시 계산
- 점수/랭크는 locale과 무관하게 `zh-HSK4-v1` 기준

완료 기준:

- 복습 큐 저장/조회가 중국어 ID 기준으로 동작한다.
- 일본어 학습 기록과 localStorage가 섞이지 않는다.

### 6단계: Firebase/Firestore 연결

Kamivoca Firebase 초기화 구조를 유지한다.

가져올 파일:

- `src/lib/firebase.ts`
- `src/lib/admin.ts`
- Firestore REST helper scripts if needed

QingVoca 정책:

- `zhVocabEntries`
- `zhFullVocaEntries`
- `zhDatasetMeta`
- `zhLeaderboard`
- `zhAdminOverrides`
- 모든 문서에 `language: "zh"`, `hsk: "HSK4"`, `datasetVersion: "zh-HSK4-v1"`

완료 기준:

- Firebase 환경변수 없이도 로컬 데이터로 앱이 동작한다.
- Firebase 환경변수가 있으면 중국어 데이터만 조회한다.
- 관리자 EDIT 저장 후 새로고침에 반영된다.

### 7단계: 관리자 EDIT 이식

Kamivoca `AdminEditTab.tsx`를 가져와 중국어 편집 필드로 바꾼다.

연결 대상:

- `src/utils/adminEdit.ts`
- `scripts/sync-admin-edits-to-local.mjs`

편집 가능:

- `word`
- `pinyin`
- `meaning`
- `translations.ko`
- `translations.ja`
- `translations.en`
- `pos`
- `lessonId`
- `step`
- `level`
- `example`

고정/자동:

- `id`
- `hsk`
- `jlpt`
- `reading`
- `furigana`
- `band`
- `opic`

완료 기준:

- UI에서 일본어 `furigana`, `jlpt`, `opic` 레이블이 노출되지 않는다.
- `hsk`는 `HSK4` 고정으로 표시된다.

### 8단계: 오프라인/서비스 워커 이식

Kamivoca의 오프라인 구조를 유지한다.

가져올 파일:

- `src/components/OfflineModeGate.tsx`
- `src/components/ServiceWorkerRegistrar.tsx`
- `src/components/AudioPrewarmer.tsx`

연결 대상:

- `public/offline-manifest.json`
- `scripts/generate-offline-manifest.mjs`

완료 기준:

- `npm run build` 후 중국어 `src/data/vocab.json` 해시가 매니페스트에 반영된다.
- 오프라인 상태에서 홈, Step 퀴즈, 복습 진입이 가능하다.

### 9단계: UI 문구/디자인 정리

Kamivoca UI를 유지하되 중국어 앱 문구로 정리한다.

변경할 부분:

- 앱명: QingVoca 또는 중국어 KamiVoca 중 하나로 통일
- 일본어 관련 문구 제거
- 병음 표시 토글 또는 항상 표시 정책 확정
- 로케일 선택 컨트롤 추가
- 모바일 버튼 텍스트 overflow 확인

완료 기준:

- 사용자 화면에 일본어 학습 앱 문구가 남지 않는다.
- 병음 성조 문자가 깨지지 않는다.

### 10단계: 테스트와 회귀

Kamivoca의 Playwright 구조를 가져오고, QingVoca 기존 Node 검증을 유지한다.

필수 명령:

- `npm run data:refresh:zh`
- `npm run test:regression`
- `npm run lint`
- `npm run build`
- `npm run test:e2e`

E2E 항목:

- 홈 Step 카드 렌더링
- Step 1 카드가 Lesson 1-2 표시
- Step 10 카드가 Lesson 19-20 표시
- Step 1 퀴즈 시작
- 정답/오답 선택
- 복습 큐 진입
- 로케일 `ko`, `ja`, `en` 변경
- 관리자 권한 없을 때 관리자 기능 차단
- Cognite 탭 없음
- 오프라인 게이트 렌더링

## 이식 우선순위

1. Next.js 설정과 App Router 파일 이식
2. `vocab.ts` 어댑터 정리
3. 홈 화면 이식
4. 퀴즈 이식
5. 복습/게이미피케이션 이식
6. Cognite 제거 확인
7. 관리자 EDIT 이식
8. Firebase/Firestore 연결
9. 오프라인/음성 연결
10. Playwright E2E 추가

## 예상 리스크

- Kamivoca 컴포넌트가 일본어 전용 로직에 깊게 결합되어 있다.
  - 대응: 먼저 파일 구조를 유지하고, `src/utils/*` 어댑터에서 중국어 차이를 흡수한다.
- `CogniteTab` 제거로 홈 탭/관리자 상태 로직에 빈 참조가 남을 수 있다.
  - 대응: `validate:step7`을 계속 유지한다.
- 기존 `level`이 15단계 기준일 수 있다.
  - 대응: QingVoca는 Step 1-10만 사용하고 `level === step`을 검증한다.
- Firebase 컬렉션이 일본어 데이터와 섞일 수 있다.
  - 대응: 컬렉션명과 `language/hsk/datasetVersion` 필드를 둘 다 사용한다.
- 실제 브라우저 음성은 환경별 편차가 있다.
  - 대응: `zh-CN -> zh-Hans -> zh-* -> default` fallback을 유지한다.

## 완료 기준

- `npm run dev`로 QingVoca 앱이 실행된다.
- `/`, `/quiz/1`, `/quiz/10`, `/quiz/review`가 동작한다.
- 홈/퀴즈/복습/리더보드/프로필/관리자 EDIT가 중국어 데이터로 동작한다.
- Cognite 기능이 없다.
- 한국어/일본어/영어 로케일 전환이 동작한다.
- 중국어 음성 재생 버튼이 동작하거나 미지원 환경에서 깨지지 않는다.
- `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`가 통과한다.
