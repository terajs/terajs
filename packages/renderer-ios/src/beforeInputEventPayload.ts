import {
  createUIKitSelectionPayload,
  extractUIKitSelectionRange,
  type UIKitNativeSelectionRange,
} from "./selectionEventPayload.js";

export interface UIKitBeforeInputEventState {
  text: string;
  data: string;
  inputType: string;
  replacementRange: UIKitNativeSelectionRange;
  selectionRange: UIKitNativeSelectionRange;
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

function clampRange(range: UIKitNativeSelectionRange, maximum: number): UIKitNativeSelectionRange {
  const start = Math.min(Math.max(0, range.start), maximum);
  const end = Math.min(Math.max(0, range.end), maximum);
  return start <= end ? { start, end } : { start: end, end: start };
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

function extractReplacementRange(
  record: Record<string, unknown> | undefined,
  payload: unknown,
  currentSelection: UIKitNativeSelectionRange,
  maximum: number
): UIKitNativeSelectionRange {
  const explicitRange = record
    ? extractUIKitSelectionRange(record.replacementRange)
      ?? extractUIKitSelectionRange(record.replaceRange)
      ?? extractUIKitSelectionRange(record.targetRange)
    : undefined;

  return clampRange(explicitRange ?? extractUIKitSelectionRange(payload) ?? currentSelection, maximum);
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
  replacementRange: UIKitNativeSelectionRange
): string {
  if (record && typeof record.inputType === "string" && record.inputType.trim()) {
    return record.inputType;
  }

  if (!replacementText && replacementRange.start !== replacementRange.end) {
    return "deleteContent";
  }

  return "insertText";
}

function applyReplacement(text: string, replacementRange: UIKitNativeSelectionRange, replacementText: string): string {
  return text.slice(0, replacementRange.start) + replacementText + text.slice(replacementRange.end);
}

function createResultSelectionRange(text: string, replacementRange: UIKitNativeSelectionRange, replacementText: string): UIKitNativeSelectionRange {
  const caret = Math.min(replacementRange.start + replacementText.length, text.length);
  return {
    start: caret,
    end: caret
  };
}

export function extractUIKitBeforeInputState(
  props: Record<string, unknown>,
  payload: unknown
): UIKitBeforeInputEventState {
  const record = extractPayloadRecord(payload);
  const currentText = getCurrentText(props);
  const currentSelection = getCurrentSelectionRange(props, currentText);
  const replacementRange = extractReplacementRange(record, payload, currentSelection, currentText.length);
  const data = extractReplacementText(record, payload);
  const text = applyReplacement(currentText, replacementRange, data);

  return {
    text,
    data,
    inputType: extractInputType(record, data, replacementRange),
    replacementRange,
    selectionRange: createResultSelectionRange(text, replacementRange, data)
  };
}

export function createUIKitBeforeInputPayload(state: UIKitBeforeInputEventState, payload: unknown): unknown {
  const selectionPayload = createUIKitSelectionPayload(state.selectionRange, payload);
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