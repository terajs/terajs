import type { UIKitBridgeElementNode } from "./bridge.js";
import type { UIKitNativeNode } from "./consumer.js";
import { normalizeUIKitEventName } from "./primitives.js";
import {
  createUIKitSelectionPayload,
  extractUIKitSelectionRange,
} from "./selectionEventPayload.js";
import { createUIKitTextPayload, extractUIKitTextValue } from "./textEventPayload.js";
import { createUIKitTogglePayload, extractUIKitToggleValue } from "./toggleEventPayload.js";

const UIKitTextInputViewTypes = new Set(["UITextField", "UITextView"]);
const UIKitSwitchViewTypes = new Set(["UISwitch"]);

/**
 * Normalizes inbound native UIKit events and syncs text-entry and toggle state
 * into the bridge and consumer proof trees before JS handlers run.
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

  if (UIKitTextInputViewTypes.has(bridgeNode.viewType) && normalizedName === "selectionchange") {
    const range = extractUIKitSelectionRange(payload);
    if (range) {
      bridgeNode.props.selectionStart = range.start;
      bridgeNode.props.selectionEnd = range.end;

      if (nativeNode?.kind === "view") {
        nativeNode.props.selectionStart = range.start;
        nativeNode.props.selectionEnd = range.end;
      }

      return {
        name: normalizedName,
        payload: createUIKitSelectionPayload(range, payload)
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