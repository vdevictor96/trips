# Planificación de viajes — Esquema y reglas

## Perfil de viajeros

Preferencias transversales del viajero — aplican a **todos los viajes** salvo que se indique lo contrario.

- **En pareja, ritmo suave y relajado.**
- **Walking-first**: priorizar ir a pie; transporte público solo si es imprescindible (detalle en § Planificación de rutas).
- **Horario del día**: salir 8:30-9:00h, volver 21:00-22:00h.
- **Miradores → siempre al atardecer.**
- **Regla día/noche**: todo lo exterior que se vea de noche debe revisitarse de día en otro momento del viaje. No aplica a miradores (son para atardecer), sitios interiores ni tiendas.

## Esquema JSON de un viaje

Cada archivo `trips/{id}.json` sigue este esquema:

```json
{
  "_v": 1,
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
          "link": "https://web-oficial.com",
          "googlePlaceId": "ChIJ... (opcional, ver § Enlaces Google Maps)"
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
- `desc`: 1-2 frases breves en español. Incluir horario del sitio si es relevante, notas de opcionalidad, y contexto de comidas/meriendas en sitios adyacentes
- `link`: web oficial siempre que exista (buscar)
- `tags`: array de strings — usar: `obligatorio`, `gratis`, `reservar`, `mirador`
- `googlePlaceId` (opcional): Place ID de Google para que el botón "📍 Google Maps" seleccione el sitio exacto en vez de adivinar por el nombre (ver § Enlaces Google Maps)

### Organización por días
- Optimizar rutas por zonas geográficas (no zigzaguear)
- Miradores → siempre al atardecer (incluir hora de sunset en subtitle)
- Incluir tiempos realistas de desplazamiento entre sitios

### Tiempos de comidas (obligatorio)
- **Desayuno**: 1h mínimo (15-20 min encontrar sitio + 40-45 min comer). Anotar en desc del primer sitio del día.
- **Comida**: 1.5h mínimo, 2h si es posible. Puede ser lugar propio o nota en sitio adyacente.
- **Merienda**: 1h obligatoria cada día (15-20 min encontrar sitio + 40-45 min merendar)
- **Cena**: anotar en desc del último sitio del día o como lugar propio si hay reserva.

### Planificación de rutas

#### Principio walking-first
- Priorizar rutas a pie siempre que sea posible. Solo usar transporte público cuando sea imprescindible (ferry, Metro Art, distancias >40 min a pie)
- Evitar metro a las 16h (hora punta)
- Cada día empieza desde el hotel — el hotel es el punto de referencia para calcular rutas eficientes

#### Enlaces Google Maps
- **El primer punto de la ruta es siempre el hotel.** `getDirectionsURLs()` (`src/composables/useDirections.js`) antepone el hotel como origen de cada ruta —y como origen de la primera parte cuando se divide en varias—, ocupando 1 de los 10 waypoints. Por eso **todo viaje debe definir `hotel` con `name`, `lat` y `lng`** en el JSON; sin `hotel`, la ruta arrancaría desde el primer lugar del día.
- Máximo 10 waypoints por enlace de ruta (limitación de Google Maps)
- Si un día tiene >9 lugares, dividir en múltiples enlaces
- El primer lugar de cada día debe incluir en `desc` cómo llegar desde el hotel

##### Botón "📍 Google Maps" por sitio (selección exacta)
El enlace de cada lugar lo construye **una sola función compartida** — `buildGmapUrl()` en
`src/composables/useMap.js` — así que cualquier viaje nuevo hereda el comportamiento sin tocar
nada por viaje. La usan las cards, los descartados y los InfoWindows del mapa.

- Por defecto genera `https://www.google.com/maps/search/?api=1&query=<nombre>, <ciudad>` (**texto, nunca `@coordenadas`**). El query por texto puede caer en el sitio equivocado cuando el nombre es ambiguo.
- Si el lugar tiene `googlePlaceId`, se añade `&query_place_id=<id>` y Maps **selecciona el sitio exacto** (no adivina). Si el ID fuese inválido, Maps cae de vuelta al query de texto, así que es seguro.
- Los lugares **añadidos desde la app** (búsqueda Google o clic en un POI del mapa) ya guardan `googlePlaceId` automáticamente.
- Para lugares **escritos a mano en el JSON**, `googlePlaceId` es opcional pero recomendado en sitios con nombre ambiguo. Cómo obtenerlo: buscar el sitio en [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id) (empieza por `ChIJ...`). Sin él, el botón sigue funcionando con el query de texto.

#### Regla día/noche
- Regla completa en **§ Perfil de viajeros** (inicio del documento).
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

### Verificar horarios
- Antes de finalizar una ruta, verificar horarios de apertura de tiendas, museos y restaurantes via web search
- Anotar horarios relevantes en el `desc` de cada sitio (ej: "Sáb 11-17h")
- Marcar como opcional en `desc` los sitios que dependen del tiempo u otras condiciones
