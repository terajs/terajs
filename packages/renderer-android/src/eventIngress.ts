import type { AndroidBridgeElementNode } from "./bridge.js";
import type { AndroidNativeNode } from "./consumer.js";
import {
  createAndroidCompositionPayload,
  extractAndroidCompositionState,
} from "./compositionEventPayload.js";
import { normalizeAndroidEventName } from "./primitives.js";
import {
  createAndroidSelectionPayload,
  extractAndroidSelectionRange,
} from "./selectionEventPayload.js";
import { createAndroidTextPayload, extractAndroidTextValue } from "./textEventPayload.js";
import { createAndroidTogglePayload, extractAndroidToggleValue } from "./toggleEventPayload.js";

const AndroidTextInputViewTypes = new Set(["EditText"]);
const AndroidSwitchViewTypes = new Set(["Switch"]);
const AndroidCompositionEventNames = new Set(["compositionstart", "compositionupdate", "compositionend"]);

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

  if (AndroidTextInputViewTypes.has(bridgeNode.viewType) && AndroidCompositionEventNames.has(normalizedName)) {
    const composition = extractAndroidCompositionState(normalizedName, payload);

    if (composition.text != null) {
      bridgeNode.props.text = composition.text;

      if (nativeNode?.kind === "view") {
        nativeNode.props.text = composition.text;
      }
    }

    bridgeNode.props.composing = composition.composing;
    bridgeNode.props.compositionText = composition.composing
      ? composition.compositionText
      : undefined;

    if (nativeNode?.kind === "view") {
      nativeNode.props.composing = composition.composing;
      nativeNode.props.compositionText = composition.composing
        ? composition.compositionText
        : undefined;
    }

    return {
      name: normalizedName,
      payload: createAndroidCompositionPayload(composition, payload)
    };
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