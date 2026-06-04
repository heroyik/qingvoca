# 4단계 실행 결과: 타입과 유틸리티 중국어 대응

## 산출물

- `src/utils/vocab.ts`
- `src/utils/locale.ts`
- `src/utils/ui.ts`
- `src/utils/priorityWords.ts`
- `scripts/validate_step4_utils.mjs`
- `package.json`

## `src/utils/vocab.ts`

중국어 단어 데이터 접근을 한곳으로 모으는 유틸리티를 추가했다.

| 함수 | 역할 |
| --- | --- |
| `getReading(entry)` | `pinyin -> reading -> furigana` 순서로 읽기 반환 |
| `getStepForLesson(lessonId)` | `Math.ceil(lessonId / 2)` |
| `getBandForStep(step)` | Step 기준 `BASIC`, `INTERMEDIATE`, `ADVANCED` 반환 |
| `getDisplayMeaning(entry, locale)` | `ko`, `ja`, `en` 로케일별 뜻 fallback 처리 |
| `getWordsForStep(entries, step)` | Step별 단어 필터 |
| `getAvailableSteps(entries)` | 데이터에서 Step 목록 계산 |
| `getStepSummaries(entries)` | 홈 화면 단원 배치용 Step 요약 생성 |
| `sortByStepThenWord(entries)` | Step, Lesson, 중국어 단어 순 정렬 |
| `validateStepCoverage(entries)` | Step 1-10 배치 검증 |

## `src/utils/locale.ts`

로케일 저장과 정규화 유틸리티를 추가했다.

| 항목 | 값 |
| --- | --- |
| 지원 로케일 | `ko`, `ja`, `en` |
| 기본 로케일 | `ko` |
| 저장 키 | `kamivoca:zh:locale` |

## `src/utils/ui.ts`

일본어 학습용 레이블 대신 중국어 학습용 UI 문자열 테이블을 추가했다.

지원 키:

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

## `src/utils/priorityWords.ts`

중국어 데이터 기준 우선순위 단어 추출 기준을 추가했다.

| 기준 | 이유 |
| --- | --- |
| `unknown-pos` | 품사 누락 보정 대상 |
| `advanced-step` | Step 8-10 고급 구간 |
| `long-pinyin` | 병음 토큰 4개 이상 |
| `chengyu` | 4글자 단어 또는 성어 후보 |

## 검증 명령

```sh
npm run validate:step4
```

검증 결과:

| 항목 | 값 |
| --- | --- |
| 총 단어 수 | 636 |
| Step 목록 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 |
| Step 0개 단어 | 없음 |
| `lessonId -> step` 규칙 위반 | 없음 |
| `ko`, `ja`, `en` 뜻 fallback 빈 값 | 없음 |

Step별 단어 수:

| Step | Count |
| --- | ---: |
| 1 | 61 |
| 2 | 77 |
| 3 | 63 |
| 4 | 62 |
| 5 | 61 |
| 6 | 63 |
| 7 | 64 |
| 8 | 62 |
| 9 | 61 |
| 10 | 62 |

## 제한 사항

현재 저장소에는 실제 React 앱 소스가 없다. 따라서 `src/components`, `src/hooks`, `src/contexts`의 기존 참조 교체는 아직 수행하지 않았다. 앱 소스가 추가되면 `furigana`, `jlpt`, `opic` 직접 참조를 이번 단계의 유틸리티 함수로 감싸는 방식으로 이어간다.
