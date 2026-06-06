# QingVoca offline ready 및 quota-safe local-first sync 구현 계획

## 목표

`plan/offline-ready_research_result.md`의 Kamivoca offline ready 조사를 기준으로 QingVoca의 오프라인 사용성을 강화한다.

핵심 목표:

1. 서비스워커 기반 `OFFLINE ready!` 상태를 QingVoca 라우트/asset 기준으로 검증 가능하게 만든다.
2. Firestore quota 초과 또는 네트워크/Firestore 오류가 발생해도 학습 데이터는 먼저 로컬에 저장한다.
3. Firestore가 다시 available해졌을 때만 제한된 횟수와 배치 크기로 동기화한다.
4. Firestore I/O가 quota 초과를 유발하지 않도록 reads/writes를 최소화하고, 자동 재시도 폭주를 막는다.

## 현재 상태 요약

QingVoca에는 이미 Kamivoca 기반 offline 기능 일부가 들어와 있다.

- `public/sw.js`
  - `OFFLINE_STATUS` message handler 존재
  - `OFFLINE_MANIFEST` 기반 ready 판정 존재
  - `cacheFirst`, `networkFirst`, navigation fallback 존재
- `src/components/ServiceWorkerRegistrar.tsx`
  - service worker 등록
  - `OFFLINE_STATUS` polling
  - `document.documentElement.dataset.offlineReady` 갱신
- `scripts/generate-offline-manifest.mjs`
  - `public/offline-manifest.json`, `out/offline-manifest.json` 생성
  - `src/data/vocab.json` hash, step/lesson count, routes, urls 포함
- `src/contexts/GamificationContext.tsx`
  - `localStorage`에 progress/settings/admin override 저장
  - `resource-exhausted` 감지 시 `qingvoca:firestore:quota-blocked` session flag 설정
  - stats write debounce 15초
- `src/components/Leaderboard.tsx`, `src/components/ReviewTab.tsx`
  - Firestore read cache와 quota block flag 일부 사용

문제점:

- Firestore 오류 시 로컬 저장은 되지만, 나중에 안정적으로 sync하는 명시적 queue가 없다.
- `onSnapshot`과 자동 `setDoc`가 사용자 상태 변화에 계속 결합되어 있어, 실패 이후 재개 정책이 단순하다.
- 글로벌 mistake, admin edit/delete 같은 write 작업은 quota 오류 시 로컬 반영과 remote 반영의 상태 구분이 약하다.
- leaderboard/global mistakes read는 cache TTL이 있지만, 여러 컴포넌트가 별도 quota flag helper를 가지고 있어 정책이 분산되어 있다.

## 설계 원칙

### Local-first

모든 사용자 행동은 Firestore 성공 여부와 무관하게 먼저 localStorage에 반영한다.

대상:

- 학습 progress
- XP/gems/streak
- completed/mastered units
- mistakes
- settings
- admin vocab overrides
- admin deleted words
- global mistake increment intent

Firestore는 source of truth가 아니라 remote backup/sync target으로 취급한다.

### Firestore I/O 최소화

자동 read/write를 다음 기준으로 제한한다.

- 앱 시작 시 즉시 remote read를 남발하지 않는다.
- sessionStorage/localStorage cache TTL이 유효하면 Firestore read를 생략한다.
- user stats는 `onSnapshot` 대신 필요 시 `getDocFromCache` 우선, 이후 아주 제한적인 server read로 전환한다.
- write는 개별 행동마다 하지 않고 queue로 모아 batch/merge한다.
- global mistake increment는 단어별 즉시 `increment()`를 금지하고, 로컬 누적 후 batch flush한다.
- quota 또는 unavailable 오류가 나면 cooldown 동안 Firestore I/O를 전부 중단한다.

### Backoff와 circuit breaker

Firestore 오류를 다음 상태로 관리한다.

- `available`: Firestore 사용 가능
- `cooldown`: 오류 후 일정 시간 동안 Firestore I/O 금지
- `quotaBlocked`: `resource-exhausted` 감지 후 더 긴 cooldown 적용
- `offline`: `navigator.onLine === false`

권장 cooldown:

- 일반 오류: 5분
- `unavailable`, `deadline-exceeded`: 10분
- `resource-exhausted`: 24시간 또는 다음 세션까지, 단 수동 sync 버튼은 별도 허용 가능

상태 저장:

- sessionStorage: 현재 세션의 차단 플래그
- localStorage: 마지막 실패 시각, 실패 코드, 다음 재시도 가능 시각

