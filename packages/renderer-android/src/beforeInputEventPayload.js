import { createAndroidSelectionPayload, } from "./selectionEventPayload.js";
import { extractAndroidTextEditRecord, extractAndroidTextEditString, resolveAndroidTextEditPreview, } from "./textEditPreview.js";
function extractInputType(record, replacementText, replacementRange) {
    if (record && typeof record.inputType === "string" && record.inputType.trim()) {
        return record.inputType;
    }
    if (record) {
        if (record.clipboardData !== undefined
            || record.clipboardText !== undefined
            || record.pastedText !== undefined
            || record.pasteData !== undefined) {
            return "insertFromPaste";
        }
        if (record.dataTransfer !== undefined
            || record.droppedText !== undefined
            || record.transferData !== undefined
            || record.dropData !== undefined) {
            return "insertFromDrop";
        }
    }
    if (!replacementText && replacementRange.start !== replacementRange.end) {
        return "deleteContent";
    }
    return "insertText";
}
export function extractAndroidBeforeInputState(props, payload) {
    const record = extractAndroidTextEditRecord(payload);
    const data = extractAndroidTextEditString(record, payload) ?? "";
    const basePreview = resolveAndroidTextEditPreview(props, payload, data, { record });
    const inputType = extractInputType(record, data, basePreview.replacementRange);
    const preview = resolveAndroidTextEditPreview(props, payload, data, {
        record,
        inputType,
        allowDeleteInference: true
    });
    return {
        text: preview.text,
        data,
        inputType,
        replacementRange: preview.replacementRange,
        selectionRange: preview.selectionRange
    };
}
export function createAndroidBeforeInputPayload(state, payload) {
    const selectionPayload = createAndroidSelectionPayload(state.selectionRange, payload);
    const base = typeof selectionPayload === "object" && selectionPayload !== null && !Array.isArray(selectionPayload)
        ? { ...selectionPayload }
        : {};
    return {
        ...base,
        text: state.text,
        value: state.text,
        data: state.data,
        inputType: state.inputType,
        replacementRange: {
            start: state.replacementRange.start,
            end: state.replacementRange.end
        }
    };
}
