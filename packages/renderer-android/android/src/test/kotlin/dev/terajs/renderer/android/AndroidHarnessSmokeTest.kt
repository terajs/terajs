package dev.terajs.renderer.android

import android.content.Context
import android.widget.Button
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertNull
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

  @Test
  fun detachesEventBindingsWhenRemovedNodesAreClickedLater() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val emitted = mutableListOf<String>()
    val runtime = AndroidHostRuntime(context, emitEventPayload = emitted::add)

    runtime.receiveCommandBatchPayload(
      """
      [
        {
          "type": "create-element",
          "nodeId": 1,
          "viewType": "Button"
        },
        {
          "type": "subscribe-event",
          "nodeId": 1,
          "name": "press"
        }
      ]
      """.trimIndent()
    )

    val button = runtime.rootView as? Button ?: throw AssertionError("Expected Android button root view")
    button.performClick()

    assertEquals(1, emitted.size)

    emitted.clear()
    runtime.receiveCommandBatchPayload(
      """
      [
        {
          "type": "remove",
          "nodeId": 1
        }
      ]
      """.trimIndent()
    )

    assertNull(runtime.rootView)

    button.performClick()

    assertTrue(emitted.isEmpty())
  }

  @Test
  fun detachesChildEventBindingsWhenRemovingAParentSubtree() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val emitted = mutableListOf<String>()
    val runtime = AndroidHostRuntime(context, emitEventPayload = emitted::add)

    runtime.receiveCommandBatchPayload(
      """
      [
        {
          "type": "create-element",
          "nodeId": 1,
          "viewType": "LinearLayout"
        },
        {
          "type": "create-element",
          "nodeId": 2,
          "viewType": "Button"
        },
        {
          "type": "insert",
          "parentId": 1,
          "childId": 2
        },
        {
          "type": "subscribe-event",
          "nodeId": 2,
          "name": "press"
        }
      ]
      """.trimIndent()
    )

    val root = runtime.rootView as? android.widget.LinearLayout
      ?: throw AssertionError("Expected Android layout root view")
    val childButton = root.getChildAt(0) as? Button
      ?: throw AssertionError("Expected child Android button view")

    childButton.performClick()

    assertEquals(1, emitted.size)

    emitted.clear()
    runtime.receiveCommandBatchPayload(
      """
      [
        {
          "type": "remove",
          "nodeId": 1
        }
      ]
      """.trimIndent()
    )

    assertNull(runtime.rootView)

    childButton.performClick()

    assertTrue(emitted.isEmpty())
  }

  @Test
  fun recordsBridgeAndRuntimeDiagnosticsThroughPackageLocalSink() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val diagnostics = mutableListOf<AndroidDiagnosticEvent>()
    val runtime = AndroidHostRuntime(
      context = context,
      diagnostics = AndroidDiagnosticsSink { event ->
        diagnostics.add(event)
      }
    )

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
    runtime.sendNativeEvent(
      nodeId = 1,
      name = "press",
      payload = TerajsJsonObject(mapOf("source" to TerajsJsonString("native")))
    )

    assertTrue(
      diagnostics.any { event ->
        event.area == "bridge"
          && event.message == "Received command batch"
          && event.details["commandCount"] == 1
      }
    )
    assertTrue(
      diagnostics.any { event ->
        event.area == "runtime"
          && event.message == "Applied command batch"
          && event.details["commandCount"] == 1
          && event.details["rootViewType"] == "Button"
      }
    )
    assertTrue(
      diagnostics.any { event ->
        event.area == "bridge"
          && event.message == "Sent native event"
          && event.details["nodeId"] == 1
          && event.details["name"] == "press"
      }
    )
  }
}