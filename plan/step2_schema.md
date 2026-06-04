# 2단계 실행 결과: 중국어 앱 표준 스키마 정의

## 산출물

- `src/types/chinese-vocab.ts`

## 표준 스키마

중국어 앱의 1차 표준 단어 타입은 `ChineseVocabEntry`로 고정한다.

```ts
type ChineseVocabEntry = {
  id: string;
  word: string;
  pinyin: string;
  reading: string;
  furigana: string;
  meaning: string;
  translations: {
    ko?: string;
    ja?: string;
    en?: string;
  };
  level: number;
  lessonId: number;
  step: number;
  pos: string;
  hsk: "HSK4";
  jlpt: "HSK4";
  band: "BASIC" | "INTERMEDIATE" | "ADVANCED";
  opic: "BASIC" | "INTERMEDIATE" | "ADVANCED";
  example: string[];
};
```

## 호환 필드 정책

| 필드 | 정책 |
| --- | --- |
| `reading` | `pinyin`과 동일 |
| `furigana` | `pinyin`과 동일한 호환 필드 |
| `hsk` | 모든 항목 `HSK4` |
| `jlpt` | `HSK4`로 채우는 호환 필드 |
| `band` | Step 기준 보조 난이도 |
| `opic` | `band`와 동일한 호환 필드 |
| `example` | 1차 변환에서는 빈 배열 |

## Step 정책

`step = Math.ceil(lessonId / 2)`로 계산한다.

| Step | 포함 레슨 |
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

## Band 정책

| Step | Band |
| --- | --- |
| 1-3 | `BASIC` |
| 4-7 | `INTERMEDIATE` |
| 8-10 | `ADVANCED` |

## 로케일 정책

| 항목 | 값 |
| --- | --- |
| 지원 로케일 | `ko`, `ja`, `en` |
| 기본 로케일 | `ko` |
| 저장 키 | `kamivoca:zh:locale` |

중국어 단어(`word`)와 병음(`pinyin`)은 로케일과 무관하게 항상 표시한다. 뜻 표시는 `getDisplayMeaning(entry, locale)`에서 처리한다.

Fallback 순서:

| Locale | Fallback |
| --- | --- |
| `ko` | `translations.ko` -> `meaning` -> `translations.en` -> `word` |
| `ja` | `translations.ja` -> `translations.ko` -> `meaning` -> `translations.en` -> `word` |
| `en` | `translations.en` -> `meaning` -> `translations.ko` -> `word` |

## 3단계 연결 기준

3단계 변환 스크립트는 아래 규칙을 사용한다.

- 입력 데이터는 `ChineseVocabSourceFile`로 검증한다.
- 출력 항목은 `ChineseVocabEntry` 형태로 생성한다.
- `partOfSpeech` 누락은 `pos: "unknown"`으로 변환한다.
- `id`는 정렬 후 `String(index + 1).padStart(4, "0")`로 생성한다.
- 출력 JSON의 최상위 필드는 기존 앱 호환을 위해 `{ "data": ChineseVocabEntry[] }` 형태로 둔다.
