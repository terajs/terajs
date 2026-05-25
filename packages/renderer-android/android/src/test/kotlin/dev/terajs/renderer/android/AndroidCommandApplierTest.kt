package dev.terajs.renderer.android

import android.content.Context
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.Switch
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [35])
class AndroidCommandApplierTest {
  @Test
  fun createsNodesAndPreservesInsertionOrder() {
    val applier = AndroidCommandApplier(testContext())

    applier.applyCommands(
      listOf(
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 1, viewType = "LinearLayout"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 2, viewType = "Button"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 4, viewType = "Button"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateText, nodeId = 3, value = TerajsJsonString("Ready")),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 1, childId = 2),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 1, childId = 4, anchorId = 2),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 2, childId = 3)
      )
    )

    val root = applier.root ?: throw AssertionError("Expected root node")
    val rootNode = applier.node(1) as? AndroidHostElementNode ?: throw AssertionError("Missing root element")
    val primaryButton = applier.node(2) as? AndroidHostElementNode ?: throw AssertionError("Missing primary button")
    val anchoredButton = applier.node(4) as? AndroidHostElementNode ?: throw AssertionError("Missing anchored button")

    assertSame(rootNode, root)
    assertEquals(listOf(4, 2), rootNode.childNodeIds)
    assertEquals(1, primaryButton.parentId)
    assertEquals(1, anchoredButton.parentId)
    assertSame(rootNode.view, primaryButton.view.parent)
    assertSame(rootNode.view, anchoredButton.view.parent)

    val rootView = rootNode.view as LinearLayout
    assertEquals(0, rootView.indexOfChild(anchoredButton.view))
    assertEquals(1, rootView.indexOfChild(primaryButton.view))
    assertEquals("Ready", (primaryButton.view as Button).text.toString())
  }

  @Test
  fun appliesMutationCommandsToNativeViews() {
    val applier = AndroidCommandApplier(testContext())

    applier.applyCommands(
      listOf(
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 1, viewType = "LinearLayout"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 2, viewType = "Button"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateText, nodeId = 3, value = TerajsJsonString("Before")),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 1, childId = 2),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 2, childId = 3),
        AndroidHostCommand(type = AndroidHostCommandType.SetText, nodeId = 3, value = TerajsJsonString("After")),
        AndroidHostCommand(type = AndroidHostCommandType.SetProp, nodeId = 2, name = "contentDescription", value = TerajsJsonString("primary-action")),
        AndroidHostCommand(type = AndroidHostCommandType.SetStyle, nodeId = 1, style = mapOf(
          "orientation" to "horizontal",
          "padding" to "8",
          "layoutWidth" to "match_parent"
        )),
        AndroidHostCommand(type = AndroidHostCommandType.SetClass, nodeId = 1, className = "root-shell")
      )
    )

    val rootNode = applier.node(1) as? AndroidHostElementNode ?: throw AssertionError("Missing root element")
    val buttonNode = applier.node(2) as? AndroidHostElementNode ?: throw AssertionError("Missing button element")
    val rootView = rootNode.view as LinearLayout
    val buttonView = buttonNode.view as Button

    assertEquals(LinearLayout.HORIZONTAL, rootView.orientation)
    assertEquals(8, rootView.paddingLeft)
    assertEquals(ViewGroup.LayoutParams.MATCH_PARENT, rootView.layoutParams.width)
    assertEquals("root-shell", rootView.tag)
    assertEquals("primary-action", buttonView.contentDescription)
    assertEquals("After", buttonView.text.toString())
  }

  @Test
  fun flattensNestedTextDescendantsIntoNativeButtonLabels() {
    val applier = AndroidCommandApplier(testContext())

    applier.applyCommands(
      listOf(
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 1, viewType = "LinearLayout"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 2, viewType = "Button"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 3, viewType = "TextView"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateText, nodeId = 4, value = TerajsJsonString("Alpha")),
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 5, viewType = "TextView"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateText, nodeId = 6, value = TerajsJsonString("Beta")),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 1, childId = 2),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 2, childId = 3),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 3, childId = 4),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 2, childId = 5),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 5, childId = 6)
      )
    )

    val buttonNode = applier.node(2) as? AndroidHostElementNode ?: throw AssertionError("Missing button element")
    val buttonView = buttonNode.view as Button

    assertEquals("Alpha Beta", buttonView.text.toString())

    applier.apply(AndroidHostCommand(type = AndroidHostCommandType.SetText, nodeId = 6, value = TerajsJsonString("Gamma")))

    assertEquals("Alpha Gamma", buttonView.text.toString())
  }

  @Test
  fun clearsBooleanPropsWhenRemovedFromNativeViews() {
    val applier = AndroidCommandApplier(testContext())

    applier.applyCommands(
      listOf(
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 1, viewType = "Switch"),
        AndroidHostCommand(type = AndroidHostCommandType.SetProp, nodeId = 1, name = "checked", value = TerajsJsonBool(true)),
        AndroidHostCommand(type = AndroidHostCommandType.SetProp, nodeId = 1, name = "checked", value = TerajsJsonNull)
      )
    )

    val switchNode = applier.node(1) as? AndroidHostElementNode ?: throw AssertionError("Missing switch element")
    assertEquals(false, (switchNode.view as Switch).isChecked)
  }

  @Test
  fun removesSubtreesAndClearsRootOwnership() {
    val applier = AndroidCommandApplier(testContext())

    applier.applyCommands(
      listOf(
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 1, viewType = "LinearLayout"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 2, viewType = "Button"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateText, nodeId = 3, value = TerajsJsonString("Nested")),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 1, childId = 2),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 2, childId = 3)
      )
    )

    applier.apply(AndroidHostCommand(type = AndroidHostCommandType.Remove, nodeId = 2))

    val rootNode = applier.node(1) as? AndroidHostElementNode ?: throw AssertionError("Missing root element")
    assertTrue(rootNode.childNodeIds.isEmpty())
    assertNull(applier.node(2))
    assertNull(applier.node(3))

    applier.apply(AndroidHostCommand(type = AndroidHostCommandType.Remove, nodeId = 1))

    assertNull(applier.root)
    assertNull(applier.node(1))
  }

  @Test
  fun reparentsTextNodesAndResyncsNativeTextOwners() {
    val applier = AndroidCommandApplier(testContext())

    applier.applyCommands(
      listOf(
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 1, viewType = "LinearLayout"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 2, viewType = "Button"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 3, viewType = "Button"),
        AndroidHostCommand(type = AndroidHostCommandType.CreateText, nodeId = 4, value = TerajsJsonString("Ready")),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 1, childId = 2),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 1, childId = 3),
        AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 2, childId = 4)
      )
    )

    val firstButtonNode = applier.node(2) as? AndroidHostElementNode ?: throw AssertionError("Missing first button")
    val secondButtonNode = applier.node(3) as? AndroidHostElementNode ?: throw AssertionError("Missing second button")
    val textNode = applier.node(4) as? AndroidHostTextNode ?: throw AssertionError("Missing text node")

    assertEquals("Ready", (firstButtonNode.view as Button).text.toString())
    assertEquals("", (secondButtonNode.view as Button).text.toString())

    applier.apply(
      AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 3, childId = 4)
    )

    assertEquals(3, textNode.parentId)
    assertTrue(firstButtonNode.childNodeIds.isEmpty())
    assertEquals(listOf(4), secondButtonNode.childNodeIds)
    assertEquals("", (firstButtonNode.view as Button).text.toString())
    assertEquals("Ready", (secondButtonNode.view as Button).text.toString())
  }

  @Test
  fun throwsForDuplicateAndMissingNodes() {
    val applier = AndroidCommandApplier(testContext())

    applier.apply(AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 1, viewType = "LinearLayout"))

    val duplicate = assertThrows(IllegalArgumentException::class.java) {
      applier.apply(AndroidHostCommand(type = AndroidHostCommandType.CreateElement, nodeId = 1, viewType = "Button"))
    }
    assertEquals("Duplicate Android host node 1", duplicate.message)

    val missingParent = assertThrows(AndroidHostApplyException::class.java) {
      applier.apply(AndroidHostCommand(type = AndroidHostCommandType.Insert, parentId = 99, childId = 1))
    }
    assertEquals("Missing Android host node 99", missingParent.message)

    val missingValue = assertThrows(AndroidHostApplyException::class.java) {
      applier.apply(AndroidHostCommand(type = AndroidHostCommandType.CreateText, nodeId = 5))
    }
    assertEquals("CreateText requires string value", missingValue.message)
  }

  private fun testContext(): Context = ApplicationProvider.getApplicationContext()
}