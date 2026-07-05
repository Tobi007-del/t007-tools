import { NativeIconType } from "../types";

/** Built-in validity keys used to map helper messages and validation states. */
export const violationKeys = ["valueMissing", "typeMismatch", "patternMismatch", "stepMismatch", "tooShort", "tooLong", "rangeUnderflow", "rangeOverflow", "badInput", "customError"];

/** Browser date-like input types supported by input field helpers. */
export const dateTypes = ["date", "time", "datetime-local", "month"] as const;

/** Has native icon browser input types supported by input field helpers. */
export const nativeIconTypes = [...dateTypes];

/** Type guard for checking whether an input `type` is one of `NativeIconType`. */
export const isNativeIconType = (t: string): t is NativeIconType => (nativeIconTypes as readonly string[]).includes(t);
