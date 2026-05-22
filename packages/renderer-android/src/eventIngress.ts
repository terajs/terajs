import {
  createAndroidBeforeInputPayload,
  extractAndroidBeforeInputState,
} from "./beforeInputEventPayload.js";
import type { AndroidBridgeElementNode } from "./bridge.js";
import type { AndroidNativeNode } from "./consumer.js";
import {
  type AndroidCompositionEventState,
  createAndroidCompositionPayload,
  extractAndroidCompositionState,
} from "./compositionEventPayload.js";
import { normalizeAndroidEventName } from "./primitives.js";
import {
  createAndroidSelectionPayload,
  extractAndroidSelectionRange,
} from "./selectionEventPayload.js";
import { applyAndroidTextEventConstraints } from "./textEventConstraints.js";
import { createAndroidTextPayload, extractAndroidTextValue } from "./textEventPayload.js";
import { createAndroidTogglePayload, extractAndroidToggleValue } from "./toggleEventPayload.js";

const AndroidTextInputViewTypes = new Set(["EditText"]);
const AndroidSwitchViewTypes = new Set(["Switch"]);
const AndroidBeforeInputEventNames = new Set(["beforeinput"]);
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

  if (AndroidTextInputViewTypes.has(bridgeNode.viewType) && AndroidBeforeInputEventNames.has(normalizedName)) {
    const beforeInput = applyAndroidTextEventConstraints(
      bridgeNode.props as Record<string, unknown>,
      extractAndroidBeforeInputState(bridgeNode.props as Record<string, unknown>, payload)
    );

    bridgeNode.props.text = beforeInput.text;
    bridgeNode.props.selectionStart = beforeInput.selectionRange.start;
    bridgeNode.props.selectionEnd = beforeInput.selectionRange.end;

    if (nativeNode?.kind === "view") {
      nativeNode.props.text = beforeInput.text;
      nativeNode.props.selectionStart = beforeInput.selectionRange.start;
      nativeNode.props.selectionEnd = beforeInput.selectionRange.end;
    }

    return {
      name: normalizedName,
      payload: createAndroidBeforeInputPayload(beforeInput, payload)
    };
  }

  if (AndroidTextInputViewTypes.has(bridgeNode.viewType) && normalizedName === "change") {
    const value = extractAndroidTextValue(payload);
    if (value != null) {
      const constrainedText = applyAndroidTextEventConstraints(bridgeNode.props as Record<string, unknown>, {
        text: value
      }).text ?? value;
      bridgeNode.props.text = constrainedText;

      if (nativeNode?.kind === "view") {
        nativeNode.props.text = constrainedText;
      }

      return {
        name: normalizedName,
        payload: createAndroidTextPayload(constrainedText, payload)
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
    const composition: AndroidCompositionEventState = applyAndroidTextEventConstraints(
      bridgeNode.props as Record<string, unknown>,
      extractAndroidCompositionState(normalizedName, payload)
    );

    if (composition.text != null) {
      bridgeNode.props.text = composition.text;

      if (nativeNode?.kind === "view") {
        nativeNode.props.text = composition.text;
      }
    }

    if (composition.selectionRange) {
      bridgeNode.props.selectionStart = composition.selectionRange.start;
      bridgeNode.props.selectionEnd = composition.selectionRange.end;

      if (nativeNode?.kind === "view") {
        nativeNode.props.selectionStart = composition.selectionRange.start;
        nativeNode.props.selectionEnd = composition.selectionRange.end;
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