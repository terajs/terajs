package dev.terajs.renderer.android

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [35])
class AndroidTransportTest {
  @Test
  fun decodesCommandBatchesIntoTypedCommands() {
    val commands = AndroidWireCodec.decodeCommandBatch(
      """
      [
        {
          "type": "create-element",
          "nodeId": 1,
          "viewType": "LinearLayout"
        },
        {
          "type": "set-prop",
          "nodeId": 1,
          "name": "meta",
          "value": {
            "enabled": true,
            "count": 2,
            "items": ["alpha", null]
          }
        },
        {
          "type": "set-style",
          "nodeId": 1,
          "style": {
            "padding": "8",
            "layoutWidth": "match_parent"
          }
        },
        {
          "type": "subscribe-event",
          "nodeId": 1,
          "name": "press"
        }
      ]
      """.trimIndent()
    )

    assertEquals(
      listOf(
        AndroidHostCommand(
          type = AndroidHostCommandType.CreateElement,
          nodeId = 1,
          viewType = "LinearLayout"
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.SetProp,
          nodeId = 1,
          name = "meta",
          value = TerajsJsonObject(
            linkedMapOf(
              "enabled" to TerajsJsonBool(true),
              "count" to TerajsJsonNumber(2.0),
              "items" to TerajsJsonArray(listOf(TerajsJsonString("alpha"), TerajsJsonNull))
            )
          )
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.SetStyle,
          nodeId = 1,
          style = linkedMapOf(
            "padding" to "8",
            "layoutWidth" to "match_parent"
          )
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.SubscribeEvent,
          nodeId = 1,
          name = "press"
        )
      ),
      commands
    )
  }

  @Test
  fun roundTripsNativeEventPayloadsThroughJsonEncoding() {
    val payload = TerajsJsonObject(
      linkedMapOf(
        "text" to TerajsJsonString("hello"),
        "selected" to TerajsJsonBool(true),
        "range" to TerajsJsonObject(
          linkedMapOf(
            "start" to TerajsJsonNumber(1.0),
            "end" to TerajsJsonNumber(4.0)
          )
        )
      )
    )

    val encoded = AndroidWireCodec.encodeNativeEventPacket(
      AndroidNativeEventPacket(nodeId = 9, name = "selectionchange", payload = payload)
    )

    val packet = JSONObject(encoded)

    assertEquals(9, packet.getInt("nodeId"))
    assertEquals("selectionchange", packet.getString("name"))
    assertEquals(payload, packet.get("payload").toTerajsJsonValue("payload"))
  }

  @Test
  fun rejectsMalformedCommandPayloadsPredictably() {
    val nonObjectEntry = assertThrows(IllegalArgumentException::class.java) {
      AndroidWireCodec.decodeCommandBatch("[1]")
    }
    assertEquals("commands[0] must be an object", nonObjectEntry.message)

    val unsupportedType = assertThrows(IllegalArgumentException::class.java) {
      AndroidWireCodec.decodeCommandBatch(
        """
        [
          {
            "type": "unknown-command",
            "nodeId": 1
          }
        ]
        """.trimIndent()
      )
    }
    assertEquals("Unsupported Android host command type: unknown-command", unsupportedType.message)

    val invalidStyleValue = assertThrows(IllegalArgumentException::class.java) {
      AndroidWireCodec.decodeCommandBatch(
        """
        [
          {
            "type": "set-style",
            "nodeId": 1,
            "style": {
              "padding": 8
            }
          }
        ]
        """.trimIndent()
      )
    }
    assertEquals("commands[0].style.padding must be a string", invalidStyleValue.message)
  }

  @Test
  fun transportAppliesDecodedCommandsAndEmitsEncodedEvents() {
    val applied = mutableListOf<List<AndroidHostCommand>>()
    val emitted = mutableListOf<String>()
    val transport = AndroidHostTransport(
      applyCommands = applied::add,
      emitEventPayload = emitted::add
    )

    transport.receiveCommandBatchPayload(
      """
      [
        {
          "type": "create-text",
          "nodeId": 3,
          "value": "hello"
        }
      ]
      """.trimIndent()
    )

    transport.sendNativeEvent(
      nodeId = 3,
      name = "textInput",
      payload = TerajsJsonObject(linkedMapOf("value" to TerajsJsonString("hello")))
    )

    assertEquals(
      listOf(
        listOf(
          AndroidHostCommand(
            type = AndroidHostCommandType.CreateText,
            nodeId = 3,
            value = TerajsJsonString("hello")
          )
        )
      ),
      applied
    )
    assertEquals(
      TerajsJsonObject(linkedMapOf("value" to TerajsJsonString("hello"))),
      JSONObject(emitted.single()).get("payload").toTerajsJsonValue("payload")
    )
  }
}