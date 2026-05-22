export interface UIKitCompositionEventState {
  text?: string;
  compositionText?: string;
  composing: boolean;
}

function resolveDefaultComposing(eventName: string): boolean {
  return eventName !== "compositionend";
}

function extractCompositionRecord(payload: unknown): Record<string, unknown> | undefined {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return undefined;
  }

  return payload as Record<string, unknown>;
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

function extractCompositionText(record: Record<string, unknown> | undefined, fallback: string | undefined): string | undefined {
  if (!record) {
    return fallback;
  }

  if (typeof record.data === "string") {
    return record.data;
  }

  if (typeof record.composition === "string") {
    return record.composition;
  }

  return fallback;
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

export function extractUIKitCompositionState(eventName: string, payload: unknown): UIKitCompositionEventState {
  const record = extractCompositionRecord(payload);
  const text = extractTextValue(record, payload);
  const composing = extractComposingValue(record, resolveDefaultComposing(eventName));

  return {
    text,
    compositionText: extractCompositionText(record, text),
    composing
  };
}

export function createUIKitCompositionPayload(state: UIKitCompositionEventState, payload: unknown): unknown {
  const base = typeof payload === "object" && payload !== null && !Array.isArray(payload)
    ? { ...(payload as Record<string, unknown>) }
    : {};

  return {
    ...base,
    ...(state.text == null ? {} : { text: state.text, value: state.text }),
    ...(state.compositionText == null ? {} : { data: state.compositionText, composition: state.compositionText }),
    composing: state.composing,
    isComposing: state.composing
  };
}