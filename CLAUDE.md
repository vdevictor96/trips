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
1. **Descargar primero la versión de Firebase** (fuente de verdad — puede tener reordenaciones/edits del usuario desde la app):
   ```bash
   curl -s "https://trips-c56f5-default-rtdb.europe-west1.firebasedatabase.app/trips/{id}/data.json" > /tmp/firebase-current.json
   ```
2. Usar la versión de Firebase como BASE — aplicar cambios sobre ella, no sobre el JSON local
3. Incrementar `_v`
4. Escribir a `trips/{id}.json` y copiar a `public/trips/{id}.json`
5. **Subir a Firebase directamente** (no esperar al deploy). La escritura ahora **requiere auth** (ver § Protección de escritura), así que primero obtén un token de la cuenta compartida y pásalo como `?auth=`:
   ```bash
   ID_TOKEN=$(curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$VITE_FIREBASE_API_KEY" \
     -H 'Content-Type: application/json' \
     -d "{\"email\":\"$VITE_AUTH_EMAIL\",\"password\":\"$AUTH_PASSWORD\",\"returnSecureToken\":true}" | jq -r .idToken)
   curl -s -X PUT "https://trips-c56f5-default-rtdb.europe-west1.firebasedatabase.app/trips/{id}/data.json?auth=$ID_TOKEN" -d @trips/{id}.json
   ```
   (La lectura del paso 1 sigue siendo pública, no necesita token.)
6. Commit y push

## Protección de escritura (Firebase Auth)

`/trips/$id` era **escribible por cualquiera sin autenticación** (un `curl -X PUT` anónimo bastaba para sobreescribir o borrar viajes). Para cerrarlo:

- **Reglas** (`database.rules.json`): lectura pública, `".write": "auth != null"`. Desplegar en Firebase Console → Realtime Database → Rules.
- **La app exige login** (cuenta compartida Email/Password, sesión persistente). Solo usuarios autenticados pueden escribir; ver `src/composables/useAuth.js` y `LoginGate.vue`.
- La lectura sigue pública: el JSON estático del deploy y el repo (público) **también** exponen los datos. Esto cierra la escritura, no la lectura.

### Setup manual en la consola de Firebase (una vez)
1. **Authentication → Sign-in method**: habilitar **Email/Password**.
2. **Authentication → Users**: añadir usuario con el email de `VITE_AUTH_EMAIL` y la contraseña que usaréis.
3. **Realtime Database → Rules**: pegar el contenido de `database.rules.json` y publicar.
4. Definir **`VITE_AUTH_EMAIL`** en `.env.local` (dev) y como **secret de GitHub** `VITE_AUTH_EMAIL` (deploy, ya cableado en `deploy.yml`).
