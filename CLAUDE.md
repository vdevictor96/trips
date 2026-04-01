# Trips — Plataforma de itinerarios de viaje

## Descripción

App web estática (GitHub Pages) para visualizar itinerarios de viaje con mapa interactivo. Soporta múltiples viajes con selector, mapa Google Maps, bottom sheet con tarjetas, buscador con Google Places y enlaces a Google Maps.

## Convenciones de desarrollo

- **Mobile-first**: Todo el desarrollo y testing se hace en viewport móvil (375-414px). Desktop es secundario.
- **Google Maps**: Mapa base es Google Maps (no Leaflet). Markers custom via OverlayView. InfoWindows con HTML vanilla (no Vue) — requieren `domready` event para listeners.
- **Tema**: La app sigue el tema del sistema (`prefers-color-scheme`). Todos los colores usan CSS variables definidas en `src/styles/main.css`.
- **PWA**: Service worker con cache strategies (cache-first para fonts, network-first para datos, stale-while-revalidate para app shell). Instalable en iOS/Android.
- **API key**: `VITE_GOOGLE_API_KEY` en `.env.local` (dev) y GitHub Actions secret (deploy). Sin key la app funciona sin búsqueda Google.

## Decisiones de diseño y requisitos

### Principios UX
- Mobile-first: todo el desarrollo y testing se hace en viewport movil (375-414px) con Chrome DevTools. Desktop (768px+) es secundario.
- Interacciones tactiles optimizadas para un solo dedo
- Feedback visual inmediato en todas las acciones

### Bottom Sheet
- Dos estados: `collapsed` (140px visibles + safe-area) y `expanded` (70vh)
- Touch dragging funciona en toda la superficie de la sheet, no solo en el handle
- Si el contenido (`.sheet-body`) tiene scroll, el drag hacia abajo solo se activa cuando scrollTop=0
- La sheet se colapsa automaticamente al: clicar una card, clicar un resultado de busqueda Google
- La sheet se expande al: seleccionar un dia, buscar un sitio local

### Markers e InfoWindows
- Markers custom via `google.maps.OverlayView` (clase `HtmlMarkerClass`) con forma de lagrima (teardrop)
- Click en marker: abre InfoWindow con datos propios (nombre, hora, descripcion, enlaces) + resalta card en la lista
- InfoWindows usan HTML vanilla (no Vue) — requieren evento `domready` para añadir listeners
- Un solo InfoWindow compartido (se reutiliza, no se crean multiples)

### Flujos de interaccion
- **Click en card de la lista** → sheet se colapsa, mapa se centra en el lugar, marker se activa, InfoWindow se abre tras 850ms
- **Click en marker del mapa** → InfoWindow se abre, card en la lista se resalta con scroll
- **Busqueda Google → click en resultado** → sheet se colapsa, mapa vuela al lugar, InfoWindow muestra preview con selector de dia y boton "Añadir"
- **Busqueda local → click en resultado** → sheet se expande, mapa se centra, card se resalta

### Tema claro/oscuro
- Toggle manual con 3 modos: Claro, Sistema (default), Oscuro — componente `ThemeToggle.vue`
- Preferencia guardada en `localStorage` (`theme-preference`). Composable singleton: `useTheme.js`
- CSS variables en `src/styles/main.css` via `[data-theme="dark"]` en `<html>`
- Mapa Google Maps cambia entre DARK_STYLE y LIGHT_STYLE reactivamente via `isDark` computed
- InfoWindows usan variables CSS (`--infowindow-bg`, `--infowindow-text`, etc.)
- Script inline en `index.html` aplica el tema antes del render para evitar flash

## Estructura

```
index.html              → App genérica (sin datos hardcodeados)
trips/
  index.json            → Índice de viajes disponibles
  {trip-id}.json        → Datos de cada viaje
assets/
  {trip-id}/            → Assets específicos de cada viaje (contexto, KMLs, etc.)
.claude/
  commands/
    new-trip.md         → Skill /new-trip para generar viajes
```

## Esquema JSON de un viaje

Cada archivo `trips/{id}.json` sigue este esquema:

