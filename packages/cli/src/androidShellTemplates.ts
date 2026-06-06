export function createAndroidMainActivity(namespace: string): string {
  return `package ${namespace}

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.View
import android.widget.ScrollView
import android.widget.TextView
import dev.terajs.renderer.android.AndroidRhinoRuntime
import dev.terajs.renderer.android.AndroidHostRuntime
import dev.terajs.renderer.android.AndroidRuntimeAssetReader
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.statusBarColor = Color.parseColor("#07111f")
    window.navigationBarColor = Color.parseColor("#07111f")

    val content = runCatching { createBootstrapView() }
      .getOrElse { error ->
        createStatusView(
          """
          Terajs Android shell

          Failed to read synced Terajs assets.
          ${"${"}error.message ?: error.javaClass.simpleName}

          Re-run tera build --target android and assemble again.
          """.trimIndent()
        )
      }

    setContentView(content)
  }

  private fun createBootstrapView(): View {
    val hostManifest = readAssetJson("terajs/hosts/android/terajs-host.json")
    val runtimeDescriptorAssetPath = resolveRuntimeDescriptorAssetPath(hostManifest)
    val runtimeEntryAssetPath = resolveRuntimeEntryAssetPath(hostManifest)
    ensureLiveRuntimeAssets(hostManifest)
    val bootstrapAssetPath = resolveBootstrapAssetPath(hostManifest)
    val commandBatchPayload = readAssetText(bootstrapAssetPath)
    val liveRuntimeEntrySource = readAssetText(runtimeEntryAssetPath)

    val runtime = AndroidHostRuntime(
      context = this,
      runtimeDescriptorPath = runtimeDescriptorAssetPath,
      readTextAssetImpl = AndroidRuntimeAssetReader { assetPath ->
        readAssetText(assetPath)
      }
    )
    val liveRuntime = AndroidRhinoRuntime(runtime)
    val liveRuntimeError = runCatching {
      liveRuntime.start(liveRuntimeEntrySource)
    }.exceptionOrNull()

    if (runtime.rootView == null) {
      runtime.receiveCommandBatchPayload(commandBatchPayload)
    }

    val failureSummary = if (liveRuntimeError != null) {
      buildString {
        append("Live runtime failure: ")
        append(liveRuntimeError.message ?: liveRuntimeError.javaClass.simpleName)
        appendLine()
        appendLine()
      }
    } else {
      ""
    }
    val statusMessage = buildString {
      appendLine("Terajs Android shell")
      appendLine()
      append(failureSummary)
      appendLine("The live runtime and bootstrap fallback did not produce a root view.")
      append("Check ${"$"}runtimeEntryAssetPath, ${"$"}bootstrapAssetPath, and re-run tera build --target android.")
    }

    return runtime.rootView?.let { rootView -> wrapScrollableRoot(rootView) } ?: createStatusView(statusMessage)
  }

  private fun wrapScrollableRoot(rootView: View): View {
    if (rootView is ScrollView) {
      return rootView
    }

    return ScrollView(this).apply {
      clipToPadding = true
      setBackgroundColor(Color.parseColor("#07111f"))
      setPadding(0, systemTopInsetFallback(), 0, systemBottomInsetFallback())
      addView(rootView)
    }
  }

  private fun systemTopInsetFallback(): Int {
    return (40 * resources.displayMetrics.density).toInt()
  }

  private fun systemBottomInsetFallback(): Int {
    return (16 * resources.displayMetrics.density).toInt()
  }

  private fun ensureLiveRuntimeAssets(hostManifest: JSONObject) {
    val runtimeDescriptorAssetPath = resolveRuntimeDescriptorAssetPath(hostManifest)
    val runtimeDescriptor = readAssetJson(runtimeDescriptorAssetPath)
    val generatedManifestAssetPath = resolveAssetPath(
      runtimeDescriptorAssetPath,
      runtimeDescriptor.optString("generatedManifestFile").takeIf { it.isNotBlank() }
        ?: "../terajs-target.json"
    )
    val routesAssetPath = resolveAssetPath(
      runtimeDescriptorAssetPath,
      runtimeDescriptor.optString("routesFile").takeIf { it.isNotBlank() }
        ?: "../routes.json"
    )
    val runtimeEntryAssetPath = resolveRuntimeEntryAssetPath(hostManifest)

    readAssetJson(generatedManifestAssetPath)
    readAssetArray(routesAssetPath)
    readAssetText(runtimeEntryAssetPath)
  }

  private fun resolveRuntimeEntryAssetPath(hostManifest: JSONObject): String {
    val runtimeDescriptorAssetPath = resolveRuntimeDescriptorAssetPath(hostManifest)
    val runtimeDescriptor = readAssetJson(runtimeDescriptorAssetPath)
    val relativePath = runtimeDescriptor.optString("entryScriptFile")
      .takeIf { it.isNotBlank() }
      ?: "live-runtime-entry.js"

    return resolveAssetPath(runtimeDescriptorAssetPath, relativePath)
  }

  private fun resolveBootstrapAssetPath(hostManifest: JSONObject): String {
    val relativePath = hostManifest.optJSONObject("bootstrap")
      ?.optString("initialCommandBatchFile")
      ?.takeIf { it.isNotBlank() }
      ?: "../../generated/android/bootstrap/root-command-batch.json"

    return resolveAssetPath("terajs/hosts/android/terajs-host.json", relativePath)
  }

  private fun resolveRuntimeDescriptorAssetPath(hostManifest: JSONObject): String {
    val relativePath = hostManifest.optJSONObject("runtime")
      ?.optString("descriptorFile")
      ?.takeIf { it.isNotBlank() }
      ?: "../../generated/android/runtime/generated-route-runtime.json"

    return resolveAssetPath("terajs/hosts/android/terajs-host.json", relativePath)
  }

  private fun resolveAssetPath(baseAssetPath: String, relativePath: String): String {
    val baseSegments = baseAssetPath.split('/').dropLast(1).toMutableList()

    for (segment in relativePath.split('/')) {
      when (segment) {
        "", "." -> Unit
        ".." -> if (baseSegments.isNotEmpty()) {
          baseSegments.removeAt(baseSegments.lastIndex)
        }
        else -> baseSegments.add(segment)
      }
    }

    return baseSegments.joinToString("/")
  }

  private fun createStatusView(message: String): View {
    val content = TextView(this).apply {
      text = message
      typeface = Typeface.MONOSPACE
      textSize = 14f
      setPadding(48, 48, 48, 48)
    }

    return ScrollView(this).apply {
      addView(content)
    }
  }

  private fun readAssetText(assetPath: String): String {
    return assets.open(assetPath).bufferedReader().use { reader ->
      reader.readText()
    }
  }

  private fun readAssetJson(assetPath: String): JSONObject {
    return JSONObject(readAssetText(assetPath))
  }

  private fun readAssetArray(assetPath: String): JSONArray {
    return JSONArray(readAssetText(assetPath))
  }
}
`;
}
