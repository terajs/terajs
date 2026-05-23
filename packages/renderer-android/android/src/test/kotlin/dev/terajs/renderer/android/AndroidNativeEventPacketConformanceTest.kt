package dev.terajs.renderer.android

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [35])
class AndroidNativeEventPacketConformanceTest {
  @Test
  fun matchesCommittedNativeEventFixture() {
    val packet = AndroidNativeEventPacket(
      nodeId = 7,
      name = "beforeinput",
      payload = TerajsJsonObject(
        linkedMapOf(
          "inputType" to TerajsJsonString("insertFromPaste"),
          "targetRange" to TerajsJsonArray(
            listOf(
              TerajsJsonNumber(1.0),
              TerajsJsonNumber(3.0)
            )
          ),
          "clipboardData" to TerajsJsonObject(
            linkedMapOf(
              "items" to TerajsJsonArray(
                listOf(
                  TerajsJsonObject(
                    linkedMapOf(
                      "type" to TerajsJsonString("text/plain"),
                      "data" to TerajsJsonString("eta")
                    )
                  )
                )
              )
            )
          ),
          "selection" to TerajsJsonObject(
            linkedMapOf(
              "start" to TerajsJsonNumber(1.0),
              "end" to TerajsJsonNumber(3.0)
            )
          ),
          "composing" to TerajsJsonBool(false)
        )
      )
    )

    assertEquals(
      JSONObject(readResource("kotlin-native-event-packet-conformance.json")).toTerajsJsonValue("packet"),
      JSONObject(AndroidWireCodec.encodeNativeEventPacket(packet)).toTerajsJsonValue("packet")
    )
  }

  private fun readResource(name: String): String {
    return checkNotNull(javaClass.classLoader?.getResourceAsStream(name)) {
      "Missing test resource $name"
    }.bufferedReader().use { reader ->
      reader.readText()
    }
  }
}