# Master Prompt — Terminal Journal

You are helping me, a self-taught developer, build "Terminal Journal": a local-first journaling web app styled as a pitch-perfect recreation of the Fallout 3 / New Vegas RobCo terminal aesthetic. I have plan.md and CLAUDE.md in this repo; read both before writing code. Explain key decisions in plain English as you go, since I am still learning.

<context>
This is a client-side single-page app. Stack: Vite + TypeScript, plain HTML/CSS, no UI frameworks. Storage: IndexedDB via Dexie.js. Deployment target: GitHub Pages. No backend, no accounts, no network calls. Entries never leave the device.

I have seven reference screenshots of the original game terminal. The app must match that look closely. The defining visual traits, in technical terms:

- Monospace bitmap-style font, ALL CAPS for system text, with wide letter-spacing (roughly 0.15em). Use a free webfont that matches the look (VT323, Share Tech Mono, or Fixedsys Excelsior; pick the closest and tell me why).
- Phosphor green text (#1aff80 to #2bff7f range, tune to match a CRT green) on a very dark green-black background (#0b1a10 range), with a subtle text-shadow glow on every character.
- Horizontal scanlines across the entire screen (repeating-linear-gradient overlay, 2-4px period, low opacity).
- A soft static light bloom in the upper-right area of the screen glass (radial gradient overlay), like a reflection on curved glass.
- Slight screen flicker (very subtle opacity/brightness animation) and an optional faint vignette at the screen edges.
- The terminal screen sits inside a simple dark bezel frame. CSS only; do not embed any game assets, textures, or copyrighted images. The look is achieved entirely with code.
- A ">" prompt with a blinking solid block cursor (■).
- Menu items rendered as "> ITEM NAME" lines; the selected item is highlighted with an inverted block (green background, dark text). Navigable by arrow keys + Enter and by mouse click.
- All system text appears with a character-by-character typewriter effect at a fast, game-like speed, with an instant-skip on keypress.
- Headers centered like: "RANICO INDUSTRIES UNIFIED OPERATING SYSTEM" / "COPYRIGHT 2075-2077 RANICO INDUSTRIES". The brand is RaniCo everywhere system text needs a manufacturer. Do not use the literal name RobCo anywhere.
</context>

<task>
Build the full prototype with these screens and flows, matching the reference layouts:

1. BOOT SEQUENCE. A POST-style text crawl: welcome line, fake SET commands, fake BIOS init lines with version numbers and memory readouts, ending at a lone ">" prompt. Any key skips to the end. Then transition to the holotape check.

2. HOLOTAPE CHECK (first run / empty state). If no holotape exists in IndexedDB, show an error screen styled like a tape-drive failure: a fake hex error code, the lines "No Data Storage Detected." and "Check Tape Drive Connection." with an underline rule, then a menu with [INITIALIZE NEW HOLOTAPE] and [INSERT HOLOTAPE] (import an existing holotape.json backup). Initializing starts holotape setup.

3. HOLOTAPE SETUP (one time). The user names their holotape and their user name (used in the "Welcome, NAME" greeting), then chooses exactly 10 password words. Constraints: each word 5-8 letters, letters only, all distinct, stored uppercase. The 10 words belong to the HOLOTAPE, not to individual journals: one unlock opens the whole terminal, like the game. A holotape can contain MULTIPLE journals. Setup creates the first journal by default ("PERSONAL LOG") and more can be created from the home menu. Store everything in IndexedDB.

4. PASSWORD MINIGAME (every unlock). Recreate the hacking screen:
   - Header: "RANICO INDUSTRIES (TM) TERMLINK PROTOCOL" / "ENTER PASSWORD NOW".
   - "4 ATTEMPT(S) LEFT: ■ ■ ■ ■" with blocks removed per wrong guess.
   - Two columns of rows, each row prefixed with an incrementing fake hex address (0xF650 style). Rows are filled with random junk symbols, and embedded within the junk are candidate words.
   - One candidate is the correct word: pick it at random from the user's 10 words each session. Generate 10-14 dud words of the same length (use a bundled wordlist; duds must not be any of the user's other 9 words).
   - Clicking/selecting a wrong word prints "ENTRY DENIED" and a likeness count (number of letters matching the correct word in the same position), exactly like the game, in a log column on the right side of the prompt.
   - Selecting the right word prints "EXACT MATCH!" then "PLEASE WAIT WHILE SYSTEM IS ACCESSED." and transitions to the journal home.
   - Include the bracket-pair Easter egg: selecting a matched bracket pair like (...) or [...] in the junk either removes a dud or resets attempts, with a small chance for each, like the game.
   - On 0 attempts: full-screen "TERMINAL LOCKED" / "PLEASE CONTACT AN ADMINISTRATOR" centered on an otherwise empty screen, exactly like the reference. Hold this screen for a 10-15 second lockout (show a subtle countdown or blinking cursor so the user knows it is temporary), then automatically return to a FRESH minigame with a DIFFERENT randomly chosen word from the user's 10 and a new board. Never permanently lock the user out and never wipe or touch data on failure.

