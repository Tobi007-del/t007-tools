import { ArrowNavigationHandle } from "../hooks/vanilla/arrowNavigation";
import type { ScrollAssistHandle } from "../hooks/vanilla/scrollAssist";

declare global {
  interface T007Namespace {
    /** Symbol used to mark virtual resources that should not load a real asset. */
    VIRTUAL_RESOURCE: symbol;
    _resourceCache: Partial<Record<string, Promise<HTMLElement | void>>>;
    _ftrappers?: WeakMap<HTMLElement, () => void>;
    _outsiders?: WeakMap<HTMLElement, () => void>;
    _arrownavs?: WeakMap<HTMLElement, ArrowNavigationHandle>;
    _scrollers?: WeakMap<HTMLElement, ScrollAssistHandle>;
    _ftrappers_stacks?: WeakMap<EventTarget, HTMLElement[]>;
    _outsiders_stacks?: WeakMap<EventTarget, HTMLElement[]>;
    _scrollers_r_observer?: ResizeObserver;
    _scrollers_m_observer?: MutationObserver;
  }
  interface Window {
    /** Shared T007 namespace. */
    t007: T007Namespace;
    /** CDN js entrypoint for `@t007/toast`, assign a symbol if bundling, e.g. `VIRTUAL_RESOURCE` from `@t007/utils`. */
    T007_TOAST_JS_SRC?: string | symbol;
    /** CDN js entrypoint for `@t007/input`, assign a symbol if bundling, e.g. `VIRTUAL_RESOURCE` from `@t007/utils`. */
    T007_INPUT_JS_SRC?: string | symbol;
    /** CDN js entrypoint for `@t007/dialog`, assign a symbol if bundling, e.g. `VIRTUAL_RESOURCE` from `@t007/utils`. */
    T007_DIALOG_JS_SRC?: string | symbol;
    /** CDN stylesheet for `@t007/toast`, assign a symbol if bundling, e.g. `VIRTUAL_RESOURCE` from `@t007/utils`. */
    T007_TOAST_CSS_SRC?: string | symbol;
    /** CDN stylesheet for `@t007/input`, assign a symbol if bundling, e.g. `VIRTUAL_RESOURCE` from `@t007/utils`. */
    T007_INPUT_CSS_SRC?: string | symbol;
    /** CDN stylesheet for `@t007/dialog`, assign a symbol if bundling, e.g. `VIRTUAL_RESOURCE` from `@t007/utils`. */
    T007_DIALOG_CSS_SRC?: string | symbol;
  }
  /** Shared T007 namespace on the global object. */
  var t007: T007Namespace;
}

export {};
