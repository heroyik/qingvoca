# 9단계 실행 결과: Firebase/Firestore 동기화 분리

## 산출물

- `src/utils/firestore.ts`
- `scripts/sync-firestore-chinese-vocab.mjs`
- `scripts/validate_step9_firestore.mjs`
- `package.json`

## 컬렉션 정책

중국어 데이터는 일본어 데이터와 섞지 않도록 전용 컬렉션을 사용한다.

| 목적 | 컬렉션 |
| --- | --- |
| 앱용 단어 문서 | `zhVocabEntries` |
| 원본/전체 단어 문서 | `zhFullVocaEntries` |
| 데이터셋 메타 | `zhDatasetMeta` |
| 리더보드 | `zhLeaderboard` |
| 관리자 override | `zhAdminOverrides` |

## 문서 스코프 필드

모든 중국어 단어 문서는 아래 필드를 포함해야 한다.

| 필드 | 값 |
| --- | --- |
| `language` | `zh` |
| `hsk` | `HSK4` |
| `datasetVersion` | `zh-HSK4-v1` |
| `step` | 1-10 |

앱 쿼리는 컬렉션 분리 또는 아래 조건을 사용한다.

```ts
where("language", "==", "zh")
where("hsk", "==", "HSK4")
where("datasetVersion", "==", "zh-HSK4-v1")
```

## Dry-run 페이로드 생성

실제 Firebase 연결 코드가 없으므로 이번 단계에서는 업로드 대신 Firestore 입력 페이로드를 생성한다.

```sh
npm run firestore:payload:zh
```

기본 출력:

- `dist/firestore/chinese-vocab-payload.json`

페이로드 구조:

- `collections`
- `documents`
- `meta`

## 검증 명령

```sh
npm run validate:step9
```

검증 결과:

- `zhVocabEntries`, `zhFullVocaEntries`, `zhDatasetMeta` 컬렉션명이 고정되어 있다.
- 636개 단어 문서가 생성된다.
- 모든 문서에 `language=zh`, `hsk=HSK4`, `datasetVersion=zh-HSK4-v1`, `step`이 포함된다.
- 데이터셋 메타 문서는 `zhDatasetMeta/zh-HSK4-v1` 기준으로 생성된다.
- 실제 Firestore 쓰기는 수행하지 않는다.

## 제한 사항

현재 저장소에는 Firebase SDK 설정, 서비스 계정, 기존 동기화 스크립트가 없다. 따라서 실제 Firestore 업로드는 아직 구현하지 않았고, 다음에 Firebase 코드가 추가되면 이번 단계의 컬렉션/문서 정책을 그대로 연결한다.
