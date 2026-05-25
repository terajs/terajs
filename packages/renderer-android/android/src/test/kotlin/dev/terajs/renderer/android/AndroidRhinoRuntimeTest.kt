package dev.terajs.renderer.android

import android.content.Context
import android.widget.Button
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [35])
class AndroidRhinoRuntimeTest {
  @Test
  fun startsLiveRuntimeEntryAndAppliesCommandBatchesFromNativeEvents() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val diagnostics = mutableListOf<AndroidDiagnosticEvent>()
    val emitted = mutableListOf<String>()
    val hostRuntime = AndroidHostRuntime(
      context = context,
      runtimeDescriptorPath = ".terajs/generated/android/runtime/generated-route-runtime.json",
      readTextAssetImpl = AndroidRuntimeAssetReader { assetPath ->
        when (assetPath) {
          ".terajs/generated/android/runtime/generated-route-runtime.json" -> "{\"kind\":\"generated-route-runtime\"}"
          else -> throw AssertionError("Unexpected asset path: $assetPath")
        }
      },
      emitEventPayload = emitted::add,
      diagnosticsSink = AndroidDiagnosticsSink { event ->
        diagnostics.add(event)
      }
    )
    val engine = AndroidRhinoRuntime(
      hostRuntime = hostRuntime,
      diagnostics = AndroidDiagnosticsSink { event ->
        diagnostics.add(event)
      }
    )

    engine.start(
      """
      (function () {
        const runtime = {
          start(host) {
            const descriptor = host.readTextAsset(host.runtimeDescriptorPath);
            if (descriptor.indexOf("generated-route-runtime") === -1) {
              throw new Error("Missing runtime descriptor text");
            }
            host.emitCommandBatch(JSON.stringify([
              { type: "create-element", nodeId: 1, viewType: "Button" },
              { type: "set-prop", nodeId: 1, name: "text", value: "Count: 0" },
              { type: "subscribe-event", nodeId: 1, name: "press" }
            ]));
            host.onNativeEvent(function (payload) {
              if (payload.indexOf('"name":"press"') >= 0) {
                host.emitCommandBatch(JSON.stringify([
                  { type: "set-prop", nodeId: 1, name: "text", value: "Count: 1" }
                ]));
              }
            });
          }
        };
        globalThis.__terajsNativeRuntime = runtime;
      }());
      """.trimIndent()
    )

    val button = hostRuntime.rootView as? Button
      ?: throw AssertionError("Expected Android button root view")

    assertEquals("Count: 0", button.text.toString())

    button.performClick()

    assertEquals("Count: 1", button.text.toString())
    assertTrue(emitted.single().contains("\"name\":\"press\""))
    assertTrue(
      diagnostics.any { event ->
        event.area == "engine" && event.message == "Started Android live runtime entry"
      }
    )
    assertTrue(
      diagnostics.any { event ->
        event.area == "engine" && event.message == "Dispatched Android native event into live runtime"
      }
    )
  }

  @Test
  fun rejectsEntriesThatDoNotPublishTheRuntimeGlobal() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val hostRuntime = AndroidHostRuntime(context = context)
    val engine = AndroidRhinoRuntime(hostRuntime)

    val error = assertThrows(AndroidHostRuntimeContractError::class.java) {
      engine.start("(function () { globalThis.missing = {}; }());")
    }

    assertEquals(
      "Android live runtime entry did not define globalThis.__terajsNativeRuntime.",
      error.message
    )
  }
}