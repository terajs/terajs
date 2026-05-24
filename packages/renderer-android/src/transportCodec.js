function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalizeNumber(value, path) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`${path} must be a finite number`);
    }
    return value;
}
function normalizeString(value, path) {
    if (typeof value !== "string") {
        throw new Error(`${path} must be a string`);
    }
    return value;
}
function normalizeBoolean(value, path) {
    if (typeof value !== "boolean") {
        throw new Error(`${path} must be a boolean`);
    }
    return value;
}
function normalizeStyleRecord(value, path) {
    if (!isRecord(value)) {
        throw new Error(`${path} must be an object`);
    }
    const result = {};
    for (const [key, entry] of Object.entries(value)) {
        result[key] = normalizeString(entry, `${path}.${key}`);
    }
    return result;
}
function normalizeTransportValue(value, path, seen = new Set()) {
    if (value == null) {
        return null;
    }
    if (typeof value === "string" || typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        if (!Number.isFinite(value)) {
            throw new Error(`${path} must be a finite number`);
        }
        return value;
    }
    if (typeof value !== "object") {
        throw new Error(`${path} must be JSON-safe`);
    }
    if (seen.has(value)) {
        throw new Error(`${path} must not be circular`);
    }
    seen.add(value);
    if (Array.isArray(value)) {
        const result = value.map((entry, index) => normalizeTransportValue(entry, `${path}[${index}]`, seen));
        seen.delete(value);
        return result;
    }
    const result = {};
    for (const [key, entry] of Object.entries(value)) {
        if (entry === undefined) {
            continue;
        }
        result[key] = normalizeTransportValue(entry, `${path}.${key}`, seen);
    }
    seen.delete(value);
    return result;
}
function normalizeBridgeCommand(command, path) {
    if (!isRecord(command)) {
        throw new Error(`${path} must be an object`);
    }
    const type = normalizeString(command.type, `${path}.type`);
    switch (type) {
        case "create-element":
            return {
                type,
                nodeId: normalizeNumber(command.nodeId, `${path}.nodeId`),
                viewType: normalizeString(command.viewType, `${path}.viewType`),
                svg: normalizeBoolean(command.svg, `${path}.svg`)
            };
        case "create-text":
        case "set-text":
            return {
                type,
                nodeId: normalizeNumber(command.nodeId, `${path}.nodeId`),
                value: normalizeString(command.value, `${path}.value`)
            };
        case "insert":
            return {
                type,
                parentId: normalizeNumber(command.parentId, `${path}.parentId`),
                childId: normalizeNumber(command.childId, `${path}.childId`),
                anchorId: command.anchorId == null ? null : normalizeNumber(command.anchorId, `${path}.anchorId`)
            };
        case "remove":
            return {
                type,
                nodeId: normalizeNumber(command.nodeId, `${path}.nodeId`)
            };
        case "set-prop":
            return {
                type,
                nodeId: normalizeNumber(command.nodeId, `${path}.nodeId`),
                name: normalizeString(command.name, `${path}.name`),
                value: normalizeTransportValue(command.value, `${path}.value`)
            };
        case "set-style":
            return {
                type,
                nodeId: normalizeNumber(command.nodeId, `${path}.nodeId`),
                style: normalizeStyleRecord(command.style, `${path}.style`)
            };
        case "set-class":
            return {
                type,
                nodeId: normalizeNumber(command.nodeId, `${path}.nodeId`),
                className: normalizeString(command.className, `${path}.className`)
            };
        case "subscribe-event":
        case "unsubscribe-event":
            return {
                type,
                nodeId: normalizeNumber(command.nodeId, `${path}.nodeId`),
                name: normalizeString(command.name, `${path}.name`)
            };
        default:
            throw new Error(`${path}.type is not a supported Android bridge command`);
    }
}
function normalizeNativeEventPacket(packet, path) {
    if (!isRecord(packet)) {
        throw new Error(`${path} must be an object`);
    }
    return {
        nodeId: normalizeNumber(packet.nodeId, `${path}.nodeId`),
        name: normalizeString(packet.name, `${path}.name`),
        ...(packet.payload === undefined
            ? {}
            : { payload: normalizeTransportValue(packet.payload, `${path}.payload`) })
    };
}
function parseJsonInput(input) {
    return typeof input === "string" ? JSON.parse(input) : input;
}
export function stringifyAndroidBridgeCommands(commands) {
    return JSON.stringify(commands.map((command, index) => normalizeBridgeCommand(command, `commands[${index}]`)));
}
export function parseAndroidBridgeCommands(input) {
    const parsed = parseJsonInput(input);
    if (!Array.isArray(parsed)) {
        throw new Error("Android bridge commands must be an array");
    }
    return parsed.map((command, index) => normalizeBridgeCommand(command, `commands[${index}]`));
}
export function stringifyAndroidNativeEventPacket(packet) {
    return JSON.stringify(normalizeNativeEventPacket(packet, "packet"));
}
export function parseAndroidNativeEventPacket(input) {
    return normalizeNativeEventPacket(parseJsonInput(input), "packet");
}
