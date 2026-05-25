package dev.terajs.renderer.android

import android.view.View
import android.widget.TextView

sealed interface AndroidHostNode {
  val nodeId: Int
  var parentId: Int?
}

data class AndroidHostElementNode(
  override val nodeId: Int,
  val viewType: String,
  val view: View,
  override var parentId: Int? = null,
  val childNodeIds: MutableList<Int> = mutableListOf(),
  val props: MutableMap<String, TerajsJsonValue> = linkedMapOf(),
  val styles: MutableMap<String, String> = linkedMapOf(),
  var className: String? = null,
  val subscribedEvents: MutableSet<String> = linkedSetOf()
) : AndroidHostNode

data class AndroidHostTextNode(
  override val nodeId: Int,
  var value: String,
  val view: TextView,
  override var parentId: Int? = null
) : AndroidHostNode