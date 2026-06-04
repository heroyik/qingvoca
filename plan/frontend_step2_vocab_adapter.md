# 프론트엔드 2단계 실행 결과: 데이터/타입 어댑터 연결

## 산출물

- `src/utils/vocab.ts`
- `src/app/page.tsx`
- `src/app/quiz/[unitId]/page.tsx`
- `scripts/validate_frontend_step2_vocab_adapter.mjs`
- `package.json`

## 적용 내용

Kamivoca 컴포넌트를 다음 단계에서 최대한 그대로 붙일 수 있도록 `src/utils/vocab.ts`에 Kamivoca 호환 API를 추가했다.

추가/확장한 API:

- `VocabEntry`
- `POS`
- `LearningUnit`
- `normalizeVocabWordKey()`
- `filterDeletedWords()`
- `normalizeDisplayFurigana()`
- `inferPOS()`
- `parseUnitId()`
- `getAllVocabData()`
- `getUnits()`
- `getRandomWords()`
- `getTotalWordCount()`

## Unit 정책

Kamivoca의 `unit-${level}` ID 형식을 유지한다.

| QingVoca Step | Unit ID | Source |
| --- | --- | --- |
| 1 | `unit-1` | `Lesson 1-2` |
| 2 | `unit-2` | `Lesson 3-4` |
| 3 | `unit-3` | `Lesson 5-6` |
| 4 | `unit-4` | `Lesson 7-8` |
| 5 | `unit-5` | `Lesson 9-10` |
| 6 | `unit-6` | `Lesson 11-12` |
| 7 | `unit-7` | `Lesson 13-14` |
| 8 | `unit-8` | `Lesson 15-16` |
| 9 | `unit-9` | `Lesson 17-18` |
| 10 | `unit-10` | `Lesson 19-20` |

`parseUnitId()`는 `unit-1`과 `1`을 모두 Step 1로 처리한다.

## 라우트 조정

- 홈 Step 카드 링크를 `/quiz/unit-${step}`로 변경했다.
- `/quiz/[unitId]` 정적 파라미터는 `1`-`10`과 `unit-1`-`unit-10`을 모두 생성한다.

## 검증

```sh
npm run validate:frontend:step2
npm run lint
npm run test
npm run build
```

## 다음 단계

3단계는 Kamivoca 홈 화면 이식이다. `src/app/page.tsx`를 Kamivoca 구조에 가깝게 확장하되, Cognite 탭과 `filterEasyCognates`는 제거한다.
