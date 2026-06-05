# QingVoca Chinese Look & Feel Redesign Specification

> **Date**: June 5, 2026
> **Status**: Draft — awaiting implementation
> **Scope**: Full visual redesign from Japanese-inspired (KamiVoca) to modern Chinese aesthetic

---

## 1. Executive Summary

QingVoca is currently using a Japanese-inspired visual identity inherited from KamiVoca (와시지, 시폰 미도, 쿠레나이 색상, 후리가나 CSS, JLPT 배지 등). This spec defines the complete visual redesign to an authentic **modern Chinese look & feel** — clean, trendy, and culturally resonant.

### Key Design Decisions
- **Style**: Modern Minimal Chinese (모던 중국풍)
- **Color Theme**: Red + Rose Gold (레드 + 로즈골드)
- **Typography**: Noto Sans (Google Fonts) — Noto Sans SC + Noto Sans KR
- **Motifs**: Geometric Chinese patterns + traditional cloud/wave motifs
- **Dark Mode**: Full light + dark mode support
- **Animations**: Minimal (fade-in/slide transitions only)
- **Icon Set**: Heroicons (replacing Lucide Icons)
- **Background**: Subtle Chinese traditional pattern overlay on flat background

---

## 2. Current State Analysis (What to Remove)

### 2.1 Japanese Color Variables (`:root` in globals.css)
| Variable | Current Value | Status |
|----------|---------------|--------|
| `--kv-washi-paper` | `#F6F4EB` | ❌ Remove |
| `--kv-ai-iro` | `#165E83` | ❌ Remove |
| `--kv-kurenai` | `#CB1B45` | ❌ Remove |
| `--kv-matcha-green` | `#B8D200` | ❌ Remove |
| `--kv-kintsugi-gold` | `#D4AF37` | ❌ Remove |

### 2.2 Japanese Font Stack
```css
/* REMOVE */
font-family: "Shippori Mincho", "Noto Sans JP", ...;
```
**Replace with**: Noto Sans KR / Noto Sans SC / system sans-serif

### 2.3 Japanese CSS Classes & Selectors
| Class/Selector | Location | Action |
|---------------|----------|--------|
| `.japanese-header` | globals.css, page.tsx, Quiz.tsx | ❌ Remove / Rename |
| `.jlpt-badge-quiz` | globals.css | ❌ Remove (use HSK badge) |
| `.jlpt-badge-quiz.smaller` | globals.css | ❌ Remove |
| `ruby.furigana-ruby` | globals.css | ❌ Remove |
| `.furigana-sentence` | globals.css | ❌ Remove |
| `.furigana-base` | globals.css | ❌ Remove |
| `rt.furigana-rt` | globals.css | ❌ Remove |

### 2.4 Japanese-Inspired Header Border
```css
/* REMOVE: Japanese Flag Inspired Border */
border-image: linear-gradient(
  to right,
  var(--kv-kurenai) 0%, var(--kv-kurenai) 20%,
  var(--kv-kintsugi-gold) 20%, var(--kv-kintsugi-gold) 80%,
  var(--kv-kurenai) 80%, var(--kv-kurenai) 100%
);
```
**Replace with**: Solid red or gradient Chinese-style border

### 2.5 UI Strings with "KamiVoca" (`src/utils/ui.ts`)
| Locale | Key | Current Value | New Value |
|--------|-----|---------------|-----------|
| ko | `appTitle` | `중국어 KamiVoca` | `QingVoca` |
| ja | `appTitle` | `中国語 KamiVoca` | `QingVoca` |
| en | `appTitle` | `Chinese KamiVoca` | `QingVoca` |

### 2.6 Constants & Metadata
- `src/lib/constants.ts`: APP_NAME = "QingVoca" (already correct, no change needed)
- `src/app/layout.tsx`: `<html lang="ko">` — keep as-is
- `src/app/layout.tsx`: metadata title = "QingVoca - Chinese Vocabulary" (already correct)
- README.md: Remove "KamiVoca" references, update branding

