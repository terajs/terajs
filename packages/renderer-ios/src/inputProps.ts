export interface UIKitNormalizedInputProp {
  name: string;
  value: unknown;
}

const UIKitPlaceholderViewTypes = new Set(["UITextField"]);
const UIKitInputTraitViewTypes = new Set(["UITextField", "UITextView"]);

function normalizeInputKey(name: string): string {
  return name.replace(/[-_\s]/g, "").toLowerCase();
}

function normalizeBooleanValue(value: unknown): boolean | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    if (["false", "0", "off", "no"].includes(normalized)) {
      return false;
    }

    if (["true", "1", "on", "yes"].includes(normalized)) {
      return true;
    }
  }

  return Boolean(value);
}

function normalizeStringValue(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  return String(value).trim().toLowerCase();
}

function resolveUIKitKeyboardType(value: unknown): string | null {
  const normalized = normalizeStringValue(value);
  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "email":
    case "emailaddress":
      return "emailAddress";
    case "tel":
    case "phone":
    case "telephone":
      return "phonePad";
    case "url":
      return "URL";
    case "numeric":
    case "number":
      return "numberPad";
    case "decimal":
      return "decimalPad";
    case "search":
      return "webSearch";
    default:
      return "default";
  }
}

function resolveUIKitReturnKeyType(value: unknown): string | null {
  const normalized = normalizeStringValue(value);
  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "go":
    case "done":
    case "next":
    case "search":
    case "send":
      return normalized;
    default:
      return "default";
  }
}

function resolveUIKitAutocapitalizationType(value: unknown): string | null {
  const normalized = normalizeStringValue(value);
  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "off":
    case "false":
    case "no":
    case "none":
      return "none";
    case "words":
      return "words";
    case "characters":
    case "allcharacters":
      return "allCharacters";
    default:
      return "sentences";
  }
}

function resolveUIKitAutocorrectionType(value: unknown): string | null {
  const normalized = normalizeStringValue(value);
  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "off":
    case "false":
    case "no":
      return "no";
    case "default":
      return "default";
    default:
      return "yes";
  }
}

export function normalizeUIKitInputProp(
  viewType: string,
  name: string,
  value: unknown
): UIKitNormalizedInputProp | null {
  const normalizedKey = normalizeInputKey(name);

  if (UIKitPlaceholderViewTypes.has(viewType) && ["placeholder", "hint", "placeholdertext"].includes(normalizedKey)) {
    return {
      name: "placeholder",
      value
    };
  }

  if (!UIKitInputTraitViewTypes.has(viewType)) {
    return null;
  }

  if (["secure", "securetextentry", "password"].includes(normalizedKey)) {
    return {
      name: "secureTextEntry",
      value: normalizeBooleanValue(value)
    };
  }

  if (normalizedKey === "type") {
    return {
      name: "secureTextEntry",
      value: normalizeStringValue(value) === "password"
    };
  }

  if (["inputmode", "keyboardtype"].includes(normalizedKey)) {
    return {
      name: "keyboardType",
      value: resolveUIKitKeyboardType(value)
    };
  }

  if (["enterkeyhint", "returnkeytype"].includes(normalizedKey)) {
    return {
      name: "returnKeyType",
      value: resolveUIKitReturnKeyType(value)
    };
  }

  if (["autocapitalize", "autocapitalization", "autocapitalizationtype"].includes(normalizedKey)) {
    return {
      name: "autocapitalizationType",
      value: resolveUIKitAutocapitalizationType(value)
    };
  }

  if (["autocorrect", "autocorrection", "autocorrectiontype"].includes(normalizedKey)) {
    return {
      name: "autocorrectionType",
      value: resolveUIKitAutocorrectionType(value)
    };
  }

  return null;
}