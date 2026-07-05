import { DEFAULT_CONFIG, H_NAV_KEYS, NAV_KEYS } from "../react/useArrowNavigation/consts";
import { getCommonAncestor, getGrid, getTargetIndex } from "../react/useArrowNavigation/utils";
import type { Config as ArrowNavigationConfig, KeyEvent } from "../react/useArrowNavigation/types";
import { getActiveEl } from "../../core/dom";

export type ArrowNavigationHandle = {
  /** Current computed horizontal grid size. */
  gridX: () => number;
  /** Current computed vertical grid size. */
  gridY: () => number;
  /** Current computed virtual vertical grid size. */
  vGridY: () => number;
  /** Current live list of navigable items. */
  items: () => HTMLElement[];
  /** Current active index. */
  activeIndex: () => number;
  /** Current active element or null when none is active. */
  activeItem: () => HTMLElement | null;
  /** Resolve the next enabled index from a directional move. */
  getAbleIndex: (targetIndex: number, e?: KeyEvent) => number | null;
  /** Run type-ahead selection logic. */
  typeAhead: (key: string) => void;
  /** Move active selection/focus to a target index. */
  goToIndex: (index: number, e?: KeyEvent) => void;
  /** Simulate directional key navigation with a keyboard-like event. */
  simulateKey: (e: KeyEvent) => void;
  /** Synchronize the navigation items list with the DOM. */
  sync: () => void;
  /** Remove listeners/observers and release resources. */
  destroy: () => void;
};

