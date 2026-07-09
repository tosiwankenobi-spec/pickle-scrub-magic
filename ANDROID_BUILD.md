# Building Pickle Polish as an Android APK

Lovable builds the web app. To package it as a real installable `.apk` /
`.aab`, run these commands **on your own machine** (macOS, Linux, or
Windows) — the Android SDK and JDK aren't available in the Lovable sandbox.

## One-time setup

1. Install [Android Studio](https://developer.android.com/studio) (installs the Android SDK + emulator).
2. Install JDK 21 (bundled with recent Android Studio).
3. Clone this project locally and install deps:
   ```bash
   bun install
   ```

## Add the Android platform (first time only)

```bash
bun run build            # builds dist/client
bunx cap add android     # creates the android/ folder
bunx cap sync android    # copies web assets + plugins in
```

Commit the generated `android/` folder if you want to keep custom
native tweaks; otherwise it's regenerated on demand.

## Iterate

Every time you change the web app:

```bash
bun run build
bunx cap sync android
bunx cap open android    # opens Android Studio
```

Then in Android Studio: **Run ▶** to install on a connected device or emulator.

## Build a release APK / AAB

In Android Studio: **Build → Generate Signed Bundle / APK**
- APK for direct install / sideload
- AAB for Google Play upload

You'll create/select a keystore the first time. Keep the `.jks` file and
its passwords safe — losing them means you can't publish updates.

## App identity

- `appId`: `app.lovable.picklepolish` (change in `capacitor.config.ts` before first `cap add`)
- `appName`: `Pickle Polish`
- App icon: replace files under `android/app/src/main/res/mipmap-*/` after `cap add`.

## Native features (later)

To scan real device storage / delete files, add Capacitor plugins:
- [`@capacitor/filesystem`](https://capacitorjs.com/docs/apis/filesystem) — read/write files
- A community MediaStore plugin, or a small custom plugin for `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` on Android 13+
- Native delete confirmation via `MediaStore.createDeleteRequest` (Android 11+)

Today the app is a UI prototype with mock data — swap the `pickle-data.ts`
seed for real MediaStore results once the plugin is wired up.
