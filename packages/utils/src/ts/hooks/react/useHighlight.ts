import { useMemo } from "react";

export interface HighlightOptions {
  /** Whether to trim individual query strings. @default  `true`. */
  trimQuery?: boolean;
  /** Whether to match whole words only. @default  `false`. */
  wholeWord?: boolean;
}

/** React hook to process a text string and identify parts that match a given query, returning an array of text chunks with information on whether they match the query.
 * @param text The text to be processed.
 * @param query The string or array of strings to match and highlight within the text.
 * @param ignoreCase Whether the matching should be case-insensitive.
 * @param options Additional options for the highlighting behavior.
 * @returns An array of text chunks with highlight information.
 */
export function useHighlight(text: string, query: string | string[], ignoreCase = true, options?: HighlightOptions) {
  const { trimQuery = true, wholeWord = false } = options ?? {};

  return useMemo(() => {
    if (!query) return [{ text, match: false }];
    const queries = (Array.isArray(query) ? query : [query])
      .sort((a, b) => b.length - a.length)
      .map((q) => (trimQuery ? q.trim() : q)?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .filter(Boolean);
    if (!queries.length) return [{ text, match: false }];

    const boundary = wholeWord ? "\\b" : "",
      regex = new RegExp(`(${queries.map((q) => boundary + q + boundary).join("|")})`, ignoreCase ? "gi" : "g"),
      parts = text.split(regex);

    return parts.map((part) => ({ text: part, match: !!part.match(regex) }));
  }, [text, query, ignoreCase, trimQuery, wholeWord]);
}
