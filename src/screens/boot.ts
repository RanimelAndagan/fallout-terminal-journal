import { typeLines } from "../typewriter";
import { session } from "../state";
import { navigate } from "../router";
import { sound } from "../sound";
import { el } from "../ui";

// post-style crawl modeled on the in-game terminal boot. version numbers and
// memory readouts are flavor, nothing reads them.
const BOOT_LINES = [
  "WELCOME TO RANICO INDUSTRIES (TM) TERMLINK",
  " ",
  ">SET TERMINAL/INQUIRE",
  " ",
  "RIT-V300",
  " ",
  ">SET FILE/PROTECTION=OWNER:RWED ACCOUNTS.F",
  ">SET HALT RESTART/MAINT",
  " ",
  "Initializing RaniCo Industries(TM) MF Boot Agent v2.3.0",
  "RETROS BIOS",
  "RBIOS-4.02.08.00 52EE5.E7.E8",
  "Copyright 2201-2203 RaniCo Ind.",
  "Uppermem: 64 KB",
  "Root (5A8)",
  "Maintenance Mode",
  " ",
];

export async function bootScreen(root: HTMLElement): Promise<() => void> {
  session.booted = true;
  sound.boot();

  const wrap = el("div", "screen-pad boot");
  root.appendChild(wrap);

  let cancelled = false;
  let timer = 0;

  void typeLines(wrap, BOOT_LINES, 10).then(() => {
    if (cancelled) return;
    const prompt = el("div", "tw-line");
    prompt.appendChild(el("span", "", ">"));
    prompt.appendChild(el("span", "cursor", "■"));
    wrap.appendChild(prompt);
    // short beat on the bare prompt before the tape check, like the game
    timer = window.setTimeout(() => navigate("/check"), 900);
  });

  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}
