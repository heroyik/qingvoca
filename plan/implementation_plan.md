# 중국어 KamiVoca 구현 계획

## 목표

`voca_json/vocab.json`의 중국어 단어 데이터를 사용해 현재 KamiVoca가 제공하는 기본 기능을 모두 유지한 중국어 단어장 앱을 구현한다.

현재 확인한 기준:

- 원본 중국어 데이터: `voca_json/vocab.json`
  - 최상위 필드: `version`, `generatedAt`, `totalCount`, `words`
  - 단어 배열: `words`
  - 단어 필드: `word`, `pinyin`, `meaning`, `partOfSpeech`, `lessonId`, `translations`
  - 현재 항목 수: 636개
  - 레슨 범위: `lessonId` 1-20
  - 난이도: 전체 단어를 `HSK4`로 고정
- 현재 앱용 데이터: `src/data/vocab.json`
  - 최상위 필드: `data`
  - 항목 필드: `id`, `word`, `furigana`, `meaning`, `level`, `jlpt`, `pos`, `opic`, `example`
  - 현재 항목 수: 886개
- 현재 주요 라우트:
  - `/`
  - `/quiz/[unitId]`
  - `/quiz/review`
- 현재 주요 기능:
  - 단원 기반 학습
  - 객관식 뜻 퀴즈
  - 복습 퀴즈
  - 학습 진행도와 점수
  - 랭크/토스트/리더보드
  - 유저 프로필
  - Firebase/Firestore 동기화
  - 오프라인 모드와 서비스 워커
  - 음성 재생/사전 예열
  - 날씨 배경
  - 관리자 EDIT 탭
  - 전역 삭제/관리자 데이터 동기화
  - 한국어/일본어/영어 표시 언어 전환

## 구현 원칙

1. 기존 앱 구조를 최대한 유지한다.
2. 중국어 전용 필드는 앱 내부 표준 스키마로 명확히 변환한다.
3. 일본어 전용 명칭인 `furigana`, `jlpt`, `opic` 등은 한 번에 무리하게 제거하지 않고, 먼저 호환 레이어를 둔 뒤 UI 문구와 타입을 단계적으로 중국어화한다. 일본어 한자어 유사도 기능은 중국어 단어장 범위에서 삭제한다.
4. 데이터 변환은 수동 편집이 아니라 스크립트로 재현 가능하게 만든다.
5. 모든 단어는 `HSK4`로 표시하고, 원본 레슨 20개는 2개씩 묶어 전체 `Step 1`부터 `Step 10`까지 구성한다.
6. 한국어/일본어/영어 로케일을 지원하되, 단어 학습 대상 언어는 중국어로 고정한다.
7. 각 단계마다 `npm run lint`, `npm run build`, 주요 Playwright 테스트로 회귀를 확인한다.

## 단계별 계획

### 1단계: 현행 기능과 데이터 의존성 고정

- `src/utils/vocab.ts`, `src/components/Quiz.tsx`, `src/components/QuizLoader.tsx`, `src/components/ReviewQuizLoader.tsx`, `src/components/ReviewTab.tsx`에서 `VocabEntry`가 실제로 요구하는 필드를 목록화한다.
- 일본어 한자/한국어 유사어 판단 기능이 있으면 중국어 단어장에서는 제거 대상으로 분류한다.
- Firestore 컬렉션 이름과 문서 구조를 확인한다.
  - `src/lib/firebase.ts`
  - `src/lib/admin.ts`
  - `scripts/sync-firestore-vocab.mjs`
  - `scripts/sync-full-voca.mjs`
  - `scripts/sync-admin-edits-to-local.mjs`
- 산출물:
  - 중국어 마이그레이션에서 유지할 기능 체크리스트
  - 일본어 전용 로직 목록
  - 데이터 필드 매핑표

### 2단계: 중국어 앱 표준 스키마 정의

기존 앱과의 호환을 위해 1차 표준 스키마는 아래처럼 둔다.

