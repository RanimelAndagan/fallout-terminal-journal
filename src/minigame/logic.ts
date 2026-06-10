// pure logic for the hacking minigame. no dom, no dexie, no timers.
// the unlock screen renders whatever this produces, which is what makes
// likeness and board generation testable with plain assertions.

export const MAX_ATTEMPTS = 4;
export const ROWS = 16;
export const COLS = 2;
export const LINE_LEN = 12;
export const STREAM_LEN = ROWS * COLS * LINE_LEN;

// junk that fills the space between candidate words. brackets included on
// purpose, they power the dud-removal easter egg
const JUNK = "!@#$%^&*_-+=|\\/?.,:;'\"<>()[]{}";
const OPENERS = "([{<";
const CLOSERS = ")]}>";

export type Rng = () => number;

export interface BoardWord {
  word: string;
  start: number; // index into the flat character stream
}

export interface BracketPair {
  start: number;
  end: number; // inclusive
}

export interface Board {
  chars: string[]; // STREAM_LEN characters, words embedded in junk
  words: BoardWord[];
  bracketPairs: BracketPair[];
  baseAddress: number; // first row's fake hex address
}

function randInt(rng: Rng, max: number): number {
  return Math.floor(rng() * max);
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

// likeness is the game's hint: how many letters match the password
// at the same position. ENTRY DENIED prints "likeness/length correct."
export function likeness(guess: string, password: string): number {
  let n = 0;
  for (let i = 0; i < Math.min(guess.length, password.length); i++) {
    if (guess[i] === password[i]) n++;
  }
  return n;
}

export function pickPassword(words: string[], rng: Rng): string {
  const word = words[randInt(rng, words.length)];
  if (!word) throw new Error("no password words configured");
  return word.toUpperCase();
}

// duds share the password's length and must not collide with ANY of the
// user's ten words, otherwise the board could show two "real" answers
export function pickDuds(
  password: string,
  userWords: string[],
  pool: string[],
  count: number,
  rng: Rng,
): string[] {
  const forbidden = new Set(userWords.map((w) => w.toUpperCase()));
  forbidden.add(password.toUpperCase());
  const candidates = [
    ...new Set(
      pool
        .map((w) => w.toUpperCase())
        .filter((w) => w.length === password.length && !forbidden.has(w)),
    ),
  ];
  return shuffle(candidates, rng).slice(0, count);
}

export function generateBoard(password: string, duds: string[], rng: Rng): Board {
  const chars: string[] = [];
  for (let i = 0; i < STREAM_LEN; i++) {
    chars.push(JUNK[randInt(rng, JUNK.length)]!);
  }

  // place words at random non-touching offsets so two words never read
  // as one blob. order is shuffled so the password isn't always first.
  const words = shuffle([password, ...duds], rng);
  const placed: BoardWord[] = [];
  const taken: boolean[] = new Array(STREAM_LEN).fill(false);

  for (const word of words) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const start = randInt(rng, STREAM_LEN - word.length);
      let free = true;
      // the -1/+1 padding keeps at least one junk char between words
      for (let i = start - 1; i <= start + word.length; i++) {
        if (i >= 0 && i < STREAM_LEN && taken[i]) {
          free = false;
          break;
        }
      }
      if (!free) continue;
      for (let i = 0; i < word.length; i++) {
        chars[start + i] = word[i]!;
        taken[start + i] = true;
      }
      placed.push({ word, start });
      break;
    }
  }

  return {
    chars,
    words: placed,
    bracketPairs: findBracketPairs(chars, taken),
    baseAddress: 0xf000 + randInt(rng, 0x0c00),
  };
}

// a clickable pair is an opener and its matching closer on the same visual
// line with only junk between them, same rule as the game
export function findBracketPairs(chars: string[], taken: boolean[]): BracketPair[] {
  const pairs: BracketPair[] = [];
  const claimed = new Set<number>();
  for (let line = 0; line < STREAM_LEN / LINE_LEN; line++) {
    const lineStart = line * LINE_LEN;
    for (let i = lineStart; i < lineStart + LINE_LEN; i++) {
      const openIdx = OPENERS.indexOf(chars[i]!);
      if (openIdx === -1 || taken[i] || claimed.has(i)) continue;
      const closer = CLOSERS[openIdx]!;
      for (let j = i + 1; j < lineStart + LINE_LEN; j++) {
        if (taken[j]) break;
        if (claimed.has(j)) break;
        if (chars[j] === closer) {
          pairs.push({ start: i, end: j });
          for (let k = i; k <= j; k++) claimed.add(k);
          break;
        }
      }
    }
  }
  return pairs;
}

// roughly the game's odds: most pairs remove a dud, a few hand attempts back
export type BracketEffect = "remove-dud" | "reset-attempts";

export function rollBracketEffect(rng: Rng): BracketEffect {
  return rng() < 0.8 ? "remove-dud" : "reset-attempts";
}

// how many duds to show: 10-14 keeps the board density close to the game
export function dudCount(rng: Rng): number {
  return 10 + randInt(rng, 5);
}

export function rowAddress(baseAddress: number, row: number): string {
  // each row advances by one line's worth of bytes, like the game's 0xF650, 0xF65C...
  const addr = (baseAddress + row * LINE_LEN) & 0xffff;
  return "0x" + addr.toString(16).toUpperCase().padStart(4, "0");
}
