package dev.terajs.renderer.android

import android.content.Context
import android.view.ViewGroup
import android.widget.Button
import android.widget.Switch
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [35])
class AndroidHostViewUpdatesTest {
  @Test
  fun clearsSwitchCheckedStateWhenCheckedPropIsRemoved() {
    val node = AndroidHostElementNode(
      nodeId = 1,
      viewType = "Switch",
      view = Switch(testContext())
    )

    AndroidHostViewUpdater.applyProp("checked", TerajsJsonBool(true), node)

    assertTrue((node.view as Switch).isChecked)

    AndroidHostViewUpdater.applyProp("checked", null, node)

    assertFalse((node.view as Switch).isChecked)
  }

  @Test
  fun appliesPaddingAxesAndLayoutDimensionsTogether() {
    val node = AndroidHostElementNode(
      nodeId = 2,
      viewType = "Button",
      view = Button(testContext())
    )

    AndroidHostViewUpdater.applyStyles(
      linkedMapOf(
        "paddingHorizontal" to "12",
        "paddingVertical" to "6",
        "layoutWidth" to "match_parent",
        "layoutHeight" to "24"
      ),
      node
    )

    val button = node.view as Button

    assertEquals(12, button.paddingLeft)
    assertEquals(6, button.paddingTop)
    assertEquals(12, button.paddingRight)
    assertEquals(6, button.paddingBottom)
    assertEquals(ViewGroup.LayoutParams.MATCH_PARENT, button.layoutParams.width)
    assertEquals(24, button.layoutParams.height)
  }

  private fun testContext(): Context = ApplicationProvider.getApplicationContext()
}