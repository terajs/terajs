export interface AndroidNormalizedTextLimitProp {
  name: string;
  value: unknown;
}

const AndroidTextLimitViewTypes = new Set(["EditText"]);

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

export function normalizeAndroidTextLimitProp(
  viewType: string,
  name: string,
  value: unknown
): AndroidNormalizedTextLimitProp | null {
  if (!AndroidTextLimitViewTypes.has(viewType)) {
    return null;
  }

  const normalizedKey = normalizeLimitKey(name);

  if (["maxlength", "maxcharacters", "characterlimit", "textlimit"].includes(normalizedKey)) {
    return {
      name: "maxLength",
      value: normalizeLimitValue(value)
    };
  }

  return null;
}