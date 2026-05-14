import "@t007/utils";
import { BaseProps, CheckboxInputAddon, DateInputAddon, FileInputAddon, SelectElementAddon } from "../react";

interface BaseOptions extends Omit<BaseProps, "error"> {
  /** Visible label text. */
  label?: string;
  /** Optional child element rendered inside the field wrapper. */
  children?: HTMLElement;
}
type InputAttrs = Partial<Omit<HTMLInputElement, "type" | "children">>;
type SelectAttrs = Partial<Omit<HTMLSelectElement, "type" | "children">>;
type TextareaAttrs = Partial<Omit<HTMLTextAreaElement, "type" | "children">>;
type PasswordFieldOptions = BaseOptions & InputAttrs & Omit<FileInputAddon, "passwordVisibleIcon" | "passwordHiddenIcon"> & { passwordVisibleIcon?: HTMLElement; passwordHiddenIcon?: HTMLElement };
type FileFieldOptions = BaseOptions & InputAttrs & FileInputAddon;
type CheckboxFieldOptions = BaseOptions & InputAttrs & CheckboxInputAddon;
type DateFieldOptions = BaseOptions & InputAttrs & DateInputAddon;
type GenericFieldOptions = BaseOptions & InputAttrs & { type?: Exclude<HTMLInputElement["type"], "password" | "file" | "checkbox" | NativeType> };
type TextareaFieldOptions = BaseOptions & TextareaAttrs & { type: "textarea" };
type SelectFieldOptions = BaseOptions & SelectAttrs & SelectElementAddon;
/** Configuration accepted by the field() helper. */
export type FieldOptions = PasswordFieldOptions | FileFieldOptions | CheckboxFieldOptions | DateFieldOptions | GenericFieldOptions | TextareaFieldOptions | SelectFieldOptions;

/** Form-level manager used to build and validate inputs. */
export interface FormManager {
  /** Live collection of managed forms. */
  forms: HTMLCollectionOf<HTMLFormElement>;
  /** Current validation violation keys. */
  violationKeys: string[];
  /** Initialize DOM observers and field bindings. */
  init(): void;
  /** Observe the DOM for field changes. */
  observeDOMForFields(): void;
  /** Normalize and validate uploaded files.
   * @param files Files selected by the user.
   * @param opts Validation options.
   * @returns Violation information and user-facing message.
   */
  getFilesHelper(files: FileList | File[], opts: any): { violation: string | null; message: string };
  /** Format a file size for display.
   * @param size Size in bytes.
   * @param decimals Decimal precision.
   * @param base Size base, usually 1000 or 1024.
   * @returns Human-readable size string.
   */
  formatSize(size: number, decimals?: number, base?: number): string;
  /** Toggle an input between password and text mode.
   * @param input Target password input.
   */
  togglePasswordType(input: HTMLInputElement): void;
  /** Toggle the filled state on a supported field.
   * @param input Supported form control.
   */
  toggleFilled(input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): void;
  /** Attach a fallback helper node.
   * @param field Field wrapper element.
   */
  setFallbackHelper(field: HTMLDivElement): void;
  /** Wire listeners onto a managed field.
   * @param field Field wrapper element.
   */
  setFieldListeners(field: HTMLDivElement): void;
  /** Normalize field markup before use.
   * @param field Field wrapper element.
   */
  setUpField(field: HTMLDivElement): void;
  /** Create a field element from options.
   * @param options Field configuration.
   * @returns Created field element.
   */
  field(options: FieldOptions): HTMLDivElement;
  /** Validate a form and attach the proper hooks.
   * @param form Form element to validate.
   */
  handleFormValidation(form: HTMLFormElement): void;
}

// BUNDLE EXPORTS & GLOBAL DECLARATIONS

/** Shared field manager singleton exposed by the bundle. */
export const formManager: FormManager;
/** Create a field element from field options.
 * @param options Field configuration.
 * @returns Created field element.
 */
export const field: FormManager["field"];
/** Attach validation hooks to a form element.
 * @param form Form element to validate.
 */
export const handleFormValidation: FormManager["handleFormValidation"];

declare global {
  interface T007Namespace {
    /** Form manager singleton attached by the bundle. */
    FM: FormManager;
    /** Public form manager singleton. */
    formManager: FormManager;
    /** Public field factory. */
    field?: FormManager["field"];
    /** Public form validation helper. */
    handleFormValidation?: FormManager["handleFormValidation"];
  }
  interface Window {
    field?: T007Namespace["field"];
    handleFormValidation?: T007Namespace["handleFormValidation"];
  }
  interface HTMLFormElement {
    /** Vanilla-only Client-side submit hook. Use instead of `onsubmit` to escape browser behavior. */
    onSubmit?(e: Event): void;
    /** Vanilla-only Check validation on the client. Reference to internals for manual use. */
    validateOnClient?(): boolean;
    /** Vanilla-only Check validation on the server. Assign custom server-side validation logic. */
    validateOnServer?(): Promise<boolean>;
    /** Vanilla-only Toggle the global error state. Reference to internals for manual use. */
    toggleGlobalError?(bool: boolean): void;
  }
}
