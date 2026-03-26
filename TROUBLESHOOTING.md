# 🛠 Troubleshooting & Architecture Best Practices

## Why Did We Experience Errors During Setup?
React Native and Expo are notorious for strict version matching between the native binary (Expo Go) and the JavaScript bundle. 

1. **The SDK Mismatch (React 18 vs React 19):**
   - The user downloaded the **latest Expo Go** from the App Store/Play Store, which currently targets **Expo SDK 55** (using React 19). 
   - The original code was scaffolded using a slightly older template targeting **SDK 51** (React 18).
   - **Resolution:** We upgraded the entire project to SDK 55. However, because some third-party libraries (`@react-native/virtualized-lists`, older gestures) haven't fully dropped React 18 peer dependencies, we MUST use `npm install --legacy-peer-deps`.

2. **TurboModule Exception (`installTurboModule`):**
   - Expo SDK 55 upgrades `react-native-reanimated` to v4. This version handles Worklets differently.
   - If the exact minor version of Reanimated in your `node_modules` doesn't match the C++ binary compiled into Expo Go, it throws a TurboModule crash.
   - **Resolution:** We ran `npx expo install --fix` to force Expo to align the Reanimated version with the host app.

3. **Database Asset Not Found (`ExpoAsset.downloadAsync`):**
   - The Metro bundler ignores unknown file extensions to keep bundle sizes small. It didn't know what a `.db` file was, so it excluded `hanzi.db` from the build.
   - **Resolution:** Added `metro.config.js` to explicitly push `'db'` into `config.resolver.assetExts`.

---

## 🏗 Architectural Best Practices Audit (2026)
Before proceeding to new features, we audited our approach against current industry standards for offline React Native apps.

### 1. SQLite Bundling (Best Practice)
- **Current Approach:** We are manually copying the `.db` file using `expo-file-system` on first launch.
- **Industry Standard (SDK 55):** `expo-sqlite` now supports the `assetId` prop directly in `<SQLiteProvider>` and `openDatabaseAsync`. We don't need manual file system copying anymore!
- **Action:** We will refactor `app/_layout.tsx` to use `<SQLiteProvider assetId={require('../assets/hanzi.db')} databaseName="hanzi.db">`. This is drastically faster and prevents UI blocking on cold starts.

### 2. SVG Animations (Best Practice)
- **Current Approach:** Using `useSharedValue` and `react-native-reanimated` `Animated.createAnimatedComponent(Path)`.
- **Industry Standard:** This is exactly the correct, performant way to do it. It runs entirely on the UI thread (via Hermes and Reanimated Worklets), bypassing the slow JS bridge. 

### 3. Flashcard SRS Storage
- **Current Approach:** SQLite table with `INSERT ... ON CONFLICT DO UPDATE`.
- **Industry Standard:** This is the most robust way to handle offline SRS. Avoid Async Storage for complex querying (like "give me 50 cards due today"). SQLite is the right choice.
