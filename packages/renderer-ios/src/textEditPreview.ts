import {
  extractUIKitSelectionRange,
  type UIKitNativeSelectionRange,
} from "./selectionEventPayload.js";

export interface UIKitTextEditPreviewState {
  currentText: string;
  currentSelection: UIKitNativeSelectionRange;
  replacementRange: UIKitNativeSelectionRange;
  text: string;
  selectionRange: UIKitNativeSelectionRange;
}

export interface UIKitTextEditPreviewOptions {
  record?: Record<string, unknown>;
  inputType?: string;
  allowDeleteInference?: boolean;
}

export function extractUIKitTextEditRecord(payload: unknown): Record<string, unknown> | undefined {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return undefined;
  }

  return payload as Record<string, unknown>;
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

function clampRange(range: UIKitNativeSelectionRange, maximum: number): UIKitNativeSelectionRange {
  const start = Math.min(Math.max(0, range.start), maximum);
  const end = Math.min(Math.max(0, range.end), maximum);
  return start <= end ? { start, end } : { start: end, end: start };
}

function extractRangeLike(value: unknown): UIKitNativeSelectionRange | undefined {
  const directRange = extractUIKitSelectionRange(value);
  if (directRange) {
    return directRange;
  }

  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const start = normalizeSelectionIndex(record.startOffset ?? record.rangeStart ?? record.from ?? record.location);
  const length = normalizeSelectionIndex(record.length);
  const end = normalizeSelectionIndex(record.endOffset ?? record.rangeEnd ?? record.to)
    ?? (start != null && length != null ? start + length : undefined);

  if (start == null || end == null) {
    return undefined;
  }

  return {
    start,
    end
  };
}

function getCurrentText(props: Record<string, unknown>): string {
  return typeof props.text === "string" ? props.text : "";
}

function getCurrentSelectionRange(props: Record<string, unknown>, currentText: string): UIKitNativeSelectionRange {
  const start = normalizeSelectionIndex(props.selectionStart);
  const end = normalizeSelectionIndex(props.selectionEnd);
  const fallback = currentText.length;
  return clampRange({
    start: start ?? end ?? fallback,
    end: end ?? start ?? fallback
  }, currentText.length);
}

function extractExplicitRange(record: Record<string, unknown> | undefined): UIKitNativeSelectionRange | undefined {
  const targetRanges = Array.isArray(record?.targetRanges) ? record.targetRanges as unknown[] : undefined;
  return record
    ? extractRangeLike(record.replacementRange)
      ?? extractRangeLike(record.replaceRange)
      ?? extractRangeLike(record.targetRange)
      ?? extractRangeLike(record.range)
      ?? (targetRanges ? targetRanges.map(extractRangeLike).find((range) => range != null) : undefined)
    : undefined;
}

export function extractUIKitTextEditString(
  record: Record<string, unknown> | undefined,
  payload: unknown,
  keys: readonly string[] = ["data", "insertedText", "insertText", "replacementText"]
): string | undefined {
  if (record) {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string") {
        return value;
      }
    }
  }

  return typeof payload === "string" ? payload : undefined;
}

function inferDeleteRange(
  inputType: string | undefined,
  currentSelection: UIKitNativeSelectionRange,
  currentText: string,
  explicitRange: UIKitNativeSelectionRange | undefined
): UIKitNativeSelectionRange | undefined {
  if (explicitRange || currentSelection.start !== currentSelection.end) {
    return undefined;
  }

  const normalizedType = inputType?.trim().toLowerCase();
  if (!normalizedType?.startsWith("delete")) {
    return undefined;
  }

  if (normalizedType.includes("forward")) {
    return currentSelection.start >= currentText.length
      ? undefined
      : { start: currentSelection.start, end: currentSelection.start + 1 };
  }

  return currentSelection.start <= 0
    ? undefined
    : { start: currentSelection.start - 1, end: currentSelection.start };
}

function applyReplacement(text: string, replacementRange: UIKitNativeSelectionRange, replacementText: string): string {
  return text.slice(0, replacementRange.start) + replacementText + text.slice(replacementRange.end);
}

function createResultSelectionRange(
  text: string,
  replacementRange: UIKitNativeSelectionRange,
  replacementText: string
): UIKitNativeSelectionRange {
  const caret = Math.min(replacementRange.start + replacementText.length, text.length);
  return {
    start: caret,
    end: caret
  };
}

export function resolveUIKitTextEditPreview(
  props: Record<string, unknown>,
  payload: unknown,
  replacementText: string,
  options: UIKitTextEditPreviewOptions = {}
): UIKitTextEditPreviewState {
  const record = options.record ?? extractUIKitTextEditRecord(payload);
  const currentText = getCurrentText(props);
  const currentSelection = getCurrentSelectionRange(props, currentText);
  const explicitRange = extractExplicitRange(record);
  const baseReplacementRange = clampRange(
    explicitRange ?? extractUIKitSelectionRange(payload) ?? currentSelection,
    currentText.length
  );
  const replacementRange = clampRange(
    options.allowDeleteInference
      ? inferDeleteRange(options.inputType, currentSelection, currentText, explicitRange) ?? baseReplacementRange
      : baseReplacementRange,
    currentText.length
  );
  const text = applyReplacement(currentText, replacementRange, replacementText);

  return {
    currentText,
    currentSelection,
    replacementRange,
    text,
    selectionRange: createResultSelectionRange(text, replacementRange, replacementText)
  };
}