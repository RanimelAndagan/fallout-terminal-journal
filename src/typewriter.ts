import { sound } from "./sound";
import { session } from "./state";

// one global "currently typing" slot. any keypress or click skips it, and the
// capture-phase listener swallows that event so it can't also trigger a menu.
let activeSkip: (() => void) | null = null;

window.addEventListener(
  "keydown",
  (e) => {
    if (activeSkip) {
      activeSkip();
      e.preventDefault();
      e.stopPropagation();
    }
  },
  true,
);
window.addEventListener(
  "pointerdown",
  (e) => {
    if (activeSkip) {
      activeSkip();
      e.preventDefault();
      e.stopPropagation();
    }
  },
  true,
);

// the router calls this on navigation so a screen left mid-type can't keep
// swallowing the first keypress on the next screen
export function cancelTyping(): void {
  activeSkip?.();
}

export function textIsInstant(): boolean {
  return (
    session.instantText ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export interface TypeStep {
  el: HTMLElement;
  text: string;
}

// types each step's text into its element in order. resolves when done or skipped.
export function typeSequence(steps: TypeStep[], msPerChar = 14): Promise<void> {
  if (textIsInstant() || msPerChar <= 0) {
    for (const s of steps) s.el.textContent = s.text;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let stepIdx = 0;
    let charIdx = 0;
    let last = performance.now();
    let carry = 0;
    let raf = 0;

    const finish = () => {
      activeSkip = null;
      cancelAnimationFrame(raf);
      for (const s of steps) s.el.textContent = s.text;
      resolve();
    };
    activeSkip = finish;

    const tick = (now: number) => {
      carry += now - last;
      last = now;
      let typed = false;
      while (carry >= msPerChar) {
        carry -= msPerChar;
        const step = steps[stepIdx];
        if (!step) return finish();
        if (charIdx < step.text.length) {
          charIdx++;
          step.el.textContent = step.text.slice(0, charIdx);
          typed = true;
        } else {
          stepIdx++;
          charIdx = 0;
        }
      }
      if (typed) sound.scroll();
      if (stepIdx >= steps.length) return finish();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  });
}

// convenience for the common "type these lines into fresh divs" case
export function typeLines(
  container: HTMLElement,
  lines: string[],
  msPerChar = 14,
): Promise<void> {
  const steps: TypeStep[] = lines.map((text) => {
    const div = document.createElement("div");
    div.className = "tw-line";
    container.appendChild(div);
    return { el: div, text };
  });
  return typeSequence(steps, msPerChar);
}
