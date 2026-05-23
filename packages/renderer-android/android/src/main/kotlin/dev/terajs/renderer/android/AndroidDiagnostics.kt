package dev.terajs.renderer.android

import android.util.Log

enum class AndroidDiagnosticLevel {
  Debug,
  Warn,
  Error,
}

data class AndroidDiagnosticEvent(
  val area: String,
  val message: String,
  val details: Map<String, Any?> = emptyMap(),
  val level: AndroidDiagnosticLevel = AndroidDiagnosticLevel.Debug,
)

fun interface AndroidDiagnosticsSink {
  fun record(event: AndroidDiagnosticEvent)
}

object AndroidLogcatDiagnosticsSink : AndroidDiagnosticsSink {
  private const val TAG = "TerajsRenderer"

  override fun record(event: AndroidDiagnosticEvent) {
    val detailSuffix = if (event.details.isEmpty()) {
      ""
    } else {
      event.details.entries.joinToString(prefix = " [", postfix = "]") { (key, value) ->
        "$key=$value"
      }
    }

    val line = "${event.area}: ${event.message}$detailSuffix"
    when (event.level) {
      AndroidDiagnosticLevel.Debug -> Log.d(TAG, line)
      AndroidDiagnosticLevel.Warn -> Log.w(TAG, line)
      AndroidDiagnosticLevel.Error -> Log.e(TAG, line)
    }
  }
}