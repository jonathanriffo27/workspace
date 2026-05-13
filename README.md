# Workspace Personal

A premium, mobile-first productivity Single Page Application (SPA) designed for personal organization. Built with a focus on simplicity, performance, and a refined dark aesthetic.

![Workspace Personal Preview](src/tareas-screenshot.png)

## 🚀 Overview

**Workspace Personal** is a centralized tool to manage your daily life across three core modules:
- **🛒 Compras (Shopping List):** Organized by categories with smart sorting.
- **💡 Ideas (Notes):** Fast capture for thoughts and inspirations with search and archival.
- **✅ Tareas (Tasks):** Priority-based task management with due dates.

## ✨ Key Features

- **Mobile-First Design:** Optimized for Android mobile browsers with a full-viewport, app-like experience.
- **Premium Aesthetic:** High-contrast dark theme (#0F0F0F) with warm amber accents (#F59E0B).
- **Reactive State Management:** Centralized `appState` for real-time UI updates without page refreshes.
- **Offline-First Persistence:** Automatically saves all data to `localStorage`.
- **Performance Focused:** Built with Vanilla JS and Vite for near-instant load times.
- **Typography:** Refined pairing of *DM Serif Display* (Headers) and *DM Sans* (Body).

## 🛠️ Tech Stack

- **Tooling:** [Vite](https://vitejs.dev/)
- **Core:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Database:** `localStorage` (Browser-based persistence)
- **Deployment:** Vercel/Netlify (Ready)
- **Integration:** Firebase (Optional/Pre-configured in `src/firebase.js`)

## 📦 Project Structure

```text
├── src/
│   ├── app.js           # Core logic & Centralized State
│   ├── renderIdeas.js   # Specialized rendering for Ideas module
│   ├── styles.css       # Global design system & component styles
│   ├── firebase.js      # Firebase configuration
│   └── ... (assets)
├── index.html           # Main entry point
├── SPEC.md              # Detailed technical specification
└── package.json         # Dependencies and scripts
```

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (Recommended)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/workspace-personal.git
   cd workspace-personal
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

### Building for Production
To create an optimized production build:
```bash
pnpm build
```
Preview the build locally:
```bash
pnpm preview
```

## 📜 Specification
For deep technical details on the UI/UX, state management, and functional requirements, see [SPEC.md](./SPEC.md).

---
*Built with precision as part of the Workspace project.*
