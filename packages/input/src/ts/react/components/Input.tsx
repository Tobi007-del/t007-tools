"use client";
import React, { useRef, useEffect, useMemo, useState, useCallback, useImperativeHandle } from "react";
import type { t007InputElement, InputProps, InputAttributes as IA, SelectAttributes as SA, TextareaAttributes as TA, SelectElementProps as SEP, TextareaElementProps as TEP, CheckboxInputProps as CIP, FileInputProps as FIP, DateInputProps as DIP, PasswordInputProps as PIP, GenericInputProps as GIP } from "../types";
import { parentBeacon, violationKeys, unsafeProps } from "../utils/consts";
import { fireInput, rExclude } from "../utils/fn";
import { getFilesHelper, getStrengthLevel } from "../../utils/fn";
import { isNativeIconType } from "../../utils/consts";
import { useScrollAssist } from "@t007/utils/hooks/react";

export const Input = React.forwardRef<t007InputElement, InputProps>(function Input(props, ref) {
  const { isWrapper = false, label = "", type = "text", helperText, error, custom = "", className = "", fieldClassName = "", children, endIcon, bleedingEdge = true, ...otherProps } = props;
  // Narrow props correctly for each case :) ts gone wild
  let options: SEP["options"] | undefined;
  let indeterminate = false;
  let minLength: number | undefined;
  let maxLength: number | undefined;
  let maxSize: number | undefined;
  let minSize: number | undefined;
  let maxTotalSize: number | undefined;
  let minTotalSize: number | undefined;
  let nativeIcon: React.ReactNode | undefined;
  let passwordMeter = false;
  let eyeToggler = false;
  let passwordHiddenIcon: React.ReactNode | undefined;
  let passwordVisibleIcon: React.ReactNode | undefined;
  switch (type) {
    case "select":
      options = (props as SEP).options ?? [];
      break;
    case "checkbox":
      indeterminate = (props as CIP).indeterminate ?? false;
      break;
    case "file": {
      const { maxSize: maxS, minSize: minS, maxTotalSize: maxT, minTotalSize: minT } = props as FIP;
      maxSize = maxS;
      minSize = minS;
      maxTotalSize = maxT;
      minTotalSize = minT;
      break;
    }
    case "password": {
      const { passwordMeter: pm, eyeToggler: et, passwordHiddenIcon: phi, passwordVisibleIcon: pvi } = props as PIP;
      passwordMeter = pm ?? true;
      eyeToggler = et ?? true;
      passwordHiddenIcon = phi;
      passwordVisibleIcon = pvi;
      break;
    }
    default:
      if (isNativeIconType(type)) nativeIcon = (props as DIP).nativeIcon;
      else if (type !== "textarea" && type !== "select") {
        minLength = (props as GIP).minLength;
        maxLength = (props as GIP).maxLength;
      }
  }
  const helperTextMap = useMemo(() => (typeof helperText == "boolean" ? {} : helperText), [helperText])!;
  const inputRef = useRef<t007InputElement>(null);
  const helperTextWrapperRef = useRef<HTMLDivElement>(null);
  const [filled, setFilled] = useState(!!(otherProps.value || otherProps.defaultValue));
  const [visible, setVisible] = useState(false);
  const [violation, setViolation] = useState<keyof ValidityState | null>(null);
  const [violationMessage, setViolationMessage] = useState("");
  const [strengthLevel, setStrengthLevel] = useState(1);
  const [flagError, setFlagError] = useState(false);
  const [renotify, setRenotify] = useState(false);
  const isFile = type === "file";
  const isRadioOrCheckbox = type === "radio" || type === "checkbox";
  const hasValue = useCallback((el: t007InputElement) => !!(isFile ? (el as HTMLInputElement).files?.length : isRadioOrCheckbox ? (el as HTMLInputElement).checked : el.value.trim() !== ""), [isFile, isRadioOrCheckbox]);
  const togglePassword = () => setVisible((prev) => !prev);
  const updatePasswordStrength = useCallback((value: string) => type === "password" && passwordMeter && setStrengthLevel(getStrengthLevel(value, minLength)), [minLength, passwordMeter, type]);
  const validateInput = useCallback(
    (input: t007InputElement, flag?: boolean) => {
      let currentViolation: keyof ValidityState | null = null;
      if (input.type === "file") {
        const fileInput = input as HTMLInputElement;
        const { violation, message } = getFilesHelper(Array.from(fileInput.files ?? []), { accept: fileInput.accept, multiple: fileInput.multiple, maxSize, minSize, maxTotalSize, minTotalSize, maxLength, minLength });
        fileInput.setCustomValidity(message);
        currentViolation = violation;
      }
      currentViolation = violationKeys.find((violation) => violation === currentViolation || (input.validity as ValidityState)?.[violation]) || null;
      setViolation(currentViolation);
      setViolationMessage(currentViolation ? helperTextMap?.[currentViolation] || input.validationMessage : "");
      const errorBool = !!currentViolation;
      const formFlag = JSON.parse(inputRef.current?.closest(`[${parentBeacon}]`)?.getAttribute(parentBeacon) ?? "false");
      const shouldFlagError = flagError ? errorBool : (formFlag || flag) && errorBool;
      const shouldRenotify = (formFlag || flag) && shouldFlagError;
      setFlagError(shouldFlagError), setRenotify(shouldRenotify);
      shouldRenotify && setTimeout(() => setRenotify(false), 520);
    },
    [minSize, maxSize, maxTotalSize, minTotalSize, minLength, maxLength, flagError, helperTextMap]
  );
  const handleInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const form = el.closest("form");
    setFilled(hasValue(el)), el.type === "color" && (el.closest(".t007-input-field") as HTMLElement)?.style.setProperty("--input-color", el.value);
    updatePasswordStrength(el.value);
    if (custom === "confirm_password") {
      const passwordInput = form?.querySelector("[custom='password']") as HTMLInputElement;
      if (passwordInput) el.setCustomValidity(el.value.trim() === passwordInput.value.trim() ? "" : "Both passwords do not match");
    } else if (custom === "password") {
      const confirmInput = form?.querySelector("[custom='confirm_password']") as HTMLInputElement;
      if (confirmInput) confirmInput.setCustomValidity(el.value.trim() === confirmInput.value.trim() ? "" : "Both passwords do not match");
    }
    if (el.type === "radio") form?.querySelectorAll<t007InputElement>(".t007-input[name='radio']").forEach(fireInput);
    validateInput(el);
  }, [custom, hasValue, updatePasswordStrength, validateInput]);

  useEffect(() => void fireInput(inputRef.current), []);
  useEffect(() => inputRef.current?.setAttribute("custom", custom), [custom]);
  useScrollAssist(helperTextWrapperRef, { pxPerSecond: 80 });
  useImperativeHandle(ref, () => inputRef.current as t007InputElement);

  const Wrapper = isWrapper ? "div" : "label";
  return (
    <div className={`t007-input-field ${fieldClassName}${isWrapper ? " t007-input-is-wrapper" : ""}${indeterminate ? " t007-input-indeterminate" : ""}${nativeIcon ? " t007-input-icon-override" : ""}${helperText === false ? " t007-input-no-helper" : ""}${bleedingEdge ? " t007-input-bleeding-edge" : ""}`}>
      <Wrapper className={type === "checkbox" || type === "radio" ? `t007-input-${type}-wrapper` : "t007-input-wrapper"}>
        {type === "checkbox" || type === "radio" ? (
          <>
            <span className={`t007-input-${type}-box`}>
              <span className={`t007-input-${type}-tag`}></span>
            </span>
            <span className={`t007-input-${type}-label`}>{label}</span>
          </>
        ) : (
          <span className="t007-input-outline">
            <span className="t007-input-outline-leading"></span>
            <span className="t007-input-outline-notch">
              <span className={`t007-input-floating-label${renotify ? " t007-input-shake" : ""}`} onTransitionEnd={() => setRenotify(false)}>
                {label}
              </span>
            </span>
            <span className="t007-input-outline-trailing"></span>
          </span>
        )}
        {isWrapper ? (
          children
        ) : type === "select" ? (
          <select {...(rExclude(otherProps, unsafeProps) as SA)} ref={inputRef as React.RefObject<HTMLSelectElement>} className={`t007-input ${className}`} data-filled={filled || undefined} data-error={flagError || !!error || undefined} onBlur={(e) => (validateInput(e.target, true), (otherProps as SA).onBlur?.(e))} onInput={(e) => (handleInput(), (otherProps as SA).onInput?.(e))}>
            {options?.map((option, i) => (
              <option key={i} value={typeof option === "string" ? option : option.value}>
                {typeof option === "string" ? option : option.option}
              </option>
            ))}
            {React.Children.map(children, (child) => (React.isValidElement(child) && (child.type === "option" || child.type === "optgroup") ? child : null))}
          </select>
        ) : type === "textarea" ? (
          <textarea {...(rExclude(otherProps, unsafeProps) as TA)} ref={inputRef as React.RefObject<HTMLTextAreaElement>} className={`t007-input ${className}`} data-filled={filled || undefined} data-error={flagError || !!error || undefined} placeholder={(otherProps as TEP).placeholder || ""} onBlur={(e) => (validateInput(e.target, true), (otherProps as TA).onBlur?.(e))} onInput={(e) => (handleInput(), (otherProps as TA).onInput?.(e))}>
            {typeof children === "string" || typeof children === "number" ? children : undefined}
          </textarea>
        ) : (
          <input {...(rExclude(otherProps, unsafeProps) as IA)} ref={inputRef as React.RefObject<HTMLInputElement>} className={`t007-input ${className}`} data-filled={filled || undefined} data-error={flagError || !!error || undefined} placeholder={(otherProps as GIP).placeholder || ""} type={type === "password" && visible ? "text" : type} min={custom === "onward_date" ? new Date().toISOString().split("T")[0] : (otherProps as GIP).min} max={custom === "past_date" ? new Date().toISOString().split("T")[0] : (otherProps as GIP).max} onBlur={(e) => (validateInput(e.target, true), (otherProps as IA).onBlur?.(e))} onInput={(e) => (handleInput(), (otherProps as IA).onInput?.(e))} />
        )}
        {isNativeIconType(type) && nativeIcon ? <i className="t007-input-icon">{nativeIcon}</i> : endIcon ? <i className="t007-input-icon">{endIcon}</i> : null}
        {eyeToggler && type === "password" && (
          <>
            <i className="t007-input-icon t007-input-password-visible-icon" onClick={togglePassword} aria-label="Show password" role="button">
              {passwordVisibleIcon || (
                <svg width="24" height="24">
                  <path fill="rgba(0,0,0,.54)" d="M12 16q1.875 0 3.188-1.312Q16.5 13.375 16.5 11.5q0-1.875-1.312-3.188Q13.875 7 12 7q-1.875 0-3.188 1.312Q7.5 9.625 7.5 11.5q0 1.875 1.312 3.188Q10.125 16 12 16Zm0-1.8q-1.125 0-1.912-.788Q9.3 12.625 9.3 11.5t.788-1.913Q10.875 8.8 12 8.8t1.913.787q.787.788.787 1.913t-.787 1.912q-.788.788-1.913.788Zm0 4.8q-3.65 0-6.65-2.038-3-2.037-4.35-5.462 1.35-3.425 4.35-5.463Q8.35 4 12 4q3.65 0 6.65 2.037 3 2.038 4.35 5.463-1.35 3.425-4.35 5.462Q15.65 19 12 19Z" />
                </svg>
              )}
            </i>
            <i className="t007-input-icon t007-input-password-hidden-icon" onClick={togglePassword} aria-label="Hide password" role="button">
              {passwordHiddenIcon || (
                <svg width="24" height="24">
                  <path fill="rgba(0,0,0,.54)" d="m19.8 22.6-4.2-4.15q-.875.275-1.762.413Q12.95 19 12 19q-3.775 0-6.725-2.087Q2.325 14.825 1 11.5q.525-1.325 1.325-2.463Q3.125 7.9 4.15 7L1.4 4.2l1.4-1.4 18.4 18.4ZM12 16q.275 0 .512-.025.238-.025.513-.1l-5.4-5.4q-.075.275-.1.513-.025.237-.025.512 0 1.875 1.312 3.188Q10.125 16 12 16Zm7.3.45-3.175-3.15q.175-.425.275-.862.1-.438.1-.938 0-1.875-1.312-3.188Q13.875 7 12 7q-.5 0-.938.1-.437.1-.862.3L7.65 4.85q1.025-.425 2.1-.638Q10.825 4 12 4q3.775 0 6.725 2.087Q21.675 8.175 23 11.5q-.575 1.475-1.512 2.738Q20.55 15.5 19.3 16.45Zm-4.625-4.6-3-3q.7-.125 1.288.112.587.238 1.012.688.425.45.613 1.038.187.587.087 1.162Z" />
                </svg>
              )}
            </i>
          </>
        )}
      </Wrapper>
      {helperText !== false && (
        <div className="t007-input-helper-line">
          <div ref={helperTextWrapperRef} className="t007-input-helper-text-wrapper">
            {violation && flagError ? (
              <p className="t007-input-helper-text t007-input-show" data-violation={violation || "auto"}>
                {violationMessage}
              </p>
            ) : error ? (
              <p className="t007-input-helper-text t007-input-show" data-violation="error">
                {error}
              </p>
            ) : helperTextMap?.info ? (
              <p className="t007-input-helper-text" data-violation="none">
                {helperTextMap.info}
              </p>
            ) : null}
          </div>
        </div>
      )}
      {type === "password" && passwordMeter && (
        <div className="t007-input-password-meter" data-strength-level={strengthLevel}>
          <div className="t007-input-password-strength-meter">
            <div className="t007-input-p-weak"></div>
            <div className="t007-input-p-fair"></div>
            <div className="t007-input-p-strong"></div>
            <div className="t007-input-p-very-strong"></div>
          </div>
        </div>
      )}
    </div>
  );
});

Input.displayName = "Input";
