# Frontend Step 8 - Offline and Service Worker

Status: completed

## Scope

- Added `public/sw.js` for app-shell and runtime caching.
- Added `ServiceWorkerRegistrar` to register the service worker under `BASE_PATH`.
- Added `OfflineModeGate` for network-offline status.
- Extended `generate-offline-manifest.mjs` with route and static asset URLs.
- Writes the offline manifest to `public/offline-manifest.json` and `out/offline-manifest.json` after static export.
- Connected online/offline browser events to `GamificationContext`.

## Cached Routes

- `/`
- `/quiz/review`
- `/quiz/1` through `/quiz/10`
- `/quiz/unit-1` through `/quiz/unit-10`
- Next static assets and public JSON/media assets

## Validation

- `npm run validate:frontend:step8`
- `npm run validate:step7`
- `npm run lint`
- `npm run test`
- `npm run build`
