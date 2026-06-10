import Dexie, { type Table } from "dexie";
import type { Holotape, Journal, JournalEntry } from "./types";

class TerminalJournalDB extends Dexie {
  holotape!: Table<Holotape, string>;
  journals!: Table<Journal, string>;
  entries!: Table<JournalEntry, string>;

  constructor() {
    super("terminal-journal");
    this.version(1).stores({
      holotape: "id",
      journals: "id, createdAt",
      entries: "id, journalId, createdAt, updatedAt",
    });
  }
}

export const db = new TerminalJournalDB();

export const HOLOTAPE_ID = "holotape";

export async function getHolotape(): Promise<Holotape | undefined> {
  return db.holotape.get(HOLOTAPE_ID);
}

export function newId(): string {
  return crypto.randomUUID();
}
