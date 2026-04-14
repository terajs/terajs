import {
  buildComponentKey,
  parseComponentKey,
  readComponentIdentity,
  readNumber,
  readString,
  readUnknown,
  safeString,
  shortJson
} from "./shared.js";
import { resolveLiveComponentSnapshots } from "./liveEditing.js";
import { isSignalLikeUpdate, summarizeLog, type DevtoolsEventLike } from "./dataCollectors.js";

export interface MountedComponentEntry {
  key: string;
  scope: string;
  instance: number;
  aiPreview?: string;
}

export interface ComponentTreeNode {
  component: MountedComponentEntry;
  children: ComponentTreeNode[];
}

export function collectMountedComponents(
  mountedComponents: Map<string, { key: string; scope: string; instance: number; aiPreview?: string; lastSeenAt: number }>
) {
  const fromRegistry: MountedComponentEntry[] = Array.from(mountedComponents.values())
    .sort((left, right) => left.scope.localeCompare(right.scope) || left.instance - right.instance)
    .map((entry) => ({
      key: entry.key,
      scope: entry.scope,
      instance: entry.instance,
      aiPreview: entry.aiPreview
    }));

  if (fromRegistry.length > 0) {
    return fromRegistry;
  }

  return collectMountedComponentsFromDom();
}

export function buildComponentTree(components: MountedComponentEntry[]): {
  roots: ComponentTreeNode[];
  parentByKey: Map<string, string>;
} {
  const nodeMap = new Map<string, ComponentTreeNode>();
  const parentByKey = resolveComponentParentMapFromDom(components);
  const domOrderByKey = resolveComponentDomOrderMap(components);

  for (const component of components) {
    nodeMap.set(component.key, {
      component,
      children: []
    });
  }

  const roots: ComponentTreeNode[] = [];

  for (const component of components) {
    const node = nodeMap.get(component.key);
    if (!node) {
      continue;
    }

    const parentKey = parentByKey.get(component.key);
    const parentNode = parentKey ? nodeMap.get(parentKey) : undefined;

    if (parentNode && parentNode.component.key !== node.component.key) {
      parentNode.children.push(node);
      continue;
    }

    roots.push(node);
  }

  sortComponentTree(roots, domOrderByKey);

  return {
    roots,
    parentByKey
  };
}

export function collectExpandableTreeKeys(nodes: ComponentTreeNode[]): string[] {
  const keys: string[] = [];

  for (const node of nodes) {
    if (node.children.length > 0) {
      keys.push(node.component.key);
      keys.push(...collectExpandableTreeKeys(node.children));
    }
  }

  return keys;
}

export function expandSelectedTreePath(
  expandedKeys: Set<string>,
  selectedKey: string | null,
  parentByKey: Map<string, string>
): void {
  if (!selectedKey) {
    return;
  }

  let cursor = selectedKey;
  while (parentByKey.has(cursor)) {
    const parent = parentByKey.get(cursor);
    if (!parent) {
      break;
    }

    expandedKeys.add(parent);
    cursor = parent;
  }
}

export function applyComponentLifecycle(
  mountedComponents: Map<string, { key: string; scope: string; instance: number; aiPreview?: string; lastSeenAt: number }>,
  expandedComponentNodeKeys: Set<string>,
  event: DevtoolsEventLike
) {
  const identity = readComponentIdentity(event);
  if (!identity) {
    return;
  }

  const key = buildComponentKey(identity.scope, identity.instance);
  const current = mountedComponents.get(key);

  if (isComponentMountEvent(event.type)) {
    const ai = readUnknown(event.payload, "ai");
    mountedComponents.set(key, {
      key,
      scope: identity.scope,
      instance: identity.instance,
      aiPreview: ai !== undefined ? safeString(ai).slice(0, 160) : current?.aiPreview,
      lastSeenAt: event.timestamp
    });
    expandedComponentNodeKeys.add(key);
    return;
  }

  if (isComponentUnmountEvent(event.type)) {
    mountedComponents.delete(key);
    expandedComponentNodeKeys.delete(key);
    return;
  }

  if (!current) {
    return;
  }

  const ai = readUnknown(event.payload, "ai");
  mountedComponents.set(key, {
    ...current,
    aiPreview: ai !== undefined ? safeString(ai).slice(0, 160) : current.aiPreview,
    lastSeenAt: event.timestamp
  });
}

export function resolveSelectedComponent(
  components: MountedComponentEntry[],
  selectedComponentKey: string | null
) {
  if (!selectedComponentKey) {
    return null;
  }

  const selected = components.find((component) => component.key === selectedComponentKey);
  if (selected) {
    return selected;
  }

  const parsed = parseComponentKey(selectedComponentKey);
  if (parsed) {
    return {
      key: selectedComponentKey,
      scope: parsed.scope,
      instance: parsed.instance
    };
  }

  return null;
}

