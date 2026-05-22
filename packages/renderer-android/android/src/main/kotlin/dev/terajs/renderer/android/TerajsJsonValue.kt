package dev.terajs.renderer.android

import org.json.JSONArray
import org.json.JSONObject

sealed interface TerajsJsonValue

object TerajsJsonNull : TerajsJsonValue

data class TerajsJsonBool(val value: Boolean) : TerajsJsonValue

data class TerajsJsonNumber(val value: Double) : TerajsJsonValue

data class TerajsJsonString(val value: String) : TerajsJsonValue

data class TerajsJsonArray(val value: List<TerajsJsonValue>) : TerajsJsonValue

data class TerajsJsonObject(val value: Map<String, TerajsJsonValue>) : TerajsJsonValue

internal fun Any?.toTerajsJsonValue(path: String): TerajsJsonValue = when (this) {
  null, JSONObject.NULL -> TerajsJsonNull
  is Boolean -> TerajsJsonBool(this)
  is Number -> TerajsJsonNumber(this.toDouble())
  is String -> TerajsJsonString(this)
  is JSONArray -> TerajsJsonArray((0 until length()).map { index -> get(index).toTerajsJsonValue("$path[$index]") })
  is JSONObject -> {
    val entries = linkedMapOf<String, TerajsJsonValue>()
    val iterator = keys()
    while (iterator.hasNext()) {
      val key = iterator.next()
      entries[key] = get(key).toTerajsJsonValue("$path.$key")
    }
    TerajsJsonObject(entries)
  }
  else -> throw IllegalArgumentException("$path must be JSON-safe")
}

internal fun TerajsJsonValue.toPlatformValue(): Any = when (this) {
  TerajsJsonNull -> JSONObject.NULL
  is TerajsJsonBool -> value
  is TerajsJsonNumber -> value
  is TerajsJsonString -> value
  is TerajsJsonArray -> JSONArray().also { array ->
    value.forEach { item -> array.put(item.toPlatformValue()) }
  }
  is TerajsJsonObject -> JSONObject().also { objectValue ->
    value.forEach { (key, item) -> objectValue.put(key, item.toPlatformValue()) }
  }
}