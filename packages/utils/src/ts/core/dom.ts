import { isSym, isSameURL, longestIncreasingSubsequence, capitalize } from "..";
import { createEl, assignEl } from "sia-reactor/utils";

// Element Factory

export { createEl, assignEl };

/** Exhaustive Selector used for interactive, tabbable UI controls. */
export const INTERACTIVE_SELECTOR = ":is(button,[href],input:not([type='hidden']),select,textarea,details>summary,[contenteditable],iframe,audio[controls],video[controls],[tabindex]):not([disabled],[tabindex='-1'],[data-focus-guard],[inert],[inert] *)";
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
 * @param win Window-like target used for DOM insertion.
 * @returns Promise resolving to the created element or void.
 */
export function loadResource(req: string | symbol, type: ResourceType = "style", { module, media, crossOrigin, integrity, referrerPolicy, nonce, fetchPriority, attempts = 3, retryKey = false }: LoadResourceOptions = {}, win = window): Promise<HTMLElement | void> {
  (win.t007 ??= {} as any), (win.t007._resourceCache ??= {});
  if (req === VIRTUAL_RESOURCE || isSym(req)) return Promise.resolve();
  const src = req as string;
  if (win.t007._resourceCache[src]) return win.t007._resourceCache[src]; // set crossorigin on (links|scripts) if provided due to document.(styleSheets|scripts)
  const existing = type === "script" ? Array.prototype.find.call(win.document.scripts, (s) => isSameURL(s.src, src)) : type === "style" ? Array.prototype.find.call(win.document.styleSheets, (s) => isSameURL((s as CSSStyleSheet).href, src)) : null;
  if (existing) return (win.t007._resourceCache[src] = Promise.resolve(existing));
  win.t007._resourceCache[src] = new Promise<HTMLElement | void>((resolve, reject) => {
    (function tryLoad(remaining: number, el?: HTMLElement) {
      const onerror = () => {
        el?.remove?.(); // Remove failed element before retrying
        if (remaining > 1) {
          setTimeout(tryLoad, 1000, remaining - 1);
          console.warn(`Retrying ${type} load for "${src}" (${attempts - remaining + 1})...`);
        } else {
          delete win.t007._resourceCache[src]; // Final fail: clear cache so user can manually retry
          reject(new Error(`${capitalize(type)} load failed for "${src}" after ${attempts - 1} attempts`));
        }
      };
      const url = retryKey && remaining < attempts ? `${src}${src.includes("?") ? "&" : "?"}_${retryKey}=${Date.now()}` : src;
      if (type === "script") win.document.body.append((el = createEl("script", { src: url, type: module ? "module" : "text/javascript", crossOrigin, integrity, referrerPolicy, nonce, fetchPriority, onload: () => resolve(el), onerror }) || ""));
      else if (type === "style") win.document.head.append((el = createEl("link", { rel: "stylesheet", href: url, media, crossOrigin, integrity, referrerPolicy, nonce, fetchPriority, onload: () => resolve(el), onerror }) || ""));
      else reject(new Error(`Unsupported resource type: ${type}`));
    })(attempts);
  });
  return win.t007._resourceCache[src];
}

export { getActiveEl } from "sia-reactor/utils";

/** Get the window object associated with a given element.
 * @param el The element to get the window for, defaults to the main window.
 * @returns The `Window` object or undefined if none found.
 */
export function getWindow(el: any = window): Window & typeof globalThis {
  return el?.ownerDocument?.defaultView ?? el?.defaultView ?? window;
}

import { NOOP } from "sia-reactor";

/** Options for configuring a list renderer */
export type ListRendererOptions<T> = {
  /** The container element to render the list into */
  container: HTMLElement;
  /** Function to extract a unique key from each item.
   * @param item The item to extract the key from
   * @returns A unique string key for the item
   */
  getKey: (item: T) => string;
  /** Function to create a DOM node for an item.
   * @param item The item to create a node for
   * @returns An HTMLElement representing the item, or null/undefined to skip rendering
   */
  createNode: (item: T) => HTMLElement | null | undefined;
  /** Optional function to update an existing node with new item data, called when an item is reused.
   * @param node The existing DOM node for the item
   * @param item The new item data to update the node with
   */
  updateNode?: (node: HTMLElement, item: T) => void;
  /** Optional function to clean up a DOM node when an item is removed, called before the node is removed from the DOM.
   * @param node The DOM node to be removed
   * @param key The unique key of the item associated with the node
   */
  destroyNode?: (node: HTMLElement, key: string) => void;
};

/**
 * Creates a list renderer function for efficiently updating a DOM list based on a new array of items using the L.I.S(Longest Increasing Subsequence) algorithm.
 * @param param0 The options for configuring the list renderer
 * @returns A function that synchronizes the DOM with the new array of items
 */
export function createListRenderer<T>({ container, getKey, createNode, updateNode = NOOP, destroyNode = NOOP }: ListRendererOptions<T>) {
  let nodeRegistry = new Map<string, HTMLElement>();
  /** Synchronizes the DOM with a new array of items by creating, updating, and removing nodes as necessary while minimizing DOM operations using the L.I.S algorithm.
   * @param array The new array of items to render
   * @param strict If true, throws an error if createNode returns null/undefined for any item; if false, skips rendering that item
   */
  return function syncDOM(array: T[], strict = true): void {
    const newRegistry = new Map<string, HTMLElement>(),
      seenKeys = new Set<string>(),
      oldPositions = new WeakMap<HTMLElement, number>(),
      children = Array.from(container.children) as HTMLElement[];
    for (let i = 0, len = children.length; i < len; i++) oldPositions.set(children[i], i); // Cache old positions for stable nodes
    // STEP 1: Build future node list + validate keys
    const futureNodes: HTMLElement[] = [],
      oldIndices: number[] = [];
    for (let i = 0, len = array.length; i < len; i++) {
      const item = array[i],
        key = getKey(item);
      if (seenKeys.has(key)) throw new Error(`[List Renderer] Duplicate key "${key}" detected`);
      let node: HTMLElement | null | undefined = nodeRegistry.get(key);
      if (!node) {
        node = createNode(item); // CREATE
        if (!node) {
          if (strict) throw new Error(`[List Renderer] No HTMLElement for key "${key}"`);
          continue;
        }
        oldIndices.push(-1);
      } else updateNode(node, item), oldIndices.push(oldPositions.get(node) ?? -1); // REUSE - Store old DOM position
      seenKeys.add(key), futureNodes.push(node), newRegistry.set(key, node);
    }
    // STEP 2: Remove dead nodes
    for (const [key, node] of nodeRegistry.entries()) !seenKeys.has(key) && node.parentElement === container && (destroyNode(node, key), node.remove());
    // STEP 3: LIS optimization
    const sequence = longestIncreasingSubsequence(oldIndices), // We only run LIS on reused nodes
      stable = new Set<number>(sequence);
    // STEP 4: Reorder/minimally patch DOM
    let anchor: ChildNode | null = null;
    for (let i = futureNodes.length - 1; i >= 0; i--) {
      const node = futureNodes[i]; // Reverse traversal avoids anchor invalidation issues
      if (oldIndices[i] !== -1 && stable.has(i)) {
        anchor = node;
        continue; // Nodes already in stable order don't move
      }
      container.insertBefore(node, anchor), (anchor = node);
    }
    nodeRegistry = newRegistry; // Save new registry
  };
}
