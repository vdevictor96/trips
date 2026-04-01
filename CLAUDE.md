# Trips — Plataforma de itinerarios de viaje

App web estática (GitHub Pages) para visualizar itinerarios de viaje con mapa interactivo. Vue 3, Google Maps, bottom sheet, PWA.

## Convenciones

- **Mobile-first**: viewport 375-414px. Desktop secundario.
- **Google Maps**: markers custom via OverlayView. InfoWindows con HTML vanilla (requieren `domready`).
- **Tema**: CSS variables en `src/styles/main.css`. `prefers-color-scheme` + toggle manual.
- **PWA**: Service worker en `public/sw.js`. Cache-first fonts, network-first datos, stale-while-revalidate shell.
- **API key**: `VITE_GOOGLE_API_KEY` en `.env.local` (dev) y GitHub Actions secret (deploy).

## Estructura

```
index.html              → App genérica
trips/
  index.json            → Índice de viajes
  {trip-id}.json        → Datos de cada viaje
public/trips/           → Copia sincronizada (deploy)
assets/{trip-id}/       → Contexto, KMLs, etc.
docs/                   → Documentación detallada (ver índice abajo)
.claude/commands/       → Skills (ej: /new-trip)
```

## Documentación detallada (leer bajo demanda)

| Archivo | Cuándo leer |
|---|---|
| `docs/ux-design.md` | Al modificar componentes Vue, bottom sheet, markers, InfoWindows o tema |
| `docs/trip-planning.md` | Al crear o editar viajes: esquema JSON, reglas de rutas, tiempos, coordenadas |

## Versionado y sincronización (`_v`)

La app carga datos: Firebase → localStorage → JSON estático. Para que los cambios desde git ganen:

- Cada JSON de viaje tiene `"_v": N` (versión incremental)
- Si el JSON estático tiene `_v` mayor que Firebase → la app usa el estático y lo sube a Firebase
- **SIEMPRE incrementar `_v` al editar un JSON de viaje desde git**
- **SIEMPRE copiar `trips/{id}.json` → `public/trips/{id}.json`** tras editar

### Al crear un viaje nuevo
1. Crear `trips/{id}.json` con `"_v": 1` (ver esquema en `docs/trip-planning.md`)
2. Actualizar `trips/index.json`
3. Copiar a `public/trips/`
4. Commit y push

### Al editar un viaje existente
1. Editar `trips/{id}.json`
2. Incrementar `_v`
3. Copiar a `public/trips/{id}.json`
4. Commit y push
