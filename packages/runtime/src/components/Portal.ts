import { effect } from "@terajs/reactivity";
import { onCleanup } from "../component/component.js";
import { getCurrentRenderer } from "../renderer.js";

export interface PortalProps {
  to?: string;
  children: () => any;
}

export function Portal(props: PortalProps) {
  const renderer = getCurrentRenderer();

  if (renderer.isServer) {
    return props.children();
  }

  let container: any = null;

  effect(() => {
    const target = props.to || "body";
    const nextContainer = renderer.createPortalContainer(target);

    if (container && nextContainer !== container) {
      renderer.unmount(container);
    }

    container = nextContainer;
    if (container) {
      renderer.mount(props.children, container);
    }
  });

  onCleanup(() => {
    if (container) {
      renderer.unmount(container);
      container = null;
    }
  });

  return null;
}