## 데이터 모델

### Local sync queue

새 유틸 파일:

- `src/utils/firestoreSyncQueue.ts`

localStorage key:

- `qingvoca:firestore:sync-queue`
- `qingvoca:firestore:sync-state`

queue item 타입:

```ts
type SyncQueueItem =
  | {
      id: string;
      type: "userStats";
      userId: string;
      payload: UserStats;
      updatedAt: number;
      attempts: number;
    }
  | {
      id: string;
      type: "adminOverride";
      entryId: string;
      patch: VocabOverridePatch;
      updatedAt: number;
      attempts: number;
    }
  | {
      id: string;
      type: "adminOverrideDelete";
      entryId: string;
      updatedAt: number;
      attempts: number;
    }
  | {
      id: string;
      type: "adminDeletedWords";
      entryIds: string[];
      wordKeys: string[];
      updatedAt: number;
      attempts: number;
    }
  | {
      id: string;
      type: "globalMistakeDelta";
      wordKey: string;
      word: string;
      delta: number;
      metadata: {
        wordId?: string;
        pinyin?: string;
        meaning?: string;
        translations?: Record<string, string | undefined>;
        lessonId?: number;
        step?: number;
      };
      updatedAt: number;
      attempts: number;
    };
```

압축 규칙:

- `userStats`: queue에 하나만 유지한다. 새 stats가 들어오면 payload를 최신값으로 교체한다.
- `globalMistakeDelta`: `wordKey`별 하나만 유지하고 delta를 합산한다.
- `adminOverride`: `entryId`별 최신 patch만 유지한다.
- `adminOverrideDelete`: 같은 `entryId`의 pending override write를 제거하고 delete만 유지한다.
- `adminDeletedWords`: 같은 batch가 반복되면 wordKeys 기준으로 합친다.

이 압축이 없으면 학습 중 오답마다 Firestore write intent가 늘어나 quota 위험이 커진다.

### Sync state

```ts
type FirestoreSyncState = {
  status: "available" | "cooldown" | "quotaBlocked" | "offline";
  lastErrorCode?: string;
  lastErrorAt?: number;
  nextRetryAt?: number;
  lastSuccessfulSyncAt?: number;
  lastRemoteReadAt?: number;
};
```

## 구현 단계

### 1단계: offline ready 기준 점검 및 보강

대상 파일:

- `public/sw.js`
- `scripts/generate-offline-manifest.mjs`
- `src/components/ServiceWorkerRegistrar.tsx`
- `src/app/page.tsx`
- `scripts/validate_frontend_step8_offline.mjs`

작업:

1. `BASE_PATH`가 `/qingvoca`인지 확인한다.
2. `CACHE_VERSION`을 현재 앱 버전과 연결하거나 명시적으로 갱신한다.
3. manifest `routes`가 QingVoca step 수와 일치하는지 확인한다.
   - `/`
   - `/quiz/review`
   - `/quiz/{step}`
   - `/quiz/unit-{step}`
   - 현재 데이터 기준 step 1-20
4. `isOfflineReady()`가 다음을 확인하도록 유지한다.
   - base path
   - base path slash
   - manifest URL
   - manifest `urls`
5. `OFFLINE_STATUS` polling이 true 이후 중단되는지 확인한다.
6. validation script에 아래 marker를 추가한다.
   - `OFFLINE_STATUS`
   - `document.documentElement.dataset.offlineReady`
   - `MutationObserver`
   - `offline-ready-chip`
   - `out/offline-manifest.json`

완료 기준:

- `npm run validate:frontend:step8`
- `npm run build`
- `out/offline-manifest.json` 생성
- manifest urls에 `/qingvoca/quiz/unit-20` 포함

### 2단계: Firestore 상태/circuit breaker 유틸 분리

새 파일:

- `src/utils/firestoreAvailability.ts`

기능:

- `isFirestoreQuotaError(error)`
- `classifyFirestoreError(error)`
- `readFirestoreSyncState()`
- `writeFirestoreSyncState(state)`
- `canUseFirestore(now = Date.now())`
- `markFirestoreFailure(error)`
- `markFirestoreSuccess()`
- `clearFirestoreCooldown()`

오류 코드 정책:

- `resource-exhausted`: `quotaBlocked`, 24시간 cooldown
- `unavailable`: `cooldown`, 10분 cooldown
- `deadline-exceeded`: `cooldown`, 10분 cooldown
- `permission-denied`: cooldown보다 사용자/설정 문제로 표시하고 자동 재시도 금지
- 기타: 5분 cooldown

