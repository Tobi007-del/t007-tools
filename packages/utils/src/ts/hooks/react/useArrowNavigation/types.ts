export type KeyEvent = Partial<KeyboardEvent> & Pick<KeyboardEvent, "key">;

export type Config = {
  /** Enables or disables navigation logic. @default  `null`. */
  enabled?: boolean | null;
  /** CSS selector used to collect focusable nav items. @default  `"[data-arrow-item]"` */
  selector?: string;
  /** Whether hover should also move active selection. @default  `true`. */
  focusOnHover?: boolean;
  /** Whether directional movement wraps around edges. @default  `true`. */
  loop?: boolean;
  /** Enables virtual focus (aria-activedescendant) mode. @default  `false`. */
  virtual?: boolean;
  /** Enables alphanumeric type-ahead matching. @default  `false`. */
  typeahead?: boolean;
  /** Idle timeout before clearing type-ahead buffer (ms). @default  `500`. */
  resetMs?: number;
  /** Explicit RTL override; null auto-detects from computed style. @default  `null`. */
  rtl?: boolean | null;
  /** Enables roving tabindex when not in virtual mode. @default  `null`. */
  rovingTab?: boolean | null;
  /** Default tabbable index when no active item is selected. @default  `null`. */
  defaultTabbableIndex?: number | null;
  /** Base tabindex for non-active items, use `"-1"` to kill virtual list. @default  `"0"`. */
  baseTabIndex?: string;
  /** Class applied to active item in virtual mode. @default  `"focus-outlined"`. */
  activeClass?: string;
  /** Selector used for keyboard event source in virtual mode. @default  `"input[value],textarea,[contenteditable]"`. */
  inputSelector?: string;
  /** Scroll behavior options used when moving active item. @default  `{ block: "nearest", inline: "nearest" }`. */
  scrollIntoView?: ScrollIntoViewOptions;
  /** Focus behavior options used in non-virtual mode. @default  `{ preventScroll: false }`. */
  focusOptions?: FocusOptions;
  /** Explicit or computed grid dimensions for navigation math. @default  `{}`. */
  grid?: Partial<Record<"x" | "y" | "vY", number>>;
  /** Callback fired when an item becomes active/selected. */
  onSelect?: (el: HTMLElement, e: KeyEvent) => void;
  /** Callback fired when focus leaves the navigation container. */
  onFocusOut?: (e: FocusEvent) => void;
};

export type TargetIndexConfig = KeyEvent & {
  /** Current active or focused index. */
  currIndex: number;
  /** Total number of navigable items. */
  length: number;
  /** Horizontal grid span. */
  gridX: number;
  /** Vertical grid span. */
  gridY: number;
  /** Virtual vertical span for non-uniform layouts. */
  vGridY: number;
  /** Whether edge wrapping is enabled. */
  loop: boolean;
  /** Whether logical horizontal movement is RTL-aware. */
  rtl: boolean;
};
