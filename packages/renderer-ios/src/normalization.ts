const UIKitTextPropViewTypes = new Set(["UIButton", "UILabel", "UITextField", "UITextView"]);
const UIKitImagePropViewTypes = new Set(["UIImageView"]);

export interface UIKitNormalizedProp {
  name: string;
  value: unknown;
}

function normalizeNativeKey(name: string): string {
  return name.replace(/[-_\s]/g, "").toLowerCase();
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

  return name;
}