기존 `FIRESTORE_QUOTA_BLOCKED_KEY`는 유지하되 helper에서만 읽고 쓰게 한다.

완료 기준:

- `Leaderboard`, `ReviewTab`, `GamificationContext`의 quota helper 중복 제거 계획 적용
- quota flag 읽기/쓰기 경로 단일화

### 3단계: local-first sync queue 구현

새 파일:

- `src/utils/firestoreSyncQueue.ts`

기능:

- `readSyncQueue()`
- `writeSyncQueue(queue)`
- `enqueueUserStats(userId, stats)`
- `enqueueGlobalMistakeDelta(entry, delta)`
- `enqueueAdminOverride(entryId, patch)`
- `enqueueAdminOverrideDelete(entryId)`
- `enqueueAdminDeletedWords(entries)`
- `compactSyncQueue(queue)`
- `getQueueSummary()`

저장 정책:

- localStorage write는 try/catch로 감싼다.
- queue가 너무 커질 경우 `globalMistakeDelta`를 먼저 compact한다.
- queue item은 `updatedAt`, `attempts`를 가진다.

완료 기준:

- unit test 성격의 validation script 추가
- 같은 단어 mistake 10회 enqueue 시 queue item 1개, delta 10으로 압축
- stats enqueue 10회 시 queue item 1개만 유지

### 4단계: GamificationContext를 local-first로 전환

대상 파일:

- `src/contexts/GamificationContext.tsx`

작업:

1. stats 변경은 기존처럼 즉시 localStorage에 저장한다.
2. Firestore `setDoc` 직접 호출 대신 `enqueueUserStats(user.uid, stats)`를 호출한다.
3. debounce 후 flush를 시도하되 `canUseFirestore()`가 false면 return한다.
4. `onSnapshot` 상시 구독은 제거하거나 선택적으로 제한한다.
   - 권장: 앱 시작 시 `getDocFromCache` 우선, cooldown이 아니고 remote cache가 오래됐을 때만 `getDoc` 1회.
   - 실시간 leaderboard가 목적이 아니므로 user doc listener는 과하다.
5. remote stats merge는 한 세션 1회 이하로 제한한다.
6. visibility hidden 시 flush는 queue flush로 대체한다. cooldown이면 skip한다.

Remote stats merge 정책:

- local `updatedAt` 또는 local activity가 remote보다 최신이면 local 우선.
- 배열 필드(`completedUnits`, `masteredUnits`)는 union.
- `mistakes`는 count max 또는 합산 중 하나를 선택한다. 권장: local과 remote 중 큰 count를 사용해 과도한 중복 증가를 막는다.
- settings는 local 우선.

완료 기준:

- 학습/오답/설정 변경이 Firestore 없이도 localStorage에 보존된다.
- Firestore disabled/cooldown 상태에서 write 호출이 발생하지 않는다.
- 정상 상태에서 stats write는 debounce/flush당 최대 1회다.

### 5단계: global mistakes를 delta queue로 전환

대상 파일:

- `src/contexts/GamificationContext.tsx`
- `src/components/ReviewTab.tsx`

현재 추정 동작:

- mistake 기록 시 `zhGlobalMistakes`에 `increment()` 또는 batch write가 발생할 수 있다.
- ReviewTab은 global mistakes를 Firestore에서 읽고 cache한다.

변경:

1. 오답 발생 시 global mistake remote write를 즉시 하지 않는다.
2. `enqueueGlobalMistakeDelta()`로 wordKey별 delta를 로컬 누적한다.
3. queue flush 때만 `writeBatch`로 최대 N개를 처리한다.
4. batch 크기 제한:
   - flush당 최대 20개 doc
   - 하루 최대 flush 횟수 제한 권장: 12회
   - 사용자 interaction 직후 즉시 flush 금지, idle/debounce 기반
5. `resource-exhausted` 발생 시 남은 queue를 유지하고 cooldown으로 전환한다.

ReviewTab read 정책:

- sessionStorage/localStorage cache TTL을 10분에서 30분 이상으로 늘린다.
- cache가 있으면 Firestore read 생략.
- 사용자가 명시적으로 refresh할 때만 remote read 허용.
- quota/cooldown이면 Firestore read 금지.

완료 기준:

- 오답 100회가 Firestore write 100회로 이어지지 않는다.
- 같은 단어 오답은 delta 합산된다.
- global mistakes remote sync 실패 후에도 local queue가 남는다.

### 6단계: admin edit/delete local-first 처리

대상 파일:

