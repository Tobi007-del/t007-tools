import { VIRTUAL_RESOURCE } from "./core/dom";

// Types
export type * from "./types/global.d.ts";
export type * from "./types/str.d.ts";
// Core
export { NIL, NOOP } from "sia-reactor";
export * from "./core/obj";
export * from "./core/num";
export * from "./core/str";
export * from "./core/fn";
export * from "./core/dom";
export * from "./core/keys";
export * from "./core/file";
// Mixins
export * from "./mixins/methd";

if ("undefined" !== typeof window) {
  (window.t007 ??= {} as any).VIRTUAL_RESOURCE = VIRTUAL_RESOURCE;
  window.T007_TOAST_JS_SRC ??= `https://cdn.jsdelivr.net/npm/@t007/toast@latest`;
  window.T007_INPUT_JS_SRC ??= `https://cdn.jsdelivr.net/npm/@t007/input@latest`;
  window.T007_DIALOG_JS_SRC ??= `https://cdn.jsdelivr.net/npm/@t007/dialog@latest`;
  window.T007_TOAST_CSS_SRC ??= `https://cdn.jsdelivr.net/npm/@t007/toast@latest/dist/index.min.css`;
  window.T007_INPUT_CSS_SRC ??= `https://cdn.jsdelivr.net/npm/@t007/input@latest/dist/index.min.css`;
  window.T007_DIALOG_CSS_SRC ??= `https://cdn.jsdelivr.net/npm/@t007/dialog@latest/dist/index.min.css`;
}

// For purging CDNS
// https://cdn.jsdelivr.net/npm/@t007/toast@latest, https://cdn.jsdelivr.net/npm/@t007/input@latest, https://cdn.jsdelivr.net/npm/@t007/dialog@latest, https://cdn.jsdelivr.net/npm/@t007/toast@latest/dist/index.min.css, https://cdn.jsdelivr.net/npm/@t007/input@latest/dist/index.min.css, https://cdn.jsdelivr.net/npm/@t007/dialog@latest/dist/index.min.css