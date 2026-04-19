import {
  buildComponentKey,
  readComponentIdentity,
  readNumber,
  readString,
  readUnknown,
  safeString,
  type InspectorEventLike
} from "./inspector/shared.js";

export interface DevtoolsEventLike extends InspectorEventLike {
  type: string;
  payload?: Record<string, unknown>;
}

export function eventAffectsComponentTree(event: DevtoolsEventLike): boolean {
  const identity = readComponentIdentity(event);
  if (!identity) {
    return false;
  }

  if (
    event.type === "component:mounted"
    || event.type === "component:mount"
    || event.type === "component:unmounted"
    || event.type === "component:unmount"
  ) {
    return true;
  }

  return readUnknown(event.payload, "ai") !== undefined;
}

export function eventTouchesSelectedComponent(event: DevtoolsEventLike, selectedComponentKey: string | null): boolean {
  if (!selectedComponentKey) {
    return false;
  }

  const identity = readComponentIdentity(event);
  if (identity && buildComponentKey(identity.scope, identity.instance) === selectedComponentKey) {
    return true;
  }

  if (event.type === "error:component") {
    const scope = readString(event.payload, "scope") ?? readString(event.payload, "name");
    const instance = readNumber(event.payload, "instance");
    if (scope && instance !== undefined && buildComponentKey(scope, instance) === selectedComponentKey) {
      return true;
    }
  }

  const reactiveKey = readString(event.payload, "rid") ?? readString(event.payload, "key");
  if (typeof reactiveKey === "string" && reactiveKey.includes(selectedComponentKey)) {
    return true;
  }

  return safeString(event.payload ?? {}).includes(selectedComponentKey);
}