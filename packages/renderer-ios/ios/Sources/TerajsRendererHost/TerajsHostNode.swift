import UIKit

public protocol UIKitHostNode: AnyObject {
  var nodeId: Int { get }
  var parentId: Int? { get set }
}

public final class UIKitHostElementNode: UIKitHostNode {
  public let nodeId: Int
  public let viewType: String
  public let view: UIView
  public var parentId: Int?
  public var childNodeIds: [Int]
  public var props: [String: TerajsJSONValue]
  public var styles: [String: String]
  public var className: String?
  public var subscribedEvents: Set<String>

  init(nodeId: Int, viewType: String, view: UIView) {
    self.nodeId = nodeId
    self.viewType = viewType
    self.view = view
    self.childNodeIds = []
    self.props = [:]
    self.styles = [:]
    self.subscribedEvents = []
  }
}

public final class UIKitHostTextNode: UIKitHostNode {
  public let nodeId: Int
  public var parentId: Int?
  public var value: String

  init(nodeId: Int, value: String) {
    self.nodeId = nodeId
    self.value = value
  }
}