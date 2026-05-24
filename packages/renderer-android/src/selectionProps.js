const AndroidSelectionViewTypes = new Set(["EditText"]);
function normalizeSelectionKey(name) {
    return name.replace(/[-_\s]/g, "").toLowerCase();
}
function normalizeSelectionIndex(value) {
    if (value == null) {
        return null;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.max(0, Math.trunc(value));
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
            return null;
        }
        const parsed = Number(trimmed);
        if (Number.isFinite(parsed)) {
            return Math.max(0, Math.trunc(parsed));
        }
    }
    return null;
}
function createSelectionProp(start, end) {
    return {
        name: "selectionStart",
        value: start,
        additional: [{
                name: "selectionEnd",
                value: end
            }]
    };
}
function normalizeSelectionRange(value) {
    if (value == null) {
        return {
            start: null,
            end: null
        };
    }
    if (Array.isArray(value)) {
        const start = normalizeSelectionIndex(value[0]);
        const end = normalizeSelectionIndex(value[1]);
        const resolvedStart = start ?? end;
        const resolvedEnd = end ?? resolvedStart;
        if (resolvedStart == null || resolvedEnd == null) {
            return null;
        }
        return {
            start: resolvedStart,
            end: resolvedEnd
        };
    }
    if (typeof value === "object") {
        const record = value;
        const start = normalizeSelectionIndex(record.start ?? record.selectionStart ?? record.caret ?? record.cursor);
        const end = normalizeSelectionIndex(record.end ?? record.selectionEnd);
        const resolvedStart = start ?? end;
        const resolvedEnd = end ?? resolvedStart;
        if (resolvedStart == null || resolvedEnd == null) {
            return null;
        }
        return {
            start: resolvedStart,
            end: resolvedEnd
        };
    }
    const collapsed = normalizeSelectionIndex(value);
    if (collapsed == null) {
        return null;
    }
    return {
        start: collapsed,
        end: collapsed
    };
}
export function normalizeAndroidSelectionProp(viewType, name, value) {
    if (!AndroidSelectionViewTypes.has(viewType)) {
        return null;
    }
    const normalizedKey = normalizeSelectionKey(name);
    if (normalizedKey === "selectionstart") {
        return {
            name: "selectionStart",
            value: normalizeSelectionIndex(value)
        };
    }
    if (normalizedKey === "selectionend") {
        return {
            name: "selectionEnd",
            value: normalizeSelectionIndex(value)
        };
    }
    if (["caret", "cursor"].includes(normalizedKey)) {
        const collapsed = normalizeSelectionIndex(value);
        return createSelectionProp(collapsed, collapsed);
    }
    if (["selection", "selectionrange"].includes(normalizedKey)) {
        const range = normalizeSelectionRange(value);
        if (!range) {
            return null;
        }
        return createSelectionProp(range.start, range.end);
    }
    return null;
}
