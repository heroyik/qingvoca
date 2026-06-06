# 🀄 QingVoca

> **A slick HSK4 Chinese vocab trainer**  
> 636 HSK4 words, packed into a step-by-step quiz grind that actually feels fun.

Current version: **1.1.1**

---

## What is this?

QingVoca is a **Chinese vocabulary learning app** built for anyone tackling **HSK4** — whether you're prepping for the exam, leveling up your Mandarin, or just flexing on your flashcard game. It takes the classic word list, chops it into **20 Steps** (one Step per original lesson, **636 words** total), and wraps it in a modern Chinese-themed quiz interface with gamification, offline support, and multi-language definitions.

QingVoca is also the vocabulary-focused **digital twin of [Redgold](https://heroyik.github.io/redgold/)**. Redgold is the lesson-reading side of the pair; QingVoca is the drill room built from those lessons. Each QingVoca Step mirrors one Redgold lesson, pulls out the fresh HSK4 words from that lesson, and turns them into a focused quiz loop. On the LEARN path, every `Lesson N · HSK4` label is a live source link: tap it and QingVoca opens the matching Redgold lesson page in a new tab, so you can bounce from vocab reps back to the original lesson context without hunting around.

The UI supports **Korean, Japanese, and English** — switch anytime from the ME tab.

### Design

QingVoca features a **modern Chinese aesthetic** with a red and rose gold color palette, traditional cloud motif patterns, dark mode support, and the 清 character favicon. The design draws from authentic Chinese visual language while maintaining a clean, contemporary feel.

### Features

- **Step-based progression** — Words are grouped into 20 Steps, each covering 1 original lesson. Clear one, unlock the next. Simple.
- **Redgold-linked lessons** — Every Step is mapped to its Redgold source lesson, and each lesson label links straight back to that Redgold page.
- **Quiz engine** — Multiple-choice questions with randomized question order and smart same-part-of-speech distractors pulled from the full HSK4 pool. No easy outs.
- **Gamification** — Earn XP, collect gems, build streaks, and climb the leaderboard. Your signed-in profile stays visible even when you're still catching the top 10.
- **Offline-first, quota-safe sync** — Service worker + Firestore local cache keep study flows available offline, while local progress is queued and synced later when Firestore is available.
- **Kamivoca-style mobile UX** — LEARN, REVIEW, LEADER, and ME tabs use compact mobile-first cards, path nodes, ranking rows, profile stats, and review controls inspired by Kamivoca.
- **Live LEARN weather** — Optional location-based weather scenery on the LEARN path, with sunny, cloudy, rainy, snowy, windy, thunder, time-of-day color, moon phase at night, and cached weather data.
- **Multi-locale UI** — Entire interface (labels, buttons, messages) in English, Korean, or Japanese. Locale persists via localStorage.
- **Chinese speech** — Tap the speaker icon and hear the word pronounced via the Web Speech API.
- **Chinese feedback** — Correct and wrong answers can speak natural Chinese encouragement directly.
- **Dark mode** — Full dark mode support with system preference detection and manual toggle.
- **Admin tools** — Search, edit, and delete vocabulary entries with full locale support. Sync changes back to Firestore.
- **Vocab export** — Tap the HSK4 pill in the header to download the full vocabulary as JSON.
- **Google sign-in** — Cloud sync of progress across devices via Firebase Auth.

---

## Tech stack

| Layer | What we're rocking |
|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router, static export) |
| **UI** | React 19, Heroicons, Lucide, custom CSS with Chinese design tokens |
| **Backend** | Firebase (Auth + Firestore) |
| **Language** | TypeScript |
| **State** | React Context + hooks |
| **Offline** | Service Worker + Firestore persistent cache |
| **i18n** | Custom `t()` / `tpl()` helpers with 60+ localized string keys |
| **Testing** | Custom validation scripts, Playwright (e2e) |
| **Deployment** | GitHub Pages (static export via GitHub Actions) |
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
NEXT_PUBLIC_ADMIN_EMAIL=your-admin-email@gmail.com
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

Words are organized into **20 Steps**, with each Step covering **1 original lesson** across the full HSK4 word list. Progress through them sequentially — each step presents a focused batch of words for quizzing.

