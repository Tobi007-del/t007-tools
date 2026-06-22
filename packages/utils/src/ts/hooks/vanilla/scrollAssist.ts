import { NIL } from "sia-reactor";
import { createEl, INTERACTIVE_SELECTOR } from "../..";

export type ScrollDir = "left" | "right" | "up" | "down";

/** Scroll assist control object returned by initScrollAssist. */
export interface ScrollAssistHandle {
  /** Recompute assist visibility. */
  update: () => void;
  /** Tear down observers and assist elements. */
  destroy: () => void;
}

/** Configuration for scroll assist overlays. */
export interface ScrollAssistConfig {
  /** Scroll speed in pixels per second. @default  `80`. */
  pxPerSecond?: number;
  /** Class name applied to assist overlays. @default  `"t007-scroll-assist"`. */
  assistClassName?: string;
  /** Enable vertical assist overlays. @default  `true`. */
  vertical?: boolean;
  /** Enable horizontal assist overlays. @default  `true`. */
  horizontal?: boolean;
}

/** Hook to add edge-scrolling assist to an element. It creates invisible "hot zones" at the edges of the element that, when hovered or dragged into, will scroll the element in that direction.
 * The assist is automatically disabled when the element is too small or contains interactive elements near the edges to prevent interference.
 * @param el Scrollable element to enhance.
 * @param options Scroll assist configuration.
 * @returns Scroll assist controls or void when the element is already managed.
 */
export function initScrollAssist(el: HTMLElement, { pxPerSecond = 80, assistClassName = "t007-scroll-assist", vertical = true, horizontal = true }: ScrollAssistConfig = NIL): ScrollAssistHandle | void {
  const parent = el?.parentElement,
    existing = (t007._scrollers ??= new WeakMap<HTMLElement, ScrollAssistHandle>()).get(el);
  if (!parent || existing) return existing ? existing : undefined;
  t007._scrollers_r_observer ??= new ResizeObserver((entries) => {
    for (const { target } of entries) t007._scrollers!.get(target as HTMLElement)?.update();
  });
  t007._scrollers_m_observer ??= new MutationObserver((entries) => {
    const els = new Set<HTMLElement>();
    for (const entry of entries) {
      let node: Element | null = entry.target instanceof Element ? entry.target : null;
      while (node && !t007._scrollers!.has(node as HTMLElement)) node = node.parentElement;
      if (node) els.add(node as HTMLElement);
    }
    for (const el of els) t007._scrollers!.get(el)?.update();
  });
  const assist: Record<ScrollDir, HTMLElement> = {} as any;
  let scrollId: number | null = null,
    last = performance.now(),
    assistWidth = 20,
    assistHeight = 20;
  const update = () => {
    const hasInteractive = !!parent.querySelector(INTERACTIVE_SELECTOR);
    if (horizontal) {
      const w = assist.left?.offsetWidth || assistWidth,
        check = hasInteractive ? el.clientWidth < w * 2 : false;
      assist.left.style.display = check ? "none" : el.scrollLeft > 0 ? "block" : "none";
      assist.right.style.display = check ? "none" : el.scrollLeft + el.clientWidth < el.scrollWidth - 1 ? "block" : "none";
      assistWidth = w;
    }
    if (vertical) {
      const h = assist.up?.offsetHeight || assistHeight,
        check = hasInteractive ? el.clientHeight < h * 2 : false;
      assist.up.style.display = check ? "none" : el.scrollTop > 0 ? "block" : "none";
      assist.down.style.display = check ? "none" : el.scrollTop + el.clientHeight < el.scrollHeight - 1 ? "block" : "none";
      assistHeight = h;
    }
  };
  const scroll = (dir: ScrollDir) => {
    const frame = () => {
      const now = performance.now(),
        dt = now - last;
      last = now;
      const d = (pxPerSecond * dt) / 1000;
      if (dir === "left") el.scrollLeft = Math.max(0, el.scrollLeft - d);
      if (dir === "right") el.scrollLeft = Math.min(el.scrollWidth - el.clientWidth, el.scrollLeft + d);
      if (dir === "up") el.scrollTop = Math.max(0, el.scrollTop - d);
      if (dir === "down") el.scrollTop = Math.min(el.scrollHeight - el.clientHeight, el.scrollTop + d);
      scrollId = requestAnimationFrame(frame);
    };
    last = performance.now();
    frame();
  };
  const stop = () => (cancelAnimationFrame(scrollId ?? 0), (scrollId = null));
  const addAssist = (dir: ScrollDir): void => {
    const div = createEl("div", { className: assistClassName }, { scrollDirection: dir }, { display: "none" });
    if (!div) return;
    for (const evt of ["pointerenter", "dragenter"]) div.addEventListener(evt, () => scroll(dir));
    for (const evt of ["pointerleave", "pointerup", "pointercancel", "dragleave", "dragend"]) div.addEventListener(evt, stop);
    dir === "left" || dir === "up" ? parent.insertBefore(div, el) : parent.append(div);
    assist[dir] = div;
  };
  if (horizontal) for (const dir of ["left", "right"] as const) addAssist(dir);
  if (vertical) for (const dir of ["up", "down"] as const) addAssist(dir);
  const handle = {
    update,
    destroy() {
      stop(), el.removeEventListener("scroll", update);
      t007._scrollers_r_observer!.unobserve(el), t007._scrollers!.delete(el);
      for (const a of Object.values(assist)) a.remove();
    },
  };
  update(), el.addEventListener("scroll", update);
  t007._scrollers_r_observer!.observe(el), t007._scrollers_m_observer!.observe(el, { childList: true, subtree: true, characterData: true });
  return t007._scrollers.set(el, handle), handle;
}

/** Remove scroll assist from an element.
 * @param el Target element.
 */
export const removeScrollAssist = (el: HTMLElement) => t007._scrollers!.get(el)?.destroy();
