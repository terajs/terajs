/**
 * App-facing re-exports for the Terajs DevTools overlay controls.
 */
export {
  autoAttachVsCodeDevtoolsBridge,
  connectVsCodeDevtoolsBridge,
  DEVTOOLS_IDE_BRIDGE_STATUS_CHANGE_EVENT,
  disconnectVsCodeDevtoolsBridge,
  getDevtoolsIdeBridgeStatus,
  mountDevtoolsApp,
  mountDevtoolsOverlay,
  retryVsCodeDevtoolsBridgeConnection,
  stopAutoAttachVsCodeDevtoolsBridge,
  toggleDevtoolsOverlay,
  toggleDevtoolsVisibility,
  unmountDevtoolsOverlay
} from "@terajs/devtools";

export type {
  DevtoolsAppOptions,
  DevtoolsIdeAutoAttachOptions,
  DevtoolsIdeBridgeMode,
  DevtoolsIdeBridgeManifest,
  DevtoolsIdeBridgeStatus,
} from "@terajs/devtools";
