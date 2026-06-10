import { describe, it, expect } from "vitest";
import {
  likeness,
  pickDuds,
  generateBoard,
  findBracketPairs,
  STREAM_LEN,
} from "../src/minigame/logic";
import { WORDLIST } from "../src/minigame/wordlist";

// deterministic rng so board tests don't flake
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("likeness", () => {
  it("counts only same-position matches", () => {
    expect(likeness("VAULT", "VAULT")).toBe(5);
    expect(likeness("VAULT", "FAULT")).toBe(4);
    expect(likeness("ABCDE", "EDCBA")).toBe(1); // only the middle C lines up
    expect(likeness("AAAAA", "BBBBB")).toBe(0);
  });
});

describe("pickDuds", () => {
  const userWords = ["HOUSE", "WATER", "BREAD", "STONE", "FLAME", "GHOST", "RIVER", "CLOUD", "TRAIN", "KNIFE"];

  it("returns the requested count, all matching the password length", () => {
    const duds = pickDuds("HOUSE", userWords, WORDLIST[5]!, 12, seededRng(1));
    expect(duds).toHaveLength(12);
    expect(duds.every((d) => d.length === 5)).toBe(true);
  });

  it("never includes the password or any of the user's other words", () => {
    const duds = pickDuds("HOUSE", userWords, WORDLIST[5]!, 14, seededRng(2));
    for (const d of duds) {
      expect(userWords).not.toContain(d);
    }
  });

  it("returns no duplicates", () => {
    const duds = pickDuds("TERMINAL", ["TERMINAL"], WORDLIST[8]!, 14, seededRng(3));
    expect(new Set(duds).size).toBe(duds.length);
  });
});

describe("generateBoard", () => {
  it("embeds the password and every dud exactly once, readable in the stream", () => {
    const rng = seededRng(42);
    const duds = pickDuds("SHELTER", ["SHELTER"], WORDLIST[7]!, 12, rng);
    const board = generateBoard("SHELTER", duds, rng);
    const stream = board.chars.join("");
    expect(board.chars).toHaveLength(STREAM_LEN);
    expect(board.words).toHaveLength(13);
    for (const placed of board.words) {
      expect(stream.slice(placed.start, placed.start + placed.word.length)).toBe(placed.word);
    }
    expect(board.words.filter((w) => w.word === "SHELTER")).toHaveLength(1);
  });

  it("keeps at least one junk character between placed words", () => {
    const rng = seededRng(7);
    const duds = pickDuds("VAULT", ["VAULT"], WORDLIST[5]!, 14, rng);
    const board = generateBoard("VAULT", duds, rng);
    const sorted = [...board.words].sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      expect(sorted[i]!.start).toBeGreaterThan(prev.start + prev.word.length);
    }
  });
});

describe("findBracketPairs", () => {
  it("matches pairs on the same line and ignores brackets inside words", () => {
    // build one line by hand: pair at 0..3, an unmatched opener, then a word zone
    const chars = "(..)..[WORD]".split("");
    const taken = chars.map((_, i) => i >= 7 && i <= 10);
    const pairs = findBracketPairs(chars, taken);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual({ start: 0, end: 3 });
  });
});
