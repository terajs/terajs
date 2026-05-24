const AndroidMultilineLayoutViewTypes = new Set(["EditText"]);
function normalizeLayoutKey(name) {
    return name.replace(/[-_\s]/g, "").toLowerCase();
}
function normalizeLineCount(value) {
    if (value == null) {
        return null;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.max(1, Math.trunc(value));
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
            return null;
        }
        const parsed = Number(trimmed);
        if (Number.isFinite(parsed)) {
            return Math.max(1, Math.trunc(parsed));
        }
    }
    return null;
}
export function normalizeAndroidTextLayoutProp(viewType, name, value) {
    if (!AndroidMultilineLayoutViewTypes.has(viewType)) {
        return null;
    }
    const normalizedKey = normalizeLayoutKey(name);
    if (["rows", "lines"].includes(normalizedKey)) {
        return {
            name: "lines",
            value: normalizeLineCount(value)
        };
    }
    if (["minrows", "minlines"].includes(normalizedKey)) {
        return {
            name: "minLines",
            value: normalizeLineCount(value)
        };
    }
    if (["maxrows", "maxlines"].includes(normalizedKey)) {
        return {
            name: "maxLines",
            value: normalizeLineCount(value)
        };
    }
    return null;
}
