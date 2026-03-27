# Architecture Review & Best Practices (2026)

Building a modern, offline-first language learning app in React Native (Expo) involves coordinating large local databases, complex animations, and strict native dependency management. Here are the common pitfalls we encountered and how enterprise applications solve them.

## 1. The "Large Pre-Populated Database" Problem

**The Mistake:** Attempting to manually download or copy a large SQLite database (e.g., 50MB+) on the first launch using standard file system APIs.
This often leads to race conditions where the app tries to query the database before it has finished copying, resulting in silent failures or "Table not found" crashes. Furthermore, large binary files get corrupted if not bundled correctly.

**The Best Practice (Expo SQLite `assetId`):**
*   **Metro Configuration:** By default, Metro (the React Native bundler) ignores `.db` files. We must explicitly tell Metro to bundle database files by modifying `metro.config.js` (`config.resolver.assetExts.push('db')`).
*   **Asset Bundling:** Place the pre-populated database in the `assets/` folder.
*   **Provider Pattern:** Use Expo's `<SQLiteProvider>` and pass the bundled database via the `assetSource={{ assetId: require('../assets/hanzi.db') }}` prop. Under the hood, Expo securely and synchronously copies the asset to the correct internal app directory on first launch, ensuring the database is 100% ready before rendering child components.

## 2. The "Animation Thread vs. JS Thread" Problem

**The Mistake:** Using React's `setState` or `Animated` API to drive complex, multi-path SVG stroke animations.
JavaScript is single-threaded. If the app is querying the database or handling a user swipe gesture, the JS thread drops frames, causing animations to stutter or freeze completely.

**The Best Practice (Reanimated Worklets):**
*   **UI Thread Execution:** Use `react-native-reanimated` (v3/v4). It executes animations entirely on the native UI thread using "worklets" (tiny JavaScript functions that compile down to C++).
*   **Shared Values:** Instead of `useState`, use `useSharedValue` to track animation progress (e.g., `strokeDashoffset`). This ensures that even if the JS thread is blocked loading a heavy 10,000-word dictionary, the Chinese character strokes will continue drawing at a buttery-smooth 60 FPS.

## 3. The "Expo Go Version Mismatch" Problem

**The Mistake:** Running the latest npm packages with an older version of the Expo Go app on the physical device.
React Native tightly couples JavaScript libraries to pre-compiled native binaries (C++/Java/Objective-C). If you use `react-native-reanimated@4.x` in your `package.json`, but the Expo Go app installed on the phone was compiled for `react-native-reanimated@3.x`, the app will bundle 100% successfully but crash instantly on the phone with a `TurboModule` or `HostFunction` error.

**The Best Practice (Strict SDK Alignment):**
*   Never manually update core native libraries (like `react-native`, `expo-router`, or `expo-sqlite`) using `npm install <package>@latest`.
*   Always use `npx expo install --fix`. This command analyzes the exact Expo SDK version of your project and forces all packages to downgrade/upgrade to the exact versions that match the compiled binaries inside the Expo Go app.

## 4. The "FlatList Rendering Large Data" Problem

**The Mistake:** Querying 120,000 dictionary entries and passing them directly to a `<ScrollView>` or `<FlatList>`.
This causes massive memory spikes, OOM (Out of Memory) crashes, and frozen screens upon navigation.

**The Best Practice (Pagination & Virtualization):**
*   **SQL Limits:** Always use `LIMIT` and `OFFSET` in SQLite queries (e.g., `LIMIT 50`).
*   **FlashList:** For massive lists, replace the standard `FlatList` with Shopify's `@shopify/flash-list`. It recycles views infinitely faster and prevents memory leaks when browsing large dictionaries.

## Summary of Our Current Architecture

We have successfully transitioned the app to a robust, production-ready architecture:
1. **Framework:** Expo SDK 55 + React Native.
2. **Database:** Offline-first `expo-sqlite` bundled natively via Metro assets. No internet required.
3. **Animations:** 60 FPS SVG stroke rendering using `react-native-reanimated` worklets.
4. **State/Data:** Decoupled SQLite hooks ensuring fast, asynchronous, non-blocking queries.
