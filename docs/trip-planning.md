# Planificación de viajes — Esquema y reglas

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
- `desc`: 1-2 frases breves en español. Incluir horario del sitio si es relevante, notas de opcionalidad, y contexto de comidas/meriendas en sitios adyacentes
- `link`: web oficial siempre que exista (buscar)
- `tags`: array de strings — usar: `obligatorio`, `gratis`, `reservar`, `mirador`

### Organización por días
- Optimizar rutas por zonas geográficas (no zigzaguear)
- Miradores → siempre al atardecer (incluir hora de sunset en subtitle)
- Incluir tiempos realistas de desplazamiento entre sitios
- Ritmo suave: inicio 8:30-9:00h, vuelta 21:00-22:00h

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

### Verificar horarios
- Antes de finalizar una ruta, verificar horarios de apertura de tiendas, museos y restaurantes via web search
- Anotar horarios relevantes en el `desc` de cada sitio (ej: "Sáb 11-17h")
- Marcar como opcional en `desc` los sitios que dependen del tiempo u otras condiciones
