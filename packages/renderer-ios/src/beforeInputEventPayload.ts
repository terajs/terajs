import {
  createUIKitSelectionPayload,
  type UIKitNativeSelectionRange,
} from "./selectionEventPayload.js";
import {
  extractUIKitTextEditRecord,
  extractUIKitTextEditString,
  resolveUIKitTextEditPreview,
} from "./textEditPreview.js";

export interface UIKitBeforeInputEventState {
  text: string;
  data: string;
  inputType: string;
  replacementRange: UIKitNativeSelectionRange;
  selectionRange: UIKitNativeSelectionRange;
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

export function extractUIKitBeforeInputState(
  props: Record<string, unknown>,
  payload: unknown
): UIKitBeforeInputEventState {
  const record = extractUIKitTextEditRecord(payload);
  const data = extractUIKitTextEditString(record, payload) ?? "";
  const basePreview = resolveUIKitTextEditPreview(props, payload, data, { record });
  const inputType = extractInputType(record, data, basePreview.replacementRange);
  const preview = resolveUIKitTextEditPreview(props, payload, data, {
    record,
    inputType,
    allowDeleteInference: true
  });

  return {
    text: preview.text,
    data,
    inputType,
    replacementRange: preview.replacementRange,
    selectionRange: preview.selectionRange
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