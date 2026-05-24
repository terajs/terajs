package dev.terajs.renderer.android

import android.content.Context
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Spinner
import android.widget.Switch
import android.widget.TextView
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [35])
class AndroidHostViewFactoryTest {
  @Test
  fun createsExpectedNativeViewsForSupportedTypes() {
    val factory = AndroidHostViewFactory(testContext())

    assertTrue(factory.makeView("Button") is Button)
    assertTrue(factory.makeView("EditText") is TerajsSelectionEditText)
    assertTrue(factory.makeView("ImageView") is ImageView)

    val layout = factory.makeView("LinearLayout") as? LinearLayout
      ?: throw AssertionError("Expected LinearLayout")
    assertTrue(layout.orientation == LinearLayout.VERTICAL)

    assertTrue(factory.makeView("RecyclerView") is FrameLayout)
    assertTrue(factory.makeView("ScrollView") is ScrollView)
    assertTrue(factory.makeView("Spinner") is Spinner)
    assertTrue(factory.makeView("Switch") is Switch)
    assertTrue(factory.makeView("TextView") is TextView)
    assertTrue(factory.makeView("ViewGroup") is FrameLayout)
  }

  @Test
  fun fallsBackToFrameLayoutForUnknownViewTypes() {
    val factory = AndroidHostViewFactory(testContext())

    assertTrue(factory.makeView("UnknownNativeView") is FrameLayout)
  }

  private fun testContext(): Context = ApplicationProvider.getApplicationContext()
}