/** A vanilla JavaScript utility for managing robust arrow-key roving focus navigation. */
export function initArrowNavigation(container: HTMLElement, config: ArrowNavigationConfig = {}): ArrowNavigationHandle | void {
  const existing = (t007._arrownavs ??= new WeakMap<HTMLElement, ArrowNavigationHandle>()).get(container);
  if (!config.enabled || existing) return existing ? existing : undefined;
  const { enabled: isEnabled, selector, focusOnHover, loop, virtual, typeahead, resetMs, activeClass, inputSelector, defaultTabbableIndex, baseTabIndex, grid, rtl: isRtl, focusOptions, scrollIntoView, onSelect, onFocusOut, rovingTab } = { ...DEFAULT_CONFIG, ...config };
  let gridX = grid.x || 1,
    gridY = grid.y || 1,
    vGridY = grid.vY || 1,
    activeIndex = -1,
    buffer = "",
    timeout: ReturnType<typeof setTimeout> | null = null,
    items: HTMLElement[] = [];
  const enabled = isEnabled ?? virtual,
    roving = rovingTab ?? !virtual,
    rtl = isRtl ?? ("undefined" === typeof document ? false : getComputedStyle(container).direction === "rtl"),
    shouldSnub = () => !enabled || !container,
    isItemDisabled = (el?: HTMLElement) => !el || el.matches('[disabled],[aria-disabled="true"],[inert],:disabled'),
    getItems = () => (items = Array.from(container.querySelectorAll<HTMLElement>(selector)));

  const getAbleIndex = (targetIndex: number, e: KeyEvent = { key: "ArrowRight", ctrlKey: false }): number | null => {
    if (shouldSnub() || !items.length) return null;
    let index = targetIndex;
    let attempts = 0;
    while (attempts < items.length) {
      if (!isItemDisabled(items[index])) return index;
      index = getTargetIndex({ key: e.key, currIndex: index, gridX, gridY, vGridY, length: items.length, loop, ctrlKey: e.ctrlKey, rtl });
      attempts++;
    }
    return null;
  };

  const goToIndex = (targetIndex: number, e: KeyEvent = { key: "ArrowRight" }) => {
    if (shouldSnub()) return;
    const idx = getAbleIndex(targetIndex, e);
    if (idx === null) return;
    resetActiveIndex(idx);
    onSelect?.(items[idx], e), updateDOM();
    if (virtual) {
      items[idx]?.scrollIntoView(scrollIntoView);
      container.setAttribute("aria-activedescendant", items[idx].id || "");
    } else items[idx]?.focus(focusOptions);
  };

  const updateDOM = () => {
    if (shouldSnub() || (!virtual && !roving) || !items.length) return;
    const hasDefaultTabbable = defaultTabbableIndex !== null && defaultTabbableIndex !== undefined,
      tabbableIndex = hasDefaultTabbable && !isItemDisabled(items[defaultTabbableIndex!]) ? defaultTabbableIndex! : getAbleIndex(0);
    for (let i = 0, len = items.length; i < len; i++) {
      const el = items[i],
        isActive = i === activeIndex;
      if (roving) el.setAttribute("tabindex", i === activeIndex || (activeIndex === -1 && i === tabbableIndex) ? baseTabIndex : "-1");
      else if (virtual && activeIndex > 0) el.setAttribute("tabindex", i > activeIndex ? baseTabIndex : "-1");
      else el.setAttribute("tabindex", baseTabIndex);
      if (virtual) el.setAttribute("aria-selected", String(isActive)), el.classList.toggle(activeClass, isActive);
    }
  };
  const resetActiveIndex = (index = -1) => ((activeIndex = index), updateDOM());

  const typeAhead = (key: string) => {
    if (shouldSnub() || !typeahead) return;
    buffer += key.toLowerCase();
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => (buffer = ""), resetMs);
    const start = activeIndex >= 0 ? activeIndex + 1 : 0;
    for (let i = 0; i < items.length; i++) {
      const idx = (start + i) % items.length,
        label = (items[idx].getAttribute("data-label") || items[idx].innerText || "").trim().toLowerCase();
      if (label.startsWith(buffer)) return goToIndex(idx);
    }
  };

  const simulateKey = (e: KeyEvent) => {
    const t = e.target as HTMLElement;
    if (shouldSnub() || getActiveEl(t?.ownerDocument)?.matches("option")) return;
    const { key } = e;
    if (!items.length) return;
    if (virtual && (key === " " || key === "Enter")) return items[activeIndex]?.click();
    if (t?.matches(DEFAULT_CONFIG.inputSelector) && !virtual) return;
    if (typeahead && key.length === 1 && /^[a-z0-9]$/i.test(key)) return typeAhead(key);
    if (!NAV_KEYS.includes(key)) return;
    if (!((e.currentTarget as HTMLElement)?.matches(DEFAULT_CONFIG.inputSelector) && gridX <= 1 && H_NAV_KEYS.includes(key))) e.preventDefault?.(), e.stopPropagation?.(); // virtual inputs can allow horizontal :)
    const currIndex = virtual ? activeIndex : items.indexOf(getActiveEl(t?.ownerDocument) as HTMLElement),
      targetIndex = getTargetIndex({ currIndex, gridX, gridY, vGridY, length: items.length, loop, rtl, key, ctrlKey: e.ctrlKey });
    goToIndex(targetIndex, e);
  };

  getItems(), updateDOM();

  const interactiveEls = !virtual ? [container] : [container.querySelector<HTMLElement>(inputSelector)];
  for (const el of interactiveEls) el?.addEventListener("keydown", simulateKey);

  const handleFocusOut = (e: FocusEvent) => {
    if (!container.contains(e.relatedTarget as Node)) return resetActiveIndex(), updateDOM(), onFocusOut?.(e);
    const among = items.includes(e.relatedTarget as HTMLElement);
    if (!among && (defaultTabbableIndex ?? -1) >= 0) return resetActiveIndex(), updateDOM();
    if (virtual) resetActiveIndex(), updateDOM();
  };
  container.addEventListener("focusout", handleFocusOut);

  const handleHover = (e: Event) => {
    if (!enabled || !focusOnHover) return;
    const el = e.currentTarget as HTMLElement,
      idx = items.indexOf(el);
    if (idx !== -1) goToIndex(idx);
  };
  for (const el of items) el.addEventListener("mouseenter", handleHover);

  const sync = () => {
    const oldEl = items[activeIndex];
    for (const el of items) el.removeEventListener("mouseenter", handleHover);
    getItems();
    for (const el of items) el.addEventListener("mouseenter", handleHover);
    calcGrid();
    const newEl = items[activeIndex];
    updateDOM();
    if (oldEl && newEl && oldEl === newEl) return;
    resetActiveIndex(), updateDOM();
  };

  const mutationObserver = new MutationObserver(sync);
  mutationObserver.observe(container, { childList: true, subtree: true });

  const setGrid = (g: Required<ArrowNavigationConfig>["grid"]) => {
    if (g.x !== undefined) gridX = g.x;
    if (g.y !== undefined) gridY = g.y;
    if (g.vY !== undefined) vGridY = g.vY;
  };
  let ancestor: HTMLElement | null = null;
  const resizeObserver = new ResizeObserver(() => calcGrid());
  const calcGrid = () => {
    setGrid(getGrid(items, !grid.x, !grid.y, !grid.vY));
    const next = items.length > 1 ? getCommonAncestor(items[0], items[1]) : container;
    if (next && next !== ancestor) ancestor && resizeObserver.unobserve(ancestor), (ancestor = next), resizeObserver.observe(ancestor);
  };
  setGrid(grid), calcGrid();

  const destroy = () => {
    for (const el of interactiveEls) el?.removeEventListener("keydown", simulateKey);
    container.removeEventListener("focusout", handleFocusOut);
    for (const el of items) el.removeEventListener("mouseenter", handleHover);
    mutationObserver.disconnect(), resizeObserver.disconnect();
    if (timeout) clearTimeout(timeout);
    t007._arrownavs!.delete(container);
  };

  const handle = { gridX: () => gridX, gridY: () => gridY, vGridY: () => vGridY, items: () => items, activeIndex: () => activeIndex, activeItem: () => items[activeIndex] ?? null, getAbleIndex, typeAhead, goToIndex, simulateKey, sync, destroy };
  return t007._arrownavs.set(container, handle), handle;
}

export const removeArrowNavigation = (container: HTMLElement) => t007._arrownavs?.get(container)?.destroy();

export const syncArrowNavigation = (container: HTMLElement) => t007._arrownavs?.get(container)?.sync();
