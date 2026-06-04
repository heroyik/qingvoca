# 12단계 실행 결과: 음성 재생 중국어 대응

## 산출물

- `src/utils/speech.ts`
- `scripts/validate_step12_speech.mjs`
- `package.json`

## 음성 선택 정책

Web Speech API 사용 시 중국어 음성을 아래 순서로 선택한다.

1. `zh-CN`
2. `zh-Hans`
3. 사용 가능한 모든 `zh-*` 음성
4. 브라우저 기본 음성

## 추가한 유틸리티

| 함수 | 역할 |
| --- | --- |
| `selectChineseVoice(voices)` | 중국어 음성 fallback 순서대로 음성 선택 |
| `getSpeechText(entry)` | 음성 재생 대상 텍스트로 중국어 `word` 반환 |
| `createChineseUtterance(text, voice)` | 중국어 발음용 `SpeechSynthesisUtterance` 생성 |
| `speakChineseWord(entry, speechSynthesis)` | 중국어 단어 발음 실행 또는 미지원 결과 반환 |

## 미지원 환경 정책

`speechSynthesis`가 없거나 `getVoices()`를 사용할 수 없으면 예외를 던지지 않고 아래 결과를 반환한다.

```ts
{ ok: false, reason: "unsupported", text }
```

단어 텍스트가 비어 있으면 아래 결과를 반환한다.

```ts
{ ok: false, reason: "empty-text", text: "" }
```

## 검증 명령

```sh
npm run validate:step12
```

검증 결과:

- 음성 fallback 순서가 `zh-CN`, `zh-Hans`, `zh-*`, 기본 브라우저 음성 순서로 동작한다.
- 음성 미지원 환경에서 깨지지 않는 결과를 반환한다.
- 중국어 단어 텍스트가 음성 재생 대상으로 존재한다.

## 제한 사항

현재 저장소에는 실제 브라우저 앱, `src/hooks/useSound.ts`, `src/components/AudioPrewarmer.tsx`가 없다. 따라서 Chrome/Safari에서 실제 발음 재생은 아직 검증하지 않았고, 이번 단계에서는 Web Speech API 연결 유틸과 fallback 정책을 고정했다.
