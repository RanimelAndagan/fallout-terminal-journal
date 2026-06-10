# Terminal Journal — Project Plan

A Fallout-style terminal web app people can use as a real, private journal. Local-first, no backend, no accounts. Your terminal, your data.

## Core Decisions (locked)

- **Platform:** Web app, deployed on GitHub Pages
- **Data:** Local-first. Entries never leave the user's device
- **Storage:** IndexedDB via Dexie.js (not localStorage; it caps at ~5MB and only stores strings)
- **Backups:** Export/import all entries as a JSON file, themed in-universe as "holotape backups"
- **Installable:** PWA (manifest + service worker) so it works offline and installs to phone home screens
- **No backend, no accounts, no sync.** Revisit only if the app gets real traction (v3 territory)
- **Stack:** Vite + TypeScript, no frameworks. Same approach as the physics engine

## Why local-first is the pitch, not the compromise

Journals are private. "Your entries are stored on your device, nobody can read them, not even us" is a selling point. It also fits the fiction: no Vault-Tec servers snooping.

## Core Loop

Boot sequence → terminal home → list entries → read / write / search

Get this loop working end to end before touching anything fancy.

## Milestones

### Milestone 1 — The Terminal (the "whoa" part)
- CRT aesthetic: green phosphor glow, scanlines, subtle screen curvature, flicker
- Boot sequence animation (ROBCO-style POST text crawl)
- Typewriter text rendering with optional typing/key sounds (Web Audio API, you've done this before)
- Terminal home screen with menu navigation

### Milestone 2 — The Journal (the "actually useful" part)
- Dexie.js setup: entries table with id, title, body, createdAt, updatedAt
- Create, read, edit, delete entries
- **Autosave while typing.** Non-negotiable. Losing a half-written entry is unforgivable
- Delete confirmation (terminal-style "ARE YOU SURE Y/N" prompt)
- Entry list sorted by date, with titles and dates visible
- Basic text search across entries

### Milestone 3 — Trust & Reliability
- Export all entries to JSON ("EJECT HOLOTAPE")
- Import/restore from JSON ("INSERT HOLOTAPE"), with merge or replace choice
- Gentle reminder prompt to back up after N entries or N days
- Handle edge cases: empty states, very long entries, import of malformed files

### Milestone 4 — PWA & Polish
- Web app manifest (name, icons, theme color, standalone display)
- Service worker for offline use (cache-first for the app shell)
- "Add to home screen" friendly
- Mobile layout pass: the terminal has to feel right on a phone at 11pm in bed
- Accessibility pass: reduced-motion option for the CRT effects, readable contrast mode

## Explicitly Out of Scope (v2)

- Accounts, login, cloud sync
- Multi-device sync
- Hacking minigame or any Fallout extras before the journal works
- Rich text / images in entries (plain text first; maybe markdown later)

## Build Notes

- Write a CLAUDE.md in the repo root before starting: stack, file structure, naming conventions, style preferences. Every Claude Code session inherits it
- One-page PRD still to come (scope, target user, success criteria)
- First public moment: deploy Milestone 1 alone. The boot sequence is already shareable on LinkedIn while the rest is in progress

## Definition of Done (v2)

Someone who is not you installs it on their phone, writes entries for two weeks offline, exports a backup, wipes their browser, imports it back, and loses nothing.
