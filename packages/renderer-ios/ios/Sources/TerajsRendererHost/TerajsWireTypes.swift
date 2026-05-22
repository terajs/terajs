import Foundation

public enum UIKitHostCommandType: String, Equatable {
  case createElement = "create-element"
  case createText = "create-text"
  case insert = "insert"
  case remove = "remove"
  case setText = "set-text"
  case setProp = "set-prop"
  case setStyle = "set-style"
  case setClass = "set-class"
  case subscribeEvent = "subscribe-event"
  case unsubscribeEvent = "unsubscribe-event"
}

public struct UIKitHostCommand: Equatable {
  public let type: UIKitHostCommandType
  public let nodeId: Int?
  public let parentId: Int?
  public let childId: Int?
  public let anchorId: Int?
  public let viewType: String?
  public let svg: Bool?
  public let name: String?
  public let value: TerajsJSONValue?
  public let style: [String: String]?
  public let className: String?

  static func fromJSONObject(_ object: [String: Any], path: String) throws -> UIKitHostCommand {
    let typeValue = try requireString(object, key: "type", path: path)
    guard let type = UIKitHostCommandType(rawValue: typeValue) else {
      throw TerajsHostTransportError.invalidPayload("\(path).type is not a supported UIKit host command")
    }

    return UIKitHostCommand(
      type: type,
      nodeId: try optionalInt(object, key: "nodeId", path: path),
      parentId: try optionalInt(object, key: "parentId", path: path),
      childId: try optionalInt(object, key: "childId", path: path),
      anchorId: try optionalInt(object, key: "anchorId", path: path),
      viewType: try optionalString(object, key: "viewType", path: path),
      svg: try optionalBool(object, key: "svg", path: path),
      name: try optionalString(object, key: "name", path: path),
      value: try optionalJSONValue(object, key: "value", path: path),
      style: try optionalStringMap(object, key: "style", path: path),
      className: try optionalString(object, key: "className", path: path)
    )
  }
}

public struct UIKitNativeEventPacket: Equatable {
  public let nodeId: Int
  public let name: String
  public let payload: TerajsJSONValue?

  func foundationObject() -> [String: Any] {
    var object: [String: Any] = [
      "nodeId": nodeId,
      "name": name
    ]

    if let payload {
      object["payload"] = payload.foundationValue()
    }

    return object
  }
}

private func numberValue(_ value: Any, path: String) throws -> NSNumber {
  guard let number = value as? NSNumber, CFGetTypeID(number) != CFBooleanGetTypeID() else {
    throw TerajsHostTransportError.invalidPayload("\(path) must be a number")
  }

  return number
}

private func requireString(_ object: [String: Any], key: String, path: String) throws -> String {
  guard let value = object[key] as? String else {
    throw TerajsHostTransportError.invalidPayload("\(path).\(key) must be a string")
  }

  return value
}

private func optionalString(_ object: [String: Any], key: String, path: String) throws -> String? {
  guard let value = object[key] else {
    return nil
  }
  if value is NSNull {
    return nil
  }
  guard let stringValue = value as? String else {
    throw TerajsHostTransportError.invalidPayload("\(path).\(key) must be a string")
  }
  return stringValue
}

private func optionalInt(_ object: [String: Any], key: String, path: String) throws -> Int? {
  guard let value = object[key] else {
    return nil
  }
  if value is NSNull {
    return nil
  }
  return try numberValue(value, path: "\(path).\(key)").intValue
}

private func optionalBool(_ object: [String: Any], key: String, path: String) throws -> Bool? {
  guard let value = object[key] else {
    return nil
  }
  if value is NSNull {
    return nil
  }
  guard let boolValue = value as? Bool else {
    throw TerajsHostTransportError.invalidPayload("\(path).\(key) must be a boolean")
  }
  return boolValue
}

private func optionalJSONValue(_ object: [String: Any], key: String, path: String) throws -> TerajsJSONValue? {
  guard object.keys.contains(key) else {
    return nil
  }

  return try TerajsJSONValue.fromFoundationValue(object[key])
}

private func optionalStringMap(_ object: [String: Any], key: String, path: String) throws -> [String: String]? {
  guard let value = object[key] else {
    return nil
  }
  if value is NSNull {
    return nil
  }
  guard let map = value as? [String: Any] else {
    throw TerajsHostTransportError.invalidPayload("\(path).\(key) must be an object")
  }

  var result: [String: String] = [:]
  for (entryKey, entryValue) in map {
    guard let stringValue = entryValue as? String else {
      throw TerajsHostTransportError.invalidPayload("\(path).\(key).\(entryKey) must be a string")
    }
    result[entryKey] = stringValue
  }

  return result
}