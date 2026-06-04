# 13단계 실행 결과: 테스트 추가 및 회귀 확인

## 산출물

- `scripts/validate_step13_regression.mjs`
- `package.json`
- `plan/step13_regression.md`

## 추가한 명령

```sh
npm run validate:step13
npm run test:regression
npm run test
```

세 명령은 모두 `scripts/validate_step13_regression.mjs`를 실행한다.

## 데이터 회귀 검증

검증 항목:

- `data/vocab.json` 파싱
- 원본 `words` 배열 존재
- 원본 항목 수 636개
- 변환 결과 `src/data/vocab.json` 항목 수 636개
- 모든 변환 항목에 필수 필드 존재
  - `id`
  - `word`
  - `pinyin`
  - `meaning`
  - `translations`
  - `lessonId`
  - `step`
  - `level`
  - `hsk`
  - `pos`
- 모든 항목의 `hsk`가 `HSK4`
- `step`이 1-10 범위
- `step === Math.ceil(lessonId / 2)`
- `level === step`
- Step별 최소 1개 이상 단어 존재

## UI/E2E 대체 모델 검증

현재 실제 React 앱과 Playwright 테스트가 없으므로 아래 항목은 데이터/모델 기반으로 대체 검증한다.

- 홈 Step 모델이 Step 1-10을 커버한다.
- Step 1은 Lesson 1-2를 표시한다.
- Step 10은 Lesson 19-20을 표시한다.
- 퀴즈 라우트 `/quiz/[unitId]`가 오프라인 매니페스트에 포함된다.
- 복습 라우트 `/quiz/review`가 오프라인 매니페스트에 포함된다.
- 로케일별 번역 `ko`, `ja`, `en`이 존재한다.
- 오프라인 매니페스트가 `zh`, `HSK4` 데이터셋 범위를 가진다.

## 전체 단계 검증

`test:regression`은 아래 스크립트를 모두 실행한다.

- `validate:step4`
- `validate:step5`
- `validate:step6`
- `validate:step7`
- `validate:step8`
- `validate:step9`
- `validate:step10`
- `validate:step11`
- `validate:step12`

## 실행 결과

```sh
npm run test:regression
```

결과:

- 데이터 회귀 검증 통과
- UI/E2E 대체 모델 검증 통과
- Step 4-12 검증 스크립트 전체 통과

## 제한 사항

현재 저장소에는 실제 앱 빌드 설정, lint 설정, React 컴포넌트, Playwright 테스트가 없다. 따라서 `npm run lint`, `npm run build`, 실제 브라우저 E2E는 아직 수행할 수 없다. 앱 소스가 추가되면 이번 회귀 스크립트를 유지하면서 실제 lint/build/E2E 명령을 추가한다.
