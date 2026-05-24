import { normalizeAndroidInputProp } from "./inputProps.js";
import { normalizeAndroidTextInteractionProp } from "./textInteractionProps.js";
import { normalizeAndroidTextLayoutProp } from "./textLayoutProps.js";
import { normalizeAndroidTextLimitProp } from "./textLimitProps.js";
import { normalizeAndroidTextViewportProp } from "./textViewportProps.js";
const AndroidTextPropViewTypes = new Set(["Button", "EditText", "TextView"]);
const AndroidImagePropViewTypes = new Set(["ImageView"]);
function normalizeNativeKey(name) {
    return name.replace(/[-_\s]/g, "").toLowerCase();
}
export function normalizeAndroidProp(viewType, name, value) {
    const normalizedKey = normalizeNativeKey(name);
    const inputProp = normalizeAndroidInputProp(viewType, name, value);
    if (inputProp) {
        return inputProp;
    }
    const textLayoutProp = normalizeAndroidTextLayoutProp(viewType, name, value);
    if (textLayoutProp) {
        return textLayoutProp;
    }
    const textViewportProp = normalizeAndroidTextViewportProp(viewType, name, value);
    if (textViewportProp) {
        return textViewportProp;
    }
    const textInteractionProp = normalizeAndroidTextInteractionProp(viewType, name, value);
    if (textInteractionProp) {
        return textInteractionProp;
    }
    const textLimitProp = normalizeAndroidTextLimitProp(viewType, name, value);
    if (textLimitProp) {
        return textLimitProp;
    }
    if (AndroidImagePropViewTypes.has(viewType) && normalizedKey === "alt") {
        return {
            name: "contentDescription",
            value
        };
    }
    if (normalizedKey === "arialabel"
        || normalizedKey === "accessibilitylabel"
        || normalizedKey === "contentdescription") {
        return {
            name: "contentDescription",
            value
        };
    }
    if (AndroidTextPropViewTypes.has(viewType) && ["text", "title", "label", "value"].includes(normalizedKey)) {
        return {
            name: "text",
            value
        };
    }
    if (AndroidImagePropViewTypes.has(viewType) && ["src", "source", "imagesource"].includes(normalizedKey)) {
        return {
            name: "source",
            value
        };
    }
    if (viewType === "Switch" && ["checked", "on"].includes(normalizedKey)) {
        return {
            name: "checked",
            value: Boolean(value)
        };
    }
    return {
        name,
        value
    };
}
export function normalizeAndroidEventName(viewType, name) {
    const normalizedKey = normalizeNativeKey(name);
    if (["click", "press", "tap"].includes(normalizedKey)) {
        return "press";
    }
    if (["change", "input", "toggle"].includes(normalizedKey)
        && viewType === "Switch") {
        return "change";
    }
    if (["input", "change", "textinput"].includes(normalizedKey)
        && viewType === "EditText") {
        return "change";
    }
    if (["selectionchange", "selection", "select", "caretchange", "cursorchange"].includes(normalizedKey)
        && viewType === "EditText") {
        return "selectionchange";
    }
    if (["beforeinput", "beforetextinput", "textbeforeinput"].includes(normalizedKey)
        && viewType === "EditText") {
        return "beforeinput";
    }
    if (["compositionstart", "composingstart", "imestart"].includes(normalizedKey)
        && viewType === "EditText") {
        return "compositionstart";
    }
    if (["compositionupdate", "composition", "composing", "imeupdate"].includes(normalizedKey)
        && viewType === "EditText") {
        return "compositionupdate";
    }
    if (["compositionend", "composingend", "imeend"].includes(normalizedKey)
        && viewType === "EditText") {
        return "compositionend";
    }
    return name;
}