```ts
type ChineseVocabEntry = {
  id: string;
  word: string;
  pinyin: string;
  reading: string;
  meaning: string;
  translations: {
    ko?: string;
    en?: string;
    ja?: string;
  };
  level: number;
  lessonId: number;
  step: number;
  pos: string;
  hsk: string;
  band: string;
  example: string[];
};
```

호환 필드:

- `furigana`는 임시로 `pinyin`과 동일하게 채운다.
- `jlpt`는 임시로 `hsk`와 동일하게 채운다.
- `opic`은 임시로 난이도 밴드(`BASIC`, `INTERMEDIATE`, `ADVANCED`)와 동일하게 채운다.
- `meaning`은 현재 선택된 로케일의 번역으로 표시한다. 기본 로케일은 한국어(`ko`)이며, `translations.ko`가 없으면 `meaning`, 그 다음 `translations.en`을 fallback으로 사용한다.
- `hsk`는 모든 항목에 `"HSK4"`로 고정한다.
- `step`은 `Math.ceil(lessonId / 2)`로 계산한다.

매핑 기준:

| 원본 필드 | 앱 필드 | 비고 |
| --- | --- | --- |
| `word` | `word` | 중국어 간체/원문 |
| `pinyin` | `pinyin`, `reading`, `furigana` | 1차 호환 |
| `translations.ko` | `meaning` | 기본 로케일 `ko`의 fallback 표시값 |
| `translations.en` | `translations.en` | 영어 로케일 표시값 |
| `translations.ja` | `translations.ja` | 일본어 로케일 표시값 |
| `partOfSpeech` | `pos` | `n.`, `v.` 같은 약어는 UI에서 그대로 시작 |
| `lessonId` | `lessonId` | 원본 레슨 유지 |
| `lessonId` | `step`, `level` | `Math.ceil(lessonId / 2)`, 전체 10 Step |
| 없음 | `id` | `String(index + 1).padStart(4, "0")` |
| 없음 | `hsk`, `jlpt` | 모든 단어 `HSK4` 고정, `jlpt`는 호환 필드 |
| 없음 | `band`, `opic` | 1차는 모두 `HSK4`; 필요 시 Step 기반 보조 밴드 추가 |
| 없음 | `example` | 1차는 빈 배열, 2차에서 예문 보강 |

Step 구성:

| Step | 포함 레슨 |
| --- | --- |
| Step 1 | Lesson 1, Lesson 2 |
| Step 2 | Lesson 3, Lesson 4 |
| Step 3 | Lesson 5, Lesson 6 |
| Step 4 | Lesson 7, Lesson 8 |
| Step 5 | Lesson 9, Lesson 10 |
| Step 6 | Lesson 11, Lesson 12 |
| Step 7 | Lesson 13, Lesson 14 |
| Step 8 | Lesson 15, Lesson 16 |
| Step 9 | Lesson 17, Lesson 18 |
| Step 10 | Lesson 19, Lesson 20 |

로케일 정책:

- 지원 로케일: `ko`, `ja`, `en`
- 기본 로케일: `ko`
- 로케일은 UI 문구와 뜻/번역 표시 언어에 적용한다.
- 중국어 단어(`word`)와 병음(`pinyin`)은 로케일과 무관하게 항상 표시한다.
- 선택 로케일은 localStorage에 저장한다.
- 저장 키 후보: `kamivoca:zh:locale`
- 번역 fallback 순서:
  - `ko`: `translations.ko` -> `meaning` -> `translations.en` -> `word`
  - `ja`: `translations.ja` -> `translations.ko` -> `meaning` -> `translations.en` -> `word`
  - `en`: `translations.en` -> `meaning` -> `translations.ko` -> `word`

### 3단계: 데이터 변환 파이프라인 작성

