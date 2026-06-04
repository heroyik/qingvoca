# 8단계 실행 결과: 관리자 EDIT 기능 유지

## 산출물

- `src/utils/adminEdit.ts`
- `scripts/sync-admin-edits-to-local.mjs`
- `scripts/validate_step8_admin_edit.mjs`
- `package.json`

## 편집 필드 정책

관리자 EDIT에서 편집 가능한 필드:

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

읽기 전용 또는 자동 정규화 필드:

| 필드 | 정책 |
| --- | --- |
| `id` | 변경 불가 |
| `hsk` | `HSK4` 고정 |
| `jlpt` | `HSK4` 고정 호환 필드 |
| `reading` | `pinyin`에서 자동 생성 |
| `furigana` | `pinyin`에서 자동 생성 |
| `band` | Step 기준 자동 생성 |
| `opic` | Step 기준 자동 생성 호환 필드 |

## 로컬 병합 정책

원본 `data/vocab.json`은 직접 덮어쓰지 않는다. 관리자 편집은 앱용 `src/data/vocab.json`에 병합한다.

기본 명령:

```sh
npm run admin:sync-edits:local
```

기본 입력:

- vocab: `src/data/vocab.json`
- edits: `data/admin-edits.json`
- output: `src/data/vocab.json`

편집 파일 형식:

```json
{
  "edits": [
    {
      "id": "0001",
      "pinyin": "àiqíng",
      "translations": {
        "ko": "사랑",
        "en": "love"
      },
      "pos": "n.",
      "lessonId": 1,
      "example": []
    }
  ]
}
```

## 정규화 규칙

- `lessonId`가 바뀌면 `step = Math.ceil(lessonId / 2)`로 다시 계산한다.
- `level`은 항상 `step`과 같게 맞춘다.
- `pinyin`이 바뀌면 `reading`과 `furigana`도 같은 값으로 맞춘다.
- `translations.ko`가 바뀌고 `meaning`이 별도로 없으면 `meaning`은 한국어 번역 기준으로 갱신한다.
- `hsk`와 `jlpt`는 편집값이 있어도 `HSK4`로 고정한다.
- `band`와 `opic`은 Step 기준으로 다시 계산한다.

## 검증 명령

```sh
npm run validate:step8
```

검증 결과:

- 관리자 편집 병합이 편집 가능 필드를 갱신한다.
- `hsk`와 `jlpt`는 `HSK4`로 유지된다.
- `pinyin` 변경 시 `reading`과 `furigana`가 정규화된다.
- `lessonId` 변경 시 `step`과 `level`이 정규화된다.
- 병합 메타데이터 `adminEditedAt`, `adminEditCount`가 기록된다.

## 제한 사항

현재 저장소에는 실제 `src/components/AdminEditTab.tsx`와 Firebase 관리자 저장 코드가 없다. 따라서 UI 컴포넌트 수정과 Firestore 저장 연동은 아직 수행하지 않았고, 이번 단계에서는 연결 가능한 필드 정책과 로컬 병합 파이프라인을 고정했다.
