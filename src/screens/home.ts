import { db, getHolotape, newId } from "../db";
import { navigate } from "../router";
import { session } from "../state";
import { el, createMenu, promptInput, rule, blankLine, type MenuItem, type Menu } from "../ui";
import { typeSequence } from "../typewriter";
import { osHeader } from "./header";
import {
  ejectHolotape,
  pickHolotapeFile,
  parseHolotapeFile,
  importHolotape,
  TapeReadError,
  type ImportMode,
} from "../backup";

export async function homeScreen(root: HTMLElement): Promise<(() => void) | void> {
  const tape = await getHolotape();
  if (!tape) {
    navigate("/check");
    return;
  }
  const journals = await db.journals.orderBy("createdAt").toArray();

  const wrap = el("div", "screen-pad");
  root.appendChild(wrap);
  osHeader(wrap, true);
  blankLine(wrap);

  const welcome = el("div", "tw-line");
  wrap.appendChild(welcome);
  await typeSequence(
    [{ el: welcome, text: `Welcome, ${tape.userName.toUpperCase()}. What would you like to do today?` }],
    8,
  );
  rule(wrap);

  const status = el("div", "status-line", " ");
  let menu: Menu | null = null;
  let disposed = false;

  async function createJournal() {
    menu?.dispose();
    blankLine(wrap);
    const { value } = await Promise.resolve(promptInput(wrap, "NEW JOURNAL NAME:"));
    const name = await value;
    if (name.length >= 1 && name.length <= 40) {
      await db.journals.put({ id: newId(), name, createdAt: new Date().toISOString() });
      navigate("/home");
    } else {
      navigate("/home"); // re-render rather than juggling inline error state
    }
  }

  async function insert(mode: ImportMode) {
    const file = await pickHolotapeFile();
    if (!file) return;
    try {
      const data = await parseHolotapeFile(file);
      await importHolotape(data, mode);
      status.textContent = mode === "replace" ? "HOLOTAPE RESTORED." : "HOLOTAPE MERGED.";
      navigate("/home");
    } catch (err) {
      status.textContent =
        err instanceof TapeReadError
          ? `TAPE READ ERROR: ${err.message}`
          : "TAPE READ ERROR: Unknown failure.";
    }
  }

  function insertFlow() {
    // swap the menu for a merge/replace choice before touching anything
    menu?.dispose();
    menu = null;
    blankLine(wrap);
    const sub = el("div", "");
    wrap.appendChild(sub);
    sub.appendChild(el("div", "tw-line", "INSERT HOLOTAPE: CHOOSE WRITE MODE"));
    sub.appendChild(el("div", "tw-line dim", "MERGE keeps current data and adds the tape's. REPLACE overwrites everything."));
    const subMenu = createMenu(sub, [
      { label: "MERGE TAPE INTO TERMINAL", onSelect: () => void insert("merge") },
      { label: "REPLACE TERMINAL WITH TAPE", onSelect: () => void insert("replace") },
      { label: "CANCEL", onSelect: () => navigate("/home") },
    ]);
    menu = subMenu;
  }

  const items: MenuItem[] = [
    ...journals.map((j) => ({
      label: j.name,
      onSelect: () => navigate(`/journal/${j.id}`),
    })),
    { label: "Create New Journal", onSelect: () => void createJournal() },
    { label: "Eject Holotape (Backup)", onSelect: () => void ejectHolotape().then(() => (status.textContent = "HOLOTAPE EJECTED: holotape.json")) },
    { label: "Insert Holotape (Restore)", onSelect: insertFlow },
    {
      label: `Instant Text: ${tape.settings.instantText ? "ON" : "OFF"}`,
      onSelect: () => {
        void (async () => {
          const next = !tape.settings.instantText;
          session.instantText = next;
          await db.holotape.update(tape.id, { settings: { instantText: next } });
          navigate("/home");
        })();
      },
    },
    {
      label: "Lock Terminal",
      onSelect: () => {
        session.unlocked = false;
        navigate("/unlock");
      },
    },
  ];

  if (!disposed) menu = createMenu(wrap, items);
  wrap.appendChild(status);

  return () => {
    disposed = true;
    menu?.dispose();
  };
}