- `src/contexts/GamificationContext.tsx`
- `src/components/AdminEditTab.tsx`
- `src/utils/adminEdit.ts`

작업:

1. admin edit 저장 시 즉시 local `vocabOverrides`에 반영한다.
2. Firestore direct `setDoc` 대신 `enqueueAdminOverride()`를 호출한다.
3. admin override clear는 local에서 제거 후 `enqueueAdminOverrideDelete()`.
4. delete words는 local `globalDeletedWordKeys`에 즉시 반영 후 `enqueueAdminDeletedWords()`.
5. Firestore 가능 상태에서만 queue flush.

주의:

- admin edit는 remote sync 전에도 UI에 즉시 반영되어야 한다.
- remote sync 실패 시 사용자에게 “local saved, pending cloud sync” 상태를 보여줄 수 있다.

완료 기준:

- Firestore unavailable 상태에서도 admin edit/delete가 local에서 동작한다.
- queue에 pending admin 작업이 남고, available 시 batch sync된다.

### 7단계: Firestore queue flush 엔진

새 파일 또는 context 내부 hook:

- `src/hooks/useFirestoreSync.ts`

권장 구조:

```ts
function useFirestoreSync({ user, enabled }: { user: User | null; enabled: boolean }) {
  // online event, app focus, idle timer, explicit request에서 flush 시도
}
```

Flush trigger:

- 로그인 완료 후 1회
- `online` 이벤트 발생 후 1회
- page visibility가 hidden 되기 전 1회, 단 cooldown이면 skip
- 5분 interval, 단 queue가 있고 canUseFirestore일 때만
- 사용자가 수동 sync 버튼 클릭 시 1회

Flush 제한:

- 동시에 하나의 flush만 실행한다.
- flush당 최대 1 userStats write.
- flush당 최대 20 globalMistakeDelta writes.
- flush당 최대 20 admin writes.
- 전체 batch write limit은 Firestore 500보다 훨씬 낮게 유지한다.
- 실패하면 즉시 중단하고 cooldown 설정.

Write 방식:

- user stats: `setDoc(userRef, payload, { merge: true })`
- global mistakes: `writeBatch`, doc별 `set(..., { merge: true })` + `increment(delta)`
- admin override: `setDoc(..., { merge: true })`
- admin delete: `writeBatch`

성공 처리:

- 성공한 queue item만 제거한다.
- `markFirestoreSuccess()` 호출.
- `lastSuccessfulSyncAt` 갱신.

실패 처리:

- 실패 item은 queue에 유지한다.
- attempts 증가.
- `markFirestoreFailure(error)` 호출.
- `resource-exhausted`면 session/local block 설정.

완료 기준:

- offline -> online 전환 후 queue가 제한적으로 flush된다.
- quota 오류 후 재시도 loop가 발생하지 않는다.
- queue가 남아 있으면 UI에서 pending 상태를 확인할 수 있다.

### 8단계: Firestore read 최적화

대상:

- `Leaderboard.tsx`
- `ReviewTab.tsx`
- `GamificationContext.tsx`
- admin override loader

정책:

1. Leaderboard
   - cache TTL: 30분 이상
   - cache 있으면 Firestore read 생략
   - `getDocsFromCache` 먼저 시도
   - server `getDocs`는 cache miss이고 canUseFirestore일 때만
   - quota/cooldown이면 demo/cache만 표시

2. Global mistakes
   - cache TTL: 30분 이상
   - user가 Review tab을 열 때마다 remote read 금지
   - explicit refresh 버튼 또는 TTL 만료 시만 read
   - pending local deltas를 화면에 합산 표시할지 검토

3. User stats
   - `onSnapshot` 상시 listener 제거 권장
   - `getDocFromCache` 우선
   - server read는 session당 1회 또는 30분 TTL

4. Admin vocab overrides/deleted words
   - 최초 admin panel 진입 시만 load
   - cache TTL 도입
   - quota/cooldown이면 local cache만 사용

완료 기준:

- 일반 학습 플로우에서 Firestore read가 발생하지 않는다.
- Leaderboard/Review/Admin 진입 같은 명확한 순간에만 TTL 기반 read가 발생한다.

### 9단계: UI 상태 표시

추가 표시:

- `OFFLINE ready!`: 앱 shell cache 준비 완료
- `OFFLINE`: 현재 offline mode
- `SYNC pending`: local queue에 pending item 있음
- `SYNC paused`: Firestore cooldown/quotaBlocked
- `SYNCED`: 마지막 sync 성공 시각이 있음