- 새 스크립트 후보: `scripts/transform_chinese_data.mjs`
- 입력: `voca_json/vocab.json`
- 출력: `src/data/vocab.json`
- 처리 내용:
  - `words` 배열 존재 여부 검증
  - 필수 필드 누락 리포트
  - 중복 `word + pinyin` 검사
  - 안정적인 `id` 생성
  - `lessonId` 기준 정렬
  - 모든 항목의 `hsk`/`jlpt`를 `HSK4`로 고정
  - `lessonId` 1-20을 `step` 1-10으로 변환
  - `level`은 기존 앱 호환을 위해 `step`과 동일하게 저장
  - 앱 호환 필드 생성
  - `translations.ko`, `translations.ja`, `translations.en` 보존
  - `totalCount`와 실제 항목 수 불일치 검사
- `package.json` 스크립트 추가:
  - `data:transform:zh`
  - `data:refresh:zh`
- 산출물:
  - `src/data/vocab.json`이 중국어 데이터로 재생성됨
  - 변환 로그에 항목 수, 레슨 범위, Step별 단어 수, 누락 필드, 중복 수 출력
  - Step은 정확히 10개이며 각 Step은 원본 레슨 2개를 포함

### 4단계: 타입과 유틸리티 중국어 대응

- `src/utils/vocab.ts`
  - `furigana` 직접 참조를 `getReading(entry)` 같은 헬퍼로 감싼다.
  - `jlpt`, `opic` 정렬/필터 로직을 `step`, `hsk`, `band` 중심으로 바꾼다.
  - 단원 수는 하드코딩하지 않고 데이터의 `step`에서 계산하되, 이번 데이터셋은 전체 10 Step으로 검증한다.
  - `getDisplayMeaning(entry, locale)` 헬퍼를 추가해 한국어/일본어/영어 뜻 표시를 한곳에서 처리한다.
  - `getStepForLesson(lessonId)` 헬퍼를 추가하고 `Math.ceil(lessonId / 2)` 규칙을 테스트한다.
- `src/utils/ui.ts`
  - 일본어 레이블을 중국어 학습용 문구로 교체한다.
  - `ko`, `ja`, `en` 로케일별 UI 문자열 테이블을 추가한다.
- `src/utils/priorityWords.ts`
  - 우선순위 단어 기준을 중국어 데이터에 맞게 재작성한다.
- 새 로케일 유틸 후보:
  - `src/utils/locale.ts`
  - `src/contexts/LocaleContext.tsx`
- 검증:
  - 모든 단어가 홈 화면 단원에 배치되는지 확인
  - Step 1-10 중 단어 수가 0인 Step이 없는지 확인
  - 로케일 변경 시 UI 문구와 정답/오답 뜻이 즉시 바뀌는지 확인

### 5단계: 퀴즈 기능 유지 및 중국어화

- `src/components/Quiz.tsx`
  - 문제 카드에 `word`, `pinyin`, `pos` 표시
  - 정답은 현재 선택 로케일의 뜻 기준
  - 오답 선택지는 같은 HSK4 안에서 현재 Step과 가까운 Step을 우선 추출
  - 오답 중복, 같은 번역, 빈 뜻 제거
- `src/components/QuizLoader.tsx`
  - `[unitId]`가 Step ID로 동작하도록 조정
  - Step 1은 Lesson 1, 2를 함께 로드하고 Step 10은 Lesson 19, 20을 함께 로드한다.
- `src/components/ReviewQuizLoader.tsx`
  - 복습 대상 단어가 중국어 데이터 ID로 저장/조회되도록 확인
- 유지할 기능:
  - 진행률
  - 정답/오답 피드백
  - 점수
  - 사운드
  - 랭크 토스트
  - 복습 큐 저장

### 6단계: 복습/게이미피케이션/리더보드 유지

- `src/contexts/GamificationContext.tsx`
  - localStorage 키에 일본어 데이터와 중국어 데이터가 섞이지 않도록 버전 또는 언어 prefix를 도입한다.
  - 예: `kamivoca:zh:progress`, `kamivoca:zh:review`
  - 로케일 설정은 `kamivoca:zh:locale`에 저장하고 진행률/복습 데이터와 분리한다.
