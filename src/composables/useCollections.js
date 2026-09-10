// Secciones transversales del viaje (Restauración, Cafeterías, Playas).
//
// Cada entrada define UNA sola vez todo lo que la app necesita de esa sección:
// pestaña, panel, color, markers, overlay y etiqueta en el buscador. Antes esto
// estaba copiado para `restaurants` y `cafes` en 8 ficheros (dos paneles de 56
// líneas que diferían en 5), así que añadir una tercera sección obligaba a una
// tercera copia de todo.
//
// Hay dos tipos de sección, y la diferencia importa:
//
//   · `key`   → colección PROPIA guardada en el JSON del viaje (restaurants,
//               cafes). Sus sitios no viven en ningún día, así que necesitan sus
//               propios markers y entran en `allPlaces` para el buscador.
//
//   · `match` → índice DERIVADO sobre sitios que YA existen en días/descartados
//               (playas). No duplica datos: son los mismos objetos, así que
//               editar una playa en su día actualiza la sección sola. Por eso
//               tampoco crea markers nuevos (reutiliza los del día/descartados,
//               que ya están en el mapa) ni se añade a `allPlaces` (saldría dos
//               veces en la búsqueda).

export const COLLECTIONS = [
  {
    id: 'restaurants',
    key: 'restaurants',
    label: 'Restauración',
    emoji: '🍴',
    color: '#e67e22',
    countLabel: 'ideas',
    blurb: 'Sitios para comer (mapa con markers)',
    subtitle: 'Sitios para comer (ideas del Wanderlog). Toca para verlo en el mapa.',
    groupBy: p => p.cat || 'Otros',
  },
  {
    id: 'cafes',
    key: 'cafes',
    label: 'Cafeterías',
    emoji: '☕',
    color: '#8d6e63',
    countLabel: 'sitios',
    blurb: 'Café de especialidad (mapa con markers)',
    subtitle: 'Sitios de café de especialidad (por zonas). Toca para verlo en el mapa.',
    groupBy: p => p.cat || 'Otros',
  },
  {
    id: 'beaches',
    match: p => (p.tags || []).includes('playa'),
    label: 'Playas y charcos',
    emoji: '🏖️',
    color: '#0abde3',
    countLabel: 'sitios',
    blurb: 'Dónde bañarse, de día y de descartados',
    subtitle: 'Todos los sitios de baño del viaje: playas, charcos y piscinas naturales. Siguen estando en su día o en descartados — esto es solo un índice para localizarlos de un vistazo.',
    groupBy: p => p._from || 'Otros',
  },
]

export const DERIVED_COLLECTIONS = COLLECTIONS.filter(c => c.match)
export const STORED_COLLECTIONS = COLLECTIONS.filter(c => c.key)

export function getCollection(id) {
  return COLLECTIONS.find(c => c.id === id) || null
}

export function isCollectionId(id) {
  return COLLECTIONS.some(c => c.id === id)
}

// Sitios de una sección. Para las derivadas añade `_from` (el día del que viene)
// para poder agruparlos y decir de un vistazo dónde vive cada uno.
export function collectionPlaces(collection, trip) {
  if (!trip || !collection) return []
  if (collection.key) return trip[collection.key] || []

  const out = []
  for (const day of trip.days || []) {
    for (const p of day.places || []) {
      if (collection.match(p)) out.push({ ...p, _from: day.tab || `Día ${day.id}` })
    }
  }
  for (const p of trip.discarded || []) {
    if (collection.match(p)) out.push({ ...p, _from: 'Descartados' })
  }
  return out
}

// Ids de los sitios que entran en una sección derivada. `updateVisibleLayers` lo
// usa para encender los markers que YA existen en vez de crear duplicados.
export function derivedPlaceIds(collection, trip) {
  return new Set(collectionPlaces(collection, trip).map(p => p.id))
}