export function collectComponentDrilldown(events: DevtoolsEventLike[], scope: string, instance: number) {
  let mounts = 0;
  let unmounts = 0;
  let updates = 0;
  let errors = 0;
  let propsSnapshot: unknown = undefined;
  let metaSnapshot: unknown = undefined;
  let aiSnapshot: unknown = undefined;
  let routeSnapshot: unknown = undefined;
  const reactiveKeys = new Set<string>();
  const reactiveStateMap = new Map<string, string>();

  const recent: Array<{ type: string; summary: string }> = [];

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    const identity = readComponentIdentity(event);
    const matchesComponent = identity?.scope === scope && identity.instance === instance;

    if (isSignalLikeUpdate(event.type)) {
      const reactiveKey = readString(event.payload, "rid") ?? readString(event.payload, "key");
      if (reactiveKey && reactiveKey.includes(`${scope}#${instance}`)) {
        reactiveKeys.add(reactiveKey);

        if (!reactiveStateMap.has(reactiveKey)) {
          const reactivePreview =
            readUnknown(event.payload, "next") ??
            readUnknown(event.payload, "value") ??
            readUnknown(event.payload, "newValue") ??
            readUnknown(event.payload, "prev") ??
            readUnknown(event.payload, "initialValue");

          reactiveStateMap.set(reactiveKey, shortJson(reactivePreview));
        }
      }
    }

    const isComponentError = event.type === "error:component"
      && (readString(event.payload, "name") === scope || readString(event.payload, "scope") === scope)
      && (readNumber(event.payload, "instance") ?? instance) === instance;

    if (!matchesComponent && !isComponentError) {
      continue;
    }

    if (isComponentMountEvent(event.type)) mounts += 1;
    if (isComponentUnmountEvent(event.type)) unmounts += 1;
    if (event.type === "component:update" || event.type === "component:state:update" || event.type === "component:props:update") updates += 1;
    if (event.type === "error:component") errors += 1;

    if (propsSnapshot === undefined) {
      const nextPropsSnapshot = readUnknown(event.payload, "props") ?? readUnknown(event.payload, "componentProps");
      if (nextPropsSnapshot !== undefined) {
        propsSnapshot = nextPropsSnapshot;
      }
    }

    if (metaSnapshot === undefined) {
      const nextMetaSnapshot = readUnknown(event.payload, "meta");
      if (nextMetaSnapshot !== undefined) {
        metaSnapshot = nextMetaSnapshot;
      }
    }

    if (aiSnapshot === undefined) {
      const nextAiSnapshot = readUnknown(event.payload, "ai");
      if (nextAiSnapshot !== undefined) {
        aiSnapshot = nextAiSnapshot;
      }
    }

    if (routeSnapshot === undefined) {
      const nextRouteSnapshot = readUnknown(event.payload, "route");
      if (nextRouteSnapshot !== undefined) {
        routeSnapshot = nextRouteSnapshot;
      }
    }

    if (recent.length < 8) {
      recent.push({
        type: event.type,
        summary: summarizeLog(event)
      });
    }
  }

  const liveSnapshots = resolveLiveComponentSnapshots(scope, instance);
  if (propsSnapshot === undefined && liveSnapshots?.props !== undefined) {
    propsSnapshot = liveSnapshots.props;
  }
  if (metaSnapshot === undefined && liveSnapshots?.meta !== undefined) {
    metaSnapshot = liveSnapshots.meta;
  }
  if (aiSnapshot === undefined && liveSnapshots?.ai !== undefined) {
    aiSnapshot = liveSnapshots.ai;
  }
  if (routeSnapshot === undefined && liveSnapshots?.route !== undefined) {
    routeSnapshot = liveSnapshots.route;
  }

  return {
    mounts,
    unmounts,
    updates,
    errors,
    propsSnapshot: propsSnapshot ?? {},
    metaSnapshot,
    aiSnapshot,
    routeSnapshot,
    reactiveState: Array.from(reactiveStateMap.entries()).map(([key, preview]) => ({ key, preview })).slice(0, 16),
    reactiveKeys: Array.from(reactiveKeys).slice(0, 8),
    domPreview: collectDomSubtreePreview(scope, instance),
    recent
  };
}

function collectMountedComponentsFromDom() {
  if (typeof document === "undefined") {
    return [] as MountedComponentEntry[];
  }

  const componentMap = new Map<string, MountedComponentEntry>();
  const elements = document.querySelectorAll<HTMLElement>("[data-terajs-component-scope][data-terajs-component-instance]");

  for (const element of Array.from(elements)) {
    const scope = element.getAttribute("data-terajs-component-scope");
    const instanceRaw = element.getAttribute("data-terajs-component-instance");
    const instance = instanceRaw !== null ? Number(instanceRaw) : Number.NaN;
    if (!scope || !Number.isFinite(instance)) {
      continue;
    }

    const key = buildComponentKey(scope, instance);
    if (!componentMap.has(key)) {
      componentMap.set(key, {
        key,
        scope,
        instance
      });
    }
  }

  return Array.from(componentMap.values()).sort((left, right) => left.scope.localeCompare(right.scope) || left.instance - right.instance);
}

