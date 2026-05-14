import "@t007/utils";

/** Toast severity level. */
export type ToastType = "info" | "success" | "error" | "warning";
/** Screen anchor for toast placement. */
export type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right" | "center-left" | "center-center" | "center-right";
/** Motion preset used when a toast enters or leaves the screen. */
export type ToastAnimation = "fade" | "zoom" | "slide" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | boolean;
/** Allowed drag directions for dismiss gestures. `|` combines axes where it can be `a` or `b` and can change anytime while `||` does not change after a pick is determined. */
export type ToastDragDir = "x" | "y" | "xy" | "x|y" | "x||y" | "x+" | "x-" | "y+" | "y-" | "xy+" | "xy-" | "x|y+" | "x|y-" | "x||y+" | "x||y-";

/** Configuration object for creating and updating a toast. */
export interface ToastOptions {
  /** Explicit toast id. Reusing an active id updates that toast in place (upsert-style), preserving position/animation state. */
  id?: string;
  /** Prefix used when ids are generated automatically. */
  groupId?: string;
  /** Delay before the toast is initialized. */
  delay?: number | null;
  /** Container element used to host toast stacks. */
  rootElement?: HTMLElement;
  /** Text rendered as the toast body. */
  render?: string | (() => string);
  /** Rich HTML rendered as the toast body. */
  bodyHTML?: string | (() => string);
  /** Severity variant for default styling and icons. */
  type?: ToastType;
  /** Custom icon HTML or a boolean that selects the default icon. */
  icon?: string | boolean;
  /** Optional image url shown beside the message. */
  image?: string | false;
  /** Auto-close delay in milliseconds, or false to keep open. */
  autoClose?: number | boolean;
  /** Where the toast stack should appear. */
  position?: ToastPosition;
  /** Loading state used by promise flows and deferred updates. */
  isLoading?: boolean | string;
  /** Show or hide the close button. */
  closeButton?: boolean;
  /** Close the toast when the body is clicked. */
  closeOnClick?: boolean;
  /** Hide the progress bar. */
  hideProgressBar?: boolean;
  /** Manual progress value (0-1) used by the progress bar when set directly. */
  nprogress?: number;
  /** Pause auto-close while the pointer is over the toast. */
  pauseOnHover?: boolean;
  /** Pause auto-close while the document is hidden. */
  pauseOnFocusLoss?: boolean;
  /** Enable drag-to-dismiss gestures and optionally limit pointer types. */
  dragToClose?: boolean | "mouse" | "pen" | "touch";
  /** Percentage threshold needed to dismiss by drag. */
  dragToClosePercent?: number | { x?: number; y?: number };
  /** Axis or direction filter used by the drag gesture system. */
  dragToCloseDir?: ToastDragDir;
  /** When true and `tag` is provided, any other active toast with the same tag is removed before this toast renders. */
  renotify?: boolean;
  /** Arbitrary tag used for grouping and renotify matching. Does not update by itself; pair with `renotify` to enforce one-toast-per-tag behavior. */
  tag?: string | number;
  /** Trigger vibration when the toast appears. */
  vibrate?: boolean | number[];
  /** Entry/exit animation preset. */
  animation?: ToastAnimation;
  /** Put new toasts at the front of the stack. */
  newestOnTop?: boolean;
  /** Maximum number of toasts allowed in a container. */
  limit?: number;
  /** Action buttons rendered under the message body. */
  actions?: Record<string, (e: MouseEvent, toast: ToastInstance) => void> | false;
  /** Callback fired when the toast closes. */
  onClose?: (timeElapsed?: boolean | false) => void;
  /** Callback fired as the toast auto-close timer advances. */
  onTimeUpdate?: (timeVisible: number) => void;
  [key: string]: any; // To allow arbitrary overrides internally if needed
}

/** Live toast instance returned by the runtime. */
export interface ToastInstance {
  /** Current option bag applied to the instance. */
  opts: ToastOptions;
  /** Pending timeouts waiting to apply queued updates. */
  queue: number[];
  /** Whether the toast is active and in the DOM. */
  inactive: boolean;
  /** Root DOM node for the toast.
   * Runtime datasets written here: `data-group-id`, `data-animation`, `data-tag`, `data-drag-to-close`.
   * Related runtime datasets: container `data-position`, body text `data-render`, icon `data-icon`, image `data-loaded`.
   */
  toastElement: HTMLElement;
  /** Build the DOM node and setup its lifecycle. */
  activate(): void;
  /** Apply new options and return the toast id.
   * @param options Options to apply.
   * @returns Toast id.
   */
  update(options: ToastOptions): string;
  /** Resume auto-close progress. */
  play(): void;
  /** Pause auto-close progress. */
  pause(): void;
  /** Remove the toast from view.
   * @param manner Removal mode.
   * @param timeElapsed Whether the auto-close timer already elapsed.
   */
  remove(manner?: "smooth" | "instant", timeElapsed?: boolean): void;
}

/** Promise state configuration used by toast.promise. */
export interface ToastPromiseState<T = any> extends Omit<ToastOptions, "render" | "bodyHTML"> {
  /** Render text for the promise state. */
  render?: string | ((response: T) => string);
  /** Render HTML for the promise state. */
  bodyHTML?: string | ((response: T) => string);
}
/** Configuration object accepted by toast.promise. */
export interface ToastPromiseConfig<T = any> {
  /** Pending-state text or options. */
  pending?: string | ToastOptions;
  /** Success-state text or options. */
  success?: string | ToastPromiseState<T>;
  /** Error-state text or options. */
  error?: string | ToastPromiseState<any>;
}

