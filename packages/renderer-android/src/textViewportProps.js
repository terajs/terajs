const AndroidTextViewportViewTypes = new Set(["EditText"]);
function normalizeViewportKey(name) {
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
function normalizeInsetNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
            return null;
        }
        const parsed = Number(trimmed);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return null;
}
function createInsets(top, right, bottom, left) {
    return { top, right, bottom, left };
}
function normalizeInsetList(values) {
    if (values.length === 0 || values.length > 4) {
        return null;
    }
    const normalizedValues = values.map(normalizeInsetNumber);
    if (normalizedValues.some((entry) => entry == null)) {
        return null;
    }
    const [first, second, third, fourth] = normalizedValues;
    switch (normalizedValues.length) {
        case 1:
            return createInsets(first, first, first, first);
        case 2:
            return createInsets(first, second, first, second);
        case 3:
            return createInsets(first, second, third, second);
        default:
            return createInsets(first, second, third, fourth);
    }
}
function normalizeInsetRecord(record) {
    const all = normalizeInsetNumber(record.all);
    const vertical = normalizeInsetNumber(record.vertical) ?? normalizeInsetNumber(record.y);
    const horizontal = normalizeInsetNumber(record.horizontal) ?? normalizeInsetNumber(record.x);
    const top = normalizeInsetNumber(record.top) ?? vertical ?? all;
    const right = normalizeInsetNumber(record.right) ?? horizontal ?? all;
    const bottom = normalizeInsetNumber(record.bottom) ?? vertical ?? top ?? all;
    const left = normalizeInsetNumber(record.left) ?? horizontal ?? right ?? all;
    if (top == null || right == null || bottom == null || left == null) {
        return null;
    }
    return createInsets(top, right, bottom, left);
}
function normalizeTextViewportInsets(value) {
    const singleValue = normalizeInsetNumber(value);
    if (singleValue != null) {
        return createInsets(singleValue, singleValue, singleValue, singleValue);
    }
    if (Array.isArray(value)) {
        return normalizeInsetList(value);
    }
    if (typeof value === "object" && value !== null) {
        return normalizeInsetRecord(value);
    }
    return null;
}
export function normalizeAndroidTextViewportProp(viewType, name, value) {
    if (!AndroidTextViewportViewTypes.has(viewType)) {
        return null;
    }
    const normalizedKey = normalizeViewportKey(name);
    if (["scrollenabled", "scrollable", "scrollingenabled"].includes(normalizedKey)) {
        return {
            name: "scrollEnabled",
            value: normalizeBooleanValue(value)
        };
    }
    if (["contentinset", "contentpadding", "textpadding"].includes(normalizedKey)) {
        return {
            name: "contentPadding",
            value: normalizeTextViewportInsets(value)
        };
    }
    return null;
}
