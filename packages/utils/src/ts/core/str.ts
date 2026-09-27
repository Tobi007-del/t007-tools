import { isStr } from "..";
import { TitleCase, CamelCase, NoCamelCase } from "../types/str";

// Generation

/** Create a short unique string with an optional prefix.
 * @param prefix Prefix added to the generated id.
 * @returns A browser-safe unique id string.
 */
export function uid(prefix = ""): string {
  return prefix + Date.now().toString(36) + "_" + performance.now().toString(36).replace(".", "") + "_" + Math.random().toString(36).slice(2);
}

// Casing

/** Capitalize the first letter of a string, leaving the rest unchanged.
 * @param word The string to capitalize.
 * @returns The input string with the first letter capitalized.
 */
export function capitalize<T extends string>(word: T = "" as T): TitleCase<T> {
  return word.replace(/^(\s*)([a-z])/i, (_, s, l) => s + l.toUpperCase()) as TitleCase<T>;
}

/** Convert a string to camelCase by removing separators and capitalizing subsequent words.
 * @param str The input string to convert.
 * @param options.source A regex or string defining word separators. @default  whitespace, underscores, and hyphens (`[\s_-]+`).
 * @param options.preserveInnerCase If true, preserves the original casing of letters; if false, converts the entire string to lowercase before processing. @default  `true`.
 * @param options.upperFirst If true, capitalizes the first letter of the resulting string (PascalCase); if false, lowercases the first letter (camelCase). @default  `false`.
 * @returns The camelCase version of the input string.
 */
export function camelize<T extends string>(str: T = "" as T, { source } = /[\s_-]+/, { preserveInnerCase: pIC = true, upperFirst: uF = false } = {}): CamelCase<T> {
  return (pIC ? str : str.toLowerCase()).replace(new RegExp(source + "(\\w)", "g"), (_, c) => c.toUpperCase()).replace(/^\w/, (c) => c[uF ? "toUpperCase" : "toLowerCase"]()) as CamelCase<T>;
}

/** Convert a camelCase or PascalCase string to a separator-based format (e.g. "helloWorld" to "hello-world").
 * @param str The camelCase or PascalCase string to convert.
 * @param separator The string to insert between words. @default " ".
 * @returns The uncamelized version of the input string with separators.
 * @example
 * uncamelize("helloWorld") // "hello-world"
 * uncamelize("HelloWorld", "_") // "hello_world"
 */
export function uncamelize<T extends string, S extends string = " ">(str: T, separator: S = " " as S): NoCamelCase<T, S> {
  return str.replace(/(?<=[a-z\d])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g, separator).toLowerCase() as NoCamelCase<T, S>;
}

// Converters

/** Convert a rem value to pixels based on the font size of a given element.
 * @param rem The rem value to convert.
 * @param el The element to use for font size reference. @default  the root element.
 * @returns The equivalent pixel value.
 */
export function remToPx(rem: number, el: HTMLElement = document.documentElement): number {
  return rem * parseFloat(getComputedStyle(el).fontSize);
}

/** Convert a pixel value to rem based on the font size of a given element.
 * @param px The pixel value to convert.
 * @param el The element to use for font size reference. @default  the root element.
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
 * @param el The element to use for rem reference if needed. @default  the root element.
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
  if (url1 === url2) return true; // Quick check for identical strings or references
  if (!isStr(url1) || !isStr(url2) || !url1 || !url2) return false;
  return cleanURL(url1) === cleanURL(url2);
}
