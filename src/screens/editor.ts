import { db, newId } from "../db";
import { navigate } from "../router";
import { el, rule } from "../ui";
import { sound } from "../sound";
import type { JournalEntry } from "../types";

const AUTOSAVE_MS = 800;

// handles both /new/:journalId and /edit/:id. for a new entry nothing is
// written until the first autosave fires, so backing out of an untouched
// editor leaves no empty record behind.
export async function editorScreen(
  root: HTMLElement,
  params: Record<string, string>,
): Promise<(() => void) | void> {
  let entry: JournalEntry | undefined;
  let journalId: string;

  if (params.id) {
    entry = await db.entries.get(params.id);
    if (!entry) {
      navigate("/home");
      return;
    }
    journalId = entry.journalId;
  } else {
    journalId = params.journalId ?? "";
    const journal = await db.journals.get(journalId);
    if (!journal) {
      navigate("/home");
      return;
    }
  }

  const wrap = el("div", "screen-pad editor");
  root.appendChild(wrap);

  const topBar = el("div", "editor-top");
  topBar.appendChild(el("span", "", entry ? "EDIT ENTRY" : "NEW ENTRY"));
  const saveIndicator = el("span", "save-indicator", " ");
  topBar.appendChild(saveIndicator);
  wrap.appendChild(topBar);
  rule(wrap);

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.className = "editor-title";
  titleInput.placeholder = "ENTRY TITLE";
  titleInput.spellcheck = false;
  titleInput.value = entry?.title ?? "";
  wrap.appendChild(titleInput);

  const bodyInput = document.createElement("textarea");
  bodyInput.className = "editor-body";
  bodyInput.placeholder = "> BEGIN LOG...";
  bodyInput.spellcheck = false;
  bodyInput.value = entry?.body ?? "";
  wrap.appendChild(bodyInput);

  const backBtn = el("div", "menu-item editor-back");
  backBtn.appendChild(el("span", "menu-prefix", "> "));
  backBtn.appendChild(el("span", "menu-label", "Back"));
  wrap.appendChild(backBtn);

  let timer = 0;
  let dirty = false;
  let saving = Promise.resolve();

  async function saveNow(): Promise<void> {
    if (!dirty) return;
    dirty = false;
    clearTimeout(timer);
    saveIndicator.textContent = "SAVING...";
    const now = new Date().toISOString();
    if (!entry) {
      entry = {
        id: newId(),
        journalId,
        title: titleInput.value,
        body: bodyInput.value,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      entry = { ...entry, title: titleInput.value, body: bodyInput.value, updatedAt: now };
    }
    await db.entries.put(entry);
    saveIndicator.textContent = "SAVED";
  }

  function queueSave() {
    dirty = true;
    saveIndicator.textContent = " ";
    clearTimeout(timer);
    // debounce so we aren't hitting indexeddb on every keystroke
    timer = window.setTimeout(() => {
      saving = saving.then(saveNow);
    }, AUTOSAVE_MS);
  }

  // blur-save matters on mobile: switching apps or dismissing the keyboard
  // fires blur long before any debounce timer survives a backgrounded tab
  const onInput = () => {
    sound.keypress();
    queueSave();
  };
  const flush = () => {
    saving = saving.then(saveNow);
  };
  titleInput.addEventListener("input", onInput);
  bodyInput.addEventListener("input", onInput);
  titleInput.addEventListener("blur", flush);
  bodyInput.addEventListener("blur", flush);
  window.addEventListener("visibilitychange", flush);

  async function leave() {
    await saving.then(saveNow);
    navigate(`/journal/${journalId}/entries`);
  }
  backBtn.addEventListener("click", () => void leave());

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      void leave();
    }
  }
  window.addEventListener("keydown", onKey);
  bodyInput.focus();

  return () => {
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("visibilitychange", flush);
    clearTimeout(timer);
    // last-chance flush if the route changes underneath us
    void saveNow();
  };
}