```
Step 1  →  Lesson 1  (31 words)
Step 2  →  Lesson 2  (30 words)
...
Step 20 →  Lesson 20 (30 words)
```

A Kamivoca-style snake path connects all 20 steps visually, with tiered colors (red → navy → gold) for beginner, intermediate, and advanced levels. Each node shows its current state: locked, current, completed, or mastered. The current node gets a START indicator, and units with mistakes show a small review badge that jumps straight into the review flow.

The lesson title inside each Step is more than a label. It is a source bridge back to Redgold:

| QingVoca | Redgold |
|---|---|
| `Step 1 · Lesson 1` | Opens `https://heroyik.github.io/redgold/?lesson=1` |
| `Step 2 · Lesson 2` | Opens `https://heroyik.github.io/redgold/?lesson=2` |
| `Step 20 · Lesson 20` | Opens `https://heroyik.github.io/redgold/?lesson=20` |

That makes the two apps work as a pair: read the lesson in Redgold, drill the new words in QingVoca, then jump right back to the exact lesson whenever a word needs more context.

The path can also render a cached, location-aware weather backdrop using Open-Meteo data; use `?weather=CLEAR`, `?weather=CLOUDY`, `?weather=RAIN`, `?weather=SNOW`, `?weather=WIND`, `?weather=THUNDER`, and `&time=night` URL overrides for visual testing.

### 🎮 Gamification

Every quiz session earns you **XP** and **gems**. Mistakes get logged locally for review and aggregated into the global **Wall of Pain** collection. Complete a unit with a perfect score and you **master** it. Build daily **streaks** and watch your rank climb on the **global leaderboard** (powered by Firestore with a local-cache + TTL fallback). The top 10 stays ranked by XP, while your signed-in profile gets a dedicated `You` row whenever you're outside that cut or still syncing fresh mobile progress.

| Stat | What it tracks |
|---|---|
| `xp` | Total experience points earned |
| `gems` | In-app currency (from quiz completions) |
| `streak` | Consecutive study days |
| `completedUnits` | Steps you've finished |
| `masteredUnits` | Steps you've aced (0 mistakes) |
| `mistakes` | Words you still need to work on |

The REVIEW tab highlights local tricky words, lets you clear individual or all mistakes, and shows a Firestore-backed Wall of Pain list using cache-first reads so the global ranking does not burn reads on every tab open.

### 🔍 Quiz engine

The quiz presents a Chinese word (with pinyin) and asks you to pick the correct meaning from **4 options**. Each quiz session randomizes the order of words for the selected Step, and Retry reshuffles the session again.

Distractors are intelligently pulled from the full HSK4 pool, prioritizing the same part of speech as the answer. Verbs compete with verbs, adverbs with adverbs, nouns with nouns, and compound tags such as `n./v.` can match either side. Nearby Steps are still preferred inside that same-pos pool, so the options feel relevant without becoming obvious.

Features:
- **Smart wrong answers** — Distractors prioritize the same part of speech across all HSK4 lessons
- **Randomized word order** — Each Step quiz and Retry uses a fresh client-side question order
- **Pinyin display** — Toggle on/off in ME; OFF hides pinyin across quiz, review, Wall of Pain, and list previews
- **Audio playback** — Hear the Chinese word via Web Speech API, controlled separately from answer feedback
- **Combo feedback** — Consecutive correct answers trigger combo UI, stronger haptics, and natural Chinese feedback when Chinese feedback is enabled
- **Example feedback** — Correct answers show a short spoken-style Chinese example sentence with pinyin when example data is available
- **Instant feedback** — Correct/wrong indicators with word highlighting
- **Full locale support** — All UI labels, buttons, and messages in ko/ja/en

### 🌐 Multi-locale UI

The entire interface is localized — not just word definitions. Switch between **English (en)**, **Korean (ko)**, and **Japanese (ja)** from the ME tab. Your preference is saved to localStorage.

On first launch, QingVoca uses the device locale when no saved preference exists: Korean device locales select `ko`, Japanese device locales select `ja`, and every other device locale falls back to `en`.

**Localized elements include:**
- Home page titles, subtitles, step/lesson labels, progress text
- Quiz buttons (save, reset, retry, next), feedback messages
- Profile tab labels, sign-in/out buttons, theme toggle
- Admin edit tab (field labels, search placeholder, status messages)
- Review tab (count labels, stats, start button)
- Leaderboard, including the always-visible signed-in user row

