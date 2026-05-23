package dev.terajs.renderer.android

import android.content.Context
import android.view.View

class AndroidHostRuntime(
  context: Context,
  emitEventPayload: (String) -> Unit = {},
  private val diagnostics: AndroidDiagnosticsSink = AndroidLogcatDiagnosticsSink,
) {
  val applier = AndroidCommandApplier(context)
  private lateinit var transportRef: AndroidHostTransport
  private val eventBinder = AndroidHostEventBinder { nodeId, name, payload ->
    if (::transportRef.isInitialized) {
      transportRef.sendNativeEvent(nodeId = nodeId, name = name, payload = payload)
    }
  }

  val transport = AndroidHostTransport(
    applyCommands = { commands ->
      applyCommands(commands)
    },
    emitEventPayload = emitEventPayload,
    diagnostics = diagnostics,
  ).also { transportRef = it }

  val rootView: View?
    get() = applier.root?.view

  fun receiveCommandBatchPayload(payload: String) {
    transport.receiveCommandBatchPayload(payload)
  }

  fun sendNativeEvent(
    nodeId: Int,
    name: String,
    payload: TerajsJsonValue? = null
  ) {
    transport.sendNativeEvent(nodeId = nodeId, name = name, payload = payload)
  }

  private fun applyCommands(commands: List<AndroidHostCommand>) {
    commands.forEach { command ->
      if (command.type == AndroidHostCommandType.Remove && command.nodeId != null) {
        removeBindings(command.nodeId)
      }

      applier.apply(command)

      if (command.type == AndroidHostCommandType.CreateElement && command.nodeId != null) {
        val node = applier.node(command.nodeId) as? AndroidHostElementNode
        if (node != null) {
          eventBinder.bindIfNeeded(node)
        }
      }
    }

    diagnostics.record(
      AndroidDiagnosticEvent(
        area = "runtime",
        message = "Applied command batch",
        details = mapOf(
          "commandCount" to commands.size,
          "rootViewType" to (rootView?.javaClass?.simpleName ?: "null"),
        ),
      )
    )
  }

  private fun removeBindings(nodeId: Int) {
    val node = applier.node(nodeId)
    if (node is AndroidHostElementNode) {
      node.childNodeIds.forEach { childId ->
        removeBindings(childId)
      }
      eventBinder.remove(nodeId)
    } else if (node == null) {
      eventBinder.remove(nodeId)
    }
  }
}