# AGENTS.md

## Public Writing Style
README.md, GitHub Releases, and the GitHub repository About/description must never use Korean.
Write all public-facing repo copy in punchy, conversational English with a modern, slightly hip product tone.
Keep Korean only where it is app data, localized UI strings, tests for Korean locale behavior, or otherwise required by source content.

## Validation Suite
A wide array of specialized validation scripts are available (`npm run validate:*`) covering various project stages (data, frontend components, firebase connection). Refer to `package.json` for the list of these steps when task-specific verification is required.

## Data Management
The content pipeline involves specific transformations and refreshes:
- `npm run data:transform:zh`: Process raw Chinese data.
- `npm run data:refresh:zh`: Sync local content with source files.

## Firebase & Infrastructure
Specific scripts handle Firestore transitions and configuration:
- `npm run firestore:rules:sync`: Update indexing and rules.
- `npm run firestore:migrate:*`: Perform migration steps (use `--dry-run` first).

## Testing
- Use `npm run test:e2e` for Playwright-based end-to-end tests.
- Use specific `test:frontend` or `test:regression` for focused checks.
