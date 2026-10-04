import { isStr, isNum, isObj, isFunc, clamp, uid, bindAllMethods, createEl, loadResource, isDef, setTimeout, bindCleanupToSignal, requestAnimationFrame, INTERACTIVE_SELECTOR } from "@t007/utils";
import "../css/index.css";

class T007_Toast {
  #constructed = false; // to minimize updates
  #autoCloseInterval;
  #timeVisible = 0;
  #isPaused = false;
  #shouldUnPause;
  queue = [];
  inactive = true;
  #visiblityChange = () => (this.#shouldUnPause = document.visibilityState === "visible");
  constructor(options) {
    bindAllMethods(this);
    this.opts = options;
    t007.toasts.set((this.opts.id ??= uid((this.opts.groupId ??= "t007_toast_"))), this);
    !isNum(this.opts.delay) ? this.activate() : this.queue.push(setTimeout(this.activate, this.opts.delay, this.opts.signal));
    this.update(this.opts), bindCleanupToSignal(this.abort, options.signal);
  }
  activate() {
    this.toastElement = createEl("div", { className: `t007-toast${this.scoped ? " t007-toast-scoped" : ""}`, id: this.opts.id, ariaAtomic: "true" }, { groupId: this.opts.groupId });
    requestAnimationFrame(() => this.toastElement.classList.add("t007-toast-show"), this.opts.signal);
    this.inactive = false;
  }
  update(options, constructed = this.#constructed) {
    if (!options || !isObj(options) || (constructed && this.inactive)) return this.opts.id;
    try {
      if (constructed) options.signal !== this.opts.signal && (this.opts.signal.removeEventListener("abort", this.abort), bindCleanupToSignal(this.abort, this.opts.signal));
      this.opts = { ...this.opts, ...options };
      const run = () => (Object.keys(options).forEach((key) => (this[key] = options[key])), (this.#constructed = true), !constructed && (this.position = this.opts.position)); // DOM Operations stalled for perf gains
      !isNum(this.opts.delay) ? run() : this.queue.push(setTimeout(run, this.opts.delay, this.opts.signal));
      this.opts.delay = null;
    } catch (err) {
      console.error("t007 toast update failed:", err);
    }
    return this.opts.id;
  }
  play = () => setTimeout(() => (this.#isPaused = false), 0, this.opts.signal);
  pause = () => (this.#isPaused = true);
  get rootElement() {
    return this.opts.rootElement ?? document.body;
  }
  set rootElement(value) {
    if (this.#constructed) this.position = this.opts.position; // minimizing updates
  }
  get scoped() {
    return this.rootElement !== document.body;
  }
  set type(value) {
    this.toastElement.classList.remove("info", "success", "error", "warning");
    value && this.toastElement.classList.add(value);
    this.toastElement.role = value === "error" || value === "warning" ? "alert" : "status";
    this.toastElement.ariaLive = value === "error" || value === "warning" ? "assertive" : "polite";
    if (value && this.#constructed) this.icon = this.opts.icon;
  }
  set bodyHTML(value) {
    for (const el of this.toastElement.querySelectorAll(":scope > *:not(.t007-toast-cancel-button)")) el.remove();
    this.toastElement.insertAdjacentHTML("afterbegin", `${value ? (isFunc(value) ? value() : value) : ""}`);
  }
  set render(value) {
    const bodyText = () => this.toastElement.querySelector(".t007-toast-body-text");
    if (value) {
      this._setUpBodyHTML();
      this.toastElement.querySelector(".t007-toast-body").prepend(bodyText() || createEl("p", { className: "t007-toast-body-text" }));
      const text = bodyText();
      text.innerHTML = isFunc(value) ? value() : value;
      text.dataset.render = text.textContent;
    } else bodyText()?.remove();
  }
  set actions(value) {
    const actionsWrapper = () => this.toastElement.querySelector(".t007-toast-actions-wrapper"),
      values = value ? Object.entries(value) : [];
    if (values.length) {
      this._setUpBodyHTML();
      this.toastElement.querySelector(".t007-toast-body").insertAdjacentElement("afterend", actionsWrapper() || createEl("div", { className: "t007-toast-actions-wrapper" }));
      const wrapper = actionsWrapper();
      wrapper.innerHTML = values.map(([label]) => (label ? `<button class="t007-toast-action-button">${label}</button>` : "")).join("");
      wrapper.querySelectorAll(".t007-toast-action-button").forEach((btn, i) => ((btn.onclick = (e) => values[i][1]?.(e, this)), (btn.dataset.action = btn.textContent.trim())));
    } else actionsWrapper()?.remove();
  }
  set image(value) {
    const image = () => this.toastElement.querySelector(".t007-toast-image");
    if (value) {
      this._setUpBodyHTML();
      this.toastElement.querySelector(".t007-toast-image-wrapper").prepend(image() || createEl("img", { className: "t007-toast-image", alt: "toast-image" }));
      const img = image();
      img.src = value;
      img.onload = img.onerror = () => (img.dataset.loaded = img.complete && img.naturalWidth > 0);
    } else image()?.remove();
  }
  get icon() {
    return this.opts.icon === true ? t007.TOAST_ICONS[this.opts.type] || "" : this.opts.icon || "";
  }
  set icon(value) {
    if (this.opts.isLoading) return;
    const icon = () => this.toastElement.querySelector(".t007-toast-icon:not(.t007-toast-loader)");
    if (value) {
      this._setUpBodyHTML();
      this.toastElement.querySelector(".t007-toast-image-wrapper").append(icon() || createEl("span", { className: "t007-toast-icon" }));
      const icn = icon();
      icn.innerHTML = icn.dataset.icon = this.icon;
    } else icon()?.remove();
  }
  set isLoading(value) {
    const loader = () => this.toastElement.querySelector(".t007-toast-loader");
    if (value) {
      this._setUpBodyHTML();
      for (const i of this.toastElement.querySelectorAll(".t007-toast-icon:not(.t007-toast-loader)")) i.remove();
      this.toastElement.querySelector(".t007-toast-image-wrapper").append(loader() || createEl("span", { className: "t007-toast-icon t007-toast-loader" }));
      loader().innerHTML = isStr(value) ? value : t007.TOAST_ICONS.loading;
    } else {
      loader()?.remove();
      if (this.#constructed) this.icon = this.opts.icon;
    }
  }
  set closeButton(value) {
    const btn = this.toastElement.querySelector(".t007-toast-cancel-button");
    if (value) this.toastElement.append(btn || createEl("button", { title: "Close", ariaLabel: "Close notification", className: "t007-toast-cancel-button", innerHTML: "&times;", onclick: () => this.remove(undefined, false, true) }));
    else btn?.remove();
  }
  get animation() {
    const p = this.opts.position;
    if (this.opts.animation === true || this.opts.animation === "slide")
      if (p === "top-right" || p === "center-right" || p === "bottom-right") return "slide-left";
      else if (p === "top-center" || p === "center-center" || p === "bottom-center") return p === "top-center" ? "slide-down" : "slide-up";
      else return "slide-right";
    return this.opts.animation;
  }
  set animation(value) {
    this.toastElement.dataset.animation = this.animation;
  }
  get autoClose() {
    return this.opts.autoClose === true ? t007.TOAST_DURATIONS[this.opts.type] || t007.TOAST_DURATIONS.info : this.opts.autoClose;
  }
  set autoClose(value) {
    cancelAnimationFrame(this.#autoCloseInterval);
    this.#timeVisible = 0;
    this.toastElement.classList.toggle("progress", !this.opts.hideProgressBar && isNum(this.autoClose));
    this.nprogress = undefined;
    let lastTime;
    const loop = (time) => {
      if (this.#shouldUnPause) {
        lastTime = null;
        this.#shouldUnPause = false;
      }
      if (lastTime == null) {
        lastTime = time;
        return (this.#autoCloseInterval = requestAnimationFrame(loop, this.opts.signal));
      }
      if (!this.#isPaused) {
        this.#timeVisible += time - lastTime;
        this.onTimeUpdate?.(this.#timeVisible);
        if (!this.opts.hideProgressBar) this.nprogress = undefined;
        if (isNum(this.autoClose) && this.#timeVisible >= this.autoClose) return this.remove("smooth", true);
      }
      lastTime = time;
      this.#autoCloseInterval = requestAnimationFrame(loop, this.opts.signal);
    };
    if (value) this.#autoCloseInterval = requestAnimationFrame(loop, this.opts.signal);
  }
  set position(value) {
    if (!this.#constructed) return; // Wait until fully built in memory
    const oldContainer = this.toastElement.parentElement,
      container = this.rootElement.querySelector(`:scope > .t007-toast-container[data-position="${value}"]`) || this._createContainer(value);
    !container.contains(this.toastElement) && container[this.opts.newestOnTop ? "prepend" : "append"](this.toastElement);
    this.toastElement.classList.toggle("t007-toast-scoped", this.scoped), (this.animation = true);
    if (!(oldContainer == null || oldContainer.hasChildNodes())) oldContainer.remove();
    this.limit = this.opts.limit;
  }
  set closeOnClick(value) {
    this.toastElement.onclick = value ? () => this.remove(undefined, false, true) : null;
  }
  set hideProgressBar(value) {
    this.toastElement.classList.toggle("progress", !value && isNum(this.autoClose));
    if (!value && isNum(this.autoClose)) this.nprogress = undefined;
  }
  get nprogress() {
    return Number(this.toastElement.style.getProperty("--progress"));
  }
  set nprogress(value = 1 - this.#timeVisible / this.autoClose) {
    this.toastElement.style.setProperty("--progress", value);
  }
  set pauseOnHover(value) {
    this.toastElement.onmouseover = value ? this.pause : null;
    this.toastElement.onmouseleave = value ? this.play : null;
    this.toastElement[value ? "addEventListener" : "removeEventListener"]("touchend", this.play);
  }
  set pauseOnFocusLoss(value) {
    value ? document.addEventListener("visibilitychange", this.#visiblityChange) : document.removeEventListener("visibilitychange", this.#visiblityChange);
  }
  set tag(value) {
    this.toastElement.dataset.tag = value;
  }
  set renotify(value) {
    if (value && this.opts.tag) for (const toast of t007.toasts.values()) if (toast.opts.tag === this.opts.tag && toast.opts.id !== this.opts.id && toast.opts.groupId === this.opts.groupId) toast.abort();
  }
  get vibrate() {
    return this.opts.vibrate === true ? t007.TOAST_VIBRATIONS[this.opts.type] || t007.TOAST_VIBRATIONS.info : this.opts.vibrate;
  }
  set vibrate(value) {
    value && navigator?.vibrate?.(this.vibrate);
  }
  set limit(value) {
    if (!value || !this.#constructed) return;
    const els = [...(this.toastElement?.parentElement?.children || [])];
    if (!els.length) return;
    for (let i = 0; i < els.length - value; i++) [...t007.toasts.values()].find((t) => t.toastElement === (this.opts.newestOnTop ? els[els.length - 1 - i] : els[i]))?.abort();
  }
  set newestOnTop(value) {
    this.toastElement?.parentElement?.[value ? "prepend" : "append"](this.toastElement);
  }
  set dragToClose(value) {
    this.toastElement.dataset.dragToClose = this._ptrType = value;
    this.toastElement.onpointerdown = value ? this._handleToastPointerStart : null;
    this.toastElement.onpointercancel = this.toastElement.onpointerup = value ? this._handleToastPointerUp : null;
  }
  set compact(value) {
    this.toastElement.classList.toggle("t007-toast-compact", !!value);
  }
  _handleToastPointerStart(e) {
    if (isStr(this._ptrType) && e.pointerType !== this._ptrType) return;
    if (e.touches?.length > 1 || e.target.closest(INTERACTIVE_SELECTOR)) return;
    this.toastElement.setPointerCapture(e.pointerId);
    this.#isPaused = true;
    this._ptrTicker = this._ptrDirSet = this._ptrDir = false;
    this._ptrStartX = e.clientX ?? e.targetTouches[0]?.clientX;
    this._ptrStartY = e.clientY ?? e.targetTouches[0]?.clientY;
    this.toastElement.addEventListener("pointermove", this._handleToastPointerMove);
    this.toastElement.style.setProperty("transition", "none", "important");
  }
  _handleToastPointerMove(e) {
    e.preventDefault();
    if (this._ptrTicker) return;
    this._ptrRAF = requestAnimationFrame(() => {
      const selection = (e.view || window).getSelection();
      if (selection?.toString().length && this.toastElement.contains(selection.anchorNode)) return this._handleToastPointerUp(e); // Snub the drag: clear tracking and let the text highlight win
      const has = (str) => this.opts.dragToCloseDir.includes(str),
        x = e.clientX ?? e.targetTouches[0]?.clientX,
        y = e.clientY ?? e.targetTouches[0]?.clientY;
      this._ptrDir ||= Math.abs(x - this._ptrStartX) >= Math.abs(y - this._ptrStartY) ? "x" : "y";
      this._ptrDeltaX = (has("|") ? this._ptrDir == "x" : has("x")) && !has(x - this._ptrStartX > 0 ? "-" : "+") ? x - this._ptrStartX : 0;
      this._ptrDeltaY = (has("|") ? this._ptrDir == "y" : has("y")) && !has(y - this._ptrStartY > 0 ? "+" : "-") ? y - this._ptrStartY : 0;
      this.toastElement.style.setProperty("transform", `translate(${this._ptrDeltaX}px, ${this._ptrDeltaY}px)`, "important");
      const xR = Math.abs(this._ptrDeltaX) / this.toastElement.offsetWidth,
        yR = Math.abs(this._ptrDeltaY) / this.toastElement.offsetHeight;
      this.toastElement.style.setProperty("opacity", clamp(0, 1 - (yR > 0.5 ? yR : xR), 1), "important");
      if (!this._ptrDirSet && !xR && !yR) this._ptrDir = false;
      if (this._ptrDir) this._ptrDirSet = has("||");
      this._ptrTicker = false;
    }, this.opts.signal);
    this._ptrTicker = true;
  }
  _handleToastPointerUp(e) {
    if (isStr(this._ptrType) && e.pointerType !== this._ptrType) return;
    cancelAnimationFrame(this._ptrRAF);
    if (Math.abs(this._ptrDeltaX) > this.toastElement.offsetWidth * ((this.opts.dragToClosePercent.x ?? this.opts.dragToClosePercent) / 100) || Math.abs(this._ptrDeltaY) > this.toastElement.offsetHeight * ((this.opts.dragToClosePercent.y ?? this.opts.dragToClosePercent) / 100)) return this.remove("instant", false, true);
    this.#isPaused = this._ptrTicker = this._ptrDirSet = this._ptrDir = false;
    this.toastElement.removeEventListener("pointermove", this._handleToastPointerMove);
    for (const prop of ["transition", "transform", "opacity"]) this.toastElement.style.removeProperty(prop);
  }
  remove(manner = "smooth", timeElapsed = false, userInitiated = false) {
    if (!this.opts.isLoading) t007.toasts.delete(this.opts.id);
    for (const tid of this.queue) clearTimeout(tid);
    document.removeEventListener("visibilitychange", this.#visiblityChange);
    cancelAnimationFrame(this.#autoCloseInterval);
    if (this.inactive || manner === "instant" || !this.animation) this._cleanUpToast();
    else if (this.toastElement) this.toastElement.onanimationend = this._cleanUpToast;
    this.toastElement?.classList.remove("t007-toast-show");
    this.onClose?.(timeElapsed, userInitiated);
  }
  abort = () => this.remove("instant");
  _createContainer(position) {
    const container = createEl("div", { className: "t007-toast-container" }, { position });
    container.style.setProperty("--t007-toast-container-position", !this.scoped ? "fixed" : "absolute");
    return this.rootElement.appendChild(container);
  }
  _setUpBodyHTML() {
    this.#constructed && this.toastElement.querySelectorAll(":scope > *:not(.t007-toast-image-wrapper, .t007-toast-body, .t007-toast-actions-wrapper, .t007-toast-cancel-button)").forEach((el) => el.remove());
    const imageWrapper = () => this.toastElement.querySelector(".t007-toast-image-wrapper");
    if (!imageWrapper()) this.toastElement.prepend(createEl("div", { className: "t007-toast-image-wrapper" }));
    if (!this.toastElement.querySelector(".t007-toast-body")) imageWrapper().insertAdjacentElement("afterend", createEl("div", { className: "t007-toast-body" }));
  }
  _cleanUpToast() {
    const container = this.toastElement?.parentElement;
    this.toastElement?.remove();
    if (!container?.hasChildNodes()) container?.remove();
    this.inactive = true;
  }
}

export const toasting = {
  isActive(_, id, _toast = t007.toasts.get(id)) {
    return isDef(id) ? !!_toast && !_toast.inactive : t007.toasts.size > 0 && [...t007.toasts.values()].some((toast) => !toast.inactive);
  },
  update(base, id, options, _toast) {
    const toast = _toast ?? t007.toasts.get(id);
    if (toast?.queue) for (const tid of toast.queue) clearTimeout(tid); // remove all delays and maybe make a new toast
    if (toast && toast.inactive) return t007.toasts.delete(id), base(options.render, { ...toast.opts, id, ...options });
    return toast && toast.update(options);
  },
  message: (base, getDefaults, action, renderOrId, options = {}) => {
    options = { ...options, type: action === "warn" ? "warning" : action };
    const id = options.id ?? renderOrId,
      toast = t007.toasts.get(id);
    if (!toast) return base(renderOrId, options);
    const { autoClose, closeButton, closeOnClick, dragToClose } = getDefaults();
    return base.update(id, { ...(toast.opts.isLoading ? { closeButton, closeOnClick, dragToClose } : null), ...(options.id ? { render: renderOrId } : null), autoClose, ...options, isLoading: false }, toast);
  },
  loading: (base, renderOrId, options = {}) => {
    const id = options.id ?? renderOrId,
      toast = t007.toasts.get(id);
    return (toast ? base.update : base)(id, { closeButton: false, closeOnClick: false, dragToClose: false, ...(options.id ? { render: renderOrId } : null), autoClose: false, ...options, isLoading: options.isLoading || true, type: "" }, toast || undefined);
  },
  promise(base, promise = new Promise((res, rej) => setTimeout(Math.round(Math.random()) ? res : rej, 3000)), { pending, success, error } = {}) {
    if (!promise || !isFunc(promise.then)) return console.error("toast.promise() requires a valid promise");
    const NFC = (input, type) => (isStr(input) ? { render: input, type } : isObj(input) ? { ...input, type } : { type });
    const pendingCfg = NFC(pending);
    const pendingId = base.loading(pendingCfg.render || "Promise pending...", { ...pendingCfg });
    promise.then(
      (response) => {
        const config = NFC(success || "Promise resolved", "success");
        const { render, bodyHTML } = config;
        if (isFunc(render)) config.render = (txt = response) => render(txt); // preserving as functions that receive the response
        if (isFunc(bodyHTML)) config.bodyHTML = (txt = response) => bodyHTML(txt);
        base.success(pendingId, config);
        return response;
      },
      (err) => {
        const config = NFC(error || "Promise rejected", "error");
        const { render, bodyHTML } = config;
        if (isFunc(render)) config.render = (txt = err) => render(txt);
        if (isFunc(bodyHTML)) config.bodyHTML = (txt = err) => bodyHTML(txt);
        base.error(pendingId, config);
        return Promise.reject(err);
      }
    );
    return promise;
  },
  dismiss(base, id, manner, timeElapsed) {
    return !isDef(id) ? base.dismissAll() : t007.toasts.get(id)?.remove(manner, timeElapsed);
  },
  anyActive(base, groupId) {
    return [...t007.toasts.values()].some((toast) => (!isDef(groupId) ? true : toast.opts.groupId === groupId) && base.isActive(toast.opts.id, toast));
  },
  dismissAll(base, groupId) {
    for (const toast of t007.toasts.values()) (!isDef(groupId) ? true : toast.opts.groupId === groupId) && toast.remove();
  },
  doForAll(base, action, options, groupId) {
    for (const toast of t007.toasts.values()) (!isDef(groupId) ? true : toast.opts.groupId === groupId) && base[action]?.(toast.opts.id, options);
  },
  getAll(base, groupId) {
    return t007.toasts.values().filter((toast) => (!isDef(groupId) ? true : toast.opts.groupId === groupId));
  },
};

export const toaster = (defaults = {}, groupId = "t007_toast_") => {
  const getDefaults = () => ({ ...t007.TOAST_DEFAULT_OPTIONS, ...base.defaults, groupId }),
    base = (renderOrId, options = {}, mayBeId = renderOrId?.startsWith?.(groupId), render = mayBeId ? options.render : renderOrId, id = mayBeId ? renderOrId : options.id, toast = t007.toasts.get(id)) => (toast ? toasting.update(base, id, { ...options, render }, toast) : new T007_Toast({ ...getDefaults(), ...options, id, render }).opts.id);
  base.defaults = defaults;
  base.isActive = (id) => toasting.isActive(base, id);
  base.update = (id, options, _toast) => toasting.update(base, id, options, _toast);
  for (const action of ["info", "success", "warn", "error"]) base[action] = (renderOrId, options) => toasting.message(base, getDefaults, action, renderOrId, options);
  base.loading = (renderOrId, options) => toasting.loading(base, renderOrId, options);
  base.promise = (promise, config) => toasting.promise(base, promise, config);
  base.dismiss = (id, manner, timeElapsed) => toasting.dismiss(base, id, manner, timeElapsed);
  base.anyActive = (groupId) => toasting.anyActive(base, groupId);
  base.dismissAll = (groupId) => toasting.dismissAll(base, groupId);
  base.doForAll = (action, options, groupId) => toasting.doForAll(base, action, options, groupId);
  base.getAll = (groupId) => toasting.getAll(base, groupId);
  return base;
};

const toast = toaster();
export default toast;
// prettier-ignore
export const TOAST_UI_POSITIONS = [{ value: "top-left", display: "Top Left" }, { value: "top-center", display: "Top Center" }, { value: "top-right", display: "Top Right" }, { value: "center-left", display: "Center Left" }, { value: "center-center", display: "Center Center" }, { value: "center-right", display: "Center Right" }, { value: "bottom-left", display: "Bottom Left" }, { value: "bottom-center", display: "Bottom Center" }, { value: "bottom-right", display: "Bottom Right" }],
  TOAST_UI_ANIMATIONS = [{ value: "fade", display: "Fade" }, { value: "zoom", display: "Zoom" }, { value: "slide", display: "Slide" }, { value: "slide-left", display: "Slide Left" }, { value: "slide-right", display: "Slide Right" }, { value: "slide-up", display: "Slide Up" }, { value: "slide-down", display: "Slide Down" }, {value: false, display: "None"}],
  TOAST_UI_TYPES = [{ value: undefined, display: "None" }, { value: "info", display: "Info" }, { value: "success", display: "Success" }, { value: "warning", display: "Warning" }, { value: "error", display: "Error" }],
  TOAST_UI_DRAG_OPTIONS = [{ value: true, display: "On" }, { value: "mouse", display: "Mouse" }, { value: "touch", display: "Touch" }, { value: "pen", display: "Pen" }, { value: false, display: "Off" }],
  TOAST_UI_DRAG_DIRECTIONS = [{ value: "x", display: "Horizontal" }, { value: "y", display: "Vertical" }, { value: "xy", display: "Horizontal and Vertical" }, { value: "x|y", display: "Horizontal or Vertical" }, { value: "x||y", display: "Horizontal or Vertical (Locked)" }, { value: "x+", display: "Right" }, { value: "x-", display: "Left" }, { value: "y+", display: "Down" }, { value: "y-", display: "Up" }, { value: "xy+", display: "Right and Down" }, { value: "xy-", display: "Left and Up" }, { value: "x|y+", display: "Right or Down" }, { value: "x|y-", display: "Left or Up" }, { value: "x||y+", display: "Right or Down (Locked)" }, { value: "x||y-", display: "Left or Up (Locked)" }]; // For UI purposes

if ("undefined" !== typeof window) {
  (t007.toast = toast), (t007.toasting = toasting), (t007.toaster = toaster);
  t007.toasts = new Map();
  (t007.TOAST_DEFAULT_OPTIONS ??= {}), (t007.TOAST_DURATIONS ??= {}), (t007.TOAST_VIBRATIONS ??= {}), (t007.TOAST_ICONS ??= {}), (t007.T0AST_UI_POSITIONS = TOAST_UI_POSITIONS), (t007.TOAST_UI_ANIMATIONS = TOAST_UI_ANIMATIONS), (t007.TOAST_UI_TYPES = TOAST_UI_TYPES), (t007.TOAST_UI_DRAG_OPTIONS = TOAST_UI_DRAG_OPTIONS), (t007.TOAST_UI_DRAG_DIRECTIONS = TOAST_UI_DRAG_DIRECTIONS);
  t007.TOAST_DEFAULT_OPTIONS.render ??= "";
  t007.TOAST_DEFAULT_OPTIONS.type ??= "";
  t007.TOAST_DEFAULT_OPTIONS.icon ??= true;
  t007.TOAST_DEFAULT_OPTIONS.image ??= false;
  t007.TOAST_DEFAULT_OPTIONS.autoClose ??= true;
  t007.TOAST_DEFAULT_OPTIONS.position ??= "top-right"; // "top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right", "center-left", "center-center", "center-right"
  t007.TOAST_DEFAULT_OPTIONS.isLoading ??= false;
  t007.TOAST_DEFAULT_OPTIONS.closeButton ??= !/Mobi|Android|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
  t007.TOAST_DEFAULT_OPTIONS.closeOnClick ??= false;
  t007.TOAST_DEFAULT_OPTIONS.hideProgressBar ??= false;
  t007.TOAST_DEFAULT_OPTIONS.pauseOnHover ??= true;
  t007.TOAST_DEFAULT_OPTIONS.pauseOnFocusLoss ??= true;
  t007.TOAST_DEFAULT_OPTIONS.dragToClose ??= true; // mouse, pen, touch, boolean
  t007.TOAST_DEFAULT_OPTIONS.dragToClosePercent ??= 40;
  t007.TOAST_DEFAULT_OPTIONS.dragToCloseDir ??= "x"; // x, y, xy, x|y, x||y, x+, x-, y+, y-, xy+, xy-, x|y+, x|y-, x||y+, x||y-
  t007.TOAST_DEFAULT_OPTIONS.renotify ??= true;
  t007.TOAST_DEFAULT_OPTIONS.vibrate ??= false;
  t007.TOAST_DEFAULT_OPTIONS.animation ??= true; // "fade", "zoom", "slide"|"slide-left"|"slide-right"|"slide-up"|"slide-down"
  t007.TOAST_DEFAULT_OPTIONS.newestOnTop ??= false; // #toaster
  t007.TOAST_DEFAULT_OPTIONS.limit ??= 100; // #toaster
  t007.TOAST_DEFAULT_OPTIONS.compact ??= false; // #toaster
  (t007.TOAST_DURATIONS.success ??= 2500), (t007.TOAST_DURATIONS.error ??= 4500), (t007.TOAST_DURATIONS.warning ??= 3500), (t007.TOAST_DURATIONS.info ??= 4000); // default
  (t007.TOAST_VIBRATIONS.success ??= [100, 50, 100]), (t007.TOAST_VIBRATIONS.warning ??= [300, 100, 300]), (t007.TOAST_VIBRATIONS.error ??= [500, 200, 500]), (t007.TOAST_VIBRATIONS.info ??= [200]); // Short double buzz, Two long buzzes, Strong long buzz, Single short buzz
  t007.TOAST_ICONS.success ??= `<svg class="no-css-fill" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#27ae60"/><path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M7 12l3 3l6-6"/></svg>`;
  t007.TOAST_ICONS.error ??= `<svg class="no-css-fill" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#e74c3c"/><path fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M8 8l8 8M16 8l-8 8"/></svg>`;
  t007.TOAST_ICONS.warning ??= `<svg class="no-css-fill" width="24" height="24" viewBox="0 0 24 24"><path fill="#f1c40f" stroke="#f39c12" stroke-width="2" stroke-linejoin="round" d="M12 3L2.5 20.5A2 2 0 0 0 4.5 23h15a2 2 0 0 0 2-2.5L12 3z"/><circle cx="12" cy="17" r="1.5" fill="#fff"/><path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 8v6"/></svg>`;
  t007.TOAST_ICONS.info ??= `<svg class="no-css-fill" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3498db"/><path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 10v6"/><circle cx="12" cy="7" r="1.5" fill="#fff"/></svg>`;
  t007.TOAST_ICONS.loading ??= `<svg class="no-css-fill" width="24" height="24" viewBox="0 0 16 16" fill="none" style="scale:0.75;"><g fill-rule="evenodd" clip-rule="evenodd"><path fill="whitesmoke" d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8"/><path fill="gray" d="M7.25.75A.75.75 0 0 1 8 0a8 8 0 0 1 8 8 .75.75 0 0 1-1.5 0A6.5 6.5 0 0 0 8 1.5a.75.75 0 0 1-.75-.75"/></g><animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0" to="360" dur="600ms" repeatCount="indefinite"/></svg>`;
  loadResource(T007_TOAST_CSS_SRC);
  window.toast ??= t007.toast;
  console.log("%cT007 Toasts attached to window!", "color: darkturquoise");
}
