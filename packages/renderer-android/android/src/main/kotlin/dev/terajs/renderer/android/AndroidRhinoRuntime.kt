package dev.terajs.renderer.android

import org.mozilla.javascript.Context
import org.mozilla.javascript.Function
import org.mozilla.javascript.Scriptable
import org.mozilla.javascript.ScriptableObject
import org.mozilla.javascript.Undefined

class AndroidRhinoHostBridge(
  val runtimeDescriptorPath: String,
  private val readTextAssetImpl: (String) -> String,
  private val emitCommandBatchImpl: (String) -> Unit,
  private val registerNativeEventHandler: (Any?) -> Unit,
) {
  fun readTextAsset(assetPath: String): String {
    return readTextAssetImpl(assetPath)
  }

  fun emitCommandBatch(payload: String) {
    emitCommandBatchImpl(payload)
  }

  fun onNativeEvent(handler: Any?) {
    registerNativeEventHandler(handler)
  }

  fun setNativeEventHandler(handler: Any?) {
    registerNativeEventHandler(handler)
  }
}

class AndroidRhinoRuntime(
  private val hostRuntime: AndroidHostRuntime,
  private val diagnostics: AndroidDiagnosticsSink = AndroidLogcatDiagnosticsSink,
) {
  private var scope: ScriptableObject? = null
  private var nativeEventCallback: Function? = null
  private val hostBridge = AndroidRhinoHostBridge(
    runtimeDescriptorPath = hostRuntime.runtimeDescriptorPath,
    readTextAssetImpl = hostRuntime::readTextAsset,
    emitCommandBatchImpl = hostRuntime::emitCommandBatch,
    registerNativeEventHandler = ::setNativeEventCallback,
  )

  fun start(entryScript: String): Any? {
    hostRuntime.start()
    val context = enterContext()

    return try {
      val scope = context.initStandardObjects()
      ScriptableObject.putProperty(scope, "globalThis", scope)
      this.scope = scope

      context.evaluateString(scope, entryScript, "live-runtime-entry.js", 1, null)

      val runtimeObject = ScriptableObject.getProperty(scope, "__terajsNativeRuntime") as? Scriptable
        ?: throw AndroidHostRuntimeContractError(
          "Android live runtime entry did not define globalThis.__terajsNativeRuntime."
        )
      val startFunction = ScriptableObject.getProperty(runtimeObject, "start") as? Function
        ?: throw AndroidHostRuntimeContractError(
          "Android live runtime entry did not expose start(host)."
        )

      diagnostics.record(
        AndroidDiagnosticEvent(
          area = "engine",
          message = "Evaluating Android live runtime entry",
          details = mapOf(
            "runtimeDescriptorPath" to hostRuntime.runtimeDescriptorPath,
          ),
        )
      )

      val result = startFunction.call(
        context,
        scope,
        runtimeObject,
        arrayOf(Context.javaToJS(hostBridge, scope))
      )

      diagnostics.record(
        AndroidDiagnosticEvent(
          area = "engine",
          message = "Started Android live runtime entry",
          details = mapOf(
            "runtimeDescriptorPath" to hostRuntime.runtimeDescriptorPath,
            "hasRootView" to (hostRuntime.rootView != null),
          ),
        )
      )

      result
    } catch (error: Throwable) {
      diagnostics.record(
        AndroidDiagnosticEvent(
          area = "engine",
          message = "Failed to start Android live runtime entry",
          details = mapOf(
            "runtimeDescriptorPath" to hostRuntime.runtimeDescriptorPath,
            "error" to (error.message ?: error.javaClass.simpleName),
          ),
          level = AndroidDiagnosticLevel.Error,
        )
      )
      throw error
    } finally {
      Context.exit()
    }
  }

  fun shutdown() {
    nativeEventCallback = null
    scope = null
    hostRuntime.shutdown()
    diagnostics.record(
      AndroidDiagnosticEvent(
        area = "engine",
        message = "Stopped Android live runtime entry",
        details = mapOf(
          "runtimeDescriptorPath" to hostRuntime.runtimeDescriptorPath,
        ),
      )
    )
  }

  private fun setNativeEventCallback(handler: Any?) {
    if (handler == null || handler === Undefined.instance) {
      nativeEventCallback = null
      hostRuntime.clearNativeEventHandler()
      return
    }

    val function = handler as? Function
      ?: throw AndroidHostRuntimeContractError(
        "Android live runtime host expected a JavaScript function for native event handling."
      )

    nativeEventCallback = function
    hostRuntime.onNativeEvent(AndroidNativeEventHandler { payload ->
      dispatchNativeEventPayload(payload)
    })
  }

  private fun dispatchNativeEventPayload(payload: String) {
    val function = nativeEventCallback ?: return
    val scope = scope ?: return
    val context = enterContext()

    try {
      function.call(context, scope, scope, arrayOf(payload))
      diagnostics.record(
        AndroidDiagnosticEvent(
          area = "engine",
          message = "Dispatched Android native event into live runtime",
          details = mapOf(
            "runtimeDescriptorPath" to hostRuntime.runtimeDescriptorPath,
          ),
        )
      )
    } finally {
      Context.exit()
    }
  }

  private fun enterContext(): Context {
    return Context.enter().apply {
      optimizationLevel = -1
      languageVersion = Context.VERSION_ES6
    }
  }
}