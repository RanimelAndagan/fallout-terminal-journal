import { db } from "../db";
import { navigate } from "../router";
import { el, createMenu, promptInput, confirmYN, rule, blankLine, type Menu } from "../ui";
import { osHeader } from "./header";

export async function journalScreen(
  root: HTMLElement,
  params: Record<string, string>,
): Promise<(() => void) | void> {
  const journal = await db.journals.get(params.id ?? "");
  if (!journal) {
    navigate("/home");
    return;
  }

  const wrap = el("div", "screen-pad");
  root.appendChild(wrap);
  osHeader(wrap);
  blankLine(wrap);
  wrap.appendChild(el("div", "journal-title", journal.name.toUpperCase()));
  rule(wrap);

  let menu: Menu | null = null;

  async function rename() {
    menu?.dispose();
    menu = null;
    blankLine(wrap);
    const { value } = promptInput(wrap, "NEW NAME:", journal!.name);
    const name = await value;
    if (name.length >= 1 && name.length <= 40) {
      await db.journals.update(journal!.id, { name });
    }
    navigate(`/journal/${journal!.id}`);
  }

  async function remove() {
    menu?.dispose();
    menu = null;
    blankLine(wrap);
    const count = await db.entries.where("journalId").equals(journal!.id).count();
    const yes = await confirmYN(
      wrap,
      `DELETE "${journal!.name.toUpperCase()}" AND ITS ${count} ENTRIES? ARE YOU SURE?`,
    );
    if (yes) {
      await db.transaction("rw", db.journals, db.entries, async () => {
        await db.entries.where("journalId").equals(journal!.id).delete();
        await db.journals.delete(journal!.id);
      });
      navigate("/home");
    } else {
      navigate(`/journal/${journal!.id}`);
    }
  }

  menu = createMenu(wrap, [
    { label: "New Entry", onSelect: () => navigate(`/new/${journal.id}`) },
    { label: "View Entries", onSelect: () => navigate(`/journal/${journal.id}/entries`) },
    { label: "Search Entries", onSelect: () => navigate(`/journal/${journal.id}/search`) },
    { label: "Rename Journal", onSelect: () => void rename() },
    { label: "Delete Journal", onSelect: () => void remove() },
    { label: "Back", onSelect: () => navigate("/home") },
  ]);

  return () => menu?.dispose();
}
