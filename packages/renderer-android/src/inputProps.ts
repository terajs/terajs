export interface AndroidNormalizedInputProp {
  name: string;
  value: unknown;
}

const AndroidInputTraitViewTypes = new Set(["EditText"]);

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

function resolveAndroidInputType(value: unknown): string | null {
  const normalized = normalizeStringValue(value);
  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "email":
    case "emailaddress":
      return "textEmailAddress";
    case "tel":
    case "phone":
    case "telephone":
      return "phone";
    case "url":
      return "textUri";
    case "numeric":
    case "number":
      return "number";
    case "decimal":
      return "numberDecimal";
    case "search":
      return "text";
    default:
      return "text";
  }
}

function resolveAndroidImeOptions(value: unknown): string | null {
  const normalized = normalizeStringValue(value);
  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "go":
      return "actionGo";
    case "next":
      return "actionNext";
    case "search":
      return "actionSearch";
    case "send":
      return "actionSend";
    default:
      return "actionDone";
  }
}

export function normalizeAndroidInputProp(
  viewType: string,
  name: string,
  value: unknown
): AndroidNormalizedInputProp | null {
  const normalizedKey = normalizeInputKey(name);

  if (viewType === "EditText" && ["placeholder", "hint", "placeholdertext"].includes(normalizedKey)) {
    return {
      name: "hint",
      value
    };
  }

  if (!AndroidInputTraitViewTypes.has(viewType)) {
    return null;
  }

  if (["secure", "securetextentry", "password"].includes(normalizedKey)) {
    return {
      name: "password",
      value: normalizeBooleanValue(value)
    };
  }

  if (normalizedKey === "type") {
    return {
      name: "password",
      value: normalizeStringValue(value) === "password"
    };
  }

  if (["inputmode", "inputtype", "keyboardtype"].includes(normalizedKey)) {
    return {
      name: "inputType",
      value: resolveAndroidInputType(value)
    };
  }

  if (["enterkeyhint", "imeoptions", "imeoption"].includes(normalizedKey)) {
    return {
      name: "imeOptions",
      value: resolveAndroidImeOptions(value)
    };
  }

  return null;
}