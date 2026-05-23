package dev.terajs.renderer.android

import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [35])
class AndroidCommandBatchConformanceTest {
  @Test
  fun decodesTypeScriptCommandBatchFixture() {
    val commands = AndroidWireCodec.decodeCommandBatch(readResource("ts-command-batch-conformance.json"))

    assertEquals(
      listOf(
        AndroidHostCommand(
          type = AndroidHostCommandType.CreateElement,
          nodeId = 1,
          viewType = "LinearLayout",
          svg = false
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.CreateElement,
          nodeId = 2,
          viewType = "Button",
          svg = false
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.CreateText,
          nodeId = 3,
          value = TerajsJsonString("Tap")
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.CreateElement,
          nodeId = 4,
          viewType = "TextView",
          svg = false
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.Insert,
          parentId = 1,
          childId = 2,
          anchorId = null
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.Insert,
          parentId = 1,
          childId = 4,
          anchorId = 2
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.Insert,
          parentId = 2,
          childId = 3,
          anchorId = null
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.SetText,
          nodeId = 3,
          value = TerajsJsonString("Tap me")
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.SetProp,
          nodeId = 2,
          name = "contentDescription",
          value = TerajsJsonObject(
            linkedMapOf(
              "enabled" to TerajsJsonBool(true),
              "count" to TerajsJsonNumber(2.0),
              "range" to TerajsJsonObject(
                linkedMapOf(
                  "start" to TerajsJsonNumber(1.0),
                  "end" to TerajsJsonNumber(3.0)
                )
              ),
              "tags" to TerajsJsonArray(listOf(TerajsJsonString("native"), TerajsJsonNull))
            )
          )
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.SetProp,
          nodeId = 4,
          name = "hint",
          value = TerajsJsonNull
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.SetStyle,
          nodeId = 2,
          style = linkedMapOf(
            "textColor" to "#1E88E5",
            "padding" to "8",
            "layoutWidth" to "match_parent"
          )
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.SetClass,
          nodeId = 2,
          className = "primary-action"
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.SubscribeEvent,
          nodeId = 2,
          name = "press"
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.UnsubscribeEvent,
          nodeId = 2,
          name = "press"
        ),
        AndroidHostCommand(
          type = AndroidHostCommandType.Remove,
          nodeId = 4
        )
      ),
      commands
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