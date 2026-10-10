# MathSprint

MathSprint is a math-practice application built with **Expo, React
Native, and Expo Router**. The project targets **Android and iOS**.

> **Note:** This guide describes the source code and configuration
> available in the project. Successful builds and on-device behavior
> must still be verified in the development environment.

## Table of Contents

-   [Technology Stack](#technology-stack)
-   [Features and Components](#features-and-components)
-   [Requirements](#requirements)
-   [Project Setup](#project-setup)
-   [Environment Configuration](#environment-configuration)
-   [Running the App](#running-the-app)
-   [Building an Android APK with
    EAS](#building-an-android-apk-with-eas)
-   [Building Android for Google
    Play](#building-android-for-google-play)
-   [Building for iOS](#building-for-ios)
-   [Folder Structure](#folder-structure)
-   [Troubleshooting](#troubleshooting)
-   [Security and Release Checklist](#security-and-release-checklist)

## Technology Stack

According to `package.json`, the project uses the following
technologies:

-   Expo SDK 54
-   React 19
-   React Native 0.81
-   Expo Router
-   Zustand for state management
-   Expo Secure Store for secure local storage
-   React Native Google Sign-In for Google authentication
-   React Native Google Mobile Ads for advertisements
-   Expo Notifications for notifications
-   React Native NetInfo for network connectivity status
-   NativeWind and Tailwind CSS for styling

For exact dependency versions, see `package.json` and
`package-lock.json`.

## Features and Components

The source project includes components and services for:

-   Login and main application screens using Expo Router.
-   Gameplay and math-question generation.
-   Player profile, authentication, quests, audio, and modal management
    through stores and contexts.
-   Energy recovery and rewarded-ad flows.
-   Communication with a backend API.
-   Push notifications and internet connectivity monitoring.

Actual runtime behavior depends on backend configuration, service
accounts, device permissions, and successful build and device testing.

## Requirements

Prepare a development environment with:

-   Node.js and npm.
-   Git (optional, but recommended).
-   An Expo account for EAS Build.
-   Android Studio and the Android SDK for local Android builds and
    testing.
-   macOS and Xcode for local iOS builds and testing. Windows users can
    use EAS cloud builds for iOS, subject to the required Apple
    configuration.
-   A backend URL that is reachable from the device or application
    build.

## Project Setup

1.  Extract the source project and open a terminal in the project
    directory.

2.  Install dependencies from the lockfile:

    ``` bash
    npm ci
    ```

3.  Copy the example environment file:

    -   **Windows PowerShell:**

        ``` powershell
        Copy-Item .env.example .env
        ```

    -   **macOS/Linux:**

        ``` bash
        cp .env.example .env
        ```

4.  Fill in the `.env` configuration as described in [Environment
    Configuration](#environment-configuration).

5.  Check the project configuration:

    ``` bash
    npx expo-doctor
    npm run lint
    ```

If `npm ci` fails, investigate network/cache issues or Node.js
compatibility first. Do not delete `package-lock.json` simply to work
around an installation failure without identifying the cause.

## Environment Configuration

The `.env.example` file provides the following variable:

``` dotenv
EXPO_PUBLIC_API_URL=
```

Set `EXPO_PUBLIC_API_URL` to the **base URL of your backend API**, for
example:

``` dotenv
EXPO_PUBLIC_API_URL=https://your-api-domain.example/api
```

The domain above is only a placeholder. Replace it with your actual
backend URL. Check whether your backend expects the `/api` prefix; do
not add or remove it without matching the backend routes.

> Variables prefixed with `EXPO_PUBLIC_` are included in the application
> bundle and can be read by users. Do not store passwords, private keys,
> server secrets, or administrator credentials in `EXPO_PUBLIC_`
> variables.

### Google Sign-In

The project uses `@react-native-google-signin/google-signin`. Review
`src/config/google.jsx` and configure the correct client ID for your
Google Cloud/Firebase project. Ensure that the backend login endpoint
configuration matches the application's implementation.

### Firebase for Android

`app.json` references a `google-services.json` file. Make sure the file
belongs to the correct Firebase project and matches the Android package
name in `app.json`. Do not use a configuration file from an unrelated
application or project.

### AdMob

The `react-native-google-mobile-ads` plugin is configured in `app.json`.
The source configuration uses **Google test ad application IDs**. Before
a public release, create your own production app IDs and ad unit IDs,
then update the relevant configuration. Do not guess or invent IDs.

### iOS Bundle Identifier

Before building for iOS, set a unique application-owned
`ios.bundleIdentifier` in `app.json`. Keep it consistent with your Apple
Developer, provisioning, and related service configurations.

## Running the App

### Start Metro / Expo

``` bash
npm start
```

Follow the terminal instructions to open the application on a supported
device or emulator.

### Run Android Locally

The following command runs a native Android build on your local machine:

``` bash
npm run android
```

This script uses `expo run:android`. Android Studio, the Android SDK, a
compatible JDK, and the required native toolchain must be installed
first.

### Run iOS Locally

On macOS with Xcode installed:

``` bash
npm run ios
```

This command runs `expo run:ios`.

### Run Lint

``` bash
npm run lint
```

## Building an Android APK with EAS

The `preview` profile in `eas.json` is configured to produce an APK.

1.  Install EAS CLI:

    ``` bash
    npm install -g eas-cli
    ```

2.  Sign in:

    ``` bash
    eas login
    eas whoami
    ```

3.  If the project is not yet connected to EAS, configure it:

    ``` bash
    eas build:configure
    ```

    Review any configuration changes before continuing.

4.  Start the APK build:

    ``` bash
    eas build --platform android --profile preview
    ```

5.  Wait for the build to finish, then open the build URL shown in the
    terminal or Expo dashboard to download the APK.

EAS may ask you to configure Android credentials. Choose the
credential-management option carefully and keep signing access secure.

## Building Android for Google Play

The `production` profile in `eas.json` is configured with
`buildType: "app-bundle"`.

``` bash
eas build --platform android --profile production
```

This profile is intended to produce an Android App Bundle (AAB), which
is generally used for distribution through Google Play. Review the
configuration and release requirements before uploading it.

## Building for iOS

1.  Make sure `ios.bundleIdentifier` is configured in `app.json`.

2.  Ensure Google Sign-In, notifications, and other services used by the
    app are configured for iOS.

3.  Sign in to EAS:

    ``` bash
    eas login
    ```

4.  Start the build:

    ``` bash
    eas build --platform ios
    ```

5.  Follow EAS instructions for Apple credentials, certificates, and
    provisioning profiles.

An iOS build requires appropriate Apple credentials for the selected
distribution method. Local development builds require macOS and Xcode.

## Folder Structure

``` text
.
├── app/                    # Screens and Expo Router routes
├── assets/images/          # Application image assets
├── src/
│   ├── components/         # Reusable UI components
│   ├── config/             # Service configuration, including Google
│   ├── constants/          # Constants, quest data, user data, and assets
│   ├── contexts/            # React contexts and providers
│   ├── examples/           # Hook usage examples
│   ├── hooks/              # Game, login, ads, and quest hooks
│   ├── services/            # API, authentication, storage, and quest services
│   ├── stores/              # Zustand stores
│   └── utils/               # Initialization and utility functions
├── .env.example             # Environment variable template
├── app.json                 # Expo configuration
├── eas.json                 # EAS build profiles
├── package.json             # Scripts and dependencies
└── package-lock.json        # npm lockfile
```

## Troubleshooting

### Android Build Fails with `Filename longer than 260 characters`

This error can occur when the Windows project path is too long for
generated native code or CMake files.

-   Move the project to a shorter path, such as `C:\\MS\\MathSprint`.
-   Stop the current build.
-   Delete only regeneratable build output directories, such as
    `android/app/.cxx`, `android/app/build`, and `android/build`.
-   Run the build again.

Example PowerShell commands from the project root:

``` powershell
Remove-Item -Recurse -Force .\android\app\.cxx -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\android\app\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\android\build -ErrorAction SilentlyContinue
npm run android
```

Alternatively, use EAS cloud build:

``` bash
eas build --platform android --profile preview
```

### The API Cannot Be Reached

-   Confirm that `EXPO_PUBLIC_API_URL` is set correctly.
-   Make sure the URL is reachable from the device's network.
-   Check API route prefixes and backend configuration.
-   Ensure the backend returns JSON in the format expected by the
    application.

### Google Sign-In Fails

-   Review `src/config/google.jsx`.
-   Make sure the client ID and fingerprint/signing configuration match
    the build being tested.
-   Check OAuth and backend configuration.

### Google Mobile Ads Warnings

Make sure the `react-native-google-mobile-ads` plugin is configured in
`app.json` and that Android/iOS app IDs are available. Test IDs can be
used during development; use your own production IDs for public
releases. After changing native plugin configuration, create a new
native build.

### EAS Build Fails

Open the build log in the Expo dashboard and identify the first error
that caused the process to stop. Distinguish fatal errors from warnings.
Keep the full log for troubleshooting, but do not share tokens,
credentials, or signing files.

## Security and Release Checklist

-   Do not commit `.env`, access tokens, passwords, private keys, or
    signing keystores to a public repository.
-   Make sure `google-services.json` belongs to the correct Firebase
    project. Review repository rules and file access before sharing the
    source code.
-   Never use `EXPO_PUBLIC_*` variables to store secrets.
-   Use HTTPS for the production backend.
-   Test login, logout, account switching, progress persistence, daily
    quest resets, ad rewards, and offline mode on real devices.
-   Ensure rewards that affect players are properly verified and do not
    rely only on UI state.
-   Run `npx expo-doctor`, `npm run lint`, an Android build, and an iOS
    build before declaring the release ready.
-   Test the APK/AAB on compatible Android devices and test the iOS
    build through the appropriate Apple distribution workflow.

## Validation Status

This documentation does **not** claim that native builds have completed
successfully. Run builds in a development environment or through EAS and
verify the results. The project owner must supply and validate service
IDs and production credentials.
