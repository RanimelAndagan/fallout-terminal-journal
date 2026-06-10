# Product Requirements Document — VAULT-LOG

**A Fallout-inspired CRT terminal journal**

| | |
|---|---|
| **Document version** | 1.0 (prototype scope) |
| **Date** | 2026-06-10 |
| **Status** | Draft — prototype definition |
| **Author** | Project owner (vibe-coding build) |

---

## 1. Purpose

### 1.1 Overview
VAULT-LOG is a client-side, local-first journaling web app styled as a retro **Fallout-style CRT terminal** (green phosphor, scanlines, typewriter text). It lets a single user keep private journal entries that never leave their machine — there is no backend, no account, and no network dependency once the page has loaded.

### 1.2 Problem statement
Most journaling apps require accounts, sync to cloud servers, and carry the privacy/ownership concerns that come with that. People who want a **private, offline, frictionless** place to write — and who enjoy a strong retro aesthetic — have few delightful options.

### 1.3 Solution
A single-page web app that:
- Stores everything **locally** in the browser (IndexedDB) so data is private by default.
- Loads instantly and works **offline** after first visit.
- Wraps the whole experience in an immersive **terminal UI** that makes writing feel like operating a vault computer.

### 1.4 Goals (prototype)
- Prove the core journaling loop: **create, read, edit, delete, search**.
- Prove **terminal-style navigation** between a small set of views.
- Prove the **CRT aesthetic** is achievable and performant in-browser.
- Ship a working demo to **GitHub Pages** with seeded sample entries.

### 1.5 Non-goals (prototype)
- No multi-device sync, cloud storage, or backend of any kind.
- No authentication or multi-user support.
- No rich-text/markdown rendering, attachments, or images.
- No encryption-at-rest (documented as a future consideration).
- No mobile-optimized layout (desktop/keyboard-first for the prototype).

---

## 2. Target audience

### 2.1 Primary persona — "The Wanderer"
- Hobbyist writer / journaler who values **privacy and data ownership**.
- Comfortable with keyboards; enjoys keyboard-driven, low-distraction tools.
- Fan of retro / Fallout / cyberpunk aesthetics — the vibe is part of the appeal.

### 2.2 Secondary persona — "The Tinkerer"
- Developer or maker browsing the project as a **portfolio / reference build**.
- Interested in the local-first architecture and the CRT styling techniques.

### 2.3 User needs
- A fast, private place to write that requires **zero setup**.
- Confidence that entries are **saved automatically** and won't be lost.
- An enjoyable, **immersive** interface that rewards using it.

---

## 3. Features

### 3.1 Prototype use cases (must-have)

| ID | Use case | Description |
|----|----------|-------------|
| UC-1 | **Create entry** | User starts a new entry, gives it a title, and writes a body. |
| UC-2 | **Read entry** | User opens an existing entry to read it in a focused reader view. |
| UC-3 | **Edit entry** | User reopens an entry and modifies its title/body; changes autosave. |
| UC-4 | **Delete entry** | User removes an entry, with a confirmation step. |
| UC-5 | **Search entries** | User filters the entry list by keyword (title and/or body). |
| UC-6 | **Navigate** | User moves between views via terminal menu + keyboard. |

### 3.2 Feature detail

**F-1 · Boot sequence**
A short animated startup (typewriter "ROBCO INDUSTRIES (TM) TERMLINK"-style banner, faux memory/diagnostics readout) that plays on app load and then drops the user into the Terminal Home. Skippable with any keypress.

**F-2 · Terminal Home (main menu)**
The hub view. Presents a numbered/selectable menu of actions:
- `[1] NEW ENTRY` → Entry Editor (new)
- `[2] VIEW ENTRIES` → Entry List
- `[3] SEARCH` → Entry List (search-focused)
- Status line showing entry count and "last accessed" timestamp.

