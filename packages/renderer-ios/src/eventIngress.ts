import {
  createUIKitBeforeInputPayload,
  extractUIKitBeforeInputState,
} from "./beforeInputEventPayload.js";
import type { UIKitBridgeElementNode } from "./bridge.js";
import type { UIKitNativeNode } from "./consumer.js";
import {
  type UIKitCompositionEventState,
  createUIKitCompositionPayload,
  extractUIKitCompositionState,
} from "./compositionEventPayload.js";
import { normalizeUIKitEventName } from "./primitives.js";
import {
  createUIKitSelectionPayload,
  extractUIKitSelectionRange,
} from "./selectionEventPayload.js";
import { applyUIKitTextEventConstraints } from "./textEventConstraints.js";
import { createUIKitTextPayload, extractUIKitTextValue } from "./textEventPayload.js";
import { createUIKitTogglePayload, extractUIKitToggleValue } from "./toggleEventPayload.js";

const UIKitTextInputViewTypes = new Set(["UITextField", "UITextView"]);
const UIKitSwitchViewTypes = new Set(["UISwitch"]);
const UIKitBeforeInputEventNames = new Set(["beforeinput"]);
const UIKitCompositionEventNames = new Set(["compositionstart", "compositionupdate", "compositionend"]);

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

  if (UIKitTextInputViewTypes.has(bridgeNode.viewType) && UIKitBeforeInputEventNames.has(normalizedName)) {
    const beforeInput = applyUIKitTextEventConstraints(
      bridgeNode.props as Record<string, unknown>,
      extractUIKitBeforeInputState(bridgeNode.props as Record<string, unknown>, payload)
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
      payload: createUIKitBeforeInputPayload(beforeInput, payload)
    };
  }

  if (UIKitTextInputViewTypes.has(bridgeNode.viewType) && normalizedName === "change") {
    const value = extractUIKitTextValue(payload);
    if (value != null) {
      const constrainedText = applyUIKitTextEventConstraints(bridgeNode.props as Record<string, unknown>, {
        text: value
      }).text ?? value;
      bridgeNode.props.text = constrainedText;

      if (nativeNode?.kind === "view") {
        nativeNode.props.text = constrainedText;
      }

      return {
        name: normalizedName,
        payload: createUIKitTextPayload(constrainedText, payload)
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

  if (UIKitTextInputViewTypes.has(bridgeNode.viewType) && UIKitCompositionEventNames.has(normalizedName)) {
    const composition: UIKitCompositionEventState = applyUIKitTextEventConstraints(
      bridgeNode.props as Record<string, unknown>,
      extractUIKitCompositionState(normalizedName, payload)
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
      payload: createUIKitCompositionPayload(composition, payload)
    };
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