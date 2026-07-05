import { isStr } from "..";
import { setTimeout, setInterval, requestAnimationFrame } from "sia-reactor/utils";

// Timer Helpers

export { setTimeout, setInterval, requestAnimationFrame };

/** Throttles a function, ensuring it's only called once within a specified delay period.
 * @param key Unique identifier for the throttled function, used to track its last execution time.
 * @param fn Function to be throttled.
 * @param delay Time in milliseconds to wait before allowing the function to be called again. @default  `30ms`.
 * @param strict If `true`, exact timestamp difference between calls will be used else a `setTimeout()` will clear the throttle, allowing for more thread leniency. @default  `true`.
 * @param signal Optional `AbortSignal` to automatically clear the throttle when aborted.
 * @param win Optional `Window` object for scheduling the throttle timeout, useful for testing or if running in a non-browser environment.
 */
export function throttle(key: string, fn: Function, delay = 30, strict: ((fn: Function) => number) | boolean = true, signal?: AbortSignal, win?: Window): void {
  const throttleMap = (t007._throttlers ??= new Map<string, number>());
  if (strict === true) {
    const now = performance.now();
    return now - (throttleMap.get(key) ?? 0) < delay ? undefined : (throttleMap.set(key, now), fn());
  }
  if (throttleMap.has(key)) return;
  const id = strict === false ? setTimeout(() => throttleMap.delete(key), delay, signal, win) : strict(() => throttleMap.delete(key)); // uses timeout so code runs when sync thread is free
  return throttleMap.set(key, id), fn();
}

/** Debounces a function, ensuring it's only called after a quiet period of no further calls.
 * @param key Unique identifier for the debounced function, used to track pending calls.
 * @param fn Function to be debounced.
 * @param delay Time in milliseconds to wait after the latest call before invoking the function. @default  `30ms`.
 * @param strict If `true`, exact timestamp difference between calls will be used else pending timeout is reset each call for practical thread leniency. @default  `true`.
 * @param signal Optional `AbortSignal` to automatically clear scheduled debounce execution when aborted.
 * @param win Optional `Window` object for scheduling/clearing the debounce timeout, useful for testing or if running in a non-browser environment.
 */
export function debounce(key: string, fn: Function, delay = 30, strict = true, signal?: AbortSignal, win?: Window): void {
  const debounceMap = (t007._debouncers ??= new Map<string, number>());
  if (strict) {
    const now = performance.now(),
      prev = debounceMap.get(key) ?? 0;
    return debounceMap.set(key, now), now - prev < delay ? undefined : fn();
  }
  const prevId = debounceMap.get(key);
  prevId !== undefined && (win ?? window).clearTimeout(prevId);
  const id = setTimeout(() => (debounceMap.delete(key), fn()), delay, signal, win); // practical debounce: reset timer until calls stop
  return void debounceMap.set(key, id);
}

/** Creates a loop using `requestAnimationFrame`, allowing for efficient execution of a function on every frame.
 * @param key Unique identifier for the loop, used to manage its execution and allow for updates or cancellation.
 * @param fn Function to be executed on every frame.
 * @param signal Optional `AbortSignal` to automatically cancel the loop when aborted.
 * @param win Optional `Window` object for scheduling the animation frame, useful for testing or if running in a non-browser environment.
 *
 * Game-like loops will be our lil secret... ~ "The Smoooth Criminal" :)
 */
export function RAFLoop(key: string, fn: Function, signal?: AbortSignal, win?: Window & typeof globalThis): void {
  const rafLoopMap = (t007._RAFLoopers ??= new Map<string, Function>());
  if (rafLoopMap.has(key)) return void rafLoopMap.set(key, fn); // Just update the function
  rafLoopMap.set(key, fn);
  const loop = (_ = 0, fn = rafLoopMap.get(key)) => fn && (fn(), requestAnimationFrame(loop, signal, win)); // Exit or run
  loop();
}

/** Cancels a loop created by `RAFLoop`.
 * @param key Unique identifier for the loop to be cancelled.
 * @returns True if the loop was successfully cancelled, false if no loop with the given key exists.
 */