**F-3 · Entry List**
- Lists all entries (title, created/updated date, short preview snippet).
- **Search/filter input** that narrows the list live by keyword.
- Keyboard navigation (up/down to move selection, Enter to open).
- Actions per entry: open (read), edit, delete.
- Empty state when no entries / no search matches.

**F-4 · Entry Editor**
- Title field + multi-line body field.
- **Autosave while typing** (debounced) — no explicit "save" button required.
- Visible save-status indicator (e.g. `SAVING…` / `SAVED ✓`).
- Works for both **new** and **existing** entries.
- Delete action with confirmation.

**F-5 · Entry Reader**
- Read-only, distraction-free display of a single entry.
- Title, full body, created/updated timestamps.
- Body rendered with **typewriter text** animation on open.
- Quick action to switch into Edit.

**F-6 · Sample/seed entries**
On first run (empty database), seed a **small set (3–5) of in-universe sample entries** so the demo isn't empty and showcases list/search/read.

**F-7 · CRT styling layer**
Global visual treatment applied across all views — see §5.

### 3.3 Out of scope for prototype (future backlog)
- Export/import (JSON, Markdown).
- Tags, categories, favorites.
- Encryption / passcode lock.
- Themes beyond green phosphor (amber, blue).
- Sound effects (key clicks, boot hum).
- PWA install + full offline service worker.

---

## 4. Views & navigation

### 4.1 Views (single-page app)
1. **BootSequence** — startup animation; entry point on load.
2. **TerminalHome** — main menu / hub.
3. **EntryList** — browse + search all entries.
4. **EntryEditor** — create/edit an entry (autosave).
5. **EntryReader** — read a single entry.

### 4.2 Navigation model
Terminal-style, **keyboard-friendly** navigation:
- Menu selection by number key or arrow-key highlight + Enter.
- A consistent **"back"** affordance (e.g. `Esc` or a `[0] BACK` menu item) returns toward Terminal Home.
- Navigation is client-side only (no page reloads); view state is held in app memory.

### 4.3 View flow

```
BootSequence
     │  (auto / keypress to skip)
     ▼
TerminalHome ──[1] NEW──────────────▶ EntryEditor (new)
     │  ▲                                   │ autosave
     │  │ [0] BACK                          ▼
     │  └──────────────────────────── (returns)
     │
     ├─[2] VIEW / [3] SEARCH────────▶ EntryList
     │                                   │  select entry
     │                                   ├──▶ EntryReader ──▶ EntryEditor (edit)
     │                                   └──▶ delete (confirm)
     ▼
 (status line, entry count)
```

### 4.4 Keyboard interactions (baseline)
| Key | Action |
|-----|--------|
| `1`–`9` | Select numbered menu item |
| `↑` / `↓` | Move list/menu selection |
| `Enter` | Confirm / open selection |
| `Esc` | Back / cancel |
| Any key | Skip boot sequence |

---

## 5. CRT visual design

The aesthetic is a **core feature**, not decoration.

### 5.1 Look & feel
- **Green phosphor glow**: monochrome green text (e.g. `#33ff66`-family) on near-black background, with a soft text-glow.
- **Scanlines**: subtle horizontal scanline overlay across the screen.
- **Typewriter text rendering**: text reveals character-by-character in boot sequence and reader.
- **Monospace font** throughout (a terminal/console typeface).
- Optional flicker/vignette for ambiance (kept subtle and performant).

### 5.2 Design principles
- **Legibility first** — effects must never make text hard to read.
- **Performance** — animations must stay smooth (target 60fps); effects are CSS-driven where possible.
- **Accessibility consideration** — honor `prefers-reduced-motion` to tone down/disable typewriter + flicker for users who need it.
- **Cohesion** — every view shares the same frame, glow, and type treatment.

### 5.3 Sample entry tone
Seed entries should be written in a light **in-universe "vault dweller's log"** voice to reinforce the theme, while clearly being demo content.

---

## 6. Technical requirements

