# Frontend Step 7 - Admin EDIT

Status: completed

## Scope

- Added a Chinese-field Admin EDIT tab.
- Added frontend vocab override storage and Firestore sync.
- Added global deleted-word key storage and Firestore sync.
- Connected override application to the active `vocabEntries` list.
- Kept fixed compatibility fields normalized through `applyAdminEdit`.

## Editable Fields

- `word`
- `pinyin`
- `meaning`
- `translations.ko`
- `translations.ja`
- `translations.en`
- `pos`
- `lessonId`
- `example`

## Files

- `src/components/AdminEditTab.tsx`
- `src/contexts/GamificationContext.tsx`
- `src/hooks/useGamification.ts`
- `src/app/page.tsx`
- `src/app/globals.css`
- `scripts/validate_frontend_step7_admin_edit.mjs`

## Validation

- `npm run validate:frontend:step7`
- `npm run validate:step7`
- `npm run lint`
- `npm run test`
- `npm run build`
