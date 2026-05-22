import {
  createAndroidSelectionPayload,
  extractAndroidSelectionRange,
  type AndroidNativeSelectionRange,
} from "./selectionEventPayload.js";
import {
  extractAndroidTextEditRecord,
  extractAndroidTextEditString,
  resolveAndroidTextEditPreview,
} from "./textEditPreview.js";

export interface AndroidCompositionEventState {
  text?: string;
  compositionText?: string;
  composing: boolean;
  selectionRange?: AndroidNativeSelectionRange;
  replacementRange?: AndroidNativeSelectionRange;
  baseText?: string;
}

function resolveDefaultComposing(eventName: string): boolean {
  return eventName !== "compositionend";
}

function extractTextValue(record: Record<string, unknown> | undefined, payload: unknown): string | undefined {
  if (record) {
    if (typeof record.value === "string") {
      return record.value;
    }

    if (typeof record.text === "string") {
      return record.text;
    }
  }

  return typeof payload === "string" ? payload : undefined;
}

function extractCompositionText(
  record: Record<string, unknown> | undefined,
  payload: unknown,
  fallback: string | undefined
): string | undefined {
  return extractAndroidTextEditString(
    record,
    payload,
    ["data", "composition", "insertedText", "insertText", "replacementText"]
  ) ?? fallback;
}

function extractComposingValue(record: Record<string, unknown> | undefined, fallback: boolean): boolean {
  if (!record) {
    return fallback;
  }

  if (typeof record.composing === "boolean") {
    return record.composing;
  }

  if (typeof record.isComposing === "boolean") {
    return record.isComposing;
  }

  return fallback;
}

function createPreviewProps(props: Record<string, unknown>): Record<string, unknown> {
  const baseText = typeof props.compositionBaseText === "string" ? props.compositionBaseText : undefined;
  const replacementRange = extractAndroidSelectionRange(props.compositionReplacementRange);

  if (baseText == null && replacementRange == null) {
    return props;
  }

  return {
    ...props,
    ...(baseText == null ? {} : { text: baseText }),
    ...(replacementRange == null
      ? {}
      : {
          selectionStart: replacementRange.start,
          selectionEnd: replacementRange.end
        })
  };
}

export function extractAndroidCompositionState(
  props: Record<string, unknown>,
  eventName: string,
  payload: unknown
): AndroidCompositionEventState {
  const record = extractAndroidTextEditRecord(payload);
  const text = extractTextValue(record, payload);
  const compositionText = extractCompositionText(record, payload, text);
  const composing = extractComposingValue(record, resolveDefaultComposing(eventName));
  const previewProps = createPreviewProps(props);
  const preview = text == null && compositionText !== undefined
    ? resolveAndroidTextEditPreview(previewProps, payload, compositionText, { record })
    : undefined;

  return {
    text: text ?? preview?.text,
    compositionText,
    composing,
    selectionRange: extractAndroidSelectionRange(payload) ?? preview?.selectionRange,
    replacementRange: preview?.replacementRange,
    baseText: preview?.currentText
  };
}

export function createAndroidCompositionPayload(state: AndroidCompositionEventState, payload: unknown): unknown {
  const selectionPayload = state.selectionRange
    ? createAndroidSelectionPayload(state.selectionRange, payload)
    : payload;
  const base = typeof selectionPayload === "object" && selectionPayload !== null && !Array.isArray(selectionPayload)
    ? { ...(selectionPayload as Record<string, unknown>) }
    : {};

  return {
    ...base,
    ...(state.text == null ? {} : { text: state.text, value: state.text }),
    ...(state.compositionText == null ? {} : { data: state.compositionText, composition: state.compositionText }),
    ...(state.replacementRange == null
      ? {}
      : {
          replacementRange: {
            start: state.replacementRange.start,
            end: state.replacementRange.end
          }
        }),
    composing: state.composing,
    isComposing: state.composing
  };
}