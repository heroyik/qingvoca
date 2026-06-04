# 6단계 실행 결과: 복습/게이미피케이션/리더보드 유지

## 산출물

- `src/utils/gamification.ts`
- `scripts/validate_step6_gamification.mjs`
- `package.json`

## 저장 키 정책

일본어 데이터와 중국어 데이터가 섞이지 않도록 중국어 전용 prefix를 사용한다.

| 목적 | 키 |
| --- | --- |
| 로케일 | `kamivoca:zh:locale` |
| 진행률 | `kamivoca:zh:progress` |
| 복습 큐 | `kamivoca:zh:review` |
| 점수 | `kamivoca:zh:score` |
| 랭크 | `kamivoca:zh:rank` |

로케일은 진행률/복습/점수와 분리해서 저장한다.

## 데이터셋 네임스페이스

| 필드 | 값 |
| --- | --- |
| `language` | `zh` |
| `hsk` | `HSK4` |
| `datasetVersion` | `zh-HSK4-v1` |

점수와 리더보드는 로케일과 무관하게 `language=zh`, `hsk=HSK4`, `datasetVersion=zh-HSK4-v1` 기준으로 집계한다.

## 상태 모델

추가한 타입:

- `StepProgress`
- `ProgressState`
- `ReviewQueueState`
- `ScoreState`
- `LeaderboardDocument`

추가한 함수:

| 함수 | 역할 |
| --- | --- |
| `createInitialProgressState()` | 중국어 진행률 초기 상태 생성 |
| `createInitialReviewQueueState()` | 중국어 복습 큐 초기 상태 생성 |
| `createInitialScoreState()` | 중국어 점수 초기 상태 생성 |
| `createLeaderboardDocument(input)` | 중국어 리더보드 문서 생성 |
| `isChineseLeaderboardDocument(document)` | 중국어 HSK4 리더보드 문서 필터 |
| `getCompletedWordCount(progress)` | 중복 제거 완료 단어 수 계산 |
| `addReviewWord(queue, wordId)` | 복습 큐에 중국어 단어 ID 추가 |
| `removeReviewWord(queue, wordId)` | 복습 큐에서 중국어 단어 ID 제거 |

## Firestore 적용 기준

실제 Firebase 코드가 추가되면 리더보드/랭크 쿼리는 아래 조건을 포함해야 한다.

```ts
where("language", "==", "zh")
where("hsk", "==", "HSK4")
where("datasetVersion", "==", "zh-HSK4-v1")
```

문서에는 필요 시 `locale`을 기록할 수 있지만, 점수 합산과 순위 조건에는 사용하지 않는다.

## 검증 명령

```sh
npm run validate:step6
```

검증 결과:

- 중국어 전용 저장 키가 정의되어 있다.
- 로케일 키가 진행률/복습 키와 분리되어 있다.
- 리더보드 네임스페이스가 `language=zh`, `hsk=HSK4`, `datasetVersion=zh-HSK4-v1`로 고정되어 있다.
- 진행률, 복습 큐, 점수, 리더보드 상태 모델이 정의되어 있다.

## 제한 사항

현재 저장소에는 실제 `src/contexts/GamificationContext.tsx`, `src/hooks/useGamification.ts`, `src/hooks/useRank.ts`, `src/hooks/useGlobalTop20.ts`, Firebase 코드가 없다. 따라서 실제 Firestore 쿼리 수정은 아직 수행하지 않았고, 이번 단계에서는 연결 기준과 공용 상태 모델을 고정했다.