### 6.1 Stack
| Concern | Choice |
|---------|--------|
| Build tool | **Vite** |
| Language | **TypeScript** |
| App type | Single-page app (SPA), **client-side only** |
| Architecture | **Local-first**, no backend |
| Persistence | **IndexedDB via Dexie.js** |
| Hosting | **GitHub Pages** (static) |
| UI framework | Author's choice (vanilla TS or a lightweight framework) — must keep bundle small and styling control high |

### 6.2 Data model

**Entry**
| Field | Type | Notes |
|-------|------|-------|
| `id` | string/number (PK) | Auto-generated (e.g. UUID or autoincrement) |
| `title` | string | Entry title |
| `body` | string | Entry text content |
| `createdAt` | number (epoch ms) | Set on creation |
| `updatedAt` | number (epoch ms) | Updated on every autosave |

- Dexie schema indexes at minimum `id`, `updatedAt`, and `title` to support listing and search.
- Search may be implemented as a client-side filter over title/body for the prototype (no full-text index required).

### 6.3 Persistence & autosave
- All reads/writes go through a **Dexie data layer** (single source of truth).
- **Autosave** in the editor is **debounced** (e.g. ~400–800ms after the last keystroke) to avoid excessive writes; `updatedAt` refreshed on each save.
- Save status surfaced to the UI (`SAVING…` → `SAVED ✓`).
- **Seeding**: on app init, if the entries table is empty, insert the sample entries.

### 6.4 State & navigation
- View/routing state managed in-app (simple state machine or hash-based routing) — no full reloads.
- Must restore cleanly: reloading the page replays Boot → Home with persisted data intact.

### 6.5 Build & deployment
- Static build output deployable to **GitHub Pages**.
- Vite `base` configured for the GitHub Pages project path.
- Deployment via GitHub Actions or `gh-pages` branch (author's choice).
- No environment variables / secrets required (fully static).

### 6.6 Browser support & performance
- Target modern evergreen desktop browsers (Chrome, Edge, Firefox).
- Requires IndexedDB support (universal in target browsers).
- First load should be lightweight; CRT effects must not degrade typing responsiveness.

### 6.7 Privacy & data ownership
- 100% local storage; **no data transmitted** anywhere.
- Data lives in the user's browser profile; clearing site data deletes entries (documented to the user as a known limitation of the prototype).

---

## 7. Success criteria (prototype "done")

The prototype is complete when:
- [ ] All five views (BootSequence, TerminalHome, EntryList, EntryEditor, EntryReader) exist and are reachable via keyboard-driven terminal navigation.
- [ ] A user can **create, read, edit, delete, and search** entries.
- [ ] Entries persist in **IndexedDB (Dexie)** across reloads, with **autosave** working in the editor.
- [ ] **3–5 sample entries** seed automatically into an empty database.
- [ ] The app renders the **core CRT look** (green phosphor, scanlines, typewriter text) consistently across views.
- [ ] The app is **built and deployed to GitHub Pages** and runs offline after first load.

---

## 8. Risks & open questions

| Item | Note |
|------|------|
| CRT effects vs. performance | Heavy filters/animation can hurt typing latency — keep effects CSS-light and test. |
| IndexedDB data loss | Browser data clearing wipes entries; future export/import mitigates. |
| Reduced-motion users | Must provide a calmer mode; confirm scope for prototype. |
| Framework choice | Vanilla TS keeps it lean but more manual; a small framework speeds view logic — decide before build. |
| Search scale | Client-side filter is fine for small datasets; revisit if entry counts grow large. |

---

## 9. Future roadmap (post-prototype)
1. Export / import (JSON + Markdown) for data portability.
2. Tags, search-by-tag, and favorites.
3. Optional passcode lock / encryption-at-rest.
4. Alternate terminal themes (amber, blue) + optional CRT sound FX.
5. Full PWA: installable, service-worker offline caching.
6. Responsive/mobile-friendly layout.
