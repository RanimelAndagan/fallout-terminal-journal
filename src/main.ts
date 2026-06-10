import "./styles.css";
import { route, startRouter } from "./router";
import { bootScreen } from "./screens/boot";
import { checkScreen } from "./screens/check";
import { setupScreen } from "./screens/setup";
import { unlockScreen } from "./screens/unlock";
import { lockedScreen } from "./screens/locked";
import { homeScreen } from "./screens/home";
import { journalScreen } from "./screens/journal";
import { entriesScreen } from "./screens/entries";
import { readerScreen } from "./screens/reader";
import { editorScreen } from "./screens/editor";

route("/boot", bootScreen);
route("/check", checkScreen);
route("/setup", setupScreen);
route("/unlock", unlockScreen);
route("/locked", lockedScreen);
route("/home", homeScreen);
route("/journal/:id", journalScreen);
route("/journal/:id/entries", (r, p) => entriesScreen(r, p, false));
route("/journal/:id/search", (r, p) => entriesScreen(r, p, true));
route("/entry/:id", readerScreen);
route("/edit/:id", editorScreen);
route("/new/:journalId", editorScreen);

startRouter(document.getElementById("content")!);
