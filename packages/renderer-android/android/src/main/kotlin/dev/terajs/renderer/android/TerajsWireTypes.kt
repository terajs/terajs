package dev.terajs.renderer.android

import org.json.JSONObject

enum class AndroidHostCommandType(val wireName: String) {
  CreateElement("create-element"),
  CreateText("create-text"),
  Insert("insert"),
  Remove("remove"),
  SetText("set-text"),
  SetProp("set-prop"),
  SetStyle("set-style"),
  SetClass("set-class"),
  SubscribeEvent("subscribe-event"),
  UnsubscribeEvent("unsubscribe-event");

  companion object {
    fun fromWireName(value: String): AndroidHostCommandType =
      entries.firstOrNull { it.wireName == value }
        ?: throw IllegalArgumentException("Unsupported Android host command type: $value")
  }
}

data class AndroidHostCommand(
  val type: AndroidHostCommandType,
  val nodeId: Int? = null,
  val parentId: Int? = null,
  val childId: Int? = null,
  val anchorId: Int? = null,
  val viewType: String? = null,
  val svg: Boolean? = null,
  val name: String? = null,
  val value: TerajsJsonValue? = null,
  val style: Map<String, String>? = null,
  val className: String? = null,
)

data class AndroidNativeEventPacket(
  val nodeId: Int,
  val name: String,
  val payload: TerajsJsonValue? = null,
)

internal fun JSONObject.toAndroidHostCommand(path: String): AndroidHostCommand {
  return AndroidHostCommand(
    type = AndroidHostCommandType.fromWireName(requireString("type", path)),
    nodeId = optionalInt("nodeId", path),
    parentId = optionalInt("parentId", path),
    childId = optionalInt("childId", path),
    anchorId = optionalInt("anchorId", path),
    viewType = optionalString("viewType", path),
    svg = optionalBoolean("svg", path),
    name = optionalString("name", path),
    value = optionalJsonValue("value", path),
    style = optionalStringMap("style", path),
    className = optionalString("className", path),
  )
}

internal fun AndroidNativeEventPacket.toJsonObject(): JSONObject {
  return JSONObject().also { objectValue ->
    objectValue.put("nodeId", nodeId)
    objectValue.put("name", name)
    if (payload != null) {
      objectValue.put("payload", payload.toPlatformValue())
    }
  }
}

private fun JSONObject.requireString(key: String, path: String): String {
  if (!has(key) || isNull(key)) {
    throw IllegalArgumentException("$path.$key must be a string")
  }
  return get(key) as? String ?: throw IllegalArgumentException("$path.$key must be a string")
}

private fun JSONObject.optionalString(key: String, path: String): String? {
  if (!has(key) || isNull(key)) {
    return null
  }
  return get(key) as? String ?: throw IllegalArgumentException("$path.$key must be a string")
}

private fun JSONObject.optionalInt(key: String, path: String): Int? {
  if (!has(key) || isNull(key)) {
    return null
  }
  return (get(key) as? Number)?.toInt()
    ?: throw IllegalArgumentException("$path.$key must be a number")
}

private fun JSONObject.optionalBoolean(key: String, path: String): Boolean? {
  if (!has(key) || isNull(key)) {
    return null
  }
  return get(key) as? Boolean ?: throw IllegalArgumentException("$path.$key must be a boolean")
}

private fun JSONObject.optionalJsonValue(key: String, path: String): TerajsJsonValue? {
  if (!has(key)) {
    return null
  }
  return get(key).toTerajsJsonValue("$path.$key")
}

private fun JSONObject.optionalStringMap(key: String, path: String): Map<String, String>? {
  if (!has(key) || isNull(key)) {
    return null
  }
  val value = get(key) as? JSONObject ?: throw IllegalArgumentException("$path.$key must be an object")
  val result = linkedMapOf<String, String>()
  val iterator = value.keys()
  while (iterator.hasNext()) {
    val entryKey = iterator.next()
    result[entryKey] = value.get(entryKey) as? String
      ?: throw IllegalArgumentException("$path.$key.$entryKey must be a string")
  }
  return result
}