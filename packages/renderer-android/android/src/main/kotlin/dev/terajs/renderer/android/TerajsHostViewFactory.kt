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

class AndroidHostViewFactory(private val context: Context) {
  fun makeView(viewType: String) = when (viewType) {
    "Button" -> Button(context)
    "EditText" -> TerajsSelectionEditText(context)
    "ImageView" -> ImageView(context)
    "LinearLayout" -> LinearLayout(context).apply { orientation = LinearLayout.VERTICAL }
    "RecyclerView" -> FrameLayout(context)
    "ScrollView" -> ScrollView(context)
    "Spinner" -> Spinner(context)
    "Switch" -> Switch(context)
    "TextView" -> TextView(context)
    "ViewGroup" -> FrameLayout(context)
    else -> FrameLayout(context)
  }
}