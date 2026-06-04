# 프론트엔드 1단계 실행 결과: Next.js 앱 골격 이식

## 산출물

- `package.json`
- `package-lock.json`
- `.gitignore`
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/quiz/[unitId]/page.tsx`
- `src/app/quiz/review/page.tsx`
- `src/app/globals.css`
- `src/app/page.module.css`
- `src/app/favicon.ico`

## 적용 내용

Kamivoca의 Next.js App Router 구조를 기준으로 QingVoca 앱 골격을 추가했다.

- Next.js 16, React 19, Firebase, lucide-react, Playwright, ESLint 의존성 추가
- `output: "export"` 정적 export 유지
- 기본 `basePath`를 `/qingvoca`로 설정
- `/` 홈 라우트 추가
- `/quiz/[unitId]` 동적 라우트 추가
- `/quiz/review` 복습 라우트 추가
- Step 1-10을 `generateStaticParams()`로 정적 생성
- Kamivoca CSS와 favicon 이식

## 현재 범위

이번 단계는 빌드 가능한 최소 앱 골격이다. Kamivoca의 실제 홈/퀴즈/복습/게이미피케이션 컴포넌트 로직은 다음 단계부터 순차 이식한다.

현재 홈 화면은 `src/data/vocab.json`과 `createHomeStepCards()`를 사용해 Step 카드 목록을 표시한다.

## 검증

```sh
npm run lint
npm run test
npm run build
```

검증 결과:

- ESLint 통과
- 기존 데이터/유틸 회귀 테스트 통과
- Next.js static export 빌드 통과
- `/`, `/quiz/1`-`/quiz/10`, `/quiz/review` 정적 생성 확인

## 다음 단계

2단계는 데이터/타입 어댑터 연결이다. Kamivoca의 `src/utils/vocab.ts` 로직을 QingVoca의 `ChineseVocabEntry`, Step, HSK4, pinyin 정책과 맞춘다.