export const cancelRAFLoop = (key: string): boolean => (t007._RAFLoopers ? t007._RAFLoopers.delete(key) : false);

// Limited Call Helpers

export interface LimitedOptions {
  /** Storage key used to persist call counts. */
  key?: string;
  /** Maximum number of allowed calls. @default 1 */
  maxTimes?: number;
  /** Only allow calling once per session, regardless of maxTimes. @default true */
  oncePerSession?: boolean;
}
export interface LimitedHandle<T extends (...args: any[]) => any> {
  /** Call the wrapped function with the original arguments. */
  (...args: Parameters<T>): ReturnType<T> | void;
  /** Number of calls already consumed in the current session. */
  count: number;
  /** Number of calls left before the limit is reached. */
  left: number;
  /** Reset the call counter. */
  reset: () => void;
  /** Consume the full allowance and block further calls. */
  block: () => void;
}

/** Limit how many times a function may run.
 * @param FN_KEY Storage namespace used to persist the counter.
 * @param fn Function to wrap.
 * @param opts Call limit settings or a storage key string.
 * @returns Wrapped function with count, reset, and block helpers.
 */
export function limited<T extends (...args: any[]) => any>(FN_KEY: string, fn: T, opts: LimitedOptions | string = {}): LimitedHandle<T> {
  let count = 0,
    { key, maxTimes: max = 1, oncePerSession = true } = isStr(opts) ? { key: opts } : opts;
  const getReg = () => JSON.parse(localStorage.getItem(FN_KEY) || "{}"),
    setReg = (r: Record<string, number>) => localStorage.setItem(FN_KEY, JSON.stringify(r));
  const handle = (...args: Parameters<T>): ReturnType<T> | void => {
    if (oncePerSession && count > 0) return undefined;
    if (!key) return count++ < max ? fn(...args) : undefined;
    const r = getReg(),
      c = r[key] || 0;
    return c < max ? (count++, (r[key] = c + 1), setReg(r), fn(...args)) : undefined;
  };
  handle.left = max - (handle.count = count);
  handle.reset = () => ((count = 0), key && ((r) => (delete r[key], setReg(r)))(getReg()));
  handle.block = () => ((count = max), key && ((r) => ((r[key] = max), setReg(r)))(getReg()));
  return handle;
} // Locally limited fn calls, make a closure with FN_KEY for ease of use

// Async Helpers

/** Resolve on the next task tick.
 * @param timeout Delay in milliseconds.
 * @returns Promise that resolves after the timeout.
 */
export const mockAsync = (timeout = 250): Promise<void> => new Promise((resolve) => setTimeout(resolve, timeout));

/** Resolve on the next animation frame.
 * @param w Window-like object used for scheduling.
 * @returns Promise that resolves on the next frame.
 */
export const breath = (w = window) => new Promise((res) => w.requestAnimationFrame(res)); // The "Single Frame" breathe - GPU Readiness, the loading animation is the build process itself. Sike!!

/** Resolve after two animation frames.
 * @param w Window-like object used for scheduling.
 * @returns Promise that resolves after layout has had two frames to settle.
 */
export const deepBreath = (w = window) => new Promise((res) => w.requestAnimationFrame(() => w.requestAnimationFrame(res))); // The "Double Frame" breathe - guaranteed layout completion

// Generic Helpers

/** Run cleanup immediately or on abort, then return the callable cleanup.
 * @param cleanup Cleanup function to protect.
 * @param signal Optional abort signal.
 * @returns The wrapped cleanup function.
 */
export function bindCleanupToSignal<Cb extends () => any>(cleanup: Cb, signal?: AbortSignal): Cb {
  signal?.aborted ? cleanup() : signal?.addEventListener("abort", cleanup, { once: true });
  if (signal && !signal.aborted) cleanup = (() => (signal.removeEventListener("abort", cleanup), cleanup())) as Cb;
  return cleanup; // once incase spec changes, memory leaks too
} // for simple one-way cleanup functions without off logic elsewhere
