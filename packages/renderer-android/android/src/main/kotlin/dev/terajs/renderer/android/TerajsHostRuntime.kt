package dev.terajs.renderer.android

import android.content.Context
import android.view.View

private class AndroidNativeEventDispatcher(
  private val emitEventPayload: (String) -> Unit,
) {
  var handler: AndroidNativeEventHandler? = null

  val hasHandler: Boolean
    get() = handler != null

  fun emit(payload: String) {
    emitEventPayload(payload)
    handler?.handle(payload)
  }
}

class AndroidHostRuntime(
  context: Context,
  val runtimeDescriptorPath: String = ".terajs/generated/android/runtime/generated-route-runtime.json",
  private val readTextAssetImpl: AndroidRuntimeAssetReader = AndroidRuntimeAssetReader { assetPath ->
    throw AndroidHostRuntimeContractError(
      "Android host runtime cannot read asset $assetPath without a supplied asset reader."
    )
  },
  emitEventPayload: (String) -> Unit = {},
  private val diagnosticsSink: AndroidDiagnosticsSink = AndroidLogcatDiagnosticsSink,
) {
  val applier = AndroidCommandApplier(context)
  private val nativeEventDispatcher = AndroidNativeEventDispatcher(emitEventPayload)
  private lateinit var transportRef: AndroidHostTransport
  private var hasStarted = false
  private val eventBinder = AndroidHostEventBinder { nodeId, name, payload ->
    if (::transportRef.isInitialized) {
      transportRef.sendNativeEvent(nodeId = nodeId, name = name, payload = payload)
    }
  }

  val transport = AndroidHostTransport(
    applyCommands = { commands ->
      applyCommands(commands)
    },
    emitEventPayload = nativeEventDispatcher::emit,
    diagnostics = diagnosticsSink,
  ).also { transportRef = it }

  val rootView: View?
    get() = applier.root?.view

  fun readTextAsset(assetPath: String): String {
    return readTextAssetImpl.readTextAsset(assetPath)
  }

  fun emitCommandBatch(payload: String) {
    receiveCommandBatchPayload(payload)
  }

  fun onNativeEvent(handler: AndroidNativeEventHandler) {
    nativeEventDispatcher.handler = handler
    diagnosticsSink.record(
      AndroidDiagnosticEvent(
        area = "runtime",
        message = "Registered native event handler",
        details = mapOf("runtimeDescriptorPath" to runtimeDescriptorPath),
      )
    )
  }

  fun setNativeEventHandler(handler: AndroidNativeEventHandler) {
    onNativeEvent(handler)
  }

  fun clearNativeEventHandler() {
    nativeEventDispatcher.handler = null
  }

  fun start(): AndroidHostRuntimeDiagnosticsSnapshot {
    hasStarted = true
    val snapshot = diagnostics()
    diagnosticsSink.record(
      AndroidDiagnosticEvent(
        area = "runtime",
        message = "Android host runtime is ready for live runtime startup",
        details = mapOf("runtimeDescriptorPath" to runtimeDescriptorPath),
      )
    )
    return snapshot
  }

  fun shutdown() {
    applier.root?.nodeId?.let(::removeBindings)
    clearNativeEventHandler()
    hasStarted = false
    diagnosticsSink.record(
      AndroidDiagnosticEvent(
        area = "runtime",
        message = "Android host runtime shut down",
        details = mapOf("runtimeDescriptorPath" to runtimeDescriptorPath),
      )
    )
  }

  fun diagnostics(): AndroidHostRuntimeDiagnosticsSnapshot {
    return AndroidHostRuntimeDiagnosticsSnapshot(
      runtimeDescriptorPath = runtimeDescriptorPath,
      hasStarted = hasStarted,
      hasRootView = rootView != null,
      hasNativeEventHandler = nativeEventDispatcher.hasHandler,
    )
  }

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

    diagnosticsSink.record(
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