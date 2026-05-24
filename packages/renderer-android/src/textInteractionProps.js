const AndroidTextInteractionViewTypes = new Set(["EditText"]);
function normalizeInteractionKey(name) {
    return name.replace(/[-_\s]/g, "").toLowerCase();
}
function normalizeBooleanValue(value) {
    if (value == null) {
        return null;
    }
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (!normalized) {
            return false;
        }
        if (["false", "0", "off", "no"].includes(normalized)) {
            return false;
        }
        if (["true", "1", "on", "yes"].includes(normalized)) {
            return true;
        }
    }
    return Boolean(value);
}
function resolveEditableValue(normalizedKey, value) {
    const normalizedValue = normalizeBooleanValue(value);
    if (normalizedValue == null) {
        return null;
    }
    if (normalizedKey === "readonly") {
        return !normalizedValue;
    }
    return normalizedValue;
}
export function normalizeAndroidTextInteractionProp(viewType, name, value) {
    if (!AndroidTextInteractionViewTypes.has(viewType)) {
        return null;
    }
    const normalizedKey = normalizeInteractionKey(name);
    if (["editable", "readonly"].includes(normalizedKey)) {
        return {
            name: "editable",
            value: resolveEditableValue(normalizedKey, value)
        };
    }
    if (["selectable", "textselectable", "selectionenabled", "textisselectable"].includes(normalizedKey)) {
        return {
            name: "textIsSelectable",
            value: normalizeBooleanValue(value)
        };
    }
    return null;
}
