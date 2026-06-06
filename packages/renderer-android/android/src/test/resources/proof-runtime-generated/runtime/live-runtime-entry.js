"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/bridgeNodes.js
    function createAndroidBridgeNodeBase(id, kind) {
        return {
            kind: kind,
            id: id,
            parent: null,
            children: [],
            cleanups: []
        };
    }
    function isAndroidNativeBackedNode(node) {
        return node.kind === "element" || node.kind === "text";
    }
    function detachAndroidBridgeNode(node) {
        var parent = node.parent;
        if (!parent)
            return;
        var index = parent.children.indexOf(node);
        if (index !== -1)
            parent.children.splice(index, 1);
        node.parent = null;
    }
    function disposeAndroidBridgeSubtree(node, nodes) {
        for (var _i = 0, _a = __spreadArray([], node.children, true); _i < _a.length; _i++) {
            var child = _a[_i];
            disposeAndroidBridgeSubtree(child, nodes);
            child.parent = null;
        }
        node.children.length = 0;
        for (var _b = 0, _c = node.cleanups.splice(0, node.cleanups.length); _b < _c.length; _b++) {
            var cleanup_1 = _c[_b];
            cleanup_1();
        }
        if (node.kind === "element")
            node.eventHandlers = {};
        nodes.delete(node.id);
    }
    function resolveAndroidBridgeAnchorId(parent, anchor) {
        if (!anchor)
            return null;
        var anchorIndex = parent.children.indexOf(anchor);
        if (anchorIndex === -1)
            return isAndroidNativeBackedNode(anchor) ? anchor.id : null;
        for (var index = anchorIndex; index < parent.children.length; index += 1) {
            var candidate = parent.children[index];
            if (isAndroidNativeBackedNode(candidate))
                return candidate.id;
        }
        return null;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/bridgeNodeFactory.js
    function createAndroidBridgeNodeFactory(options) {
        var nodes = options.nodes, pushCommand = options.pushCommand;
        var nextNodeId = 1;
        function createBaseNode(kind) {
            return createAndroidBridgeNodeBase(nextNodeId++, kind);
        }
        function createAnchorNode(label) {
            if (label === void 0) { label = ""; }
            var node = __assign(__assign({}, createBaseNode("anchor")), { label: label });
            nodes.set(node.id, node);
            return node;
        }
        function createElementNode(viewType, svg) {
            var node = __assign(__assign({}, createBaseNode("element")), { viewType: viewType, svg: svg, className: "", eventHandlers: {}, props: {}, styles: {} });
            pushCommand({
                type: "create-element",
                nodeId: node.id,
                viewType: viewType,
                svg: svg
            });
            nodes.set(node.id, node);
            return node;
        }
        function createFragmentNode() {
            var node = __assign({}, createBaseNode("fragment"));
            nodes.set(node.id, node);
            return node;
        }
        function createTextNode(value) {
            var node = __assign(__assign({}, createBaseNode("text")), { value: String(value) });
            pushCommand({
                type: "create-text",
                nodeId: node.id,
                value: node.value
            });
            nodes.set(node.id, node);
            return node;
        }
        return {
            createAnchorNode: createAnchorNode,
            createElementNode: createElementNode,
            createFragmentNode: createFragmentNode,
            createTextNode: createTextNode
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/viewTypes.js
    var AndroidViewTypeByTag = {
        a: "TextView",
        article: "ViewGroup",
        aside: "ViewGroup",
        button: "Button",
        div: "ViewGroup",
        em: "TextView",
        footer: "ViewGroup",
        form: "ViewGroup",
        h1: "TextView",
        h2: "TextView",
        h3: "TextView",
        h4: "TextView",
        h5: "TextView",
        h6: "TextView",
        header: "ViewGroup",
        img: "ImageView",
        image: "ImageView",
        input: "EditText",
        label: "TextView",
        li: "ViewGroup",
        main: "ViewGroup",
        nav: "ViewGroup",
        ol: "ViewGroup",
        p: "TextView",
        recycler: "RecyclerView",
        section: "ViewGroup",
        select: "Spinner",
        small: "TextView",
        span: "TextView",
        stack: "LinearLayout",
        strong: "TextView",
        switch: "Switch",
        textarea: "EditText",
        toggle: "Switch",
        "button-view": "Button",
        "image-view": "ImageView",
        "scroll-view": "ScrollView",
        "stack-view": "LinearLayout",
        "text-input": "EditText",
        "text-view": "TextView",
        "view-group": "ViewGroup",
        ul: "ViewGroup"
    };
    /**
    * Resolves Terajs element tags to concrete Android View types inside the Android package.
    * Standard HTML-like tags and native-flavored tags both collapse to Android primitives.
    */
    function resolveAndroidViewType(tag) {
        var trimmed = tag.trim();
        if (!trimmed)
            return "ViewGroup";
        var mapped = AndroidViewTypeByTag[trimmed.toLowerCase()];
        if (mapped)
            return mapped;
        if (/^[A-Z]/.test(trimmed))
            return trimmed;
        return trimmed;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/selectionProps.js
    var AndroidSelectionViewTypes = new Set(["EditText"]);
    function normalizeSelectionKey(name) {
        return name.replace(/[-_\s]/g, "").toLowerCase();
    }
    function normalizeSelectionIndex$2(value) {
        if (value == null)
            return null;
        if (typeof value === "number" && Number.isFinite(value))
            return Math.max(0, Math.trunc(value));
        if (typeof value === "string") {
            var trimmed = value.trim();
            if (!trimmed)
                return null;
            var parsed = Number(trimmed);
            if (Number.isFinite(parsed))
                return Math.max(0, Math.trunc(parsed));
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
        if (value == null)
            return {
                start: null,
                end: null
            };
        if (Array.isArray(value)) {
            var start = normalizeSelectionIndex$2(value[0]);
            var end = normalizeSelectionIndex$2(value[1]);
            var resolvedStart = start !== null && start !== void 0 ? start : end;
            var resolvedEnd = end !== null && end !== void 0 ? end : resolvedStart;
            if (resolvedStart == null || resolvedEnd == null)
                return null;
            return {
                start: resolvedStart,
                end: resolvedEnd
            };
        }
        if (typeof value === "object") {
            var _ref, _ref2, _record$start, _record$end;
            var record = value;
            var start = normalizeSelectionIndex$2((_ref = (_ref2 = (_record$start = record.start) !== null && _record$start !== void 0 ? _record$start : record.selectionStart) !== null && _ref2 !== void 0 ? _ref2 : record.caret) !== null && _ref !== void 0 ? _ref : record.cursor);
            var end = normalizeSelectionIndex$2((_record$end = record.end) !== null && _record$end !== void 0 ? _record$end : record.selectionEnd);
            var resolvedStart = start !== null && start !== void 0 ? start : end;
            var resolvedEnd = end !== null && end !== void 0 ? end : resolvedStart;
            if (resolvedStart == null || resolvedEnd == null)
                return null;
            return {
                start: resolvedStart,
                end: resolvedEnd
            };
        }
        var collapsed = normalizeSelectionIndex$2(value);
        if (collapsed == null)
            return null;
        return {
            start: collapsed,
            end: collapsed
        };
    }
    function normalizeAndroidSelectionProp(viewType, name, value) {
        if (!AndroidSelectionViewTypes.has(viewType))
            return null;
        var normalizedKey = normalizeSelectionKey(name);
        if (normalizedKey === "selectionstart")
            return {
                name: "selectionStart",
                value: normalizeSelectionIndex$2(value)
            };
        if (normalizedKey === "selectionend")
            return {
                name: "selectionEnd",
                value: normalizeSelectionIndex$2(value)
            };
        if (["caret", "cursor"].includes(normalizedKey)) {
            var collapsed = normalizeSelectionIndex$2(value);
            return createSelectionProp(collapsed, collapsed);
        }
        if (["selection", "selectionrange"].includes(normalizedKey)) {
            var range = normalizeSelectionRange(value);
            if (!range)
                return null;
            return createSelectionProp(range.start, range.end);
        }
        return null;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/inputProps.js
    var AndroidInputTraitViewTypes = new Set(["EditText"]);
    function normalizeInputKey(name) {
        return name.replace(/[-_\s]/g, "").toLowerCase();
    }
    function normalizeBooleanValue$2(value) {
        if (value == null)
            return null;
        if (typeof value === "boolean")
            return value;
        if (typeof value === "number")
            return value !== 0;
        if (typeof value === "string") {
            var normalized = value.trim().toLowerCase();
            if (!normalized)
                return false;
            if ([
                "false",
                "0",
                "off",
                "no"
            ].includes(normalized))
                return false;
            if ([
                "true",
                "1",
                "on",
                "yes"
            ].includes(normalized))
                return true;
        }
        return Boolean(value);
    }
    function normalizeStringValue(value) {
        if (value == null)
            return null;
        return String(value).trim().toLowerCase();
    }
    function resolveAndroidInputType(value) {
        var normalized = normalizeStringValue(value);
        if (!normalized)
            return null;
        switch (normalized) {
            case "email":
            case "emailaddress": return "textEmailAddress";
            case "tel":
            case "phone":
            case "telephone": return "phone";
            case "url": return "textUri";
            case "numeric":
            case "number": return "number";
            case "decimal": return "numberDecimal";
            case "search": return "text";
            default: return "text";
        }
    }
    function resolveAndroidImeOptions(value) {
        var normalized = normalizeStringValue(value);
        if (!normalized)
            return null;
        switch (normalized) {
            case "go": return "actionGo";
            case "next": return "actionNext";
            case "search": return "actionSearch";
            case "send": return "actionSend";
            default: return "actionDone";
        }
    }
    function resolveAndroidCapitalizeMode(value) {
        var normalized = normalizeStringValue(value);
        if (!normalized)
            return null;
        switch (normalized) {
            case "off":
            case "false":
            case "no":
            case "none": return "none";
            case "words": return "textCapWords";
            case "characters":
            case "allcharacters": return "textCapCharacters";
            default: return "textCapSentences";
        }
    }
    function normalizeAndroidInputProp(viewType, name, value) {
        var normalizedKey = normalizeInputKey(name);
        if (viewType === "EditText" && [
            "placeholder",
            "hint",
            "placeholdertext"
        ].includes(normalizedKey))
            return {
                name: "hint",
                value: value
            };
        if (!AndroidInputTraitViewTypes.has(viewType))
            return null;
        if ([
            "secure",
            "securetextentry",
            "password"
        ].includes(normalizedKey))
            return {
                name: "password",
                value: normalizeBooleanValue$2(value)
            };
        if (normalizedKey === "type")
            return {
                name: "password",
                value: normalizeStringValue(value) === "password"
            };
        if ([
            "inputmode",
            "inputtype",
            "keyboardtype"
        ].includes(normalizedKey))
            return {
                name: "inputType",
                value: resolveAndroidInputType(value)
            };
        if ([
            "enterkeyhint",
            "imeoptions",
            "imeoption"
        ].includes(normalizedKey))
            return {
                name: "imeOptions",
                value: resolveAndroidImeOptions(value)
            };
        if ([
            "autocapitalize",
            "autocapitalization",
            "inputcapsmode"
        ].includes(normalizedKey))
            return {
                name: "inputCapsMode",
                value: resolveAndroidCapitalizeMode(value)
            };
        if (["autocorrect", "autocorrection"].includes(normalizedKey))
            return {
                name: "autoCorrect",
                value: normalizeBooleanValue$2(value)
            };
        var selectionProp = normalizeAndroidSelectionProp(viewType, name, value);
        if (selectionProp)
            return selectionProp;
        return null;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/textInteractionProps.js
    var AndroidTextInteractionViewTypes = new Set(["EditText"]);
    function normalizeInteractionKey(name) {
        return name.replace(/[-_\s]/g, "").toLowerCase();
    }
    function normalizeBooleanValue$1(value) {
        if (value == null)
            return null;
        if (typeof value === "boolean")
            return value;
        if (typeof value === "number")
            return value !== 0;
        if (typeof value === "string") {
            var normalized = value.trim().toLowerCase();
            if (!normalized)
                return false;
            if ([
                "false",
                "0",
                "off",
                "no"
            ].includes(normalized))
                return false;
            if ([
                "true",
                "1",
                "on",
                "yes"
            ].includes(normalized))
                return true;
        }
        return Boolean(value);
    }
    function resolveEditableValue(normalizedKey, value) {
        var normalizedValue = normalizeBooleanValue$1(value);
        if (normalizedValue == null)
            return null;
        if (normalizedKey === "readonly")
            return !normalizedValue;
        return normalizedValue;
    }
    function normalizeAndroidTextInteractionProp(viewType, name, value) {
        if (!AndroidTextInteractionViewTypes.has(viewType))
            return null;
        var normalizedKey = normalizeInteractionKey(name);
        if (["editable", "readonly"].includes(normalizedKey))
            return {
                name: "editable",
                value: resolveEditableValue(normalizedKey, value)
            };
        if ([
            "selectable",
            "textselectable",
            "selectionenabled",
            "textisselectable"
        ].includes(normalizedKey))
            return {
                name: "textIsSelectable",
                value: normalizeBooleanValue$1(value)
            };
        return null;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/textLayoutProps.js
    var AndroidMultilineLayoutViewTypes = new Set(["EditText"]);
    function normalizeLayoutKey(name) {
        return name.replace(/[-_\s]/g, "").toLowerCase();
    }
    function normalizeLineCount(value) {
        if (value == null)
            return null;
        if (typeof value === "number" && Number.isFinite(value))
            return Math.max(1, Math.trunc(value));
        if (typeof value === "string") {
            var trimmed = value.trim();
            if (!trimmed)
                return null;
            var parsed = Number(trimmed);
            if (Number.isFinite(parsed))
                return Math.max(1, Math.trunc(parsed));
        }
        return null;
    }
    function normalizeAndroidTextLayoutProp(viewType, name, value) {
        if (!AndroidMultilineLayoutViewTypes.has(viewType))
            return null;
        var normalizedKey = normalizeLayoutKey(name);
        if (["rows", "lines"].includes(normalizedKey))
            return {
                name: "lines",
                value: normalizeLineCount(value)
            };
        if (["minrows", "minlines"].includes(normalizedKey))
            return {
                name: "minLines",
                value: normalizeLineCount(value)
            };
        if (["maxrows", "maxlines"].includes(normalizedKey))
            return {
                name: "maxLines",
                value: normalizeLineCount(value)
            };
        return null;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/textLimitProps.js
    var AndroidTextLimitViewTypes = new Set(["EditText"]);
    function normalizeLimitKey(name) {
        return name.replace(/[-_\s]/g, "").toLowerCase();
    }
    function normalizeLimitValue(value) {
        if (value == null)
            return null;
        if (typeof value === "number" && Number.isFinite(value))
            return Math.max(0, Math.trunc(value));
        if (typeof value === "string") {
            var trimmed = value.trim();
            if (!trimmed)
                return null;
            var parsed = Number(trimmed);
            if (Number.isFinite(parsed))
                return Math.max(0, Math.trunc(parsed));
        }
        return null;
    }
    function normalizeAndroidTextLimitProp(viewType, name, value) {
        if (!AndroidTextLimitViewTypes.has(viewType))
            return null;
        var normalizedKey = normalizeLimitKey(name);
        if ([
            "maxlength",
            "maxcharacters",
            "characterlimit",
            "textlimit"
        ].includes(normalizedKey))
            return {
                name: "maxLength",
                value: normalizeLimitValue(value)
            };
        return null;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/textViewportProps.js
    var AndroidTextViewportViewTypes = new Set(["EditText"]);
    function normalizeViewportKey(name) {
        return name.replace(/[-_\s]/g, "").toLowerCase();
    }
    function normalizeBooleanValue(value) {
        if (value == null)
            return null;
        if (typeof value === "boolean")
            return value;
        if (typeof value === "number")
            return value !== 0;
        if (typeof value === "string") {
            var normalized = value.trim().toLowerCase();
            if (!normalized)
                return false;
            if ([
                "false",
                "0",
                "off",
                "no"
            ].includes(normalized))
                return false;
            if ([
                "true",
                "1",
                "on",
                "yes"
            ].includes(normalized))
                return true;
        }
        return Boolean(value);
    }
    function normalizeInsetNumber(value) {
        if (typeof value === "number" && Number.isFinite(value))
            return value;
        if (typeof value === "string") {
            var trimmed = value.trim();
            if (!trimmed)
                return null;
            var parsed = Number(trimmed);
            if (Number.isFinite(parsed))
                return parsed;
        }
        return null;
    }
    function createInsets(top, right, bottom, left) {
        return {
            top: top,
            right: right,
            bottom: bottom,
            left: left
        };
    }
    function normalizeInsetList(values) {
        if (values.length === 0 || values.length > 4)
            return null;
        var normalizedValues = values.map(normalizeInsetNumber);
        if (normalizedValues.some(function (entry) { return entry == null; }))
            return null;
        var first = normalizedValues[0], second = normalizedValues[1], third = normalizedValues[2], fourth = normalizedValues[3];
        switch (normalizedValues.length) {
            case 1: return createInsets(first, first, first, first);
            case 2: return createInsets(first, second, first, second);
            case 3: return createInsets(first, second, third, second);
            default: return createInsets(first, second, third, fourth);
        }
    }
    function normalizeInsetRecord(record) {
        var _normalizeInsetNumber, _normalizeInsetNumber2, _ref, _normalizeInsetNumber3, _ref2, _normalizeInsetNumber4, _ref3, _ref4, _normalizeInsetNumber5, _ref5, _ref6, _normalizeInsetNumber6;
        var all = normalizeInsetNumber(record.all);
        var vertical = (_normalizeInsetNumber = normalizeInsetNumber(record.vertical)) !== null && _normalizeInsetNumber !== void 0 ? _normalizeInsetNumber : normalizeInsetNumber(record.y);
        var horizontal = (_normalizeInsetNumber2 = normalizeInsetNumber(record.horizontal)) !== null && _normalizeInsetNumber2 !== void 0 ? _normalizeInsetNumber2 : normalizeInsetNumber(record.x);
        var top = (_ref = (_normalizeInsetNumber3 = normalizeInsetNumber(record.top)) !== null && _normalizeInsetNumber3 !== void 0 ? _normalizeInsetNumber3 : vertical) !== null && _ref !== void 0 ? _ref : all;
        var right = (_ref2 = (_normalizeInsetNumber4 = normalizeInsetNumber(record.right)) !== null && _normalizeInsetNumber4 !== void 0 ? _normalizeInsetNumber4 : horizontal) !== null && _ref2 !== void 0 ? _ref2 : all;
        var bottom = (_ref3 = (_ref4 = (_normalizeInsetNumber5 = normalizeInsetNumber(record.bottom)) !== null && _normalizeInsetNumber5 !== void 0 ? _normalizeInsetNumber5 : vertical) !== null && _ref4 !== void 0 ? _ref4 : top) !== null && _ref3 !== void 0 ? _ref3 : all;
        var left = (_ref5 = (_ref6 = (_normalizeInsetNumber6 = normalizeInsetNumber(record.left)) !== null && _normalizeInsetNumber6 !== void 0 ? _normalizeInsetNumber6 : horizontal) !== null && _ref6 !== void 0 ? _ref6 : right) !== null && _ref5 !== void 0 ? _ref5 : all;
        if (top == null || right == null || bottom == null || left == null)
            return null;
        return createInsets(top, right, bottom, left);
    }
    function normalizeTextViewportInsets(value) {
        var singleValue = normalizeInsetNumber(value);
        if (singleValue != null)
            return createInsets(singleValue, singleValue, singleValue, singleValue);
        if (Array.isArray(value))
            return normalizeInsetList(value);
        if (typeof value === "object" && value !== null)
            return normalizeInsetRecord(value);
        return null;
    }
    function normalizeAndroidTextViewportProp(viewType, name, value) {
        if (!AndroidTextViewportViewTypes.has(viewType))
            return null;
        var normalizedKey = normalizeViewportKey(name);
        if ([
            "scrollenabled",
            "scrollable",
            "scrollingenabled"
        ].includes(normalizedKey))
            return {
                name: "scrollEnabled",
                value: normalizeBooleanValue(value)
            };
        if ([
            "contentinset",
            "contentpadding",
            "textpadding"
        ].includes(normalizedKey))
            return {
                name: "contentPadding",
                value: normalizeTextViewportInsets(value)
            };
        return null;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/normalization.js
    var AndroidTextPropViewTypes = new Set([
        "Button",
        "EditText",
        "TextView"
    ]);
    var AndroidImagePropViewTypes = new Set(["ImageView"]);
    function normalizeNativeKey(name) {
        return name.replace(/[-_\s]/g, "").toLowerCase();
    }
    function normalizeAndroidProp(viewType, name, value) {
        var normalizedKey = normalizeNativeKey(name);
        var inputProp = normalizeAndroidInputProp(viewType, name, value);
        if (inputProp)
            return inputProp;
        var textLayoutProp = normalizeAndroidTextLayoutProp(viewType, name, value);
        if (textLayoutProp)
            return textLayoutProp;
        var textViewportProp = normalizeAndroidTextViewportProp(viewType, name, value);
        if (textViewportProp)
            return textViewportProp;
        var textInteractionProp = normalizeAndroidTextInteractionProp(viewType, name, value);
        if (textInteractionProp)
            return textInteractionProp;
        var textLimitProp = normalizeAndroidTextLimitProp(viewType, name, value);
        if (textLimitProp)
            return textLimitProp;
        if (AndroidImagePropViewTypes.has(viewType) && normalizedKey === "alt")
            return {
                name: "contentDescription",
                value: value
            };
        if (normalizedKey === "arialabel" || normalizedKey === "accessibilitylabel" || normalizedKey === "contentdescription")
            return {
                name: "contentDescription",
                value: value
            };
        if (AndroidTextPropViewTypes.has(viewType) && [
            "text",
            "title",
            "label",
            "value"
        ].includes(normalizedKey))
            return {
                name: "text",
                value: value
            };
        if (AndroidImagePropViewTypes.has(viewType) && [
            "src",
            "source",
            "imagesource"
        ].includes(normalizedKey))
            return {
                name: "source",
                value: value
            };
        if (viewType === "Switch" && ["checked", "on"].includes(normalizedKey))
            return {
                name: "checked",
                value: Boolean(value)
            };
        return {
            name: name,
            value: value
        };
    }
    function normalizeAndroidEventName(viewType, name) {
        var normalizedKey = normalizeNativeKey(name);
        if ([
            "click",
            "press",
            "tap"
        ].includes(normalizedKey))
            return "press";
        if ([
            "change",
            "input",
            "toggle"
        ].includes(normalizedKey) && viewType === "Switch")
            return "change";
        if ([
            "input",
            "change",
            "textinput"
        ].includes(normalizedKey) && viewType === "EditText")
            return "change";
        if ([
            "selectionchange",
            "selection",
            "select",
            "caretchange",
            "cursorchange"
        ].includes(normalizedKey) && viewType === "EditText")
            return "selectionchange";
        if ([
            "beforeinput",
            "beforetextinput",
            "textbeforeinput"
        ].includes(normalizedKey) && viewType === "EditText")
            return "beforeinput";
        if ([
            "compositionstart",
            "composingstart",
            "imestart"
        ].includes(normalizedKey) && viewType === "EditText")
            return "compositionstart";
        if ([
            "compositionupdate",
            "composition",
            "composing",
            "imeupdate"
        ].includes(normalizedKey) && viewType === "EditText")
            return "compositionupdate";
        if ([
            "compositionend",
            "composingend",
            "imeend"
        ].includes(normalizedKey) && viewType === "EditText")
            return "compositionend";
        return name;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/styleNormalization.js
    function normalizeStyleValue(value) {
        var trimmed = value.trim();
        var pxMatch = /^(-?\d+(?:\.\d+)?)px$/i.exec(trimmed);
        return pxMatch ? pxMatch[1] : trimmed;
    }
    function normalizeOrientation(value) {
        return value === "row" ? "horizontal" : "vertical";
    }
    function normalizeGravity(value) {
        switch (value) {
            case "center": return "center";
            case "flex-end":
            case "end": return "end";
            case "space-between": return "space_between";
            default: return "start";
        }
    }
    function normalizeCrossAxis(value) {
        switch (value) {
            case "center": return "center";
            case "flex-end":
            case "end": return "end";
            case "stretch": return "fill";
            default: return "start";
        }
    }
    /**
    * Translates a small CSS-like style subset into Android-facing bridge style keys.
    * The mapping stays package-local so native layout concerns do not leak upward.
    */
    function normalizeAndroidStyle(viewType, style) {
        var normalized = {};
        for (var _i = 0, _a = Object.entries(style); _i < _a.length; _i++) {
            var _b = _a[_i], name = _b[0], rawValue = _b[1];
            var value = normalizeStyleValue(String(rawValue));
            switch (name) {
                case "display":
                    if (value === "flex" || value === "linear")
                        normalized.layoutMode = "linear";
                    break;
                case "flexDirection":
                    normalized.orientation = normalizeOrientation(value);
                    break;
                case "justifyContent":
                    normalized.gravity = normalizeGravity(value);
                    break;
                case "alignItems":
                    normalized.layoutGravity = normalizeCrossAxis(value);
                    break;
                case "gap":
                    normalized.spacing = value;
                    break;
                case "rowGap":
                    normalized.verticalSpacing = value;
                    break;
                case "columnGap":
                    normalized.horizontalSpacing = value;
                    break;
                case "padding":
                    normalized.padding = value;
                    break;
                case "paddingHorizontal":
                    normalized.paddingHorizontal = value;
                    break;
                case "paddingVertical":
                    normalized.paddingVertical = value;
                    break;
                case "margin":
                    normalized.layoutMargin = value;
                    break;
                case "marginTop":
                    normalized.layoutMarginTop = value;
                    break;
                case "marginRight":
                    normalized.layoutMarginRight = value;
                    break;
                case "marginBottom":
                    normalized.layoutMarginBottom = value;
                    break;
                case "marginLeft":
                    normalized.layoutMarginLeft = value;
                    break;
                case "marginHorizontal":
                    normalized.layoutMarginHorizontal = value;
                    break;
                case "marginVertical":
                    normalized.layoutMarginVertical = value;
                    break;
                case "background":
                case "backgroundColor":
                    normalized.backgroundColor = value;
                    break;
                case "color":
                    normalized.textColor = value;
                    break;
                case "borderRadius":
                    normalized.cornerRadius = value;
                    break;
                case "width":
                    normalized.layoutWidth = value;
                    break;
                case "height":
                    normalized.layoutHeight = value;
                    break;
                case "fontSize":
                    normalized.textSize = value;
                    break;
                default:
                    normalized[name] = value;
                    break;
            }
        }
        if (viewType === "LinearLayout" && normalized.layoutMode == null)
            normalized.layoutMode = "linear";
        return normalized;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/bridgeHost.js
    function createAndroidBridgeHost(options) {
        var _options$rootViewType;
        var nodes = options.nodes, pushCommand = options.pushCommand;
        var _a = createAndroidBridgeNodeFactory({
            nodes: nodes,
            pushCommand: pushCommand
        }), createAnchorNode = _a.createAnchorNode, createElementNode = _a.createElementNode, createFragmentNode = _a.createFragmentNode, createTextNode = _a.createTextNode;
        return {
            host: {
                createAnchor: function (label) {
                    if (label === void 0) { label = ""; }
                    return createAnchorNode(label);
                },
                createElement: function (type, svg) {
                    if (svg === void 0) { svg = false; }
                    return createElementNode(resolveAndroidViewType(type), svg);
                },
                createText: function (value) {
                    return createTextNode(value);
                },
                createFragment: function () {
                    return createFragmentNode();
                },
                isNode: function (value) {
                    return typeof value === "object" && value !== null && "kind" in value && "id" in value;
                },
                isFragment: function (node) {
                    return node.kind === "fragment";
                },
                getParent: function (node) {
                    return node.parent;
                },
                getNextSibling: function (node) {
                    var _parent$children;
                    var parent = node.parent;
                    if (!parent)
                        return null;
                    var index = parent.children.indexOf(node);
                    return index >= 0 ? (_parent$children = parent.children[index + 1]) !== null && _parent$children !== void 0 ? _parent$children : null : null;
                },
                getChildren: function (node) {
                    return __spreadArray([], node.children, true);
                },
                insert: function (parent, child, anchor) {
                    if (anchor === void 0) { anchor = null; }
                    if (child.kind === "fragment") {
                        var fragmentChildren = __spreadArray([], child.children, true);
                        child.children.length = 0;
                        for (var _i = 0, fragmentChildren_1 = fragmentChildren; _i < fragmentChildren_1.length; _i++) {
                            var fragmentChild = fragmentChildren_1[_i];
                            this.insert(parent, fragmentChild, anchor);
                        }
                        return;
                    }
                    var anchorId = resolveAndroidBridgeAnchorId(parent, anchor);
                    detachAndroidBridgeNode(child);
                    var anchorIndex = anchor ? parent.children.indexOf(anchor) : -1;
                    if (anchorIndex >= 0)
                        parent.children.splice(anchorIndex, 0, child);
                    else
                        parent.children.push(child);
                    child.parent = parent;
                    if (isAndroidNativeBackedNode(parent) && isAndroidNativeBackedNode(child))
                        pushCommand({
                            type: "insert",
                            parentId: parent.id,
                            childId: child.id,
                            anchorId: anchorId
                        });
                },
                remove: function (node) {
                    if (node.kind === "fragment") {
                        for (var _i = 0, _a = __spreadArray([], node.children, true); _i < _a.length; _i++) {
                            var child = _a[_i];
                            this.remove(child);
                        }
                        nodes.delete(node.id);
                        return;
                    }
                    disposeAndroidBridgeSubtree(node, nodes);
                    detachAndroidBridgeNode(node);
                    if (isAndroidNativeBackedNode(node))
                        pushCommand({
                            type: "remove",
                            nodeId: node.id
                        });
                },
                setText: function (node, value) {
                    node.value = String(value);
                    pushCommand({
                        type: "set-text",
                        nodeId: node.id,
                        value: node.value
                    });
                },
                setProp: function (el, name, value) {
                    var _normalized$additiona;
                    var normalized = normalizeAndroidProp(el.viewType, name, value);
                    var updates = __spreadArray([normalized], (_normalized$additiona = normalized.additional) !== null && _normalized$additiona !== void 0 ? _normalized$additiona : [], true);
                    for (var _i = 0, updates_1 = updates; _i < updates_1.length; _i++) {
                        var update = updates_1[_i];
                        var _update$value;
                        if (update.value == null)
                            delete el.props[update.name];
                        else
                            el.props[update.name] = update.value;
                        pushCommand({
                            type: "set-prop",
                            nodeId: el.id,
                            name: update.name,
                            value: (_update$value = update.value) !== null && _update$value !== void 0 ? _update$value : null
                        });
                    }
                },
                setStyle: function (el, style) {
                    var normalizedStyle = normalizeAndroidStyle(el.viewType, style);
                    el.styles = __assign(__assign({}, el.styles), normalizedStyle);
                    pushCommand({
                        type: "set-style",
                        nodeId: el.id,
                        style: normalizedStyle
                    });
                },
                setClass: function (el, className) {
                    el.className = className;
                    pushCommand({
                        type: "set-class",
                        nodeId: el.id,
                        className: className
                    });
                },
                addEvent: function (el, name, handler) {
                    var _el$eventHandlers$nat;
                    var nativeEventName = normalizeAndroidEventName(el.viewType, name);
                    var handlers = (_el$eventHandlers$nat = el.eventHandlers[nativeEventName]) !== null && _el$eventHandlers$nat !== void 0 ? _el$eventHandlers$nat : [];
                    var shouldSubscribe = handlers.length === 0;
                    handlers.push(handler);
                    el.eventHandlers[nativeEventName] = handlers;
                    if (shouldSubscribe)
                        pushCommand({
                            type: "subscribe-event",
                            nodeId: el.id,
                            name: nativeEventName
                        });
                },
                removeEvent: function (el, name, handler) {
                    var nativeEventName = normalizeAndroidEventName(el.viewType, name);
                    var current = el.eventHandlers[nativeEventName];
                    if (!(current === null || current === void 0 ? void 0 : current.length))
                        return;
                    var nextHandlers = current.filter(function (candidate) { return candidate !== handler; });
                    if (nextHandlers.length > 0) {
                        el.eventHandlers[nativeEventName] = nextHandlers;
                        return;
                    }
                    delete el.eventHandlers[nativeEventName];
                    pushCommand({
                        type: "unsubscribe-event",
                        nodeId: el.id,
                        name: nativeEventName
                    });
                },
                addNodeCleanup: function (node, cleanup) {
                    node.cleanups.push(cleanup);
                }
            },
            root: createElementNode((_options$rootViewType = options.rootViewType) !== null && _options$rootViewType !== void 0 ? _options$rootViewType : "ViewGroup", false)
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/bridge.js
    /**
    * Creates a thin command-oriented Android bridge that keeps renderer ownership in JS
    * and emits only host operations plus event subscription state toward native.
    */
    function createAndroidCommandBridge(options) {
        if (options === void 0) { options = {}; }
        var commands = [];
        var emitCommand = options.emitCommand;
        var nodes = /* @__PURE__ */ new Map();
        function pushCommand(command) {
            commands.push(command);
            emitCommand === null || emitCommand === void 0 || emitCommand(command);
        }
        var _a = createAndroidBridgeHost({
            nodes: nodes,
            pushCommand: pushCommand,
            rootViewType: options.rootViewType
        }), host = _a.host, root = _a.root;
        return {
            commands: commands,
            dispatchEvent: function (node, name, payload) {
                var _node$eventHandlers$n;
                for (var _i = 0, _a = __spreadArray([], (_node$eventHandlers$n = node.eventHandlers[name]) !== null && _node$eventHandlers$n !== void 0 ? _node$eventHandlers$n : [], true); _i < _a.length; _i++) {
                    var handler = _a[_i];
                    handler(payload);
                }
            },
            drainCommands: function () {
                var drained = __spreadArray([], commands, true);
                commands.length = 0;
                return drained;
            },
            getNode: function (nodeId) {
                return nodes.get(nodeId);
            },
            host: host,
            root: root
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/transportCodec.js
    function isRecord(value) {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    }
    function normalizeNumber(value, path) {
        if (typeof value !== "number" || !Number.isFinite(value))
            throw new Error("".concat(path, " must be a finite number"));
        return value;
    }
    function normalizeString(value, path) {
        if (typeof value !== "string")
            throw new Error("".concat(path, " must be a string"));
        return value;
    }
    function normalizeBoolean(value, path) {
        if (typeof value !== "boolean")
            throw new Error("".concat(path, " must be a boolean"));
        return value;
    }
    function normalizeStyleRecord(value, path) {
        if (!isRecord(value))
            throw new Error("".concat(path, " must be an object"));
        var result = {};
        for (var _i = 0, _a = Object.entries(value); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], entry = _b[1];
            result[key] = normalizeString(entry, "".concat(path, ".").concat(key));
        }
        return result;
    }
    function normalizeTransportValue(value, path, seen) {
        if (seen === void 0) { seen = new Set(); }
        if (value == null)
            return null;
        if (typeof value === "string" || typeof value === "boolean")
            return value;
        if (typeof value === "number") {
            if (!Number.isFinite(value))
                throw new Error("".concat(path, " must be a finite number"));
            return value;
        }
        if (typeof value !== "object")
            throw new Error("".concat(path, " must be JSON-safe"));
        if (seen.has(value))
            throw new Error("".concat(path, " must not be circular"));
        seen.add(value);
        if (Array.isArray(value)) {
            var result_1 = value.map(function (entry, index) { return normalizeTransportValue(entry, "".concat(path, "[").concat(index, "]"), seen); });
            seen.delete(value);
            return result_1;
        }
        var result = {};
        for (var _i = 0, _a = Object.entries(value); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], entry = _b[1];
            if (entry === void 0)
                continue;
            result[key] = normalizeTransportValue(entry, "".concat(path, ".").concat(key), seen);
        }
        seen.delete(value);
        return result;
    }
    function normalizeBridgeCommand(command, path) {
        if (!isRecord(command))
            throw new Error("".concat(path, " must be an object"));
        var type = normalizeString(command.type, "".concat(path, ".type"));
        switch (type) {
            case "create-element": return {
                type: type,
                nodeId: normalizeNumber(command.nodeId, "".concat(path, ".nodeId")),
                viewType: normalizeString(command.viewType, "".concat(path, ".viewType")),
                svg: normalizeBoolean(command.svg, "".concat(path, ".svg"))
            };
            case "create-text":
            case "set-text": return {
                type: type,
                nodeId: normalizeNumber(command.nodeId, "".concat(path, ".nodeId")),
                value: normalizeString(command.value, "".concat(path, ".value"))
            };
            case "insert": return {
                type: type,
                parentId: normalizeNumber(command.parentId, "".concat(path, ".parentId")),
                childId: normalizeNumber(command.childId, "".concat(path, ".childId")),
                anchorId: command.anchorId == null ? null : normalizeNumber(command.anchorId, "".concat(path, ".anchorId"))
            };
            case "remove": return {
                type: type,
                nodeId: normalizeNumber(command.nodeId, "".concat(path, ".nodeId"))
            };
            case "set-prop": return {
                type: type,
                nodeId: normalizeNumber(command.nodeId, "".concat(path, ".nodeId")),
                name: normalizeString(command.name, "".concat(path, ".name")),
                value: normalizeTransportValue(command.value, "".concat(path, ".value"))
            };
            case "set-style": return {
                type: type,
                nodeId: normalizeNumber(command.nodeId, "".concat(path, ".nodeId")),
                style: normalizeStyleRecord(command.style, "".concat(path, ".style"))
            };
            case "set-class": return {
                type: type,
                nodeId: normalizeNumber(command.nodeId, "".concat(path, ".nodeId")),
                className: normalizeString(command.className, "".concat(path, ".className"))
            };
            case "subscribe-event":
            case "unsubscribe-event": return {
                type: type,
                nodeId: normalizeNumber(command.nodeId, "".concat(path, ".nodeId")),
                name: normalizeString(command.name, "".concat(path, ".name"))
            };
            default: throw new Error("".concat(path, ".type is not a supported Android bridge command"));
        }
    }
    function normalizeNativeEventPacket(packet, path) {
        if (!isRecord(packet))
            throw new Error("".concat(path, " must be an object"));
        return __assign({ nodeId: normalizeNumber(packet.nodeId, "".concat(path, ".nodeId")), name: normalizeString(packet.name, "".concat(path, ".name")) }, packet.payload === void 0 ? {} : { payload: normalizeTransportValue(packet.payload, "".concat(path, ".payload")) });
    }
    function parseJsonInput(input) {
        return typeof input === "string" ? JSON.parse(input) : input;
    }
    function stringifyAndroidBridgeCommands(commands) {
        return JSON.stringify(commands.map(function (command, index) { return normalizeBridgeCommand(command, "commands[".concat(index, "]")); }));
    }
    function parseAndroidNativeEventPacket(input) {
        return normalizeNativeEventPacket(parseJsonInput(input), "packet");
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/consumerNodes.js
    function createAndroidNativeViewNode(nodeId, viewType) {
        return {
            id: nodeId,
            parent: null,
            kind: "view",
            viewType: viewType,
            className: "",
            children: [],
            props: {},
            styles: {},
            subscribedEvents: []
        };
    }
    function createAndroidNativeTextNode(nodeId, value) {
        return {
            id: nodeId,
            parent: null,
            kind: "text",
            value: value
        };
    }
    function requireAndroidNativeNode(nodes, nodeId) {
        var node = nodes.get(nodeId);
        if (!node)
            throw new Error("Unknown Android native node ".concat(nodeId));
        return node;
    }
    function requireAndroidNativeView(nodes, nodeId) {
        var node = requireAndroidNativeNode(nodes, nodeId);
        if (node.kind !== "view")
            throw new Error("Expected Android view node ".concat(nodeId));
        return node;
    }
    function requireAndroidNativeText(nodes, nodeId) {
        var node = requireAndroidNativeNode(nodes, nodeId);
        if (node.kind !== "text")
            throw new Error("Expected Android text node ".concat(nodeId));
        return node;
    }
    function detachAndroidNativeNode(node) {
        var parent = node.parent;
        if (!parent)
            return;
        var index = parent.children.indexOf(node);
        if (index !== -1)
            parent.children.splice(index, 1);
        node.parent = null;
    }
    function disposeAndroidNativeNode(node, nodes, clearRoot) {
        if (node.kind === "view") {
            for (var _i = 0, _a = __spreadArray([], node.children, true); _i < _a.length; _i++) {
                var child = _a[_i];
                disposeAndroidNativeNode(child, nodes, clearRoot);
            }
            node.children.length = 0;
            node.subscribedEvents = [];
        }
        detachAndroidNativeNode(node);
        nodes.delete(node.id);
        clearRoot(node.id);
    }
    function insertAndroidNativeChild(parent, child, anchorId) {
        detachAndroidNativeNode(child);
        if (anchorId != null) {
            var anchorIndex = parent.children.findIndex(function (candidate) { return candidate.id === anchorId; });
            if (anchorIndex !== -1) {
                parent.children.splice(anchorIndex, 0, child);
                child.parent = parent;
                return;
            }
        }
        parent.children.push(child);
        child.parent = parent;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/consumer.js
    /**
    * Replays thin Android bridge commands into an Android Views-shaped native tree
    * owned by the package-local consumer proof rather than the shared renderer.
    */
    function createAndroidCommandConsumer() {
        var nodes = /* @__PURE__ */ new Map();
        var root = null;
        function clearRoot(nodeId) {
            if ((root === null || root === void 0 ? void 0 : root.id) === nodeId)
                root = null;
        }
        function applyCommand(command) {
            switch (command.type) {
                case "create-element": {
                    var _root;
                    var node = createAndroidNativeViewNode(command.nodeId, command.viewType);
                    nodes.set(node.id, node);
                    (_root = root) !== null && _root !== void 0 || (root = node);
                    return;
                }
                case "create-text": {
                    var node = createAndroidNativeTextNode(command.nodeId, command.value);
                    nodes.set(node.id, node);
                    return;
                }
                case "insert":
                    insertAndroidNativeChild(requireAndroidNativeView(nodes, command.parentId), requireAndroidNativeNode(nodes, command.childId), command.anchorId);
                    return;
                case "remove":
                    disposeAndroidNativeNode(requireAndroidNativeNode(nodes, command.nodeId), nodes, clearRoot);
                    return;
                case "set-text":
                    requireAndroidNativeText(nodes, command.nodeId).value = command.value;
                    return;
                case "set-prop": {
                    var node = requireAndroidNativeView(nodes, command.nodeId);
                    if (command.value == null)
                        delete node.props[command.name];
                    else
                        node.props[command.name] = command.value;
                    return;
                }
                case "set-style": {
                    var node = requireAndroidNativeView(nodes, command.nodeId);
                    node.styles = __assign(__assign({}, node.styles), command.style);
                    return;
                }
                case "set-class":
                    requireAndroidNativeView(nodes, command.nodeId).className = command.className;
                    return;
                case "subscribe-event": {
                    var node = requireAndroidNativeView(nodes, command.nodeId);
                    if (!node.subscribedEvents.includes(command.name))
                        node.subscribedEvents.push(command.name);
                    return;
                }
                case "unsubscribe-event": {
                    var node = requireAndroidNativeView(nodes, command.nodeId);
                    node.subscribedEvents = node.subscribedEvents.filter(function (name) { return name !== command.name; });
                    return;
                }
                default: throw new Error("Unhandled Android bridge command ".concat(command.type));
            }
        }
        return {
            applyCommand: applyCommand,
            applyCommands: function (commands) {
                for (var _i = 0, commands_1 = commands; _i < commands_1.length; _i++) {
                    var command = commands_1[_i];
                    applyCommand(command);
                }
            },
            getNode: function (nodeId) {
                return nodes.get(nodeId);
            },
            get root() {
                return root;
            }
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/shared/dist/debug/core/registry.js
    /**
    * Debug registry for tracking composable instances and reactive primitives.
    */
    var currentComposable = null;
    function getCurrentComposable() {
        return currentComposable;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/shared/dist/debug/core/graphRegistry.js
    /**
    * In‑memory dependency graph registry.
    * Keyed by reactive identity (RID).
    */
    var nodes = /* @__PURE__ */ new Map();
    /**
    * Ensure a node exists for the given RID.
    */
    function getOrCreateNode(rid) {
        var node = nodes.get(rid);
        if (!node) {
            node = {
                rid: rid,
                dependsOn: /* @__PURE__ */ new Set(),
                dependents: /* @__PURE__ */ new Set()
            };
            nodes.set(rid, node);
        }
        return node;
    }
    /**
    * Add a dependency edge: from → to
    * Meaning: `from` depends on `to`.
    */
    function addDependency$1(fromRid, toRid) {
        if (fromRid === toRid)
            return;
        var from = getOrCreateNode(fromRid);
        var to = getOrCreateNode(toRid);
        from.dependsOn.add(toRid);
        to.dependents.add(fromRid);
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/shared/dist/debug/dependencyGraph.js
    /**
    * Public API for the dependency graph used by the rest of debug/core.
    * Re‑exports the underlying graph operations with stable names.
    */
    /**
    * Register a dependency: fromRid → toRid
    * Meaning: `fromRid` depends on `toRid`.
    */
    function addDependency(fromRid, toRid) {
        addDependency$1(fromRid, toRid);
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/shared/dist/debug/store.js
    function getSharedDebugState() {
        if (!globalThis.__TERAJS_SHARED_DEBUG_STATE__)
            globalThis.__TERAJS_SHARED_DEBUG_STATE__ = {
                history: [],
                listeners: /* @__PURE__ */ new Set()
            };
        return globalThis.__TERAJS_SHARED_DEBUG_STATE__;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/shared/dist/debug/history.js
    var MAX_PERSISTED_DEBUG_EVENTS = 4e3;
    var MAX_SERIALIZATION_DEPTH = 5;
    var MAX_ARRAY_ITEMS = 40;
    var MAX_OBJECT_KEYS = 40;
    function historyCache() {
        return getSharedDebugState().history;
    }
    /**
    * Coerces a live or replay debug event into the payload-based persisted shape
    * used by shared tooling and debug-history hydration.
    */
    function normalizePersistedDebugEvent(rawEvent) {
        if (!rawEvent || typeof rawEvent !== "object")
            return null;
        var event = rawEvent;
        var type = typeof event.type === "string" ? event.type : null;
        var timestamp = typeof event.timestamp === "number" ? event.timestamp : Date.now();
        if (!type)
            return null;
        var payload = sanitizeDebugValue(event.payload && typeof event.payload === "object" ? event.payload : Object.fromEntries(Object.entries(event).filter(function (_a) {
            var key = _a[0];
            return key !== "type" && key !== "timestamp" && key !== "level" && key !== "file" && key !== "line" && key !== "column";
        })));
        return {
            type: type,
            timestamp: timestamp,
            payload: payload && typeof payload === "object" && !Array.isArray(payload) ? payload : void 0,
            level: parseLevel(event.level),
            file: typeof event.file === "string" ? event.file : void 0,
            line: typeof event.line === "number" ? event.line : void 0,
            column: typeof event.column === "number" ? event.column : void 0
        };
    }
    /**
    * Normalizes and stores debug events in the shared in-memory ring buffer.
    */
    function recordDebugHistory(rawEvent) {
        var normalized = normalizePersistedDebugEvent(rawEvent);
        if (!normalized)
            return;
        var history = historyCache();
        history.push(normalized);
        if (history.length > MAX_PERSISTED_DEBUG_EVENTS)
            history.splice(0, history.length - MAX_PERSISTED_DEBUG_EVENTS);
    }
    function sanitizeDebugValue(value, depth, seen) {
        if (depth === void 0) { depth = 0; }
        if (seen === void 0) { seen = new WeakSet(); }
        if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean")
            return value;
        if (typeof value === "bigint" || typeof value === "symbol" || typeof value === "function")
            return String(value);
        if (value === void 0)
            return "undefined";
        if (depth >= MAX_SERIALIZATION_DEPTH)
            return "[max-depth]";
        if (Array.isArray(value))
            return value.slice(0, MAX_ARRAY_ITEMS).map(function (entry) { return sanitizeDebugValue(entry, depth + 1, seen); });
        if (typeof value !== "object")
            return String(value);
        if (seen.has(value))
            return "[circular]";
        seen.add(value);
        var entries = Object.entries(value).slice(0, MAX_OBJECT_KEYS);
        var normalized = Object.fromEntries(entries.map(function (_a) {
            var key = _a[0], entryValue = _a[1];
            return [key, sanitizeDebugValue(entryValue, depth + 1, seen)];
        }));
        seen.delete(value);
        return normalized;
    }
    function parseLevel(level) {
        if (level === "info" || level === "warn" || level === "error")
            return level;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/shared/dist/debug/events.js
    /**
    * @file events.ts
    * @description
    * Terajs's internal debugging substrate.
    */
    var handlers = /* @__PURE__ */ new Set();
    function getGlobalDevtoolsHook() {
        if (typeof globalThis !== "object" || globalThis === null)
            return;
        return globalThis.__TERAJS_DEVTOOLS_HOOK__;
    }
    var Debug = {
        on: function (handler) {
            handlers.add(handler);
            return function () { return handlers.delete(handler); };
        },
        addDependency: function (fromRid, toRid) {
            addDependency(fromRid, toRid);
        },
        emit: function (type, payload) {
            var hook = getGlobalDevtoolsHook();
            var event = {
                type: type,
                timestamp: Date.now(),
                payload: payload
            };
            recordDebugHistory(event);
            if (handlers.size === 0 && !hook)
                return;
            for (var _i = 0, handlers_1 = handlers; _i < handlers_1.length; _i++) {
                var handler = handlers_1[_i];
                try {
                    handler(event);
                }
                catch (_unused) { }
            }
            if (hook)
                hook.emit(event);
        }
    };
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/shared/dist/debug/sharedEventSchema.js
    var sharedDebugEventDefinitions = [
        {
            type: "reactive:updated",
            category: "state",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "JS-owned reactive state changed and can be correlated by reactive id.",
            requiredPayloadKeys: ["rid"]
        },
        {
            type: "route:navigate:start",
            category: "route",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "A route transition started for a concrete destination.",
            requiredPayloadKeys: ["to"]
        },
        {
            type: "route:load:start",
            category: "route",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "Route-owned loading work began for a concrete destination.",
            requiredPayloadKeys: ["to"]
        },
        {
            type: "route:load:end",
            category: "route",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "Route-owned loading work finished for a concrete destination.",
            requiredPayloadKeys: ["to"]
        },
        {
            type: "route:changed",
            category: "route",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "The active route changed to a concrete destination.",
            requiredPayloadKeys: ["to"]
        },
        {
            type: "route:blocked",
            category: "route",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "A route transition was blocked by middleware or prerequisites.",
            requiredPayloadKeys: ["to"]
        },
        {
            type: "route:redirect",
            category: "route",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "A route transition redirected to a different destination.",
            requiredPayloadKeys: ["to", "redirectTo"]
        },
        {
            type: "route:warn",
            category: "route",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "A non-fatal routing issue occurred.",
            requiredPayloadKeys: ["message"]
        },
        {
            type: "route:meta:resolved",
            category: "route",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "Route metadata resolved for a concrete destination.",
            requiredPayloadKeys: ["to", "meta"]
        },
        {
            type: "error:router",
            category: "route",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "A routing failure occurred.",
            requiredPayloadKeys: ["message"]
        },
        {
            type: "queue:enqueue",
            category: "queue",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "A mutation entered the queue.",
            requiredPayloadKeys: ["id", "type"]
        },
        {
            type: "queue:conflict",
            category: "queue",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "A queued mutation conflicted with an existing entry.",
            requiredPayloadKeys: [
                "id",
                "type",
                "decision"
            ]
        },
        {
            type: "queue:retry",
            category: "queue",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "A queued mutation scheduled another retry attempt.",
            requiredPayloadKeys: [
                "id",
                "type",
                "attempts"
            ]
        },
        {
            type: "queue:fail",
            category: "queue",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "A queued mutation exhausted retries and failed.",
            requiredPayloadKeys: [
                "id",
                "type",
                "attempts",
                "error"
            ]
        },
        {
            type: "queue:flush",
            category: "queue",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "A queue flush completed with aggregate counts.",
            requiredPayloadKeys: [
                "flushed",
                "retried",
                "failed",
                "skipped",
                "pending"
            ]
        },
        {
            type: "queue:drained",
            category: "queue",
            targets: [
                "web",
                "android",
                "ios"
            ],
            description: "The queue drained after one or more flush attempts.",
            requiredPayloadKeys: ["flushed", "failed"]
        },
        {
            type: "bridge:commands",
            category: "bridge",
            targets: ["android", "ios"],
            description: "A native bridge drained a JS-to-host command batch.",
            requiredPayloadKeys: [
                "target",
                "direction",
                "commandCount"
            ]
        },
        {
            type: "bridge:event",
            category: "bridge",
            targets: ["android", "ios"],
            description: "A native bridge delivered a host event packet back into JS.",
            requiredPayloadKeys: [
                "target",
                "direction",
                "eventName",
                "nodeId"
            ]
        },
        {
            type: "bridge:error",
            category: "bridge",
            targets: ["android", "ios"],
            description: "A native bridge operation failed.",
            requiredPayloadKeys: ["target", "message"]
        }
    ];
    var SHARED_DEBUG_EVENT_TYPES = sharedDebugEventDefinitions.map(function (definition) { return definition.type; });
    new Map(sharedDebugEventDefinitions.map(function (definition) { return [definition.type, definition]; }));
    new Set(SHARED_DEBUG_EVENT_TYPES);
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/shared/dist/context.js
    var currentContext = null;
    function getCurrentContext() {
        return currentContext;
    }
    function setCurrentContext(ctx) {
        currentContext = ctx;
    }
    function createComponentContext() {
        return {
            disposers: [],
            props: null,
            frame: null,
            name: "Unknown",
            instance: 0,
            meta: void 0,
            ai: void 0,
            route: void 0,
            errorBoundary: void 0,
            mounted: [],
            updated: [],
            unmounted: []
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/debugRuntime.js
    var metadataPlaceholders = {
        ref: Object.freeze({
            rid: "",
            type: "ref",
            scope: "",
            instance: 0,
            createdAt: 0
        }),
        signal: Object.freeze({
            rid: "",
            type: "signal",
            scope: "",
            instance: 0,
            createdAt: 0
        }),
        reactive: Object.freeze({
            rid: "",
            type: "reactive",
            scope: "",
            instance: 0,
            createdAt: 0
        }),
        shallowReactive: Object.freeze({
            rid: "",
            type: "shallowReactive",
            scope: "",
            instance: 0,
            createdAt: 0
        }),
        readonly: Object.freeze({
            rid: "",
            type: "readonly",
            scope: "",
            instance: 0,
            createdAt: 0
        }),
        computed: Object.freeze({
            rid: "",
            type: "computed",
            scope: "",
            instance: 0,
            createdAt: 0
        }),
        effect: Object.freeze({
            rid: "",
            type: "effect",
            scope: "",
            instance: 0,
            createdAt: 0
        })
    };
    function getProductionMetadataPlaceholder(type) {
        return metadataPlaceholders[type];
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/deps.js
    /**
    * @file deps.ts
    * @description
    * Dependency tracking core for Terajs Reactivity.
    *
    * Manages the global execution context for reactive effects.
    * Using a stack-based approach with parent/child hierarchies allows
    * for clean disposal and nested tracking.
    */
    /**
    * The Global Effect Stack.
    *
    * Tracks the execution context of effects to handle nested reactivity.
    */
    var effectStack = [];
    /**
    * The currently active effect context.
    *
    * Any reactive 'state' accessed while this is non-null will automatically
    * register this effect as a subscriber.
    */
    var currentEffect = null;
    /**
    * Runs work without attaching nested effects to the currently active parent.
    *
    * This is used by computed getters so their internal runner is not treated as a
    * disposable child of whichever effect or watcher first reads the computed.
    */
    function withDetachedCurrentEffect(fn) {
        var previous = currentEffect;
        var previousStack = effectStack.slice();
        effectStack.length = 0;
        currentEffect = null;
        try {
            return fn();
        }
        finally {
            effectStack.length = 0;
            effectStack.push.apply(effectStack, previousStack);
            currentEffect = previous;
        }
    }
    /**
    * Places an effect onto the tracking stack and sets it as the active context.
    * Also wires parent/child relationships for nested effects.
    *
    * @param effect - The ReactiveEffect to begin tracking.
    */
    function pushEffect(effect) {
        if (currentEffect) {
            var _currentEffect, _currentEffect$childr;
            effect.parent = currentEffect;
            (_currentEffect$childr = (_currentEffect = currentEffect).children) !== null && _currentEffect$childr !== void 0 || (_currentEffect.children = []);
            currentEffect.children.push(effect);
        }
        else
            effect.parent = null;
        effectStack.push(effect);
        currentEffect = effect;
    }
    /**
    * Removes the top effect from the stack and restores the previous context.
    */
    function popEffect() {
        effectStack.pop();
        currentEffect = effectStack[effectStack.length - 1] || null;
    }
    /**
    * Provides access to the currently active effect context.
    *
    * @returns The currently active ReactiveEffect, or null if no effect is active.
    */
    function getCurrentEffect() {
        return currentEffect;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/dx/runtime.js
    var runtimeMode = "client";
    /**
    * Returns `true` when the runtime is operating in server-side rendering mode.
    *
    * @returns Whether the runtime is currently in server mode.
    */
    function isServer() {
        return runtimeMode === "server";
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/dx/batch.js
    var batchDepth = 0;
    var batchQueue = /* @__PURE__ */ new Set();
    /**
    * Whether we are currently inside a batch.
    */
    function shouldBatch() {
        return batchDepth > 0;
    }
    /**
    * Queue an effect to run when the batch flushes.
    */
    function queueEffect(eff) {
        batchQueue.add(eff);
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/effect.js
    /**
    * @file effect.ts
    * @description
    * Core reactive effect implementation for Terajs's fine-grained reactivity system.
    *
    * This version includes integration with the component execution context:
    * any effect created while a component is active will automatically register
    * a disposer with that component. When the component is unmounted, all such
    * effects are fully disposed and will no longer run.
    */
    /**
    * Creates a reactive effect that:
    * - tracks dependencies during execution
    * - re-runs when those dependencies change
    * - cleans up stale subscriptions before each run
    * - disposes nested child effects on re-run
    * - integrates with component lifecycle (auto-disposed on unmount)
    *
    * @param fn - The user-provided reactive function.
    * @param scheduler - Optional scheduler. If provided, the effect will not run immediately.
    *
    * @returns A `ReactiveEffect` function that can be manually disposed.
    */
    function effect(fn, scheduler) {
        var ctx = getCurrentContext();
        var owner = void 0;
        var context = void 0;
        /**
        * Internal reactive wrapper.
        * Handles cleanup, dependency tracking, nested effect disposal,
        * and execution of the user function.
        */
        var effectFn = function () {
            var _effectFn$children;
            if (!effectFn.active || isServer())
                return;
            if (effectFn.cleanups.length) {
                for (var _i = 0, _a = effectFn.cleanups; _i < _a.length; _i++) {
                    var cleanup_2 = _a[_i];
                    cleanup_2();
                }
                effectFn.cleanups.length = 0;
            }
            cleanup(effectFn);
            if ((_effectFn$children = effectFn.children) === null || _effectFn$children === void 0 ? void 0 : _effectFn$children.length) {
                for (var _b = 0, _c = effectFn.children; _b < _c.length; _b++) {
                    var child = _c[_b];
                    disposeEffect(child);
                }
                effectFn.children.length = 0;
            }
            pushEffect(effectFn);
            try {
                fn();
            }
            finally {
                popEffect();
            }
        };
        effectFn.deps = [];
        effectFn.cleanups = [];
        effectFn.children = [];
        effectFn.scheduler = scheduler;
        effectFn.active = true;
        effectFn._meta = getProductionMetadataPlaceholder("effect");
        effectFn._owner = owner;
        effectFn._context = context;
        /**
        * Component-context integration
        *
        * If a component is currently rendering, register a disposer
        * so this effect is automatically cleaned up on unmount.
        */
        if (ctx)
            ctx.disposers.push(function () { return disposeEffect(effectFn); });
        if (!scheduler)
            effectFn();
        return effectFn;
    }
    /**
    * Removes an effect from all dependency sets it is subscribed to.
    *
    * @param effectFn - The effect to clean up.
    */
    function cleanup(effectFn) {
        effectFn._meta;
        var deps = effectFn.deps;
        for (var i = 0; i < deps.length; i++)
            deps[i].delete(effectFn);
        deps.length = 0;
    }
    /**
    * Fully disposes an effect:
    * - unsubscribes from all dependencies
    * - runs cleanup callbacks
    * - recursively disposes nested child effects
    *
    * @param effectFn - The effect to dispose.
    */
    function disposeEffect(effectFn) {
        var _effectFn$children2;
        cleanup(effectFn);
        if (effectFn.cleanups.length) {
            for (var _i = 0, _a = effectFn.cleanups; _i < _a.length; _i++) {
                var fn = _a[_i];
                fn();
            }
            effectFn.cleanups.length = 0;
        }
        if ((_effectFn$children2 = effectFn.children) === null || _effectFn$children2 === void 0 ? void 0 : _effectFn$children2.length) {
            for (var _b = 0, _c = effectFn.children; _b < _c.length; _b++) {
                var child = _c[_b];
                disposeEffect(child);
            }
            effectFn.children.length = 0;
        }
        effectFn.active = false;
    }
    /**
    * Schedules an effect to run, respecting batching.
    *
    * @param effectFn - The effect to schedule.
    */
    function scheduleEffect(effectFn) {
        if (effectFn === currentEffect || !effectFn.active)
            return;
        if (effectFn.scheduler) {
            effectFn.scheduler();
            return;
        }
        if (shouldBatch())
            queueEffect(effectFn);
        else
            effectFn();
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/signal.js
    /**
    * @file signal.ts
    * Core fine-grained reactive primitive for Terajs.
    *
    * Fully integrated with the Terajs Debug Core:
    * - metadata creation
    * - reactive registry
    * - dependency graph
    * - typed debug events
    */
    var signalRegistry = /* @__PURE__ */ new Set();
    new FinalizationRegistry(function (ref) {
        signalRegistry.delete(ref);
    });
    /**
    * Create a reactive signal.
    *
    * @param value - The initial value.
    * @param options - Configuration for debugging and scoping.
    */
    function signal(value, options) {
        var _options$scope, _options$instance;
        var currentContext = getCurrentContext();
        (_options$scope = options === null || options === void 0 ? void 0 : options.scope) !== null && _options$scope !== void 0 || currentContext == null || currentContext.name;
        (_options$instance = options === null || options === void 0 ? void 0 : options.instance) !== null && _options$instance !== void 0 || currentContext == null || currentContext.instance;
        var meta = getProductionMetadataPlaceholder("signal");
        var sig = function () {
            if (currentEffect) {
                var _currentEffect$_meta;
                sig._dep.add(currentEffect);
                if (!currentEffect.deps.includes(sig._dep))
                    currentEffect.deps.push(sig._dep);
                (_currentEffect$_meta = currentEffect._meta) === null || _currentEffect$_meta === void 0 || _currentEffect$_meta.rid;
            }
            return sig._value;
        };
        sig._value = value;
        sig._dep = /* @__PURE__ */ new Set();
        sig._meta = meta;
        /**
        * Updates the signal's value and notifies all dependents.
        *
        * @param next - The new value to set.
        */
        sig.set = function (next) {
            var prev = sig._value;
            if (Object.is(prev, next))
                return;
            sig._value = next;
            var subs = Array.from(sig._dep);
            for (var _i = 0, subs_1 = subs; _i < subs_1.length; _i++) {
                var eff = subs_1[_i];
                if (eff.scheduler)
                    eff.scheduler();
                else
                    scheduleEffect(eff);
            }
        };
        /**
        * Updates the signal's value using a transformation function.
        *
        * @param fn - A function that takes the current value and returns a new one.
        */
        sig.update = function (fn) { return sig.set(fn(sig._value)); };
        return sig;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/ref.js
    /**
    * @file ref.ts
    * @description
    * Public-facing reactive primitive for Terajs.
    *
    * A `ref()` wraps a primitive value in a fine-grained `signal()` and exposes
    * a `.value` getter/setter. This mirrors Vue's ergonomics while maintaining
    * Terajs's explicit signal semantics.
    *
    * `ref()` is ideal for:
    * - primitive values (number, string, boolean)
    * - form inputs
    * - component-local state
    * - two-way bindings via `model()`
    *
    * Debug integration:
    * - Creates metadata via `createReactiveMetadata()`
    * - Registers itself in the global reactive registry
    * - Emits typed debug events on read/write
    * - Participates in the dependency graph automatically
    */
    /**
    * Creates a reactive reference around a primitive value.
    *
    * This is a thin ergonomic layer over Terajs's core `signal()`:
    * - `.value` reads track dependencies
    * - `.value = x` triggers updates
    * - no deep reactivity is introduced
    *
    * Debug behavior:
    * - Emits `reactive:created`, `reactive:read`, `reactive:updated`
    * - Registers metadata + current value in the debug registry
    *
    * @param initial - Initial value for the ref.
    * @param options - Optional metadata for debugging and scoping.
    * @returns A reactive reference with a `.value` property.
    */
    function ref(initial, options) {
        var _ref, _options$scope, _ref2, _options$instance;
        var currentContext = getCurrentContext();
        var scope = (_ref = (_options$scope = options === null || options === void 0 ? void 0 : options.scope) !== null && _options$scope !== void 0 ? _options$scope : currentContext === null || currentContext === void 0 ? void 0 : currentContext.name) !== null && _ref !== void 0 ? _ref : "UnknownScope";
        var instance = (_ref2 = (_options$instance = options === null || options === void 0 ? void 0 : options.instance) !== null && _options$instance !== void 0 ? _options$instance : currentContext === null || currentContext === void 0 ? void 0 : currentContext.instance) !== null && _ref2 !== void 0 ? _ref2 : 0;
        getProductionMetadataPlaceholder("ref");
        var sig = signal(initial, {
            scope: scope,
            instance: instance,
            key: options === null || options === void 0 ? void 0 : options.key,
            file: options === null || options === void 0 ? void 0 : options.file,
            line: options === null || options === void 0 ? void 0 : options.line,
            column: options === null || options === void 0 ? void 0 : options.column,
            composable: options === null || options === void 0 ? void 0 : options.composable,
            group: options === null || options === void 0 ? void 0 : options.group
        });
        var refObj = { _sig: sig };
        var applyRefValue = function (next) {
            sig();
            sig.set(next);
        };
        return new Proxy(refObj, {
            get: function (target, prop) {
                if (prop === "value")
                    return target._sig();
                return target[prop];
            },
            set: function (target, prop, value) {
                if (prop === "value") {
                    applyRefValue(value);
                    return true;
                }
                target[prop] = value;
                return true;
            }
        });
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/analyzer.js
    /**
    * @file analyzer.ts
    * Terajs Reactivity Analyzer (dev-only):
    * Warns about large objects/arrays made reactive, deep reactivity, and suggests markStatic/memo.
    * DX-first: actionable, non-noisy, and opt-in for production builds.
    */
    var LARGE_ARRAY_THRESHOLD = 1e3;
    var LARGE_OBJECT_THRESHOLD = 100;
    /**
    * Checks if a value is a large array or object and warns if made reactive.
    * @param value - The value being made reactive
    * @param context - Optional context (file, line, etc.)
    */
    function analyzeReactivity(value, context) {
        if (Array.isArray(value) && value.length > LARGE_ARRAY_THRESHOLD)
            console.warn("[Terajs Analyzer] Large array (".concat(value.length, " items) made reactive").concat(contextMsg(context), ".\nConsider markStatic(arr) or memoization for better performance."));
        else if (isPlainObject(value) && Object.keys(value).length > LARGE_OBJECT_THRESHOLD)
            console.warn("[Terajs Analyzer] Large object (".concat(Object.keys(value).length, " keys) made reactive").concat(contextMsg(context), ".\nConsider markStatic(obj) or memoization for better performance."));
    }
    function isPlainObject(val) {
        return val && typeof val === "object" && !Array.isArray(val);
    }
    function contextMsg(ctx) {
        if (!ctx)
            return "";
        var msg = " (";
        if (ctx.file)
            msg += ctx.file;
        if (ctx.line)
            msg += ":" + ctx.line;
        if (ctx.key)
            msg += ", key: " + ctx.key;
        msg += ")";
        return msg;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/reactive.js
    /**
    * @file reactive.ts
    * @description
    * Implements deep reactivity for objects and arrays using Terajs's
    * fine-grained signal system.
    *
    * Each property becomes its own signal, enabling:
    *
    * ```ts
    * const user = reactive({
    * name: "Gabriel",
    * address: { city: "Beaverton" }
    * });
    *
    * effect(() => console.log(user.address.city));
    * user.address.city = "Portland"; // triggers only that effect
    * ```
    *
    * This avoids the pitfalls of Proxy-only systems:
    * - no identity issues
    * - no deep Proxy recursion
    * - no over-tracking
    * - no array mutation traps
    *
    * The system also supports *dynamic* deep reactivity:
    * - adding new properties later
    * - adding new nested objects later
    * - effects re-running to subscribe to new nested signals
    */
    /** Determines if a value is a non-null object. */
    function isObject(value) {
        return typeof value === "object" && value !== null;
    }
    /**
    * Creates a signal + metadata + debug integration for a property.
    *
    * @typeParam T - The value type.
    * @param initial - Initial value for the property.
    * @param ctx - Metadata context (scope, instance, source location).
    * @param key - Optional property key for better identification.
    */
    function createTrackedSignal(initial, ctx, key) {
        var _ref2, _ctx$composable2;
        var globalLocation = typeof globalThis === "object" && globalThis !== null && "location" in globalThis ? globalThis.location : void 0;
        if (typeof __DEV__ !== "undefined" && __DEV__ || (globalLocation === null || globalLocation === void 0 ? void 0 : globalLocation.hostname) === "localhost" || false)
            analyzeReactivity(initial, ctx);
        var meta = getProductionMetadataPlaceholder("reactive");
        var sig = signal(initial, {
            scope: ctx.scope,
            instance: ctx.instance,
            key: key,
            file: ctx.file,
            line: ctx.line,
            column: ctx.column,
            composable: (_ref2 = (_ctx$composable2 = ctx.composable) !== null && _ctx$composable2 !== void 0 ? _ctx$composable2 : getCurrentComposable()) !== null && _ref2 !== void 0 ? _ref2 : void 0,
            group: ctx.group
        });
        sig._meta = meta;
        return sig;
    }
    /**
    * Wraps a value in either:
    * - a nested reactive object (if object/array)
    * - a tracked signal (if primitive)
    *
    * @param value - The value to wrap.
    * @param ctx - Metadata context.
    * @param key - Optional property key.
    */
    function wrap(value, ctx, key) {
        if (isObject(value) || Array.isArray(value))
            return reactive(value, ctx);
        return createTrackedSignal(value, ctx, key);
    }
    /**
    * Creates a deeply reactive object using signals-per-property.
    *
    * This supports:
    * - nested objects
    * - arrays
    * - dynamic property addition
    * - dynamic nested object addition
    *
    * It also ensures that nested reactive objects added later still
    * participate in dependency tracking, so patterns like:
    *
    * ```ts
    * const obj = reactive({});
    *
    * effect(() => {
    * obj.nested?.value;
    * });
    *
    * obj.nested = reactive({ value: 1 });
    * obj.nested.value = 2; // effect runs again
    * ```
    *
    * behave as expected.
    *
    * @param obj - The source object to wrap.
    * @param options - Optional metadata for debugging and scoping.
    * @returns A Proxy that exposes reactive reads/writes.
    */
    function reactive(obj, options) {
        var _ref3, _options$scope, _ref4, _options$instance;
        var currentContext = getCurrentContext();
        var ctx = {
            scope: (_ref3 = (_options$scope = options === null || options === void 0 ? void 0 : options.scope) !== null && _options$scope !== void 0 ? _options$scope : currentContext === null || currentContext === void 0 ? void 0 : currentContext.name) !== null && _ref3 !== void 0 ? _ref3 : "UnknownScope",
            instance: (_ref4 = (_options$instance = options === null || options === void 0 ? void 0 : options.instance) !== null && _options$instance !== void 0 ? _options$instance : currentContext === null || currentContext === void 0 ? void 0 : currentContext.instance) !== null && _ref4 !== void 0 ? _ref4 : 0,
            file: options === null || options === void 0 ? void 0 : options.file,
            line: options === null || options === void 0 ? void 0 : options.line,
            column: options === null || options === void 0 ? void 0 : options.column,
            composable: options === null || options === void 0 ? void 0 : options.composable,
            group: options === null || options === void 0 ? void 0 : options.group
        };
        getProductionMetadataPlaceholder("reactive");
        var store = {};
        for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
            var key = _a[_i];
            store[key] = wrap(obj[key], ctx, key);
        }
        return new Proxy(store, {
            get: function (target, prop, receiver) {
                var v = Reflect.get(target, prop, receiver);
                if (v === void 0 && !(prop in target)) {
                    v = wrap(void 0, ctx, String(prop));
                    Reflect.set(target, prop, v, receiver);
                }
                if (typeof v === "function" && "_dep" in v && "_value" in v)
                    return v();
                return v;
            },
            set: function (target, prop, value, receiver) {
                var existing = Reflect.get(target, prop, receiver);
                if (typeof existing === "function" && "_dep" in existing && "_value" in existing) {
                    var sig = existing;
                    sig();
                    if (isObject(value) || Array.isArray(value))
                        sig.set(reactive(value, ctx));
                    else
                        sig.set(value);
                    return true;
                }
                var wrapped = wrap(value, ctx, String(prop));
                Reflect.set(target, prop, wrapped, receiver);
                return true;
            }
        });
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/computed.js
    /**
    * @file computed.ts
    * @description
    * A lazily evaluated, cached derived reactive value.
    *
    * The getter `fn` is wrapped in an internal effect so that:
    * - its dependencies are tracked
    * - when those dependencies change, the computed is marked "dirty"
    * - the value is recomputed on next access
    */
    /**
    * Creates a derived reactive value that is lazily evaluated and cached.
    *
    * @typeParam T - The type of the value returned by the computed function.
    * @param fn - The "getter" function that calculates the derived state.
    * @returns A `Computed<T>` object with a `get()` method to access the value.
    */
    function computed(fn, options) {
        if (options === void 0) { options = {}; }
        var value;
        getCurrentContext();
        var owner = void 0;
        typeof options.key === "string" && options.key.trim().length > 0 && options.key.trim();
        owner === null || owner === void 0 || owner.scope;
        owner === null || owner === void 0 || owner.instance;
        getProductionMetadataPlaceholder("computed");
        /**
        * Cache invalidation flag.
        * When true, the value must be re-calculated on the next access.
        */
        var dirty = true;
        /**
        * Subscriber set: tracks which effects depend on this computed value.
        */
        var deps = /* @__PURE__ */ new Set();
        /**
        * Custom scheduler.
        *
        * Instead of immediately re-running the effect when a dependency changes,
        * we mark this computed as "dirty" and notify its own subscribers.
        */
        var scheduler = function () {
            dirty = true;
            new Set(deps).forEach(function (dep) {
                if (dep.scheduler)
                    dep.scheduler();
                else
                    scheduleEffect(dep);
            });
        };
        /**
        * Internal runner.
        *
        * Wraps the getter function in an effect to track its own internal dependencies.
        * We pass the `scheduler` so that dependency changes don't cause immediate re-runs,
        * but instead just trigger our "dirty" logic.
        */
        var runner = effect(function () {
            value = fn();
            dirty = false;
        }, scheduler);
        /**
        * Public accessor for the computed value.
        * Handles both lazy evaluation and dependency registration.
        */
        function get() {
            if (dirty)
                if (currentEffect)
                    withDetachedCurrentEffect(function () { return runner(); });
                else
                    runner();
            if (currentEffect) {
                var _currentEffect$_meta;
                deps.add(currentEffect);
                currentEffect.deps.push(deps);
                (_currentEffect$_meta = currentEffect._meta) === null || _currentEffect$_meta === void 0 || _currentEffect$_meta.rid;
            }
            return value;
        }
        return { get: get };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/dx/cleanup.js
    /**
    * @file onCleanup.ts
    * @description
    * Registers cleanup functions for reactive effects.
    *
    * Cleanup functions run:
    * - before the effect re-executes
    * - when the effect is stopped
    * - when the owning component is disposed
    */
    /**
    * Registers a cleanup function to be executed before the next run of the
    * currently active reactive effect.
    *
    * @param fn - The cleanup function to register.
    */
    function onEffectCleanup(fn) {
        var currentEffect = getCurrentEffect();
        if (currentEffect)
            currentEffect.cleanups.push(fn);
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/dx/dispose.js
    /**
    * @file dispose.ts
    * @description
    * Disposes of a reactive effect, unsubscribing it from all dependencies
    * and preventing future executions.
    *
    * This is essential for:
    * - component unmounting
    * - stopping watchers
    * - preventing ghost updates
    * - avoiding memory leaks
    */
    /**
    * Disposes of a reactive effect.
    *
    * Steps:
    * 1. Run cleanup functions
    * 2. Remove effect from all dependency sets
    * 3. Mark effect as inactive
    *
    * @param effectFn - The ReactiveEffect to dispose.
    */
    function dispose(effectFn) {
        if (effectFn.cleanups.length) {
            for (var _i = 0, _a = effectFn.cleanups; _i < _a.length; _i++) {
                var cleanup_3 = _a[_i];
                try {
                    cleanup_3();
                }
                catch (_unused) { }
            }
            effectFn.cleanups.length = 0;
        }
        if (effectFn.deps.length) {
            for (var _b = 0, _c = effectFn.deps; _b < _c.length; _b++) {
                var dep = _c[_b];
                dep.delete(effectFn);
            }
            effectFn.deps.length = 0;
        }
        effectFn.active = false;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/dx/watchEffect.js
    /**
    * @file watchEffect.ts
    * @description
    * High-level reactive side-effect primitive for Terajs's DX layer.
    *
    * `watchEffect()` runs a function immediately and re-runs it whenever any
    * reactive dependency accessed inside the function changes.
    *
    * It is built on top of the low-level `effect()` primitive, but adds:
    * - automatic cleanup handling via `onCleanup()`
    * - a stable `stop()` function for teardown
    * - devtools instrumentation
    *
    * ## Execution Model
    * - The effect runs immediately (unless SSR prevents execution)
    * - Before each re-run, the previous cleanup (if any) executes
    * - When `stop()` is called:
    * - all cleanups run
    * - the effect is removed from all dependency sets
    * - no further re-runs occur
    *
    * ## Debug Events Emitted
    * - `watchEffect:create`
    * - `watchEffect:run`
    * - `watchEffect:cleanup`
    * - `watchEffect:stop`
    */
    function watchEffect(fn, options) {
        if (options === void 0) { options = {}; }
        var ctx = getCurrentContext();
        ctx && (ctx.name, ctx.instance);
        ctx && (ctx.name, ctx.instance);
        typeof options.debugName === "string" && options.debugName.trim().length > 0 && options.debugName.trim();
        options.internalRuntimeOwner;
        var runner;
        runner = effect(function () {
            onEffectCleanup(function () { });
            fn();
        });
        return function () {
            for (var _i = 0, _a = runner.cleanups; _i < _a.length; _i++) {
                var cleanup_4 = _a[_i];
                try {
                    cleanup_4();
                }
                catch (_unused) { }
            }
            runner.cleanups.length = 0;
            for (var _b = 0, _c = runner.deps; _b < _c.length; _b++) {
                var dep = _c[_b];
                dep.delete(runner);
            }
            runner.deps.length = 0;
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/dx/watch.js
    /**
    * @file watch.ts
    * @description
    * High-level reactive watcher for Terajs's DX layer.
    *
    * `watch()` observes the *value* returned by a source getter and invokes a
    * callback whenever that value changes.
    *
    * Unlike `watchEffect()`:
    * - the callback does **not** run initially
    * - only changes to the *returned value* trigger the callback
    * - the callback receives `(newValue, oldValue, onCleanup)`
    *
    * ## Cleanup Semantics
    * Cleanup functions registered via `onCleanup()`:
    * - run before the next callback
    * - run when the watcher is stopped
    * - only one cleanup is active at a time
    *
    * ## Debug Events Emitted
    * - `watch:create` - when the watcher is created
    * - `watch:source` - when the source getter runs
    * - `watch:callback` - when the callback executes
    * - `watch:cleanup` - when the callback registers a cleanup
    * - `watch:stop` - when the watcher is disposed
    */
    /**
    * Watches a reactive source and invokes a callback whenever its value changes.
    *
    * @typeParam T - The type returned by the source getter.
    *
    * @param source - A getter whose reactive dependencies should be tracked.
    * @param callback - Invoked whenever the source value changes.
    * @returns A `stop()` function that disposes the watcher.
    */
    function watch(source, callback, options) {
        if (options === void 0) { options = {}; }
        var ctx = getCurrentContext();
        ctx && (ctx.name, ctx.instance);
        ctx && (ctx.name, ctx.instance);
        typeof options.debugName === "string" && options.debugName.trim().length > 0 && options.debugName.trim();
        var oldValue;
        var initialized = false;
        var stop = watchEffect(function () {
            var newValue = source();
            if (!initialized) {
                initialized = true;
                oldValue = newValue;
                return;
            }
            if (Object.is(newValue, oldValue))
                return;
            callback(newValue, oldValue, function (fn) {
                onEffectCleanup(fn);
            });
            oldValue = newValue;
        }, { internalRuntimeOwner: "watch" });
        return function () {
            stop();
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/reactivity/dist/dx/contract.js
    /**
    * @file contract.ts
    * @description
    * A contract is a shared reactive object passed explicitly between components.
    *
    * Contracts define a structured, reactive API shared between parent and child.
    */
    /**
    * Creates an explicit contract object.
    *
    * This version does **not** auto-wrap primitives.
    * Use this when you want full control over reactivity.
    *
    * @typeParam T - The shape of the contract.
    * @param shape - An object defining shared state and behavior.
    * @returns A frozen contract object.
    */
    function contract(shape) {
        return Object.freeze(shape);
    }
    /**
    * Creates a contract where primitive values are automatically wrapped in `ref()`.
    *
    * @typeParam T - The input shape.
    * @param shape - An object whose primitive values will be wrapped in refs.
    * @returns A frozen contract object with reactive primitives.
    */
    contract.reactive = function (shape) {
        var out = {};
        for (var key in shape) {
            var value = shape[key];
            if (isPrimitive(value))
                out[key] = ref(value);
            else
                out[key] = value;
        }
        return Object.freeze(out);
    };
    /**
    * Determines whether a value is a primitive.
    */
    function isPrimitive(v) {
        return v === null || typeof v !== "object" && typeof v !== "function";
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer/dist/renderFromIRExpressions.js
    var SIMPLE_PATH_RE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/;
    var SIMPLE_IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/;
    var RESERVED_LITERAL_RE = /^(?:true|false|null|undefined|NaN|Infinity)$/;
    var EXPRESSION_UNWRAP_LOCALS = Symbol.for("@terajs/expression-unwrap-locals");
    var expressionEvaluatorCache = /* @__PURE__ */ new Map();
    var expressionScopeCache = /* @__PURE__ */ new WeakMap();
    function isDirectBindingSource(value) {
        return typeof value === "function" && value !== null && "_dep" in value && "_value" in value || typeof value === "object" && value !== null && "_sig" in value;
    }
    function resolveDirectTextSource(ctx, expr) {
        var normalized = expr.trim();
        if (!SIMPLE_IDENTIFIER_RE.test(normalized) || RESERVED_LITERAL_RE.test(normalized))
            return;
        return ctx === null || ctx === void 0 ? void 0 : ctx[normalized];
    }
    function resolveHintedDirectSource(ctx, binding) {
        if (binding.segments.length !== 1)
            return;
        return ctx === null || ctx === void 0 ? void 0 : ctx[binding.segments[0]];
    }
    function resolveHintedPath(ctx, binding, invokeFinal) {
        return resolvePathSegments(ctx, binding.segments, invokeFinal);
    }
    function resolveExpr(ctx, expr) {
        var normalized = expr.trim();
        if (normalized.length === 0)
            return;
        if (isSimplePath(normalized))
            return resolveSimplePath(ctx, normalized, true);
        return evaluateExpression(ctx, normalized, void 0);
    }
    function resolveEventHandler(ctx, expr) {
        var normalized = expr.trim();
        if (normalized.length === 0)
            return;
        if (isSimplePath(normalized)) {
            var handler = resolveSimplePath(ctx, normalized, false);
            return typeof handler === "function" ? handler : void 0;
        }
        return function (event) {
            evaluateExpression(ctx, normalized, event);
        };
    }
    function isSimplePath(expr) {
        return SIMPLE_PATH_RE.test(expr) && !RESERVED_LITERAL_RE.test(expr);
    }
    function resolveSimplePath(ctx, expr, invokeFinal) {
        if (!ctx)
            return;
        return resolvePathSegments(ctx, expr.split("."), invokeFinal);
    }
    function resolvePathSegments(ctx, parts, invokeFinal) {
        if (!ctx)
            return;
        var current = ctx;
        for (var index = 0; index < parts.length; index += 1) {
            if (current == null)
                return;
            var value = current[parts[index]];
            var isLast = index === parts.length - 1;
            current = typeof value === "function" && (invokeFinal || !isLast) ? value() : value;
        }
        return current;
    }
    function evaluateExpression(ctx, expr, event) {
        var evaluator = getExpressionEvaluator(expr);
        try {
            return evaluator(getExpressionScope(ctx), event);
        }
        catch (error) {
            return;
        }
    }
    function getExpressionEvaluator(expr) {
        var cached = expressionEvaluatorCache.get(expr);
        if (cached)
            return cached;
        var evaluator = new Function("$ctx", "$event", [
            "const scope = $ctx ?? {};",
            "with (scope) {",
            "  return (".concat(expr, ");"),
            "}"
        ].join("\n"));
        expressionEvaluatorCache.set(expr, evaluator);
        return evaluator;
    }
    function getExpressionScope(ctx) {
        if (!ctx || typeof ctx !== "object")
            return ctx;
        var unwrapLocals = ctx[EXPRESSION_UNWRAP_LOCALS];
        if (!(unwrapLocals instanceof Set) || unwrapLocals.size === 0)
            return ctx;
        var cached = expressionScopeCache.get(ctx);
        if (cached)
            return cached;
        var scope = new Proxy(ctx, {
            get: function (target, property, receiver) {
                var value = Reflect.get(target, property, receiver);
                if (typeof property === "string" && unwrapLocals.has(property) && typeof value === "function" && value !== null && "_dep" in value && "_value" in value)
                    return value();
                return value;
            },
            has: function (target, property) {
                return Reflect.has(target, property);
            }
        });
        expressionScopeCache.set(ctx, scope);
        return scope;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer/dist/updateKeyedList.js
    function updateKeyedList(parent, oldItems, newItems, mount, unmount, move) {
        var index = 0;
        var oldEnd = oldItems.length - 1;
        var newEnd = newItems.length - 1;
        while (index <= oldEnd && index <= newEnd && oldItems[index].key === newItems[index].key)
            index += 1;
        while (index <= oldEnd && index <= newEnd && oldItems[oldEnd].key === newItems[newEnd].key) {
            oldEnd -= 1;
            newEnd -= 1;
        }
        if (index > oldEnd) {
            var anchor = newEnd + 1 < newItems.length ? newItems[newEnd + 1].node : null;
            while (index <= newEnd) {
                mount(newItems[index], parent, anchor);
                index += 1;
            }
            return;
        }
        if (index > newEnd) {
            while (index <= oldEnd) {
                unmount(oldItems[index], parent);
                index += 1;
            }
            return;
        }
        var oldStart = index;
        var newStart = index;
        var keyToNewIndex = /* @__PURE__ */ new Map();
        for (var middleIndex = newStart; middleIndex <= newEnd; middleIndex += 1)
            keyToNewIndex.set(newItems[middleIndex].key, middleIndex);
        var toMove = new Array(newEnd - newStart + 1).fill(-1);
        var moved = false;
        var maxNewIndexSoFar = 0;
        for (var middleIndex = oldStart; middleIndex <= oldEnd; middleIndex += 1) {
            var oldItem = oldItems[middleIndex];
            var newIndex = keyToNewIndex.get(oldItem.key);
            if (newIndex == null)
                unmount(oldItem, parent);
            else {
                toMove[newIndex - newStart] = middleIndex;
                if (newIndex < maxNewIndexSoFar)
                    moved = true;
                else
                    maxNewIndexSoFar = newIndex;
            }
        }
        if (!moved) {
            for (var middleIndex = newEnd; middleIndex >= newStart; middleIndex -= 1)
                if (toMove[middleIndex - newStart] === -1) {
                    var anchor = middleIndex + 1 < newItems.length ? newItems[middleIndex + 1].node : null;
                    mount(newItems[middleIndex], parent, anchor);
                }
            return;
        }
        var sequence = longestIncreasingSubsequence(toMove);
        var sequenceIndex = sequence.length - 1;
        for (var middleIndex = newEnd; middleIndex >= newStart; middleIndex -= 1) {
            var newItem = newItems[middleIndex];
            var anchor = middleIndex + 1 < newItems.length ? newItems[middleIndex + 1].node : null;
            if (toMove[middleIndex - newStart] === -1)
                mount(newItem, parent, anchor);
            else if (sequenceIndex < 0 || middleIndex - newStart !== sequence[sequenceIndex])
                move(newItem, parent, anchor);
            else
                sequenceIndex -= 1;
        }
    }
    function longestIncreasingSubsequence(values) {
        var previous = values.slice();
        var result = [];
        var start;
        var end;
        for (var index = 0; index < values.length; index += 1) {
            var value = values[index];
            if (value === -1)
                continue;
            if (result.length === 0 || values[result[result.length - 1]] < value) {
                previous[index] = result.length > 0 ? result[result.length - 1] : -1;
                result.push(index);
                continue;
            }
            start = 0;
            end = result.length - 1;
            while (start < end) {
                var middle = (start + end) / 2 | 0;
                if (values[result[middle]] < value)
                    start = middle + 1;
                else
                    end = middle;
            }
            if (value < values[result[start]]) {
                if (start > 0)
                    previous[index] = result[start - 1];
                result[start] = index;
            }
        }
        start = result.length;
        end = result[result.length - 1];
        while (start-- > 0) {
            result[start] = end;
            end = previous[end];
        }
        return result;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer/dist/hostIRForRenderer.js
    function createIRForRenderer(host) {
        var addNodeCleanup = host.addNodeCleanup, createAnchor = host.createAnchor, createFragment = host.createFragment, getChildren = host.getChildren, getNextSibling = host.getNextSibling, getParent = host.getParent, isFragment = host.isFragment;
        var insert = function (parent, child, anchor) { return host.insert(parent, child, anchor); };
        var remove = function (node) { return host.remove(node); };
        return function renderIRForNode(node, ctx, isSvg, renderNode) {
            var anchor = createAnchor("for");
            var parent = createFragment();
            insert(parent, anchor);
            var ownerContext = getCurrentContext();
            var identityState = createIRForIdentityState();
            var supportsKeyedReuse = node.body.length === 1;
            var rows = [];
            var rebuiltNodes = [];
            var clearRows = function () {
                for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                    var row = rows_1[_i];
                    remove(row.node);
                    disposeIRForRowRecord(row);
                }
                rows = [];
            };
            var clearRebuiltNodes = function () {
                for (var _i = 0, rebuiltNodes_1 = rebuiltNodes; _i < rebuiltNodes_1.length; _i++) {
                    var rebuiltNode = rebuiltNodes_1[_i];
                    remove(rebuiltNode);
                }
                rebuiltNodes = [];
            };
            var run = function () {
                var _getParent;
                var array = resolveExpr(ctx, node.each) || [];
                var mountTarget = (_getParent = getParent(anchor)) !== null && _getParent !== void 0 ? _getParent : parent;
                if (supportsKeyedReuse && Array.isArray(array)) {
                    var reusedRows = createKeyedIRForRows(node, ctx, isSvg, array, rows, ownerContext, identityState, renderNode, isFragment, getChildren);
                    if (reusedRows) {
                        if (rebuiltNodes.length > 0)
                            clearRebuiltNodes();
                        updateKeyedList(mountTarget, rows, reusedRows, function (item, target, anchorNode) { return insert(target, item.node, anchorNode); }, function (item) {
                            remove(item.node);
                            disposeIRForRowRecord(item);
                        }, function (item, target, anchorNode) { return insert(target, item.node, anchorNode); });
                        rows = reusedRows;
                        return;
                    }
                    clearRows();
                }
                if (rows.length > 0)
                    clearRows();
                rebuiltNodes = renderIRForByRebuild(node, ctx, isSvg, Array.isArray(array) ? array : [], mountTarget, anchor, renderNode, isFragment, getChildren, getNextSibling, insert, remove, rebuiltNodes);
            };
            var effectFn = effect(run);
            addNodeCleanup(anchor, function () {
                dispose(effectFn);
                clearRows();
                clearRebuiltNodes();
            });
            return parent;
        };
    }
    function renderIRForByRebuild(node, ctx, isSvg, array, parent, anchor, renderNode, isFragment, getChildren, getNextSibling, insert, remove, ownedNodes) {
        var _a;
        for (var _i = 0, ownedNodes_1 = ownedNodes; _i < ownedNodes_1.length; _i++) {
            var ownedNode = ownedNodes_1[_i];
            remove(ownedNode);
        }
        var nodes = [];
        for (var index = 0; index < array.length; index += 1) {
            var _node$index;
            var childCtx = __assign(__assign({}, ctx), (_a = {}, _a[node.item] = array[index], _a[(_node$index = node.index) !== null && _node$index !== void 0 ? _node$index : "i"] = index, _a));
            for (var _b = 0, _c = node.body; _b < _c.length; _b++) {
                var child = _c[_b];
                var dom = renderNode(child, childCtx, isSvg);
                if (dom)
                    nodes.push.apply(nodes, collectIRForRenderedNodes(dom, isFragment, getChildren));
            }
        }
        var ref = getNextSibling(anchor);
        for (var _d = 0, nodes_1 = nodes; _d < nodes_1.length; _d++) {
            var renderedNode = nodes_1[_d];
            var _ref;
            insert(parent, renderedNode, (_ref = ref) !== null && _ref !== void 0 ? _ref : null);
            ref = null;
        }
        return nodes;
    }
    function createKeyedIRForRows(node, ctx, isSvg, array, currentRows, ownerContext, identityState, renderNode, isFragment, getChildren) {
        var nextRows = [];
        var currentRowsByKey = new Map(currentRows.map(function (row) { return [row.key, row]; }));
        var seenCounts = /* @__PURE__ */ new Map();
        var _loop_1 = function (index) {
            var item = array[index];
            var key = createIRForRowKey(node, ctx, item, index, identityState, seenCounts);
            var existing = currentRowsByKey.get(key);
            if (existing) {
                currentRowsByKey.delete(key);
                withDetachedCurrentEffect(function () {
                    existing.itemSignal.set(item);
                    existing.indexSignal.set(index);
                });
                nextRows.push(existing);
                return "continue";
            }
            var created = createIRForRowRecord(node, ctx, isSvg, item, index, key, ownerContext, renderNode, isFragment, getChildren);
            if (!created) {
                for (var _i = 0, nextRows_1 = nextRows; _i < nextRows_1.length; _i++) {
                    var row = nextRows_1[_i];
                    if (!currentRowsByKey.has(row.key))
                        disposeIRForRowRecord(row);
                }
                return { value: null };
            }
            nextRows.push(created);
        };
        for (var index = 0; index < array.length; index += 1) {
            var state_1 = _loop_1(index);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return nextRows;
    }
    function createIRForIdentityState() {
        return {
            objectIds: /* @__PURE__ */ new WeakMap(),
            nextObjectId: 1
        };
    }
    function collectIRForRenderedNodes(node, isFragment, getChildren) {
        if (isFragment(node))
            return getChildren(node);
        return [node];
    }
    function createIRForRowKey(node, ctx, item, index, identityState, seenCounts) {
        var _resolveIRForRowIdent, _seenCounts$get;
        var base = describeIRForRowIdentity((_resolveIRForRowIdent = resolveIRForRowIdentity(node, ctx, item, index)) !== null && _resolveIRForRowIdent !== void 0 ? _resolveIRForRowIdent : item, index, identityState);
        var count = (_seenCounts$get = seenCounts.get(base)) !== null && _seenCounts$get !== void 0 ? _seenCounts$get : 0;
        seenCounts.set(base, count + 1);
        return "".concat(base, "::").concat(count);
    }
    function resolveIRForRowIdentity(node, ctx, item, index) {
        var _a;
        if (!node.key)
            return;
        if (node.key.kind === "static")
            return node.key.value;
        if (typeof node.key.value === "string") {
            var _node$index2;
            return resolveExpr(__assign(__assign({}, ctx), (_a = {}, _a[node.item] = item, _a[(_node$index2 = node.index) !== null && _node$index2 !== void 0 ? _node$index2 : "i"] = index, _a)), node.key.value);
        }
        return node.key.value;
    }
    function describeIRForRowIdentity(item, index, identityState) {
        if (item && typeof item === "object") {
            var candidate = item;
            if (candidate.key != null)
                return "key:".concat(String(candidate.key));
            if (candidate.id != null)
                return "id:".concat(String(candidate.id));
            var objectId = identityState.objectIds.get(item);
            if (!objectId) {
                objectId = identityState.nextObjectId;
                identityState.objectIds.set(item, objectId);
                identityState.nextObjectId += 1;
            }
            return "object:".concat(objectId);
        }
        if (typeof item === "function")
            return "function:".concat(index);
        return "value:".concat(typeof item, ":").concat(String(item));
    }
    function createIRForRowRecord(node, ctx, isSvg, item, index, key, ownerContext, renderNode, isFragment, getChildren) {
        var _getChildren$;
        var itemSignal = signal(item);
        var indexSignal = signal(index);
        var rowContext = createComponentContext();
        if (ownerContext) {
            rowContext.errorBoundary = ownerContext.errorBoundary;
            rowContext.route = ownerContext.route;
            rowContext.meta = ownerContext.meta;
            rowContext.ai = ownerContext.ai;
        }
        var rowChildContext = createIRForRowContext(node, ctx, itemSignal, indexSignal);
        var previousContext = getCurrentContext();
        var renderedNode = null;
        try {
            setCurrentContext(rowContext);
            withDetachedCurrentEffect(function () {
                renderedNode = renderNode(node.body[0], rowChildContext, isSvg);
            });
        }
        finally {
            setCurrentContext(previousContext);
        }
        if (!renderedNode)
            return null;
        var nodeForList = isFragment(renderedNode) ? (_getChildren$ = getChildren(renderedNode)[0]) !== null && _getChildren$ !== void 0 ? _getChildren$ : null : renderedNode;
        if (!nodeForList) {
            disposeIRForRowContext(rowContext);
            return null;
        }
        return {
            key: key,
            node: nodeForList,
            itemSignal: itemSignal,
            indexSignal: indexSignal,
            ownerContext: rowContext
        };
    }
    function createIRForRowContext(node, ctx, itemSignal, indexSignal) {
        var _a;
        var _node$index3;
        var indexName = (_node$index3 = node.index) !== null && _node$index3 !== void 0 ? _node$index3 : "i";
        var inheritedUnwrapLocals = ctx === null || ctx === void 0 ? void 0 : ctx[EXPRESSION_UNWRAP_LOCALS];
        var unwrapLocals = new Set(inheritedUnwrapLocals instanceof Set ? inheritedUnwrapLocals : []);
        var rowChildContext = __assign(__assign({}, ctx), (_a = {}, _a[node.item] = itemSignal, _a[indexName] = indexSignal, _a));
        unwrapLocals.add(node.item);
        unwrapLocals.add(indexName);
        Object.defineProperty(rowChildContext, EXPRESSION_UNWRAP_LOCALS, {
            configurable: true,
            enumerable: false,
            value: unwrapLocals
        });
        return rowChildContext;
    }
    function disposeIRForRowRecord(row) {
        disposeIRForRowContext(row.ownerContext);
    }
    function disposeIRForRowContext(ctx) {
        var disposers = ctx.disposers.splice(0, ctx.disposers.length);
        for (var _i = 0, disposers_1 = disposers; _i < disposers_1.length; _i++) {
            var cleanup_5 = disposers_1[_i];
            try {
                cleanup_5();
            }
            catch (_unused) { }
        }
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer/dist/hostIRShared.js
    function applyIRProps(el, props, ctx, runtime) {
        for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
            var prop = props_1[_i];
            switch (prop.kind) {
                case "static":
                    runtime.applyStaticProp(el, prop);
                    break;
                case "bind":
                    applyBindProp(el, prop, ctx, runtime);
                    break;
                case "event":
                    applyEventProp(el, prop, ctx, runtime);
                    break;
                default:
            }
        }
    }
    function normalizeSlotValue(value, runtime) {
        if (typeof value === "function")
            return normalizeSlotValue(value(), runtime);
        if (value == null || value === false || value === true)
            return runtime.createFragment();
        if (runtime.isNode(value))
            return value;
        if (Array.isArray(value)) {
            var fragment = runtime.createFragment();
            for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
                var item = value_1[_i];
                runtime.insert(fragment, normalizeSlotValue(item, runtime));
            }
            return fragment;
        }
        return runtime.createText(String(value));
    }
    function applyBindProp(el, prop, ctx, runtime) {
        var _prop$binding;
        if (((_prop$binding = prop.binding) === null || _prop$binding === void 0 ? void 0 : _prop$binding.kind) === "simple-path") {
            applyHintedBindProp(el, prop, ctx, prop.binding, runtime);
            return;
        }
        var expression = String(prop.value);
        if (prop.name === "class") {
            runtime.bindClass(el, function () { return resolveExpr(ctx, expression); });
            return;
        }
        if (prop.name === "style") {
            runtime.bindStyle(el, function () {
                var value = resolveExpr(ctx, expression);
                if (typeof value === "string")
                    return { color: value };
                return value || {};
            });
            return;
        }
        runtime.bindProp(el, prop.name, function () { return resolveExpr(ctx, expression); });
    }
    function applyHintedBindProp(el, prop, ctx, binding, runtime) {
        if (prop.name === "class") {
            runtime.bindClass(el, function () { return resolveHintedPath(ctx, binding, true); });
            return;
        }
        if (prop.name === "style") {
            runtime.bindStyle(el, function () {
                var value = resolveHintedPath(ctx, binding, true);
                if (typeof value === "string")
                    return { color: value };
                return value || {};
            });
            return;
        }
        var directSource = resolveHintedDirectSource(ctx, binding);
        if (isDirectBindingSource(directSource)) {
            runtime.bindDirectPropSource(el, prop.name, directSource);
            return;
        }
        runtime.bindProp(el, prop.name, function () { return resolveHintedPath(ctx, binding, true); });
    }
    function applyEventProp(el, prop, ctx, runtime) {
        var handler = resolveEventHandler(ctx, String(prop.value));
        if (typeof handler === "function") {
            runtime.bindEvent(el, prop.name, handler);
            return;
        }
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer/dist/createHostIRRenderer.js
    function createHostIRRenderer(runtime) {
        var _a = runtime.host, addNodeCleanup = _a.addNodeCleanup, createAnchor = _a.createAnchor, createElement = _a.createElement, createFragment = _a.createFragment, createText = _a.createText, getNextSibling = _a.getNextSibling, getParent = _a.getParent, isFragment = _a.isFragment, isNode = _a.isNode, setClass = _a.setClass, setProp = _a.setProp, setStyle = _a.setStyle;
        var insert = function (parent, child, anchor) { return runtime.host.insert(parent, child, anchor); };
        var remove = function (node) { return runtime.host.remove(node); };
        var _b = runtime.bindings, bindText = _b.bindText, bindDirectTextSource = _b.bindDirectTextSource, bindDirectPropSource = _b.bindDirectPropSource, bindProp = _b.bindProp, bindClass = _b.bindClass, bindStyle = _b.bindStyle, bindEvent = _b.bindEvent;
        var renderIRForNode = createIRForRenderer(runtime.host);
        var hostIRPropRuntime = {
            applyStaticProp: applyStaticProp,
            bindDirectPropSource: bindDirectPropSource,
            bindProp: bindProp,
            bindClass: bindClass,
            bindStyle: bindStyle,
            bindEvent: bindEvent
        };
        var hostSlotRuntime = {
            createFragment: createFragment,
            createText: createText,
            insert: function (parent, child) { return insert(parent, child); },
            isNode: isNode
        };
        function renderIRModule(ir, ctx) {
            var fragment = createFragment();
            for (var _i = 0, _a = ir.template; _i < _a.length; _i++) {
                var node = _a[_i];
                var dom = renderIRNode(node, ctx);
                if (dom)
                    insert(fragment, dom);
            }
            return fragment;
        }
        function renderIRNode(node, ctx, isSvg) {
            if (isSvg === void 0) { isSvg = false; }
            switch (node.type) {
                case "text": return renderIRText(node);
                case "interp": return renderIRInterpolation(node, ctx);
                case "element": return renderIRElement(node, ctx, isSvg);
                case "slot": return renderIRSlot(node, ctx, isSvg);
                case "if": return renderIRIf(node, ctx, isSvg);
                case "for": return renderIRForNode(node, ctx, isSvg, renderIRNode);
                case "portal": return null;
                default: return null;
            }
        }
        function renderIRText(node) {
            return createText(node.value);
        }
        function renderIRInterpolation(node, ctx) {
            var text = createText("");
            var hintedBinding = node.binding;
            if ((hintedBinding === null || hintedBinding === void 0 ? void 0 : hintedBinding.kind) === "simple-path") {
                var directSource = resolveHintedDirectSource(ctx, hintedBinding);
                if (isDirectBindingSource(directSource)) {
                    bindDirectTextSource(text, directSource);
                    return text;
                }
                bindText(text, function () { return resolveHintedPath(ctx, hintedBinding, true); });
                return text;
            }
            {
                var directSource = resolveDirectTextSource(ctx, node.expression);
                if (isDirectBindingSource(directSource)) {
                    bindDirectTextSource(text, directSource);
                    return text;
                }
            }
            bindText(text, function () { return resolveExpr(ctx, node.expression); });
            return text;
        }
        function renderIRElement(node, ctx, isSvg) {
            var component = resolveComponentBinding(ctx, node.tag);
            if (component)
                return renderIRComponent(node, component, ctx, isSvg);
            if (isComponentTag(node.tag))
                return null;
            var nextSvg = isSvg || node.tag === "svg";
            var el = createElement(node.tag, nextSvg);
            applyIRProps$1(el, node.props, ctx);
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                var dom = renderIRNode(child, ctx, nextSvg);
                if (dom)
                    insert(el, dom);
            }
            return el;
        }
        function renderIRComponent(node, component, ctx, isSvg) {
            var normalized = normalizeRenderedComponentValue(component(buildComponentProps(node, ctx, isSvg)), ctx);
            return normalized && isNode(normalized) ? normalized : null;
        }
        function renderIRSlot(node, ctx, isSvg) {
            var _node$name2, _ctx$slots;
            var slotName = (_node$name2 = node.name) !== null && _node$name2 !== void 0 ? _node$name2 : "default";
            var slotValue = ctx === null || ctx === void 0 || (_ctx$slots = ctx.slots) === null || _ctx$slots === void 0 ? void 0 : _ctx$slots[slotName];
            if (slotValue != null)
                return normalizeSlotValue(slotValue, hostSlotRuntime);
            var fragment = createFragment();
            for (var _i = 0, _a = node.fallback; _i < _a.length; _i++) {
                var child = _a[_i];
                var dom = renderIRNode(child, ctx, isSvg);
                if (dom)
                    insert(fragment, dom);
            }
            return fragment;
        }
        function renderIRIf(node, ctx, isSvg) {
            var anchor = createAnchor("if");
            var fragment = createFragment();
            insert(fragment, anchor);
            var ownedNodes = [];
            var effectFn = effect(function () {
                var _node$else;
                var branch = !!resolveExpr(ctx, node.condition) ? node.then : (_node$else = node.else) !== null && _node$else !== void 0 ? _node$else : [];
                var container = getParent(anchor);
                if (!container)
                    return;
                for (var _i = 0, ownedNodes_2 = ownedNodes; _i < ownedNodes_2.length; _i++) {
                    var ownedNode = ownedNodes_2[_i];
                    remove(ownedNode);
                }
                ownedNodes.length = 0;
                var ref = getNextSibling(anchor);
                for (var _a = 0, branch_1 = branch; _a < branch_1.length; _a++) {
                    var child = branch_1[_a];
                    var dom = renderIRNode(child, ctx, isSvg);
                    if (dom && isNode(dom)) {
                        var _ref;
                        insert(container, dom, (_ref = ref) !== null && _ref !== void 0 ? _ref : null);
                        ownedNodes.push(dom);
                        ref = null;
                    }
                }
            });
            addNodeCleanup(anchor, function () {
                dispose(effectFn);
                for (var _i = 0, ownedNodes_3 = ownedNodes; _i < ownedNodes_3.length; _i++) {
                    var ownedNode = ownedNodes_3[_i];
                    remove(ownedNode);
                }
                ownedNodes.length = 0;
            });
            return fragment;
        }
        function applyIRProps$1(el, props, ctx) {
            applyIRProps(el, props, ctx, hostIRPropRuntime);
        }
        function resolveComponentBinding(ctx, tag) {
            if (!isComponentTag(tag))
                return null;
            var registry = ctx === null || ctx === void 0 ? void 0 : ctx.__components;
            if (!registry || typeof registry !== "object")
                return null;
            var resolved = registry[tag];
            return typeof resolved === "function" ? resolved : null;
        }
        function buildComponentProps(node, ctx, isSvg) {
            var props = {};
            for (var _i = 0, _a = node.props; _i < _a.length; _i++) {
                var prop = _a[_i];
                if (prop.kind === "static") {
                    props[prop.name] = prop.value;
                    continue;
                }
                if (prop.kind === "bind") {
                    var _prop$binding;
                    props[prop.name] = ((_prop$binding = prop.binding) === null || _prop$binding === void 0 ? void 0 : _prop$binding.kind) === "simple-path" ? resolveHintedPath(ctx, prop.binding, true) : resolveExpr(ctx, String(prop.value));
                    continue;
                }
                if (prop.kind === "event") {
                    var handler = resolveEventHandler(ctx, String(prop.value));
                    if (typeof handler === "function")
                        props["on".concat(capitalize(prop.name))] = handler;
                }
            }
            if (node.children.length > 0)
                props.children = function () {
                    var fragment = createFragment();
                    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        var rendered = renderIRNode(child, ctx, isSvg);
                        if (rendered)
                            insert(fragment, rendered);
                    }
                    return fragment;
                };
            return props;
        }
        function normalizeRenderedComponentValue(value, ctx) {
            if (typeof value === "function")
                return normalizeRenderedComponentValue(value(ctx), ctx);
            var normalized = normalizeSlotValue(value, hostSlotRuntime);
            if (isFragment(normalized)) {
                var children = runtime.host.getChildren(normalized);
                if (children.length === 1)
                    return children[0];
            }
            return normalized;
        }
        function capitalize(value) {
            return value.charAt(0).toUpperCase() + value.slice(1);
        }
        function applyStaticProp(el, prop) {
            if (prop.name === "class") {
                var _prop$value;
                setClass(el, String((_prop$value = prop.value) !== null && _prop$value !== void 0 ? _prop$value : ""));
                return;
            }
            if (prop.name === "style" && typeof prop.value === "object") {
                var resolved = {};
                var styleObj = prop.value;
                for (var key in styleObj)
                    resolved[key] = String(styleObj[key]);
                setStyle(el, resolved);
                return;
            }
            if (prop.value != null)
                setProp(el, prop.name, prop.value);
        }
        return {
            renderIRModule: renderIRModule,
            renderIRNode: renderIRNode
        };
    }
    function isComponentTag(tag) {
        if (typeof tag !== "string" || tag.length === 0)
            return false;
        var first = tag[0];
        return first >= "A" && first <= "Z";
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer/dist/unwrap.js
    function unwrap(value) {
        if (value && typeof value === "object" && "_sig" in value)
            return value._sig();
        if (typeof value === "function" && "_dep" in value && "_value" in value)
            return value();
        if (typeof value === "function")
            return value();
        return value;
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer/dist/hostBindings.js
    function isRefSource(value) {
        return typeof value === "object" && value !== null && "_sig" in value;
    }
    function disposeDirectSubscriber(dep, subscriber) {
        dep.delete(subscriber);
        subscriber.active = false;
    }
    function createHostBindings(runtime, options) {
        if (options === void 0) { options = {}; }
        var _options$setDirectTex;
        var setDirectTextValue = (_options$setDirectTex = options.setDirectTextValue) !== null && _options$setDirectTex !== void 0 ? _options$setDirectTex : runtime.setText;
        function subscribeTextSource(node, source) {
            var signalSource = isRefSource(source) ? source._sig : source;
            var dep = signalSource._dep;
            var subscriber = (function () {
                setDirectTextValue(node, signalSource._value);
            });
            subscriber.active = true;
            dep.add(subscriber);
            runtime.addNodeCleanup(node, function () {
                disposeDirectSubscriber(dep, subscriber);
            });
            setDirectTextValue(node, signalSource._value);
        }
        function subscribePropSource(el, name, source) {
            var signalSource = isRefSource(source) ? source._sig : source;
            var dep = signalSource._dep;
            var subscriber = (function () {
                if (subscriber.active === false)
                    return;
                runtime.setProp(el, name, signalSource._value);
            });
            subscriber.active = true;
            dep.add(subscriber);
            runtime.addNodeCleanup(el, function () {
                disposeDirectSubscriber(dep, subscriber);
            });
            runtime.setProp(el, name, signalSource._value);
        }
        return {
            bindText: function (node, compute) {
                effect(function () {
                    var value = unwrap(compute());
                    runtime.setText(node, value);
                });
            },
            bindDirectTextSource: function (node, source) {
                subscribeTextSource(node, source);
            },
            bindDirectPropSource: function (el, name, source) {
                subscribePropSource(el, name, source);
            },
            bindProp: function (el, name, compute) {
                effect(function () {
                    var value = unwrap(compute());
                    runtime.setProp(el, name, value);
                });
            },
            bindClass: function (el, compute) {
                effect(function () {
                    var value = unwrap(compute());
                    runtime.setClass(el, value);
                });
            },
            bindStyle: function (el, compute) {
                effect(function () {
                    var styleObj = unwrap(compute());
                    var resolved = {};
                    for (var key in styleObj)
                        resolved[key] = unwrap(styleObj[key]);
                    runtime.setStyle(el, resolved);
                });
            },
            bindEvent: function (el, name, handler) {
                runtime.addEvent(el, name, handler);
            },
            unbindEvent: function (el, name, handler) {
                runtime.removeEvent(el, name, handler);
            }
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/selectionEventPayload.js
    function normalizeSelectionIndex$1(value) {
        if (typeof value === "number" && Number.isFinite(value))
            return value;
        if (typeof value === "string") {
            var parsed = Number(value.trim());
            if (Number.isFinite(parsed))
                return parsed;
        }
    }
    function extractRangeFromSelectionValue(value) {
        var _normalizeSelectionIn, _normalizeSelectionIn2;
        if (typeof value === "number" && Number.isFinite(value))
            return {
                start: value,
                end: value
            };
        if (Array.isArray(value)) {
            var start_1 = normalizeSelectionIndex$1(value[0]);
            var end_1 = normalizeSelectionIndex$1(value[1]);
            var resolvedStart_1 = start_1 !== null && start_1 !== void 0 ? start_1 : end_1;
            var resolvedEnd_1 = end_1 !== null && end_1 !== void 0 ? end_1 : resolvedStart_1;
            if (resolvedStart_1 == null || resolvedEnd_1 == null)
                return;
            return {
                start: resolvedStart_1,
                end: resolvedEnd_1
            };
        }
        if (typeof value !== "object" || value === null)
            return;
        var record = value;
        if (record.selection !== void 0 && record.selection !== value) {
            var nested = extractRangeFromSelectionValue(record.selection);
            if (nested)
                return nested;
        }
        if (record.selectionRange !== void 0 && record.selectionRange !== value) {
            var nested = extractRangeFromSelectionValue(record.selectionRange);
            if (nested)
                return nested;
        }
        var selectionStart = normalizeSelectionIndex$1(record.selectionStart);
        var selectionEnd = normalizeSelectionIndex$1(record.selectionEnd);
        var start = (_normalizeSelectionIn = normalizeSelectionIndex$1(record.start)) !== null && _normalizeSelectionIn !== void 0 ? _normalizeSelectionIn : selectionStart;
        var end = (_normalizeSelectionIn2 = normalizeSelectionIndex$1(record.end)) !== null && _normalizeSelectionIn2 !== void 0 ? _normalizeSelectionIn2 : selectionEnd;
        var caret = normalizeSelectionIndex$1(record.caret);
        var resolvedStart = start !== null && start !== void 0 ? start : caret;
        var resolvedEnd = end !== null && end !== void 0 ? end : resolvedStart;
        if (resolvedStart == null || resolvedEnd == null)
            return;
        return {
            start: resolvedStart,
            end: resolvedEnd
        };
    }
    function extractAndroidSelectionRange(payload) {
        return extractRangeFromSelectionValue(payload);
    }
    function createAndroidSelectionPayload(range, payload) {
        var selection = {
            start: range.start,
            end: range.end
        };
        if (typeof payload === "object" && payload !== null && !Array.isArray(payload))
            return __assign(__assign({}, payload), { start: range.start, end: range.end, selectionStart: range.start, selectionEnd: range.end, selection: selection, selectionRange: selection });
        return {
            start: range.start,
            end: range.end,
            selectionStart: range.start,
            selectionEnd: range.end,
            selection: selection,
            selectionRange: selection
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/textEditPreview.js
    function extractAndroidTextEditRecord(payload) {
        if (typeof payload !== "object" || payload === null || Array.isArray(payload))
            return;
        return payload;
    }
    function normalizeSelectionIndex(value) {
        if (typeof value === "number" && Number.isFinite(value))
            return value;
        if (typeof value === "string") {
            var parsed = Number(value.trim());
            if (Number.isFinite(parsed))
                return parsed;
        }
    }
    function clampRange(range, maximum) {
        var start = Math.min(Math.max(0, range.start), maximum);
        var end = Math.min(Math.max(0, range.end), maximum);
        return start <= end ? {
            start: start,
            end: end
        } : {
            start: end,
            end: start
        };
    }
    function extractRangeLike(value) {
        var _ref, _ref2, _record$startOffset, _normalizeSelectionIn, _ref3, _record$endOffset;
        var directRange = extractAndroidSelectionRange(value);
        if (directRange)
            return directRange;
        if (typeof value !== "object" || value === null)
            return;
        var record = value;
        var start = normalizeSelectionIndex((_ref = (_ref2 = (_record$startOffset = record.startOffset) !== null && _record$startOffset !== void 0 ? _record$startOffset : record.rangeStart) !== null && _ref2 !== void 0 ? _ref2 : record.from) !== null && _ref !== void 0 ? _ref : record.location);
        var length = normalizeSelectionIndex(record.length);
        var end = (_normalizeSelectionIn = normalizeSelectionIndex((_ref3 = (_record$endOffset = record.endOffset) !== null && _record$endOffset !== void 0 ? _record$endOffset : record.rangeEnd) !== null && _ref3 !== void 0 ? _ref3 : record.to)) !== null && _normalizeSelectionIn !== void 0 ? _normalizeSelectionIn : start != null && length != null ? start + length : void 0;
        if (start == null || end == null)
            return;
        return {
            start: start,
            end: end
        };
    }
    function getCurrentText(props) {
        return typeof props.text === "string" ? props.text : "";
    }
    function getCurrentSelectionRange(props, currentText) {
        var _ref4, _ref5;
        var start = normalizeSelectionIndex(props.selectionStart);
        var end = normalizeSelectionIndex(props.selectionEnd);
        var fallback = currentText.length;
        return clampRange({
            start: (_ref4 = start !== null && start !== void 0 ? start : end) !== null && _ref4 !== void 0 ? _ref4 : fallback,
            end: (_ref5 = end !== null && end !== void 0 ? end : start) !== null && _ref5 !== void 0 ? _ref5 : fallback
        }, currentText.length);
    }
    function extractExplicitRange(record) {
        var _ref6, _ref7, _ref8, _extractRangeLike;
        var targetRanges = Array.isArray(record === null || record === void 0 ? void 0 : record.targetRanges) ? record.targetRanges : void 0;
        return record ? (_ref6 = (_ref7 = (_ref8 = (_extractRangeLike = extractRangeLike(record.replacementRange)) !== null && _extractRangeLike !== void 0 ? _extractRangeLike : extractRangeLike(record.replaceRange)) !== null && _ref8 !== void 0 ? _ref8 : extractRangeLike(record.targetRange)) !== null && _ref7 !== void 0 ? _ref7 : extractRangeLike(record.range)) !== null && _ref6 !== void 0 ? _ref6 : targetRanges ? targetRanges.map(extractRangeLike).find(function (range) { return range != null; }) : void 0 : void 0;
    }
    function extractTextRecordValue(value) {
        if (typeof value === "string")
            return value;
        if (typeof value !== "object" || value === null)
            return;
        return extractTextRecordValueDeep(value, /* @__PURE__ */ new Set());
    }
    function extractTextRecordValueDeep(value, seen) {
        if (typeof value === "string")
            return value;
        if (typeof value !== "object" || value === null || seen.has(value))
            return;
        seen.add(value);
        if (Array.isArray(value)) {
            for (var _i = 0, value_2 = value; _i < value_2.length; _i++) {
                var item = value_2[_i];
                var text = extractTextRecordValueDeep(item, seen);
                if (text != null)
                    return text;
            }
            return;
        }
        var record = value;
        for (var _a = 0, _b = [
            "text",
            "data",
            "value",
            "plainText",
            "textPlain",
            "string",
            "content",
            "clipboardText",
            "pastedText",
            "droppedText",
            "transferText",
            "replacementText",
            "insertedText",
            "insertText",
            "text/plain"
        ]; _a < _b.length; _a++) {
            var key = _b[_a];
            if (typeof record[key] === "string")
                return record[key];
        }
        if (typeof record.getData === "function")
            for (var _c = 0, _d = [
                "text/plain",
                "text",
                "plainText"
            ]; _c < _d.length; _c++) {
                var format = _d[_c];
                var text = record.getData(format);
                if (typeof text === "string" && text.length > 0)
                    return text;
            }
        for (var _e = 0, _f = [
            "items",
            "entries",
            "values",
            "payload",
            "item",
            "dataTransfer",
            "clipboardData",
            "transferData",
            "pasteData",
            "dropData"
        ]; _e < _f.length; _e++) {
            var key = _f[_e];
            var text = extractTextRecordValueDeep(record[key], seen);
            if (text != null)
                return text;
        }
    }
    function extractAndroidTextEditString(record, payload, keys) {
        if (keys === void 0) { keys = [
            "data",
            "insertedText",
            "insertText",
            "replacementText",
            "clipboardText",
            "pastedText",
            "droppedText",
            "transferText",
            "clipboardData",
            "dataTransfer",
            "transferData",
            "pasteData",
            "dropData"
        ]; }
        if (record)
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                var text = extractTextRecordValue(record[key]);
                if (text != null)
                    return text;
            }
        return extractTextRecordValue(payload);
    }
    function inferDeleteRange(inputType, currentSelection, currentText, explicitRange) {
        if (explicitRange || currentSelection.start !== currentSelection.end)
            return;
        var normalizedType = inputType === null || inputType === void 0 ? void 0 : inputType.trim().toLowerCase();
        if (!(normalizedType === null || normalizedType === void 0 ? void 0 : normalizedType.startsWith("delete")))
            return;
        if (normalizedType.includes("forward"))
            return currentSelection.start >= currentText.length ? void 0 : {
                start: currentSelection.start,
                end: currentSelection.start + 1
            };
        return currentSelection.start <= 0 ? void 0 : {
            start: currentSelection.start - 1,
            end: currentSelection.start
        };
    }
    function applyReplacement(text, replacementRange, replacementText) {
        return text.slice(0, replacementRange.start) + replacementText + text.slice(replacementRange.end);
    }
    function createResultSelectionRange(text, replacementRange, replacementText) {
        var caret = Math.min(replacementRange.start + replacementText.length, text.length);
        return {
            start: caret,
            end: caret
        };
    }
    function resolveAndroidTextEditPreview(props, payload, replacementText, options) {
        if (options === void 0) { options = {}; }
        var _options$record, _ref9, _inferDeleteRange;
        var record = (_options$record = options.record) !== null && _options$record !== void 0 ? _options$record : extractAndroidTextEditRecord(payload);
        var currentText = getCurrentText(props);
        var currentSelection = getCurrentSelectionRange(props, currentText);
        var explicitRange = extractExplicitRange(record);
        var baseReplacementRange = clampRange((_ref9 = explicitRange !== null && explicitRange !== void 0 ? explicitRange : extractAndroidSelectionRange(payload)) !== null && _ref9 !== void 0 ? _ref9 : currentSelection, currentText.length);
        var replacementRange = clampRange(options.allowDeleteInference ? (_inferDeleteRange = inferDeleteRange(options.inputType, currentSelection, currentText, explicitRange)) !== null && _inferDeleteRange !== void 0 ? _inferDeleteRange : baseReplacementRange : baseReplacementRange, currentText.length);
        var text = applyReplacement(currentText, replacementRange, replacementText);
        return {
            currentText: currentText,
            currentSelection: currentSelection,
            replacementRange: replacementRange,
            text: text,
            selectionRange: createResultSelectionRange(text, replacementRange, replacementText)
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/beforeInputEventPayload.js
    function extractInputType(record, replacementText, replacementRange) {
        if (record && typeof record.inputType === "string" && record.inputType.trim())
            return record.inputType;
        if (record) {
            if (record.clipboardData !== void 0 || record.clipboardText !== void 0 || record.pastedText !== void 0 || record.pasteData !== void 0)
                return "insertFromPaste";
            if (record.dataTransfer !== void 0 || record.droppedText !== void 0 || record.transferData !== void 0 || record.dropData !== void 0)
                return "insertFromDrop";
        }
        if (!replacementText && replacementRange.start !== replacementRange.end)
            return "deleteContent";
        return "insertText";
    }
    function extractAndroidBeforeInputState(props, payload) {
        var _extractAndroidTextEd;
        var record = extractAndroidTextEditRecord(payload);
        var data = (_extractAndroidTextEd = extractAndroidTextEditString(record, payload)) !== null && _extractAndroidTextEd !== void 0 ? _extractAndroidTextEd : "";
        var inputType = extractInputType(record, data, resolveAndroidTextEditPreview(props, payload, data, { record: record }).replacementRange);
        var preview = resolveAndroidTextEditPreview(props, payload, data, {
            record: record,
            inputType: inputType,
            allowDeleteInference: true
        });
        return {
            text: preview.text,
            data: data,
            inputType: inputType,
            replacementRange: preview.replacementRange,
            selectionRange: preview.selectionRange
        };
    }
    function createAndroidBeforeInputPayload(state, payload) {
        var selectionPayload = createAndroidSelectionPayload(state.selectionRange, payload);
        return __assign(__assign({}, typeof selectionPayload === "object" && selectionPayload !== null && !Array.isArray(selectionPayload) ? __assign({}, selectionPayload) : {}), { text: state.text, value: state.text, data: state.data, inputType: state.inputType, replacementRange: {
                start: state.replacementRange.start,
                end: state.replacementRange.end
            } });
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/compositionEventPayload.js
    function resolveDefaultComposing(eventName) {
        return eventName !== "compositionend";
    }
    function extractTextValue(record, payload) {
        if (record) {
            if (typeof record.value === "string")
                return record.value;
            if (typeof record.text === "string")
                return record.text;
        }
        return typeof payload === "string" ? payload : void 0;
    }
    function extractCompositionText(record, payload, fallback) {
        var _extractAndroidTextEd;
        return (_extractAndroidTextEd = extractAndroidTextEditString(record, payload, [
            "data",
            "composition",
            "insertedText",
            "insertText",
            "replacementText"
        ])) !== null && _extractAndroidTextEd !== void 0 ? _extractAndroidTextEd : fallback;
    }
    function extractComposingValue(record, fallback) {
        if (!record)
            return fallback;
        if (typeof record.composing === "boolean")
            return record.composing;
        if (typeof record.isComposing === "boolean")
            return record.isComposing;
        return fallback;
    }
    function createPreviewProps(props) {
        var baseText = typeof props.compositionBaseText === "string" ? props.compositionBaseText : void 0;
        var replacementRange = extractAndroidSelectionRange(props.compositionReplacementRange);
        if (baseText == null && replacementRange == null)
            return props;
        return __assign(__assign(__assign({}, props), baseText == null ? {} : { text: baseText }), replacementRange == null ? {} : {
            selectionStart: replacementRange.start,
            selectionEnd: replacementRange.end
        });
    }
    function extractAndroidCompositionState(props, eventName, payload) {
        var _extractAndroidSelect;
        var record = extractAndroidTextEditRecord(payload);
        var text = extractTextValue(record, payload);
        var compositionText = extractCompositionText(record, payload, text);
        var composing = extractComposingValue(record, resolveDefaultComposing(eventName));
        var previewProps = createPreviewProps(props);
        var preview = text == null && compositionText !== void 0 ? resolveAndroidTextEditPreview(previewProps, payload, compositionText, { record: record }) : void 0;
        return {
            text: text !== null && text !== void 0 ? text : preview === null || preview === void 0 ? void 0 : preview.text,
            compositionText: compositionText,
            composing: composing,
            selectionRange: (_extractAndroidSelect = extractAndroidSelectionRange(payload)) !== null && _extractAndroidSelect !== void 0 ? _extractAndroidSelect : preview === null || preview === void 0 ? void 0 : preview.selectionRange,
            replacementRange: preview === null || preview === void 0 ? void 0 : preview.replacementRange,
            baseText: preview === null || preview === void 0 ? void 0 : preview.currentText
        };
    }
    function createAndroidCompositionPayload(state, payload) {
        var selectionPayload = state.selectionRange ? createAndroidSelectionPayload(state.selectionRange, payload) : payload;
        return __assign(__assign(__assign(__assign(__assign({}, typeof selectionPayload === "object" && selectionPayload !== null && !Array.isArray(selectionPayload) ? __assign({}, selectionPayload) : {}), state.text == null ? {} : {
            text: state.text,
            value: state.text
        }), state.compositionText == null ? {} : {
            data: state.compositionText,
            composition: state.compositionText
        }), state.replacementRange == null ? {} : { replacementRange: {
                start: state.replacementRange.start,
                end: state.replacementRange.end
            } }), { composing: state.composing, isComposing: state.composing });
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/textEventConstraints.js
    function normalizeMaximumTextLength(value) {
        if (typeof value === "number" && Number.isFinite(value))
            return Math.max(0, Math.trunc(value));
        if (typeof value === "string") {
            var parsed = Number(value.trim());
            if (Number.isFinite(parsed))
                return Math.max(0, Math.trunc(parsed));
        }
    }
    function clampTextValue(value, maximumTextLength) {
        if (value == null || maximumTextLength == null)
            return value;
        return value.slice(0, maximumTextLength);
    }
    function clampSelectionRange(selectionRange, maximumIndex) {
        if (!selectionRange || maximumIndex == null)
            return selectionRange;
        return {
            start: Math.min(Math.max(0, selectionRange.start), maximumIndex),
            end: Math.min(Math.max(0, selectionRange.end), maximumIndex)
        };
    }
    function applyAndroidTextEventConstraints(props, state) {
        var _ref, _text$length;
        var maximumTextLength = normalizeMaximumTextLength(props.maxLength);
        if (maximumTextLength == null)
            return state;
        var text = clampTextValue(state.text, maximumTextLength);
        var compositionText = clampTextValue(state.compositionText, maximumTextLength);
        var maximumIndex = (_ref = (_text$length = text === null || text === void 0 ? void 0 : text.length) !== null && _text$length !== void 0 ? _text$length : compositionText === null || compositionText === void 0 ? void 0 : compositionText.length) !== null && _ref !== void 0 ? _ref : maximumTextLength;
        return __assign(__assign({}, state), { text: text, compositionText: compositionText, selectionRange: clampSelectionRange(state.selectionRange, maximumIndex) });
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/textEventPayload.js
    function extractAndroidTextValue(payload) {
        if (typeof payload === "string")
            return payload;
        if (typeof payload !== "object" || payload === null)
            return;
        var record = payload;
        if (typeof record.value === "string")
            return record.value;
        if (typeof record.text === "string")
            return record.text;
    }
    function createAndroidTextPayload(value, payload) {
        if (typeof payload === "object" && payload !== null && !Array.isArray(payload))
            return __assign(__assign({}, payload), { text: value, value: value });
        return {
            text: value,
            value: value
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/toggleEventPayload.js
    function extractAndroidToggleValue(payload) {
        if (typeof payload === "boolean")
            return payload;
        if (typeof payload !== "object" || payload === null)
            return;
        var record = payload;
        if (typeof record.checked === "boolean")
            return record.checked;
        if (typeof record.on === "boolean")
            return record.on;
    }
    function createAndroidTogglePayload(checked, payload) {
        if (typeof payload === "object" && payload !== null && !Array.isArray(payload))
            return __assign(__assign({}, payload), { checked: checked, on: checked });
        return {
            checked: checked,
            on: checked
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/eventIngress.js
    var AndroidTextInputViewTypes = new Set(["EditText"]);
    var AndroidSwitchViewTypes = new Set(["Switch"]);
    var AndroidBeforeInputEventNames = new Set(["beforeinput"]);
    var AndroidCompositionEventNames = new Set([
        "compositionstart",
        "compositionupdate",
        "compositionend"
    ]);
    /**
    * Normalizes inbound native Android events and syncs text-entry and toggle
    * state into the bridge and consumer proof trees before JS handlers run.
    */
    function ingestAndroidNativeEvent(bridgeNode, nativeNode, name, payload) {
        var normalizedName = normalizeAndroidEventName(bridgeNode.viewType, name);
        if (AndroidTextInputViewTypes.has(bridgeNode.viewType) && AndroidBeforeInputEventNames.has(normalizedName)) {
            var beforeInput = applyAndroidTextEventConstraints(bridgeNode.props, extractAndroidBeforeInputState(bridgeNode.props, payload));
            bridgeNode.props.text = beforeInput.text;
            bridgeNode.props.selectionStart = beforeInput.selectionRange.start;
            bridgeNode.props.selectionEnd = beforeInput.selectionRange.end;
            if ((nativeNode === null || nativeNode === void 0 ? void 0 : nativeNode.kind) === "view") {
                nativeNode.props.text = beforeInput.text;
                nativeNode.props.selectionStart = beforeInput.selectionRange.start;
                nativeNode.props.selectionEnd = beforeInput.selectionRange.end;
            }
            return {
                name: normalizedName,
                payload: createAndroidBeforeInputPayload(beforeInput, payload)
            };
        }
        if (AndroidTextInputViewTypes.has(bridgeNode.viewType) && normalizedName === "change") {
            var value = extractAndroidTextValue(payload);
            if (value != null) {
                var _applyAndroidTextEven;
                var constrainedText = (_applyAndroidTextEven = applyAndroidTextEventConstraints(bridgeNode.props, { text: value }).text) !== null && _applyAndroidTextEven !== void 0 ? _applyAndroidTextEven : value;
                bridgeNode.props.text = constrainedText;
                if ((nativeNode === null || nativeNode === void 0 ? void 0 : nativeNode.kind) === "view")
                    nativeNode.props.text = constrainedText;
                return {
                    name: normalizedName,
                    payload: createAndroidTextPayload(constrainedText, payload)
                };
            }
        }
        if (AndroidTextInputViewTypes.has(bridgeNode.viewType) && normalizedName === "selectionchange") {
            var range = extractAndroidSelectionRange(payload);
            if (range) {
                bridgeNode.props.selectionStart = range.start;
                bridgeNode.props.selectionEnd = range.end;
                if ((nativeNode === null || nativeNode === void 0 ? void 0 : nativeNode.kind) === "view") {
                    nativeNode.props.selectionStart = range.start;
                    nativeNode.props.selectionEnd = range.end;
                }
                return {
                    name: normalizedName,
                    payload: createAndroidSelectionPayload(range, payload)
                };
            }
        }
        if (AndroidTextInputViewTypes.has(bridgeNode.viewType) && AndroidCompositionEventNames.has(normalizedName)) {
            var composition = applyAndroidTextEventConstraints(bridgeNode.props, extractAndroidCompositionState(bridgeNode.props, normalizedName, payload));
            if (composition.text != null) {
                bridgeNode.props.text = composition.text;
                if ((nativeNode === null || nativeNode === void 0 ? void 0 : nativeNode.kind) === "view")
                    nativeNode.props.text = composition.text;
            }
            if (composition.selectionRange) {
                bridgeNode.props.selectionStart = composition.selectionRange.start;
                bridgeNode.props.selectionEnd = composition.selectionRange.end;
                if ((nativeNode === null || nativeNode === void 0 ? void 0 : nativeNode.kind) === "view") {
                    nativeNode.props.selectionStart = composition.selectionRange.start;
                    nativeNode.props.selectionEnd = composition.selectionRange.end;
                }
            }
            bridgeNode.props.composing = composition.composing;
            bridgeNode.props.compositionText = composition.composing ? composition.compositionText : void 0;
            bridgeNode.props.compositionBaseText = composition.composing ? composition.baseText : void 0;
            bridgeNode.props.compositionReplacementRange = composition.composing && composition.replacementRange ? {
                start: composition.replacementRange.start,
                end: composition.replacementRange.end
            } : void 0;
            if ((nativeNode === null || nativeNode === void 0 ? void 0 : nativeNode.kind) === "view") {
                nativeNode.props.composing = composition.composing;
                nativeNode.props.compositionText = composition.composing ? composition.compositionText : void 0;
                nativeNode.props.compositionBaseText = composition.composing ? composition.baseText : void 0;
                nativeNode.props.compositionReplacementRange = composition.composing && composition.replacementRange ? {
                    start: composition.replacementRange.start,
                    end: composition.replacementRange.end
                } : void 0;
            }
            return {
                name: normalizedName,
                payload: createAndroidCompositionPayload(composition, payload)
            };
        }
        if (AndroidSwitchViewTypes.has(bridgeNode.viewType) && normalizedName === "change") {
            var checked = extractAndroidToggleValue(payload);
            if (checked != null) {
                bridgeNode.props.checked = checked;
                if ((nativeNode === null || nativeNode === void 0 ? void 0 : nativeNode.kind) === "view")
                    nativeNode.props.checked = checked;
                return {
                    name: normalizedName,
                    payload: createAndroidTogglePayload(checked, payload)
                };
            }
        }
        return {
            name: normalizedName,
            payload: payload
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/sessionMountedModule.js
    function getAndroidRemovalPriority(node) {
        return node.kind === "anchor" ? 0 : 1;
    }
    function removeAndroidBridgeNodes(bridge, nodes) {
        var orderedNodes = __spreadArray([], nodes, true).sort(function (left, right) { return getAndroidRemovalPriority(left) - getAndroidRemovalPriority(right); });
        for (var _i = 0, orderedNodes_1 = orderedNodes; _i < orderedNodes_1.length; _i++) {
            var node = orderedNodes_1[_i];
            if (!bridge.getNode(node.id))
                continue;
            bridge.host.remove(node);
        }
    }
    function createAndroidMountedModule(bridge, nodes) {
        var removed = false;
        return {
            bridgeNodes: __spreadArray([], nodes, true),
            remove: function () {
                if (removed)
                    return;
                removed = true;
                removeAndroidBridgeNodes(bridge, nodes);
            }
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/session.js
    /**
    * Creates a package-local Android host session that mounts compiler IR through the
    * neutral host renderer runtime and replays the resulting command stream into the
    * Android Views-shaped native tree owned by this package.
    */
    function createAndroidHostSession() {
        var consumer = createAndroidCommandConsumer();
        var bridge = createAndroidCommandBridge({ emitCommand: function (command) {
                consumer.applyCommand(command);
            } });
        var renderer = createHostIRRenderer({
            host: bridge.host,
            bindings: createHostBindings(bridge.host)
        });
        function requireRoot() {
            var root = consumer.root;
            if (!root)
                throw new Error("Android host session root was not initialized");
            return root;
        }
        return {
            bridge: bridge,
            consumer: consumer,
            dispatchNativeEvent: function (nodeId, name, payload) {
                var node = bridge.getNode(nodeId);
                if (!node || node.kind !== "element")
                    throw new Error("Cannot dispatch Android native event for node ".concat(nodeId));
                var event = ingestAndroidNativeEvent(node, consumer.getNode(nodeId), name, payload);
                bridge.dispatchEvent(node, event.name, event.payload);
            },
            dispatchNativeEventPacket: function (packet) {
                this.dispatchNativeEvent(packet.nodeId, packet.name, packet.payload);
            },
            getBridgeNode: function (nodeId) {
                return bridge.getNode(nodeId);
            },
            getNativeNode: function (nodeId) {
                return consumer.getNode(nodeId);
            },
            mountIRModule: function (ir, ctx) {
                var rendered = renderer.renderIRModule(ir, ctx);
                var bridgeNodes = bridge.host.getChildren(rendered);
                bridge.host.insert(bridge.root, rendered);
                return createAndroidMountedModule(bridge, bridgeNodes);
            },
            mountIRNode: function (node, ctx, isSvg) {
                if (isSvg === void 0) { isSvg = false; }
                var rendered = renderer.renderIRNode(node, ctx, isSvg);
                if (rendered)
                    bridge.host.insert(bridge.root, rendered);
                return rendered;
            },
            removeNode: function (nodeId) {
                var node = bridge.getNode(nodeId);
                if (!node || node.id === bridge.root.id)
                    return;
                bridge.host.remove(node);
            },
            get root() {
                return requireRoot();
            }
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/wireTransport.js
    /**
    * Wraps an Android host session with the package-local wire helpers a real native
    * host bridge will need: drained command batches out, event packets back in.
    */
    function createAndroidWireTransport(options) {
        if (options === void 0) { options = {}; }
        var _options$session;
        var session = (_options$session = options.session) !== null && _options$session !== void 0 ? _options$session : createAndroidHostSession();
        function drainCommandBatch() {
            var commands = session.bridge.drainCommands();
            if (commands.length > 0)
                Debug.emit("bridge:commands", {
                    target: "android",
                    direction: "js-to-host",
                    commandCount: commands.length
                });
            return commands;
        }
        function dispatchNativeEventPacket(packet) {
            Debug.emit("bridge:event", {
                target: "android",
                direction: "host-to-js",
                eventName: packet.name,
                nodeId: packet.nodeId
            });
            session.dispatchNativeEventPacket(packet);
        }
        return {
            session: session,
            drainCommandBatch: drainCommandBatch,
            drainCommandBatchPayload: function () {
                var commands = drainCommandBatch();
                return commands.length > 0 ? stringifyAndroidBridgeCommands(commands) : null;
            },
            dispatchNativeEventPacket: dispatchNativeEventPacket,
            dispatchNativeEventPacketPayload: function (payload) {
                dispatchNativeEventPacket(parseAndroidNativeEventPacket(payload));
            }
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/renderer-android/dist/generatedRouteRuntime.js
    var NOOP = function () { };
    var GENERATED_SETUP_RUNTIME = {
        createResource: NOOP,
        computed: computed,
        onCleanup: NOOP,
        onMounted: NOOP,
        onUnmounted: NOOP,
        reactive: reactive,
        ref: ref,
        signal: signal,
        watch: watch,
        watchEffect: watchEffect
    };
    function normalizePosixPath(input) {
        var absolute = input.startsWith("/");
        var segments = [];
        for (var _i = 0, _a = input.split("/"); _i < _a.length; _i++) {
            var part = _a[_i];
            if (!part || part === ".")
                continue;
            if (part === "..") {
                var previous = segments[segments.length - 1];
                if (previous && previous !== "..")
                    segments.pop();
                else if (!absolute)
                    segments.push(part);
                continue;
            }
            segments.push(part);
        }
        if (absolute)
            return segments.length > 0 ? "/".concat(segments.join("/")) : "/";
        return segments.join("/") || ".";
    }
    function dirnamePosix(filePath) {
        var normalized = normalizePosixPath(filePath);
        if (normalized === "/")
            return "/";
        var lastSlash = normalized.lastIndexOf("/");
        if (lastSlash < 0)
            return ".";
        if (lastSlash === 0)
            return "/";
        return normalized.slice(0, lastSlash);
    }
    function resolvePosixPath(fromDir, targetPath) {
        return normalizePosixPath(targetPath.startsWith("/") ? targetPath : "".concat(fromDir, "/").concat(targetPath));
    }
    function normalizeComponentProps(input) {
        if (!input || typeof input !== "object")
            return {};
        var next = __assign({}, input);
        delete next.children;
        delete next.slots;
        return next;
    }
    function normalizeSlots(input) {
        var slots = {};
        if (input && typeof input === "object" && input.slots && typeof input.slots === "object") {
            var _loop_2 = function (key) {
                var value = input.slots[key];
                slots[key] = typeof value === "function" ? value : function () { return value; };
            };
            for (var _i = 0, _a = Object.keys(input.slots); _i < _a.length; _i++) {
                var key = _a[_i];
                _loop_2(key);
            }
        }
        if (input && typeof input === "object" && Object.prototype.hasOwnProperty.call(input, "children") && input.children != null) {
            var value_3 = input.children;
            slots.default = typeof value_3 === "function" ? value_3 : function () { return value_3; };
        }
        return slots;
    }
    function pickBindings(names, source) {
        var next = {};
        for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
            var name = names_1[_i];
            if (Object.prototype.hasOwnProperty.call(source, name))
                next[name] = source[name];
        }
        return next;
    }
    function extractImportStatements(setupCode) {
        var _importsBlock$match;
        var setupStart = setupCode.indexOf("function __ssfc");
        return ((_importsBlock$match = (setupStart >= 0 ? setupCode.slice(0, setupStart) : "").match(/import[\s\S]*?(?:from\s+["'][^"']+["'];?|["'][^"']+["'];?)/g)) !== null && _importsBlock$match !== void 0 ? _importsBlock$match : []).flatMap(function (statement) {
            var fromMatch = statement.match(/^import\s+([\s\S]+?)\s+from\s+["']([^"']+)["'];?$/);
            if (!fromMatch)
                return [];
            return [{
                    clause: fromMatch[1].trim(),
                    source: fromMatch[2]
                }];
        });
    }
    function extractImportBindings(clause) {
        var bindings = /* @__PURE__ */ new Set();
        var normalized = clause.replace(/\s+/g, " ").trim();
        var namespaceMatch = normalized.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
        if (namespaceMatch)
            bindings.add(namespaceMatch[1]);
        var namedMatch = normalized.match(/\{([^}]+)\}/);
        if (namedMatch)
            for (var _i = 0, _a = namedMatch[1].split(","); _i < _a.length; _i++) {
                var entry = _a[_i];
                var trimmed = entry.trim();
                if (!trimmed)
                    continue;
                var aliasMatch = trimmed.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
                if (aliasMatch) {
                    bindings.add(aliasMatch[2]);
                    continue;
                }
                bindings.add(trimmed);
            }
        var defaultClause = normalized.replace(/\{[^}]+\}/, "").replace(/\*\s+as\s+[A-Za-z_$][\w$]*/, "").replace(/,/g, " ").trim();
        if (/^[A-Za-z_$][\w$]*$/.test(defaultClause))
            bindings.add(defaultClause);
        return __spreadArray([], bindings, true);
    }
    function resolveTerajsImportPath(moduleFilePath, importSource) {
        if (!importSource.endsWith(".tera"))
            return null;
        return resolvePosixPath(dirnamePosix(moduleFilePath), importSource);
    }
    function extractLocalTerajsImportMap(setupCode, moduleFilePath) {
        var resolved = /* @__PURE__ */ new Map();
        for (var _i = 0, _a = extractImportStatements(setupCode); _i < _a.length; _i++) {
            var entry = _a[_i];
            var resolvedPath = resolveTerajsImportPath(moduleFilePath, entry.source);
            if (!resolvedPath)
                continue;
            for (var _b = 0, _c = extractImportBindings(entry.clause); _b < _c.length; _b++) {
                var binding = _c[_b];
                resolved.set(binding, resolvedPath);
            }
        }
        return resolved;
    }
    function extractExecutableSetupCode(setupCode) {
        var setupStart = setupCode.indexOf("function __ssfc");
        return setupStart >= 0 ? setupCode.slice(setupStart) : setupCode;
    }
    function createGeneratedSetupExecutor(runtime, setupCode) {
        var executableSetupCode = extractExecutableSetupCode(setupCode);
        var argNames = Object.keys(runtime);
        var argValues = argNames.map(function (name) { return runtime[name]; });
        return new (Function.bind.apply(Function, __spreadArray(__spreadArray([void 0], argNames, false), ["".concat(executableSetupCode, "\nreturn __ssfc;")], false)))().apply(void 0, argValues);
    }
    function createAndroidGeneratedRouteTransport(options) {
        var _options$routes$find, _options$transport;
        var route = (_options$routes$find = options.routes.find(function (candidate) {
            var _options$initialPath;
            return candidate.path === ((_options$initialPath = options.initialPath) !== null && _options$initialPath !== void 0 ? _options$initialPath : "/");
        })) !== null && _options$routes$find !== void 0 ? _options$routes$find : options.routes[0];
        if (!route)
            throw new Error("Android generated route transport requires at least one route.");
        var pageModule = options.modules.find(function (module) { return module.filePath === route.filePath; });
        if (!pageModule)
            throw new Error("Missing Android generated page module for route ".concat(route.path, "."));
        var transport = (_options$transport = options.transport) !== null && _options$transport !== void 0 ? _options$transport : createAndroidWireTransport();
        var renderer = createHostIRRenderer({
            host: transport.session.bridge.host,
            bindings: createHostBindings(transport.session.bridge.host)
        });
        var modulesByFilePath = new Map(options.modules.map(function (module) { return [module.filePath, module]; }));
        var setupExecutorCache = /* @__PURE__ */ new Map();
        function getSetupExecutor(module) {
            var cached = setupExecutorCache.get(module.filePath);
            if (cached)
                return cached;
            var next = createGeneratedSetupExecutor(GENERATED_SETUP_RUNTIME, module.setupCode);
            setupExecutorCache.set(module.filePath, next);
            return next;
        }
        function createNamedComponentRegistry() {
            var registry = {};
            var _loop_4 = function (candidate) {
                if (candidate.kind !== "component" || !candidate.name)
                    return "continue";
                registry[candidate.name] = function (componentInput) { return renderGeneratedModule(candidate, componentInput); };
            };
            for (var _i = 0, _a = options.modules; _i < _a.length; _i++) {
                var candidate = _a[_i];
                _loop_4(candidate);
            }
            return registry;
        }
        function renderGeneratedModule(module, input) {
            var _getSetupExecutor;
            var props = normalizeComponentProps(input);
            var slots = normalizeSlots(input);
            var emit = function () { };
            var bindings = (_getSetupExecutor = getSetupExecutor(module)({
                props: props,
                slots: slots,
                emit: emit
            })) !== null && _getSetupExecutor !== void 0 ? _getSetupExecutor : {};
            var registry = __assign(__assign({}, createNamedComponentRegistry()), pickBindings(module.exposedBindings, bindings));
            var _loop_5 = function (bindingName, importFilePath) {
                var importedModule = modulesByFilePath.get(importFilePath);
                if (!importedModule)
                    return "continue";
                registry[bindingName] = function (componentInput) { return renderGeneratedModule(importedModule, componentInput); };
            };
            for (var _i = 0, _a = extractLocalTerajsImportMap(module.setupCode, module.filePath); _i < _a.length; _i++) {
                var _b = _a[_i], bindingName = _b[0], importFilePath = _b[1];
                _loop_5(bindingName, importFilePath);
            }
            return renderer.renderIRModule(module.ir, __assign(__assign({}, bindings), { props: props, slots: slots, emit: emit, __components: registry }));
        }
        var rootNode = renderGeneratedModule(pageModule);
        var _loop_3 = function (index) {
            var layout = modulesByFilePath.get(route.layouts[index].filePath);
            if (!layout)
                return "continue";
            var layoutContent = rootNode;
            rootNode = renderGeneratedModule(layout, {
                children: function () { return layoutContent; },
                slots: { default: function () { return layoutContent; } }
            });
        };
        for (var index = route.layouts.length - 1; index >= 0; index -= 1) {
            _loop_3(index);
        }
        transport.session.bridge.host.insert(transport.session.bridge.root, rootNode);
        return {
            route: route,
            transport: transport
        };
    }
    //#endregion
    //#region ../../../../../source/repos/terajs/packages/cli/dist/.android-live-runtime-PZ7rJn/entry.mjs
    function normalizeAssetPath(assetPath) {
        return assetPath.replace(/\\/g, "/");
    }
    function resolveAssetPath(baseAssetPath, relativePath) {
        var base = normalizeAssetPath(baseAssetPath);
        var target = normalizeAssetPath(relativePath);
        if (target.startsWith("/"))
            return target;
        var parts = base.split("/");
        parts.pop();
        for (var _i = 0, _a = target.split("/"); _i < _a.length; _i++) {
            var part = _a[_i];
            if (!part || part === ".")
                continue;
            if (part === "..") {
                if (parts.length > 0)
                    parts.pop();
                continue;
            }
            parts.push(part);
        }
        return parts.join("/");
    }
    function requireHostMethod(host, methodName) {
        var value = host && host[methodName];
        if (typeof value !== "function")
            throw new Error("Android native runtime host is missing ".concat(methodName, "()."));
        return value.bind(host);
    }
    function readTextAsset(host, assetPath) {
        var value = host.readTextAsset(assetPath);
        if (typeof value !== "string")
            throw new Error("Android native runtime host returned a non-string asset for ".concat(assetPath, "."));
        return value;
    }
    function readJsonAsset(host, assetPath) {
        return JSON.parse(readTextAsset(host, assetPath));
    }
    function loadRuntimeAssets(host, descriptorAssetPath, descriptor) {
        var generatedManifestAssetPath = resolveAssetPath(descriptorAssetPath, typeof descriptor.generatedManifestFile === "string" && descriptor.generatedManifestFile.length > 0 ? descriptor.generatedManifestFile : "../terajs-target.json");
        var routesAssetPath = resolveAssetPath(descriptorAssetPath, typeof descriptor.routesFile === "string" && descriptor.routesFile.length > 0 ? descriptor.routesFile : "../routes.json");
        var generatedManifest = readJsonAsset(host, generatedManifestAssetPath);
        var routes = readJsonAsset(host, routesAssetPath);
        return {
            modules: (generatedManifest.modules || []).map(function (moduleRecord) {
                var compiledModule = readJsonAsset(host, resolveAssetPath(generatedManifestAssetPath, moduleRecord.outputPath));
                return __assign(__assign({}, moduleRecord), { setupCode: compiledModule.setupCode, ir: compiledModule.ir });
            }),
            routes: routes
        };
    }
    globalThis.__terajsNativeRuntime = { start: function (host) {
            requireHostMethod(host, "readTextAsset");
            var emitCommandBatch = requireHostMethod(host, "emitCommandBatch");
            var descriptorAssetPath = typeof host.runtimeDescriptorPath === "string" && host.runtimeDescriptorPath.length > 0 ? host.runtimeDescriptorPath : ".terajs/generated/android/runtime/generated-route-runtime.json";
            var descriptor = readJsonAsset(host, descriptorAssetPath);
            var _a = loadRuntimeAssets(host, descriptorAssetPath, descriptor), modules = _a.modules, routes = _a.routes;
            var _b = createAndroidGeneratedRouteTransport({
                modules: modules,
                routes: routes,
                initialPath: typeof descriptor.initialRoutePath === "string" && descriptor.initialRoutePath.length > 0 ? descriptor.initialRoutePath : "/"
            }), route = _b.route, transport = _b.transport;
            var flushPendingCommands = function () {
                var payload = transport.drainCommandBatchPayload();
                if (payload)
                    emitCommandBatch(payload);
                return payload;
            };
            var dispatchNativeEventPayload = function (payload) {
                transport.dispatchNativeEventPacketPayload(payload);
                flushPendingCommands();
            };
            if (typeof host.onNativeEvent === "function")
                host.onNativeEvent(dispatchNativeEventPayload);
            else if (typeof host.setNativeEventHandler === "function")
                host.setNativeEventHandler(dispatchNativeEventPayload);
            flushPendingCommands();
            return {
                descriptor: descriptor,
                route: route,
                dispatchNativeEventPayload: dispatchNativeEventPayload,
                flushPendingCommands: flushPendingCommands
            };
        } };
    //#endregion
})();
