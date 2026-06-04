# 3단계 실행 결과: 데이터 변환 파이프라인 작성

## 산출물

- `scripts/transform_chinese_data.mjs`
- `package.json`
- `src/data/vocab.json`

## 실행 명령

```sh
npm run data:refresh:zh
```

`package.json`에 추가한 스크립트:

```json
{
  "scripts": {
    "data:transform:zh": "node scripts/transform_chinese_data.mjs",
    "data:refresh:zh": "node scripts/transform_chinese_data.mjs data/vocab.json src/data/vocab.json"
  }
}
```

## 변환 정책

- 입력: `data/vocab.json`
- 출력: `src/data/vocab.json`
- 출력 최상위 구조: `{ "data": ChineseVocabEntry[], "meta": { ... } }`
- `id`: 정렬 후 `String(index + 1).padStart(4, "0")`
- 정렬: `lessonId` 오름차순, 같은 레슨 안에서는 `word + pinyin`
- `step`: `Math.ceil(lessonId / 2)`
- `level`: `step`과 동일
- `hsk`: `HSK4`
- `jlpt`: `HSK4`
- `reading`: `pinyin`
- `furigana`: `pinyin`
- `meaning`: `translations.ko -> meaning -> translations.en -> word`
- `pos`: `partOfSpeech`, 누락 시 `unknown`
- `example`: 빈 배열

## 실행 결과

| 항목 | 값 |
| --- | --- |
| 총 항목 수 | 636 |
| 레슨 범위 | 1-20 |
| Step 범위 | 1-10 |
| 중복 `word + pinyin` | 0 |
| `partOfSpeech` 누락 | 1 |
| 호환 필드 검증 실패 | 0 |

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

## 누락 필드 처리

`partOfSpeech` 누락 1건은 앱 데이터에서 `pos: "unknown"`으로 변환했다.

| id | word | pinyin | lessonId | step |
| --- | --- | --- | ---: | ---: |
| `0371` | `事半功倍` | `shì bàn gōng bèi` | 12 | 6 |

## 검증 결과

- `src/data/vocab.json`의 최상위 필드는 `data`, `meta`이다.
- `data.length`는 636이다.
- Step 1-10이 모두 존재한다.
- 모든 항목의 `hsk`와 `jlpt`는 `HSK4`이다.
- 모든 항목의 `level`은 `step`과 동일하다.
- 모든 항목의 `reading`과 `furigana`는 `pinyin`과 동일하다.