| Locale | Meaning fallback chain |
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

Toggleable from the ME tab (admin email configured via `NEXT_PUBLIC_ADMIN_EMAIL`), the admin panel lets you:

- **Search & edit** any vocabulary entry (word, pinyin, meaning, translations, lesson, step)
- **Delete words** globally (hides them from quizzes across all users)
- **Sync changes** to Firestore so every user gets the update
- **Full locale support** — Admin panel labels in ko/ja/en

Admin data loads on demand when the admin panel opens. Changes are still written back to Firestore, but normal study sessions do not subscribe to admin collections. The ME tab exposes Admin edit as a normal settings toggle, alongside Dark mode and display-language controls.

### 📥 Vocab export

Tap the **HSK4 pill** in the header to download the full 636-word vocabulary as a JSON file (`qingvoca-hsk4-636words.json`). Useful for offline study, data analysis, or importing into other tools.

---

## Project structure

```
qingvoca/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout (providers, metadata)
│   │   ├── page.tsx            # Home page (tabs, dashboard, snake path)
│   │   ├── quiz/[unitId]/      # Quiz page for a specific step
│   │   └── quiz/review/        # Review quiz (mistake queue)
│   ├── components/             # React components
│   │   ├── Quiz.tsx            # Core quiz engine (locale-aware)
│   │   ├── QuizLoader.tsx      # Quiz data loader (reads persisted locale)
│   │   ├── ReviewQuizLoader.tsx # Review quiz loader (locale-aware)
│   │   ├── ReviewTab.tsx       # Review tab + Wall of Pain
│   │   ├── Leaderboard.tsx     # Global leaderboard
│   │   ├── AdminEditTab.tsx    # Admin vocabulary editor (locale-aware)
│   │   ├── WeatherBackground.tsx # LEARN weather scene + particles
│   │   ├── OfflineModeGate.tsx # Offline state UI
│   │   └── ServiceWorkerRegistrar.tsx
│   ├── contexts/
│   │   └── GamificationContext.tsx  # State management (auth, progress, Firestore sync)
│   ├── hooks/
│   │   ├── useGamification.ts  # Gamification hook
│   │   └── useWeather.ts       # Cached location weather hook
│   ├── types/
│   │   └── chinese-vocab.ts    # TypeScript types
│   ├── utils/                  # Utility functions
│   │   ├── vocab.ts            # Vocab unit/step helpers
│   │   ├── quiz.ts             # Quiz word selection
│   │   ├── gamification.ts     # Progress/score/review types
│   │   ├── firestore.ts        # Firestore collection constants
│   │   ├── speech.ts           # Web Speech API integration
│   │   ├── adminEdit.ts        # Admin edit logic
│   │   ├── locale.ts           # Locale management (load/save/normalize)
│   │   ├── learningExperience.ts # Home step cards, review summary, locale options
│   │   ├── priorityWords.ts    # Priority word selection
│   │   └── ui.ts               # UI strings — 60+ keys × 3 locales + tpl() helper
│   ├── lib/
│   │   ├── firebase.ts         # Firebase initialization
│   │   └── constants.ts        # App constants, isAdmin() helper
│   └── data/
│       └── vocab.json          # 636 HSK4 vocabulary entries
├── scripts/                    # Build & validation scripts
│   ├── validate_*.mjs          # 13+ validation scripts
│   ├── sync-firestore-*.mjs    # Firestore sync tools
│   ├── migrate-*.mjs           # Data migration scripts
│   └── generate-offline-manifest.mjs
├── data/
│   └── vocab.json              # Source vocabulary data (pre-transform)
├── plan/                       # Development plans & specs
├── public/
│   ├── sw.js                   # Service worker
│   └── offline-manifest.json   # Offline asset manifest
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Firestore index config
├── .github/workflows/
│   └── deploy-pages.yml        # CI/CD pipeline
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
| `npm run firestore:rules:export` | Export rules & indexes from Firestore |
| `npm run firestore:rules:deploy` | Deploy rules & indexes to qingvoca-app |
| `npm run firestore:rules:sync` | Export + deploy in one step |

### Testing

| Command | What it does |
|---|---|
| `npm test` | Run all regression tests |
| `npm run test:frontend` | Run frontend regression tests |
| `npm run test:e2e` | Run Playwright e2e tests |
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
- ✅ UI component rendering (locale-aware markers)
- ✅ Admin edit flow
- ✅ No legacy Cognite residue
- ✅ Regression tests (data integrity, types, exports)

Run them all:

```bash
npm run test
```

---

## Firebase setup (detailed)

QingVoca uses **Firebase** for authentication (Google sign-in) and Firestore (user progress, leaderboard, admin edits, deleted words). This section walks you through every single setting you need to touch after creating a Firebase project.

### Step 1 — Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Enter project name (e.g. `qingvoca-app`)
4. Google Analytics is optional — up to you
5. Click **Create project** and wait for it to finish

### Step 2 — Register a Web App

1. In the Firebase Console, click the **Web** icon (`</>`) on the project overview page
2. Enter app nickname: `qingvoca-web`
3. **Uncheck** "Set up Firebase Hosting" (we use GitHub Pages)
4. Click **Register app**
5. Copy the `firebaseConfig` object — you'll need every field:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",            // ← NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "your-app.firebaseapp.com", // ← NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "your-project-id",            // ← NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "your-app.firebasestorage.app", // ← NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",         // ← NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abc123"         // ← NEXT_PUBLIC_FIREBASE_APP_ID
};
```

