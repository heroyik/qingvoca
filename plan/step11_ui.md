# 11단계 실행 결과: UI 문구와 중국어 학습 경험 정리

## 산출물

- `src/utils/learningExperience.ts`
- `src/utils/ui.ts`
- `scripts/validate_step11_ui.mjs`
- `package.json`

## UI 문자열 정책

`src/utils/ui.ts`의 `ko`, `ja`, `en` 문자열 테이블을 중국어 학습 경험 기준으로 확장했다.

추가/확정한 주요 키:

- `appTitle`
- `word`
- `pinyin`
- `meaning`
- `partOfSpeech`
- `step`
- `lesson`
- `quiz`
- `review`
- `leaderboard`
- `profile`
- `admin`
- `hsk`
- `startQuiz`
- `reviewCount`
- `completedCount`
- `recentWrongCount`
- `showPinyin`
- `playChineseAudio`
- `localeLabel`
- `adminEdit`
- `lessonRange`
- `wordCount`

## 학습 경험 모델

`src/utils/learningExperience.ts`에 화면 연결용 모델을 추가했다.

| 함수 | 역할 |
| --- | --- |
| `createHomeStepCards(entries, completedWordIds)` | 홈 Step 카드 데이터 생성 |
| `createQuizCardView(entry, locale)` | 퀴즈 카드 표시 데이터 생성 |
| `createReviewSummary(input)` | 복습 대상/완료/최근 오답 요약 |
| `hasPinyinToneMarks(entries)` | 병음 성조 문자 보존 확인 |

로케일 선택지는 아래로 고정한다.

| Locale | Label |
| --- | --- |
| `ko` | `한국어` |
| `ja` | `日本語` |
| `en` | `English` |

## 홈 Step 카드 정책

홈 화면 단원 카드는 Step 1-10으로 표시한다.

각 카드에는 아래 정보를 포함한다.

- `Step N`
- `Lesson A-B`
- 단어 수
- `HSK4`
- 진행률

검증된 범위:

| Step | Lesson |
| --- | --- |
| 1 | 1-2 |
| 2 | 3-4 |
| 3 | 5-6 |
| 4 | 7-8 |
| 5 | 9-10 |
| 6 | 11-12 |
| 7 | 13-14 |
| 8 | 15-16 |
| 9 | 17-18 |
| 10 | 19-20 |

## 검증 명령

```sh
npm run validate:step11
```

검증 결과:

- `ko`, `ja`, `en` 중국어 학습 UI 문자열이 있다.
- 홈 Step 카드가 Step 1-10, Lesson 1-20, HSK4를 커버한다.
- 병음 성조 문자가 데이터에 보존되어 있다.
- 주요 버튼 라벨이 설정한 길이 기준 안에 있다.

## 제한 사항

현재 저장소에는 실제 React 화면이 없다. 따라서 홈/퀴즈/복습/관리자 UI 렌더링 수정은 아직 수행하지 않았고, 이번 단계에서는 컴포넌트가 사용할 화면 데이터 모델과 문자열 정책을 고정했다.
