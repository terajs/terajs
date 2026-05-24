export function extractAndroidToggleValue(payload) {
    if (typeof payload === "boolean") {
        return payload;
    }
    if (typeof payload !== "object" || payload === null) {
        return undefined;
    }
    const record = payload;
    if (typeof record.checked === "boolean") {
        return record.checked;
    }
    if (typeof record.on === "boolean") {
        return record.on;
    }
    return undefined;
}
export function createAndroidTogglePayload(checked, payload) {
    if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
        return {
            ...payload,
            checked,
            on: checked
        };
    }
    return {
        checked,
        on: checked
    };
}
