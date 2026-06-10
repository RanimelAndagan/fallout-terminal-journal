// all timestamps are ISO strings so they survive JSON export/import unchanged

export interface HolotapeSettings {
  // skip typewriter animation entirely, separate from the OS-level reduced motion preference
  instantText: boolean;
}

// singleton record, there is exactly one holotape per browser profile
export interface Holotape {
  id: string; // always "holotape"
  name: string;
  userName: string;
  // ten uppercase words, 5-8 letters each. this is a privacy lock, not encryption,
  // and the ui copy must never claim otherwise
  passwordWords: string[];
  settings: HolotapeSettings;
  createdAt: string;
}

export interface Journal {
  id: string;
  name: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  journalId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

// versioned from day one so a future format change can still read old backups
export interface HolotapeExport {
  version: 1;
  kind: "terminal-journal-holotape";
  exportedAt: string;
  holotape: Holotape;
  journals: Journal[];
  entries: JournalEntry[];
}
