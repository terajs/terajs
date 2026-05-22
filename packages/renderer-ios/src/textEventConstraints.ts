import type { UIKitNativeSelectionRange } from "./selectionEventPayload.js";

export interface UIKitTextEventConstraintState {
  text?: string;
  compositionText?: string;
  composing?: boolean;
  selectionRange?: UIKitNativeSelectionRange;
}

function normalizeMaximumTextLength(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.trunc(parsed));
    }
  }

  return undefined;
}

function clampTextValue(value: string | undefined, maximumTextLength: number | undefined): string | undefined {
  if (value == null || maximumTextLength == null) {
    return value;
  }

  return value.slice(0, maximumTextLength);
}

function clampSelectionRange(
  selectionRange: UIKitNativeSelectionRange | undefined,
  maximumIndex: number | undefined
): UIKitNativeSelectionRange | undefined {
  if (!selectionRange || maximumIndex == null) {
    return selectionRange;
  }

  return {
    start: Math.min(Math.max(0, selectionRange.start), maximumIndex),
    end: Math.min(Math.max(0, selectionRange.end), maximumIndex)
  };
}

export function applyUIKitTextEventConstraints<T extends UIKitTextEventConstraintState>(
  props: Record<string, unknown>,
  state: T
): T {
  const maximumTextLength = normalizeMaximumTextLength(props.maximumTextLength);
  if (maximumTextLength == null) {
    return state;
  }

  const text = clampTextValue(state.text, maximumTextLength);
  const compositionText = clampTextValue(state.compositionText, maximumTextLength);
  const maximumIndex = text?.length ?? compositionText?.length ?? maximumTextLength;

  return {
    ...state,
    text,
    compositionText,
    selectionRange: clampSelectionRange(state.selectionRange, maximumIndex)
  } as T;
}