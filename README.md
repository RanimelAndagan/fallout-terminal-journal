# Terminal Journal

A private journal styled as a Fallout-style CRT terminal. Everything is local: entries live in your browser's IndexedDB and never leave your device. No backend, no account, no network calls after the page loads.

The whole look is CSS. No game assets, no textures, just gradients, text-shadow and one self-hosted font (VT323, picked because it digitizes the same DEC terminal glyphs the game's font imitates).

## How it works

First run asks you to initialize a holotape: name it, pick an operator name, and choose ten password words. Every time the terminal locks you solve the in-game hacking minigame against one of those ten words. Win and you're in. Run out of attempts and the terminal locks for a few seconds, then deals a new board with a different word. Your data is never touched by failing.

One holotape holds multiple journals. Entries autosave while you type.

Worth being clear about: the password minigame is a privacy lock, like a lock screen. It is not encryption. Anyone with full access to your browser profile could read the data. It keeps casual snoops out, not forensics.

## Backups

EJECT HOLOTAPE downloads everything (settings, words, journals, entries) as `holotape.json`. INSERT HOLOTAPE reads one back, either merging into what's there or replacing it. Browsers can wipe site data, so eject a tape now and then.

## Development

```
npm install
npm run dev      # local dev server
npm run test     # minigame logic tests
npm run build    # typecheck + production build
```

Vite + TypeScript, Dexie for IndexedDB, vitest for tests. No frameworks.

## Project layout

```
index.html            entry page, mounts the CRT shell
public/fonts/         self-hosted VT323 (no font requests at runtime)
src/
  main.ts             registers routes and starts the router
  router.ts           hash router; locked routes redirect to the minigame
  db.ts, types.ts     Dexie schema and the data interfaces
  state.ts            in-memory session flags (booted, unlocked, instant text)
  typewriter.ts       char-by-char text engine with skip-on-keypress
  ui.ts               shared menu / Y/N confirm / prompt helpers
  sound.ts            sound manager (no-op stubs for now)
  backup.ts           holotape.json export/import
  minigame/           pure hacking-minigame logic + word list (no DOM)
  screens/            one module per screen; each returns a cleanup function
tests/                vitest coverage for the minigame logic
docs/                 planning docs and game reference screenshots
CLAUDE.md, HANDOFF.md working agreements and session notes for AI-assisted builds
```
