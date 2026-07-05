import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import type { Config, KeyEvent } from "./types";
import { getTargetIndex, getGrid, getCommonAncestor } from "./utils";
import { DEFAULT_CONFIG, NAV_KEYS, H_NAV_KEYS } from "./consts";
import { getActiveEl } from "../../../core/dom";

/** A React hook for managing robustarrow-key roving focus navigation. */
export function useArrowNavigation(containerRef: React.RefObject<HTMLElement>, config: Config = {}) {
  const { enabled: isEnabled, selector, focusOnHover, loop, virtual, typeahead, rovingTab, resetMs, activeClass, inputSelector, defaultTabbableIndex, baseTabIndex, grid, rtl: isRtl, focusOptions, scrollIntoView, onSelect, onFocusOut } = { ...DEFAULT_CONFIG, ...config },
    [gridX, setGridX] = useState(grid.x || 1),
    [gridY, setGridY] = useState(grid.y || 1),
    [vGridY, setVGridY] = useState(grid.vY || 1),
    [activeIndex, setActiveIndex] = useState(-1),
    buffer = useRef(""),
    timeout = useRef<ReturnType<typeof setTimeout> | null>(null),
    itemsRef = useRef<HTMLElement[]>([]),
    enabled = isEnabled ?? virtual,
    roving = rovingTab ?? !virtual,
    rtl = useMemo(() => isRtl ?? ("undefined" === typeof document ? false : getComputedStyle(containerRef.current || document.body).direction === "rtl"), [containerRef, isRtl]),
    mutationObserverRef = useRef<MutationObserver | null>(null),
    shouldSnub = useCallback(() => !enabled || !containerRef.current, [enabled, containerRef]),
    isItemDisabled = useCallback((el: HTMLElement) => !el || el.matches('[disabled],[aria-disabled="true"],[inert],:disabled'), []),
    getItems = useCallback(() => (itemsRef.current = Array.from(containerRef.current?.querySelectorAll<HTMLElement>(selector) || [])), [containerRef, selector]);

  const getAbleIndex = useCallback(
    (targetIndex: number, e: KeyEvent = { key: "ArrowRight", ctrlKey: false }) => {
      if (shouldSnub()) return;
      const all = itemsRef.current;
      if (!all.length) return null;
      let index = targetIndex;
      let attempts = 0;
      while (attempts < all.length) {
        if (!isItemDisabled(all[index])) return index;
        index = getTargetIndex({ key: e.key, currIndex: index, gridX, gridY, vGridY, length: all.length, loop, ctrlKey: e.ctrlKey, rtl });
        attempts++;
      }
      return null;
    },
    [shouldSnub, isItemDisabled, gridX, gridY, vGridY, loop, rtl]
  );

  const goToIndex = useCallback(
    (targetIndex: number, e: KeyEvent = { key: "ArrowRight" }) => {
      if (shouldSnub()) return;
      const all = itemsRef.current,
        index = getAbleIndex(targetIndex, e)!;
      if (index === null) return;
      setActiveIndex(index), onSelect(all[index], e);
      if (virtual) {
        all[index]?.scrollIntoView(scrollIntoView);
        containerRef.current?.setAttribute("aria-activedescendant", all[index].id || "");
      } else all[index]?.focus(focusOptions);
    },
    [shouldSnub, virtual, onSelect, scrollIntoView, focusOptions, getAbleIndex, containerRef]
  );

  const updateDOM = useCallback(() => {
    if (shouldSnub() || (!virtual && !roving)) return;
    const all = itemsRef.current;
    if (!all.length) return;
    const tabbableIndex = defaultTabbableIndex !== null && !isItemDisabled(all[defaultTabbableIndex]) ? defaultTabbableIndex : getAbleIndex(0);
    for (let i = 0, len = all.length; i < len; i++) {
      const el = all[i],
        isActive = i === activeIndex;
      if (roving) el.setAttribute("tabindex", i === activeIndex || (activeIndex === -1 && i === tabbableIndex) ? baseTabIndex : "-1");
      else if (virtual && activeIndex > 0) el.setAttribute("tabindex", i > activeIndex ? baseTabIndex : "-1");
      else el.setAttribute("tabindex", baseTabIndex);
      if (virtual) el.setAttribute("aria-selected", String(isActive)), el.classList.toggle(activeClass, isActive);
    }
  }, [shouldSnub, activeIndex, virtual, activeClass, roving, defaultTabbableIndex, getAbleIndex, isItemDisabled, baseTabIndex]);

  const typeAhead = useCallback(
    (key: string) => {
      if (shouldSnub() || !typeahead) return;
      const all = itemsRef.current;
      buffer.current += key.toLowerCase();
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => (buffer.current = ""), resetMs);
      const start = activeIndex >= 0 ? activeIndex + 1 : 0;
      for (let i = 0; i < all.length; i++) {
        const idx = (start + i) % all.length,
          label = (all[idx].getAttribute("data-label") || all[idx].innerText || "").trim().toLowerCase();
        if (label.startsWith(buffer.current)) return goToIndex(idx);
      }
    },
    [shouldSnub, typeahead, resetMs, goToIndex, activeIndex]
  );

  const simulateKey = useCallback(
    (e: KeyEvent) => {
      const t = e.target as HTMLElement;
      if (shouldSnub() || getActiveEl(t?.ownerDocument)?.matches("option")) return;
      const all = itemsRef.current,
        { key } = e;
      if (!all.length) return;
      if (virtual && (key === " " || key === "Enter")) return all[activeIndex]?.click();
      if (t?.matches(DEFAULT_CONFIG.inputSelector) && !virtual) return;
      if (typeahead && key.length === 1 && /^[a-z0-9]$/i.test(key)) return typeAhead(key);
      if (!NAV_KEYS.includes(key)) return;
      if (!((e.currentTarget as HTMLElement)?.matches(DEFAULT_CONFIG.inputSelector) && gridX <= 1 && H_NAV_KEYS.includes(key))) e.preventDefault?.(), e.stopPropagation?.(); // virtual inputs can allow horizontal :)
      const currIndex = virtual ? activeIndex : all.indexOf(getActiveEl(t?.ownerDocument) as HTMLElement),
        targetIndex = getTargetIndex({ currIndex, gridX, gridY, vGridY, length: all.length, loop, rtl, key, ctrlKey: e.ctrlKey });
      goToIndex(targetIndex, e);
    },
    [shouldSnub, virtual, activeIndex, gridX, gridY, vGridY, loop, rtl, goToIndex, typeahead, typeAhead]
  );

  const latest = useRef({ getItems, updateDOM, activeIndex, calcGrid: () => {} });
  useEffect(() => void (latest.current = { ...latest.current, getItems, updateDOM, activeIndex }), [getItems, updateDOM, activeIndex]);

  useEffect(() => void getItems(), [getItems, enabled]);

  useEffect(() => void (!enabled && setActiveIndex(-1)), [enabled]);

  useEffect(() => updateDOM(), [activeIndex, updateDOM]);

  useEffect(() => {
    if (shouldSnub()) return;
    const container = containerRef.current!,
      handleKeyDown = simulateKey,
      interactiveEls = !virtual ? [container] : [container.querySelector<HTMLElement>(inputSelector)];
    for (const el of interactiveEls) el?.addEventListener("keydown", handleKeyDown);
    return () => {
      for (const el of interactiveEls) el?.removeEventListener("keydown", handleKeyDown);
    };
  }, [shouldSnub, containerRef, virtual, inputSelector, simulateKey]);

  useEffect(() => {
    if (shouldSnub()) return;
    const container = containerRef.current!;
    const handleFocusOut = (e: FocusEvent) => {
      if (!container.contains(e.relatedTarget as Node)) return setActiveIndex(-1), onFocusOut(e);
      const among = itemsRef.current.includes(e.relatedTarget as HTMLElement);
      if (!among && (defaultTabbableIndex ?? -1) >= 0) return setActiveIndex(-1);
      if (virtual) setActiveIndex(-1);
    };
    container.addEventListener("focusout", handleFocusOut);
    return () => container.removeEventListener("focusout", handleFocusOut);
  }, [shouldSnub, containerRef, onFocusOut, defaultTabbableIndex, virtual]);

  useEffect(() => {
    if (!enabled || !focusOnHover) return;
    const all = itemsRef.current;
    const handleHover = (e: Event) => {
      if (!focusOnHover) return;
      const el = e.currentTarget as HTMLElement,
        i = itemsRef.current?.indexOf(el);
      if (i !== -1) goToIndex(i);
    };
    for (const el of all) el.addEventListener("mouseenter", handleHover);
    return () => {
      for (const el of all) el.removeEventListener("mouseenter", handleHover);
    };
  }, [enabled, focusOnHover, goToIndex]);

  const sync = useCallback(() => {
    const { getItems, updateDOM, activeIndex } = latest.current;
    const oldEl = itemsRef.current[activeIndex];
    getItems();
    const newEl = itemsRef.current[activeIndex];
    updateDOM();
    if (oldEl && newEl && oldEl === newEl) return;
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (shouldSnub()) return;
    const observer = (mutationObserverRef.current = new MutationObserver(sync));
    observer.observe(containerRef.current!, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [shouldSnub, containerRef, sync]);

  useEffect(() => {
    if (shouldSnub()) return;
    const setGrid = (g: Required<Config>["grid"]) => {
      if (g.x) setGridX(g.x);
      if (g.y) setGridY(g.y);
      if (g.vY) setVGridY(g.vY);
    };
    setGrid(grid);
    if (grid.x && grid.y && grid.vY) return;
    let ancestor: HTMLElement | null = null;
    const resizeObserver = new ResizeObserver(() => calcGrid());
    const calcGrid = () => {
      setGrid(getGrid(itemsRef.current, !grid.x, !grid.y, !grid.vY));
      const next = itemsRef.current.length > 1 ? getCommonAncestor(itemsRef.current[0], itemsRef.current[1]) : containerRef.current;
      if (next && next !== ancestor) ancestor && resizeObserver.unobserve(ancestor), (ancestor = next), resizeObserver.observe(ancestor);
    };
    latest.current.calcGrid = calcGrid;
    calcGrid();
    return () => resizeObserver.disconnect();
  }, [shouldSnub, containerRef, grid]);

  useEffect(() => void (timeout.current && clearTimeout(timeout.current)), []);

  return { gridX, gridY, vGridY, activeIndex, activeItem: useCallback(() => itemsRef.current[activeIndex] ?? null, [activeIndex]), items: useCallback(() => itemsRef.current, []), getAbleIndex, typeAhead, goToIndex, simulateKey, sync };
}
