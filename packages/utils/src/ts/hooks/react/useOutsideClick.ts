import { useEffect, type RefObject } from "react";
import { initOutsideClick, type OutsideClickConfig } from "../vanilla/outsideClick";
import { NIL } from "sia-reactor";

/** React hook to attach outside-click, escape, and optional focus-out handling to an element. */
export function useOutsideClick<T extends HTMLElement>(ref: RefObject<T>, config: OutsideClickConfig = NIL) {
  useEffect(() => (ref.current ? initOutsideClick(ref.current, config)?.destroy : undefined), [ref, config.enabled, config.onOutside, config.outOnEscape, config.outOnClick, config.outOnFocusOut, config.allowBounds, config.allowInputs, config.root, config.scoped, config.capture]);
}
