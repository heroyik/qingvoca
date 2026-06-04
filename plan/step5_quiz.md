# 5단계 실행 결과: 퀴즈 기능 유지 및 중국어화

## 산출물

- `src/utils/quiz.ts`
- `scripts/validate_step5_quiz.mjs`
- `package.json`

## `src/utils/quiz.ts`

기존 앱 컴포넌트가 추가될 때 연결할 중국어 퀴즈 로직을 추가했다.

| 함수 | 역할 |
| --- | --- |
| `getLessonsForStep(step)` | Step ID를 원본 Lesson 2개로 변환 |
| `getQuizWordsForStep(entries, step)` | Step 기준 퀴즈 단어 로드 |
| `getReviewWordsByIds(entries, reviewIds)` | 중국어 데이터 ID 기준 복습 단어 로드 |
| `createQuizQuestion(entry, entries, options)` | 단일 객관식 문제 생성 |
| `createQuizQuestions(entries, sourceWords, options)` | 문제 배열 생성 |
| `getDistractors(entry, entries, locale, count)` | 오답 선택지 생성 |
| `validateQuizQuestions(questions, optionCount)` | 퀴즈 선택지 검증 |

## 문제 카드 정책

퀴즈 문제는 아래 필드를 노출할 수 있게 구성한다.

- `word`
- `pinyin`
- `pos`
- `step`
- `lessonId`

정답은 `getDisplayMeaning(entry, locale)` 기준이다.

## 오답 선택지 정책

오답 선택지는 아래 규칙으로 생성한다.

- 같은 `HSK4` 데이터셋에서만 추출한다.
- 현재 단어와 가까운 Step을 우선한다.
- 현재 단어 자신은 제외한다.
- 현재 로케일 기준 정답과 같은 뜻은 제외한다.
- 빈 뜻은 제외한다.
- 같은 뜻의 중복 선택지는 제외한다.
- 기본 선택지 수는 정답 포함 4개다.

## Step 로더 정책

`unitId`는 Step ID로 취급한다.

| Step | Lessons |
| --- | --- |
| 1 | 1, 2 |
| 2 | 3, 4 |
| 3 | 5, 6 |
| 4 | 7, 8 |
| 5 | 9, 10 |
| 6 | 11, 12 |
| 7 | 13, 14 |
| 8 | 15, 16 |
| 9 | 17, 18 |
| 10 | 19, 20 |

## 복습 로더 정책

복습 큐는 중국어 앱 데이터의 `id`를 저장/조회 기준으로 사용한다.

예:

```ts
getReviewWordsByIds(entries, ["0001", "0002"]);
```

## 검증 명령

```sh
npm run validate:step5
```

검증 결과:

- 모든 Step ID가 원본 Lesson 2개로 매핑된다.
- 모든 문제 카드에 `word`, `pinyin`, `pos`가 있다.
- `ko`, `ja`, `en` 로케일 정답이 모두 비어 있지 않다.
- 모든 단어가 정답 포함 4개 선택지를 만들 수 있다.
- 오답 선택지는 같은 `HSK4` 안에서 생성된다.
- 선택지는 현재 로케일 뜻 기준으로 비어 있거나 중복되지 않는다.
- 중국어 데이터 ID 기반 복습 조회 샘플이 정상 동작한다.

## 제한 사항

현재 저장소에는 실제 `src/components/Quiz.tsx`, `src/components/QuizLoader.tsx`, `src/components/ReviewQuizLoader.tsx`가 없다. 따라서 UI 컴포넌트 수정은 아직 수행하지 않았고, 컴포넌트가 추가되면 이번 단계의 `src/utils/quiz.ts`를 연결한다.
