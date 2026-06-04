# 프론트엔드 3단계 실행 결과: Kamivoca 홈 화면 이식

## 산출물

- `src/app/page.tsx`
- `src/lib/constants.ts`
- `scripts/validate_frontend_step3_home.mjs`
- `package.json`

## 적용 내용

Kamivoca 홈 화면의 주요 흐름을 QingVoca 홈에 이식했다.

유지한 구조:

- 클라이언트 홈 컴포넌트
- `learn`, `leader`, `review`, `profile`, `edit` 탭 상태
- sticky header
- Step 노드형 학습 경로
- connector SVG
- 하단 네비게이션
- aura bar
- GitHub 링크

QingVoca에 맞춘 변경:

- 앱명은 `QingVoca`
- 기본 base path는 `/qingvoca`
- Step 카드는 중국어 `HSK4` 데이터 기준
- Step 1-10만 표시
- 각 카드에 Lesson 범위, 단어 수, 진행률 표시
- Cognite 탭과 관련 참조 제거
- `filterEasyCognates` 참조 제거

## 현재 제한

아직 Kamivoca의 실제 상태 훅과 컴포넌트는 연결하지 않았다.

- `Leaderboard`는 placeholder
- `ReviewTab`은 placeholder
- `UserProfile`은 placeholder
- `AdminEditTab`은 placeholder
- 진행률/점수는 로컬 placeholder

다음 단계부터 Kamivoca 컴포넌트와 훅을 하나씩 이식한다.

## 검증

```sh
npm run validate:frontend:step3
npm run lint
npm run test
npm run build
```

## 다음 단계

4단계는 퀴즈 화면 이식이다. Kamivoca의 `Quiz.tsx`, `QuizLoader.tsx`, `ReviewQuizLoader.tsx`를 QingVoca의 `src/utils/quiz.ts`, `src/utils/vocab.ts`, `src/utils/speech.ts`에 연결한다.
