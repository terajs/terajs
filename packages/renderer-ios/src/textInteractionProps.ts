export interface UIKitNormalizedTextInteractionProp {
  name: string;
  value: unknown;
}

const UIKitTextInteractionViewTypes = new Set(["UITextView"]);

function normalizeInteractionKey(name: string): string {
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

function resolveEditableValue(normalizedKey: string, value: unknown): boolean | null {
  const normalizedValue = normalizeBooleanValue(value);
  if (normalizedValue == null) {
    return null;
  }

  if (normalizedKey === "readonly") {
    return !normalizedValue;
  }

  return normalizedValue;
}

export function normalizeUIKitTextInteractionProp(
  viewType: string,
  name: string,
  value: unknown
): UIKitNormalizedTextInteractionProp | null {
  if (!UIKitTextInteractionViewTypes.has(viewType)) {
    return null;
  }

  const normalizedKey = normalizeInteractionKey(name);

  if (["editable", "readonly"].includes(normalizedKey)) {
    return {
      name: "editable",
      value: resolveEditableValue(normalizedKey, value)
    };
  }

  if (["selectable", "textselectable", "selectionenabled"].includes(normalizedKey)) {
    return {
      name: "selectable",
      value: normalizeBooleanValue(value)
    };
  }

  return null;
}