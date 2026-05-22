import UIKit

public enum UIKitHostApplyError: Error {
  case duplicateNode(Int)
  case expectedElement(Int)
  case expectedText(Int)
  case malformedCommand(UIKitHostCommandType)
  case missingNode(Int)
}

public final class UIKitCommandApplier {
  public private(set) var root: UIKitHostElementNode?

  private let viewFactory: UIKitHostViewFactory
  private var nodes: [Int: UIKitHostNode]

  public init(viewFactory: UIKitHostViewFactory = UIKitHostViewFactory()) {
    self.viewFactory = viewFactory
    self.nodes = [:]
  }

  public func applyCommands(_ commands: [UIKitHostCommand]) throws {
    for command in commands {
      try apply(command)
    }
  }

  public func apply(_ command: UIKitHostCommand) throws {
    switch command.type {
    case .createElement:
      try createElement(command)
    case .createText:
      try createText(command)
    case .insert:
      try insert(command)
    case .remove:
      try remove(command)
    case .setText:
      try setText(command)
    case .setProp:
      try setProp(command)
    case .setStyle:
      try setStyle(command)
    case .setClass:
      try setClass(command)
    case .subscribeEvent:
      try subscribeEvent(command)
    case .unsubscribeEvent:
      try unsubscribeEvent(command)
    }
  }

  public func node(for nodeId: Int) -> UIKitHostNode? {
    nodes[nodeId]
  }

  private func createElement(_ command: UIKitHostCommand) throws {
    guard let nodeId = command.nodeId, let viewType = command.viewType else {
      throw UIKitHostApplyError.malformedCommand(command.type)
    }
    guard nodes[nodeId] == nil else {
      throw UIKitHostApplyError.duplicateNode(nodeId)
    }

    let node = UIKitHostElementNode(nodeId: nodeId, viewType: viewType, view: viewFactory.makeView(for: viewType))
    nodes[nodeId] = node
    root ??= node
  }

  private func createText(_ command: UIKitHostCommand) throws {
    guard let nodeId = command.nodeId, let value = command.value?.stringValue ?? command.valueString else {
      throw UIKitHostApplyError.malformedCommand(command.type)
    }
    guard nodes[nodeId] == nil else {
      throw UIKitHostApplyError.duplicateNode(nodeId)
    }

    nodes[nodeId] = UIKitHostTextNode(nodeId: nodeId, value: value)
  }

  private func insert(_ command: UIKitHostCommand) throws {
    guard let parentId = command.parentId, let childId = command.childId else {
      throw UIKitHostApplyError.malformedCommand(command.type)
    }

    let parent = try requireElementNode(parentId)
    let child = try requireNode(childId)
    detachFromParent(child)

    let insertionIndex = resolvedInsertionIndex(in: parent.childNodeIds, anchorId: command.anchorId)
    parent.childNodeIds.insert(childId, at: insertionIndex)
    child.parentId = parentId

    if let element = child as? UIKitHostElementNode {
      attach(view: element.view, to: parent, anchorId: command.anchorId)
    } else if child is UIKitHostTextNode {
      UIKitHostViewUpdater.syncTextChildren(of: parent, allNodes: nodes)
    }
  }

  private func remove(_ command: UIKitHostCommand) throws {
    guard let nodeId = command.nodeId else {
      throw UIKitHostApplyError.malformedCommand(command.type)
    }

    let node = try requireNode(nodeId)
    if let parentId = node.parentId, let parent = nodes[parentId] as? UIKitHostElementNode {
      parent.childNodeIds.removeAll { $0 == node.nodeId }
      if let element = node as? UIKitHostElementNode {
        detach(view: element.view, from: parent.view)
      } else if node is UIKitHostTextNode {
        UIKitHostViewUpdater.syncTextChildren(of: parent, allNodes: nodes)
      }
    }

    removeSubtree(node)
    if root?.nodeId == nodeId {
      root = nil
    }
  }

  private func setText(_ command: UIKitHostCommand) throws {
    guard let nodeId = command.nodeId, let value = command.value?.stringValue ?? command.valueString else {
      throw UIKitHostApplyError.malformedCommand(command.type)
    }

    let node = try requireTextNode(nodeId)
    node.value = value

    if let parentId = node.parentId, let parent = nodes[parentId] as? UIKitHostElementNode {
      UIKitHostViewUpdater.syncTextChildren(of: parent, allNodes: nodes)
    }
  }

  private func setProp(_ command: UIKitHostCommand) throws {
    guard let nodeId = command.nodeId, let name = command.name else {
      throw UIKitHostApplyError.malformedCommand(command.type)
    }

    let node = try requireElementNode(nodeId)
    if let value = command.value, !value.isNullValue {
      node.props[name] = value
      UIKitHostViewUpdater.applyProp(named: name, value: value, to: node)
      return
    }

    node.props.removeValue(forKey: name)
    UIKitHostViewUpdater.applyProp(named: name, value: nil, to: node)
  }

