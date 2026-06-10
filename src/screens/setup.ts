import { db, HOLOTAPE_ID, newId } from "../db";
import { navigate } from "../router";
import { el, promptInput, blankLine, rule } from "../ui";
import { typeLines } from "../typewriter";
import { osHeader } from "./header";
import { session } from "../state";

const WORD_RE = /^[A-Za-z]{5,8}$/;

// one-time holotape initialization: label, user name, then the ten password
// words the minigame draws from. the words unlock the whole holotape, not
// individual journals, same as the game.
export async function setupScreen(root: HTMLElement): Promise<void> {
  const wrap = el("div", "screen-pad");
  root.appendChild(wrap);
  osHeader(wrap);
  blankLine(wrap);

  await typeLines(wrap, ["HOLOTAPE INITIALIZATION UTILITY v1.2"]);
  rule(wrap);

  const ask = async (label: string, validate: (v: string) => string | null): Promise<string> => {
    const errLine = el("div", "status-line", " ");
    for (;;) {
      const { value, input } = promptInput(wrap, label);
      const v = await value;
      const err = validate(v);
      input.disabled = true;
      if (err === null) {
        errLine.remove();
        return v;
      }
      input.parentElement?.parentElement?.remove();
      errLine.textContent = err;
      wrap.appendChild(errLine);
    }
  };

  const tapeName = await ask("HOLOTAPE LABEL:", (v) =>
    v.length >= 1 && v.length <= 40 ? null : "INVALID ENTRY: 1-40 CHARACTERS.",
  );
  const userName = await ask("OPERATOR NAME:", (v) =>
    v.length >= 1 && v.length <= 24 ? null : "INVALID ENTRY: 1-24 CHARACTERS.",
  );

  blankLine(wrap);
  await typeLines(wrap, [
    "SET 10 PASSWORD WORDS.",
    "EACH WORD: 5-8 LETTERS, LETTERS ONLY, ALL DISTINCT.",
    "ONE WORD IS CHOSEN AT RANDOM EACH TIME THE TERMINAL LOCKS.",
    "NOTE: THIS IS A PRIVACY LOCK, NOT ENCRYPTION.",
  ]);
  blankLine(wrap);

  const words: string[] = [];
  while (words.length < 10) {
    const n = words.length + 1;
    const word = await ask(`WORD ${n}/10:`, (v) => {
      if (!WORD_RE.test(v)) return "INVALID ENTRY: 5-8 LETTERS, A-Z ONLY.";
      if (words.includes(v.toUpperCase())) return "INVALID ENTRY: WORDS MUST BE DISTINCT.";
      return null;
    });
    words.push(word.toUpperCase());
  }

  blankLine(wrap);
  await typeLines(wrap, ["WRITING HOLOTAPE...", "CREATING JOURNAL: PERSONAL LOG"]);

  const now = new Date().toISOString();
  await db.transaction("rw", db.holotape, db.journals, async () => {
    await db.holotape.put({
      id: HOLOTAPE_ID,
      name: tapeName,
      userName,
      passwordWords: words,
      settings: { instantText: session.instantText },
      createdAt: now,
    });
    await db.journals.put({ id: newId(), name: "PERSONAL LOG", createdAt: now });
  });

  await typeLines(wrap, ["DONE. REBOOTING TO TERMLINK..."]);
  setTimeout(() => navigate("/unlock"), 800);
}
