import Foundation

public enum TerajsHostTransportError: Error {
  case invalidPayload(String)
  case invalidEncoding
}

public enum UIKitWireCodec {
  public static func decodeCommandBatch(_ payload: String) throws -> [UIKitHostCommand] {
    let data = Data(payload.utf8)
    let json = try JSONSerialization.jsonObject(with: data)
    guard let commands = json as? [Any] else {
      throw TerajsHostTransportError.invalidPayload("Command payload must be a JSON array")
    }

    return try commands.enumerated().map { index, entry in
      guard let object = entry as? [String: Any] else {
        throw TerajsHostTransportError.invalidPayload("commands[\(index)] must be an object")
      }
      return try UIKitHostCommand.fromJSONObject(object, path: "commands[\(index)]")
    }
  }

  public static func encodeNativeEventPacket(_ packet: UIKitNativeEventPacket) throws -> String {
    let data = try JSONSerialization.data(withJSONObject: packet.foundationObject())
    guard let payload = String(data: data, encoding: .utf8) else {
      throw TerajsHostTransportError.invalidEncoding
    }
    return payload
  }
}

public final class UIKitHostTransport {
  public typealias CommandSink = ([UIKitHostCommand]) throws -> Void
  public typealias EventSink = (String) -> Void

  private let applyCommands: CommandSink
  private let emitEventPayload: EventSink

  public init(applyCommands: @escaping CommandSink, emitEventPayload: @escaping EventSink) {
    self.applyCommands = applyCommands
    self.emitEventPayload = emitEventPayload
  }

  public func receiveCommandBatchPayload(_ payload: String) throws {
    try applyCommands(UIKitWireCodec.decodeCommandBatch(payload))
  }

  public func makeNativeEventPacketPayload(
    nodeId: Int,
    name: String,
    payload: TerajsJSONValue? = nil
  ) throws -> String {
    try UIKitWireCodec.encodeNativeEventPacket(
      UIKitNativeEventPacket(nodeId: nodeId, name: name, payload: payload)
    )
  }

  public func sendNativeEvent(
    nodeId: Int,
    name: String,
    payload: TerajsJSONValue? = nil
  ) throws {
    emitEventPayload(try makeNativeEventPacketPayload(nodeId: nodeId, name: name, payload: payload))
  }
}