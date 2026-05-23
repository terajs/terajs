package dev.terajs.renderer.android

import org.json.JSONArray
import org.json.JSONObject

object AndroidWireCodec {
  fun decodeCommandBatch(payload: String): List<AndroidHostCommand> {
    val commands = JSONArray(payload)
    return (0 until commands.length()).map { index ->
      val entry = commands.opt(index)
      val objectValue = entry as? JSONObject
        ?: throw IllegalArgumentException("commands[$index] must be an object")
      objectValue.toAndroidHostCommand("commands[$index]")
    }
  }

  fun encodeNativeEventPacket(packet: AndroidNativeEventPacket): String {
    return packet.toJsonObject().toString()
  }
}

class AndroidHostTransport(
  private val applyCommands: (List<AndroidHostCommand>) -> Unit,
  private val emitEventPayload: (String) -> Unit,
  private val diagnostics: AndroidDiagnosticsSink = AndroidLogcatDiagnosticsSink,
) {
  fun receiveCommandBatchPayload(payload: String) {
    val commands = AndroidWireCodec.decodeCommandBatch(payload)
    diagnostics.record(
      AndroidDiagnosticEvent(
        area = "bridge",
        message = "Received command batch",
        details = mapOf("commandCount" to commands.size),
      )
    )
    applyCommands(commands)
  }

  fun makeNativeEventPacketPayload(
    nodeId: Int,
    name: String,
    payload: TerajsJsonValue? = null,
  ): String {
    return AndroidWireCodec.encodeNativeEventPacket(
      AndroidNativeEventPacket(nodeId = nodeId, name = name, payload = payload)
    )
  }

  fun sendNativeEvent(
    nodeId: Int,
    name: String,
    payload: TerajsJsonValue? = null,
  ) {
    diagnostics.record(
      AndroidDiagnosticEvent(
        area = "bridge",
        message = "Sent native event",
        details = mapOf(
          "nodeId" to nodeId,
          "name" to name,
        ),
      )
    )
    emitEventPayload(makeNativeEventPacketPayload(nodeId = nodeId, name = name, payload = payload))
  }
}