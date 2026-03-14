/**
 * geo.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilidades de geolocalización para validar geocercas (geofencing).
 * Usa la fórmula de Haversine para calcular la distancia entre dos coordenadas
 * geográficas sobre la superficie terrestre.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const RADIO_TIERRA_METROS = 6_371_000; // Radio medio de la Tierra en metros

/**
 * calcularDistancia
 * Calcula la distancia en metros entre dos puntos geográficos
 * usando la fórmula de Haversine.
 *
 * @param {number} lat1  - Latitud del punto 1 (grados decimales)
 * @param {number} lon1  - Longitud del punto 1 (grados decimales)
 * @param {number} lat2  - Latitud del punto 2 (grados decimales)
 * @param {number} lon2  - Longitud del punto 2 (grados decimales)
 * @returns {number}     - Distancia en metros
 */
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return RADIO_TIERRA_METROS * c;
};

/**
 * dentroDeGeocerca
 * Determina si una coordenada está dentro del radio de una geocerca circular.
 *
 * @param {object} geocerca          - Objeto con { latitud, longitud, radio }
 * @param {number} geocerca.latitud  - Latitud del centro de la geocerca
 * @param {number} geocerca.longitud - Longitud del centro de la geocerca
 * @param {number} geocerca.radio    - Radio permitido en metros
 * @param {number} latActual         - Latitud actual del usuario
 * @param {number} lonActual         - Longitud actual del usuario
 * @returns {{ dentro: boolean, distancia: number }}
 *   dentro    → true si el usuario está dentro de la geocerca
 *   distancia → distancia en metros al centro de la geocerca
 */
const dentroDeGeocerca = (geocerca, latActual, lonActual) => {
  const distancia = calcularDistancia(
    geocerca.latitud,
    geocerca.longitud,
    latActual,
    lonActual
  );
  return {
    dentro: distancia <= geocerca.radio,
    distancia: Math.round(distancia),
  };
};

module.exports = { calcularDistancia, dentroDeGeocerca };
