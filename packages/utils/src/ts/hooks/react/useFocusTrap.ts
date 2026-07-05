import { useEffect, useRef, type RefObject } from "react";
import { FocusTrapConfig, FocusTrapHandle, initFocusTrap } from "../vanilla/focusTrap";
import { NIL } from "sia-reactor";

/** React hook to keep focus trapped inside an element until disabled. */
export function useFocusTrap(ref: RefObject<HTMLElement>, config: FocusTrapConfig = NIL) {
  const handle = useRef<FocusTrapHandle | void>(undefined);
  useEffect(() => {
    if (!ref.current) return;
    return (handle.current = initFocusTrap(ref.current, config)), () => handle.current?.destroy();
  }, [ref, config.enabled, config.initialSelector, config.ringClassName, config.root, config.scoped, config.capture]);
  return { sync: () => handle.current?.sync() };
}
