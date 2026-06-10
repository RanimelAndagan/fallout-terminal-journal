import { db } from "../db";
import { navigate } from "../router";
import { el, createMenu, confirmYN, rule, blankLine, type Menu } from "../ui";
import { typeSequence } from "../typewriter";

export async function readerScreen(
  root: HTMLElement,
  params: Record<string, string>,
): Promise<(() => void) | void> {
  const entry = await db.entries.get(params.id ?? "");
  if (!entry) {
    navigate("/home");
    return;
  }

  const wrap = el("div", "screen-pad");
  root.appendChild(wrap);

  wrap.appendChild(el("div", "journal-title", (entry.title || "(UNTITLED)").toUpperCase()));
  wrap.appendChild(
    el("div", "dim", `LOGGED ${entry.createdAt.slice(0, 10)} / REVISED ${entry.updatedAt.slice(0, 10)}`),
  );
  rule(wrap);

  const bodyEl = el("div", "entry-body");
  wrap.appendChild(bodyEl);
  // long entries at full typewriter speed would take minutes, so scale up
  const speed = entry.body.length > 600 ? 2 : 8;
  await typeSequence([{ el: bodyEl, text: entry.body || "(EMPTY ENTRY)" }], speed);

  blankLine(wrap);
  let menu: Menu | null = null;

  async function remove() {
    menu?.dispose();
    menu = null;
    const yes = await confirmYN(wrap, "DELETE THIS ENTRY? ARE YOU SURE?");
    if (yes) {
      await db.entries.delete(entry!.id);
      navigate(`/journal/${entry!.journalId}/entries`);
    } else {
      navigate(`/entry/${entry!.id}`);
    }
  }

  menu = createMenu(wrap, [
    { label: "Edit Entry", onSelect: () => navigate(`/edit/${entry.id}`) },
    { label: "Delete Entry", onSelect: () => void remove() },
    { label: "Back", onSelect: () => navigate(`/journal/${entry.journalId}/entries`) },
  ]);

  return () => menu?.dispose();
}
