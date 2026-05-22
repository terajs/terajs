import UIKit

enum UIKitHostViewUpdater {
  static func applyProp(named name: String, value: TerajsJSONValue?, to node: UIKitHostElementNode) {
    switch name {
    case "accessibilityLabel":
      node.view.accessibilityLabel = value?.stringValue
    case "text":
      applyText(value?.stringValue, to: node.view)
    case "placeholder":
      (node.view as? UITextField)?.placeholder = value?.stringValue
    case "source":
      if let imageView = node.view as? UIImageView {
        imageView.accessibilityValue = value?.stringValue
      }
    case "on":
      if let toggle = node.view as? UISwitch, let boolValue = value?.boolValue {
        toggle.isOn = boolValue
      }
    default:
      break
    }
  }

  static func applyStyles(_ styles: [String: String], to node: UIKitHostElementNode) {
    for (name, value) in styles {
      switch name {
      case "backgroundColor":
        node.view.backgroundColor = parseColor(value)
      case "textColor":
        applyTextColor(parseColor(value), to: node.view)
      case "cornerRadius":
        if let radius = parseCGFloat(value) {
          node.view.layer.cornerRadius = radius
          node.view.layer.masksToBounds = radius > 0
        }
      case "fontSize":
        applyFontSize(parseCGFloat(value), to: node.view)
      case "stackAxis":
        if let stackView = node.view as? UIStackView {
          stackView.axis = value == "horizontal" ? .horizontal : .vertical
        }
      case "stackDistribution":
        if let stackView = node.view as? UIStackView {
          stackView.distribution = distribution(for: value)
        }
      case "stackAlignment":
        if let stackView = node.view as? UIStackView {
          stackView.alignment = alignment(for: value)
        }
      case "stackSpacing":
        if let stackView = node.view as? UIStackView, let spacing = parseCGFloat(value) {
          stackView.spacing = spacing
        }
      case "contentPadding", "contentPaddingHorizontal", "contentPaddingVertical", "layoutMargin", "layoutMarginHorizontal", "layoutMarginVertical":
        applyLayoutMargins(styleName: name, value: value, to: node.view)
      case "preferredWidth":
        applyPreferredDimension(width: parseCGFloat(value), height: nil, to: node.view)
      case "preferredHeight":
        applyPreferredDimension(width: nil, height: parseCGFloat(value), to: node.view)
      default:
        break
      }
    }
  }

  static func applyClassName(_ className: String?, to node: UIKitHostElementNode) {
    node.view.accessibilityIdentifier = className
  }

  static func syncTextChildren(of node: UIKitHostElementNode, allNodes: [Int: UIKitHostNode]) {
    guard supportsText(node.view) else {
      return
    }

    let text = node.childNodeIds.compactMap { childId in
      (allNodes[childId] as? UIKitHostTextNode)?.value
    }.joined()

    applyText(text.isEmpty ? nil : text, to: node.view)
  }

  private static func supportsText(_ view: UIView) -> Bool {
    view is UIButton || view is UILabel || view is UITextField || view is UITextView
  }

  private static func applyText(_ text: String?, to view: UIView) {
    switch view {
    case let button as UIButton:
      button.setTitle(text, for: .normal)
    case let label as UILabel:
      label.text = text
    case let textField as UITextField:
      textField.text = text
    case let textView as UITextView:
      textView.text = text
    default:
      break
    }
  }

  private static func applyTextColor(_ color: UIColor?, to view: UIView) {
    switch view {
    case let button as UIButton:
      button.setTitleColor(color, for: .normal)
    case let label as UILabel:
      label.textColor = color
    case let textField as UITextField:
      textField.textColor = color
    case let textView as UITextView:
      textView.textColor = color
    default:
      break
    }
  }

  private static func applyFontSize(_ size: CGFloat?, to view: UIView) {
    guard let size else {
      return
    }

    switch view {
    case let button as UIButton:
      button.titleLabel?.font = button.titleLabel?.font.withSize(size)
    case let label as UILabel:
      label.font = label.font.withSize(size)
    case let textField as UITextField:
      textField.font = textField.font?.withSize(size)
    case let textView as UITextView:
      textView.font = textView.font?.withSize(size)
    default:
      break
    }
  }

  private static func applyLayoutMargins(styleName: String, value: String, to view: UIView) {
    guard let inset = parseCGFloat(value) else {
      return
    }

    var margins = view.layoutMargins
    switch styleName {
    case "contentPadding", "layoutMargin":
      margins = UIEdgeInsets(top: inset, left: inset, bottom: inset, right: inset)
    case "contentPaddingHorizontal", "layoutMarginHorizontal":
      margins.left = inset
      margins.right = inset
    case "contentPaddingVertical", "layoutMarginVertical":
      margins.top = inset
      margins.bottom = inset
    default:
      break
    }

    view.layoutMargins = margins
    if let stackView = view as? UIStackView {
      stackView.isLayoutMarginsRelativeArrangement = true
    }
  }

  private static func applyPreferredDimension(width: CGFloat?, height: CGFloat?, to view: UIView) {
    var frame = view.frame
    if let width {
      frame.size.width = width
    }
    if let height {
      frame.size.height = height
    }
    view.frame = frame
  }

  private static func parseCGFloat(_ value: String) -> CGFloat? {
    guard let number = Double(value) else {
      return nil
    }

    return CGFloat(number)
  }

  private static func parseColor(_ value: String) -> UIColor? {
    switch value.lowercased() {
    case "black":
      return .black
    case "blue":
      return .blue
    case "clear":
      return .clear
    case "gray", "grey":
      return .gray
    case "green":
      return .green
    case "red":
      return .red
    case "systemblue":
      return .systemBlue
    case "white":
      return .white
    default:
      return parseHexColor(value)
    }
  }

  private static func parseHexColor(_ value: String) -> UIColor? {
    let hex = value.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
    guard let number = UInt64(hex, radix: 16) else {
      return nil
    }

    switch hex.count {
    case 6:
      let red = CGFloat((number & 0xFF0000) >> 16) / 255
      let green = CGFloat((number & 0x00FF00) >> 8) / 255
      let blue = CGFloat(number & 0x0000FF) / 255
      return UIColor(red: red, green: green, blue: blue, alpha: 1)
    case 8:
      let alpha = CGFloat((number & 0xFF000000) >> 24) / 255
      let red = CGFloat((number & 0x00FF0000) >> 16) / 255
      let green = CGFloat((number & 0x0000FF00) >> 8) / 255
      let blue = CGFloat(number & 0x000000FF) / 255
      return UIColor(red: red, green: green, blue: blue, alpha: alpha)
    default:
      return nil
    }
  }

  private static func distribution(for value: String) -> UIStackView.Distribution {
    switch value {
    case "center":
      return .equalCentering
    case "equalCentering":
      return .equalCentering
    case "equalSpacing":
      return .equalSpacing
    case "fillEqually":
      return .fillEqually
    default:
      return .fill
    }
  }

  private static func alignment(for value: String) -> UIStackView.Alignment {
    switch value {
    case "center":
      return .center
    case "fill":
      return .fill
    case "trailing":
      return .trailing
    default:
      return .leading
    }
  }
}

private extension TerajsJSONValue {
  var boolValue: Bool? {
    if case let .bool(value) = self {
      return value
    }
    return nil
  }

  var isNullValue: Bool {
    if case .null = self {
      return true
    }
    return false
  }

  var stringValue: String? {
    switch self {
    case let .string(value):
      return value
    case let .number(value):
      return String(value)
    case .null:
      return nil
    default:
      return nil
    }
  }
}