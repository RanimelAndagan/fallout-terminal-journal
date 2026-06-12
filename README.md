<div align="center">

```
 ██████████████████████████████████████████████████████████████████
 █                                                                █
 █   RanCO INDUSTRIES (TM) TERMLINK PROTOCOL                      █
 █   >>> TERMINAL JOURNAL v0.1.0                                  █
 █                                                                █
 █   COPYRIGHT 2075-2077 ROBCO INDUSTRIES                         █
 █   -SERVER 6-                                                   █
 █                                                                █
 ██████████████████████████████████████████████████████████████████
```

### ☢️ A personal journal like those Fallout terminals ☢️

[![Skills](https://skillicons.dev/icons?i=ts,vite,vitest,html,css,git)](https://skillicons.dev)

</div>

---

## 📟 INTRODUCTION

**Terminal Journal** is a journaling web app that runs entirely in your browser and pretends, very hard, to be a RobCo terminal straight out of the Capital Wasteland.

Every session starts with a CRT boot sequence. Your journals live on a **holotape**. And the only way past the lock screen is the real deal: the word-guessing **hacking minigame** from Fallout 3 / New Vegas / 4, faithfully recreated — likeness scores, junk characters, bracket-pair dud removal easter egg and all.

Everything is stored locally in your browser (IndexedDB via Dexie). No accounts, no servers, no cloud. Vault-Tec can't read your diary.

## ⚙️ FEATURES

- 🖥️ **CRT boot sequence** — every reload replays the terminal powering on, with typewriter text
- 🔐 **Authentic hacking minigame** — 16×2 board of junk and candidate words, 4 attempts, likeness feedback, and the classic `(...)` `[...]` `{...}` `<...>` bracket trick to remove duds or reset attempts
- 📼 **Holotape storage** — your data is framed as a holotape; **eject** it to download a JSON backup, **insert** one to restore or merge on another machine
- 📓 **Journals & entries** — create multiple journals, write entries in a terminal editor, browse and read them back
- 🔊 **Real terminal audio** — Web Audio hooks for the original Fallout 3 keyboard clicks, char-scroll loop, fan hum, and access granted/denied stingers (bring your own sounds — see below)
- 🔒 **Privacy by theme** — deep links never bypass the lock; a reload always drops you back at the boot screen
- 📦 **Zero backend** — one dependency (Dexie). Everything else is vanilla TypeScript and CSS

## 🚀 HOW TO RUN — *INITIATING TERMLINK...*

You need [Node.js](https://nodejs.org/) (v18 or newer recommended) and npm.

**1. Clone the wasteland:**

```bash
git clone https://github.com/RanimelAndagan/fallout-terminal-journal.git
cd fallout-terminal-journal
```

**2. Scavenge the dependencies:**

```bash
npm install
```

**3. Power on the terminal:**

```bash
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`) — open it in your browser and watch the boot sequence roll.

**4. First boot setup:**

On first run there's no holotape, so the terminal walks you through creating one: a tape label, a user name, and **ten password words**. Every time you unlock, the terminal picks *one* of your ten at random and hides it on the hacking board among look-alike duds — **you get into your journal by hacking it**, so pick words you'll recognize on a wall of junk characters.

### Other commands

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload          |
| `npm run build`   | Type-check and build for production (`dist/`) |
| `npm run preview` | Serve the production build locally            |
| `npm test`        | Run the Vitest suite (minigame logic & more)  |

## 🕹️ HOW TO HACK (UNLOCK SCREEN)

> *4 ATTEMPTS LEFT: █ █ █ █*

1. The board shows columns of junk characters with words embedded in them. One of those words is one of *your* ten password words.
2. Pick a word. Wrong guesses report a **likeness** score — how many letters match the password *in the same position*.
3. Use likeness like Mastermind: narrow down candidates before your 4 attempts run out.
4. **Easter egg:** click a matching bracket pair like `(....)`, `[....]`, `{....}` or `<....>` in the junk — it removes a dud word or resets your attempts, exactly like in the games.
5. Run out of attempts and the terminal locks for 12 seconds, then deals you a fresh board with a different word. Your data is never touched — the lockout is theater plus a rate limit. It's your journal; the wasteland is cruel but not *that* cruel.

## 🔊 SOUND FILES (OPTIONAL)

The audio cues map to sound effects from **Fallout 3**, but those files are ripped from your own game install and are **never committed** (`public/sounds/` is gitignored). The app is fully functional without them — missing files just mean those cues stay silent.

To enable audio, extract these from your own copy of the game and drop them into `public/sounds/`:

```
obj_computerterminal_forward.wav     boot-up
obj_computerterminal_powerdown.wav   lock / power down
ui_hacking_charscroll_lp.wav         typewriter scroll loop
ui_hacking_charsingle_01..08.wav     keyboard clicks (8 variants)
ui_hacking_fanhum_lp.wav             terminal fan hum
ui_hacking_passbad.wav               access denied
ui_hacking_passgood.wav              access granted
ui_pipboy_holotape_start.wav         holotape insert
ui_pipboy_holotape_stop.wav          holotape eject
```

## 🗂️ PROJECT STRUCTURE

```
src/
├── main.ts          entry point, registers routes
├── router.ts        hash router with lock-screen guards
├── db.ts            Dexie (IndexedDB) database
├── backup.ts        holotape eject/insert (JSON export/import)
├── sound.ts         Web Audio manager, all files optional
├── typewriter.ts    character-by-character text printing
├── minigame/
│   ├── logic.ts     pure hacking-game logic (board gen, likeness, duds)
│   └── wordlist.ts  candidate word pool
└── screens/         boot, setup, unlock, home, journal, editor, reader...
tests/               Vitest suite
public/fonts/        VT323 — the terminal font
public/sounds/       your sound files go here (gitignored)
```

## 🧰 TECH

Built with **TypeScript**, **Vite**, **Vitest**, and **Dexie** — no framework, no backend. The terminal look is hand-rolled CSS (scanlines, glow, VT323) and the minigame logic is pure functions with zero DOM, which is what keeps it testable.

---

<div align="center">

```
> LOGOUT
*** TERMLINK SESSION TERMINATED ***
```

*This is a fan project. Fallout, RobCo, Vault-Tec, and related assets belong to Bethesda Softworks. No game files are distributed with this repository.*

**War. War never changes. But your journal entries can — they're editable.**

</div>
