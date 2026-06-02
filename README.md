# Workspace Personal

[Live App](https://opencode-36f43.web.app/)

A premium, mobile-first productivity Single Page Application (SPA) designed for personal organization. Built with a focus on simplicity, performance, and a refined dark aesthetic.

## 🧠 Why I Built This

I work in car rentals in Chilean Patagonia — a fast-paced, 
customer-facing job where ideas, tasks, and mental notes pile 
up faster than I can process them.

I wasn't looking to build a startup. I just needed a way to 
capture things before they disappeared: a grocery run, a side 
project idea, something I had to follow up on at work.

Every app I tried felt like too much. Too many features, too 
many taps, too much friction for something that should be 
instant.

So I built this for myself — a single place, designed for my 
phone, that stays out of the way until I need it.

The voice capture came later, when I realized typing while 
driving or helping a customer wasn't realistic. Now it's the 
feature I use most.

## 📸 Preview

<div align="center">
  <img src="src/tareas.png" width="30%" alt="Tareas Section" />
  <img src="src/compras.png" width="30%" alt="Compras Section" />
  <img src="src/ideas.png" width="30%" alt="Ideas Section" />
</div>

## 🚀 Overview

**Workspace Personal** is a centralized tool to manage your daily life across three core modules:
- **🛒 Compras (Shopping List):** Organized by categories with smart sorting.
- **💡 Ideas (Notes):** Fast capture with search, archival, and expandable notes.
- **✅ Tareas (Tasks):** Priority-based management with due dates and real-time sync.

## ✨ Key Features

- **Mobile-First Design:** Optimized for mobile browsers with a full-viewport, premium glassmorphism aesthetic.
- **🎙️ Intelligent Voice Capture:** Long-press the Microphone icon in the navigation bar to capture thoughts. Powered by OpenRouter LLM for smart categorization into Compras, Ideas, or Tareas.
- **📦 Automated Task Archiving:** Completed tasks are automatically archived daily at 3 AM to keep your workspace clean.
- **Real-Time Sync:** Powered by Firebase Firestore for seamless multi-device updates.
- **Secure by Design:** Built-in XSS protection, input validation (DataService), and secure credential management via Vite environment variables.
- **Reactive State:** Centralized `appState` for instant UI feedback and optimistic updates.
- **Advanced UI:** Inline title editing, sortable lists, and multi-select bulk actions.
- **📱 Native Android Integration:** Packaged as a native Android APK using **Capacitor**, featuring integration with native device features:
  - **Speech Recognition:** Direct bridge to Android's native Speech Recognition API for seamless voice-to-text.
  - **Haptics:** Native haptic vibrations for feedback upon beginning and ending voice recording.
  - **Status Bar & Keyboard:** Full edge-to-edge layout styling with dynamic status bar color changing (light/dark theme sync) and native keyboard accessories.
  - **Google Native Auth:** Integration with native Firebase Authentication plugins for smooth sign-in flow.
- **Typography:** DM Serif Display & DM Sans pairing.

## ⚡ Performance Optimizations

- **User Cache-First Initial Paint:** Render cached user items instantly from `localStorage` under `workspace_last_user_id` before Firebase Auth resolves. Cuts perceived startup latency from ~4s to under 500ms.
- **Prioritized Non-Blocking Sync:** Boots the default **Ideas** synchronization first. Runs secondary syncing (Compras and Tareas) deferred in `requestAnimationFrame`. Offloads Firestore legacy migrations to background promises with a migration marker to prevent database hits.
- **Instant Voice Touch Listeners:** Voice capture prepares and registers long-press listeners on microsecond zero, checking native availability in background promises dynamically.
- **Instant Voice UI Dismissal:** Decouples UI feedback from slow native plugin stops; dismisses the full-screen overlay instantly on touch end while finishing text processing silently in the background.
- **AnimationFrame Batch Rendering:** Throttles UI updates inside `store.js` using `requestAnimationFrame` to batch rapid Firestore updates and avoid redundant re-renders.
- **Optimized ES Code Chunking:** Fixed dynamic imports dynamically loaded by main entry, separating `firebaseSync.js` into its own chunk to optimize initial bundle sizes.
- **Vite Build Pipeline:** Pre-configured for fast bundles and optimized assets.

## 🛠️ Tech Stack

- **Tooling:** [Vite](https://vitejs.dev/)
- **Core:** Vanilla JavaScript (ES6+), HTML5, CSS3 (Modular ITCSS-like structure)
- **Backend:** Firebase (Auth & Firestore)
- **AI Integration:** OpenRouter (for Voice Capture processing)
- **Persistence:** Firestore + local caching with user-specific keys.

## 📦 Project Structure

```text
├── src/
│   ├── app.js           # App Entry & Auth Listener
│   ├── store.js         # Centralized Reactive State
│   ├── firebase.js      # Firebase SDK Initialization
│   ├── services/        # Business Logic (Sync, Voice, Archiver)
│   ├── styles/          # Modular CSS (Variables, Layout, Components)
│   ├── ui/              # UI Modules & Sections (Tabs, Modals, Toasts)
│   └── utils/           # Helper functions (Formatting, Storage)
├── .env                 # API Keys (Git ignored)
├── index.html           # Main Entry point
├── SPEC.md              # Technical Specification
├── GEMINI.md            # Agent Context & Standards
└── AGENTS.md            # Developer Quick Start
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm (Recommended)

### Installation & Config
1. Clone the repository.
2. Install dependencies: `pnpm install`.
3. Create a `.env` file in the root:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project
   ...
   ```
4. Start dev server: `pnpm dev`.

### Building for Production
To create an optimized production build:
```bash
pnpm build
```
Preview the build locally:
```bash
pnpm preview
```

## 📱 Android Native Development (Capacitor)

The application uses **Capacitor** to compile into a native Android project. The native code is housed in the `android/` directory.

### Commands for Native Flow

1. **Sync Web Code to Android Assets:**
   After building your production web app, synchronize the compiled assets to the Android project directory:
   ```bash
   pnpm build && npx cap sync
   ```

2. **Open Project in Android Studio:**
   To run, debug, or build signed release APKs, open the native project in Android Studio:
   ```bash
   npx cap open android
   ```

3. **Compile Debug APK Locally via CLI:**
   You can assemble a debug APK without opening Android Studio by running:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
   The output APK will be generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

### Automated GitHub Actions CI Pipeline

The project features a complete GitHub Actions workflow configured in `.github/workflows/build-apk.yml`.
* **Triggers:** Automatic on pushes to `main`, or manual run via `workflow_dispatch` (e.g. `gh workflow run build-apk.yml --ref <branch>`).
* **Artifacts:** Compiles the optimized web client, syncs Capacitor assets, signs the debug package with a safe debug keystore, and uploads the final `app-debug.apk` directly to GitHub Actions artifacts for instant downloading and testing on mobile devices.

## 📜 Specification
For deep technical details on the UI/UX, state management, and functional requirements, see [SPEC.md](./SPEC.md).

---
*Built with precision as part of the Workspace project.*