  private func setStyle(_ command: UIKitHostCommand) throws {
    guard let nodeId = command.nodeId, let style = command.style else {
      throw UIKitHostApplyError.malformedCommand(command.type)
    }

    let node = try requireElementNode(nodeId)
    for (name, value) in style {
      node.styles[name] = value
    }
    UIKitHostViewUpdater.applyStyles(node.styles, to: node)
  }

  private func setClass(_ command: UIKitHostCommand) throws {
    guard let nodeId = command.nodeId else {
      throw UIKitHostApplyError.malformedCommand(command.type)
    }

    let node = try requireElementNode(nodeId)
    node.className = command.className
    UIKitHostViewUpdater.applyClassName(command.className, to: node)
  }

  private func subscribeEvent(_ command: UIKitHostCommand) throws {
    guard let nodeId = command.nodeId, let name = command.name else {
      throw UIKitHostApplyError.malformedCommand(command.type)
    }

    try requireElementNode(nodeId).subscribedEvents.insert(name)
  }

  private func unsubscribeEvent(_ command: UIKitHostCommand) throws {
    guard let nodeId = command.nodeId, let name = command.name else {
      throw UIKitHostApplyError.malformedCommand(command.type)
    }

    try requireElementNode(nodeId).subscribedEvents.remove(name)
  }

  private func requireElementNode(_ nodeId: Int) throws -> UIKitHostElementNode {
    guard let node = nodes[nodeId] else {
      throw UIKitHostApplyError.missingNode(nodeId)
    }
    guard let element = node as? UIKitHostElementNode else {
      throw UIKitHostApplyError.expectedElement(nodeId)
    }
    return element
  }

  private func requireNode(_ nodeId: Int) throws -> UIKitHostNode {
    guard let node = nodes[nodeId] else {
      throw UIKitHostApplyError.missingNode(nodeId)
    }
    return node
  }

  private func requireTextNode(_ nodeId: Int) throws -> UIKitHostTextNode {
    guard let node = nodes[nodeId] else {
      throw UIKitHostApplyError.missingNode(nodeId)
    }
    guard let text = node as? UIKitHostTextNode else {
      throw UIKitHostApplyError.expectedText(nodeId)
    }
    return text
  }

  private func detachFromParent(_ node: UIKitHostNode) {
    guard let parentId = node.parentId, let parent = nodes[parentId] as? UIKitHostElementNode else {
      return
    }

    parent.childNodeIds.removeAll { $0 == node.nodeId }
    if let element = node as? UIKitHostElementNode {
      detach(view: element.view, from: parent.view)
    } else if node is UIKitHostTextNode {
      UIKitHostViewUpdater.syncTextChildren(of: parent, allNodes: nodes)
    }
    node.parentId = nil
  }

  private func attach(view childView: UIView, to parent: UIKitHostElementNode, anchorId: Int?) {
    detach(view: childView, from: childView.superview)

    if let stackView = parent.view as? UIStackView {
      let index = arrangedSubviewIndex(in: stackView, anchorId: anchorId)
      stackView.insertArrangedSubview(childView, at: index)
      return
    }

    let index = subviewIndex(in: parent.view, anchorId: anchorId)
    parent.view.insertSubview(childView, at: index)
  }

  private func detach(view childView: UIView, from parentView: UIView?) {
    if let stackView = parentView as? UIStackView, stackView.arrangedSubviews.contains(childView) {
      stackView.removeArrangedSubview(childView)
    }
    childView.removeFromSuperview()
  }

  private func arrangedSubviewIndex(in stackView: UIStackView, anchorId: Int?) -> Int {
    guard let anchorId,
          let anchor = nodes[anchorId] as? UIKitHostElementNode,
          let index = stackView.arrangedSubviews.firstIndex(of: anchor.view) else {
      return stackView.arrangedSubviews.count
    }

    return index
  }

  private func subviewIndex(in view: UIView, anchorId: Int?) -> Int {
    guard let anchorId,
          let anchor = nodes[anchorId] as? UIKitHostElementNode,
          let index = view.subviews.firstIndex(of: anchor.view) else {
      return view.subviews.count
    }

    return index
  }

  private func resolvedInsertionIndex(in childNodeIds: [Int], anchorId: Int?) -> Int {
    guard let anchorId, let index = childNodeIds.firstIndex(of: anchorId) else {
      return childNodeIds.count
    }

    return index
  }

  private func removeSubtree(_ node: UIKitHostNode) {
    if let element = node as? UIKitHostElementNode {
      let childIds = element.childNodeIds
      for childId in childIds {
        if let child = nodes[childId] {
          removeSubtree(child)
        }
      }
      element.childNodeIds.removeAll()
      element.view.removeFromSuperview()
    }

    nodes.removeValue(forKey: node.nodeId)
  }
}

private extension UIKitHostCommand {
  var valueString: String? {
    if case let .string(value)? = value {
      return value
    }
    return nil
  }
}