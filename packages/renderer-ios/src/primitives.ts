const UIKitViewTypeByTag: Record<string, string> = {
  a: "UILabel",
  article: "UIView",
  aside: "UIView",
  button: "UIButton",
  div: "UIView",
  em: "UILabel",
  footer: "UIView",
  form: "UIView",
  h1: "UILabel",
  h2: "UILabel",
  h3: "UILabel",
  h4: "UILabel",
  h5: "UILabel",
  h6: "UILabel",
  header: "UIView",
  img: "UIImageView",
  image: "UIImageView",
  input: "UITextField",
  label: "UILabel",
  li: "UIView",
  main: "UIView",
  nav: "UIView",
  ol: "UIView",
  p: "UILabel",
  scrollview: "UIScrollView",
  section: "UIView",
  select: "UIPickerView",
  small: "UILabel",
  span: "UILabel",
  stack: "UIStackView",
  strong: "UILabel",
  switch: "UISwitch",
  textarea: "UITextView",
  toggle: "UISwitch",
  "button-view": "UIButton",
  "image-view": "UIImageView",
  "scroll-view": "UIScrollView",
  "stack-view": "UIStackView",
  "text-input": "UITextField",
  "text-view": "UILabel",
  "ui-button": "UIButton",
  "ui-image": "UIImageView",
  "ui-input": "UITextField",
  "ui-label": "UILabel",
  "ui-scroll-view": "UIScrollView",
  "ui-stack": "UIStackView",
  "ui-switch": "UISwitch",
  "ui-text-view": "UITextView",
  ul: "UIView"
};

const UIKitTextPropViewTypes = new Set(["UIButton", "UILabel", "UITextField", "UITextView"]);
const UIKitImagePropViewTypes = new Set(["UIImageView"]);

export interface UIKitNormalizedProp {
  name: string;
  value: unknown;
}

function normalizeNativeKey(name: string): string {
  return name.replace(/[-_\s]/g, "").toLowerCase();
}

/**
 * Resolves Terajs element tags to concrete UIKit view types inside the iOS package.
 * Standard HTML-like tags and native-flavored tags both collapse to UIKit primitives.
 */
export function resolveUIKitViewType(tag: string): string {
  const trimmed = tag.trim();
  if (!trimmed) {
    return "UIView";
  }

  const mapped = UIKitViewTypeByTag[trimmed.toLowerCase()];
  if (mapped) {
    return mapped;
  }

  if (trimmed.startsWith("UI")) {
    return trimmed;
  }

  return trimmed;
}

export function normalizeUIKitProp(viewType: string, name: string, value: unknown): UIKitNormalizedProp {
  const normalizedKey = normalizeNativeKey(name);

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
    ["input", "change", "textinput"].includes(normalizedKey)
    && ["UITextField", "UITextView"].includes(viewType)
  ) {
    return "change";
  }

  return name;
}