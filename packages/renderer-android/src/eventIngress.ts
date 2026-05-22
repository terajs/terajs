import type { AndroidBridgeElementNode } from "./bridge.js";
import type { AndroidNativeNode } from "./consumer.js";
import { normalizeAndroidEventName } from "./primitives.js";

const AndroidTextInputViewTypes = new Set(["EditText"]);
const AndroidSwitchViewTypes = new Set(["Switch"]);

interface NativeSelectionRange {
  start: number;
  end: number;
}

function extractAndroidTextValue(payload: unknown): string | undefined {
  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.value === "string") {
    return record.value;
  }

  if (typeof record.text === "string") {
    return record.text;
  }

  return undefined;
}

function createAndroidTextPayload(value: string, payload: unknown): unknown {
  if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
    return {
      ...(payload as Record<string, unknown>),
      text: value,
      value
    };
  }

  return {
    text: value,
    value
  };
}

function extractAndroidSelectionRange(payload: unknown): NativeSelectionRange | undefined {
  if (typeof payload === "number" && Number.isFinite(payload)) {
    return {
      start: payload,
      end: payload
    };
  }

  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const selectionStart = typeof record.selectionStart === "number" && Number.isFinite(record.selectionStart)
    ? record.selectionStart
    : undefined;
  const selectionEnd = typeof record.selectionEnd === "number" && Number.isFinite(record.selectionEnd)
    ? record.selectionEnd
    : undefined;
  const start = typeof record.start === "number" && Number.isFinite(record.start)
    ? record.start
    : selectionStart;
  const end = typeof record.end === "number" && Number.isFinite(record.end)
    ? record.end
    : selectionEnd;
  const caret = typeof record.caret === "number" && Number.isFinite(record.caret)
    ? record.caret
    : undefined;
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

function createAndroidSelectionPayload(range: NativeSelectionRange, payload: unknown): unknown {
  if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
    return {
      ...(payload as Record<string, unknown>),
      start: range.start,
      end: range.end,
      selectionStart: range.start,
      selectionEnd: range.end
    };
  }

  return {
    start: range.start,
    end: range.end,
    selectionStart: range.start,
    selectionEnd: range.end
  };
}

function extractAndroidToggleValue(payload: unknown): boolean | undefined {
  if (typeof payload === "boolean") {
    return payload;
  }

  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.checked === "boolean") {
    return record.checked;
  }

  if (typeof record.on === "boolean") {
    return record.on;
  }

  return undefined;
}

function createAndroidTogglePayload(checked: boolean, payload: unknown): unknown {
  if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
    return {
      ...(payload as Record<string, unknown>),
      checked,
      on: checked
    };
  }

  return {
    checked,
    on: checked
  };
}

/**
 * Normalizes inbound native Android events and syncs text-entry and toggle
 * state into the bridge and consumer proof trees before JS handlers run.
 */
export function ingestAndroidNativeEvent(
  bridgeNode: AndroidBridgeElementNode,
  nativeNode: AndroidNativeNode | undefined,
  name: string,
  payload: unknown
): { name: string; payload: unknown } {
  const normalizedName = normalizeAndroidEventName(bridgeNode.viewType, name);

  if (AndroidTextInputViewTypes.has(bridgeNode.viewType) && normalizedName === "change") {
    const value = extractAndroidTextValue(payload);
    if (value != null) {
      bridgeNode.props.text = value;

      if (nativeNode?.kind === "view") {
        nativeNode.props.text = value;
      }

      return {
        name: normalizedName,
        payload: createAndroidTextPayload(value, payload)
      };
    }
  }

  if (AndroidTextInputViewTypes.has(bridgeNode.viewType) && normalizedName === "selectionchange") {
    const range = extractAndroidSelectionRange(payload);
    if (range) {
      bridgeNode.props.selectionStart = range.start;
      bridgeNode.props.selectionEnd = range.end;

      if (nativeNode?.kind === "view") {
        nativeNode.props.selectionStart = range.start;
        nativeNode.props.selectionEnd = range.end;
      }

      return {
        name: normalizedName,
        payload: createAndroidSelectionPayload(range, payload)
      };
    }
  }

  if (AndroidSwitchViewTypes.has(bridgeNode.viewType) && normalizedName === "change") {
    const checked = extractAndroidToggleValue(payload);
    if (checked != null) {
      bridgeNode.props.checked = checked;

      if (nativeNode?.kind === "view") {
        nativeNode.props.checked = checked;
      }

      return {
        name: normalizedName,
        payload: createAndroidTogglePayload(checked, payload)
      };
    }
  }

  return {
    name: normalizedName,
    payload
  };
}