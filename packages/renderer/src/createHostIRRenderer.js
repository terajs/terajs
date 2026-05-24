import { dispose, effect } from "@terajs/reactivity";
import { emitRendererDebug } from "./debug.js";
import { createIRForRenderer } from "./hostIRForRenderer.js";
import { applyIRProps as applyHostIRProps, normalizeSlotValue as normalizeHostSlotValue, } from "./hostIRShared.js";
import { isDirectBindingSource, resolveDirectTextSource, resolveEventHandler, resolveExpr, resolveHintedDirectSource, resolveHintedPath, } from "./renderFromIRExpressions.js";
export function createHostIRRenderer(runtime) {
    const { addNodeCleanup, createAnchor, createElement, createFragment, createText, getNextSibling, getParent, isFragment, isNode, setClass, setProp, setStyle, } = runtime.host;
    const insert = (parent, child, anchor) => runtime.host.insert(parent, child, anchor);
    const remove = (node) => runtime.host.remove(node);
    const { bindText, bindDirectTextSource, bindDirectPropSource, bindProp, bindClass, bindStyle, bindEvent, } = runtime.bindings;
    const renderIRForNode = createIRForRenderer(runtime.host);
    const hostIRPropRuntime = {
        applyStaticProp,
        bindDirectPropSource,
        bindProp,
        bindClass,
        bindStyle,
        bindEvent,
    };
    const hostSlotRuntime = {
        createFragment,
        createText,
        insert: (parent, child) => insert(parent, child),
        isNode,
    };
    function renderIRModule(ir, ctx) {
        emitRendererDebug("ir:render:module", () => ({ filePath: ir.filePath }));
        const fragment = createFragment();
        for (const node of ir.template) {
            const dom = renderIRNode(node, ctx);
            if (dom) {
                insert(fragment, dom);
            }
        }
        return fragment;
    }
    function renderIRNode(node, ctx, isSvg = false) {
        switch (node.type) {
            case "text":
                return renderIRText(node);
            case "interp":
                return renderIRInterpolation(node, ctx);
            case "element":
                return renderIRElement(node, ctx, isSvg);
            case "slot":
                return renderIRSlot(node, ctx, isSvg);
            case "if":
                return renderIRIf(node, ctx, isSvg);
            case "for":
                return renderIRForNode(node, ctx, isSvg, renderIRNode);
            case "portal":
                emitRendererDebug("error:renderer", () => ({
                    message: `${node.type} is not supported by the host-simulation renderer yet`,
                    node
                }));
                return null;
            default:
                emitRendererDebug("error:renderer", () => ({ message: "Unknown IR node", node }));
                return null;
        }
    }
    function renderIRText(node) {
        emitRendererDebug("ir:render:text", () => ({ value: node.value }));
        return createText(node.value);
    }
    function renderIRInterpolation(node, ctx) {
        emitRendererDebug("ir:render:interp", () => ({ expression: node.expression }));
        const text = createText("");
        const hintedBinding = node.binding;
        if (hintedBinding?.kind === "simple-path") {
            const directSource = resolveHintedDirectSource(ctx, hintedBinding);
            if (isDirectBindingSource(directSource)) {
                bindDirectTextSource(text, directSource);
                return text;
            }
            bindText(text, () => resolveHintedPath(ctx, hintedBinding, true));
            return text;
        }
        if (process.env.NODE_ENV === "production") {
            const directSource = resolveDirectTextSource(ctx, node.expression);
            if (isDirectBindingSource(directSource)) {
                bindDirectTextSource(text, directSource);
                return text;
            }
        }
        bindText(text, () => resolveExpr(ctx, node.expression));
        return text;
    }
    function renderIRElement(node, ctx, isSvg) {
        const component = resolveComponentBinding(ctx, node.tag);
        if (component) {
            return renderIRComponent(node, component, ctx, isSvg);
        }
        if (isComponentTag(node.tag)) {
            emitRendererDebug("error:renderer", () => ({
                message: `Component tag is missing from the host component registry: ${node.tag}`,
                node
            }));
            return null;
        }
        emitRendererDebug("ir:render:element", () => ({ tag: node.tag, svg: isSvg }));
        const nextSvg = isSvg || node.tag === "svg";
        const el = createElement(node.tag, nextSvg);
        applyIRProps(el, node.props, ctx);
        for (const child of node.children) {
            const dom = renderIRNode(child, ctx, nextSvg);
            if (dom) {
                insert(el, dom);
            }
        }
        return el;
    }
    function renderIRComponent(node, component, ctx, isSvg) {
        emitRendererDebug("ir:render:component", () => ({ tag: node.tag }));
        const props = buildComponentProps(node, ctx, isSvg);
        const rendered = component(props);
        const normalized = normalizeRenderedComponentValue(rendered, ctx);
        return normalized && isNode(normalized)
            ? normalized
            : null;
    }
    function renderIRSlot(node, ctx, isSvg) {
        emitRendererDebug("ir:render:slot", () => ({ name: node.name ?? "default" }));
        const slotName = node.name ?? "default";
        const slotValue = ctx?.slots?.[slotName];
        if (slotValue != null) {
            return normalizeHostSlotValue(slotValue, hostSlotRuntime);
        }
        const fragment = createFragment();
        for (const child of node.fallback) {
            const dom = renderIRNode(child, ctx, isSvg);
            if (dom) {
                insert(fragment, dom);
            }
        }
        return fragment;
    }
    function renderIRIf(node, ctx, isSvg) {
        emitRendererDebug("ir:render:if", () => ({ condition: node.condition }));
        const anchor = createAnchor("if");
        const fragment = createFragment();
        insert(fragment, anchor);
        const ownedNodes = [];
        const effectFn = effect(() => {
            const condition = !!resolveExpr(ctx, node.condition);
            const branch = condition ? node.then : node.else ?? [];
            const container = getParent(anchor);
            if (!container) {
                return;
            }
            for (const ownedNode of ownedNodes) {
                remove(ownedNode);
            }
            ownedNodes.length = 0;
            let ref = getNextSibling(anchor);
            for (const child of branch) {
                const dom = renderIRNode(child, ctx, isSvg);
                if (dom && isNode(dom)) {
                    insert(container, dom, ref ?? null);
                    ownedNodes.push(dom);
                    ref = null;
                }
            }
        });
        addNodeCleanup(anchor, () => {
            dispose(effectFn);
            for (const ownedNode of ownedNodes) {
                remove(ownedNode);
            }
            ownedNodes.length = 0;
        });
        return fragment;
    }
    function applyIRProps(el, props, ctx) {
        applyHostIRProps(el, props, ctx, hostIRPropRuntime);
    }
    function resolveComponentBinding(ctx, tag) {
        if (!isComponentTag(tag)) {
            return null;
        }
        const registry = ctx?.__components;
        if (!registry || typeof registry !== "object") {
            return null;
        }
        const resolved = registry[tag];
        return typeof resolved === "function" ? resolved : null;
    }
    function buildComponentProps(node, ctx, isSvg) {
        const props = {};
        for (const prop of node.props) {
            if (prop.kind === "static") {
                props[prop.name] = prop.value;
                continue;
            }
            if (prop.kind === "bind") {
                props[prop.name] = prop.binding?.kind === "simple-path"
                    ? resolveHintedPath(ctx, prop.binding, true)
                    : resolveExpr(ctx, String(prop.value));
                continue;
            }
            if (prop.kind === "event") {
                const handler = resolveEventHandler(ctx, String(prop.value));
                if (typeof handler === "function") {
                    props[`on${capitalize(prop.name)}`] = handler;
                }
            }
        }
        if (node.children.length > 0) {
            props.children = () => {
                const fragment = createFragment();
                for (const child of node.children) {
                    const rendered = renderIRNode(child, ctx, isSvg);
                    if (rendered) {
                        insert(fragment, rendered);
                    }
                }
                return fragment;
            };
        }
        return props;
    }
    function normalizeRenderedComponentValue(value, ctx) {
        if (typeof value === "function") {
            return normalizeRenderedComponentValue(value(ctx), ctx);
        }
        const normalized = normalizeHostSlotValue(value, hostSlotRuntime);
        if (isFragment(normalized)) {
            const children = runtime.host.getChildren(normalized);
            if (children.length === 1) {
                return children[0];
            }
        }
        return normalized;
    }
    function capitalize(value) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
    function applyStaticProp(el, prop) {
        if (prop.name === "class") {
            setClass(el, String(prop.value ?? ""));
            return;
        }
        if (prop.name === "style" && typeof prop.value === "object") {
            const resolved = {};
            const styleObj = prop.value;
            for (const key in styleObj) {
                resolved[key] = String(styleObj[key]);
            }
            setStyle(el, resolved);
            return;
        }
        if (prop.value != null) {
            setProp(el, prop.name, prop.value);
        }
    }
    return {
        renderIRModule,
        renderIRNode,
    };
}
function isComponentTag(tag) {
    if (typeof tag !== "string" || tag.length === 0) {
        return false;
    }
    const first = tag[0];
    return first >= "A" && first <= "Z";
}
