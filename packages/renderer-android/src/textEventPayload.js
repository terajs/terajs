export function extractAndroidTextValue(payload) {
    if (typeof payload === "string") {
        return payload;
    }
    if (typeof payload !== "object" || payload === null) {
        return undefined;
    }
    const record = payload;
    if (typeof record.value === "string") {
        return record.value;
    }
    if (typeof record.text === "string") {
        return record.text;
    }
    return undefined;
}
export function createAndroidTextPayload(value, payload) {
    if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
        return {
            ...payload,
            text: value,
            value
        };
    }
    return {
        text: value,
        value
    };
}
