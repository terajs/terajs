package dev.terajs.renderer.android

import android.content.Context
import android.view.View
import android.view.ViewGroup

class AndroidHostApplyException(message: String) : Exception(message)

class AndroidCommandApplier(context: Context, private val viewFactory: AndroidHostViewFactory = AndroidHostViewFactory(context)) {
  var root: AndroidHostElementNode? = null
    private set

  private val nodes = linkedMapOf<Int, AndroidHostNode>()

  fun applyCommands(commands: List<AndroidHostCommand>) {
    commands.forEach { command -> apply(command) }
  }

  fun apply(command: AndroidHostCommand) {
    when (command.type) {
      AndroidHostCommandType.CreateElement -> createElement(command)
      AndroidHostCommandType.CreateText -> createText(command)
      AndroidHostCommandType.Insert -> insert(command)
      AndroidHostCommandType.Remove -> remove(command)
      AndroidHostCommandType.SetText -> setText(command)
      AndroidHostCommandType.SetProp -> setProp(command)
      AndroidHostCommandType.SetStyle -> setStyle(command)
      AndroidHostCommandType.SetClass -> setClass(command)
      AndroidHostCommandType.SubscribeEvent -> subscribeEvent(command)
      AndroidHostCommandType.UnsubscribeEvent -> unsubscribeEvent(command)
    }
  }

  fun node(nodeId: Int): AndroidHostNode? = nodes[nodeId]

  private fun createElement(command: AndroidHostCommand) {
    val nodeId = command.nodeId ?: throw AndroidHostApplyException("${command.type} requires nodeId")
    val viewType = command.viewType ?: throw AndroidHostApplyException("${command.type} requires viewType")
    require(nodes[nodeId] == null) { "Duplicate Android host node $nodeId" }

    val node = AndroidHostElementNode(nodeId = nodeId, viewType = viewType, view = viewFactory.makeView(viewType))
    nodes[nodeId] = node
    if (root == null) {
      root = node
    }
  }

  private fun createText(command: AndroidHostCommand) {
    val nodeId = command.nodeId ?: throw AndroidHostApplyException("${command.type} requires nodeId")
    val value = command.value.stringValue ?: throw AndroidHostApplyException("${command.type} requires string value")
    require(nodes[nodeId] == null) { "Duplicate Android host node $nodeId" }

    nodes[nodeId] = AndroidHostTextNode(nodeId = nodeId, value = value)
  }

  private fun insert(command: AndroidHostCommand) {
    val parentId = command.parentId ?: throw AndroidHostApplyException("${command.type} requires parentId")
    val childId = command.childId ?: throw AndroidHostApplyException("${command.type} requires childId")
    val parent = requireElementNode(parentId)
    val child = requireNode(childId)

    detachFromParent(child)

    val index = resolvedInsertionIndex(parent.childNodeIds, command.anchorId)
    parent.childNodeIds.add(index, childId)
    child.parentId = parentId

    if (child is AndroidHostElementNode) {
      attach(child.view, parent, command.anchorId)
    } else if (child is AndroidHostTextNode) {
      AndroidHostViewUpdater.syncTextChildren(parent, nodes)
    }
  }

  private fun remove(command: AndroidHostCommand) {
    val nodeId = command.nodeId ?: throw AndroidHostApplyException("${command.type} requires nodeId")
    val node = requireNode(nodeId)

    node.parentId?.let { parentId ->
      val parent = nodes[parentId] as? AndroidHostElementNode
      if (parent != null) {
        parent.childNodeIds.remove(node.nodeId)
        if (node is AndroidHostElementNode) {
          detach(node.view, parent.view)
        } else if (node is AndroidHostTextNode) {
          AndroidHostViewUpdater.syncTextChildren(parent, nodes)
        }
      }
    }

    removeSubtree(node)
    if (root?.nodeId == nodeId) {
      root = null
    }
  }

  private fun setText(command: AndroidHostCommand) {
    val nodeId = command.nodeId ?: throw AndroidHostApplyException("${command.type} requires nodeId")
    val value = command.value.stringValue ?: throw AndroidHostApplyException("${command.type} requires string value")
    val node = requireTextNode(nodeId)
    node.value = value

    node.parentId?.let { parentId ->
      val parent = nodes[parentId] as? AndroidHostElementNode
      if (parent != null) {
        AndroidHostViewUpdater.syncTextChildren(parent, nodes)
      }
    }
  }