### 2.7 CSS Comments to Remove
- `/* Japanese-inspired Color Palette */`
- `/* Duo-style logic with Japanese colors */`
- `/* Japanese Flag Inspired Border */`
- `/* Japanese JLPT Badges */`

---

## 3. New Design System

### 3.1 Color Palette

#### Light Mode (Primary)
| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--xh-red` | China Red (中国红) | `#722F37` | Primary brand, buttons, accents |
| `--xh-red-light` | Light Red | `#A0414D` | Hover state, secondary accents |
| `--xh-red-dark` | Dark Red | `#5A252C` | Button shadows, pressed state |
| `--xh-rose-gold` | Rose Gold (玫瑰金) | `#B76E79` | Secondary accent, badges |
| `--xh-rose-gold-light` | Light Rose Gold | `#D4A0A8` | Subtle highlights |
| `--xh-cream` | Off-White / Cream | `#FAF9F6` | Background (light mode) |
| `--xh-paper` | Paper White | `#FFFFFF` | Card backgrounds |
| `--xh-ink` | Ink Black | `#2C2C2C` | Primary text |
| `--xh-ink-light` | Light Ink | `#6B7280` | Secondary text |
| `--xh-border` | Border | `#E8E4E0` | Subtle borders |
| `--xh-jade` | Jade Green | `#2D8B6F` | Success / correct state |
| `--xh-gold` | Imperial Gold | `#C9A96E` | Mastered / premium accents |
| `--xh-navy` | Navy | `#1D3557` | Info / blue actions |

#### Dark Mode
| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--xh-dark-bg` | Dark Background | `#1a1a2e` | Main background |
| `--xh-dark-surface` | Dark Surface | `#252540` | Card/surface background |
| `--xh-dark-surface-2` | Dark Surface 2 | `#2e2e52` | Elevated surfaces |
| `--xh-dark-border` | Dark Border | `#3a3a5c` | Borders in dark mode |
| `--xh-dark-text` | Dark Text | `#e2e8f0` | Primary text in dark |
| `--xh-dark-text-2` | Dark Text Secondary | `#94a3b8` | Secondary text in dark |
| `--xh-red` | China Red | `#C41E3A` | Brighter red for dark backgrounds |
| `--xh-red-light` | Light Red | `#E85D75` | Hover in dark mode |
| `--xh-red-dark` | Dark Red | `#8B1527` | Pressed state in dark |
| `--xh-rose-gold` | Rose Gold | `#D4A0A8` | Rose gold brighter for dark |
| `--xh-gold` | Imperial Gold | `#D4AF77` | Gold brighter for dark |
| `--xh-jade` | Jade Green | `#3DBF91` | Success in dark |

