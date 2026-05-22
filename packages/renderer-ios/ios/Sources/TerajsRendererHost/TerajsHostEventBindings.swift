import UIKit

final class UIKitHostEventBinder {
  typealias Emit = (Int, String, TerajsJSONValue?) -> Void

  private var bindings: [Int: UIKitHostEventBinding] = [:]
  private let emit: Emit

  init(emit: @escaping Emit) {
    self.emit = emit
  }

  func bindIfNeeded(node: UIKitHostElementNode) {
    guard bindings[node.nodeId] == nil else {
      return
    }

    let binding: UIKitHostEventBinding?
    switch node.view {
    case let button as UIButton:
      binding = UIKitButtonEventBinding(node: node, button: button, emit: emit)
    case let toggle as UISwitch:
      binding = UIKitSwitchEventBinding(node: node, toggle: toggle, emit: emit)
    case let textField as UITextField:
      binding = UIKitTextFieldEventBinding(node: node, textField: textField, emit: emit)
    case let textView as UITextView:
      binding = UIKitTextViewEventBinding(node: node, textView: textView, emit: emit)
    default:
      binding = nil
    }

    if let binding {
      bindings[node.nodeId] = binding
    }
  }

  func remove(nodeId: Int) {
    bindings.removeValue(forKey: nodeId)?.detach()
  }
}

private protocol UIKitHostEventBinding: AnyObject {
  func detach()
}

private final class UIKitButtonEventBinding: NSObject, UIKitHostEventBinding {
  private let button: UIButton
  private let emit: UIKitHostEventBinder.Emit
  private let node: UIKitHostElementNode

  init(node: UIKitHostElementNode, button: UIButton, emit: @escaping UIKitHostEventBinder.Emit) {
    self.button = button
    self.emit = emit
    self.node = node
    super.init()
    button.addTarget(self, action: #selector(handleTap), for: .touchUpInside)
  }

  func detach() {
    button.removeTarget(self, action: #selector(handleTap), for: .touchUpInside)
  }

  @objc private func handleTap() {
    guard node.subscribedEvents.contains("tap") else {
      return
    }

    emit(node.nodeId, "tap", .object(["source": .string("native")]))
  }
}

private final class UIKitSwitchEventBinding: NSObject, UIKitHostEventBinding {
  private let emit: UIKitHostEventBinder.Emit
  private let node: UIKitHostElementNode
  private let toggle: UISwitch

  init(node: UIKitHostElementNode, toggle: UISwitch, emit: @escaping UIKitHostEventBinder.Emit) {
    self.emit = emit
    self.node = node
    self.toggle = toggle
    super.init()
    toggle.addTarget(self, action: #selector(handleChange), for: .valueChanged)
  }

  func detach() {
    toggle.removeTarget(self, action: #selector(handleChange), for: .valueChanged)
  }

  @objc private func handleChange() {
    guard node.subscribedEvents.contains("change") else {
      return
    }

    emit(node.nodeId, "change", .object([
      "checked": .bool(toggle.isOn),
      "on": .bool(toggle.isOn)
    ]))
  }
}

private final class UIKitTextFieldEventBinding: NSObject, UIKitHostEventBinding {
  private let emit: UIKitHostEventBinder.Emit
  private let node: UIKitHostElementNode
  private let textField: UITextField

  init(node: UIKitHostElementNode, textField: UITextField, emit: @escaping UIKitHostEventBinder.Emit) {
    self.emit = emit
    self.node = node
    self.textField = textField
    super.init()
    textField.addTarget(self, action: #selector(handleChange), for: .editingChanged)
  }

  func detach() {
    textField.removeTarget(self, action: #selector(handleChange), for: .editingChanged)
  }

  @objc private func handleChange() {
    guard node.subscribedEvents.contains("change") else {
      return
    }

    let text = textField.text ?? ""
    emit(node.nodeId, "textInput", .object([
      "text": .string(text),
      "value": .string(text)
    ]))
  }
}

private final class UIKitTextViewEventBinding: UIKitHostEventBinding {
  private let emit: UIKitHostEventBinder.Emit
  private let node: UIKitHostElementNode
  private let textView: UITextView
  private var changeObserver: NSObjectProtocol?

  init(node: UIKitHostElementNode, textView: UITextView, emit: @escaping UIKitHostEventBinder.Emit) {
    self.emit = emit
    self.node = node
    self.textView = textView
    self.changeObserver = NotificationCenter.default.addObserver(
      forName: UITextView.textDidChangeNotification,
      object: textView,
      queue: nil
    ) { [weak self] _ in
      self?.handleChange()
    }
  }

  func detach() {
    if let changeObserver {
      NotificationCenter.default.removeObserver(changeObserver)
      self.changeObserver = nil
    }
  }

  private func handleChange() {
    guard node.subscribedEvents.contains("change") else {
      return
    }

    let text = textView.text ?? ""
    emit(node.nodeId, "textInput", .object([
      "text": .string(text),
      "value": .string(text)
    ]))
  }
}