import {
  createAndroidSelectionPayload,
  extractAndroidSelectionRange,
  type AndroidNativeSelectionRange,
} from "./selectionEventPayload.js";

export interface AndroidBeforeInputEventState {
  text: string;
  data: string;
  inputType: string;
  replacementRange: AndroidNativeSelectionRange;
  selectionRange: AndroidNativeSelectionRange;
}

function extractPayloadRecord(payload: unknown): Record<string, unknown> | undefined {
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

function clampRange(range: AndroidNativeSelectionRange, maximum: number): AndroidNativeSelectionRange {
  const start = Math.min(Math.max(0, range.start), maximum);
  const end = Math.min(Math.max(0, range.end), maximum);
  return start <= end ? { start, end } : { start: end, end: start };
}

function extractRangeLike(value: unknown): AndroidNativeSelectionRange | undefined {
  const directRange = extractAndroidSelectionRange(value);
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

function getCurrentSelectionRange(props: Record<string, unknown>, currentText: string): AndroidNativeSelectionRange {
  const start = normalizeSelectionIndex(props.selectionStart);
  const end = normalizeSelectionIndex(props.selectionEnd);
  const fallback = currentText.length;
  return clampRange({
    start: start ?? end ?? fallback,
    end: end ?? start ?? fallback
  }, currentText.length);
}

function extractReplacementRange(
  record: Record<string, unknown> | undefined,
  payload: unknown,
  currentSelection: AndroidNativeSelectionRange,
  maximum: number
): AndroidNativeSelectionRange {
  const targetRanges = Array.isArray(record?.targetRanges) ? record?.targetRanges as unknown[] : undefined;
  const explicitRange = record
    ? extractRangeLike(record.replacementRange)
      ?? extractRangeLike(record.replaceRange)
      ?? extractRangeLike(record.targetRange)
      ?? extractRangeLike(record.range)
      ?? (targetRanges ? targetRanges.map(extractRangeLike).find((range) => range != null) : undefined)
    : undefined;

  return clampRange(explicitRange ?? extractAndroidSelectionRange(payload) ?? currentSelection, maximum);
}

function extractReplacementText(record: Record<string, unknown> | undefined, payload: unknown): string {
  if (record) {
    const candidates = [record.data, record.insertedText, record.insertText, record.replacementText];
    for (const candidate of candidates) {
      if (typeof candidate === "string") {
        return candidate;
      }
    }
  }

  return typeof payload === "string" ? payload : "";
}

function extractInputType(
  record: Record<string, unknown> | undefined,
  replacementText: string,
  replacementRange: AndroidNativeSelectionRange
): string {
  if (record && typeof record.inputType === "string" && record.inputType.trim()) {
    return record.inputType;
  }

  if (!replacementText && replacementRange.start !== replacementRange.end) {
    return "deleteContent";
  }

  return "insertText";
}

function inferDeleteRange(
  inputType: string,
  currentSelection: AndroidNativeSelectionRange,
  currentText: string,
  explicitRange: AndroidNativeSelectionRange | undefined
): AndroidNativeSelectionRange | undefined {
  if (explicitRange || currentSelection.start !== currentSelection.end) {
    return undefined;
  }

  const normalizedType = inputType.trim().toLowerCase();
  if (!normalizedType.startsWith("delete")) {
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

function applyReplacement(text: string, replacementRange: AndroidNativeSelectionRange, replacementText: string): string {
  return text.slice(0, replacementRange.start) + replacementText + text.slice(replacementRange.end);
}

function createResultSelectionRange(text: string, replacementRange: AndroidNativeSelectionRange, replacementText: string): AndroidNativeSelectionRange {
  const caret = Math.min(replacementRange.start + replacementText.length, text.length);
  return {
    start: caret,
    end: caret
  };
}

export function extractAndroidBeforeInputState(
  props: Record<string, unknown>,
  payload: unknown
): AndroidBeforeInputEventState {
  const record = extractPayloadRecord(payload);
  const currentText = getCurrentText(props);
  const currentSelection = getCurrentSelectionRange(props, currentText);
  const data = extractReplacementText(record, payload);
  const baseReplacementRange = extractReplacementRange(record, payload, currentSelection, currentText.length);
  const inputType = extractInputType(record, data, baseReplacementRange);
  const replacementRange = clampRange(
    inferDeleteRange(inputType, currentSelection, currentText, record ? extractRangeLike(record.replacementRange)
      ?? extractRangeLike(record.replaceRange)
      ?? extractRangeLike(record.targetRange)
      ?? extractRangeLike(record.range)
      ?? (Array.isArray(record.targetRanges) ? (record.targetRanges as unknown[]).map(extractRangeLike).find((range) => range != null) : undefined)
      : undefined) ?? baseReplacementRange,
    currentText.length
  );
  const text = applyReplacement(currentText, replacementRange, data);

  return {
    text,
    data,
    inputType,
    replacementRange,
    selectionRange: createResultSelectionRange(text, replacementRange, data)
  };
}

export function createAndroidBeforeInputPayload(state: AndroidBeforeInputEventState, payload: unknown): unknown {
  const selectionPayload = createAndroidSelectionPayload(state.selectionRange, payload);
  const base = typeof selectionPayload === "object" && selectionPayload !== null && !Array.isArray(selectionPayload)
    ? { ...(selectionPayload as Record<string, unknown>) }
    : {};

  return {
    ...base,
    text: state.text,
    value: state.text,
    data: state.data,
    inputType: state.inputType,
    replacementRange: {
      start: state.replacementRange.start,
      end: state.replacementRange.end
    }
  };
}