package dev.terajs.renderer.android

import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Switch
import android.widget.TextView

internal object AndroidHostViewUpdater {
  fun applyProp(name: String, value: TerajsJsonValue?, node: AndroidHostElementNode) {
    when (name) {
      "contentDescription" -> node.view.contentDescription = value.stringValue
      "text" -> applyText(value.stringValue, node.view)
      "hint" -> if (node.view is EditText) {
        node.view.hint = value.stringValue
      }
      "checked" -> {
        val checked = value.boolValue
        if (node.view is Switch && checked != null) {
          node.view.isChecked = checked
        }
      }
    }
  }

  fun applyStyles(styles: Map<String, String>, node: AndroidHostElementNode) {
    styles.forEach { (name, value) ->
      when (name) {
        "backgroundColor" -> parseColor(value)?.let { color ->
          val background = ensureBackground(node.view)
          background.setColor(color)
          node.view.background = background
        }
        "textColor" -> parseColor(value)?.let { color ->
          applyTextColor(color, node.view)
        }
        "cornerRadius" -> parseDimension(value)?.let { radius ->
          val background = ensureBackground(node.view)
          background.cornerRadius = radius.toFloat()
          node.view.background = background
        }
        "textSize" -> parseFloat(value)?.let { size ->
          if (node.view is TextView) {
            node.view.setTextSize(TypedValue.COMPLEX_UNIT_SP, size)
          }
        }
        "orientation" -> if (node.view is LinearLayout) {
          node.view.orientation = if (value == "horizontal") LinearLayout.HORIZONTAL else LinearLayout.VERTICAL
        }
        "gravity" -> if (node.view is LinearLayout) {
          node.view.gravity = gravity(value)
        }
        "layoutGravity" -> {
          val layoutParams = node.view.layoutParams
          if (layoutParams is LinearLayout.LayoutParams) {
            layoutParams.gravity = gravity(value)
            node.view.layoutParams = layoutParams
          }
        }
        "padding" -> parseDimension(value)?.let { inset ->
          node.view.setPadding(inset, inset, inset, inset)
        }
        "paddingHorizontal" -> parseDimension(value)?.let { inset ->
          node.view.setPadding(inset, node.view.paddingTop, inset, node.view.paddingBottom)
        }
        "paddingVertical" -> parseDimension(value)?.let { inset ->
          node.view.setPadding(node.view.paddingLeft, inset, node.view.paddingRight, inset)
        }
        "layoutWidth" -> updateLayoutParams(node.view, width = dimensionOrLayout(value), height = null)
        "layoutHeight" -> updateLayoutParams(node.view, width = null, height = dimensionOrLayout(value))
      }
    }
  }

  fun applyClassName(className: String?, node: AndroidHostElementNode) {
    node.view.tag = className
  }

  fun syncTextChildren(node: AndroidHostElementNode, allNodes: Map<Int, AndroidHostNode>) {
    if (!supportsText(node.view)) {
      return
    }

    val text = node.childNodeIds.mapNotNull { childId ->
      (allNodes[childId] as? AndroidHostTextNode)?.value
    }.joinToString(separator = "")

    applyText(text.ifEmpty { null }, node.view)
  }

  private fun applyText(text: String?, view: View) {
    when (view) {
      is Button -> view.text = text
      is EditText -> view.setText(text)
      is TextView -> view.text = text
    }
  }

  private fun applyTextColor(color: Int, view: View) {
    when (view) {
      is Button -> view.setTextColor(color)
      is EditText -> view.setTextColor(color)
      is TextView -> view.setTextColor(color)
    }
  }

  private fun supportsText(view: View): Boolean {
    return view is Button || view is EditText || view is TextView
  }

  private fun ensureBackground(view: View): GradientDrawable {
    return (view.background as? GradientDrawable) ?: GradientDrawable().apply {
      setColor(Color.TRANSPARENT)
    }
  }

  private fun parseColor(value: String): Int? {
    return runCatching { Color.parseColor(value) }.getOrNull()
  }

  private fun parseDimension(value: String): Int? {
    return value.toFloatOrNull()?.toInt()
  }

  private fun parseFloat(value: String): Float? {
    return value.toFloatOrNull()
  }

  private fun dimensionOrLayout(value: String): Int? {
    return when (value) {
      "fill", "match", "match_parent" -> ViewGroup.LayoutParams.MATCH_PARENT
      "wrap", "wrap_content" -> ViewGroup.LayoutParams.WRAP_CONTENT
      else -> parseDimension(value)
    }
  }

  private fun gravity(value: String): Int {
    return when (value) {
      "center" -> Gravity.CENTER
      "end" -> Gravity.END or Gravity.CENTER_VERTICAL
      else -> Gravity.START or Gravity.CENTER_VERTICAL
    }
  }

  private fun updateLayoutParams(view: View, width: Int?, height: Int?) {
    val current = view.layoutParams ?: ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.WRAP_CONTENT,
      ViewGroup.LayoutParams.WRAP_CONTENT
    )
    view.layoutParams = current.apply {
      if (width != null) {
        this.width = width
      }
      if (height != null) {
        this.height = height
      }
    }
  }
}