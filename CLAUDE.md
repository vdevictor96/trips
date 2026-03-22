# Trips — Plataforma de itinerarios de viaje

## Descripción

App web estática (GitHub Pages) para visualizar itinerarios de viaje con mapa interactivo. Soporta múltiples viajes con selector, mapa Leaflet, bottom sheet con tarjetas, buscador y enlaces a Google Maps.

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
- Ritmo suave: 8-9h de inicio, 21-22h de vuelta
- Reservar 45-60min para desayuno, 30-45min para merienda

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
