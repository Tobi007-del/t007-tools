import { NIL } from "sia-reactor";
import { createEl, isInteractive } from "../../core/dom";

export interface RippleConfig {
  /** Optional explicit ripple host element. @default  event currentTarget. */
  target?: HTMLElement | null;
  /** Forces the ripple origin to the center of the host. By default, the ripple will originate from the pointer event coordinates. */
  forceCenter?: boolean;
  /** CSS class added to the ripple wrapper element. @default  `"t007-ripple-wrapper"`. */
  wrapperClassName?: string;
  /** CSS general class added to the ripple element. @default  `"t007-ripple"`. */
  className?: string;
  /** CSS class added to the ripple element while the pointer is held down. Should contain the initial expansion animation. @default  `"t007-ripple-hold"`. */
  holdClassName?: string;
  /** CSS class added to the ripple element when released. Should contain the fade-out animation. @default  `"t007-ripple-fade"`. */
  fadeClassName?: string;
  /** Maximum duration for the ripple animation, force-ejects when elapsed. @default  1000ms. */
  maxDuration?: number;
}

/** Render and control a material-style ripple animation on an element.
 * @param e Pointer event used to place and gate the ripple.
 * @param options Ripple configuration options.
 * @details
 * The ripple will be triggered on the event's currentTarget by default, but an explicit target can be provided.
 * The ripple will originate from the pointer coordinates relative to the target, unless forceCenter is enabled.
 * The ripple element will receive a hold class until the pointer is released, at which point it will switch to a fade class and be removed after the animation completes.
 * Pointer events that are not left-clicks or that originate from interactive elements other than the currentTarget will be ignored to prevent interference with native behaviors.
 */
export function rippleHandler(e: Pick<PointerEvent, "target" | "currentTarget" | "button" | "clientX" | "clientY" | "stopPropagation">, { target, forceCenter = false, wrapperClassName = "t007-ripple-wrapper", className = "t007-ripple", holdClassName = "t007-ripple-hold", fadeClassName = "t007-ripple-fade", maxDuration = 1000 }: RippleConfig = NIL): void {
  const el = target || (e.currentTarget as HTMLElement);
  if (!el || (e.target !== e.currentTarget && isInteractive(e.target)) || el.hasAttribute("disabled") || ((e as any).pointerType === "mouse" && e.button !== 0)) return;
  e.stopPropagation?.();

  const { offsetWidth: rW, offsetHeight: rH } = el,
    { width: w, height: h, left: l, top: t } = el.getBoundingClientRect(),
    size = Math.max(rW, rH),
    x = forceCenter ? rW / 2 - size / 2 : ((e.clientX - l) * rW) / w - size / 2,
    y = forceCenter ? rH / 2 - size / 2 : ((e.clientY - t) * rH) / h - size / 2,
    wrapper = createEl("span", { className: wrapperClassName }),
    ripple = createEl("span", { className: className + " " + holdClassName }, {}, { cssText: `width:${size}px;height:${size}px;left:${x}px;top:${y}px;` });

  let canRelease = false;
  ripple.addEventListener("animationend", () => (canRelease = true), { once: true });
  el.append(wrapper.appendChild(ripple).parentElement!);

  let released = false;
  const release = (force: any): void => {
    if (released) return;
    if (!canRelease && force !== true) return ripple.addEventListener("animationend", release, { once: true }), void setTimeout(release, maxDuration, true); // we still don't trust you
    released = true;
    ripple.classList.replace(holdClassName, fadeClassName);
    ripple.addEventListener("animationend", () => setTimeout(() => wrapper.remove())), setTimeout(() => wrapper.remove(), maxDuration); // we still don't trust you
    for (const evt of ["pointerup", "pointercancel"]) (el.ownerDocument?.defaultView || window).removeEventListener(evt, release);
  };

  if ((e as unknown as Event).type?.endsWith("click")) release(false);
  else for (const evt of ["pointerup", "pointercancel"]) (el.ownerDocument?.defaultView || window).addEventListener(evt, release);
  setTimeout(release, maxDuration, true);
}
