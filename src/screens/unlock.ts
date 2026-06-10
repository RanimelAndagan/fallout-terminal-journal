import { getHolotape } from "../db";
import { navigate } from "../router";
import { session } from "../state";
import { sound } from "../sound";
import { el } from "../ui";
import { typeSequence } from "../typewriter";
import {
  MAX_ATTEMPTS,
  ROWS,
  LINE_LEN,
  STREAM_LEN,
  pickPassword,
  pickDuds,
  dudCount,
  generateBoard,
  likeness,
  rollBracketEffect,
  rowAddress,
} from "../minigame/logic";
import { WORDLIST } from "../minigame/wordlist";

interface Unit {
  id: number;
  kind: "word" | "pair";
  text: string; // full word, or the bracket pair string
  start: number;
  end: number; // inclusive
  spans: HTMLElement[];
  removed: boolean;
}

const LOG_LIMIT = 14;

export async function unlockScreen(root: HTMLElement): Promise<(() => void) | void> {
  const tape = await getHolotape();
  if (!tape) {
    navigate("/check");
    return;
  }
  session.instantText = tape.settings.instantText;
  session.unlocked = false;

  const rng = Math.random;
  const password = pickPassword(tape.passwordWords, rng);
  const pool = WORDLIST[password.length] ?? [];
  const duds = pickDuds(password, tape.passwordWords, pool, dudCount(rng), rng);
  const board = generateBoard(password, duds, rng);

  let attempts = MAX_ATTEMPTS;
  let finished = false;
  const log: string[] = [];
  const timers: number[] = [];

  const wrap = el("div", "screen-pad minigame");
  root.appendChild(wrap);

  const headerA = el("div", "mg-header");
  const headerB = el("div", "mg-header");
  wrap.appendChild(headerA);
  wrap.appendChild(headerB);
  const attemptsLine = el("div", "mg-attempts");
  wrap.appendChild(attemptsLine);

  await typeSequence(
    [
      { el: headerA, text: "RANICO INDUSTRIES (TM) TERMLINK PROTOCOL" },
      { el: headerB, text: "ENTER PASSWORD NOW" },
    ],
    8,
  );

  function renderAttempts() {
    attemptsLine.innerHTML = "";
    attemptsLine.appendChild(
      el("span", "", `${attempts} ATTEMPT(S) LEFT: `),
    );
    for (let i = 0; i < attempts; i++) {
      attemptsLine.appendChild(el("span", "attempt-block", "■"));
    }
  }
  renderAttempts();

  // build selectable units from the generated board
  const units: Unit[] = [];
  const posToUnit: (Unit | undefined)[] = new Array(STREAM_LEN);
  let uid = 0;
  for (const w of board.words) {
    const u: Unit = {
      id: uid++,
      kind: "word",
      text: w.word,
      start: w.start,
      end: w.start + w.word.length - 1,
      spans: [],
      removed: false,
    };
    units.push(u);
    for (let i = u.start; i <= u.end; i++) posToUnit[i] = u;
  }
  for (const p of board.bracketPairs) {
    const u: Unit = {
      id: uid++,
      kind: "pair",
      text: board.chars.slice(p.start, p.end + 1).join(""),
      start: p.start,
      end: p.end,
      spans: [],
      removed: false,
    };
    units.push(u);
    for (let i = p.start; i <= p.end; i++) posToUnit[i] = u;
  }
  units.sort((a, b) => a.start - b.start);

  // board: two column blocks, addresses run down the left column then the right
  const body = el("div", "mg-body");
  wrap.appendChild(body);
  const boardEl = el("div", "mg-board");
  body.appendChild(boardEl);

  const cols = [el("div", "mg-col"), el("div", "mg-col")];
  cols.forEach((c) => boardEl.appendChild(c));

  for (let line = 0; line < STREAM_LEN / LINE_LEN; line++) {
    const colEl = cols[line < ROWS ? 0 : 1]!;
    const row = el("div", "mg-row");
    row.appendChild(el("span", "mg-addr", rowAddress(board.baseAddress, line)));
    const charsEl = el("span", "mg-chars");
    let i = line * LINE_LEN;
    const lineEnd = i + LINE_LEN;
    while (i < lineEnd) {
      const u = posToUnit[i];
      if (!u) {
        // batch consecutive junk into one text node
        let j = i;
        while (j < lineEnd && !posToUnit[j]) j++;
        charsEl.appendChild(
          document.createTextNode(board.chars.slice(i, j).join("")),
        );
        i = j;
      } else {
        const segEnd = Math.min(u.end + 1, lineEnd);
        const span = el("span", "token", board.chars.slice(i, segEnd).join(""));
        span.dataset.uid = String(u.id);
        u.spans.push(span);
        charsEl.appendChild(span);
        i = segEnd;
      }
    }
    row.appendChild(charsEl);
    colEl.appendChild(row);
  }

  // right-hand column: scrolling guess log over a live "> SELECTION" line
  const logEl = el("div", "mg-log");
  body.appendChild(logEl);
  const logLines = el("div", "mg-log-lines");
  logEl.appendChild(logLines);
  const preview = el("div", "mg-preview");
  logEl.appendChild(preview);

  function pushLog(...lines: string[]) {
    log.push(...lines);
    logLines.innerHTML = "";
    for (const line of log.slice(-LOG_LIMIT)) {
      logLines.appendChild(el("div", "", ">" + line));
    }
  }

  let selectedIdx = -1;
  function renderPreview() {
    const u = units[selectedIdx];
    preview.innerHTML = "";
    preview.appendChild(
      el("span", "", ">" + (u && !u.removed ? u.text : "")),
    );
    preview.appendChild(el("span", "cursor", "■"));
  }
  renderPreview();

  function select(idx: number) {
    const prev = units[selectedIdx];
    prev?.spans.forEach((s) => s.classList.remove("selected"));
    selectedIdx = idx;
    const u = units[selectedIdx];
    u?.spans.forEach((s) => s.classList.add("selected"));
    renderPreview();
    sound.keypress();
  }

  function removeDudFromBoard(target: Unit) {
    target.removed = true;
    // the game blanks removed duds to dots
    target.spans.forEach((s) => {
      s.textContent = ".".repeat(s.textContent?.length ?? 0);
      s.classList.remove("selected");
      s.classList.add("removed");
    });
  }

  function finishWin() {
    finished = true;
    sound.granted();
    pushLog(password, "Exact match!", "Please wait", "while system", "is accessed.");
    timers.push(
      window.setTimeout(() => {
        session.unlocked = true;
        navigate("/home");
      }, 1400),
    );
  }

  function finishLock() {
    finished = true;
    sound.lock();
    timers.push(window.setTimeout(() => navigate("/locked"), 600));
  }

  function activate(idx: number) {
    if (finished) return;
    const u = units[idx];
    if (!u || u.removed) return;

    if (u.kind === "pair") {
      u.removed = true;
      u.spans.forEach((s) => s.classList.remove("selected"));
      pushLog(u.text);
      const effect = rollBracketEffect(rng);
      const liveDuds = units.filter(
        (x) => x.kind === "word" && !x.removed && x.text !== password,
      );
      if (effect === "reset-attempts" || liveDuds.length === 0) {
        attempts = MAX_ATTEMPTS;
        renderAttempts();
        pushLog("Tries reset.");
      } else {
        const target = liveDuds[Math.floor(rng() * liveDuds.length)]!;
        removeDudFromBoard(target);
        pushLog("Dud removed.");
      }
      renderPreview();
      return;
    }

    if (u.text === password) {
      finishWin();
      return;
    }

    sound.denied();
    pushLog(u.text, "Entry denied.", `${likeness(u.text, password)}/${password.length} correct.`);
    attempts--;
    renderAttempts();
    if (attempts <= 0) finishLock();
  }

  // mouse: hover previews, click activates
  for (const u of units) {
    for (const span of u.spans) {
      span.addEventListener("mouseenter", () => {
        if (!u.removed) select(units.indexOf(u));
      });
      span.addEventListener("click", () => {
        if (!u.removed) {
          select(units.indexOf(u));
          activate(units.indexOf(u));
        }
      });
    }
  }

  function step(dir: 1 | -1) {
    if (units.length === 0) return;
    let idx = selectedIdx;
    for (let n = 0; n < units.length; n++) {
      idx = (idx + dir + units.length) % units.length;
      if (!units[idx]!.removed) break;
    }
    select(idx);
  }

  function onKey(e: KeyboardEvent) {
    if (finished) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      step(1);
      e.preventDefault();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      step(-1);
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (selectedIdx >= 0) activate(selectedIdx);
      e.preventDefault();
    }
  }
  window.addEventListener("keydown", onKey);
  step(1);

  return () => {
    window.removeEventListener("keydown", onKey);
    timers.forEach((t) => clearTimeout(t));
  };
}
