# Frontend Step 6 - Firebase and Firestore

Status: completed

## Scope

- Added client-only Firebase initialization for static export.
- Added Google Auth provider wiring.
- Added Firestore persistent local cache with fallback to `getFirestore`.
- Connected signed-in user progress to the `users/{uid}` document.
- Added a Firestore-backed leaderboard using the `users` collection ordered by XP.
- Preserved local-only progress when Firebase environment variables are missing.

## Required Environment

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Files

- `src/lib/firebase.ts`
- `src/contexts/GamificationContext.tsx`
- `src/components/Leaderboard.tsx`
- `src/app/page.tsx`
- `scripts/validate_frontend_step6_firebase.mjs`

## Validation

- `npm run validate:frontend:step6`
- `npm run validate:step7`
- `npm run lint`
- `npm run test`
- `npm run build`
