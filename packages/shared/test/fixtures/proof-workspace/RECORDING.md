# Terajs Social Feed Recording Demo

This fixture is the tracked recording app for proving one shared Terajs social feed through DOM and Android targets.

## Recording Beats

1. Open the demo and zoom into the social feed headline or first post card.
2. Run the DOM build:

   ```bash
   tera build --target web
   ```

3. Show the `dist/` output and browser screen.
4. Run the Android artifact build:

   ```bash
   tera build --target android
   ```

5. Show `.terajs/generated/android` and `.terajs/hosts/android`.
6. If the local Android SDK is available, materialize and assemble the Android shell:

   ```bash
   tera shell init android
   tera shell doctor android
   ./android/gradlew assembleDebug
   ```

7. Zoom back out to the browser and Android surfaces side by side, then scroll the feed on the Android mirror.

## Local Repo Gates

From the repo root, use these when changing the demo source:

```bash
npm run test:universal:native
npm run test:renderer-android:ts
```

The real Android shell assemble still requires JDK 17+ and an Android SDK.
