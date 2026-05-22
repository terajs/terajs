export interface UIKitNormalizedTextLayoutProp {
  name: string;
  value: unknown;
}

const UIKitMultilineLayoutViewTypes = new Set(["UITextView"]);

function normalizeLayoutKey(name: string): string {
  return name.replace(/[-_\s]/g, "").toLowerCase();
}

function normalizeLineCount(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.trunc(value));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.trunc(parsed));
    }
  }

  return null;
}

export function normalizeUIKitTextLayoutProp(
  viewType: string,
  name: string,
  value: unknown
): UIKitNormalizedTextLayoutProp | null {
  if (!UIKitMultilineLayoutViewTypes.has(viewType)) {
    return null;
  }

  const normalizedKey = normalizeLayoutKey(name);

  if (["rows", "lines"].includes(normalizedKey)) {
    return {
      name: "preferredLineCount",
      value: normalizeLineCount(value)
    };
  }

  if (["minrows", "minlines"].includes(normalizedKey)) {
    return {
      name: "minimumLineCount",
      value: normalizeLineCount(value)
    };
  }

  if (["maxrows", "maxlines"].includes(normalizedKey)) {
    return {
      name: "maximumLineCount",
      value: normalizeLineCount(value)
    };
  }

  return null;
}