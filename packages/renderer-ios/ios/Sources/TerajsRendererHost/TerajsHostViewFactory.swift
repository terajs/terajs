import UIKit

public final class UIKitHostViewFactory {
  public init() {}

  public func makeView(for viewType: String) -> UIView {
    switch viewType {
    case "UIButton":
      let button = UIButton(type: .system)
      button.titleLabel?.numberOfLines = 0
      return button
    case "UIImageView":
      return UIImageView()
    case "UIPickerView":
      return UIPickerView()
    case "UIScrollView":
      return UIScrollView()
    case "UIStackView":
      let stackView = UIStackView()
      stackView.axis = .vertical
      return stackView
    case "UISwitch":
      return UISwitch()
    case "UITextField":
      return UITextField()
    case "UITextView":
      let textView = UITextView()
      textView.isScrollEnabled = false
      return textView
    case "UILabel":
      let label = UILabel()
      label.numberOfLines = 0
      return label
    default:
      return UIView()
    }
  }
}