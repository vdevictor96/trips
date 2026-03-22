Genera un nuevo viaje para la plataforma de itinerarios.

## Proceso

### 1. Recopilar contexto
Pregunta al usuario por:
- **Destino**: ciudad y país
- **Fechas**: de llegada y salida
- **Hotel**: nombre y ubicación
- **Estilo**: ritmo de viaje, preferencias (paseos, museos, gastronomía, etc.)
- **Obligatorio**: sitios que SÍ o SÍ quieren visitar
- **Opcional**: sitios que consideran pero pueden descartar
- **Restricciones**: presupuesto, movilidad, horarios fijos

### 2. Investigar el destino
Para CADA lugar del itinerario:
- Buscar en web las **coordenadas exactas** (lat, lng) — NO inventar coordenadas
- Buscar la **web oficial** del sitio (si existe)
- Verificar **horarios de apertura** y días de entrada gratuita
- Buscar la **hora de sunset** para las fechas del viaje
- Verificar las opciones de **transporte** (aeropuerto → centro, metro, bus, etc.)
- Investigar **comida típica** local

### 3. Organizar por días
- Agrupar sitios por **zona geográfica** — evitar zigzag
- **Miradores** siempre al atardecer
- Incluir **tiempos de desplazamiento** realistas entre sitios
- Asignar **duraciones** realistas a cada visita
- Incluir huecos para desayuno (45-60min) y merienda (30-45min)
- Ritmo suave: salir 8-9h, volver 21-22h

### 4. Generar el JSON
Lee el archivo CLAUDE.md del proyecto para ver el esquema exacto. Genera:
- `trips/{ciudad}-{año}.json` con todos los datos del viaje
- Actualizar `trips/index.json` añadiendo el viaje al array

### 5. Verificar
- Revisar que TODAS las coordenadas son correctas (no usar coordenadas inventadas)
- Revisar que los enlaces web funcionan
- Comprobar que el JSON es válido
- Commit y push a main

## Formato del ID
`{ciudad-en-minusculas}-{año}` — ejemplo: `roma-2026`, `paris-2025`, `tokio-2027`

## Importante
- Idioma: todo el contenido en **español**
- Coordenadas: **SIEMPRE** verificar con búsqueda web. Es el error más común y el más grave
- No generar contenido genérico — cada descripción debe ser específica y útil
- Incluir detalles prácticos: precios, horarios, tips, advertencias
