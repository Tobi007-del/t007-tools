import { isSym, isSameURL } from "..";
import { createEl, assignEl } from "sia-reactor/utils";

// Element Factory

export { createEl, assignEl };

/** Exhaustive Selector used for interactive, tabbable UI controls. */
export const INTERACTIVE_SELECTOR = ":is(button,[href],input:not([type='hidden']),select,textarea,details>summary,[contenteditable='true'],iframe,audio[controls],video[controls],[tabindex]):not([disabled],[tabindex='-1'],[data-focus-guard],[inert],[inert] *)";
/** Check whether an event target points to an interactive element. */
export const isInteractive = (target: EventTarget | null): boolean => target instanceof HTMLElement && target.matches(INTERACTIVE_SELECTOR);

// Resource Loading

/** Resource type accepted by loadResource. */
export type ResourceType = "style" | "script" | string;
/** Options used when loading a script or stylesheet resource. */
export type LoadResourceOptions = Partial<{
  /** Load the script as a module. */
  module: boolean;
  /** Media query applied to loaded stylesheets. */
  media: string;
  /** crossorigin attribute for the resource element. */
  crossOrigin: "anonymous" | "use-credentials" | string | null;
  /** Subresource integrity hash. */
  integrity: string;
  /** Referrer policy for the resource element. */
  referrerPolicy: "no-referrer" | "origin" | "strict-origin-when-cross-origin" | string;
  /** nonce attribute for CSP-enabled environments. */
  nonce: string;
  /** fetchpriority hint for the browser. */
  fetchPriority: "high" | "low" | "auto";
  /** Number of attempts before rejecting. */
  attempts: number;
  /** Cache-busting retry token key. */
  retryKey: boolean | string; // retry token
}>;

/** Virtual resource marker used to skip real network loading. */
export const VIRTUAL_RESOURCE: symbol = Symbol.for("T007_VIRTUAL_RESOURCE");
/** Load a stylesheet or script into the current document with retry support.
 * @param req Resource URL or virtual resource symbol.
 * @param type Resource type to load.
 * @param options Resource loading options.
 * @param w Window-like target used for DOM insertion.
 * @returns Promise resolving to the created element or void.
 */
export function loadResource(req: string | symbol, type: ResourceType = "style", { module, media, crossOrigin, integrity, referrerPolicy, nonce, fetchPriority, attempts = 3, retryKey = false }: LoadResourceOptions = {}, w = window): Promise<HTMLElement | void> {
  (w.t007 ??= {} as any), (w.t007._resourceCache ??= {});
  if (req === VIRTUAL_RESOURCE || isSym(req)) return Promise.resolve();
  const src = req as string;
  if (w.t007._resourceCache[src]) return w.t007._resourceCache[src]; // set crossorigin on (links|scripts) if provided due to document.(styleSheets|scripts)
  const existing = type === "script" ? Array.prototype.find.call(w.document.scripts, (s) => isSameURL(s.src, src)) : type === "style" ? Array.prototype.find.call(w.document.styleSheets, (s) => isSameURL((s as CSSStyleSheet).href, src)) : null;
  if (existing) return (w.t007._resourceCache[src] = Promise.resolve(existing));
  w.t007._resourceCache[src] = new Promise<HTMLElement | void>((resolve, reject) => {
    (function tryLoad(remaining: number, el?: HTMLElement) {
      const onerror = () => {
        el?.remove?.(); // Remove failed element before retrying
        if (remaining > 1) {
          setTimeout(tryLoad, 1000, remaining - 1);
          console.warn(`Retrying ${type} load (${attempts - remaining + 1}): ${src}...`);
        } else {
          delete w.t007._resourceCache[src]; // Final fail: clear cache so user can manually retry
          reject(new Error(`${type} load failed after ${attempts} attempts: ${src}`));
        }
      };
      const url = retryKey && remaining < attempts ? `${src}${src.includes("?") ? "&" : "?"}_${retryKey}=${Date.now()}` : src;
      if (type === "script") w.document.body.append((el = createEl("script", { src: url, type: module ? "module" : "text/javascript", crossOrigin, integrity, referrerPolicy, nonce, fetchPriority, onload: () => resolve(el), onerror }) || ""));
      else if (type === "style") w.document.head.append((el = createEl("link", { rel: "stylesheet", href: url, media, crossOrigin, integrity, referrerPolicy, nonce, fetchPriority, onload: () => resolve(el), onerror }) || ""));
      else reject(new Error(`Unsupported resource type: ${type}`));
    })(attempts);
  });
  return w.t007._resourceCache[src];
}

export { getActiveEl } from "sia-reactor/utils";

/** Get the window object associated with a given element.
 * @param el The element to get the window for, defaults to the main window.
 * @returns The window object or undefined if none found.
 */
export function getWindow(el: any = window): (Window & typeof globalThis) | undefined {
  return (el instanceof Window ? el : el instanceof Document ? el?.defaultView : el?.ownerDocument?.defaultView) ?? undefined;
}
