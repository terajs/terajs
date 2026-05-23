package dev.terajs.renderer.android

import android.content.Context
import android.widget.Button
import android.widget.Switch
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [35])
class AndroidEventBindingsTest {
  @Test
  fun emitsPressEventsOnlyWhileSubscribed() {
    val emitted = mutableListOf<EmittedEvent>()
    val applier = AndroidCommandApplier(testContext())
    val binder = AndroidHostEventBinder { nodeId, name, payload ->
      emitted.add(EmittedEvent(nodeId = nodeId, name = name, payload = payload))
    }

    val buttonNode = createBoundElement(applier, binder, nodeId = 1, viewType = "Button")
    applier.apply(AndroidHostCommand(type = AndroidHostCommandType.SubscribeEvent, nodeId = 1, name = "press"))

    (buttonNode.view as Button).performClick()

    assertEquals(
      listOf(
        EmittedEvent(
          nodeId = 1,
          name = "press",
          payload = TerajsJsonObject(mapOf("source" to TerajsJsonString("native")))
        )
      ),
      emitted
    )

    applier.apply(AndroidHostCommand(type = AndroidHostCommandType.UnsubscribeEvent, nodeId = 1, name = "press"))
    (buttonNode.view as Button).performClick()

    assertEquals(1, emitted.size)
  }

  @Test
  fun emitsSwitchChangePayloads() {
    val emitted = mutableListOf<EmittedEvent>()
    val applier = AndroidCommandApplier(testContext())
    val binder = AndroidHostEventBinder { nodeId, name, payload ->
      emitted.add(EmittedEvent(nodeId = nodeId, name = name, payload = payload))
    }

    val switchNode = createBoundElement(applier, binder, nodeId = 7, viewType = "Switch")
    applier.apply(AndroidHostCommand(type = AndroidHostCommandType.SubscribeEvent, nodeId = 7, name = "change"))

    (switchNode.view as Switch).performClick()

    assertEquals(
      listOf(
        EmittedEvent(
          nodeId = 7,
          name = "change",
          payload = TerajsJsonObject(
            mapOf(
              "checked" to TerajsJsonBool(true),
              "on" to TerajsJsonBool(true)
            )
          )
        )
      ),
      emitted
    )
  }

  @Test
  fun emitsTextInputAndSelectionPayloadsForEditText() {
    val emitted = mutableListOf<EmittedEvent>()
    val applier = AndroidCommandApplier(testContext())
    val binder = AndroidHostEventBinder { nodeId, name, payload ->
      emitted.add(EmittedEvent(nodeId = nodeId, name = name, payload = payload))
    }

    val inputNode = createBoundElement(applier, binder, nodeId = 11, viewType = "EditText")
    val editText = inputNode.view as TerajsSelectionEditText
    applier.apply(AndroidHostCommand(type = AndroidHostCommandType.SubscribeEvent, nodeId = 11, name = "change"))
    applier.apply(AndroidHostCommand(type = AndroidHostCommandType.SubscribeEvent, nodeId = 11, name = "selectionchange"))

    editText.setText("hello")

    assertTrue(emitted.any { event ->
      event == EmittedEvent(
        nodeId = 11,
        name = "textInput",
        payload = TerajsJsonObject(
          mapOf(
            "text" to TerajsJsonString("hello"),
            "value" to TerajsJsonString("hello")
          )
        )
      )
    })

    emitted.clear()
    editText.setSelection(1, 4)

    assertEquals(
      listOf(
        EmittedEvent(
          nodeId = 11,
          name = "selectionchange",
          payload = TerajsJsonObject(
            mapOf(
              "start" to TerajsJsonNumber(1.0),
              "end" to TerajsJsonNumber(4.0),
              "selectionStart" to TerajsJsonNumber(1.0),
              "selectionEnd" to TerajsJsonNumber(4.0),
              "selection" to TerajsJsonObject(
                mapOf(
                  "start" to TerajsJsonNumber(1.0),
                  "end" to TerajsJsonNumber(4.0)
                )
              ),
              "selectionRange" to TerajsJsonObject(
                mapOf(
                  "start" to TerajsJsonNumber(1.0),
                  "end" to TerajsJsonNumber(4.0)
                )
              )
            )
          )
        )
      ),
      emitted
    )
  }

  private fun createBoundElement(
    applier: AndroidCommandApplier,
    binder: AndroidHostEventBinder,
    nodeId: Int,
    viewType: String,
  ): AndroidHostElementNode {
    applier.apply(AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = nodeId, viewType = viewType))
    return (applier.node(nodeId) as? AndroidHostElementNode)?.also(binder::bindIfNeeded)
      ?: throw AssertionError("Missing Android host element node $nodeId")
  }

  private fun testContext(): Context = ApplicationProvider.getApplicationContext()

  private data class EmittedEvent(
    val nodeId: Int,
    val name: String,
    val payload: TerajsJsonValue?,
  )
}