function resolveComponentParentMapFromDom(components: MountedComponentEntry[]): Map<string, string> {
  const parentByKey = new Map<string, string>();

  if (typeof document === "undefined") {
    return parentByKey;
  }

  for (const component of components) {
    const selector = `[data-terajs-component-scope="${escapeAttributeSelector(component.scope)}"][data-terajs-component-instance="${component.instance}"]`;
    const elements = document.querySelectorAll<HTMLElement>(selector);
    if (elements.length === 0) {
      continue;
    }

    for (const element of Array.from(elements)) {
      const parentElement = element.parentElement?.closest<HTMLElement>("[data-terajs-component-scope][data-terajs-component-instance]");
      if (!parentElement) {
        continue;
      }

      const parentScope = parentElement.getAttribute("data-terajs-component-scope");
      const parentInstanceRaw = parentElement.getAttribute("data-terajs-component-instance");
      const parentInstance = parentInstanceRaw !== null ? Number(parentInstanceRaw) : Number.NaN;

      if (!parentScope || !Number.isFinite(parentInstance)) {
        continue;
      }

      const parentKey = buildComponentKey(parentScope, parentInstance);
      if (parentKey !== component.key) {
        parentByKey.set(component.key, parentKey);
        break;
      }
    }
  }

  return parentByKey;
}

function resolveComponentDomOrderMap(components: MountedComponentEntry[]): Map<string, number> {
  const orderByKey = new Map<string, number>();

  if (typeof document === "undefined") {
    return orderByKey;
  }

  const componentKeys = new Set(components.map((component) => component.key));
  const elements = document.querySelectorAll<HTMLElement>("[data-terajs-component-scope][data-terajs-component-instance]");

  let order = 0;
  for (const element of Array.from(elements)) {
    const scope = element.getAttribute("data-terajs-component-scope");
    const instanceRaw = element.getAttribute("data-terajs-component-instance");
    const instance = instanceRaw !== null ? Number(instanceRaw) : Number.NaN;
    if (!scope || !Number.isFinite(instance)) {
      continue;
    }

    const key = buildComponentKey(scope, instance);
    if (componentKeys.has(key) && !orderByKey.has(key)) {
      orderByKey.set(key, order);
    }

    order += 1;
  }

  return orderByKey;
}

function sortComponentTree(nodes: ComponentTreeNode[], domOrderByKey: Map<string, number>): void {
  nodes.sort((left, right) => {
    const leftOrder = domOrderByKey.get(left.component.key);
    const rightOrder = domOrderByKey.get(right.component.key);

    if (leftOrder !== undefined && rightOrder !== undefined && leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    if (leftOrder !== undefined && rightOrder === undefined) {
      return -1;
    }

    if (leftOrder === undefined && rightOrder !== undefined) {
      return 1;
    }

    return left.component.scope.localeCompare(right.component.scope) || left.component.instance - right.component.instance;
  });

  for (const node of nodes) {
    sortComponentTree(node.children, domOrderByKey);
  }
}

function collectDomSubtreePreview(scope: string, instance: number): string[] {
  if (typeof document === "undefined") {
    return [];
  }

  const selector = `[data-terajs-component-scope="${escapeAttributeSelector(scope)}"][data-terajs-component-instance="${instance}"]`;
  const root = document.querySelector(selector);
  if (!(root instanceof HTMLElement)) {
    return [];
  }

  const lines: string[] = [];
  const queue: Array<{ element: Element; depth: number }> = [{ element: root, depth: 0 }];

  while (queue.length > 0 && lines.length < 12) {
    const current = queue.shift();
    if (!current) break;

    const { element, depth } = current;
    const indent = "  ".repeat(depth);
    const idPart = element.id ? `#${element.id}` : "";
    const classPart = element.classList.length > 0
      ? `.${Array.from(element.classList).slice(0, 2).join(".")}`
      : "";

    lines.push(`${indent}<${element.tagName.toLowerCase()}${idPart}${classPart}>`);

    for (const child of Array.from(element.children).slice(0, 4)) {
      queue.push({
        element: child,
        depth: depth + 1
      });
    }
  }

  return lines;
}

function escapeAttributeSelector(value: string): string {
  const css = globalThis.CSS;
  if (css && typeof css.escape === "function") {
    return css.escape(value);
  }

  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function isComponentMountEvent(type: string): boolean {
  return type === "component:mounted" || type === "component:mount";
}

function isComponentUnmountEvent(type: string): boolean {
  return type === "component:unmounted" || type === "component:unmount";
}
