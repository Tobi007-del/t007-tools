import { createEl, getActiveEl as active, INTERACTIVE_SELECTOR } from "../../core/dom";
import { NIL } from "sia-reactor";

export interface FocusTrapConfig {
  /** Enables or disables the focus trap. @default  `false`. */
  enabled?: boolean;
  /** The preferred initial focus target selector within the element, overrides whatever was focused. Try `autofocus` attribute if working with dialogs before this. @default  `[data-autofocus]`. */
  initialSelector?: string;
  /** The class name for the initial focus ring since programmatic focus is not always visible, `autofocus` attribute in dialogs might work fine as an alternative. @default  `"focus-outline"`. */
  ringClassName?: string;
  /** Optional root used to scope focus listeners to an element instead of the window. @default  `window`. */
  root?: HTMLElement | Document | Window;
  /** Whether the focus trap is scoped to the root provided it is an HTMLElement. @default  `true`. */
  scoped?: boolean;
  /** Passed down to all event listeners used. @default  `true`. */
  capture?: boolean;
  /** Focus behavior options used in triggering focus. */
  focusOptions?: FocusOptions;
}

export interface FocusTrapHandle {
  destroy: () => void;
  sync: () => void;
}

/** Hook to keep focus trapped inside an element until disabled. */
export function initFocusTrap(el: HTMLElement, { enabled = false, initialSelector = "[data-autofocus]", ringClassName = "focus-outline", root = window, scoped = true, capture = true, focusOptions }: FocusTrapConfig = NIL): FocusTrapHandle | void {
  const stack = (t007._ftrappers_stack ??= []),
    existing = (t007._ftrappers ??= new WeakMap<HTMLElement, FocusTrapHandle>()).get(el);
  if (!enabled || existing) return existing ? existing : undefined;
  (scoped = scoped && root instanceof HTMLElement), (root = scoped ? root : root === document ? document : window); // reassigning for predictability
  let recovering = false; // Anti-recursion lock
  const focused = document.querySelector<HTMLElement>(":focus"),
    initial = el.querySelector<HTMLElement>(initialSelector),
    first = createEl("span", { tabIndex: 0 }, { focusGuard: "start" }, { position: "absolute", width: "0", height: "0", pointerEvents: "none" }),
    last = createEl("span", { tabIndex: 0 }, { focusGuard: "end" }, { position: "absolute", width: "0", height: "0", pointerEvents: "none" }),
    getFocusable = (c = el) => [...c.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR)],
    resetFocus = (i = 0, els: any[] | null = getFocusable()) => !recovering && ((recovering = true), els?.length ? els.at(i).focus(focusOptions) : (!el.hasAttribute("tabindex") && (el.tabIndex = -1), el.focus(focusOptions)), (recovering = false)),
    edgeFocus = (pre = false, rt: HTMLElement = root as any) => {
      if (!scoped) return resetFocus(pre ? -1 : 0);
      if (rt.hasAttribute("tabindex")) return rt.focus(focusOptions); // If root is programmatically focusable, fallback and restore natural order.
      const items = getFocusable();
      if (!items.length) return resetFocus(0, null); // el can catch focus if it's empty
      const ceil = (document.fullscreenElement || document.querySelector("dialog:modal") || document.body) as HTMLElement; // obeying the top layer
      let p = rt.parentElement || ceil,
        all = getFocusable(p);
      while (p !== ceil && (!all.length || (pre ? rt.contains(all[0]) : rt.contains(all.at(-1)!)))) all = getFocusable((p = p.parentElement || ceil));
      for (let target, len = all.length, i = all.indexOf(items[pre ? 0 : items.length - 1]) + (pre ? -1 : 1); pre ? i >= 0 : i < len; pre ? i-- : i++) if (!rt.contains((target = all[i]))) return target.focus(focusOptions);
      (pre ? first : last).blur(); // If no focusable items, blur the guard to block visible focus.
    },
    handleFocusIn = (e: Event) => {
      if (document.querySelector("dialog:modal") && !el.matches("dialog:modal")) return; // respecting those not being managed in this stack
      stack.at(-1) === el && active(el.ownerDocument) !== root && !el.contains(active(el.ownerDocument)) && !e.composedPath().includes(el) && resetFocus(); // NEW is battle-tested. OLD: !el.contains(active(el.ownerDocument))
    },
    handleInitialBlur = () => initial!.classList.remove(ringClassName);

  first.addEventListener("focus", (e) => (el.contains(e.relatedTarget as Node) ? edgeFocus(true) : resetFocus()), capture), el.prepend(first);
  last.addEventListener("focus", (e) => (el.contains(e.relatedTarget as Node) ? edgeFocus() : resetFocus(-1)), capture), el.append(last);
  root.addEventListener("focusin", handleFocusIn, capture);
  if (initial || !el.contains(focused)) !initial ? setTimeout(resetFocus) : setTimeout(() => (initial.classList.add(ringClassName), initial.focus(focusOptions), initial.addEventListener("blur", handleInitialBlur, capture)));

  const destroy = () => {
    focused?.isConnected && focused.focus(focusOptions), first.remove(), last.remove();
    root.removeEventListener("focusin", handleFocusIn, capture);
    initial?.removeEventListener("blur", handleInitialBlur, capture);
    t007._ftrappers!.delete(el), stack.splice(stack.indexOf(el), 1);
  };
  const handle = { destroy, sync: () => (el.prepend(first), el.append(last)) };
  return !stack.includes(el) && stack.push(el), t007._ftrappers.set(el, handle), handle;
}

/** Remove the focus trap guard from an element. */
export const removeFocusTrap = (el: HTMLElement) => t007._ftrappers?.get(el)?.destroy();

/** Synchronize the focus trap guards. */
export const syncFocusTrap = (el: HTMLElement) => t007._ftrappers?.get(el)?.sync();
