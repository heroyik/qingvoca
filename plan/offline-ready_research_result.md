# Kamivoca offline ready 조사 결과

## 조사 대상

기준 저장소: `$HOME/proj/kamivoca`

핵심 파일:

- `public/sw.js`
- `src/components/ServiceWorkerRegistrar.tsx`
- `src/components/OfflineModeGate.tsx`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/lib/firebase.ts`
- `src/contexts/GamificationContext.tsx`
- `scripts/generate-offline-manifest.mjs`
- `package.json`

## 요약

Kamivoca의 "offline ready"는 단순히 브라우저가 오프라인인지를 표시하는 기능이 아니다. 서비스워커가 정적 앱 셸, 주요 라우트, 빌드 산출 asset manifest를 실제 Cache Storage에 모두 저장했는지 확인한 뒤, 앱 UI에 `OFFLINE ready!` 칩을 보여주는 준비 상태 표시 기능이다.

구성은 세 층으로 나뉜다.

1. 빌드 후 `out/offline-assets.json`을 생성한다.
2. 서비스워커가 `offline-assets.json`과 주요 라우트/정적 asset을 캐시에 저장하고, `OFFLINE_STATUS` 메시지에 준비 여부를 응답한다.
3. React 클라이언트가 서비스워커에 준비 상태를 polling하고, `document.documentElement.dataset.offlineReady` 값을 갱신한다. 홈 화면은 이 dataset 변화를 감지해 `OFFLINE ready!`를 표시한다.

## 빌드 산출물 manifest

파일: `scripts/generate-offline-manifest.mjs`

`package.json`의 build 스크립트는 다음 흐름이다.

```json
"build": "next build && node scripts/generate-offline-manifest.mjs"
```

Next static export 결과물인 `out/`을 기준으로 `out/offline-assets.json`을 만든다.

수집 대상:

- `out/_next/static`
  - `css`
  - `js`
  - `json`
  - `ico`
  - `png`
  - `jpg`
  - `jpeg`
  - `svg`
  - `woff`, `woff2`
- `out/images`
  - 선택 디렉터리
  - `mp3`, `wav`, `ogg`, `m4a`, 이미지, 아이콘
- `out/sounds`
  - 선택 디렉터리
  - `mp3`, `wav`, `ogg`, `m4a`, 이미지, 아이콘

생성 URL은 `NEXT_PUBLIC_BASE_PATH || "/kamivoca"`를 prefix로 붙인다. 즉 GitHub Pages용 base path가 manifest URL에도 반영된다.

## 서비스워커 구조

파일: `public/sw.js`

상수:

```js
const CACHE_VERSION = "kamivoca-v3-0-0-offline-4";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const BASE_PATH = "/kamivoca";
const OFFLINE_ASSET_MANIFEST = `${BASE_PATH}/offline-assets.json`;
```

`CACHE_VERSION`이 캐시 namespace다. 새 캐시 구성이 필요하면 이 값을 올려야 이전 캐시가 정리되고 새 캐시가 설치된다.

### 프리캐시 라우트

`PRECACHE_ROUTES`에는 앱 진입점과 퀴즈 라우트가 들어간다.

- `/kamivoca`
- `/kamivoca/`
- `/kamivoca/quiz/review`
- `/kamivoca/quiz/unit-1`부터 `/kamivoca/quiz/unit-15`

이 라우트들은 offline ready 판정의 기본 앱 셸이다.

### 설치 단계

`install` 이벤트에서 `warmShellCache()`를 실행한다.

`warmShellCache()` 동작:

1. `SHELL_CACHE`를 연다.
2. `getOfflineAssetUrls()`로 `/kamivoca/offline-assets.json`을 네트워크에서 가져온다.
3. manifest가 배열이고 `/kamivoca/`로 시작하는 문자열만 남긴다.
4. `PRECACHE_ROUTES`, `OFFLINE_ASSET_MANIFEST`, manifest asset URL을 합쳐 중복 제거한다.
5. `cache.addAll(urlsToCache)`로 한 번에 저장한다.

설치가 끝나면 `self.skipWaiting()`으로 새 서비스워커를 즉시 대기 해제한다.

주의점: `cache.addAll()`은 포함된 URL 중 하나라도 실패하면 전체 설치가 실패할 수 있다. manifest에 없는 파일, base path 불일치, 배포 누락 asset이 들어가면 offline ready가 false로 남거나 서비스워커 설치가 실패할 수 있다.

### 활성화 단계

`activate` 이벤트에서 현재 `CACHE_VERSION`으로 시작하지 않는 모든 캐시를 삭제한다. 이후 `self.clients.claim()`으로 현재 열린 클라이언트를 즉시 제어한다.

### fetch 전략

서비스워커는 다음 요청만 처리한다.

- `GET`
- 같은 origin
- path가 `BASE_PATH`로 시작

처리 방식:

- navigation 요청: `navigateResponse(request)`
- 정적 asset 요청: `cacheFirst(request)`
- 그 외 요청: `networkFirst(request)`

정적 asset 판정:

- `/_next/static/`
- `/images/`
- `/sounds/`
- `.css`
- `.js`
- `.png`
- `.jpg`
- `.jpeg`
- `.svg`
- `.ico`
- `.woff2`

`cacheFirst()`:

1. Cache Storage에서 먼저 찾는다.
2. 없으면 네트워크 fetch.
3. 성공 응답은 `RUNTIME_CACHE`에 저장한다.

`networkFirst()`:

1. 네트워크 fetch.
2. 성공 응답은 `RUNTIME_CACHE`에 저장한다.
3. 네트워크 실패 시 Cache Storage에서 찾는다.
4. 없으면 `${BASE_PATH}/` 캐시 응답으로 fallback한다.

`navigateResponse()`:

1. navigation은 네트워크를 먼저 시도한다.
2. 성공하면 해당 URL 응답을 `SHELL_CACHE`에 저장한다.
3. 실패하면 `matchShellRoute(pathname)`으로 cached route를 찾는다.

`matchShellRoute()` 후보:

- 원래 pathname
- trailing slash를 제거한 normalized path
- normalized path + `/`
- normalized path + `.html`
- 최종 fallback: `${BASE_PATH}/`

Next static export는 라우트별 HTML 경로가 slash/html 형태로 달라질 수 있으므로 이 후보 탐색이 중요하다.

## offline ready 판정

파일: `public/sw.js`

`isOfflineReady()`는 다음을 검사한다.

1. Cache Storage에 `OFFLINE_ASSET_MANIFEST` 응답이 있는지 확인한다.
2. manifest JSON이 배열인지 확인한다.
3. `[BASE_PATH, `${BASE_PATH}/`, ...assets]`를 checks로 만든다.
4. 각 URL이 `caches.match(url)`에 잡히는지 확인한다.
5. 모든 항목이 존재하면 true를 반환한다.

중요한 점:

- `PRECACHE_ROUTES` 전체를 검사하지 않는다.
- 반드시 검사하는 라우트는 `BASE_PATH`, `${BASE_PATH}/` 두 개와 manifest asset 목록이다.
- `/quiz/unit-*`, `/quiz/review`는 설치 때 캐시하지만 ready 판정의 필수 checks에는 직접 들어가지 않는다.
- manifest가 캐시에 없거나 파싱 실패하면 false다.

## 앱과 서비스워커 통신

파일: `src/components/ServiceWorkerRegistrar.tsx`

이 컴포넌트는 client component이며 `src/app/layout.tsx`에서 전역으로 렌더링된다.

동작:

1. 브라우저가 아니거나 service worker를 지원하지 않으면 종료한다.
2. `document.documentElement.dataset.offlineReady = "false"`로 초기화한다.
3. `${BASE_PATH}/sw.js`를 scope `${BASE_PATH}/`로 등록한다.
4. `navigator.serviceWorker.ready`를 기다린다.
5. active worker 또는 controller에 `postMessage({ type: "OFFLINE_STATUS" })`를 보낸다.
6. `MessageChannel`로 `{ ready }` 응답을 받는다.
7. 응답이 true면 dataset을 `"true"`로 바꾸고 polling을 중단한다.
8. false면 1초마다 다시 확인한다.
9. `controllerchange` 이벤트가 오면 즉시 다시 확인한다.

통신 timeout은 1500ms다. 시간 안에 응답이 없으면 false로 처리한다.

서비스워커의 message handler:

```js
self.addEventListener("message", (event) => {
  if (event.data?.type !== "OFFLINE_STATUS") return;

  event.waitUntil(
    (async () => {
      const ready = await isOfflineReady();
      event.ports[0]?.postMessage({ ready });
    })(),
  );
});
```

React state를 직접 전역 provider에 두지 않고, `documentElement.dataset`을 중간 상태 저장소로 사용한다.

## UI 표시

파일: `src/app/page.tsx`

홈 페이지는 local state `isOfflineReady`를 가진다. 초기값은 `false`다.

관찰 방식:

- `document.documentElement.dataset.offlineReady === "true"`를 읽는다.
- `MutationObserver`로 `document.documentElement`의 `data-offline-ready` attribute 변화를 감지한다.
- 변화가 오면 state를 갱신한다.

헤더 표시 조건:

```tsx
{isOfflineMode && (
  <div className="offline-header-chip" title="Admin offline mode is active">
    OFFLINE
  </div>
)}
{!isOfflineMode && isOfflineReady && (
  <div className="offline-ready-chip" title="Offline cache is ready">
    OFFLINE ready!
  </div>
)}
```

즉 오프라인 모드가 켜져 있으면 `OFFLINE` 칩이 우선이고, 온라인 상태이면서 캐시가 준비됐을 때만 `OFFLINE ready!`를 보여준다.

스타일은 `src/app/globals.css`의 `.offline-header-chip`, `.offline-ready-chip`에 있다.

## 오프라인 모드와 차단 게이트

파일: `src/contexts/GamificationContext.tsx`

온라인 상태는 브라우저 이벤트로 관리한다.

- 초기값: `window.navigator.onLine`
- 이벤트: `online`, `offline`

Kamivoca는 단순히 오프라인이면 누구나 계속 쓰게 하지 않는다.

계산값:

- `isAdminUser = isKamiAdminEmail(user?.email)`
- `isOfflineMode = !isOnline && isAdminUser`
- `isOfflineModeBlocked = !isOnline && !isAdminUser`

파일: `src/components/OfflineModeGate.tsx`

`isOfflineModeBlocked`가 true면 전체 화면 overlay를 보여준다. 내용은 관리자 계정으로 한 번 로그인하고 동기화한 뒤 오프라인에서 사용할 수 있다는 안내다.

따라서 Kamivoca의 offline 관련 UI는 두 종류다.

- `OFFLINE ready!`: 서비스워커 캐시가 준비됨
- `OFFLINE`: 관리자 사용자가 현재 오프라인 모드로 앱을 쓰는 중
- blocking overlay: 비관리자 사용자가 오프라인인 상태

## Firebase 오프라인 지속성

파일: `src/lib/firebase.ts`

Firestore 초기화는 persistent local cache를 우선 사용한다.

```ts
db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({}),
  }),
});
```

실패하면 `getFirestore(app)`로 fallback한다.

의미:

- Firestore 문서 캐시가 브라우저에 유지된다.
- 단일 탭 manager를 사용한다.
- 오프라인 UI/서비스워커 캐시와 별개로 Firestore 데이터 접근의 local persistence를 맡는다.

서비스워커는 앱 shell과 정적 asset을 맡고, Firestore persistent cache는 유저 데이터/동기화 데이터를 맡는다.

## weather 캐시와 offline ready의 관계

파일: `src/hooks/useWeather.ts`

날씨 정보는 `localStorage`의 `weather_cache`에 저장된다. 네트워크 실패 시 cached weather를 사용하고, 없으면 기본 `CLEAR`/fallback time-of-day를 사용한다.

이는 offline ready 판정과 직접 연결되지는 않지만, 오프라인 상태에서 LEARN 배경을 계속 그리기 위한 보조 캐시다.

## QingVoca에 이식할 때 확인할 점

QingVoca는 이미 Kamivoca 기반의 offline 구조가 일부 들어와 있다. Kamivoca 구현을 기준으로 비교/보강할 때는 아래 항목을 확인해야 한다.

1. `public/sw.js`
   - `BASE_PATH`가 `/qingvoca`인지 확인한다.
   - `CACHE_VERSION`을 QingVoca 버전에 맞게 갱신한다.
   - `OFFLINE_ASSET_MANIFEST` 파일명이 QingVoca manifest 생성기와 일치하는지 확인한다.
   - `PRECACHE_ROUTES`가 QingVoca 라우트 수와 일치하는지 확인한다. QingVoca는 20 Step 구조이므로 `/quiz/unit-1`부터 `/quiz/unit-20`까지 필요할 수 있다.
   - `OFFLINE_STATUS` message handler와 `isOfflineReady()`가 있는지 확인한다.

2. `scripts/generate-offline-manifest.mjs`
   - build 후 실행되는지 확인한다.
   - output 파일명이 서비스워커와 일치하는지 확인한다.
   - base path가 `NEXT_PUBLIC_BASE_PATH || "/qingvoca"`인지 확인한다.
   - 정적 asset, 이미지, 사운드 등 QingVoca 배포 asset을 빠짐없이 수집하는지 확인한다.

3. `src/components/ServiceWorkerRegistrar.tsx`
   - `${BASE_PATH}/sw.js`와 scope `${BASE_PATH}/`로 등록하는지 확인한다.
   - `OFFLINE_STATUS` 메시지와 `MessageChannel` 응답 처리가 있는지 확인한다.
   - false일 때 polling, true일 때 polling 중단, `controllerchange` 재동기화가 있는지 확인한다.
   - dataset 이름은 `data-offline-ready`로 유지하는 편이 page observer와 호환된다.

4. `src/app/page.tsx`
   - `MutationObserver`로 `document.documentElement`의 `data-offline-ready` 변화를 감지하는지 확인한다.
   - `isOfflineMode`와 `isOfflineReady` 표시 우선순위가 명확한지 확인한다.
   - 헤더 공간에서 칩이 모바일에서 깨지지 않는지 확인한다.

5. `src/app/globals.css`
   - `.offline-ready-chip`, `.offline-header-chip` 스타일이 있는지 확인한다.
   - QingVoca 디자인 토큰에 맞게 색상만 조정해도 된다.

6. `src/lib/firebase.ts`
   - `initializeFirestore(... persistentLocalCache(... persistentSingleTabManager ...))`가 유지되는지 확인한다.
   - 실패 fallback이 `getFirestore(app)`인지 확인한다.

7. `src/contexts/GamificationContext.tsx`
   - `navigator.onLine` 초기화와 `online`/`offline` 이벤트 listener가 있는지 확인한다.
   - QingVoca 정책상 오프라인 차단이 관리자 전용인지, 모든 로그인/게스트에 허용할지 결정해야 한다.

8. 검증
   - `npm run build` 후 `out/offline-assets.json` 생성 여부 확인
   - `offline-assets.json` URL들이 `/qingvoca/` prefix를 가지는지 확인
   - 브라우저에서 서비스워커 설치 후 Cache Storage에 shell/runtime cache 생성 여부 확인
   - `OFFLINE_STATUS` 응답이 true가 되는지 확인
   - 네트워크 offline 전환 후 `/qingvoca`, `/qingvoca/quiz/unit-1`, `/qingvoca/quiz/review` navigation이 열리는지 확인

## 잠재 리스크

- `cache.addAll()`은 하나의 asset 실패에도 설치 실패가 날 수 있다. manifest 생성과 배포 asset 경로가 정확해야 한다.
- `isOfflineReady()`는 manifest asset과 base route만 필수 검사한다. 프리캐시된 quiz route 전체가 실제로 있는지는 별도 검증이 필요하다.
- 서비스워커의 `BASE_PATH`는 런타임 env를 읽지 못하므로 정적 JS에 하드코딩되어 있다. GitHub Pages 외 경로로 배포하면 별도 빌드/생성 전략이 필요하다.
- `documentElement.dataset` 방식은 간단하지만 React context가 아니므로 페이지별 observer가 필요하다.
- `navigator.onLine`은 네트워크 품질을 완전히 보장하지 않는다. 오프라인 모드 표시와 Firestore 실패 처리는 별개로 방어해야 한다.

## 결론

Kamivoca의 "offline ready"는 서비스워커 설치 완료 표시가 아니라, manifest 기반 필수 asset 캐시가 준비됐는지를 앱에 알려주는 상태 표시 기능이다. 핵심 구현 단위는 `public/sw.js`의 `OFFLINE_STATUS` 메시지 처리와 `src/components/ServiceWorkerRegistrar.tsx`의 polling이다.

QingVoca로 이식하거나 점검할 때 가장 중요한 차이는 base path와 라우트 수다. Kamivoca는 `/kamivoca`와 15개 unit route를 기준으로 작성되어 있고, QingVoca는 `/qingvoca`와 20 Step/quiz route를 기준으로 맞춰야 한다.
