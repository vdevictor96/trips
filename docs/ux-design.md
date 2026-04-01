# Decisiones de diseño y UX

## Principios UX
- Mobile-first: todo el desarrollo y testing se hace en viewport movil (375-414px) con Chrome DevTools. Desktop (768px+) es secundario.
- Interacciones tactiles optimizadas para un solo dedo
- Feedback visual inmediato en todas las acciones

## Bottom Sheet
- Dos estados: `collapsed` (140px visibles + safe-area) y `expanded` (70vh)
- Touch dragging funciona en toda la superficie de la sheet, no solo en el handle
- Si el contenido (`.sheet-body`) tiene scroll, el drag hacia abajo solo se activa cuando scrollTop=0
- La sheet se colapsa automaticamente al: clicar una card, clicar un resultado de busqueda Google
- La sheet se expande al: seleccionar un dia, buscar un sitio local

## Markers e InfoWindows
- Markers custom via `google.maps.OverlayView` (clase `HtmlMarkerClass`) con forma de lagrima (teardrop)
- Click en marker: abre InfoWindow con datos propios (nombre, hora, descripcion, enlaces) + resalta card en la lista
- InfoWindows usan HTML vanilla (no Vue) — requieren evento `domready` para añadir listeners
- Un solo InfoWindow compartido (se reutiliza, no se crean multiples)

## Flujos de interaccion
- **Click en card de la lista** → sheet se colapsa, mapa se centra en el lugar, marker se activa, InfoWindow se abre tras 850ms
- **Click en marker del mapa** → InfoWindow se abre, card en la lista se resalta con scroll
- **Busqueda Google → click en resultado** → sheet se colapsa, mapa vuela al lugar, InfoWindow muestra preview con selector de dia y boton "Añadir"
- **Busqueda local → click en resultado** → sheet se expande, mapa se centra, card se resalta

## Tema claro/oscuro
- Toggle manual con 3 modos: Claro, Sistema (default), Oscuro — componente `ThemeToggle.vue`
- Preferencia guardada en `localStorage` (`theme-preference`). Composable singleton: `useTheme.js`
- CSS variables en `src/styles/main.css` via `[data-theme="dark"]` en `<html>`
- Mapa Google Maps cambia entre DARK_STYLE y LIGHT_STYLE reactivamente via `isDark` computed
- InfoWindows usan variables CSS (`--infowindow-bg`, `--infowindow-text`, etc.)
- Script inline en `index.html` aplica el tema antes del render para evitar flash
