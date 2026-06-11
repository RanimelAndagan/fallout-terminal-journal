import { db } from "../db";
import { navigate } from "../router";
import { el, rule, blankLine } from "../ui";
import { osHeader } from "./header";
import { sound } from "../sound";
import type { JournalEntry } from "../types";

function fmtDate(iso: string): string {
  return iso.slice(0, 10);
}

// list + search share a screen. search just adds the live filter input.
export async function entriesScreen(
  root: HTMLElement,
  params: Record<string, string>,
  searchMode: boolean,
): Promise<(() => void) | void> {
  const journal = await db.journals.get(params.id ?? "");
  if (!journal) {
    navigate("/home");
    return;
  }
  const all = (
    await db.entries.where("journalId").equals(journal.id).toArray()
  ).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const wrap = el("div", "screen-pad");
  root.appendChild(wrap);
  osHeader(wrap);
  blankLine(wrap);
  wrap.appendChild(
    el("div", "journal-title", `${journal.name.toUpperCase()} :: ${searchMode ? "SEARCH" : "ENTRIES"}`),
  );
  rule(wrap);

  let filtered: JournalEntry[] = all;
  let selected = 0;
  const listEl = el("div", "entry-list");
  let searchInput: HTMLInputElement | null = null;

  if (searchMode) {
    const row = el("div", "prompt-line");
    row.appendChild(el("span", "menu-prefix", "SEARCH> "));
    searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "prompt-input";
    searchInput.spellcheck = false;
    row.appendChild(searchInput);
    wrap.appendChild(row);
    blankLine(wrap);
    searchInput.addEventListener("input", () => {
      const q = searchInput!.value.toLowerCase();
      filtered = all.filter(
        (e) => e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q),
      );
      selected = 0;
      renderList();
    });
  }

  wrap.appendChild(listEl);

  let rows: HTMLElement[] = [];

  // moving the highlight must not rebuild the dom: replacing the row under
  // the cursor between mousedown and mouseup eats the click entirely
  function setSelected(i: number) {
    if (i === selected) return;
    rows[selected]?.classList.remove("selected");
    selected = i;
    rows[selected]?.classList.add("selected");
  }

  function renderList() {
    listEl.innerHTML = "";
    rows = [];
    if (filtered.length === 0) {
      listEl.appendChild(
        el("div", "dim", all.length === 0 ? "NO ENTRIES ON RECORD." : "NO MATCHING ENTRIES."),
      );
    }
    filtered.forEach((entry, i) => {
      const row = el("div", "menu-item");
      row.appendChild(el("span", "menu-prefix", "> "));
      row.appendChild(
        el("span", "menu-label", `${fmtDate(entry.createdAt)}  ${entry.title || "(UNTITLED)"}`),
      );
      row.addEventListener("mouseenter", () => setSelected(i));
      row.addEventListener("click", () => navigate(`/entry/${entry.id}`));
      listEl.appendChild(row);
      rows.push(row);
    });
    const back = el("div", "menu-item");
    back.appendChild(el("span", "menu-prefix", "> "));
    back.appendChild(el("span", "menu-label", "Back"));
    back.addEventListener("mouseenter", () => setSelected(filtered.length));
    back.addEventListener("click", () => navigate(`/journal/${journal!.id}`));
    listEl.appendChild(back);
    rows.push(back);
    rows[selected]?.classList.add("selected");
  }
  renderList();

  function onKey(e: KeyboardEvent) {
    const total = filtered.length + 1; // entries plus the back row
    if (e.key === "ArrowUp") {
      setSelected((selected - 1 + total) % total);
      sound.keypress();
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      setSelected((selected + 1) % total);
      sound.keypress();
      e.preventDefault();
    } else if (e.key === "Enter") {
      // selection starts on the top result, so enter from the search box
      // still jumps there unless the user arrowed somewhere else
      if (selected < filtered.length) {
        navigate(`/entry/${filtered[selected]!.id}`);
      } else {
        navigate(`/journal/${journal!.id}`);
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      navigate(`/journal/${journal!.id}`);
    }
  }
  window.addEventListener("keydown", onKey);
  searchInput?.focus();

  return () => window.removeEventListener("keydown", onKey);
}
