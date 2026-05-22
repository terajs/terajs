import type { AndroidBridgeElementNode } from "./bridge.js";
import type { AndroidNativeNode } from "./consumer.js";
import { normalizeAndroidEventName } from "./primitives.js";

const AndroidTextInputViewTypes = new Set(["EditText"]);
const AndroidSwitchViewTypes = new Set(["Switch"]);

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
 * Normalizes inbound native Android events and syncs input text state into the
 * bridge and consumer proof trees before JS handlers run.
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