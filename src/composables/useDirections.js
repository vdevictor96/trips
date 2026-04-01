export function useDirections() {
  function makeDirectionsURL(places, city) {
    if (places.length === 0) return ''
    // Use place names (like individual place buttons) so Google Maps resolves to the actual place
    const stops = places.map(p => {
      const q = city ? `${p.name}, ${city}` : p.name
      return encodeURIComponent(q)
    }).join('/')
    return `https://www.google.com/maps/dir/${stops}/data=!4m2!4m1!3e2`
  }

  function getDirectionsURLs(places, hotel, city) {
    if (!places || places.length === 0) return []
    // Prepend hotel as origin so every route starts from the hotel
    const allPoints = hotel
      ? [{ name: hotel.name || 'Hotel', lat: hotel.lat, lng: hotel.lng }, ...places]
      : places
    // Google Maps web URLs support ~10 waypoints reliably (origin + dest + 8 intermediate)
    const MAX_POINTS = 10
    if (allPoints.length <= MAX_POINTS) {
      return [{ url: makeDirectionsURL(allPoints, city), label: 'Abrir ruta del día en Google Maps', from: 1, to: places.length }]
    }
    // Split into chunks with 1 overlap — hotel is always origin of first chunk
    const chunks = []
    let start = 0
    while (start < allPoints.length) {
      const end = Math.min(start + MAX_POINTS, allPoints.length)
      chunks.push({
        places: allPoints.slice(start, end),
        from: start === 0 ? 1 : start,
        to: hotel ? end - 1 : end,
      })
      start = end - 1 // overlap by 1
      if (start >= allPoints.length - 1) break
    }
    return chunks.map((chunk, i) => ({
      url: makeDirectionsURL(chunk.places, city),
      label: `Ruta parte ${i + 1} (sitios ${chunk.from}-${chunk.to})`,
      from: chunk.from,
      to: chunk.to,
    }))
  }

  return { makeDirectionsURL, getDirectionsURLs }
}
