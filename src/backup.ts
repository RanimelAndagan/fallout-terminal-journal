import { db, HOLOTAPE_ID } from "./db";
import type { Holotape, HolotapeExport, Journal, JournalEntry } from "./types";

// thrown for anything wrong with an imported file so screens can show
// the themed "Tape Read Error" instead of a raw exception
export class TapeReadError extends Error {}

export async function buildExport(): Promise<HolotapeExport> {
  const holotape = await db.holotape.get(HOLOTAPE_ID);
  if (!holotape) throw new TapeReadError("No holotape to eject.");
  return {
    version: 1,
    kind: "terminal-journal-holotape",
    exportedAt: new Date().toISOString(),
    holotape,
    journals: await db.journals.toArray(),
    entries: await db.entries.toArray(),
  };
}

export async function ejectHolotape(): Promise<void> {
  const data = await buildExport();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "holotape.json";
  a.click();
  URL.revokeObjectURL(url);
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(isString);
}

// strict-ish shape check. anything off throws TapeReadError, never half-imports
export function validateExport(data: unknown): HolotapeExport {
  if (typeof data !== "object" || data === null) {
    throw new TapeReadError("Not a holotape file.");
  }
  const d = data as Record<string, unknown>;
  if (d.kind !== "terminal-journal-holotape") {
    throw new TapeReadError("Unrecognized tape format.");
  }
  if (d.version !== 1) {
    throw new TapeReadError("Unsupported tape version.");
  }
  const h = d.holotape as Record<string, unknown> | undefined;
  if (
    !h ||
    !isString(h.name) ||
    !isString(h.userName) ||
    !isStringArray(h.passwordWords) ||
    h.passwordWords.length !== 10
  ) {
    throw new TapeReadError("Tape header is damaged.");
  }
  if (!Array.isArray(d.journals) || !Array.isArray(d.entries)) {
    throw new TapeReadError("Tape data sections are damaged.");
  }
  for (const j of d.journals as Record<string, unknown>[]) {
    if (!isString(j.id) || !isString(j.name) || !isString(j.createdAt)) {
      throw new TapeReadError("A journal record is damaged.");
    }
  }
  for (const e of d.entries as Record<string, unknown>[]) {
    if (
      !isString(e.id) ||
      !isString(e.journalId) ||
      !isString(e.title) ||
      !isString(e.body) ||
      !isString(e.createdAt) ||
      !isString(e.updatedAt)
    ) {
      throw new TapeReadError("An entry record is damaged.");
    }
  }
  return data as HolotapeExport;
}

export async function parseHolotapeFile(file: File): Promise<HolotapeExport> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new TapeReadError("Tape is unreadable.");
  }
  return validateExport(parsed);
}

export type ImportMode = "merge" | "replace";

export async function importHolotape(
  data: HolotapeExport,
  mode: ImportMode,
): Promise<void> {
  await db.transaction("rw", db.holotape, db.journals, db.entries, async () => {
    if (mode === "replace") {
      await db.holotape.clear();
      await db.journals.clear();
      await db.entries.clear();
      await db.holotape.put({ ...data.holotape, id: HOLOTAPE_ID });
      await db.journals.bulkPut(data.journals);
      await db.entries.bulkPut(data.entries);
      return;
    }

    // merge: keep the current holotape identity and words, pull in any
    // journals/entries we don't have. on entry id conflicts the newer
    // updatedAt wins so a restore never clobbers fresher local writes.
    const existing = await db.holotape.get(HOLOTAPE_ID);
    if (!existing) {
      await db.holotape.put({ ...data.holotape, id: HOLOTAPE_ID });
    }
    const journals: Journal[] = data.journals;
    for (const j of journals) {
      const have = await db.journals.get(j.id);
      if (!have) await db.journals.put(j);
    }
    const entries: JournalEntry[] = data.entries;
    for (const e of entries) {
      const have = await db.entries.get(e.id);
      if (!have || have.updatedAt < e.updatedAt) await db.entries.put(e);
    }
  });
}

// hidden file input dance, the only way to open a picker from the web
export function pickHolotapeFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.addEventListener("change", () => resolve(input.files?.[0] ?? null));
    // cancel detection is unreliable across browsers; rely on change only
    input.click();
  });
}

export type { Holotape };
