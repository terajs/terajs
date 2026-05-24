import { normalizeAndroidProp, resolveAndroidViewType } from "./primitives.js";
/** In-memory Android host used to validate the shared renderer contract from JS. */
export const AndroidViewAdapter = {
    createElement(type) {
        return {
            type: resolveAndroidViewType(type),
            props: {},
            children: [],
            parent: null
        };
    },
    insert(parent, child) {
        child.parent = parent;
        parent.children.push(child);
    },
    remove(node) {
        const parent = node.parent;
        if (!parent) {
            return;
        }
        parent.children = parent.children.filter((child) => child !== node);
        node.parent = null;
    },
    setProp(node, key, value) {
        const normalized = normalizeAndroidProp(node.type, key, value);
        const updates = [normalized, ...(normalized.additional ?? [])];
        for (const update of updates) {
            if (update.value == null) {
                delete node.props[update.name];
                continue;
            }
            node.props[update.name] = update.value;
        }
    }
};
