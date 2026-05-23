package dev.terajs.renderer.android

import android.content.Context
import android.widget.Button
import androidx.test.core.app.ApplicationProvider
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [35])
class AndroidHarnessSmokeTest {
  @Test
  fun createsRootViewFromCommandBatchPayload() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val runtime = AndroidHostRuntime(context)

    runtime.receiveCommandBatchPayload(
      """
      [
        {
          "type": "create-element",
          "nodeId": 1,
          "viewType": "Button"
        }
      ]
      """.trimIndent()
    )

    assertNotNull(runtime.rootView)
    assertTrue(runtime.rootView is Button)
  }

  @Test
  fun emitsNativeEventPacketsThroughTransport() {
    val emitted = mutableListOf<String>()
    val transport = AndroidHostTransport(applyCommands = {}, emitEventPayload = emitted::add)

    transport.sendNativeEvent(
      nodeId = 7,
      name = "press",
      payload = TerajsJsonObject(mapOf("source" to TerajsJsonString("native")))
    )

    val payload = JSONObject(emitted.single())
    assertEquals(7, payload.getInt("nodeId"))
    assertEquals("press", payload.getString("name"))
    assertEquals("native", payload.getJSONObject("payload").getString("source"))
  }
}