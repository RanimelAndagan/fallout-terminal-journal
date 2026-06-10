import { session } from "./state";

export type Cleanup = () => void;
export type ScreenRenderer = (
  root: HTMLElement,
  params: Record<string, string>,
) => Cleanup | void | Promise<Cleanup | void>;

interface Route {
  parts: string[];
  render: ScreenRenderer;
}

const routes: Route[] = [];
let root: HTMLElement;
let cleanup: Cleanup | null = null;

// screens reachable without solving the password minigame
const PUBLIC = new Set(["/boot", "/check", "/setup", "/unlock", "/locked"]);

export function route(pattern: string, render: ScreenRenderer): void {
  routes.push({ parts: pattern.split("/").filter(Boolean), render });
}

export function navigate(hash: string): void {
  if (location.hash === "#" + hash) {
    void dispatch(); // re-render the same screen (e.g. after creating a journal)
  } else {
    location.hash = hash;
  }
}

function match(path: string): { render: ScreenRenderer; params: Record<string, string> } | null {
  const parts = path.split("/").filter(Boolean);
  outer: for (const r of routes) {
    if (r.parts.length !== parts.length) continue;
    const params: Record<string, string> = {};
    for (let i = 0; i < parts.length; i++) {
      const rp = r.parts[i]!;
      const p = parts[i]!;
      if (rp.startsWith(":")) params[rp.slice(1)] = decodeURIComponent(p);
      else if (rp !== p) continue outer;
    }
    return { render: r.render, params };
  }
  return null;
}

async function dispatch(): Promise<void> {
  let path = location.hash.slice(1) || "/boot";

  // a reload mid-session always replays boot, then the lock. journals are
  // private, so deep links never bypass the minigame.
  if (!session.booted && path !== "/boot") {
    location.replace("#/boot");
    return;
  }
  if (!PUBLIC.has(path) && !session.unlocked) {
    location.replace("#/unlock");
    return;
  }

  const m = match(path);
  if (!m) {
    location.replace(session.unlocked ? "#/home" : "#/boot");
    return;
  }

  cleanup?.();
  cleanup = null;
  root.innerHTML = "";
  root.scrollTop = 0;
  const c = await m.render(root, m.params);
  if (typeof c === "function") cleanup = c;
}

export function startRouter(rootEl: HTMLElement): void {
  root = rootEl;
  window.addEventListener("hashchange", () => void dispatch());
  location.replace("#/boot");
  void dispatch();
}
