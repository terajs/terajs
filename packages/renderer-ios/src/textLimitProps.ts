export interface UIKitNormalizedTextLimitProp {
  name: string;
  value: unknown;
}

const UIKitTextLimitViewTypes = new Set(["UITextField", "UITextView"]);

function normalizeLimitKey(name: string): string {
  return name.replace(/[-_\s]/g, "").toLowerCase();
}

function normalizeLimitValue(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.trunc(parsed));
    }
  }

  return null;
}

export function normalizeUIKitTextLimitProp(
  viewType: string,
  name: string,
  value: unknown
): UIKitNormalizedTextLimitProp | null {
  if (!UIKitTextLimitViewTypes.has(viewType)) {
    return null;
  }

  const normalizedKey = normalizeLimitKey(name);

  if (["maxlength", "maxcharacters", "characterlimit", "textlimit"].includes(normalizedKey)) {
    return {
      name: "maximumTextLength",
      value: normalizeLimitValue(value)
    };
  }

  return null;
}