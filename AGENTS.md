# AGENTS.md

## Dev Commands

```bash
pnpm dev      # Vite dev server at http://0.0.0.0:4173
pnpm build    # Build for production
pnpm preview  # Preview production build locally
```

**No test suite** - vanilla JS project with no tests.

## ⚠️ Package Manager

**Use pnpm exclusively** - never npm.

## Architecture

- **Entry point**: `index.html` (root, not in `src/`)
- **Source**: `src/app.js` (logic), `src/styles.css` (styles), `src/renderIdeas.js`
- **Vite** dev server: port 4173, binds to 0.0.0.0
- **Firebase**: Auth (Google + email/password) + Firestore for data storage
- **Three modules**: Compras (shopping), Ideas (notes), Tareas (tasks)
- **Data isolation**: Each user sees only their own data (filtered by userId)

## Mobile UX

- Touch targets: **44x44px** minimum (WCAG AA)
- Input font size: **16px** (prevents iOS zoom)
- Viewport: `width=device-width, initial-scale=1.0`
- Safe area: `env(safe-area-inset-bottom)`

## Key Files

- `index.html` - App entry point (root)
- `SPEC.md` - Full design specification
- `vite.config.js` - Dev server config (host: 0.0.0.0, port: 4173)
- `src/firebase.js` - Firebase Auth & Firestore config
- `src/app.js` - Main app logic with auth integration