- `src/hooks/useGamification.ts`, `src/hooks/useRank.ts`, `src/hooks/useGlobalTop20.ts`
  - Firestore 문서에 `language: "zh"` 또는 데이터셋 버전 필드를 추가한다.
  - Firestore 문서에 `hsk: "HSK4"`와 필요 시 `locale`을 기록한다. 점수 집계는 locale과 무관하게 중국어 HSK4 데이터셋 기준으로 합산한다.
  - 기존 일본어 리더보드와 중국어 리더보드가 섞이지 않게 쿼리 조건을 분리한다.
- `src/components/Leaderboard.tsx`, `src/components/UserProfile.tsx`, `src/components/RankToast.tsx`
  - 중국어 앱 문구를 `ko`, `ja`, `en` 로케일별로 표시
  - 점수/랭크 산정 방식은 유지

### 7단계: 일본어 한자어 유사도 기능 삭제

중국어 단어장에서는 일본어 한자어/한국어 유사어 기반 기능을 제공하지 않는다.

- 관련 유틸리티가 있으면 제거한다.
- 관련 관리자 탭이 있으면 제거한다.
- 관련 컬렉션/삭제 스크립트가 있으면 중국어 데이터 경로에서 제외한다.
- 중국어 단어장 기본 기능 범위는 홈, Step 퀴즈, 복습, 진행률, 리더보드, 프로필, 오프라인 모드, 관리자 EDIT로 제한한다.

### 8단계: 관리자 EDIT 기능 유지

- `src/components/AdminEditTab.tsx`
  - 편집 필드 변경:
    - `word`
    - `pinyin`
    - `meaning`
    - `translations.ko`
    - `translations.en`
    - `partOfSpeech`/`pos`
    - `lessonId`/`step`/`level`
    - `hsk`는 `HSK4` 고정 표시, 기본 편집 대상에서 제외
    - `example`
  - 일본어 `furigana`, `jlpt`, `opic` 레이블은 숨기거나 중국어 호환명으로 표시한다.
- `scripts/sync-admin-edits-to-local.mjs`
  - 중국어 필드 병합 지원
  - 원본 `voca_json/vocab.json`을 직접 덮어쓸지, 앱용 `src/data/vocab.json`만 갱신할지 정책 결정
- Firestore:
  - 관리자 override 문서에도 `language: "zh"` 추가

### 9단계: Firebase/Firestore 동기화 분리

- 기존 컬렉션이 일본어 데이터 전용이면 중국어 전용 컬렉션을 추가한다.
  - 후보: `zhVocabEntries`, `zhFullVocaEntries`, `zhDatasetMeta`
- `scripts/sync-firestore-vocab.mjs`
  - 중국어 모드 옵션 추가 또는 `sync-firestore-chinese-vocab.mjs` 생성
- `scripts/sync-full-voca.mjs`
  - 중국어 `voca_json/vocab.json` 전체 동기화 지원
- 앱 쿼리:
  - `language` 필드로 필터링하거나 컬렉션명을 분리한다.
  - 모든 중국어 단어 문서에 `hsk: "HSK4"`와 `step`을 저장한다.
- 검증:
  - 로컬 데이터만으로 앱 실행 가능
  - Firestore 연결 시 중국어 데이터만 조회
  - 관리자 편집 저장 후 새로고침에도 반영

### 10단계: 오프라인 모드와 빌드 산출물 갱신

- `scripts/generate-offline-manifest.mjs`
  - 중국어 `src/data/vocab.json` 해시가 매니페스트에 반영되는지 확인
- `src/components/OfflineModeGate.tsx`
  - 중국어 데이터셋 버전/항목 수 표시가 필요하면 반영
- `src/components/ServiceWorkerRegistrar.tsx`
  - 기존 등록 방식 유지
- 검증:
  - `npm run build`
  - 네트워크 차단 상태에서 홈, 단원 퀴즈, 복습 퀴즈 접근