```json
{
  "id": "ciudad-año",
  "title": "Ciudad Año",
  "emoji": "🇪🇸",
  "city": "Ciudad",
  "country": "País",
  "dates": "DD-DD mes año",
  "mapCenter": [lat, lng],
  "mapZoom": 13,
  "hotel": {
    "lat": 0.0,
    "lng": 0.0,
    "name": "Nombre del hotel"
  },
  "dayColors": ["#f7b731", "#26de81", "#fc5c65", "#a55eea"],
  "days": [
    {
      "id": 1,
      "tab": "Día 1 · Lun 5",
      "title": "Tema del día",
      "subtitle": "Lunes 5 mayo · Detalles · 🌅 Sunset HH:MM",
      "places": [
        {
          "id": "1.1",
          "time": "10:00",
          "dur": "30 min",
          "name": "Nombre del lugar",
          "lat": 0.0,
          "lng": 0.0,
          "desc": "Descripción breve en español.",
          "tags": ["obligatorio", "gratis", "reservar", "mirador"],
          "link": "https://web-oficial.com"
        }
      ]
    }
  ],
  "info": {
    "transport": [{ "label": "...", "value": "..." }],
    "food": [{ "label": "...", "value": "..." }],
    "reservas": [{ "label": "...", "value": "..." }]
  },
  "discarded": [
    {
      "id": "d.1",
      "name": "Nombre del sitio",
      "lat": 0.0,
      "lng": 0.0,
      "desc": "Descripción del sitio descartado.",
      "reason": "Motivo por el que se descartó",
      "tags": [],
      "link": "https://web-oficial.com"
    }
  ]
}
```

## Reglas para generar viajes

### Coordenadas
- **SIEMPRE** verificar coordenadas con búsqueda web antes de añadirlas
- Usar coordenadas decimales (59.3253, 18.0711)
- Verificar especialmente museos, restaurantes y miradores — los errores son comunes

### Lugares
- Usar nombres de lugar reales, no direcciones
- Incluir emojis ⭐ en el nombre para sitios obligatorios y 🌅 para miradores
- `desc`: 1-2 frases breves en español
- `link`: web oficial siempre que exista (buscar)
- `tags`: array de strings — usar: `obligatorio`, `gratis`, `reservar`, `mirador`

### Organización por días
- Optimizar rutas por zonas geográficas (no zigzaguear)
- Miradores → siempre al atardecer (incluir hora de sunset en subtitle)
- Incluir tiempos realistas de desplazamiento entre sitios
- Ritmo suave: inicio 8:30-9:00h, vuelta 21:00-22:00h

### Tiempos de comidas (obligatorio)
- **Desayuno**: 1h mínimo (15-20 min encontrar sitio + 40-45 min comer)
- **Comida**: 1.5h mínimo, 2h si es posible
- **Merienda**: 1h obligatoria cada día (15-20 min encontrar sitio + 40-45 min merendar)

### Planificación de rutas

#### Principio walking-first
- Priorizar rutas a pie siempre que sea posible. Solo usar transporte público cuando sea imprescindible (ferry, Metro Art, distancias >40 min a pie)
- Evitar metro a las 16h (hora punta)
- Cada día empieza desde el hotel — el hotel es el punto de referencia para calcular rutas eficientes

#### Enlaces Google Maps
- Máximo 10 waypoints por enlace (limitación de Google Maps)
- Si un día tiene >9 lugares, dividir en múltiples enlaces
- El primer lugar de cada día debe incluir en `desc` cómo llegar desde el hotel

#### Regla día/noche
- Los sitios exteriores vistos de noche deben revisitarse de día en otro momento del viaje
- No aplica a: miradores (son para atardecer), sitios interiores, tiendas
- Ejemplo: Gamla Stan visitada la primera noche → volver a pasear de día otro día

#### Buffers de desplazamiento
- Estimar ~70m/min caminando en ciudad (ritmo suave de pareja)
- Añadir 5 min de margen a cada estimación de caminata
- Los tiempos de metro/tranvía incluyen: caminar a estación + espera (~3 min) + trayecto + caminar desde estación

### Colores de días
- 4 días: `["#f7b731", "#26de81", "#fc5c65", "#a55eea"]`
- 5+ días: añadir de `["#4b7bec", "#fd9644", "#2bcbba", "#eb3b5a"]`

### Info práctica
- `transport`: cómo llegar del aeropuerto y moverse por la ciudad
- `food`: comida típica local que probar
- `reservas`: sitios que requieren reserva con enlaces y fechas

### Al crear un viaje nuevo
1. Crear `trips/{id}.json` con el esquema completo
2. Actualizar `trips/index.json` añadiendo el viaje al array `trips`
3. Opcionalmente crear `assets/{id}/` con documentos de contexto
4. Commit y push a main para desplegar en GitHub Pages
