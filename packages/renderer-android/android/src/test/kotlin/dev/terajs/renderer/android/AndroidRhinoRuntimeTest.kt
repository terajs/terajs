package dev.terajs.renderer.android

import android.content.Context
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
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
  fun updatesSiblingViewsFromAndroidTextInputEvents() {
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
            host.readTextAsset(host.runtimeDescriptorPath);
            host.emitCommandBatch(JSON.stringify([
              { type: "create-element", nodeId: 1, viewType: "LinearLayout" },
              { type: "create-element", nodeId: 2, viewType: "EditText" },
              { type: "create-element", nodeId: 3, viewType: "TextView" },
              { type: "insert", parentId: 1, childId: 2, anchorId: null },
              { type: "insert", parentId: 1, childId: 3, anchorId: null },
              { type: "set-prop", nodeId: 2, name: "hint", value: "Host note filter" },
              { type: "subscribe-event", nodeId: 2, name: "change" },
              { type: "set-prop", nodeId: 3, name: "text", value: "Host note filter inactive." }
            ]));
            host.onNativeEvent(function (payload) {
              const event = JSON.parse(payload);
              if (!event || event.name !== "textInput") {
                return;
              }

              const value = event.payload && typeof event.payload.text === "string"
                ? event.payload.text
                : "";
              const summary = value.length > 0
                ? 'Filtering host note by "' + value + '".'
                : "Host note filter inactive.";

              host.emitCommandBatch(JSON.stringify([
                { type: "set-prop", nodeId: 3, name: "text", value: summary }
              ]));
            });
          }
        };
        globalThis.__terajsNativeRuntime = runtime;
      }());
      """.trimIndent()
    )

    val root = hostRuntime.rootView as? LinearLayout
      ?: throw AssertionError("Expected Android linear layout root view")
    val filterInput = root.getChildAt(0) as? TerajsSelectionEditText
      ?: throw AssertionError("Expected Android EditText child")
    val summary = root.getChildAt(1) as? TextView
      ?: throw AssertionError("Expected Android TextView child")

    assertEquals("Host note filter inactive.", summary.text.toString())

    filterInput.setText("Android")

    assertEquals("Filtering host note by \"Android\".", summary.text.toString())
    assertTrue(emitted.any { payload ->
      payload.contains("\"name\":\"textInput\"") && payload.contains("\"text\":\"Android\"")
    })
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