  private fun setProp(command: AndroidHostCommand) {
    val nodeId = command.nodeId ?: throw AndroidHostApplyException("${command.type} requires nodeId")
    val name = command.name ?: throw AndroidHostApplyException("${command.type} requires name")
    val node = requireElementNode(nodeId)

    if (command.value != null && !command.value.isNullValue) {
      node.props[name] = command.value
      AndroidHostViewUpdater.applyProp(name, command.value, node)
      return
    }

    node.props.remove(name)
    AndroidHostViewUpdater.applyProp(name, null, node)
  }

  private fun setStyle(command: AndroidHostCommand) {
    val nodeId = command.nodeId ?: throw AndroidHostApplyException("${command.type} requires nodeId")
    val style = command.style ?: throw AndroidHostApplyException("${command.type} requires style")
    val node = requireElementNode(nodeId)

    style.forEach { (name, value) -> node.styles[name] = value }
    AndroidHostViewUpdater.applyStyles(node.styles, node)
  }

  private fun setClass(command: AndroidHostCommand) {
    val nodeId = command.nodeId ?: throw AndroidHostApplyException("${command.type} requires nodeId")
    val node = requireElementNode(nodeId)
    node.className = command.className
    AndroidHostViewUpdater.applyClassName(command.className, node)
  }

  private fun subscribeEvent(command: AndroidHostCommand) {
    val nodeId = command.nodeId ?: throw AndroidHostApplyException("${command.type} requires nodeId")
    val name = command.name ?: throw AndroidHostApplyException("${command.type} requires name")
    requireElementNode(nodeId).subscribedEvents.add(name)
  }

  private fun unsubscribeEvent(command: AndroidHostCommand) {
    val nodeId = command.nodeId ?: throw AndroidHostApplyException("${command.type} requires nodeId")
    val name = command.name ?: throw AndroidHostApplyException("${command.type} requires name")
    requireElementNode(nodeId).subscribedEvents.remove(name)
  }

  private fun requireElementNode(nodeId: Int): AndroidHostElementNode {
    val node = nodes[nodeId] ?: throw AndroidHostApplyException("Missing Android host node $nodeId")
    return node as? AndroidHostElementNode
      ?: throw AndroidHostApplyException("Expected Android host element node $nodeId")
  }

  private fun requireNode(nodeId: Int): AndroidHostNode {
    return nodes[nodeId] ?: throw AndroidHostApplyException("Missing Android host node $nodeId")
  }

  private fun requireTextNode(nodeId: Int): AndroidHostTextNode {
    val node = nodes[nodeId] ?: throw AndroidHostApplyException("Missing Android host node $nodeId")
    return node as? AndroidHostTextNode
      ?: throw AndroidHostApplyException("Expected Android host text node $nodeId")
  }

  private fun detachFromParent(node: AndroidHostNode) {
    val parentId = node.parentId ?: return
    val parent = nodes[parentId] as? AndroidHostElementNode ?: return
    parent.childNodeIds.remove(node.nodeId)
    if (node is AndroidHostElementNode) {
      detach(node.view, parent.view)
    } else if (node is AndroidHostTextNode) {
      AndroidHostViewUpdater.syncTextChildren(parent, nodes)
    }
    node.parentId = null
  }

  private fun attach(childView: View, parent: AndroidHostElementNode, anchorId: Int?) {
    val parentView = parent.view as? ViewGroup ?: return
    detach(childView, childView.parent as? View)

    val index = if (anchorId != null) {
      val anchorNode = nodes[anchorId] as? AndroidHostElementNode
      val anchorView = anchorNode?.view
      if (anchorView != null) {
        val anchorIndex = parentView.indexOfChild(anchorView)
        if (anchorIndex >= 0) anchorIndex else parentView.childCount
      } else {
        parentView.childCount
      }
    } else {
      parentView.childCount
    }

    parentView.addView(childView, index)
  }

  private fun detach(childView: View, parentView: View?) {
    (parentView as? ViewGroup)?.removeView(childView)
  }

  private fun resolvedInsertionIndex(childNodeIds: List<Int>, anchorId: Int?): Int {
    if (anchorId == null) {
      return childNodeIds.size
    }
    val index = childNodeIds.indexOf(anchorId)
    return if (index >= 0) index else childNodeIds.size
  }

  private fun removeSubtree(node: AndroidHostNode) {
    if (node is AndroidHostElementNode) {
      val childIds = node.childNodeIds.toList()
      childIds.forEach { childId ->
        nodes[childId]?.let { child -> removeSubtree(child) }
      }
      node.childNodeIds.clear()
      (node.view.parent as? ViewGroup)?.removeView(node.view)
    }

    nodes.remove(node.nodeId)
  }
}

private val AndroidHostCommand.valueString: String?
  get() = (value as? TerajsJsonString)?.value