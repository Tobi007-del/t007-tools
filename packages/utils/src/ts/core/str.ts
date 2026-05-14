import { isStr } from "..";

// Generation

/** Create a short unique string with an optional prefix.
 * @param prefix Prefix added to the generated id.
 * @returns A browser-safe unique id string.
 */
export function uid(prefix = ""): string {
  return prefix + Date.now().toString(36) + "_" + performance.now().toString(36).replace(".", "") + "_" + Math.random().toString(36).slice(2);
}

// Converters

/** Convert a rem value to pixels based on the font size of a given element.
 * @param rem The rem value to convert.
 * @param el The element to use for font size reference. Defaults to the root element.
 * @returns The equivalent pixel value.
 */
export function remToPx(rem: number, el: HTMLElement = document.documentElement): number {
  return rem * parseFloat(getComputedStyle(el).fontSize);
}

/** Convert a pixel value to rem based on the font size of a given element.
 * @param px The pixel value to convert.
 * @param el The element to use for font size reference. Defaults to the root element.
 * @returns The equivalent rem value.
 */
export function pxToRem(px: number, el: HTMLElement = document.documentElement): number {
  return px / parseFloat(getComputedStyle(el).fontSize);
}

// Parsers

/** Parse a CSS time value (e.g. "200ms", "0.5s") into milliseconds.
 * @param time The CSS time string to parse.
 * @returns The equivalent time in milliseconds.
 */
export function parseCSSTime(time: any): number {
  return time?.endsWith?.("ms") ? parseFloat(time) : parseFloat(time) * 1000;
}

/** Parse a CSS size value (i.e. "16px" or "1.5rem") into pixels.
 * @param size The CSS size string to parse.
 * @param el The element to use for rem reference if needed. Defaults to the root element.
 * @returns The equivalent value in pixels.
 */
export function parseCSSSize(size: any, el?: HTMLElement): number {
  return size?.endsWith?.("px") ? parseFloat(size) : remToPx(parseFloat(size), el);
}

// Checkers

/** Normalize a URL by decoding it and removing query parameters and hash fragments.
 * @param url The URL string to clean.
 * @returns A normalized URL string for comparison.
 */
export function cleanURL(url: string): string {
  try {
    const u = new URL(url, window.location.href);
    return decodeURIComponent(u.origin + u.pathname);
  } catch {
    return url.replace(/\\/g, "/").split("?")[0].trim();
  }
}

/** Compare two URLs after normalizing origin, pathname, and separators.
 * @param url1 First URL or path.
 * @param url2 Second URL or path.
 * @returns True when both references point to the same resource.
 */
export function isSameURL(url1: unknown, url2: unknown): boolean {
  if (!isStr(url1) || !isStr(url2) || !url1 || !url2) return false;
  return cleanURL(url1) === cleanURL(url2);
}
