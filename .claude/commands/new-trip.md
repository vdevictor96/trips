Genera un nuevo viaje para la plataforma de itinerarios.

El objetivo es que Víctor no tenga que repetir el preámbulo de cada viaje: el perfil de la pareja
ya está en `docs/trip-planning.md` (§ Perfil de viajeros) y aquí está el método. Saca solo lo que
puedas leer; pregunta solo lo que no puedas saber; decide el resto con criterio y deja las
decisiones dudosas en `info.pendientes` para que las revisen en la app.

## Proceso

### 1. Recopilar lo que ya existe (sin preguntar)
- **Vuelos**: Gmail (`Ryanair`, `vuelo`, `itinerary`, nombre del destino o código IATA) y Google
  Calendar. Anota número de vuelo, hora de llegada y de salida. Un retraso puede estar en un correo
  posterior (en Gdańsk, el aviso de llegada tardía al alojamiento tenía la hora buena).
- **Alojamiento**: correo de Booking/Airbnb → dirección exacta, check-in/check-out, caja de llaves,
  mensajes del anfitrión (p. ej. check-in tardío aprobado).
- **Lista de sitios**: suele ser una captura del Wanderlog. Si la captura es pequeña, recórtala y
  amplíala; los nombres borrosos se resuelven buscando candidatos en OpenStreetMap (Overpass con
  regex sobre el bbox de la ciudad). Las **notas** de la lista («¿merece la pena?», «típico pero no
  me interesa», «subir al mirador») son instrucciones: respétalas. Lo que no consigas leer, pregúntalo
  al final, no lo inventes.
- **Viajes anteriores**: mira el JSON del último viaje para copiar estructura y tono.

### 2. Preguntar solo lo que falte (una ronda, corta)
1. ¿Dónde os alojáis? (si no está en el correo)
2. ¿Qué tipo de viaje es? Navidad/invierno · verano/playa · ciudad para ver · naturaleza.
3. ¿Hay algo que sí o sí, o algo que ya sepáis que no?
4. ¿Hay restricciones nuevas (otra persona, coche, presupuesto, días con horario fijo)?

Duración, horas de llegada y salida se sacan de los vuelos. Todo lo demás lo decides tú con el perfil.

### 3. Investigar, en este orden
- **Luz**: amanecer y puesta de cada día (calcúlalo). En invierno manda: exterior con luz,
  interiores, cafés y mercadillos al oscurecer.
- **Temporada**: qué está cerrado o no opera en esas fechas. Barcos turísticos, norias, torres
  mirador y jardines suelen ser de temporada; los mercadillos de Navidad tienen fechas y horario
  propios. Busca la página oficial de la temporada, no la de verano.
- **Días de cierre**: lunes de museos, cierres puntuales (el Museo de Gdańsk avisaba de que Artus
  cerraba justo el sábado del viaje: está en la portada de su web, no en la ficha), domingos sin
  comercio (Polonia), festivos.
- **Excursión fuera de la ciudad**: si la lista sugiere una, compara opciones por tiempo de
  transporte real, si dependen del tiempo, último acceso y luz. Lo que funciona llueva o no
  (castillo, museo) va en día fijo; lo que depende del tiempo (playa) va como **día ALT** (ver abajo).
- **Planes autóctonos**: Maitena los pide siempre. Comida típica, la cantina local (bar mleczny),
  eventos de esas fechas (programa del mercadillo, conciertos), barco si opera.
- **Horarios de museos e iglesias**: siempre en la web oficial, sitio por sitio, y por días de la
  semana (no supongas «cierra los lunes»: el Museo de Gdańsk cierra los martes). Muchas webs cargan
  los horarios con JavaScript: si `curl` no los trae, ábrelas en el navegador. Mira también los
  servicios dentro del sitio (la biblioteca del ECS cerraba en domingo aunque el museo abriera).
  Anota en la tarjeta el horario del día concreto y la última entrada.
- **Previsión**: si el viaje es en menos de 10 días, consulta **meteoblue** (vista semanal: máx/mín,
  viento, horas de sol y previsibilidad) y anótalo con la fecha. Úsalo para colocar cada plan: lo de
  interior el día cubierto y lo que depende del sol (playa, miradores) el día despejado.
- **Tarjeta turística**: haz la cuenta con las entradas que de verdad hay en el plan.

