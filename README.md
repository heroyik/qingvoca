# 🀄 QingVoca

> **중국어 HSK4 어휘 학습 앱**  
> 636개 HSK4 단어를 게임처럼 학습하는 스텝 기반 퀴즈 앱

---

## What is this?

QingVoca is a **Chinese vocabulary learning app** built for anyone tackling **HSK4** — whether you're prepping for the exam, leveling up your Mandarin, or just flexing on your flashcard game. It takes the classic word list, chops it into **10 Steps** (covering **20 lessons**, **636 words** total), and wraps it in a modern Chinese-themed quiz interface with gamification, offline support, and multi-language definitions.

The UI defaults to **Korean** (with Japanese and English options) — so it's built for Korean speakers learning Chinese, but works for anyone.

### Design

QingVoca features a **modern Chinese aesthetic** with a red and rose gold color palette, traditional cloud motif patterns, dark mode support, and the 清 character favicon. The design draws from authentic Chinese visual language while maintaining a clean, contemporary feel.

### Features

- **Step-based progression** — Words are grouped into 10 Steps, each covering 2 lessons. Clear one, unlock the next. Simple.
- **Quiz engine** — Multiple-choice questions with smart distractors pulled from the same HSK4 pool. No easy outs.
- **Gamification** — Earn XP, collect gems, build streaks, and climb the leaderboard. Because motivation is a feature.
- **Offline-first** — Service worker + Firestore local cache means you can study on the subway, in airplane mode, or anywhere your Wi-Fi goes to die.
- **Multi-locale definitions** — See word meanings in Korean, Japanese, or English. Switch anytime.
- **Chinese speech** — Tap the speaker icon and hear the word pronounced via the Web Speech API.
- **Dark mode** — Full dark mode support with system preference detection and manual toggle.
- **Admin tools** — Edit vocabulary entries, manage overrides, and sync changes back to Firestore. For the power users.

---

## Tech stack

| Layer | What we're rocking |
|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router, static export) |
| **UI** | React 19, Heroicons, custom CSS with Chinese design tokens |
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
| `npm run firestore:rules:export` | Export rules & indexes from Firestore |
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
5. Note your **Web client ID** — you may need it for advanced OAuth config

> ⚠️ **This is the #1 cause of "popup opens then closes" bugs.** If Google sign-in is not enabled here, the OAuth popup will appear briefly and then vanish without any visible error.

### Step 4 — Configure Authorized Domains

1. Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **Authorized domains** section
3. Click **Add domain** and add:

| Domain | Why |
|---|---|
| `localhost` | Local development (`npm run dev`) |
| `your-project.firebaseapp.com` | Firebase default domain |
| `your-github-username.github.io` | GitHub Pages production domain |

> ⚠️ **This is the #2 cause of popup failures.** If your domain isn't listed, Firebase will reject the OAuth request silently.

### Step 5 — Create Firestore Database

