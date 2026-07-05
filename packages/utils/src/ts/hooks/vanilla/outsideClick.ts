import { isInteractive } from "../../core/dom";
import { NIL, NOOP } from "sia-reactor";

export interface OutsideClickConfig {
  /** Enables or disables outside-click handling. @default  `false`. */
  enabled?: boolean;
  /** Callback invoked when an outside interaction is detected. @default  `()=>{}`. */
  onOutside?: (e: MouseEvent | TouchEvent | KeyboardEvent | FocusEvent) => void;
  /** Whether pointer/touch outside interactions should trigger callback. @default  `true`. */
  outOnClick?: boolean;
  /** Whether Escape key should trigger callback. @default  `true`. */
  outOnEscape?: boolean;
  /** Whether focus leaving the container should trigger callback. @default  `false`. */
  outOnFocusOut?: boolean;
  /** Allow only clicks inside `el` bounding client rectangle to be considered valid, otherwise uses `el.contains(target)`. @default  `false . */
  allowBounds?: boolean;
  /** Allow interactive elements including outsiders to bypass click callback. @default  `false`. */
  allowInputs?: boolean;
  /** Optional root used to scope focus listeners to an element instead of the window. @default  `window`. */
  root?: HTMLElement | Document | Window;
  /** Whether the outside click handling is scoped to the root provided it is an HTMLElement. @default  `true`. */
  scoped?: boolean;
  /** Passed down to all event listeners used. @default  `true`. */
  capture?: boolean;
}

/** Hook to attach outside-click, escape, and optional focus-out handling to an element. */
export function initOutsideClick(el: HTMLElement, { enabled = false, onOutside = NOOP, outOnClick = true, outOnEscape = true, outOnFocusOut = false, allowBounds = false, allowInputs = false, root = window, scoped = true, capture = true }: OutsideClickConfig = NIL): (() => void) | void {
  const stack = (t007._outsiders_stack ??= []),
    existing = (t007._outsiders ??= new WeakMap<HTMLElement, () => void>()).get(el);
  if (!enabled || existing) return existing ? existing : undefined;
  (scoped = scoped && root instanceof HTMLElement), (root = scoped ? root : root === document ? document : window); // reassigning for predictability
  const onScopedOut = (e: MouseEvent | TouchEvent | FocusEvent, t: Node, p = (e as TouchEvent).touches?.[0] || e, rect = allowBounds ? el.getBoundingClientRect() : null) => {
      if (stack.at(-1) !== el || (allowBounds ? p.clientX >= rect!.left && p.clientX <= rect!.right && p.clientY >= rect!.top && p.clientY <= rect!.bottom : el.contains(t))) return false; // pseudo elements, you can run but you can't hide :)
      return (!scoped ? true : (root as HTMLElement).contains(t)) && onOutside(e); // it's "outside" the dialog content, check if it's within our sandbox or the whole doc.
    },
    handleClick = ((e: MouseEvent | TouchEvent) => outOnClick && !(allowInputs && isInteractive(e.target)) && onScopedOut(e, e.target as Node)) as EventListener,
    handleEscape = ((e: KeyboardEvent) => outOnEscape && e.key === "Escape" && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey && stack.at(-1) === el && onOutside(e)) as EventListener,
    handleFocusOut = (e: FocusEvent) => outOnFocusOut && !el.contains(e.relatedTarget as Node) && onScopedOut(e, e.relatedTarget as Node);

  root.addEventListener("mousedown", handleClick, capture), root.addEventListener("touchstart", handleClick, { passive: true, capture });
  root.addEventListener("keydown", handleEscape, capture);
  el.addEventListener("focusout", handleFocusOut, capture);

  const destroy = () => {
    root.removeEventListener("mousedown", handleClick, capture), root.removeEventListener("touchstart", handleClick, capture);
    root.removeEventListener("keydown", handleEscape, capture);
    el.removeEventListener("focusout", handleFocusOut, capture);
    t007._outsiders!.delete(el), stack.splice(stack.indexOf(el), 1);
  };
  return !stack.includes(el) && stack.push(el), t007._outsiders.set(el, destroy), destroy;
}

/** Remove outside-click handling from an element. */
export const removeOutsideClick = (el: HTMLElement) => t007._outsiders?.get(el)?.();
