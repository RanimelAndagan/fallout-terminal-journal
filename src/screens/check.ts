import { getHolotape } from "../db";
import { navigate } from "../router";
import { el, createMenu, blankLine, rule, type Menu } from "../ui";
import { typeLines } from "../typewriter";
import { osHeader } from "./header";
import {
  pickHolotapeFile,
  parseHolotapeFile,
  importHolotape,
  TapeReadError,
} from "../backup";

// first stop after boot. with a holotape present this is invisible and we go
// straight to the lock. without one it plays the tape-drive failure scene.
export async function checkScreen(root: HTMLElement): Promise<(() => void) | void> {
  const tape = await getHolotape();
  if (tape) {
    navigate("/unlock");
    return;
  }

  const wrap = el("div", "screen-pad");
  root.appendChild(wrap);
  osHeader(wrap);
  blankLine(wrap);

  const errBox = el("div", "tape-error");
  wrap.appendChild(errBox);
  await typeLines(errBox, [
    "ERROR 0xF4100D2",
    '"No Data Storage Detected."',
    '"Check Tape Drive Connection."',
  ]);
  rule(wrap);
  blankLine(wrap);

  const status = el("div", "status-line", " ");
  let menu: Menu | null = null;

  async function doInsert() {
    const file = await pickHolotapeFile();
    if (!file) return;
    try {
      const data = await parseHolotapeFile(file);
      // nothing exists yet, so an insert here is always a full restore
      await importHolotape(data, "replace");
      navigate("/unlock");
    } catch (err) {
      status.textContent =
        err instanceof TapeReadError
          ? `TAPE READ ERROR: ${err.message}`
          : "TAPE READ ERROR: Unknown failure.";
    }
  }

  menu = createMenu(wrap, [
    { label: "[INITIALIZE NEW HOLOTAPE]", onSelect: () => navigate("/setup") },
    { label: "[INSERT HOLOTAPE]", onSelect: () => void doInsert() },
  ]);
  wrap.appendChild(status);

  return () => menu?.dispose();
}
