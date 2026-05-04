import {
  createShadowComponentsHoverHandlers,
  createShadowComponentsPickedHandler,
  handleShadowComponentsAreaChange,
  handleShadowComponentsAreaInput
} from "./areas/shadow/components/domHandlers.js";
import type { IframePanelsState } from "./app.js";

type InputState = {
  componentSearchQuery: string;
  componentInspectorQuery: string;
  iframePanels: IframePanelsState;
};

function isHTMLInputElement(value: EventTarget | null): value is HTMLInputElement {
  return typeof value === "object"
    && value !== null
    && "tagName" in value
    && (value as { tagName?: unknown }).tagName === "INPUT"
    && "value" in value
    && "dataset" in value;
}

export function createComponentPickedHandler<TState extends { activeTab: string; selectedComponentKey: string | null }>(
  state: TState,
  render: () => void
): EventListener {
  return createShadowComponentsPickedHandler(state, render);
}

export function createInputHandler<TState extends InputState>(state: TState, render: () => void): EventListener {
  return (domEvent: Event) => {
    const target = domEvent.target;
    if (!isHTMLInputElement(target)) {
      return;
    }

    if (handleShadowComponentsAreaInput(state, render, target)) {
      return;
    }

    if (target.dataset.metaSearch === "true") {
      state.iframePanels.meta.searchQuery = target.value;
      state.iframePanels.meta.selectedKey = null;
      render();
      return;
    }

    if (target.dataset.signalSearch === "true") {
      state.iframePanels.signals.searchQuery = target.value;
      render();
      return;
    }

    if (target.dataset.logSearch === "true") {
      state.iframePanels.logs.searchQuery = target.value;
      state.iframePanels.logs.selectedEntryKey = null;
      render();
      return;
    }
  };
}

export function createChangeHandler(render: () => void): EventListener {
  return (domEvent: Event) => {
    const target = domEvent.target;
    if (!isHTMLInputElement(target)) {
      return;
    }

    if (handleShadowComponentsAreaChange(render, target)) {
      return;
    }
  };
}

export function createHoverHandlers(
  notifyComponentHover: (scope: string | null, instance: number | null) => void
): { handleMouseOver: EventListener; handleMouseOut: EventListener } {
  return createShadowComponentsHoverHandlers(notifyComponentHover);
}
