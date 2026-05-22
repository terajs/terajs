import UIKit

public final class UIKitHostRuntime {
  public let applier: UIKitCommandApplier
  public let transport: UIKitHostTransport

  private let eventBinder: UIKitHostEventBinder

  public init(
    viewFactory: UIKitHostViewFactory = UIKitHostViewFactory(),
    emitEventPayload: @escaping (String) -> Void = { _ in }
  ) {
    let applier = UIKitCommandApplier(viewFactory: viewFactory)
    var transportRef: UIKitHostTransport?
    let eventBinder = UIKitHostEventBinder { nodeId, name, payload in
      guard let transport = transportRef else {
        return
      }

      try? transport.sendNativeEvent(nodeId: nodeId, name: name, payload: payload)
    }

    self.applier = applier
    self.eventBinder = eventBinder
    self.transport = UIKitHostTransport(
      applyCommands: { commands in
        try UIKitHostRuntime.applyCommands(commands, applier: applier, eventBinder: eventBinder)
      },
      emitEventPayload: emitEventPayload
    )
    transportRef = transport
  }

  public var rootView: UIView? {
    applier.root?.view
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