Fuentes: web oficial primero; para cafés y restaurantes, **la ficha de Google Maps** abierta en el
navegador (rechazar cookies; la vista limitada muestra horario semanal, nota y si está «Cerrado
permanentemente/temporalmente»). OSM sirve para coordenadas, no para horarios: en Gdańsk tenía mal
el horario de Leń y no sabía que dos sitios de la lista estaban cerrados. Blogs solo como último
recurso y diciéndolo. Si algo no se puede confirmar, escríbelo así en el `desc` («no he podido
confirmarlo») en vez de afirmarlo.
- **Repaso final contra la lista del usuario**: cada sitio de la captura debe estar en un día, en
  una colección o en descartados con su motivo; los nombres dudosos se buscan, no se adivinan.
- **Eventos con hora** (conciertos, cantos, desfiles): busca el programa oficial del organizador,
  no la nota de prensa; los lugares y horas pueden diferir.

### 4. Organizar por días
Las reglas de ritmo, comidas, miradores, día/noche y walking-first están en
`docs/trip-planning.md`. Además:
- **Comprueba cada tramo a pie** con distancia real: haversine × 1,3 a 70 m/min + 5 min. Si un tramo
  no cabe en el hueco, mueve horas; no lo dejes «justo».
- **Puesta de sol**: un mirador por día como mucho, y el que mejor caiga en la ruta.
- **Lo que depende del tiempo o de algo sin confirmar** (barco, noria, playa) lleva su plan B escrito
  en la misma tarjeta o en la siguiente.
- **Días ALT**: un día alternativo es otra entrada en `days` con `id` nuevo y tab
  `Día N · Xxx · ALT ☀️` (o ☔), justo después del día al que sustituye. Ejemplos: NY 2026, Gdańsk 2026.
- **Último día**: check-out, maletas y hora de salir al aeropuerto. Pide al anfitrión dejar las
  maletas y ofrece consigna como plan B.
- Lo que no cabe va a `discarded` con un `reason` honesto (por qué no, y en qué caso entraría).

### 5. Generar el JSON
- Esquema y reglas de campos en `docs/trip-planning.md`. Textos de `desc`, `reason` y `subtitle` en
  texto plano; el HTML solo en `info.*.value`.
- Coordenadas: Nominatim con `viewbox` + `bounded=1`, u Overpass. Nunca inventadas; si no aparece,
  usa el sitio verificado más cercano y dilo en el `desc`.
- Sitios de `restaurants`/`cafes` que ya estén en un día **no** se repiten en la colección (saldrían
  dos pines en el mismo punto).
- `info` que se muestra en la app: `pendientes`, `transport`, `reservas`, `temporada`, `food`, `avisos`
  (lista en `InfoPanel.vue`). En `food` incluye dulces típicos y dónde comprarlos.
- `mapsQuery` en cada sitio con nombre descriptivo o fuera de la ciudad (ver `docs/trip-planning.md`).
- Para viajes largos es cómodo generar el JSON con un script que lleve las coordenadas en una tabla
  y que imprima los tramos a pie para revisarlos.
- ID: `{ciudad-en-minusculas}-{año}` (`gdansk-2026`). `_v: 1`.
- Actualiza `trips/index.json` y copia los dos ficheros a `public/trips/`.

### 6. Verificar en local
- `preview_start` con la configuración `trips-dev` de `.claude/launch.json` y vista móvil.
- La app pide login (cuenta compartida). La contraseña no se teclea desde el agente: pide a Víctor
  que inicie sesión en el panel del navegador; la sesión persiste.
- Revisa cada día, los pines, la ficha de Info y los descartados. `npm run build` debe pasar.
- Si tocaste un componente, sube `CACHE_NAME` en `public/sw.js`.

### 7. Publicar
Cuando Víctor dé el visto bueno: commit y push a main, y siembra Firebase (CLAUDE.md, paso 5) para que
el viaje se vea en los móviles que ya tienen la web cacheada.

## Importante
- Idioma: todo el contenido en **español**.
- Coordenadas y días de la semana verificados: son los errores más comunes y los más graves.
- Nada genérico: cada `desc` dice algo útil de ese sitio (horario, precio, por qué a esa hora).
- Al terminar, resume a Víctor las decisiones tomadas y lo que queda por confirmar.
