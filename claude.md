# CLAUDE.md — Terminal Journal

Read plan.md, master-prompt-terminal-journal.md, and HANDOFF.md before writing code. HANDOFF.md has the session habits (commit small, update PROGRESS) and the current state of the build.

## What this is

A local-first journaling web app styled as a faithful Fallout 3 / New Vegas terminal. Single user, no backend, no accounts, no network calls after load. Entries live in IndexedDB and never leave the device. The in-fiction brand is RaniCo, never RobCo.

## Stack

- Vite + TypeScript, strict mode, no frameworks, no CSS libraries
- Dexie.js for IndexedDB, vitest for tests. Those are the only deps
- Font: VT323, self-hosted in public/fonts (no Google Fonts request at runtime)
- Deploys to GitHub Pages, `base: "./"` in vite.config.ts

## Layout

- src/types.ts — Holotape, Journal, JournalEntry, HolotapeExport interfaces
- src/db.ts — Dexie schema (holotape / journals / entries tables)
- src/router.ts — hash router, redirects locked routes to #/unlock
- src/state.ts — in-memory session flags (booted, unlocked, instantText)
- src/typewriter.ts — char-by-char text engine, global skip on keypress
- src/ui.ts — menu, Y/N confirm, prompt input helpers
- src/sound.ts — SoundManager, all methods are no-op stubs for now
- src/backup.ts — holotape.json export/import with validation
- src/minigame/logic.ts — pure minigame logic, no DOM, tested
- src/minigame/wordlist.ts — bundled dud pool grouped by word length
- src/screens/*.ts — one module per screen, each returns a cleanup fn
- tests/minigame.test.ts — vitest assertions for likeness/duds/board

## Conventions

- All timestamps are ISO strings
- Screens render into the root they're given and return a cleanup function. The router calls it on navigation
- The minigame logic stays pure. UI behavior goes in screens/unlock.ts, rules go in minigame/logic.ts
- Code comments: lowercase casual sentences, explain why not what, sparse, no emoji, no em dashes, no boilerplate headers
- Commit messages: plain human sentences, small logical commits
- Honest copy: the password minigame is a privacy lock, not encryption. Never claim entries are encrypted

## Commands

- `npm run dev` — dev server
- `npm run test` — vitest, must pass before committing
- `npm run build` — typecheck + production build
