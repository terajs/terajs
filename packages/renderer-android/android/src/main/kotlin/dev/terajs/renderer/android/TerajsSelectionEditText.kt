package dev.terajs.renderer.android

import android.content.Context
import android.util.AttributeSet
import android.widget.EditText

class TerajsSelectionEditText @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
  defStyleAttr: Int = android.R.attr.editTextStyle,
) : EditText(context, attrs, defStyleAttr) {
  var onSelectionChangedCallback: ((start: Int, end: Int) -> Unit)? = null

  override fun onSelectionChanged(selStart: Int, selEnd: Int) {
    super.onSelectionChanged(selStart, selEnd)
    onSelectionChangedCallback?.invoke(selStart, selEnd)
  }
}