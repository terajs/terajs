# Native Renderer RC Readiness

This branch is moving from renderer foundation work toward an RC-quality universal workspace path. Use this document as the release-readiness checklist for web, Android, and iOS renderer work.

## Current Local Gate

Run these from the repository root:

```bash
npm run rc:native
npm run rc:check
```

`npm run rc:native` covers:

- universal doctor readiness
- proof workspace target builds
- Android and iOS shell materialization
- Android release readiness doctor
- iOS source-level release readiness doctor
- Android/iOS generated artifact conformance
- Android/iOS emitted live-runtime behavior conformance
- Android renderer TypeScript tests
- iOS renderer TypeScript tests

`npm run rc:check` now includes `npm run rc:native` in the full release-candidate gate.

Run RC gates sequentially. `npm run build` starts with `npm run clean`, and running it in parallel with native proof gates can remove package `dist` files while proof tests are importing them.

## Local Status

Last local checkpoint on this branch:

- `npm run rc:native`: passing.
- `npm run test:universal:native`: passing, with the Android proof shell assemble smoke skipped when no local Android toolchain is available.
- `npm run build`: passing.
- `npm run test:renderer-web:focused`: passing.
- `npm run bench:browser:guard`: passing in the latest run.
- `npm run rc:native:android:doctor`: JDK and Gradle wrapper pass; blocked because `ANDROID_SDK_ROOT`/`ANDROID_HOME` is not configured.
- `npm run rc:native:android`: blocked on this machine because `ANDROID_SDK_ROOT`/`ANDROID_HOME` is not configured.
- `npm run rc:native:android:shell-debug`: blocked on this machine because `ANDROID_SDK_ROOT`/`ANDROID_HOME` is not configured.
- `npm run rc:native:android:shell-release`: blocked on this machine because `ANDROID_SDK_ROOT`/`ANDROID_HOME`, local `TERA_ANDROID_RELEASE_*` signing inputs, and release version metadata are not configured.

## Android RC Requirements

Required before declaring Android RC-ready:

- `npm run rc:native`
- `npm run rc:native:android:doctor`
- `npm run rc:native:android`
- `npm run rc:native:android:shell-debug`
- `npm run rc:native:android:shell-release`
- materialized universal Android shell `assembleDebug`
- `tera shell doctor android --release` passes with real local signing inputs

Current local limitation:

- Android real Gradle build validation requires a local JDK 17+ and Android SDK. This machine currently passes the JDK and Gradle wrapper checks, but fails `npm run rc:native:android:doctor` before Gradle starts because no Android SDK is configured.
- `npm run rc:native:android:shell-debug` materializes the proof workspace Android shell, runs `assembleDebug`, and verifies that a debug APK exists once the SDK is available.
- `npm run rc:native:android:shell-release` materializes the proof workspace Android shell, requires local `TERA_ANDROID_RELEASE_*` signing inputs plus `TERA_ANDROID_RELEASE_VERSION_CODE` and `TERA_ANDROID_RELEASE_VERSION_NAME`, runs `tera shell doctor android --release`, runs `assembleRelease`, and verifies that a release APK exists once the SDK and local release inputs are available.
- The TypeScript and generated-runtime proof gates do not replace a real Gradle build.

## iOS RC Requirements

Required before declaring iOS RC-ready:

- `npm run rc:native`
- `tera shell doctor ios --release`
- macOS `swift build` from the materialized `ios/` shell
- Xcode app-wrapper validation using `ios/TerajsAppHost.json`
- simulator smoke once the Xcode wrapper exists
- archive/signing validation before App Store or TestFlight claims

Current local limitation:

- This Windows host can validate source shape, generated assets, emitted runtime behavior, and app-wrapper metadata. Native iOS compile, simulator, archive, and signing validation require macOS with Xcode.

## RC Exit Criteria

The branch can move toward RC only when:

- `npm run rc:check` passes.
- `npm run rc:native:android` passes on an Android-capable machine.
- Android debug and release shell builds are run and recorded.
- iOS Swift/Xcode validation is run and recorded on macOS.
- Browser performance remains inside the checked-in benchmark guard.
- Any skipped native build check has an explicit environment blocker, not an unknown failure.