#### Duo-State Colors (Correct / Incorrect)
| State | Light Mode | Dark Mode |
|-------|-----------|-----------|
| Correct | `--xh-jade` (#2D8B6F) | `--xh-jade` (#3DBF91) |
| Correct bg | `#E8F5E9` | `#1a2e1a` |
| Incorrect | `--xh-red` (#722F37) | `--xh-red` (#C41E3A) |
| Incorrect bg | `#FDEDEF` | `#2e1a1a` |

### 3.2 Typography

#### Font Stack
```css
/* Base font */
font-family: "Noto Sans KR", "Noto Sans SC", -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, sans-serif;

/* Chinese characters emphasis */
font-family: "Noto Sans SC", "Noto Sans KR", sans-serif;
```

#### Type Scale
| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `.text-hero` | 36px | 900 | Hero / landing text |
| `.text-main-title` | 32px | 800 | Page title |
| `.text-title` | 24px | 800 | Section title |
| `.text-subtitle` | 18px | 700 | Subtitle / description |
| `.text-body` | 16px | 700 | Body text |
| `.text-small` | 14px | 700 | Supporting text |
| `.text-caption` | 12px | 800 | Caption / meta info |
| `.text-micro` | 10px | 800 | Badges, bottom nav labels |

### 3.3 Spacing & Radius

#### Spacing Scale
| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Micro gaps |
| `--space-sm` | 8px | Small gaps |
| `--space-md` | 12px | Default gaps |
| `--space-lg` | 16px | Section gaps |
| `--space-xl` | 24px | Page padding |
| `--space-2xl` | 32px | Large sections |
| `--space-3xl` | 48px | Major sections |

#### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 6px | Small buttons, badges |
| `--radius-sm` | 8px | Inputs, small cards |
| `--radius-md` | 12px | Cards, modals |
| `--radius-lg` | 16px | Large cards, panels |
| `--radius-xl` | 24px | Featured cards |
| `--radius-full` | 9999px | Pills, avatars |

### 3.4 Shadows

#### Light Mode
```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.10);
--shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.12);
```

#### Dark Mode
```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.4);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.6);
```

### 3.5 Chinese Motifs & Patterns

#### Geometric Pattern (CSS Background)
A subtle repeating geometric pattern using CSS, inspired by Chinese window lattice designs (窗花):
```css
/* Light mode pattern overlay */
background-image:
  linear-gradient(45deg, transparent 48%, var(--xh-border) 48%, var(--xh-border) 52%, transparent 52%),
  linear-gradient(-45deg, transparent 48%, var(--xh-border) 48%, var(--xh-border) 52%, transparent 52%);
background-size: 20px 20px;
opacity: 0.15;
```

#### Traditional Pattern (SVG Background)
An inline SVG cloud/wave pattern (雲紋/波紋) applied as a subtle background overlay:
- Applied to the page background with very low opacity (0.03-0.05)
- SVG file to be created: `public/patterns/cloud-motif.svg`
- Pattern is non-repeating per page view, fixed position

#### Header Decoration
- Replace the Japanese flag-inspired border with a Chinese-style decorative header border
- Use a solid `--xh-red` bottom border with optional subtle gold accent line
- Consider a thin red-to-gold gradient: `linear-gradient(to right, #722F37, #B76E79, #C9A96E)`

---

## 4. Component-by-Component Redesign

### 4.1 Header (Sticky Header)
**Current**: `.sticky-header.japanese-header` with Japanese flag border
**New**: `.sticky-header.xh-header`

| Aspect | Current | New |
|--------|---------|-----|
| Background | `rgba(246, 244, 235, 0.95)` | Light: `rgba(255, 255, 255, 0.97)` / Dark: `rgba(26, 26, 46, 0.97)` |
| Border | Japanese flag gradient | Solid `--xh-red` or thin red-gold gradient |
| Logo text color | `--kv-kurenai` | `--xh-red` |
| Backdrop blur | 8px | 12px (more modern feel) |

### 4.2 Footer Navigation
**Current**: White background, grey icons, active state uses `--kv-kurenai`
**New**: 

| Aspect | Current | New |
|--------|---------|-----|
| Background | White | Light: White / Dark: `--xh-dark-surface` |
| Active color | `--kv-kurenai` | `--xh-red` |
| Active indicator | None | Small dot or underline below active icon |
| Icons | Emoji (⌂, 🏆, 📚, ✎, ◉) | Heroicons (svg) |
| Bottom bar shadow | None | `--shadow-md` upward |

### 4.3 Home Page — Unit Nodes (Snake Path)
**Current**: Circular unit circles with tiered colors (red/blue/gold), snake SVG connector
**New**: Responsive card-style unit nodes (user requested responsive for mobile/tablet/desktop)

#### Desktop Layout (>960px)
- Keep vertical snake path but modernize the visual
- Unit circles become rounded-rectangle cards with subtle border
- Connector SVG simplified — thinner, using `--xh-border` color

#### Tablet Layout (600-960px)
- Same as desktop but slightly narrower cards
- Snake path with tighter sin() oscillation

#### Mobile Layout (<600px)
- Stack vertically, full-width cards
- Remove sin() oscillation (`marginLeft: 0`)
- Cards have: icon/color circle on left, title + meta on right

#### Unit Node States
| State | Current | New |
|-------|---------|-----|
| Locked | Grey circle (#e5e5e5) | Grey card, 50% opacity |
| Current | Red pulsing circle | Red card with subtle pulse glow |
| Completed | Green card | Jade green card |
| Mastered | Gold glowing card | Imperial gold with subtle shimmer |

### 4.4 Quiz Page
**Current**: `.japanese-header`, `--kv-kurenai` progress bar, Duolingo-style card
**New**:

| Aspect | Current | New |
|--------|---------|-----|
| Header | `.japanese-header` | `.xh-header` (renamed) |
| Progress bar fill | `--kv-kurenai` | `--xh-red` |
| Quiz card border | `3px solid --border-light` | `2px solid --xh-border` with `--shadow-sm` |
| Option cards | White, grey border | White, `--xh-border` border, `--radius-sm` |
| Correct state | Green border/bg | `--xh-jade` border/bg |
| Incorrect state | Red border/bg | `--xh-red` border/bg |
| Feedback bar | Green/red bg | Jade/red with Chinese patterns |

### 4.5 Review Page
**Current**: Red-tinted review card, stat values in red
**New**:
- Card background: white (light) / `--xh-dark-surface` (dark)
- Accent color: `--xh-red` (light) / `--xh-red` bright (dark)
- Stat values: `--xh-red`
- Mistake count badges: `--xh-red` background

### 4.6 Leaderboard
**Current**: Grey avatar colors, `--kv-kurenai` XP color
**New**:
| Aspect | Current | New |
|--------|---------|-----|
| Avatar colors | Fixed 5 colors | Chinese-inspired: Red, Rose Gold, Jade, Gold, Navy |
| XP color | `--kv-kurenai` | `--xh-red` |
| Rank badges | Simple text | Gold (#1), Silver (#2), Bronze (#3) colored |

### 4.7 Profile Page
**Current**: Admin badge in gradient red, XP pill in gold
**New**:
| Aspect | Current | New |
|--------|---------|-----|
| Admin badge | `#cb1b45 → #e85d75` gradient | `--xh-red → --xh-rose-gold` gradient |
| XP pill border | `#f3d9a2` | `--xh-gold` border |
| XP pill bg | Gold gradient | `--xh-gold` subtle background |
| Stat cards | White with border | White/dark surface with `--shadow-sm` |

### 4.8 Buttons
**Current**: Duolingo-style with bottom shadow (4px offset)
**New**: Modern flat buttons with subtle shadow

| Button | Current | New |
|--------|---------|-----|
| Primary | `--kv-kurenai` bg, 4px shadow | `--xh-red` bg, `--shadow-sm`, hover: `--xh-red-light` |
| Secondary | `--duo-orange` bg | `--xh-rose-gold` bg |
| Blue | `--duo-blue` bg | `--xh-navy` bg |
| Outline | White bg, red text | White bg, `--xh-red` text, 2px border |
| Ghost | Transparent | Transparent, hover bg `rgba(114, 47, 55, 0.08)` |

### 4.9 Cards
**Current**: 3px border, 8px bottom shadow (Duolingo style)
**New**:
- 1-2px border (`--xh-border`)
- `--shadow-sm` or `--shadow-md`
- `--radius-md` (12px)
- Subtle hover: `translateY(-2px)` + `--shadow-lg`

### 4.10 Logo
**Type**: Text-only logo
**Font**: "Noto Sans SC" (bold/black weight) — for Chinese cultural authenticity
**Text**: "QingVoca"
**Color**: `--xh-red` (#722F37)
**Style**: 
- Letter-spacing: -0.5px (tight, modern)
- Font-weight: 900
- Optional: Small Chinese character accent (清) next to or above the logotype

---

## 5. Dark Mode Implementation

### 5.1 CSS Strategy
Use `prefers-color-scheme: dark` media query + `.dark` class toggle (for manual toggle)

```css
:root {
  /* Light mode defaults */
  --xh-bg: var(--xh-cream);
  --xh-surface: var(--xh-paper);
  --xh-text: var(--xh-ink);
  --xh-text-2: var(--xh-ink-light);
  --xh-border: var(--xh-border);
}

@media (prefers-color-scheme: dark) {
  :root {
    --xh-bg: var(--xh-dark-bg);
    --xh-surface: var(--xh-dark-surface);
    --xh-text: var(--xh-dark-text);
    --xh-text-2: var(--xh-dark-text-2);
    --xh-border: var(--xh-dark-border);
  }
}

.dark {
  --xh-bg: var(--xh-dark-bg);
  --xh-surface: var(--xh-dark-surface);
  --xh-text: var(--xh-dark-text);
  --xh-text-2: var(--xh-dark-text-2);
  --xh-border: var(--xh-dark-border);
}
```

### 5.2 Dark Mode Specific Overrides
- Header background: `rgba(26, 26, 46, 0.97)` with `backdrop-filter: blur(12px)`
- Footer nav: `--xh-dark-surface` background
- Cards: `--xh-dark-surface` background with `--xh-dark-border` border
- Progress bars: Brighter versions of accent colors
- Chinese pattern overlay: Slightly brighter lines on dark background

### 5.3 Dark Mode Toggle
- Add a toggle in the Profile/Settings section
- Persist preference to localStorage key: `qingvoca:zh:theme`
- Respect `prefers-color-scheme` as default
- Smooth transition: `transition: background-color 0.3s, color 0.3s` on `*`

---

## 6. PWA & Manifest Updates

### 6.1 `public/offline-manifest.json`
| Field | Current | New |
|-------|---------|-----|
| `name` | "QingVoca" | "QingVoca" (no change) |
| `short_name` | "QingVoca" | "QingVoca" (no change) |
| `description` | Update to Chinese-focused | "중국어 HSK4 단어장" |
| `theme_color` | TBD | `#722F37` (China Red) |
| `background_color` | TBD | `#FAF9F6` (Cream) |
| Icons | TBD | Create Chinese-themed favicon and icons |

### 6.2 Favicon & App Icons
- Create new favicon: Chinese-inspired icon (e.g., stylized 清 character or red/gold geometric mark)
- Sizes: 16x16, 32x32, 180x180, 192x192, 512x512
- Format: SVG for favicon, PNG for app icons
- Location: `public/icons/`

### 6.3 Offline Screen (`sw.js` + OfflineModeGate.tsx)
- Update offline blocker card colors to match new theme
- Replace `--kv-kurenai` references with `--xh-red`
- Update offline banner border to `--xh-gold`

### 6.4 Service Worker
- No functional changes needed
- Update cached asset list if new pattern SVGs are added

---

## 7. Files to Modify

### 7.1 Core Style Files
| File | Changes |
|------|---------|
| `src/app/globals.css` | Full color palette replacement, font stack, remove Japanese classes, add Chinese patterns, dark mode variables |
| `src/app/page.module.css` | Update `.logo` class, dark mode overrides |

### 7.2 Component Files
| File | Changes |
|------|---------|
| `src/app/page.tsx` | Replace `.japanese-header` → `.xh-header`, update unit node rendering for responsive layout, use Heroicons |
| `src/components/Quiz.tsx` | Replace `.japanese-header`, update color references |
| `src/components/Leaderboard.tsx` | Update avatar colors to Chinese palette |
| `src/components/AdminEditTab.tsx` | Update color references |
| `src/components/OfflineModeGate.tsx` | Update offline blocker colors |
| `src/components/ServiceWorkerRegistrar.tsx` | No visual changes expected |
| `src/components/ReviewQuizLoader.tsx` | Pass updated theme |
| `src/components/QuizLoader.tsx` | Pass updated theme |
| `src/components/OfflineModeGate.tsx` | Update offline screen colors |

### 7.3 Utility & Config Files
| File | Changes |
|------|---------|
| `src/utils/ui.ts` | Update `appTitle` strings to "QingVoca" |
| `src/lib/constants.ts` | No change (already "QingVoca") |
| `src/app/layout.tsx` | Metadata already correct; add dark mode class logic |
| `src/utils/gamification.ts` | No visual changes |

### 7.4 PWA Files
| File | Changes |
|------|---------|
| `public/offline-manifest.json` | Update `theme_color`, `background_color` |
| `public/sw.js` | Add new pattern SVGs to cache list |
| `public/icons/` | New directory with favicon and app icons |

### 7.5 README & Documentation
| File | Changes |
|------|---------|
| `README.md` | Remove KamiVoca references, update branding, update screenshots description |

---

## 8. Implementation Phases

### Phase 1: Foundation (CSS & Variables)
1. Replace `:root` color variables in `globals.css`
2. Add dark mode variables (light defaults + dark overrides)
3. Replace font stack
4. Remove Japanese CSS classes (furigana, JLPT, japanese-header)
5. Add Chinese pattern CSS background utilities
6. Update utility classes (`.text-kv-kurenai` → `.text-xh-red`, etc.)

### Phase 2: Components (Visual Update)
1. Update Header component styling
2. Update Footer navigation with Heroicons
3. Update Home page unit nodes (responsive)
4. Update Quiz page styling
5. Update Review page styling
6. Update Leaderboard styling
7. Update Profile page styling
8. Update Button styles throughout

### Phase 3: Dark Mode
1. Implement dark mode CSS variables
2. Add dark mode toggle in Profile settings
3. Persist theme preference to localStorage
4. Test all components in dark mode

### Phase 4: PWA & Assets
1. Create Chinese-themed favicon and icons
2. Update `offline-manifest.json`
3. Create cloud/wave pattern SVG
4. Update offline screen styling
5. Update service worker cache list

### Phase 5: Strings & Documentation
1. Update `src/utils/ui.ts` appTitle strings
2. Update README.md
3. Clean up KamiVoca references in code comments

---

## 9. Chinese Pattern Assets

### 9.1 Cloud Motif SVG (`public/patterns/cloud-motif.svg`)
A subtle repeating SVG pattern inspired by traditional Chinese cloud motifs (祥云):
- Line art style, very thin strokes
- Colors: `--xh-border` at 10% opacity
- Tile size: 60x60px
- Applied as `background-image` on main containers

### 9.2 Geometric Lattice Pattern
CSS-only pattern for cards/headers:
```css
.xh-pattern-bg {
  position: relative;
}
.xh-pattern-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 19px,
      var(--xh-border) 19px,
      var(--xh-border) 20px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 19px,
      var(--xh-border) 19px,
      var(--xh-border) 20px
    );
  opacity: 0.08;
  pointer-events: none;
}
```

---

## 10. Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | <600px | Single column, full-width cards, no sin() oscillation |
| Tablet | 600-959px | Single column, slightly wider cards, gentle sin() |
| Desktop | ≥960px | Max-width 600px centered, full snake path with sin() |

---

## 11. Accessibility Considerations

- All color changes must maintain WCAG AA contrast ratios (4.5:1 for text)
- Dark mode text colors tested against dark backgrounds
- Focus states updated: `outline: 2px solid --xh-red; outline-offset: 2px`
- Transition animations respect `prefers-reduced-motion`
- Pattern overlays use `pointer-events: none` and `aria-hidden="true"`

---

## 12. Testing Checklist

- [ ] All Japanese references removed (code, CSS, comments, strings)
- [ ] Light mode renders correctly at all breakpoints
- [ ] Dark mode renders correctly at all breakpoints
- [ ] Theme toggle works and persists across reload
- [ ] Unit node responsive layout works (mobile/tablet/desktop)
- [ ] Quiz flow renders correctly in both themes
- [ ] Leaderboard renders correctly in both themes
- [ ] Profile page renders correctly in both themes
- [ ] Offline screen renders correctly in both themes
- [ ] PWA manifest updated with correct theme colors
- [ ] Favicon displays correctly
- [ ] No console errors related to missing CSS variables
- [ ] All Heroicons render correctly
- [ ] Accessibility: contrast ratios pass WCAG AA
- [ ] `prefers-reduced-motion` disables animations

---

## 13. Out of Scope

- New feature development
- Backend/Firestore changes
- Data model changes
- Functionality changes (only visual)
- New page creation
- New language/locale support
