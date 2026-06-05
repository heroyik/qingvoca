# 🀄 QingVoca

> **Chinese HSK4 vocabulary on easy mode.**  
> A step-based quiz app that makes grinding 636 HSK4 words feel less like homework and more like a game.

---

## What is this?

> Born from [Kamivoca](https://github.com/heroyik/kamivoca) 🇯🇵 → adapted for Chinese 🇨🇳

QingVoca is a **Chinese vocabulary learning app** built for anyone tackling **HSK4** — whether you're prepping for the exam, leveling up your Mandarin, or just flexing on your flashcard game. It takes the classic word list, chops it into **10 Steps** (covering **20 lessons**, **636 words** total), and wraps it in a slick quiz interface with gamification, offline support, and multi-language definitions.

The UI defaults to **Korean** (with Japanese and English options) — so it's built for Korean speakers learning Chinese, but works for anyone.

### The vibe

- **Step-based progression** — Words are grouped into 10 Steps, each covering 2 lessons. Clear one, unlock the next. Simple.
- **Quiz engine** — Multiple-choice questions with smart distractors pulled from the same HSK4 pool. No easy outs.
- **Gamification** — Earn XP, collect gems, build streaks, and climb the leaderboard. Because motivation is a feature.
- **Offline-first** — Service worker + Firestore local cache means you can study on the subway, in airplane mode, or anywhere your Wi-Fi goes to die.
- **Multi-locale definitions** — See word meanings in Korean, Japanese, or English. Switch anytime.
- **Chinese speech** — Tap the speaker icon and hear the word pronounced via the Web Speech API.
- **Admin tools** — Edit vocabulary entries, manage overrides, and sync changes back to Firestore. For the power users.

---

## Tech stack

| Layer | What we're rocking |
|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router, static export) |
| **UI** | React 19, Tailwind CSS |
| **Backend** | Firebase (Auth + Firestore) |
| **Language** | TypeScript |
| **State** | React Context + hooks |
| **Offline** | Service Worker + Firestore persistent cache |
| **Testing** | Playwright (e2e), custom validation scripts |
| **Deployment** | GitHub Pages (static export) |
| **Package manager** | npm |

---

## Getting started

### Prerequisites

