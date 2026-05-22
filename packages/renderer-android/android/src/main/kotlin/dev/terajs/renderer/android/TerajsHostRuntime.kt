package dev.terajs.renderer.android

import android.content.Context
import android.view.View

class AndroidHostRuntime(
  context: Context,
  emitEventPayload: (String) -> Unit = {}
) {
  val applier = AndroidCommandApplier(context)

  val transport = AndroidHostTransport(
    applyCommands = { commands ->
      applier.applyCommands(commands)
    },
    emitEventPayload = emitEventPayload
  )

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
}