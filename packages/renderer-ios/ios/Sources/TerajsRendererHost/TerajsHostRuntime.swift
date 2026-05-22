import UIKit

public final class UIKitHostRuntime {
  public let applier: UIKitCommandApplier
  public let transport: UIKitHostTransport

  public init(
    viewFactory: UIKitHostViewFactory = UIKitHostViewFactory(),
    emitEventPayload: @escaping (String) -> Void = { _ in }
  ) {
    let applier = UIKitCommandApplier(viewFactory: viewFactory)
    self.applier = applier
    self.transport = UIKitHostTransport(
      applyCommands: { commands in
        try applier.applyCommands(commands)
      },
      emitEventPayload: emitEventPayload
    )
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
}