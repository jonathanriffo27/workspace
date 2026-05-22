# Plan: Corregir barras del sistema Android en modo claro

## Resumen
Ajustar la app para que, en Android y especialmente en la PWA instalada, las barras del sistema adopten colores claros cuando el tema activo sea `light`. Hoy la app actualiza `meta[name="theme-color"]`, pero la PWA seguía declarando colores oscuros fijos en `public/manifest.json`, y no había una estrategia explícita para sincronizar el fondo del shell con el tema claro.

## Cambios de implementación
- Unificar la fuente de verdad de colores del shell:
- Mantener `workspace_theme` como estado de tema.
- Seguir usando `data-theme` y `meta[name="theme-color"]`, pero centralizar el color del shell en constantes reutilizables para `dark` y `light`.
- Asegurar que el color claro usado para barras del sistema coincida con el fondo real de la app (`#F6F2EA` o el token final que usa `--bg-primary` en light).

- Corregir la PWA instalada:
- Actualizar `public/manifest.json` para que no siga anunciando `theme_color` y `background_color` oscuros fijos.
- Definir ambos con el color base claro de la app, que es el fallback correcto para splash/background de la PWA instalada.
- Mantener `display: "standalone"` sin cambios.

- Mejorar el soporte del navegador / shell Android:
- En `index.html`, ampliar metadatos de `theme-color` para contemplar explícitamente claro y oscuro desde carga inicial.
- Mantener la actualización dinámica desde `src/app.js` cuando el usuario cambia de tema.
- Revisar si conviene añadir variantes `meta[name="theme-color"][media="(prefers-color-scheme: ... )"]` como fallback de arranque, sin quitar la actualización dinámica actual.

- Alinear el fondo raíz con el shell del sistema:
- Verificar que `html, body` y la primera pintura visual usen fondo claro real en modo `light`, para evitar contraste entre barras del sistema y un fondo inicial diferente.
- No cambiar layout ni componentes; solo el color del shell y metadatos asociados.

## Interfaces / archivos afectados
- `index.html`
- Metadatos relacionados con `theme-color` y arranque de tema.
- `src/app.js`
- Lógica de sincronización de color del shell al aplicar tema.
- `public/manifest.json`
- `theme_color` y `background_color` para PWA instalada.

No hay cambios en Firebase, datos, navegación ni estructura de componentes.

## Pruebas
- PWA instalada en Android:
- En modo oscuro, barra superior e inferior permanecen oscuras.
- En modo claro, barra superior e inferior pasan a color claro y dejan de verse negras/oscuras.
- Tras cerrar y reabrir la PWA, el tema persistido sigue reflejándose en las barras.

- Cambio de tema en runtime:
- Al alternar tema desde el menú de cuenta, `data-theme`, `localStorage['workspace_theme']` y `meta[name="theme-color"]` siguen actualizándose.
- El cambio de modo oscuro a claro se refleja también en el shell del sistema sin requerir recarga completa, salvo limitaciones propias de Android/PWA.

- Arranque en frío:
- Si `workspace_theme = light`, la primera pintura no muestra barras oscuras por un instante prolongado.
- Si no hay tema persistido, el comportamiento inicial sigue la preferencia del sistema.

- Verificación técnica:
- `pnpm build` limpio.
- Reinstalar o refrescar la PWA si Android mantiene metadatos cacheados del manifiesto anterior.

## Supuestos y decisiones cerradas
- Se prioriza el caso confirmado: PWA instalada en Android.
- El color correcto para el shell claro es el mismo color base del tema claro actual, no un blanco puro nuevo.
- No se intenta rediseñar splash screens ni iconos; solo corregir el color de barras/shell.
- Si Android conserva colores viejos por caché del manifiesto, la validación final debe incluir reinstalación o actualización de la PWA.
