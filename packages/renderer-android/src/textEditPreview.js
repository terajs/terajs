import { extractAndroidSelectionRange, } from "./selectionEventPayload.js";
export function extractAndroidTextEditRecord(payload) {
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
        return undefined;
    }
    return payload;
}
function normalizeSelectionIndex(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return undefined;
}
function clampRange(range, maximum) {
    const start = Math.min(Math.max(0, range.start), maximum);
    const end = Math.min(Math.max(0, range.end), maximum);
    return start <= end ? { start, end } : { start: end, end: start };
}
function extractRangeLike(value) {
    const directRange = extractAndroidSelectionRange(value);
    if (directRange) {
        return directRange;
    }
    if (typeof value !== "object" || value === null) {
        return undefined;
    }
    const record = value;
    const start = normalizeSelectionIndex(record.startOffset ?? record.rangeStart ?? record.from ?? record.location);
    const length = normalizeSelectionIndex(record.length);
    const end = normalizeSelectionIndex(record.endOffset ?? record.rangeEnd ?? record.to)
        ?? (start != null && length != null ? start + length : undefined);
    if (start == null || end == null) {
        return undefined;
    }
    return {
        start,
        end
    };
}
function getCurrentText(props) {
    return typeof props.text === "string" ? props.text : "";
}
function getCurrentSelectionRange(props, currentText) {
    const start = normalizeSelectionIndex(props.selectionStart);
    const end = normalizeSelectionIndex(props.selectionEnd);
    const fallback = currentText.length;
    return clampRange({
        start: start ?? end ?? fallback,
        end: end ?? start ?? fallback
    }, currentText.length);
}
function extractExplicitRange(record) {
    const targetRanges = Array.isArray(record?.targetRanges) ? record.targetRanges : undefined;
    return record
        ? extractRangeLike(record.replacementRange)
            ?? extractRangeLike(record.replaceRange)
            ?? extractRangeLike(record.targetRange)
            ?? extractRangeLike(record.range)
            ?? (targetRanges ? targetRanges.map(extractRangeLike).find((range) => range != null) : undefined)
        : undefined;
}
function extractTextRecordValue(value) {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value !== "object" || value === null) {
        return undefined;
    }
    return extractTextRecordValueDeep(value, new Set());
}
function extractTextRecordValueDeep(value, seen) {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value !== "object" || value === null || seen.has(value)) {
        return undefined;
    }
    seen.add(value);
    if (Array.isArray(value)) {
        for (const item of value) {
            const text = extractTextRecordValueDeep(item, seen);
            if (text != null) {
                return text;
            }
        }
        return undefined;
    }
    const record = value;
    for (const key of [
        "text",
        "data",
        "value",
        "plainText",
        "textPlain",
        "string",
        "content",
        "clipboardText",
        "pastedText",
        "droppedText",
        "transferText",
        "replacementText",
        "insertedText",
        "insertText",
        "text/plain"
    ]) {
        if (typeof record[key] === "string") {
            return record[key];
        }
    }
    if (typeof record.getData === "function") {
        for (const format of ["text/plain", "text", "plainText"]) {
            const text = record.getData(format);
            if (typeof text === "string" && text.length > 0) {
                return text;
            }
        }
    }
    for (const key of [
        "items",
        "entries",
        "values",
        "payload",
        "item",
        "dataTransfer",
        "clipboardData",
        "transferData",
        "pasteData",
        "dropData"
    ]) {
        const text = extractTextRecordValueDeep(record[key], seen);
        if (text != null) {
            return text;
        }
    }
    return undefined;
}
export function extractAndroidTextEditString(record, payload, keys = [
    "data",
    "insertedText",
    "insertText",
    "replacementText",
    "clipboardText",
    "pastedText",
    "droppedText",
    "transferText",
    "clipboardData",
    "dataTransfer",
    "transferData",
    "pasteData",
    "dropData"
]) {
    if (record) {
        for (const key of keys) {
            const text = extractTextRecordValue(record[key]);
            if (text != null) {
                return text;
            }
        }
    }
    return extractTextRecordValue(payload);
}
function inferDeleteRange(inputType, currentSelection, currentText, explicitRange) {
    if (explicitRange || currentSelection.start !== currentSelection.end) {
        return undefined;
    }
    const normalizedType = inputType?.trim().toLowerCase();
    if (!normalizedType?.startsWith("delete")) {
        return undefined;
    }
    if (normalizedType.includes("forward")) {
        return currentSelection.start >= currentText.length
            ? undefined
            : { start: currentSelection.start, end: currentSelection.start + 1 };
    }
    return currentSelection.start <= 0
        ? undefined
        : { start: currentSelection.start - 1, end: currentSelection.start };
}
function applyReplacement(text, replacementRange, replacementText) {
    return text.slice(0, replacementRange.start) + replacementText + text.slice(replacementRange.end);
}
function createResultSelectionRange(text, replacementRange, replacementText) {
    const caret = Math.min(replacementRange.start + replacementText.length, text.length);
    return {
        start: caret,
        end: caret
    };
}
export function resolveAndroidTextEditPreview(props, payload, replacementText, options = {}) {
    const record = options.record ?? extractAndroidTextEditRecord(payload);
    const currentText = getCurrentText(props);
    const currentSelection = getCurrentSelectionRange(props, currentText);
    const explicitRange = extractExplicitRange(record);
    const baseReplacementRange = clampRange(explicitRange ?? extractAndroidSelectionRange(payload) ?? currentSelection, currentText.length);
    const replacementRange = clampRange(options.allowDeleteInference
        ? inferDeleteRange(options.inputType, currentSelection, currentText, explicitRange) ?? baseReplacementRange
        : baseReplacementRange, currentText.length);
    const text = applyReplacement(currentText, replacementRange, replacementText);
    return {
        currentText,
        currentSelection,
        replacementRange,
        text,
        selectionRange: createResultSelectionRange(text, replacementRange, replacementText)
    };
}
