export interface UIKitNativeSelectionRange {
  start: number;
  end: number;
}

function normalizeSelectionIndex(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function extractRangeFromSelectionValue(value: unknown): UIKitNativeSelectionRange | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return {
      start: value,
      end: value
    };
  }

  if (Array.isArray(value)) {
    const start = normalizeSelectionIndex(value[0]);
    const end = normalizeSelectionIndex(value[1]);
    const resolvedStart = start ?? end;
    const resolvedEnd = end ?? resolvedStart;
    if (resolvedStart == null || resolvedEnd == null) {
      return undefined;
    }

    return {
      start: resolvedStart,
      end: resolvedEnd
    };
  }

  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if (record.selection !== undefined && record.selection !== value) {
    const nested = extractRangeFromSelectionValue(record.selection);
    if (nested) {
      return nested;
    }
  }

  if (record.selectionRange !== undefined && record.selectionRange !== value) {
    const nested = extractRangeFromSelectionValue(record.selectionRange);
    if (nested) {
      return nested;
    }
  }

  const selectionStart = normalizeSelectionIndex(record.selectionStart);
  const selectionEnd = normalizeSelectionIndex(record.selectionEnd);
  const start = normalizeSelectionIndex(record.start) ?? selectionStart;
  const end = normalizeSelectionIndex(record.end) ?? selectionEnd;
  const caret = normalizeSelectionIndex(record.caret);
  const resolvedStart = start ?? caret;
  const resolvedEnd = end ?? resolvedStart;

  if (resolvedStart == null || resolvedEnd == null) {
    return undefined;
  }

  return {
    start: resolvedStart,
    end: resolvedEnd
  };
}

export function extractUIKitSelectionRange(payload: unknown): UIKitNativeSelectionRange | undefined {
  return extractRangeFromSelectionValue(payload);
}

export function createUIKitSelectionPayload(range: UIKitNativeSelectionRange, payload: unknown): unknown {
  const selection = {
    start: range.start,
    end: range.end
  };

  if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
    return {
      ...(payload as Record<string, unknown>),
      start: range.start,
      end: range.end,
      selectionStart: range.start,
      selectionEnd: range.end,
      selection,
      selectionRange: selection
    };
  }

  return {
    start: range.start,
    end: range.end,
    selectionStart: range.start,
    selectionEnd: range.end,
    selection,
    selectionRange: selection
  };
}