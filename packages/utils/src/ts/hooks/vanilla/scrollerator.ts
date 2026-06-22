import { NIL } from "sia-reactor";

/** Configuration for the vertical edge-scrolling helper. */
interface ScrolleratorOptions {
  /** Starting lines-per-second speed. @default  `3`. */
  baseSpeed?: number;
  /** Maximum accelerated speed. @default  `10`. */
  maxSpeed?: number;
  /** Delay before acceleration kicks in. @default  `2000`. */
  stepDelay?: number;
  /** Base frame rate used to estimate movement. @default  `16`. */
  baseRate?: number;
  /** Approximate line height in pixels. @default  `80`. */
  lineHeight?: number;
  /** Edge margin that triggers scrolling. @default  `80`. */
  margin?: number;
  /** Scroll container or window target. @default  `window`. */
  car?: Window | HTMLElement;
}

/** Scrolling controls returned by initVScrollerator. */
interface Scrollerator {
  /** Trigger a scroll frame and return the computed distance. */
  drive: (clientY: number, brake?: boolean, offsetY?: number) => number;
  /** Reset speed and timers. */
  reset: () => void;
}

/** Create an edge-driven vertical scrolling controller.
 * @param options Scrollerator configuration.
 * @returns Drive and reset controls for the controller.
 */
export function initVScrollerator({ baseSpeed = 3, maxSpeed = 10, stepDelay = 2000, baseRate = 16, lineHeight = 80, margin = 80, car = window }: ScrolleratorOptions = NIL): Scrollerator {
  let linesPerSec = baseSpeed,
    accelId: ReturnType<typeof setTimeout> | null = null,
    lastTime: number | null = null;
  const drive = (clientY: number, brake = false, offsetY = 0): number => {
    if (car !== window) clientY -= offsetY;
    const now = performance.now(),
      speed = linesPerSec * lineHeight * ((lastTime ? now - lastTime : baseRate) / 1000);
    if (!brake && (clientY < margin || clientY > ((car as any).innerHeight ?? (car as any).offsetHeight) - margin)) {
      accelId === null ? (accelId = setTimeout(() => (linesPerSec += 1), stepDelay)) : linesPerSec > baseSpeed && (linesPerSec = Math.min(linesPerSec + 1, maxSpeed));
      (car as any).scrollBy?.(0, clientY < margin ? -speed : speed);
    } else reset();
    return (lastTime = !brake ? now : null), speed;
  };
  const reset = () => (accelId && clearTimeout(accelId), (accelId = null), (linesPerSec = baseSpeed), (lastTime = null));
  return { drive, reset };
}
