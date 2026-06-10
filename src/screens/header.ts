import { el } from "../ui";

// the centered ranico masthead that tops the os screens
export function osHeader(container: HTMLElement, withModel = false): void {
  const head = el("div", "os-header");
  head.appendChild(el("div", "", "RANICO INDUSTRIES UNIFIED OPERATING SYSTEM"));
  head.appendChild(el("div", "", "COPYRIGHT 2075-2077 RANICO INDUSTRIES"));
  head.appendChild(el("div", "", "-Server 1-"));
  container.appendChild(head);
  if (withModel) {
    const model = el("div", "os-model");
    model.appendChild(el("div", "", "RaniCo Doc-u-Writer Model 986"));
    container.appendChild(model);
  }
}
