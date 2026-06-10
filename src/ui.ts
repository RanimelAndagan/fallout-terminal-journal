import { sound } from "./sound";

export function el(
  tag: string,
  className?: string,
  text?: string,
): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export interface MenuItem {
  label: string;
  onSelect: () => void;
}

export interface Menu {
  dispose: () => void;
}

// the "> ITEM" menu used everywhere. arrow keys + enter, mouse hover + click,
// selected item gets the inverted-block highlight via css
export function createMenu(container: HTMLElement, items: MenuItem[]): Menu {
  let selected = 0;
  const rows: HTMLElement[] = [];

  const menuEl = el("div", "menu");
  items.forEach((item, i) => {
    const row = el("div", "menu-item");
    row.appendChild(el("span", "menu-prefix", "> "));
    row.appendChild(el("span", "menu-label", item.label));
    row.addEventListener("mouseenter", () => select(i));
    row.addEventListener("click", () => {
      select(i);
      activate();
    });
    menuEl.appendChild(row);
    rows.push(row);
  });
  container.appendChild(menuEl);

  function select(i: number) {
    if (i === selected) {
      rows[i]?.classList.add("selected");
      return;
    }
    rows[selected]?.classList.remove("selected");
    selected = i;
    rows[selected]?.classList.add("selected");
    sound.keypress();
  }

  function activate() {
    sound.keypress();
    items[selected]?.onSelect();
  }

  function onKey(e: KeyboardEvent) {
    // ignore keys while the user is typing in an input on the same screen
    const t = e.target as HTMLElement;
    if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
    if (e.key === "ArrowUp") {
      select((selected - 1 + items.length) % items.length);
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      select((selected + 1) % items.length);
      e.preventDefault();
    } else if (e.key === "Enter") {
      activate();
      e.preventDefault();
    }
  }

  window.addEventListener("keydown", onKey);
  select(0);

  return {
    dispose: () => window.removeEventListener("keydown", onKey),
  };
}

// terminal-style Y/N gate. resolves true on Y, false on N or escape.
// also renders clickable options so it works on touch screens.
export function confirmYN(
  container: HTMLElement,
  message: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    const box = el("div", "confirm");
    box.appendChild(el("div", "confirm-msg", message + " Y/N"));
    container.appendChild(box);

    let menu: Menu | null = null;
    const done = (answer: boolean) => {
      window.removeEventListener("keydown", onKey);
      menu?.dispose();
      box.remove();
      resolve(answer);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "y" || e.key === "Y") done(true);
      else if (e.key === "n" || e.key === "N" || e.key === "Escape") done(false);
    };
    window.addEventListener("keydown", onKey);
    menu = createMenu(box, [
      { label: "[N] NO", onSelect: () => done(false) },
      { label: "[Y] YES", onSelect: () => done(true) },
    ]);
  });
}

// "> _" style prompt that resolves with the entered text on enter
export function promptInput(
  container: HTMLElement,
  label: string,
  initial = "",
): { value: Promise<string>; input: HTMLInputElement } {
  const row = el("div", "prompt-row");
  row.appendChild(el("span", "prompt-label", label));
  const line = el("div", "prompt-line");
  line.appendChild(el("span", "menu-prefix", "> "));
  const input = document.createElement("input");
  input.type = "text";
  input.className = "prompt-input";
  input.value = initial;
  input.autocapitalize = "off";
  input.autocomplete = "off";
  input.spellcheck = false;
  line.appendChild(input);
  row.appendChild(line);
  container.appendChild(row);
  input.focus();

  const value = new Promise<string>((resolve) => {
    input.addEventListener("keydown", (e) => {
      sound.keypress();
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        resolve(input.value.trim());
      }
    });
  });
  return { value, input };
}

export function rule(container: HTMLElement): void {
  container.appendChild(el("div", "hrule"));
}

export function blankLine(container: HTMLElement): void {
  container.appendChild(el("div", "tw-line", " "));
}
