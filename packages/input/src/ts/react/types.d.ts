import React from "react";
import { DateType } from "../utils/consts";

/** React change event alias used by input helpers. */
export type CE<T> = React.ChangeEvent<T>;
/** React input event alias used by input helpers. */
export type IE<T> = React.InputEvent<T>;
/** React change handler alias used by input helpers. */
export type CEH<T> = React.ChangeEventHandler<T>;
/** React input handler alias used by input helpers. */
export type IEH<T> = React.InputEventHandler<T>;

/** Base input element attributes used by non-select/non-textarea fields. */
export type InputAttributes = React.InputHTMLAttributes<HTMLInputElement>;
/** Select element attributes used by select fields. */
export type SelectAttributes = React.SelectHTMLAttributes<HTMLSelectElement>;
/** Textarea element attributes used by textarea fields. */
export type TextareaAttributes = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Union type for all input elements */
export type t007InputElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**  Define all possible `ValidityState` keys mapped to string messages */
export interface HelperTextMap extends Partial<Record<keyof ValidityState, string>> {
  /** Informational helper text shown when there is no validation violation. */
  info?: string;
}

export interface BaseProps {
  /** Wrap the field in its own container. */
  isWrapper?: boolean;
  /** Visible label text. */
  label?: React.ReactNode;
  /** Custom tokens for feature presets. */
  custom?: "confirm_password" | "password" | "onward_date" | "past_date";
  /** Class applied to the root field control. */
  fieldClassName?: string;
  /** Helper text shown under the field. */
  helperText?: HelperTextMap | boolean;
  /**  External resolver error text. When provided, the field is forced into error visuals even without native validity violations. */
  error?: string;
  /** Start icon rendered inside the field control. */
  // startIcon?: React.ReactNode;
  /** End icon rendered inside the field control. */
  endIcon?: React.ReactNode;
  // onFlagError?: (args: { violation: keyof ValidityState | null; helper: string }) => void;
  /** Whether to activate bleeding edge CSS styles that augment native styles for input types, e.g. file, color, select, e.t.c */
  bleedingEdge?: boolean;
}
export type PasswordInputProps = BaseProps & InputAttributes & PasswordInputAddon;
export type FileInputProps = BaseProps & InputAttributes & FileInputAddon;
export type CheckboxInputProps = BaseProps & InputAttributes & CheckboxInputAddon;
export type DateInputProps = BaseProps & InputAttributes & DateInputAddon;
export type GenericInputProps = BaseProps & InputAttributes & { type?: Exclude<React.HTMLInputTypeAttribute, "password" | "file" | "checkbox" | DateType> };
export type TextareaElementProps = BaseProps & TextareaAttributes & { type: "textarea" };
export type SelectElementProps = BaseProps & SelectAttributes & SelectElementAddon;

/** Union type for all input props, discriminated by the `type` property. */
export type InputProps = PasswordInputProps | FileInputProps | CheckboxInputProps | DateInputProps | GenericInputProps | TextareaElementProps | SelectElementProps;

export type WordsInputBaseProps = InputProps & {
  /** Maximum count of words allowed. */
  maxCount?: number;
  /** Phrase template with %left%, %max%, %count% */
  showCount?: string;
  /** Whether to send the original change event instead of the plain string value. */
  emitEventOnChange?: boolean;
};
export type WordsInputStrictModeProps = WordsInputBaseProps & {
  /** Whether to allow overflow of the word count. */
  allowOverflow?: false;
};
export type WordsInputLenientModeProps = WordsInputBaseProps & {
  /** Whether to allow overflow of the word count. */
  allowOverflow: true;
  /** Helper text shown when the word count is exceeded. */
  errorHelperText?: string;
};

/** Union type for all words input props. */
export type WordsInputProps = WordsInputStrictModeProps | WordsInputLenientModeProps;

// Addon types for field options

export interface PasswordInputAddon {
  type: "password";
  /** Show the password visibility toggler. */
  eyeToggler?: boolean;
  /** Enable the password strength meter. */
  passwordMeter?: boolean;
  passwordVisibleIcon?: React.ReactNode;
  passwordHiddenIcon?: React.ReactNode;
}
export interface FileInputAddon {
  type: "file";
  /** Maximum value length or count. */
  maxSize?: number;
  /** Minimum value length or count. */
  minSize?: number;
  /** Maximum total size allowed across the field value. */
  maxTotalSize?: number;
  /** Minimum total size allowed across the field value. */
  minTotalSize?: number;
}
export interface CheckboxInputAddon {
  type: "checkbox";
  /** Whether the checkbox is a multi-state checkbox. */
  indeterminate?: boolean;
}
export interface DateInputAddon {
  type: DateType;
  /** Native icon rendered by the browser control. */
  nativeIcon?: React.ReactNode;
}
export interface SelectElementAddon {
  type: "select";
  /** Options used by select-like fields. */
  options?: string[] | readonly string[] | Array<{ value: string; option: string }>;
}
