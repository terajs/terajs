package dev.terajs.renderer.android

fun interface AndroidRuntimeAssetReader {
  fun readTextAsset(assetPath: String): String
}

fun interface AndroidNativeEventHandler {
  fun handle(payload: String)
}

class AndroidHostRuntimeContractError(message: String) : IllegalStateException(message)

data class AndroidHostRuntimeDiagnosticsSnapshot(
  val runtimeDescriptorPath: String,
  val hasStarted: Boolean,
  val hasRootView: Boolean,
  val hasNativeEventHandler: Boolean,
)