### 11단계: UI 문구와 중국어 학습 경험 정리

- 홈 화면:
  - "일본어" 관련 문구를 "중국어"로 변경
  - 단원 카드는 `Step 1`부터 `Step 10`까지 표시
  - 각 Step 카드에는 포함 레슨 범위, 단어 수, 진행률 표시
  - 예: `Step 1`, `Lesson 1-2`, `HSK4`
- 퀴즈 화면:
  - 병음 표시 토글 또는 항상 표시 정책 결정
  - 중국어 음성 재생 버튼 노출
  - 정답/오답 선택지는 현재 로케일 번역으로 표시
- 복습 화면:
  - 복습 대상 수, 완료 수, 최근 오답 수 표시
- 로케일 설정:
  - 홈 상단 또는 프로필 영역에 로케일 선택 컨트롤 추가
  - 선택지: 한국어, 日本語, English
  - 변경 즉시 홈, 퀴즈, 복습, 리더보드, 관리자 탭 문구와 뜻 표시를 갱신
  - URL 라우트는 바꾸지 않고 localStorage 기반 설정으로 시작
- 관리자:
  - EDIT 탭 문구를 중국어 데이터 기준으로 수정
- 접근성:
  - 버튼 텍스트가 모바일에서 넘치지 않는지 확인
  - 병음 성조 문자가 깨지지 않는지 확인

### 12단계: 음성 재생 중국어 대응

- `src/hooks/useSound.ts`와 `src/components/AudioPrewarmer.tsx` 확인
- Web Speech API를 쓴다면 `zh-CN` 음성 우선 선택
- 음성 선택 fallback:
  - `zh-CN`
  - `zh-Hans`
  - 사용 가능한 중국어 음성
  - 기본 브라우저 음성
- 검증:
  - Chrome/Safari에서 중국어 단어 발음 재생
  - 음성 미지원 환경에서 앱이 깨지지 않음

### 13단계: 테스트 추가 및 회귀 확인

- 데이터 테스트:
  - `voca_json/vocab.json` 파싱
  - 변환 결과 항목 수 636개
  - 모든 항목에 `id`, `word`, `pinyin`, `meaning`, `translations`, `lessonId`, `step`, `level`, `hsk`, `pos` 존재
  - 모든 항목의 `hsk`가 `HSK4`
  - `step`은 1-10 범위이며 `Math.ceil(lessonId / 2)`와 일치
  - Step별 최소 1개 이상 단어 존재
- UI/E2E 테스트:
  - 홈 화면 단원 렌더링
  - Step 1 카드가 Lesson 1-2를 표시
  - Step 10 카드가 Lesson 19-20을 표시
  - 첫 단원 퀴즈 시작
  - 정답/오답 선택
  - 로케일을 한국어/일본어/영어로 변경하면 뜻 표시가 변경
  - 복습 큐 진입
  - 오프라인 게이트 렌더링
  - 관리자 탭은 권한 없을 때 숨김 또는 차단
- 명령:
  - `npm run lint`
  - `npm run build`
  - `npm run test`

## 권장 작업 순서

1. `scripts/transform_chinese_data.mjs` 작성
2. 모든 단어 `HSK4` 고정, Lesson 1-20을 Step 1-10으로 묶는 변환 규칙 구현
3. `src/data/vocab.json` 중국어 변환 결과 생성
4. `src/utils/vocab.ts`에 Step/reading/display meaning 호환 헬퍼 추가
5. 로케일 유틸과 저장 키(`kamivoca:zh:locale`) 추가
6. 홈 화면 단원 목록이 Step 1-10으로 렌더링되게 수정
7. 일반 퀴즈가 중국어 단어/병음/현재 로케일 뜻으로 동작하게 수정
8. 복습 퀴즈와 localStorage 키를 중국어 데이터셋으로 분리
9. 리더보드/랭크/유저 프로필에 `language: "zh"`와 `hsk: "HSK4"` 분리 적용
10. 일본어 한자어 유사도 기능 제거 상태 검증
11. 관리자 EDIT 필드를 중국어 스키마로 교체
12. Firestore sync 스크립트와 컬렉션 분리
13. 오프라인 매니페스트와 서비스 워커 검증
14. UI 문구, 로케일 선택, 음성, 모바일 레이아웃 정리
15. lint/build/test 실행 후 README 업데이트

