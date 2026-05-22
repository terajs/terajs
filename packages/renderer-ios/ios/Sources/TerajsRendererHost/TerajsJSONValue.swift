import Foundation

public enum TerajsJSONValue: Equatable {
  case null
  case bool(Bool)
  case number(Double)
  case string(String)
  case array([TerajsJSONValue])
  case object([String: TerajsJSONValue])

  static func fromFoundationValue(_ value: Any?) throws -> TerajsJSONValue {
    switch value {
    case nil, is NSNull:
      return .null
    case let value as NSNumber:
      if CFGetTypeID(value) == CFBooleanGetTypeID() {
        return .bool(value.boolValue)
      }

      return .number(value.doubleValue)
    case let value as String:
      return .string(value)
    case let value as [Any]:
      return .array(try value.map { try fromFoundationValue($0) })
    case let value as [String: Any]:
      var result: [String: TerajsJSONValue] = [:]
      for (key, entry) in value {
        result[key] = try fromFoundationValue(entry)
      }
      return .object(result)
    default:
      throw TerajsHostTransportError.invalidPayload("Unsupported JSON value")
    }
  }

  func foundationValue() -> Any {
    switch self {
    case .null:
      return NSNull()
    case let .bool(value):
      return value
    case let .number(value):
      return value
    case let .string(value):
      return value
    case let .array(values):
      return values.map { $0.foundationValue() }
    case let .object(values):
      return values.reduce(into: [String: Any]()) { result, entry in
        result[entry.key] = entry.value.foundationValue()
      }
    }
  }
}