1. Firebase Console → **Firestore Database** → **Create database**
2. Choose a **location** (pick one close to your users, e.g. `asia-northeast3` for Asia)
3. Start in **test mode** for now (we'll lock it down later)
4. Click **Enable**

### Step 6 — Deploy Firestore Security Rules

The app ships with `firestore.rules` in the repo root. Deploy them:

```bash
# Login to Firebase (first time only)
npx firebase login

# Deploy rules and indexes to your project
npx firebase deploy --only firestore:rules --project your-project-id
npx firebase deploy --only firestore:indexes --project your-project-id
```

> 💡 `firebase` is already a devDependency, so `npx firebase` works without a global install.

Or use the npm scripts:

```bash
npm run firestore:rules:deploy
```

> 📝 The default rules (`allow read, write: if true`) are permissive and meant for development. **Before going to production**, replace `firestore.rules` with proper access rules.

### Step 7 — Set up Firestore Collections

QingVoca reads/writes these Firestore collections:

| Collection | Documents | Purpose |
|---|---|---|
| `users` | Per-user (by UID) | Progress, XP, gems, streaks, settings, display name |
| `adminVocabOverrides` | Per-word (by entry ID) | Admin-edited vocabulary fields |
| `adminDeletedWords` | Per-word (by word key) | Globally deleted words |
| `zhVocabEntries` | 636 | Full vocabulary documents |
| `zhFullVocaEntries` | 636 | Extended vocab entries |
| `zhDatasetMeta` | 1 | Dataset metadata |

The `users` and `adminVocabOverrides`/`adminDeletedWords` collections are created automatically by the app on first write. The vocabulary collections (`zhVocabEntries`, etc.) need to be synced separately:

```bash
# Generate Firestore payload (dry-run)
npm run firestore:payload:zh

# If you have a service account, you can push directly:
npm run firestore:migrate          # dry-run
npm run firestore:migrate:execute  # actually push data
```

### Step 8 — Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values from your Firebase project:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

> 🔒 `.env.local` is in `.gitignore` and will never be committed. Safe for your secrets.

### Step 9 — Verify Local Setup

Run the Firebase auth validation script:

```bash
npm run validate:firebase:auth
```

This checks:
- ✅ `.env.local` exists with real values (not placeholders)
- ✅ `.firebaserc` points to the correct project
- ✅ Firebase config keys are all present
- ✅ `firebase.ts` imports the right modules

Then start the dev server and test:

```bash
npm run dev
```

Open [http://localhost:3000/qingvoca](http://localhost:3000/qingvoca) → click **ME** tab → click **Google 로그인**.

> If the popup opens and closes immediately, check **Step 3** (Google sign-in enabled?) and **Step 4** (authorized domains?) above.

### Step 10 — Configure CI/CD (GitHub Actions)

For production deployments via GitHub Pages, set these as **Repository Variables** (not Secrets — these are public `NEXT_PUBLIC_*` values embedded in the client bundle):

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click the **Variables** tab → **New repository variable**
3. Add all 6:

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:your-id:web:your-hash` |

> These are referenced in `.github/workflows/deploy-pages.yml` as `${{ vars.NEXT_PUBLIC_FIREBASE_* }}`.

### Step 11 — Update `.firebaserc` and `.env.example`

If you're setting up a fresh fork, update these files to point to your own Firebase project:

**`.firebaserc`** — Change the default project:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

**`.env.example`** — Update placeholder values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your-app-id:web:your-app-hash
```

### Step 12 — Service Account (for data migration scripts)

Some scripts (like `firestore:migrate`) require a **Firebase Admin SDK service account**. To set one up:

1. Firebase Console → ⚙️ **Project Settings** → **Service accounts** tab
2. Click **Generate new private key** (saves a `.json` file)
3. Place the JSON file in the project root (it's in `.gitignore`):

```
*-firebase-adminsdk-*.json   ← already gitignored
```

The migration script auto-detects the service account file:

```bash
npm run firestore:migrate            # dry-run
npm run firestore:migrate:execute    # push data to Firestore
```

### Quick reference — Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Popup opens then closes | Google sign-in not enabled | **Step 3** — enable Google in Auth → Sign-in method |
| Popup opens then closes | Domain not authorized | **Step 4** — add `localhost` to authorized domains |
| `permission-denied` in console | Firestore rules not deployed | **Step 6** — `firebase deploy --only firestore:rules` |
| `Firebase: No Firebase App` | `.env.local` missing or has placeholders | **Step 8** — fill in real values |
| Build fails in CI | GitHub Actions variables not set | **Step 10** — add all 6 variables |
| Leaderboard is empty | No vocab data in Firestore | **Step 7** — run `npm run firestore:migrate:execute` |
| Offline mode always on | Firebase not configured | `isFirebaseConfigured` checks `apiKey` + `projectId` |

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
| `qingvoca:zh:theme` | Dark/light mode preference |

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

- HSK4 vocabulary sourced from official HSK standard materials
- Firebase for the backend plumbing
- Next.js for the static export magic
- The entire Chinese learning community for keeping us motivated 🀄

---

<div align="center">

**qingvoca** · v0.1.0

*Built with ☕ and 单词卡片*

</div>
