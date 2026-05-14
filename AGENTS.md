# AGENTS.md

## App Location

The app is a SPA with its main entry point at `index.html`. The logic and styles are located in the `src/` folder (`src/app.js`, `src/styles.css`).

## Dev Commands

```bash
pnpm dev      # Vite dev server at http://0.0.0.0:4173
pnpm build    # Build for production
pnpm preview  # Preview production build locally
```

**No test suite** - this is a vanilla JS project with no tests.

## ⚠️ Package Manager

**Use pnpm exclusively** - never npm. This project and global installations should use pnpm for security.

## Architecture

- **Vite** for dev server (port 4173, binds to 0.0.0.0)
- **localStorage** for data persistence (keys: `workspace_compras`, `workspace_ideas`, `workspace_tareas`)
- Three sections: Compras (shopping list), Ideas (notes), Tareas (tasks)
- Mobile-first design targeting 320px-480px

## Mobile UX Requirements (from SPEC.md)

- Touch targets must be minimum **44x44px** (WCAG AA)
- Font size 16px on inputs to prevent iOS zoom
- Viewport meta: `width=device-width, initial-scale=1.0`
- Safe area padding for notched devices: `env(safe-area-inset-bottom)`

## Key Files

- `index.html` - The actual app (not src/)
- `SPEC.md` - Full design specification
- `vite.config.js` - Vite dev server config