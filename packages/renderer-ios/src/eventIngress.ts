import type { UIKitBridgeElementNode } from "./bridge.js";
import type { UIKitNativeNode } from "./consumer.js";
import { normalizeUIKitEventName } from "./primitives.js";

const UIKitTextInputViewTypes = new Set(["UITextField", "UITextView"]);
const UIKitSwitchViewTypes = new Set(["UISwitch"]);

function extractUIKitTextValue(payload: unknown): string | undefined {
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

function createUIKitTextPayload(value: string, payload: unknown): unknown {
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

function extractUIKitToggleValue(payload: unknown): boolean | undefined {
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

function createUIKitTogglePayload(checked: boolean, payload: unknown): unknown {
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
 * Normalizes inbound native UIKit events and syncs input text state into the
 * bridge and consumer proof trees before JS handlers run.
 */
export function ingestUIKitNativeEvent(
  bridgeNode: UIKitBridgeElementNode,
  nativeNode: UIKitNativeNode | undefined,
  name: string,
  payload: unknown
): { name: string; payload: unknown } {
  const normalizedName = normalizeUIKitEventName(bridgeNode.viewType, name);

  if (UIKitTextInputViewTypes.has(bridgeNode.viewType) && normalizedName === "change") {
    const value = extractUIKitTextValue(payload);
    if (value != null) {
      bridgeNode.props.text = value;

      if (nativeNode?.kind === "view") {
        nativeNode.props.text = value;
      }

      return {
        name: normalizedName,
        payload: createUIKitTextPayload(value, payload)
      };
    }
  }

  if (UIKitSwitchViewTypes.has(bridgeNode.viewType) && normalizedName === "change") {
    const checked = extractUIKitToggleValue(payload);
    if (checked != null) {
      bridgeNode.props.on = checked;

      if (nativeNode?.kind === "view") {
        nativeNode.props.on = checked;
      }

      return {
        name: normalizedName,
        payload: createUIKitTogglePayload(checked, payload)
      };
    }
  }

  return {
    name: normalizedName,
    payload
  };
}