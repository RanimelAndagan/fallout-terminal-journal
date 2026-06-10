import { navigate } from "../router";
import { el } from "../ui";

// the full-screen lockout. holds 12 seconds, then sends the user back to a
// fresh minigame with a different word. data is never touched here, the
// lockout is theater plus a rate limit, nothing more.
const LOCKOUT_SECONDS = 12;

export function lockedScreen(root: HTMLElement): () => void {
  const wrap = el("div", "locked-screen");
  root.appendChild(wrap);

  wrap.appendChild(el("div", "locked-title", "TERMINAL LOCKED"));
  wrap.appendChild(el("div", "locked-line", " "));
  wrap.appendChild(el("div", "locked-sub", "PLEASE CONTACT AN ADMINISTRATOR"));
  const count = el("div", "locked-count", " ");
  wrap.appendChild(count);

  let remaining = LOCKOUT_SECONDS;
  count.textContent = `■ ${remaining}`;
  const interval = window.setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(interval);
      navigate("/unlock");
      return;
    }
    count.textContent = `■ ${remaining}`;
  }, 1000);

  return () => clearInterval(interval);
}