위치는 ME/Profile 탭 또는 header의 작은 chip이 적합하다. 헤더는 이미 복잡하므로 기본은 ME 탭에 상태 row를 추가하고, quota/cooldown 때만 header chip 표시를 검토한다.

사용자 문구 원칙:

- Firestore quota 초과를 사용자에게 과하게 노출하지 않는다.
- “Saved locally. Cloud sync will resume later.” 같은 실용 문구를 사용한다.

### 10단계: 검증 스크립트 추가/갱신

갱신:

- `scripts/validate_frontend_step8_offline.mjs`
  - offline ready marker 강화
  - manifest route에 unit-20 포함 확인

추가:

- `scripts/validate_firestore_local_first_sync.mjs`

검증 항목:

- `firestoreSyncQueue.ts` 존재
- queue localStorage key 존재
- userStats compact marker 존재
- globalMistakeDelta compact marker 존재
- `resource-exhausted` cooldown marker 존재
- direct `increment()`가 user action path에서 즉시 호출되지 않는지 marker 확인
- `canUseFirestore()` guard가 `Leaderboard`, `ReviewTab`, `GamificationContext`에 적용됐는지 확인

package script:

```json
"validate:firestore:local-first": "node scripts/validate_firestore_local_first_sync.mjs"
```

기존 regression:

- `validate:frontend:step10` 또는 `test:frontend`에 새 validation 포함 검토

## 구현 순서

1. offline ready manifest/route validation 보강
2. Firestore availability/cooldown 유틸 추가
3. sync queue 유틸 추가 및 compact 검증
4. GamificationContext stats write를 queue 기반으로 전환
5. global mistake write를 delta queue 기반으로 전환
6. admin edit/delete write를 queue 기반으로 전환
7. Leaderboard/Review/Admin read TTL 및 `canUseFirestore()` guard 통합
8. sync status UI 추가
9. validation scripts 추가
10. `npm run test`, `npm run validate:frontend:step8`, `npm run validate:firestore:local-first`, `npm run build`

## Firestore I/O 예산

권장 상한:

- 앱 일반 시작:
  - Firestore server read: 0회
  - cache read: 허용
- 학습 세션 중:
  - write: 0회 즉시 실행
  - localStorage write만 수행
- 로그인 후 sync:
  - user stats write: 최대 1회
  - queue batch write: 최대 20-40 docs
- Leaderboard:
  - TTL 내 server read: 0회
  - TTL 만료 후 명시 진입 시 최대 1 query
- Review global mistakes:
  - TTL 내 server read: 0회
  - TTL 만료 후 명시 진입/refresh 시 최대 1 query
- quota 오류 후:
  - server read/write: 0회 until `nextRetryAt`

이 예산을 지키면 일반 학습 반복으로 Firestore quota가 소모되지 않는다.

## 테스트 시나리오

### Offline ready

1. `npm run build`
2. `out/offline-manifest.json` 생성 확인
3. manifest에 `/qingvoca/`, `/qingvoca/quiz/review`, `/qingvoca/quiz/unit-20` 확인
4. 브라우저에서 앱 접속 후 `OFFLINE ready!` 표시 확인
5. DevTools에서 offline 전환 후 주요 라우트 navigation 확인

### Quota 오류

1. Firestore write 함수를 mock하여 `resource-exhausted` throw
2. quiz 완료/오답/admin edit 수행
3. localStorage에는 즉시 반영되는지 확인
4. sync queue에 pending item이 남는지 확인
5. `nextRetryAt` 전까지 Firestore I/O가 발생하지 않는지 확인

### Later sync

1. queue에 pending item 생성
2. Firestore available 상태로 전환
3. flush trigger 실행
4. batch 크기 제한 내에서만 write되는지 확인
5. 성공한 item만 queue에서 제거되는지 확인

### Read 최소화

1. leaderboard cache가 있는 상태에서 Leaderboard 진입
2. Firestore server `getDocs`가 호출되지 않는지 확인
3. TTL 만료 후 한 번만 remote read되는지 확인

## 완료 기준

- QingVoca가 offline ready 상태를 정확히 표시한다.
- Firestore quota 초과 상황에서도 학습과 admin edit가 로컬에서 계속 동작한다.
- pending sync queue가 Firestore available 시 제한적으로 flush된다.
- quota/cooldown 상태에서는 Firestore read/write가 발생하지 않는다.
- validation script가 offline ready와 local-first sync 핵심 marker를 검증한다.
- `npm run test`와 관련 validation이 통과한다.
