import Foundation

public typealias UIKitRuntimeAssetReader = (String) throws -> String
public typealias UIKitNativeEventPayloadHandler = (String) -> Void
public typealias UIKitHostRuntimeDiagnosticSink = (UIKitHostRuntimeDiagnostic) -> Void

public enum UIKitHostRuntimeError: Error {
  case assetReaderUnavailable(String)
}

public enum UIKitHostRuntimeDiagnosticLevel: String {
  case info
  case warning
  case error
}

public struct UIKitHostRuntimeDiagnostic {
  public let level: UIKitHostRuntimeDiagnosticLevel
  public let code: String
  public let message: String
  public let context: [String: String]

  public init(
    level: UIKitHostRuntimeDiagnosticLevel,
    code: String,
    message: String,
    context: [String: String] = [:]
  ) {
    self.level = level
    self.code = code
    self.message = message
    self.context = context
  }
}

public struct UIKitHostRuntimeDiagnosticsSnapshot {
  public let runtimeDescriptorPath: String
  public let hasStarted: Bool
  public let hasRootView: Bool
  public let hasNativeEventHandler: Bool

  public init(
    runtimeDescriptorPath: String,
    hasStarted: Bool,
    hasRootView: Bool,
    hasNativeEventHandler: Bool
  ) {
    self.runtimeDescriptorPath = runtimeDescriptorPath
    self.hasStarted = hasStarted
    self.hasRootView = hasRootView
    self.hasNativeEventHandler = hasNativeEventHandler
  }
}