> 💡 You can always re-find these values: Firebase Console → ⚙️ **Project Settings** → **General** tab → **Your apps** → **SDK setup and snippets**.

### Step 3 — Enable Google Authentication

1. Firebase Console → **Authentication** → click **Get started**
2. Go to the **Sign-in method** tab
3. Click **Google** → toggle **Enable** → click **Save**
4. Choose your **Project support email** (required by Google)

> ⚠️ **This is the #1 cause of "popup opens then closes" bugs.** If Google sign-in is not enabled here, the OAuth popup will appear briefly and then vanish without any visible error.

### Step 4 — Configure Authorized Domains

1. Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **Authorized domains** section
3. Click **Add domain** and add:

| Domain | Why |
|---|---|
| `localhost` | Local development (`npm run dev`) |
| `your-project.firebaseapp.com` | Firebase default domain |
| `heroyik.github.io` | GitHub Pages production domain |

> ⚠️ **This is the #2 cause of popup failures.** If your domain isn't listed, Firebase will reject the OAuth request silently.

### Step 5 — Create Firestore Database

1. Firebase Console → **Firestore Database** → **Create database**
2. Choose a **location** (pick one close to your users, e.g. `asia-northeast3` for Asia)
3. Start in **test mode** for now (we'll lock it down later)
4. Click **Enable**

### Step 6 — Deploy Firestore Security Rules

```bash
npx firebase login
npx firebase deploy --only firestore:rules --project your-project-id
npx firebase deploy --only firestore:indexes --project your-project-id
```

Or use the npm scripts:

```bash
npm run firestore:rules:deploy
```

### Step 7 — Set up Firestore Collections

| Collection | Documents | Purpose |
|---|---|---|
| `users` | Per-user (by UID) | Progress, XP, gems, streaks, settings, display name |
| `adminVocabOverrides` | Per-word (by entry ID) | Admin-edited vocabulary fields |
| `adminDeletedWords` | Per-word (by word key) | Globally deleted words |
| `zhVocabEntries` | 636 | Full vocabulary documents |
| `zhFullVocaEntries` | 636 | Extended vocab entries |
| `zhDatasetMeta` | 1 | Dataset metadata |
| `zhGlobalMistakes` | Per-word | Wall of Pain aggregate mistake counts |

### Firestore I/O policy

QingVoca keeps Firestore usage intentionally low:

- User progress is the only always-on realtime listener, scoped to `users/{uid}`.
- Progress writes are debounced and flushed on tab hide instead of writing after every quiz state change.
- The leaderboard uses `sessionStorage` TTL cache first, then Firestore local cache, then a single `getDocs()` request.
- The Wall of Pain uses the same cache-first pattern and writes aggregate mistake increments with `increment(1)`.
- Admin vocabulary collections are fetched only when the admin editor opens; regular study sessions do not read them.
- If Firestore returns `resource-exhausted`, the app marks Firestore quota as blocked for the current browser session and falls back to local/demo data instead of retrying.
- Local-first progress changes are queued in localStorage and can be flushed manually from the ME tab with **Sync now**. The button always reports the outcome in the current UI locale.

### Step 8 — Configure Environment Variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_ADMIN_EMAIL=your-admin-email@gmail.com
```

### Step 9 — Verify Local Setup

```bash
npm run validate:firebase:auth
npm run dev
```

Open [http://localhost:3000/qingvoca](http://localhost:3000/qingvoca) → click **ME** tab → click **Sign in with Google**.

### Step 10 — Configure CI/CD (GitHub Actions)

Set these as **Repository Variables** (not Secrets):

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:your-id:web:your-hash` |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Admin email for edit access |

### Quick reference — Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Popup opens then closes | Google sign-in not enabled | **Step 3** — enable Google in Auth → Sign-in method |
| Popup opens then closes | Domain not authorized | **Step 4** — add `localhost` to authorized domains |
| `permission-denied` in console | Firestore rules not deployed | **Step 6** — `firebase deploy --only firestore:rules` |
| `Firebase: No Firebase App` | `.env.local` missing or has placeholders | **Step 8** — fill in real values |
| Build fails in CI | GitHub Actions variables not set | **Step 10** — add all 7 variables |
| Leaderboard is empty | No user XP data, local cache miss, or Firestore quota fallback | Sign in and earn XP, seed users, or wait for quota recovery |
| `resource-exhausted` in console | Firestore quota exceeded | App falls back for the session; reduce traffic or wait for quota reset |
| Offline mode always on | Firebase not configured | `isFirebaseConfigured` checks `apiKey` + `projectId` |

---

## Deployment

QingVoca is deployed as a **static export** to **GitHub Pages** via GitHub Actions.

### How it works

1. Push to `main` branch
2. GitHub Actions runs: install → lint → test → build → upload artifact
3. Deploy to `https://heroyik.github.io/qingvoca/`

---

## Data format

Each vocabulary entry looks like this:

```json
{
  "id": "1",
  "word": "安排",
  "pinyin": "ānpái",
  "meaning": "to arrange; to plan",
  "translations": {
    "ko": "to arrange",
    "ja": "手配する",
    "en": "to arrange"
  },
  "level": 1,
  "lessonId": 1,
  "step": 1,
  "pos": "verb",
  "hsk": "HSK4",
  "example": ["我安排了明天的会议。"],
  "examplePinyin": ["wǒ ān pái le míng tiān de huì yì."]
}
```

---

## Local storage keys

Progress is persisted to localStorage with the `qingvoca:zh:*` namespace:

| Key | Contents |
|---|---|
| `qingvoca:zh:progress` | Step progress, completed words, scores, settings |
| `qingvoca:zh:vocab-overrides` | Local admin edits |
| `qingvoca:zh:deleted-word-keys` | Locally deleted words |
| `qingvoca:zh:locale` | Selected display locale (ko/ja/en); if absent, device locale maps ko→ko, ja→ja, other→en |
| `qingvoca:zh:theme` | Dark/light mode preference |
| `qingvoca:weather:cache` | Cached LEARN weather data |
| `qingvoca:firestore:sync-queue` | Local-first Firestore sync queue for pending progress changes |

Session storage also keeps short-lived Firestore safety state:

| Key | Contents |
|---|---|
| `qingvoca:leaderboard:cache` | Cached leaderboard entries with a 10-minute TTL |
| `qingvoca:global-mistakes:cache` | Cached Wall of Pain entries with a 10-minute TTL |
| `qingvoca:firestore:quota-blocked` | Session-only Firestore circuit breaker after `resource-exhausted` |

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
- ✅ Progress changes are queued for later Firestore sync
- ✅ Local admin edits work
- ❌ Leaderboard updates
- ❌ Immediate cloud sync of progress
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
- All UI strings in `src/utils/ui.ts` (ko/ja/en)
- Validation scripts in `scripts/`

---

## Acknowledgments

- HSK4 vocabulary sourced from official HSK standard materials
- Firebase for the backend plumbing
- Next.js for the static export magic
- The entire Chinese learning community for keeping us motivated 🀄

---

<div align="center">

**qingvoca** · v1.0.1

*Built with ☕ and 单词卡片*

</div>
