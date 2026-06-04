# 10단계 실행 결과: 오프라인 모드와 빌드 산출물 갱신

## 산출물

- `scripts/generate-offline-manifest.mjs`
- `scripts/validate_step10_offline.mjs`
- `public/offline-manifest.json`
- `package.json`

## 오프라인 매니페스트 정책

중국어 앱 데이터 `src/data/vocab.json`의 SHA-256 해시를 오프라인 매니페스트에 기록한다.

매니페스트 기본 출력:

- `public/offline-manifest.json`

포함 필드:

- `language: "zh"`
- `hsk: "HSK4"`
- `datasetVersion: "zh-HSK4-v1"`
- `assets[].path: "src/data/vocab.json"`
- `assets[].hashAlgorithm: "sha256"`
- `assets[].hash`
- `assets[].totalCount`
- `assets[].stepCount`
- `assets[].lessonCount`
- `routes`

## 생성 명령

```sh
npm run offline:manifest
```

생성 결과:

| 항목 | 값 |
| --- | --- |
| 데이터 파일 | `src/data/vocab.json` |
| 출력 파일 | `public/offline-manifest.json` |
| SHA-256 | `35d7bd01ea00f296aa4c8c9bfc4a672ebb692fb02db1cfa07e79171831918ab5` |
| 단어 수 | 636 |
| Step 수 | 10 |
| Lesson 수 | 20 |

## 검증 명령

```sh
npm run validate:step10
```

검증 결과:

- 오프라인 매니페스트에 `src/data/vocab.json` SHA-256 해시가 포함된다.
- 데이터셋 메타가 `zh`, `HSK4`, `zh-HSK4-v1`로 고정된다.
- 단어 수 636, Step 10개, Lesson 20개가 기록된다.
- 오프라인 대상 라우트로 `/`, `/quiz/[unitId]`, `/quiz/review`가 포함된다.

## 제한 사항

현재 저장소에는 실제 앱 빌드 설정, 서비스 워커, `OfflineModeGate`, `ServiceWorkerRegistrar`가 없다. 따라서 `npm run build`와 네트워크 차단 E2E 검증은 아직 수행하지 않았다. 앱 소스가 추가되면 이 매니페스트를 서비스 워커 프리캐시 또는 오프라인 게이트 표시 데이터에 연결한다.
