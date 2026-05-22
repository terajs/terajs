package dev.terajs.renderer.android

import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.CompoundButton
import android.widget.Switch

internal class AndroidHostEventBinder(
  private val emit: (Int, String, TerajsJsonValue?) -> Unit,
) {
  private val bindings = linkedMapOf<Int, AndroidHostEventBinding>()

  fun bindIfNeeded(node: AndroidHostElementNode) {
    if (bindings.containsKey(node.nodeId)) {
      return
    }

    val binding = when (val view = node.view) {
      is TerajsSelectionEditText -> AndroidTextInputEventBinding(node, view, emit)
      is Switch -> AndroidSwitchEventBinding(node, view, emit)
      else -> AndroidPressEventBinding(node, view, emit)
    }

    bindings[node.nodeId] = binding
  }

  fun remove(nodeId: Int) {
    bindings.remove(nodeId)?.detach()
  }
}

private interface AndroidHostEventBinding {
  fun detach()
}

private class AndroidPressEventBinding(
  private val node: AndroidHostElementNode,
  private val view: View,
  private val emit: (Int, String, TerajsJsonValue?) -> Unit,
) : AndroidHostEventBinding {
  private val listener = View.OnClickListener {
    if (node.subscribedEvents.contains("press")) {
      emit(node.nodeId, "press", TerajsJsonObject(mapOf("source" to TerajsJsonString("native"))))
    }
  }

  init {
    view.setOnClickListener(listener)
  }

  override fun detach() {
    view.setOnClickListener(null)
  }
}

private class AndroidSwitchEventBinding(
  private val node: AndroidHostElementNode,
  private val toggle: Switch,
  private val emit: (Int, String, TerajsJsonValue?) -> Unit,
) : AndroidHostEventBinding {
  private val listener = CompoundButton.OnCheckedChangeListener { _, isChecked ->
    if (node.subscribedEvents.contains("change")) {
      emit(
        node.nodeId,
        "change",
        TerajsJsonObject(
          mapOf(
            "checked" to TerajsJsonBool(isChecked),
            "on" to TerajsJsonBool(isChecked)
          )
        )
      )
    }
  }

  init {
    toggle.setOnCheckedChangeListener(listener)
  }

  override fun detach() {
    toggle.setOnCheckedChangeListener(null)
  }
}

private class AndroidTextInputEventBinding(
  private val node: AndroidHostElementNode,
  private val editText: TerajsSelectionEditText,
  private val emit: (Int, String, TerajsJsonValue?) -> Unit,
) : AndroidHostEventBinding {
  private val watcher = object : TextWatcher {
    override fun beforeTextChanged(text: CharSequence?, start: Int, count: Int, after: Int) = Unit

    override fun onTextChanged(text: CharSequence?, start: Int, before: Int, count: Int) = Unit

    override fun afterTextChanged(text: Editable?) {
      if (node.subscribedEvents.contains("change")) {
        val value = text?.toString().orEmpty()
        emit(
          node.nodeId,
          "textInput",
          TerajsJsonObject(
            mapOf(
              "text" to TerajsJsonString(value),
              "value" to TerajsJsonString(value)
            )
          )
        )
      }
    }
  }

  init {
    editText.addTextChangedListener(watcher)
    editText.onSelectionChangedCallback = { start, end ->
      if (node.subscribedEvents.contains("selectionchange")) {
        emit(
          node.nodeId,
          "selectionchange",
          TerajsJsonObject(
            mapOf(
              "start" to TerajsJsonNumber(start.toDouble()),
              "end" to TerajsJsonNumber(end.toDouble()),
              "selectionStart" to TerajsJsonNumber(start.toDouble()),
              "selectionEnd" to TerajsJsonNumber(end.toDouble()),
              "selection" to TerajsJsonObject(
                mapOf(
                  "start" to TerajsJsonNumber(start.toDouble()),
                  "end" to TerajsJsonNumber(end.toDouble())
                )
              ),
              "selectionRange" to TerajsJsonObject(
                mapOf(
                  "start" to TerajsJsonNumber(start.toDouble()),
                  "end" to TerajsJsonNumber(end.toDouble())
                )
              )
            )
          )
        )
      }
    }
  }

  override fun detach() {
    editText.removeTextChangedListener(watcher)
    editText.onSelectionChangedCallback = null
  }
}