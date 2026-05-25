import UIKit

private final class UIKitNativeEventSink {
  private let emitEventPayload: (String) -> Void

  var handler: UIKitNativeEventPayloadHandler?

  init(emitEventPayload: @escaping (String) -> Void) {
    self.emitEventPayload = emitEventPayload
  }

  var hasHandler: Bool {
    handler != nil
  }

  func emit(_ payload: String) {
    emitEventPayload(payload)
    handler?(payload)
  }
}

public final class UIKitHostRuntime {
  public let applier: UIKitCommandApplier
  public let transport: UIKitHostTransport
  public let runtimeDescriptorPath: String

  private let eventBinder: UIKitHostEventBinder
  private let diagnosticsSink: UIKitHostRuntimeDiagnosticSink
  private let eventSink: UIKitNativeEventSink
  private let readTextAssetImpl: UIKitRuntimeAssetReader
  private var hasStarted = false

  public init(
    viewFactory: UIKitHostViewFactory = UIKitHostViewFactory(),
    runtimeDescriptorPath: String = ".terajs/generated/ios/runtime/generated-route-runtime.json",
    readTextAsset: @escaping UIKitRuntimeAssetReader = { assetPath in
      throw UIKitHostRuntimeError.assetReaderUnavailable(assetPath)
    },
    emitDiagnostic: @escaping UIKitHostRuntimeDiagnosticSink = { _ in },
    emitEventPayload: @escaping (String) -> Void = { _ in }
  ) {
    let applier = UIKitCommandApplier(viewFactory: viewFactory)
    var transportRef: UIKitHostTransport?
    let eventSink = UIKitNativeEventSink(emitEventPayload: emitEventPayload)
    let eventBinder = UIKitHostEventBinder { nodeId, name, payload in
      guard let transport = transportRef else {
        return
      }

      try? transport.sendNativeEvent(nodeId: nodeId, name: name, payload: payload)
    }

    self.applier = applier
    self.eventBinder = eventBinder
    self.runtimeDescriptorPath = runtimeDescriptorPath
    self.readTextAssetImpl = readTextAsset
    self.diagnosticsSink = emitDiagnostic
    self.eventSink = eventSink
    self.transport = UIKitHostTransport(
      applyCommands: { commands in
        try UIKitHostRuntime.applyCommands(commands, applier: applier, eventBinder: eventBinder)
      },
      emitEventPayload: { payload in
        eventSink.emit(payload)
      }
    )
    transportRef = transport
  }

  public var rootView: UIView? {
    applier.root?.view
  }

  public func readTextAsset(_ assetPath: String) throws -> String {
    try readTextAssetImpl(assetPath)
  }

  public func emitCommandBatch(_ payload: String) throws {
    try receiveCommandBatchPayload(payload)
  }

  public func onNativeEvent(_ handler: @escaping UIKitNativeEventPayloadHandler) {
    eventSink.handler = handler
    diagnosticsSink(UIKitHostRuntimeDiagnostic(
      level: .info,
      code: "native-event-handler-registered",
      message: "Registered UIKit native event handler.",
      context: ["runtimeDescriptorPath": runtimeDescriptorPath]
    ))
  }

  public func setNativeEventHandler(_ handler: @escaping UIKitNativeEventPayloadHandler) {
    onNativeEvent(handler)
  }

  public func clearNativeEventHandler() {
    eventSink.handler = nil
  }

  public func start() -> UIKitHostRuntimeDiagnosticsSnapshot {
    hasStarted = true
    let snapshot = diagnostics()
    diagnosticsSink(UIKitHostRuntimeDiagnostic(
      level: .info,
      code: "runtime-started",
      message: "UIKit host runtime is ready for live runtime startup.",
      context: ["runtimeDescriptorPath": runtimeDescriptorPath]
    ))
    return snapshot
  }

  public func shutdown() {
    if let root = applier.root {
      UIKitHostRuntime.removeBindings(startingAt: root.nodeId, applier: applier, eventBinder: eventBinder)
    }

    clearNativeEventHandler()
    hasStarted = false
    diagnosticsSink(UIKitHostRuntimeDiagnostic(
      level: .info,
      code: "runtime-stopped",
      message: "UIKit host runtime shut down.",
      context: ["runtimeDescriptorPath": runtimeDescriptorPath]
    ))
  }

  public func diagnostics() -> UIKitHostRuntimeDiagnosticsSnapshot {
    UIKitHostRuntimeDiagnosticsSnapshot(
      runtimeDescriptorPath: runtimeDescriptorPath,
      hasStarted: hasStarted,
      hasRootView: rootView != nil,
      hasNativeEventHandler: eventSink.hasHandler
    )
  }

  public func receiveCommandBatchPayload(_ payload: String) throws {
    try transport.receiveCommandBatchPayload(payload)
  }

  public func sendNativeEvent(
    nodeId: Int,
    name: String,
    payload: TerajsJSONValue? = nil
  ) throws {
    try transport.sendNativeEvent(nodeId: nodeId, name: name, payload: payload)
  }

  private static func applyCommands(
    _ commands: [UIKitHostCommand],
    applier: UIKitCommandApplier,
    eventBinder: UIKitHostEventBinder
  ) throws {
    for command in commands {
      if command.type == .remove, let nodeId = command.nodeId {
        removeBindings(startingAt: nodeId, applier: applier, eventBinder: eventBinder)
      }

      try applier.apply(command)

      if command.type == .createElement,
         let nodeId = command.nodeId,
         let node = applier.node(for: nodeId) as? UIKitHostElementNode {
        eventBinder.bindIfNeeded(node: node)
      }
    }
  }

  private static func removeBindings(
    startingAt nodeId: Int,
    applier: UIKitCommandApplier,
    eventBinder: UIKitHostEventBinder
  ) {
    guard let node = applier.node(for: nodeId) else {
      eventBinder.remove(nodeId: nodeId)
      return
    }

    if let element = node as? UIKitHostElementNode {
      for childId in element.childNodeIds {
        removeBindings(startingAt: childId, applier: applier, eventBinder: eventBinder)
      }

      eventBinder.remove(nodeId: nodeId)
    }
  }
}