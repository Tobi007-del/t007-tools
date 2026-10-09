import { clamp } from "../../../core/num";
import type { Config, TargetIndexConfig } from "./types";

export const getTargetIndex = ({ key, currIndex, length, gridX, gridY, vGridY, loop, ctrlKey = false, rtl }: TargetIndexConfig): number => {
  const rowStart = currIndex - (currIndex % gridX),
    rowEnd = Math.min(rowStart + gridX - 1, length - 1),
    colStart = currIndex % gridX,
    colEnd = Math.min(colStart + gridX * (gridY - 1), length - 1),
    canX = gridX > 1,
    canY = gridY > 1,
    horizontalMove = rtl ? { ArrowRight: canX ? -1 : 0, ArrowLeft: canX ? 1 : 0 } : { ArrowRight: canX ? 1 : 0, ArrowLeft: canX ? -1 : 0 },
    move = { ...horizontalMove, ArrowDown: canY ? gridX : 0, ArrowUp: canY ? -gridX : 0, Home: ctrlKey ? 0 : rowStart, End: ctrlKey ? length - 1 : rowEnd, PageDown: (vGridY - 1) * gridX, PageUp: -(vGridY - 1) * gridX }[key] ?? 0;

  let targetIndex = key === "Home" || key === "End" ? move : currIndex + move;
  if (key === "ArrowDown") {
    if (!loop && targetIndex >= length) targetIndex -= move; // if (targetIndex < gridX) targetIndex = 0; // ^ lead to unexpected behaviour
  } else if (key === "ArrowUp") {
    if (!loop && targetIndex < 0) targetIndex += Math.abs(move);
  } else if (key === "PageDown") {
    if (!loop && targetIndex >= length) targetIndex = colEnd;
  } else if (key === "PageUp") {
    if (!loop && targetIndex < 0) targetIndex = colStart;
  }

  return loop ? (targetIndex + length) % length : clamp(0, targetIndex, length - 1);
};

export const getCommonAncestor = (first?: HTMLElement | null, second?: HTMLElement | null) => {
  if (!first) return null;
  if (!second) return first.parentElement;
  const ancestors = new Set<HTMLElement>();
  let current: HTMLElement | null = first;
  while (current) ancestors.add(current), (current = current.parentElement);
  current = second;
  while (current) {
    if (ancestors.has(current)) return current;
    current = current.parentElement;
  }
  return null;
};

export const getGrid = (all: HTMLElement[], x = true, y = true, vY = true) => {
  const len = all.length,
    grid: Config["grid"] = {};
  if (!len || (!x && !y && !vY)) return grid;
  let cols = all.findIndex((el) => el.offsetTop !== all[0].offsetTop);
  cols = cols > 0 ? cols : len;
  if (x) grid.x = cols;
  let rows = Math.ceil(len / cols);
  if (y) grid.y = rows;
  if (vY) {
    const itemHeight = all[0].offsetHeight ?? 0,
      containerHeight = getCommonAncestor(all[0], all[1])?.clientHeight ?? 0;
    rows = clamp(1, Math.floor(containerHeight / itemHeight), rows) || rows;
    grid.vY = rows;
  }
  return grid;
};