/** Public toast API exposed to consumers. */
export interface Toast {
  /** Create a default toast.
   * @param render Body text for the toast.
   * @param options Toast configuration.
   * @returns Toast `id`.
   */
  (render?: string, options?: ToastOptions): string;
  /** Check if a toast is currently active with the id or any toast if no `id` provided.
   * @param id Toast `id`.
   * @returns True if the toast is visibly active, i.e, not delayed; false otherwise.
   */
  isActive(id: string): boolean;
  /** Update an existing toast by `id`.
   * @param id Toast `id`.
   * @param options Options to apply.
   * @returns Updated toast id or false when no toast was found.
   */
  update(id: string, options: ToastOptions): string | false;
  /** Show an info toast.
   * @param renderOrId Body text or toast id.
   * @param options Toast configuration.
   * @returns Toast `id`.
   */
  info(renderOrId?: string, options?: ToastOptions): string;
  /** Show a success toast.
   * @param renderOrId Body text or toast id.
   * @param options Toast configuration.
   * @returns Toast `id`.
   */
  success(renderOrId?: string, options?: ToastOptions): string;
  /** Show a warning toast.
   * @param renderOrId Body text or toast id.
   * @param options Toast configuration.
   * @returns Toast `id`.
   */
  warn(renderOrId?: string, options?: ToastOptions): string;
  /** Show an error toast.
   * @param renderOrId Body text or toast id.
   * @param options Toast configuration.
   * @returns Toast `id`.
   */
  error(renderOrId?: string, options?: ToastOptions): string;
  /** Show a loading toast.
   * @param renderOrId Body text or toast id.
   * @param options Toast configuration.
   * @returns Toast `id`.
   */
  loading(renderOrId?: string, options?: ToastOptions): string;
  /** Bind a promise to the toast lifecycle.
   * @param promise Promise to observe.
   * @param options Pending, success, and error states.
   * @returns The original promise.
   */
  promise<T>(promise: Promise<T>, config?: ToastPromiseConfig<T>): Promise<T>;
  /** Dismiss a single toast or the whole stack.
   * @param id Toast `id` to dismiss.
   * @param manner Removal mode.
   * @param timeElapsed Whether the auto-close timer already elapsed.
   */
  dismiss(id?: string, manner?: "smooth" | "instant", timeElapsed?: boolean): void;
  /** Dismiss every toast that matches an optional group id or the whole stack.
   * @param groupId Optional group id filter.
   */
  dismissAll(groupId?: string): void;
  /** Run an action against every matching toast instance.
   * @param action Instance method to invoke.
   * @param options Options forwarded to the instance method.
   * @param groupId Optional group id filter.
   */
  doForAll(action: string, options?: any, groupId?: string): void;
  /** Return every matching toast instance.
   * @param groupId Optional group id filter.
   * @returns Matching toast instances.
   */
  getAll(groupId?: string): ToastInstance[];
}

/** Helper methods used internally by toaster() and promise flows. */
export interface Toasting {
  isActive(base: Toast, id: string): boolean;
  update(base: Toast, id: string, options: ToastOptions): boolean | string;
  message(base: Toast, getDefaults: () => ToastOptions, action: string, renderOrId: string, options?: ToastOptions): string;
  loading(base: Toast, renderOrId: string, options?: ToastOptions): string;
  promise<T>(base: Toast, promise: Promise<T>, config?: ToastPromiseConfig<T>): Promise<T>;
  dismiss(base: Toast, id?: string, manner?: string, timeElapsed?: boolean): void;
  dismissAll(base: Toast, groupId?: string): void;
  doForAll(base: Toast, action: string, options?: any, groupId?: string): void;
  getAll(base: Toast, groupId?: string): ToastInstance[];
}

// BUNDLE EXPORTS & GLOBAL DECLARATIONS

/** Internal helper methods used by the toast factory. */
export const toasting: Toasting;
/** Create a toast factory with custom defaults and a group id.
 * @param defOptions Default options merged into every toast.
 * @param groupId Prefix applied to generated ids.
 * @returns Toast factory.
 */
export function toaster(defOptions?: ToastOptions, groupId?: string): Toast;
/** Default toast factory instance attached by the bundle. */
declare const toast: Toast;
export default toast;

declare global {
  interface T007Namespace {
    /** Default toast factory instance. */
    toast: Toast;
    /** Lower-level helper methods used by the toast factory. */
    toasting: Toasting;
    /** Factory used to create isolated toast instances. */
    toaster: typeof toaster;
    /** Registry of live toast instances. */
    toasts: Map<string, ToastInstance>;
    /** Default runtime options merged into every toast. */
    TOAST_DEFAULT_OPTIONS: ToastOptions;
    /** Default auto-close durations by toast type. */
    TOAST_DURATIONS: Record<ToastType, number>;
    /** Default vibration patterns by toast type. */
    TOAST_VIBRATIONS: Record<ToastType, number[]>;
    /** Default SVG icons by toast type. */
    TOAST_ICONS: Record<ToastType | "loading", string>;
  }
  interface Window {
    toast?: Toast;
  }
}
