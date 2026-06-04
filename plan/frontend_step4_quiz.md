# 프론트엔드 4단계 실행 결과: 퀴즈 화면 이식

## 산출물

- `src/components/Quiz.tsx`
- `src/components/QuizLoader.tsx`
- `src/components/ReviewQuizLoader.tsx`
- `src/app/quiz/[unitId]/page.tsx`
- `src/app/quiz/review/page.tsx`
- `src/app/globals.css`
- `scripts/validate_frontend_step4_quiz_components.mjs`
- `package.json`

## 적용 내용

Kamivoca의 퀴즈 흐름을 QingVoca용 독립 컴포넌트로 이식했다.

유지한 흐름:

- 문제 단위 진행
- 객관식 선택지
- 정답/오답 피드백
- 다음 문제 이동
- 결과 화면
- 재시도
- 복습 퀴즈 진입

QingVoca에 맞춘 변경:

- 문제 카드에 중국어 `word`, `pinyin`, `pos` 표시
- 정답/오답 선택지는 `src/utils/quiz.ts` 기준
- 오답은 같은 `HSK4` 안에서 가까운 Step 우선
- 음성 버튼은 `speakChineseWord()` 연결
- 일본어 kana/kanji/furigana 판별 로직 제거
- Cognite/easy cognate 필터 제거

## 현재 제한

아직 GamificationContext가 연결되지 않았다.

- 점수는 컴포넌트 로컬 상태에만 저장된다.
- 오답 ID는 결과 화면에만 표시된다.
- 복습 큐 저장은 다음 단계에서 연결한다.
- ReviewQuizLoader는 임시로 첫 20개 단어를 사용한다.

## 검증

```sh
npm run validate:frontend:step4
npm run validate:step7
npm run lint
npm run test
npm run build
```

## 다음 단계

5단계는 복습/게이미피케이션 이식이다. Kamivoca의 `GamificationContext`, `useGamification`, 복습 저장/조회 흐름을 QingVoca의 `kamivoca:zh:*` 저장 키와 연결한다.