5. TERMINAL HOME (after unlock). Styled exactly like the in-game desktop screenshot: centered RaniCo OS header with copyright lines and a "-Server 1-" style line, a model line ("RaniCo Doc-u-Writer Model 986" style, original wording), then "Welcome, [USERNAME]. What would you like to do today?" above a horizontal rule. The menu lists the holotape's JOURNALS first, like the game lists "Store Inventory / Track Current Experiments / Survival Guide Progress":
   > [Journal name] (one line per journal on the holotape)
   > Create New Journal
   > Eject Holotape (Backup)
   > Insert Holotape (Restore)
   > Lock Terminal
   Selecting a journal opens that journal's menu: New Entry, View Entries, Search Entries, Rename Journal, Delete Journal (Y/N confirm), Back.

6. ENTRIES. EntryList (dated, titled, newest first, arrow-key navigable), EntryReader (typewriter renders the entry), EntryEditor (title + body). Editor must AUTOSAVE on a debounce (about 800ms after typing stops) and on blur, with a subtle "SAVED" indicator in the corner. Deleting an entry requires a terminal-style "ARE YOU SURE? Y/N" confirmation.

7. BACKUP / RESTORE. Eject Holotape exports the ENTIRE holotape (settings, the 10 words, all journals, all entries) as a single JSON file downloaded as "holotape.json". Insert Holotape imports a holotape.json with a clear choice between MERGE and REPLACE, validating the file shape and failing gracefully with a themed error on malformed input ("Tape Read Error" style).
</task>

<requirements>
- TypeScript strict mode. Define explicit interfaces for Holotape, Journal, JournalEntry, and the export file format. The export format gets a version field from day one. Freeform entry titles (no forced numbering).
- Dexie schema: holotape (settings, user name, 10 password words), journals (id, name, createdAt), entries (id, journalId, title, body, createdAt, updatedAt). All timestamps ISO strings.
- One source of truth for app state; simple view-switching with a hash router (#/boot, #/unlock, #/home, #/journal/:id, #/journal/:id/entries, #/entry/:id, #/edit/:id) so back/forward works.
- The minigame logic (word selection, dud generation, likeness calculation, attempt tracking, lockout timing) lives in its own pure, unit-testable module with no DOM access.
- Likeness = count of positions where letters match. Write 5-8 plain assertion tests for likeness and dud generation in a small test file runnable with vitest.
- Sound: create a SoundManager module with named methods (keypress, boot, denied, granted, lock) that are NO-OPS for now. I will wire real sounds later. Every place a sound belongs should already call the manager.
- Reduced motion: respect prefers-reduced-motion by disabling flicker and shortening typewriter effects. Also add a settings toggle for instant text.
- Mobile: the terminal must be usable on a phone. Scale the screen to viewport, ensure the editor uses a proper textarea so the native keyboard works, and make menu items tappable.
- Be honest in any user-facing copy: the password minigame is a privacy lock, not encryption. Do not claim entries are encrypted.
- Code comments must read like a human developer wrote them: lowercase casual sentences, explain WHY not what, no boilerplate headers, no "// This function does X" filler, no emoji, no em dashes. Sparse but genuinely useful. Same rule for the README.
- No frameworks, no CSS libraries, no game assets. Dexie and vitest are the only dependencies beyond Vite.
- Commit in logical chunks per milestone with plain, human commit messages.
</requirements>

<explain>
When done, explain in plain language:
1. How the autosave debounce works and why blur-save matters on mobile.
2. How the dud word generation guarantees exactly one valid answer.
3. What would change architecturally if I later derive a real encryption key from the 10 words, and what the user would risk.
</explain>