- **Node.js** 20+ (we're on 24, but 20 works fine)
- **npm** (or your preferred package manager)
- A **Firebase project** with Auth (Google sign-in) and Firestore enabled

### 1. Clone and install

```bash
git clone https://github.com/heroyik/qingvoca.git
cd qingvoca
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your-id:web:your-hash
```

> 💡 **Tip:** You can grab these values from Firebase Console → Project Settings → General → Your apps → SDK setup.

### 3. Run the dev server

```bash
npm run dev
```

Hit [http://localhost:3000/qingvoca](http://localhost:3000/qingvoca) and you're in.

> ⚠️ The app runs at `/qingvoca` (not `/`) due to the `basePath` config for GitHub Pages deployment.

---

## Features deep-dive

### 📚 Step-based learning

Words are organized into **10 Steps**, with each step covering **2 lessons** (20 lessons total across the full HSK4 word list). Progress through them sequentially — each step presents a batch of words for quizzing.

```
Step 1  →  Lessons 1-2   (127 words)
Step 2  →  Lessons 3-4   (127 words)
...
Step 10 →  Lessons 19-20 (127 words)
```

### 🎮 Gamification

Every quiz session earns you **XP** and **gems**. Mistakes get logged and queued for review. Complete a unit with a perfect score and you **master** it. Build daily **streaks** and watch your rank climb on the **global leaderboard** (powered by Firestore).

| Stat | What it tracks |
|---|---|
| `xp` | Total experience points earned |
| `gems` | In-app currency (from quiz completions) |
| `streak` | Consecutive study days |
| `completedUnits` | Steps you've finished |
| `masteredUnits` | Steps you've aced (0 mistakes) |
| `mistakes` | Words you still need to work on |

### 🔍 Quiz engine

The quiz presents a Chinese word (with pinyin) and asks you to pick the correct meaning from **4 options**. Distractors are intelligently pulled from the same HSK4 pool — specifically from nearby Steps — so they feel relevant, not random.

Features:
- **Smart wrong answers** — Distractors are from the same difficulty band
- **Pinyin display** — Toggle on/off in settings
- **Audio playback** — Hear the word via Web Speech API
- **Instant feedback** — Correct/wrong indicators with word highlighting

### 🌐 Multi-locale

Switch between **Korean (ko)**, **Japanese (ja)**, and **English (en)** for word definitions. Your preference is saved to localStorage.

| Locale | Default meaning source |
|---|---|
| `ko` | Korean translation → meaning → English → word |
| `ja` | Japanese translation → Korean → meaning → word |
| `en` | English translation → meaning → Korean → word |

### 📴 Offline mode

QingVoca works without an internet connection. Here's how:

1. **Service Worker** caches all static assets (JS, CSS, fonts, the full vocab dataset)
2. **Firestore persistent local cache** keeps your Firestore data synced locally
3. **OfflineModeGate** shows a friendly banner when you're in offline mode

The app gracefully degrades — Firebase features (leaderboard, cloud sync) are disabled when offline, but quizzes and progress tracking keep working via localStorage.

### 🛠️ Admin tools

Unlockable from the profile tab, the admin panel lets you:

- **Search & edit** any vocabulary entry (word, pinyin, meaning, translations, lesson, step)
- **Delete words** globally (hides them from quizzes across all users)
- **Sync changes** to Firestore so every user gets the update

Changes are applied in real-time via Firestore snapshot listeners.

---

## Project structure

```
qingvoca/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout (providers, metadata)
│   │   ├── page.tsx            # Home page (tabs, dashboard)
│   │   ├── quiz/[unitId]/      # Quiz page for a specific step
│   │   └── quiz/review/        # Review quiz (mistake queue)
│   ├── components/             # React components
│   │   ├── Quiz.tsx            # Core quiz engine
│   │   ├── Leaderboard.tsx     # Global leaderboard
│   │   ├── AdminEditTab.tsx    # Admin vocabulary editor
│   │   ├── OfflineModeGate.tsx # Offline state UI
│   │   └── ServiceWorkerRegistrar.tsx
│   ├── contexts/
│   │   └── GamificationContext.tsx  # State management (auth, progress, Firestore sync)
│   ├── hooks/
│   │   └── useGamification.ts  # Gamification hook
│   ├── types/
│   │   └── chinese-vocab.ts    # TypeScript types
│   ├── utils/                  # Utility functions
│   │   ├── vocab.ts            # Vocab unit/step helpers
│   │   ├── quiz.ts             # Quiz word selection
│   │   ├── gamification.ts     # Progress/score/review types
│   │   ├── firestore.ts        # Firestore collection constants
│   │   ├── speech.ts           # Web Speech API integration
│   │   ├── adminEdit.ts        # Admin edit logic
│   │   ├── locale.ts           # Locale management
│   │   └── ui.ts               # UI strings (multi-locale)
│   ├── lib/
│   │   ├── firebase.ts         # Firebase initialization
│   │   └── constants.ts        # App constants
│   └── data/
│       └── vocab.json          # 636 HSK4 vocabulary entries
├── scripts/                    # Build & validation scripts
│   ├── validate_*.mjs          # 13+ validation scripts
│   ├── sync-firestore-*.mjs    # Firestore sync tools
│   ├── migrate-*.mjs           # Data migration scripts
│   └── generate-offline-manifest.mjs
├── data/
│   └── vocab.json              # Source vocabulary data (pre-transform)
├── plan/
│   └── *.md                    # Development plans & specs
├── public/
│   ├── sw.js                   # Service worker
│   └── offline-manifest.json   # Offline asset manifest
├── .firebaserc                 # Firebase project config
├── firebase.json               # Firebase CLI config
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Firestore index config
└── next.config.ts              # Next.js config (static export)
```

---

## Available scripts

### Development

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Build for production + generate offline manifest |
| `npm start` | Start the production server (local preview of static export) |
| `npm run lint` | Run ESLint |

### Data management

| Command | What it does |
|---|---|
| `npm run data:transform:zh` | Transform raw vocab data → `src/data/vocab.json` |
| `npm run data:refresh:zh` | Refresh vocab from source file |
| `npm run firestore:payload:zh` | Generate Firestore sync payload (dry-run) |
| `npm run admin:sync-edits:local` | Sync Firestore admin edits → local vocab |

### Firebase migration

| Command | What it does |
|---|---|
| `npm run firestore:migrate` | Firestore data migration (dry-run) |
| `npm run firestore:migrate:execute` | Execute Firestore data migration |
| `npm run firestore:rules:export` | Export rules & indexes from kamivoca-app |
| `npm run firestore:rules:deploy` | Deploy rules & indexes to qingvoca-app |
| `npm run firestore:rules:sync` | Export + deploy in one step |

### Testing

| Command | What it does |
|---|---|
| `npm test` | Run regression tests |
| `npm run test:frontend` | Run frontend regression tests |
| `npm run test:e2e` | Run Playwright e2e tests |
| `npm run test:e2e:ui` | Run Playwright tests with UI |
| `npm run validate:*` | Individual step validations (steps 4-13) |
| `npm run validate:frontend:*` | Frontend step validations (steps 2-10) |
| `npm run validate:firebase:auth` | Firebase auth config validation |
| `npm run validate:deploy` | Deployment validation |

---

## Validation pipeline

QingVoca has a rigorous validation pipeline with **13+ step-specific validation scripts** plus frontend validations. These ensure:

- ✅ Vocab data structure and word counts
- ✅ Step/lesson grouping integrity
- ✅ Quiz word selection logic
- ✅ Gamification state management
- ✅ Firebase Auth connection
- ✅ Firestore collection structure
- ✅ Offline manifest correctness
- ✅ UI component rendering
- ✅ Admin edit flow
- ✅ No legacy Cognite residue
- ✅ Regression tests (data integrity, types, exports)

Run them all:

```bash
npm run test
```

---

## Firebase setup

QingVoca uses **Firebase** for:

| Service | Purpose |
|---|---|
| **Authentication** | Google sign-in for user identity |
| **Firestore** | User progress, leaderboard, admin edits, deleted words |

### Collections

| Collection | Documents | Purpose |
|---|---|---|
| `users` | Per-user | Progress, XP, gems, streaks, settings |
| `adminVocabOverrides` | Per-word | Admin-edited vocabulary fields |
| `adminDeletedWords` | Per-word | Globally deleted words |
| `zhVocabEntries` | 636 | Full vocabulary documents |
| `zhFullVocaEntries` | 636 | Extended vocab entries |
| `zhDatasetMeta` | 1 | Dataset metadata |

### Security rules

Firestore rules are in `firestore.rules`. For development, the app uses test mode (`allow read, write: if true`). Lock these down before going to production.

---

## Deployment

QingVoca is deployed as a **static export** to **GitHub Pages** via GitHub Actions.

### How it works

1. Push to `main` branch
2. GitHub Actions runs: install → lint → test → build → upload artifact
3. Deploy to `https://heroyik.github.io/qingvoca/`

### GitHub Actions Secrets/Variables

The following repository variables must be set (already configured):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `qingvoca-app.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `qingvoca-app` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `qingvoca-app.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |

---

## Data format

Each vocabulary entry looks like this:

```json
{
  "id": "1",
  "word": "安排",
  "pinyin": "ānpái",
  "reading": "ānpái",
  "furigana": "",
  "meaning": "to arrange; to plan",
  "translations": {
    "ko": "安排하다",
    "ja": "手配する",
    "en": "to arrange"
  },
  "level": 1,
  "lessonId": 1,
  "step": 1,
  "pos": "verb",
  "hsk": "HSK4",
  "jlpt": "HSK4",
  "band": "BASIC",
  "opic": "BASIC",
  "example": ["我安排了明天的会议。"]
}
```

- `hsk` and `jlpt` are always `HSK4`
- `step` determines which Step the word belongs to (1-10)
- `lessonId` maps to the original lesson (1-20)
- `band` is computed from the step: BASIC (1-3), INTERMEDIATE (4-7), ADVANCED (8-10)

---

## Local storage keys

Progress is persisted to localStorage with the `qingvoca:zh:*` namespace:

| Key | Contents |
|---|---|
| `qingvoca:zh:progress` | Step progress, completed words, scores |
| `qingvoca:zh:review` | Review queue (mistake word IDs) |
| `qingvoca:zh:score` | Total score and streak |
| `qingvoca:zh:rank` | Rank information |
| `qingvoca:zh:locale` | Selected display locale |
| `qingvoca:zh:vocab-overrides` | Local admin edits |
| `qingvoca:zh:deleted-word-keys` | Locally deleted words |

---

## Offline support

The app works fully offline thanks to:

1. **Service Worker** (`public/sw.js`) — Caches all static assets on install
2. **Offline Manifest** (`public/offline-manifest.json`) — Lists every asset to pre-cache
3. **Firestore Persistent Cache** — `persistentLocalCache` with `persistentSingleTabManager`
4. **OfflineModeGate** — UI component that detects online/offline state

When offline:
- ✅ Quizzes work (vocab data is cached)
- ✅ Progress saves to localStorage
- ✅ Local admin edits work
- ❌ Leaderboard updates
- ❌ Cloud sync of progress
- ❌ Google sign-in

---

## Contributing

This is a personal learning project, but PRs are welcome if you spot bugs or have ideas.

1. Fork it
2. Create your branch (`git checkout -b feat/awesome-feature`)
3. Commit your changes (`git commit -m 'feat: add awesome feature'`)
4. Push to the branch (`git push origin feat/awesome-feature`)
5. Open a Pull Request

### Code style

- TypeScript strict mode
- Functional components with hooks
- Context for global state
- Utility functions in `src/utils/`
- Validation scripts in `scripts/`

---

## Acknowledgments

- Built on top of the [Kamivoca](https://github.com/heroyik/kamivoca) architecture (Japanese → Chinese adaptation)
- HSK4 vocabulary sourced from official HSK standard materials
- Firebase for the backend plumbing
- Next.js for the static export magic
- The entire Chinese learning community for keeping us motivated 🀄

---

<div align="center">

**qingvoca** · v0.1.0

*Built with ☕ and 单词卡片*

</div>