## 마일스톤

### M1: 로컬 중국어 단어장 동작

- 중국어 데이터 변환 완료
- 모든 항목 `HSK4` 고정
- Step 1-10 구성 완료
- 홈 화면 Step 카드 렌더링
- Step별 퀴즈 동작
- 빌드 통과

### M2: 학습 기록과 복습 유지

- 진행률 저장
- 복습 큐 저장
- 랭크/점수 유지
- 일본어 데이터와 localStorage 충돌 없음
- 로케일 설정 저장 및 복원

### M3: Firebase 기능 유지

- 중국어 리더보드 분리
- 중국어 관리자 편집 저장
- 중국어 데이터 Firestore 동기화
- Firestore 데이터에 `language: "zh"`, `hsk: "HSK4"`, `step` 반영

### M4: 전체 기본 기능 완성

- 일본어 한자어 유사도 기능 제거
- EDIT 중국어 대응
- 한국어/일본어/영어 로케일 전환 대응
- 오프라인 모드 검증
- 음성 재생 중국어 대응
- E2E 테스트 통과

## 주요 리스크와 대응

- 원본 중국어 데이터에 예문이 없다.
  - 1차는 `example: []`로 동작 보장
  - 2차에서 예문 생성/수집 파이프라인 추가
- 기존 컴포넌트가 `furigana`, `jlpt`, `opic`에 강하게 결합되어 있을 수 있다.
  - 먼저 호환 필드를 채우고, 이후 `reading`, `hsk`, `band`로 점진 교체
- Step은 10개로 고정해야 하지만 기존 코드가 15개 level을 가정할 수 있다.
  - 데이터에서 Step 수를 계산하되, 중국어 데이터셋 검증에서는 정확히 10개인지 확인
  - 기존 level UI 문구는 Step UI 문구로 교체
- 로케일 변경 시 퀴즈 정답 텍스트와 저장된 복습 항목의 표시 언어가 달라질 수 있다.
  - 복습/진행 상태에는 단어 ID만 저장하고, 화면 표시 시 현재 로케일로 번역을 다시 계산
- Firebase 컬렉션이 기존 일본어 데이터와 섞일 수 있다.
  - `language: "zh"` 필드 또는 컬렉션 분리 중 하나를 초기에 확정
- 일본어 한자어 유사도 기능은 중국어 단어장 범위와 맞지 않는다.
  - 중국어 단어장에서는 제거하고 관리자 EDIT만 유지
- localStorage 진행률이 기존 일본어 학습 기록과 충돌할 수 있다.
  - 모든 저장 키에 `zh` prefix 또는 dataset version prefix 적용

## 완료 기준

- `voca_json/vocab.json`만으로 `src/data/vocab.json`을 재생성할 수 있다.
- 변환 결과는 636개 항목이며 모든 항목은 `HSK4`이다.
- Lesson 1-20은 정확히 Step 1-10으로 묶인다.
- 홈, 단원 퀴즈, 복습 퀴즈, 리더보드, 프로필, 랭크, 오프라인 모드, 관리자 EDIT가 모두 중국어 데이터로 동작한다.
- 한국어/일본어/영어 로케일을 선택할 수 있고, UI 문구와 뜻 표시가 선택 로케일을 따른다.
- 일본어 전용 문구와 필드명이 사용자 화면에 남지 않는다.
- `npm run lint`, `npm run build`, `npm run test`가 통과한다.
- README 또는 별도 문서에 중국어 데이터 파이프라인과 Firebase 컬렉션 정책이 기록되어 있다.
