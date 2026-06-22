import { useEffect, useRef, useCallback, type RefObject } from "react";
import { ScrollDir, ScrollAssistConfig } from "../vanilla";
import { INTERACTIVE_SELECTOR } from "../../core/dom";
import { NIL } from "sia-reactor";

/** Configuration options for the `useScrollAssist` hook. */
interface UseScrollAssistConfig extends ScrollAssistConfig {
  /** Enables or disables the scroll assist. @default  `true`. */
  enabled?: boolean;
}

/** React hook to add edge-scrolling assist to an element. It creates invisible "hot zones" at the edges of the element that, when hovered or dragged into, will scroll the element in that direction.
 * The assist is automatically disabled when the element is too small or contains interactive elements near the edges to prevent interference.
 * @param ref Ref of Scrollable element to enhance.
 * @param options Scroll assist configuration.
 * @returns An object with a method to manually update scroll assist visibility.
 */
export function useScrollAssist(ref: RefObject<HTMLElement>, { enabled = true, pxPerSecond = 80, assistClassName = "t007-scroll-assist", vertical = true, horizontal = true }: UseScrollAssistConfig = NIL) {
  const scrollId = useRef<number | null>(null),
    last = useRef(performance.now()),
    assists = useRef<Partial<Record<ScrollDir, HTMLDivElement>>>({}),
    assistWidth = useRef(20),
    assistHeight = useRef(20);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const hasInteractive = !!el.querySelector(INTERACTIVE_SELECTOR);
    if (horizontal) {
      const w = assists.current.left?.offsetWidth || assistWidth.current;
      const check = hasInteractive ? el.clientWidth < w * 2 : false;
      assists.current.left!.style.display = check ? "none" : el.scrollLeft > 0 ? "block" : "none";
      assists.current.right!.style.display = check ? "none" : el.scrollLeft + el.clientWidth < el.scrollWidth - 1 ? "block" : "none";
      assistWidth.current = w;
    }
    if (vertical) {
      const h = assists.current.up?.offsetHeight || assistHeight.current;
      const check = hasInteractive ? el.clientHeight < h * 2 : false;
      assists.current.up!.style.display = check ? "none" : el.scrollTop > 0 ? "block" : "none";
      assists.current.down!.style.display = check ? "none" : el.scrollTop + el.clientHeight < el.scrollHeight - 1 ? "block" : "none";
      assistHeight.current = h;
    }
  }, [ref, horizontal, vertical]);

  const scroll = useCallback(
    (dir: ScrollDir) => {
      const el = ref.current;
      if (!el) return;
      const loop = () => {
        const now = performance.now(),
          dt = now - last.current;
        last.current = now;
        const d = (pxPerSecond * dt) / 1000;
        if (dir === "left") el.scrollLeft = Math.max(0, el.scrollLeft - d);
        if (dir === "right") el.scrollLeft = Math.min(el.scrollWidth - el.clientWidth, el.scrollLeft + d);
        if (dir === "up") el.scrollTop = Math.max(0, el.scrollTop - d);
        if (dir === "down") el.scrollTop = Math.min(el.scrollHeight - el.clientHeight, el.scrollTop + d);
        scrollId.current = requestAnimationFrame(loop);
      };
      last.current = performance.now();
      loop();
    },
    [ref, pxPerSecond]
  );

  const stop = useCallback(() => void (cancelAnimationFrame(scrollId.current ?? 0), (scrollId.current = null)), []);

  const createAssist = useCallback(
    (dir: ScrollDir) => {
      const el = document.createElement("div");
      el.className = assistClassName;
      el.dataset.scrollDirection = dir;
      el.style.display = "none";
      for (const evt of ["pointerenter", "dragenter"]) el.addEventListener(evt, () => scroll(dir));
      for (const evt of ["pointerleave", "pointerup", "pointercancel", "dragleave", "dragend"]) el.addEventListener(evt, stop);
      return el;
    },
    [assistClassName, scroll, stop]
  );

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el || !el.parentElement) return;
    const parent = el.parentElement;
    const dirs: ScrollDir[] = [...(horizontal ? (["left", "right"] as const) : []), ...(vertical ? (["up", "down"] as const) : [])];
    for (const dir of dirs) {
      const div = createAssist(dir);
      assists.current[dir] = div;
      (dir === "left" || dir === "up" ? parent.insertBefore : parent.appendChild).call(parent, div, el);
    }
    const observer = new ResizeObserver(update),
      mObserver = new MutationObserver(update);
    update(), el.addEventListener("scroll", update);
    observer.observe(el), mObserver.observe(el, { childList: true, subtree: true, characterData: true });
    const allAssists = assists.current;
    return () => {
      stop(), el.removeEventListener("scroll", update);
      observer.disconnect(), mObserver.disconnect();
      for (const a of Object.values(allAssists)) a?.remove();
    };
  }, [ref, enabled, assistClassName, vertical, horizontal, createAssist, update, stop]);

  return { update };
}
