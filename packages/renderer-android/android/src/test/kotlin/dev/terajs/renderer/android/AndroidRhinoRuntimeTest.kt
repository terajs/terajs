package dev.terajs.renderer.android

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.widget.Button
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
  fun updatesSiblingViewsFromGeneratedAndroidRuntimeEntryTextInputEvents() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val diagnostics = mutableListOf<AndroidDiagnosticEvent>()
    val emitted = mutableListOf<String>()
    val hostRuntime = AndroidHostRuntime(
      context = context,
      runtimeDescriptorPath = ".terajs/generated/android/runtime/generated-route-runtime.json",
      readTextAssetImpl = AndroidRuntimeAssetReader(::readGeneratedRuntimeFixtureAsset),
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

    engine.start(readResource("proof-runtime-generated/runtime/live-runtime-entry.js"))

    val root = hostRuntime.rootView
      ?: throw AssertionError("Expected Android root view from generated runtime entry")
    val filterInput = findFirstView(root) { view ->
      view is TerajsSelectionEditText
    } as? TerajsSelectionEditText
      ?: throw AssertionError("Expected generated runtime EditText. View tree:\n${describeViewTree(root)}")
    val summary = findFirstView(root) { view ->
      view is TextView && view.text.toString().contains("Feed note filter inactive.")
    } as? TextView
      ?: throw AssertionError("Expected generated runtime host note summary text. View tree:\n${describeViewTree(root)}")

    assertTrue(summary.text.toString().contains("Feed note filter inactive."))

    filterInput.setText("Android")

    assertTrue(summary.text.toString().contains("Filtering feed note by \"Android\"."))
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
  fun preservesKeyedStoryButtonIdentityFromGeneratedAndroidRuntimeEntry() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val diagnostics = mutableListOf<AndroidDiagnosticEvent>()
    val emitted = mutableListOf<String>()
    val hostRuntime = AndroidHostRuntime(
      context = context,
      runtimeDescriptorPath = ".terajs/generated/android/runtime/generated-route-runtime.json",
      readTextAssetImpl = AndroidRuntimeAssetReader(::readGeneratedRuntimeFixtureAsset),
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

    engine.start(readResource("proof-runtime-generated/runtime/live-runtime-entry.js"))

    val root = hostRuntime.rootView
      ?: throw AssertionError("Expected Android root view from generated runtime entry")
    val initialStoryButtons = collectStoryButtonTexts(root)

    assertTrue(
      "Expected generated runtime story buttons. View tree:\n${describeViewTree(root)}",
      initialStoryButtons.isNotEmpty()
    )
    assertEquals(
      storyLabels,
      initialStoryButtons
    )

    val selectedAndroidStory = findStoryButtonByTitle(root, "Android artifacts just landed")
    selectedAndroidStory.performClick()

    val selectedHostSummary = findFirstView(root) { view ->
      view is TextView && view.text.toString().contains("Android artifact proof")
    } as? TextView
      ?: throw AssertionError("Expected generated runtime Android story summary. View tree:\n${describeViewTree(root)}")

    assertTrue(selectedHostSummary.text.toString().contains("Android artifact proof"))

    val promoteSelectedButton = findButtonByText(root, "Pin selected")
    promoteSelectedButton.performClick()

    assertEquals(
      listOf(
        "Android artifacts just landed",
        "The DOM build is live",
        "Phone mirror is scrolling",
        "Like, Reply, and Share controls",
        "One source root builds deliberately",
        "Final reveal"
      ),
      collectStoryButtonTexts(root)
    )
    assertEquals(selectedAndroidStory, collectStoryButtons(root).first())
    assertTrue(emitted.count { payload -> payload.contains("\"name\":\"press\"") } >= 2)
    assertTrue(
      diagnostics.any { event ->
        event.area == "engine" && event.message == "Dispatched Android native event into live runtime"
      }
    )
  }

  @Test
  fun togglesConditionalQueueVisibilityFromGeneratedAndroidRuntimeEntry() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val diagnostics = mutableListOf<AndroidDiagnosticEvent>()
    val emitted = mutableListOf<String>()
    val hostRuntime = AndroidHostRuntime(
      context = context,
      runtimeDescriptorPath = ".terajs/generated/android/runtime/generated-route-runtime.json",
      readTextAssetImpl = AndroidRuntimeAssetReader(::readGeneratedRuntimeFixtureAsset),
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

    engine.start(readResource("proof-runtime-generated/runtime/live-runtime-entry.js"))

    val root = hostRuntime.rootView
      ?: throw AssertionError("Expected Android root view from generated runtime entry")

    assertEquals(
      storyLabels,
      collectStoryButtonTexts(root)
    )

    val hideQueueButton = findButtonByText(root, "Hide feed")
    hideQueueButton.performClick()

    val hiddenState = findFirstView(root) { view ->
      view is TextView && view.text.toString().contains(
        "Feed hidden while the selected social proof stays mounted for the active host target."
      )
    } as? TextView
      ?: throw AssertionError("Expected generated runtime queue hidden state. View tree:\n${describeViewTree(root)}")

    assertTrue(hiddenState.text.toString().contains("Feed hidden while the selected social proof stays mounted"))
    assertTrue(collectStoryButtonTexts(root).isEmpty())

    val showQueueButton = findButtonByText(root, "Show feed")
    showQueueButton.performClick()

    assertEquals(
      storyLabels,
      collectStoryButtonTexts(root)
    )
    assertTrue(emitted.count { payload -> payload.contains("\"name\":\"press\"") } >= 2)
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

  private fun readGeneratedRuntimeFixtureAsset(assetPath: String): String {
    val normalizedAssetPath = assetPath.replace('\\', '/')
    val prefix = ".terajs/generated/android/"
    val resourceName = if (normalizedAssetPath.startsWith(prefix)) {
      "proof-runtime-generated/" + normalizedAssetPath.removePrefix(prefix)
    } else {
      throw AssertionError("Unexpected asset path: $assetPath")
    }

    return readResource(resourceName)
  }

  private fun readResource(name: String): String {
    return checkNotNull(javaClass.classLoader?.getResourceAsStream(name)) {
      "Missing test resource $name"
    }.bufferedReader().use { reader ->
      reader.readText()
    }
  }

  private fun findFirstView(root: View, predicate: (View) -> Boolean): View? {
    if (predicate(root)) {
      return root
    }

    if (root is ViewGroup) {
      for (index in 0 until root.childCount) {
        val match = findFirstView(root.getChildAt(index), predicate)
        if (match != null) {
          return match
        }
      }
    }

    return null
  }

  private fun collectViews(root: View, predicate: (View) -> Boolean): List<View> {
    val matches = mutableListOf<View>()

    if (predicate(root)) {
      matches.add(root)
    }

    if (root is ViewGroup) {
      for (index in 0 until root.childCount) {
        matches.addAll(collectViews(root.getChildAt(index), predicate))
      }
    }

    return matches
  }

  private fun findButtonByText(root: View, label: String): Button {
    return collectViews(root) { view ->
      view is Button && view.text.toString().trim() == label
    }.firstOrNull() as? Button
      ?: throw AssertionError("Expected button with text '$label'. View tree:\n${describeViewTree(root)}")
  }

  private fun findStoryButtonByTitle(root: View, title: String): Button {
    return collectStoryButtons(root).firstOrNull { button ->
      button.text.toString().contains(title)
    } ?: throw AssertionError("Expected story button for '$title'. View tree:\n${describeViewTree(root)}")
  }

  private fun collectStoryButtons(root: View): List<Button> {
    return collectViews(root) { view ->
      view is Button && storyLabels.any { label -> view.text.toString().contains(label) }
    }.map { it as Button }
  }

  private fun collectStoryButtonTexts(root: View): List<String> {
    return collectStoryButtons(root).map { button ->
      storyLabels.firstOrNull { label -> button.text.toString().contains(label) }
        ?: button.text.toString().trim()
    }
  }

  private val storyLabels = listOf(
    "The DOM build is live",
    "Android artifacts just landed",
    "Phone mirror is scrolling",
    "Like, Reply, and Share controls",
    "One source root builds deliberately",
    "Final reveal"
  )

  private fun describeViewTree(root: View, depth: Int = 0): String {
    val indent = "  ".repeat(depth)
    val label = buildString {
      append(root.javaClass.simpleName)
      if (root is TextView) {
        append(" text=")
        append(root.text?.toString() ?: "")
        append(" hint=")
        append(root.hint?.toString() ?: "")
      }
    }

    if (root !is ViewGroup) {
      return "$indent$label"
    }

    val children = (0 until root.childCount).joinToString("\n") { index ->
      describeViewTree(root.getChildAt(index), depth + 1)
    }

    return if (children.isEmpty()) {
      "$indent$label"
    } else {
      "$indent$label\n$children"
    }
  }
}
