function normalizeMaximumTextLength(value) {
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
function clampTextValue(value, maximumTextLength) {
    if (value == null || maximumTextLength == null) {
        return value;
    }
    return value.slice(0, maximumTextLength);
}
function clampSelectionRange(selectionRange, maximumIndex) {
    if (!selectionRange || maximumIndex == null) {
        return selectionRange;
    }
    return {
        start: Math.min(Math.max(0, selectionRange.start), maximumIndex),
        end: Math.min(Math.max(0, selectionRange.end), maximumIndex)
    };
}
export function applyAndroidTextEventConstraints(props, state) {
    const maximumTextLength = normalizeMaximumTextLength(props.maxLength);
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
    };
}
