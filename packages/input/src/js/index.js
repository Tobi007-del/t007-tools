import "../css/index.scss";
import { isArr, isStr, createEl, loadResource, formatSize as formatFileSize } from "@t007/utils";
import { initScrollAssist } from "@t007/utils/hooks/vanilla";
import { violationKeys, nativeIconTypes } from "../ts/utils/consts";
import { getFilesHelper, getStrengthLevel } from "../ts/utils/fn";

var formManager = {
  forms: document.getElementsByClassName("t007-input-form"),
  violationKeys: violationKeys,
  init() {
    t007.FM.observeDOMForFields(), Array.prototype.forEach.call(t007.FM.forms, t007.FM.handleFormValidation);
  },
  observeDOMForFields() {
    new MutationObserver((mutations) => {
      for (const mutation of mutations)
        for (const node of mutation.addedNodes) {
          if (!node.tagName || !(node.classList.contains("t007-input-field") || node.querySelector(".t007-input-field"))) continue;
          for (const field of [...(node.querySelector(".t007-input-field") ? node.querySelectorAll(".t007-input-field") : [node])]) t007.FM.setUpField(field);
        }
    }).observe(document.body, { childList: true, subtree: true });
  },
  getFilesHelper: (files, opts) => getFilesHelper(files, opts),
  formatSize: (size, decimals = 3, base = 1e3) => formatFileSize(size, decimals, base),
  togglePasswordType: (input) => (input.type = input.type === "password" ? "text" : "password"),
  toggleFilled(input) {
    input.toggleAttribute("data-filled", input.type === "checkbox" || input.type === "radio" ? input.checked : input.value !== "" || input.files?.length > 0), input.type === "color" && input.t007Field.style.setProperty("--input-color", input.value);
  },
  setFallbackHelper(field) {
    const helperTextWrapper = field?.querySelector(".t007-input-helper-text-wrapper");
    !helperTextWrapper?.querySelector(".t007-input-helper-text[data-violation='auto']") && helperTextWrapper?.append(createEl("p", { className: "t007-input-helper-text" }, { violation: "auto" }));
  },
  setFieldListeners(field) {
    if (!field) return;
    const input = field.querySelector(".t007-input"),
      floatingLabel = field.querySelector(".t007-input-floating-label"),
      eyeOpen = field.querySelector(".t007-input-password-visible-icon"),
      eyeClosed = field.querySelector(".t007-input-password-hidden-icon");
    if (input.type === "file")
      input.addEventListener("input", async () => {
        const file = input.files?.[0],
          img = new Image();
        img.onload = () => (input.style.setProperty("--t007-input-image-src", `url(${src})`), input.classList.add("t007-input-image-selected"), setTimeout(() => URL.revokeObjectURL(src), 1000));
        img.onerror = () => (input.style.removeProperty("--t007-input-image-src"), input.classList.remove("t007-input-image-selected"), URL.revokeObjectURL(src));
        let src;
        if (file?.type?.startsWith("image")) src = URL.createObjectURL(file);
        else if (file?.type?.startsWith("video"))
          src = await new Promise((resolve) => {
            let video = createEl("video"),
              canvas = createEl("canvas"),
              context = canvas.getContext("2d");
            video.ontimeupdate = () => {
              context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
              canvas.toBlob((blob) => resolve(URL.createObjectURL(blob))), URL.revokeObjectURL(video.src);
              video = video.src = video.onloadedmetadata = video.ontimeupdate = null;
            };
            video.onloadeddata = () => (video.currentTime = 3);
            video.src = URL.createObjectURL(file);
          });
        if (!src) return input.style.removeProperty("--t007-input-image-src"), input.classList.remove("t007-input-image-selected");
        img.src = src;
      });
    if (floatingLabel) floatingLabel.ontransitionend = () => floatingLabel.classList.remove("t007-input-shake");
    if (eyeOpen && eyeClosed) eyeOpen.onclick = eyeClosed.onclick = () => t007.FM.togglePasswordType(input);
    initScrollAssist(field.querySelector(".t007-input-helper-text-wrapper"), { vertical: false });
  },
  setUpField(field) {
    if (field.dataset.setup) return;
    const input = field.querySelector(".t007-input");
    t007.FM.toggleFilled(((input.t007Field = field), input)), t007.FM.setFallbackHelper(field), t007.FM.setFieldListeners(field);
    field.dataset.setup = "true";
  },
  field({ isWrapper = false, label = "", type = "text", placeholder = "", custom = "", minSize, maxSize, minTotalSize, maxTotalSize, options = [], indeterminate = false, eyeToggler = true, passwordMeter = true, helperText = {}, className = "", fieldClassName = "", children, startIcon = "", endIcon = "", nativeIcon = "", passwordVisibleIcon = "", passwordHiddenIcon = "", bleedingEdge = true, ...otherProps }) {
    const isSelect = type === "select",
      isTextArea = type === "textarea",
      isCheckboxOrRadio = type === "checkbox" || type === "radio",
      field = createEl("div", { className: `t007-input-field${isWrapper ? " t007-input-is-wrapper" : ""}${indeterminate ? " t007-input-indeterminate" : ""}${!!nativeIcon ? " t007-input-icon-override" : ""}${helperText === false ? " t007-input-no-helper" : ""}${fieldClassName ? ` ${fieldClassName}` : ""}${bleedingEdge ? " t007-input-bleeding-edge" : ""}` }),
      labelEl = createEl("label", { className: isCheckboxOrRadio ? `t007-input-${type}-wrapper` : "t007-input-wrapper" });
    field.append(labelEl);
    if (isCheckboxOrRadio) {
      labelEl.innerHTML = `
        <span class="t007-input-${type}-box">
          <span class="t007-input-${type}-tag"></span>
        </span>
        <span class="t007-input-${type}-label">${label}</span>
      `;
    } else {
      const outline = createEl("span", { className: "t007-input-outline" });
      outline.innerHTML = `
        <span class="t007-input-outline-leading"></span>
        <span class="t007-input-outline-notch">
          <span class="t007-input-floating-label">${label}</span>
        </span>
        <span class="t007-input-outline-trailing"></span>
      `;
      labelEl.append(outline);
    }
    const inputEl = (field.inputEl = createEl(isTextArea ? "textarea" : isSelect ? "select" : "input", { className: `t007-input${className ? ` ${className}` : ""}`, placeholder })); // You're welcome :)
    // Insert options if select
    if (isSelect && isArr(options)) inputEl.innerHTML = options.map((opt) => (isStr(opt) ? `<option value="${opt}">${opt}</option>` : `<option value="${opt.value}">${opt.option}</option>`)).join("");
    if (!isSelect && !isTextArea) inputEl.type = type;
    if (custom) inputEl.setAttribute("custom", custom);
    if (minSize) inputEl.setAttribute("minsize", minSize);
    if (maxSize) inputEl.setAttribute("maxsize", maxSize);
    if (minTotalSize) inputEl.setAttribute("mintotalsize", minTotalSize);
    if (maxTotalSize) inputEl.setAttribute("maxtotalsize", maxTotalSize);
    // Drill other props into input, quite reckless though but necessary
    Object.keys(otherProps).forEach((key) => (inputEl[key] = otherProps[key]));
    // Append main input/textarea/select
    labelEl.append(!isWrapper ? inputEl : children);
    // Native or end icon for date/time/month/datetime-local
    if (nativeIconTypes.includes(type) && nativeIcon) labelEl.append(createEl("i", { className: "t007-input-icon t007-input-native-icon", innerHTML: nativeIcon }));
    else if (endIcon) labelEl.append(createEl("i", { className: "t007-input-icon", innerHTML: endIcon }));
    // Password toggle eye icons
    if (type === "password" && eyeToggler)
      labelEl.append(
        createEl("i", { role: "button", ariaLabel: "Show password", className: "t007-input-icon t007-input-password-visible-icon", innerHTML: passwordVisibleIcon || `<svg width="24" height="24"><path fill="rgba(0,0,0,.54)" d="M12 16q1.875 0 3.188-1.312Q16.5 13.375 16.5 11.5q0-1.875-1.312-3.188Q13.875 7 12 7q-1.875 0-3.188 1.312Q7.5 9.625 7.5 11.5q0 1.875 1.312 3.188Q10.125 16 12 16Zm0-1.8q-1.125 0-1.912-.788Q9.3 12.625 9.3 11.5t.788-1.913Q10.875 8.8 12 8.8t1.913.787q.787.788.787 1.913t-.787 1.912q-.788.788-1.913.788Zm0 4.8q-3.65 0-6.65-2.038-3-2.037-4.35-5.462 1.35-3.425 4.35-5.463Q8.35 4 12 4q3.65 0 6.65 2.037 3 2.038 4.35 5.463-1.35 3.425-4.35 5.462Q15.65 19 12 19Z"/></svg>` }),
        createEl("i", { role: "button", ariaLabel: "Hide password", className: "t007-input-icon t007-input-password-hidden-icon", innerHTML: passwordHiddenIcon || `<svg width="24" height="24"><path fill="rgba(0,0,0,.54)" d="m19.8 22.6-4.2-4.15q-.875.275-1.762.413Q12.95 19 12 19q-3.775 0-6.725-2.087Q2.325 14.825 1 11.5q.525-1.325 1.325-2.463Q3.125 7.9 4.15 7L1.4 4.2l1.4-1.4 18.4 18.4ZM12 16q.275 0 .512-.025.238-.025.513-.1l-5.4-5.4q-.075.275-.1.513-.025.237-.025.512 0 1.875 1.312 3.188Q10.125 16 12 16Zm7.3.45-3.175-3.15q.175-.425.275-.862.1-.438.1-.938 0-1.875-1.312-3.188Q13.875 7 12 7q-.5 0-.938.1-.437.1-.862.3L7.65 4.85q1.025-.425 2.1-.638Q10.825 4 12 4q3.775 0 6.725 2.087Q21.675 8.175 23 11.5q-.575 1.475-1.512 2.738Q20.55 15.5 19.3 16.45Zm-4.625-4.6-3-3q.7-.125 1.288.112.587.238 1.012.688.425.45.613 1.038.187.587.087 1.162Z"/></svg>` })
      );
    // Helper line
    if (helperText !== false) {
      const helperLine = createEl("div", { className: "t007-input-helper-line" }),
        helperWrapper = createEl("div", { className: "t007-input-helper-text-wrapper", tabIndex: "-1" });
      // Info text
      if (helperText.info) helperWrapper.append(createEl("p", { className: "t007-input-helper-text", textContent: helperText.info }, { violation: "none" }));
      // Violation texts
      t007.FM.violationKeys?.forEach((key) => helperText[key] && helperWrapper.append(createEl("p", { className: "t007-input-helper-text", textContent: helperText[key] }, { violation: key })));
      helperLine.append(helperWrapper), field.append(helperLine);
    }
    // Password strength meter
    if (passwordMeter && type === "password") {
      const meter = createEl("div", { className: "t007-input-password-meter" }, { strengthLevel: "1" });
      meter.innerHTML = `
        <div class="t007-input-password-strength-meter">
          <div class="t007-input-p-weak"></div>
          <div class="t007-input-p-fair"></div>
          <div class="t007-input-p-strong"></div>
          <div class="t007-input-p-very-strong"></div>
        </div>
      `;
      field.append(meter);
    }
    return field;
  },
  handleFormValidation(form) {
    if (!form?.classList.contains("t007-input-form") || form.dataset?.isValidating) return;
    form.dataset.isValidating = "true";
    form.validateOnClient = validateFormOnClient;
    form.toggleGlobalError = toggleFormGlobalError;
    const fields = form.getElementsByClassName("t007-input-field"),
      inputs = form.getElementsByClassName("t007-input");
    Array.prototype.forEach.call(fields, t007.FM.setUpField);
    form.addEventListener("input", ({ target }) => (t007.FM.toggleFilled(target), validateInput(target)));
    form.addEventListener("focusout", ({ target }) => validateInput(target, true));
    form.addEventListener("submit", async (e) => {
      form.classList.toggle("t007-input-submit-loading", true);
      try {
        e.preventDefault();
        if (!validateFormOnClient()) return;
        if (form.validateOnServer && !(await form.validateOnServer())) return toggleFormGlobalError(true), form.addEventListener("input", () => toggleFormGlobalError(false), { once: true, useCapture: true });
        form.onSubmit ? form.onSubmit(e) : form.submit();
      } catch (error) {
        console.error(error);
      }
      form.classList.toggle("t007-input-submit-loading", false);
    });
    function toggleError(input, bool, flag = false) {
      const field = input.t007Field,
        floatingLabel = field.querySelector(".t007-input-floating-label");
      if (bool && flag) {
        input.setAttribute("data-error", "");
        floatingLabel?.classList.add("t007-input-shake"), setTimeout(() => floatingLabel?.classList.remove("t007-input-shake"), 520);
      } else if (!bool) input.removeAttribute("data-error");
      toggleHelper(input, input.hasAttribute("data-error"));
    }
    function toggleHelper(input, bool) {
      const field = input.t007Field,
        violation = t007.FM.violationKeys.find((violation) => input.Validity?.[violation] || input.validity[violation]) ?? "",
        helper = field.querySelector(`.t007-input-helper-text[data-violation="${violation}"]`),
        fallbackHelper = field.querySelector(`.t007-input-helper-text[data-violation="auto"]`);
      input.t007Field.querySelectorAll(`.t007-input-helper-text:not([data-violation="${violation}"])`).forEach((helper) => helper?.classList.remove("t007-input-show"));
      if (helper) helper.classList.toggle("t007-input-show", bool);
      else if (fallbackHelper) (fallbackHelper.textContent = input.validationMessage), fallbackHelper.classList.toggle("t007-input-show", bool);
    }
    function updatePasswordMeter(input) {
      const passwordMeter = input.t007Field.querySelector(".t007-input-password-meter");
      if (passwordMeter) passwordMeter.dataset.strengthLevel = `${getStrengthLevel(input.value, Number(input.minLength ?? 0))}`;
    }
    function validateInput(input, flag = false) {
      if (form.dataset.globalError || !input.classList.contains("t007-input")) return;
      updatePasswordMeter(input);
      let value, errorBool;
      switch (input.custom ?? input.getAttribute("custom")) {
        case "password":
          value = input.value?.trim();
          if (value === "") break;
          const confirmPasswordInput = Array.prototype.find.call(inputs, (input) => (input.custom ?? input.getAttribute("custom")) === "confirm-password");
          if (!confirmPasswordInput) break;
          const confirmPasswordValue = confirmPasswordInput.value?.trim();
          confirmPasswordInput.setCustomValidity(value !== confirmPasswordValue ? "Both passwords do not match" : "");
          toggleError(confirmPasswordInput, value !== confirmPasswordValue, flag);
          break;
        case "confirm_password":
          value = input.value?.trim();
          if (value === "") break;
          const passwordInput = Array.prototype.find.call(inputs, (input) => (input.custom ?? input.getAttribute("custom")) === "password");
          if (!passwordInput) break;
          const passwordValue = passwordInput.value?.trim();
          errorBool = value !== passwordValue;
          input.setCustomValidity(errorBool ? "Both passwords do not match" : "");
          break;
        case "onward_date":
          if (input.min) break;
          input.min = new Date().toISOString().split("T")[0];
          input.checkValidity(), input.dispatchEvent(new Event("input"));
          break;
        case "past_date":
          if (input.max) break;
          input.max = new Date().toISOString().split("T")[0];
          input.checkValidity(), input.dispatchEvent(new Event("input"));
          break;
      }
      if (input.type === "file") {
        input.Validity = {};
        const { violation, message } = t007.FM.getFilesHelper(input.files ?? [], { accept: input.accept, multiple: input.multiple, maxSize: input.maxSize ?? Number(input.getAttribute("maxsize")), minSize: input.minSize ?? Number(input.getAttribute("minsize")), maxTotalSize: input.maxTotalSize ?? Number(input.getAttribute("maxtotalsize")), minTotalSize: input.minTotalSize ?? Number(input.getAttribute("mintotalsize")), maxLength: input.maxLength ?? Number(input.getAttribute("maxlength")), minLength: input.minLength ?? Number(input.getAttribute("minLength")) });
        errorBool = !!message;
        input.setCustomValidity(message);
        if (violation) input.Validity[violation] = true;
      }
      errorBool = errorBool ?? !input.validity?.valid;
      toggleError(input, errorBool, flag);
      if (errorBool) return;
      if (input.type === "radio")
        Array.prototype.forEach.call(
          Array.prototype.filter.call(inputs, (i) => i.name == input.name),
          (radio) => toggleError(radio, errorBool, flag)
        );
    }
    function validateFormOnClient() {
      Array.prototype.forEach.call(inputs, (input) => validateInput(input, true));
      form.querySelector("input:invalid")?.focus();
      return Array.prototype.every.call(inputs, (input) => input.checkValidity());
    }
    function toggleFormGlobalError(bool) {
      form.toggleAttribute("data-global-error", bool);
      form.querySelectorAll(".t007-input-field").forEach((field) => {
        field.querySelector(".t007-input")?.toggleAttribute("data-error", bool);
        const floatingLabel = field.querySelector(".t007-input-floating-label");
        floatingLabel?.classList.toggle("t007-input-shake", bool), bool && setTimeout(() => floatingLabel?.classList.remove("t007-input-shake"), 520);
      });
    }
  },
};

const { field, handleFormValidation } = formManager;
export { formManager, field, handleFormValidation };

if ("undefined" !== typeof window) {
  t007.FM = t007.formManager = formManager;
  t007.field = field;
  t007.handleFormValidation = handleFormValidation;
  window.field ??= t007.field;
  window.handleFormValidation ??= t007.handleFormValidation;
  console.log("%cT007 Input helpers attached to window!", "color: darkturquoise");
  loadResource(T007_INPUT_CSS_SRC);
  t007.FM.init();
}
