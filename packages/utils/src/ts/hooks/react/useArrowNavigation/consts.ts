import { NOOP } from "sia-reactor";
import type { Config } from "./types";

export const H_NAV_KEYS = ["ArrowRight", "ArrowLeft", "Home", "End"];
export const V_NAV_KEYS = ["ArrowUp", "ArrowDown", "PageDown", "PageUp"];
export const NAV_KEYS = [...H_NAV_KEYS, ...V_NAV_KEYS];

export const DEFAULT_CONFIG: Required<Config> = {
  enabled: null,
  selector: "[data-arrow-item]",
  focusOnHover: false,
  loop: true,
  virtual: false,
  typeahead: false,
  rovingTab: null,
  defaultTabbableIndex: null,
  baseTabIndex: "0",
  resetMs: 500,
  rtl: null,
  grid: {},
  activeClass: "focus-outlined",
  inputSelector: "input,textarea,[contenteditable]",
  focusOptions: { preventScroll: false },
  scrollIntoView: { block: "nearest", inline: "nearest" },
  onSelect: NOOP,
  onFocusOut: NOOP,
};
