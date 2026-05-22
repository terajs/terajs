import { normalizeUIKitInputProp } from "./inputProps.js";
import { normalizeUIKitTextInteractionProp } from "./textInteractionProps.js";
import { normalizeUIKitTextLayoutProp } from "./textLayoutProps.js";
import { normalizeUIKitTextViewportProp } from "./textViewportProps.js";

const UIKitTextPropViewTypes = new Set(["UIButton", "UILabel", "UITextField", "UITextView"]);
const UIKitImagePropViewTypes = new Set(["UIImageView"]);

export interface UIKitNormalizedProp {
  name: string;
  value: unknown;
  additional?: Array<{
    name: string;
    value: unknown;
  }>;
}

function normalizeNativeKey(name: string): string {
  return name.replace(/[-_\s]/g, "").toLowerCase();
}

export function normalizeUIKitProp(viewType: string, name: string, value: unknown): UIKitNormalizedProp {
  const normalizedKey = normalizeNativeKey(name);

  const inputProp = normalizeUIKitInputProp(viewType, name, value);
  if (inputProp) {
    return inputProp;
  }

  const textLayoutProp = normalizeUIKitTextLayoutProp(viewType, name, value);
  if (textLayoutProp) {
    return textLayoutProp;
  }

  const textViewportProp = normalizeUIKitTextViewportProp(viewType, name, value);
  if (textViewportProp) {
    return textViewportProp;
  }

  const textInteractionProp = normalizeUIKitTextInteractionProp(viewType, name, value);
  if (textInteractionProp) {
    return textInteractionProp;
  }

  if (UIKitImagePropViewTypes.has(viewType) && normalizedKey === "alt") {
    return {
      name: "accessibilityLabel",
      value
    };
  }

  if (
    normalizedKey === "arialabel"
    || normalizedKey === "accessibilitylabel"
    || normalizedKey === "contentdescription"
  ) {
    return {
      name: "accessibilityLabel",
      value
    };
  }

  if (UIKitTextPropViewTypes.has(viewType) && ["text", "title", "label", "value"].includes(normalizedKey)) {
    return {
      name: "text",
      value
    };
  }

  if (UIKitImagePropViewTypes.has(viewType) && ["src", "source", "imagesource"].includes(normalizedKey)) {
    return {
      name: "source",
      value
    };
  }

  if (viewType === "UISwitch" && ["checked", "on"].includes(normalizedKey)) {
    return {
      name: "on",
      value: Boolean(value)
    };
  }

  return {
    name,
    value
  };
}

export function normalizeUIKitEventName(viewType: string, name: string): string {
  const normalizedKey = normalizeNativeKey(name);

  if (["click", "press", "tap"].includes(normalizedKey)) {
    return "tap";
  }

  if (
    ["change", "input", "toggle"].includes(normalizedKey)
    && viewType === "UISwitch"
  ) {
    return "change";
  }

  if (
    ["input", "change", "textinput"].includes(normalizedKey)
    && ["UITextField", "UITextView"].includes(viewType)
  ) {
    return "change";
  }

  if (
    ["selectionchange", "selection", "select", "caretchange", "cursorchange"].includes(normalizedKey)
    && ["UITextField", "UITextView"].includes(viewType)
  ) {
    return "selectionchange";
  }

  return name;
}