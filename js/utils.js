/**
 * @typedef Point
 * @type {{ x: number; y: number; }}
 *
 * @typedef ColorName
 * @type {typeof import('./constants.js').ColorsNames}
 */

// ======================================================================================

/**
 * The function replaces one color class with another in a marker's icon element.
 *
 * @param {L.Marker} marker - An object representing a marker on a Leaflet map.
 * @param {ColorName} color1 - The original color of the marker that you want to replace.
 * @param {ColorName} color2 - The new color that you want to replace in the marker icon.
 */
export function replaceMarkerColor(marker, color1, color2) {
  marker._icon.classList.replace(
    `awesome-number-marker-icon-${color1}`,
    `awesome-number-marker-icon-${color2}`
  );
}

/**
 * The function calculates the distance between two points in a two-dimensional space
 * using the Euclidean distance formula.
 *
 * @param {Point} p1 - The first point.
 * @param {Point} p2 - The second point.
 * @returns {number} The Euclidean distance between two points `p1` and `p2`.
 */
export function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * The function calculates the center point between two given points in a 2D plane.
 *
 * @param {Point} p1 - The first point.
 * @param {Point} p2 - The second point.
 * @returns {Point} The coordinates of the center of the segment `(p1, p2)`
 */
export function getCenter(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * The function asynchronously fetches an image from a CDN using the provided URL
 * and returns its data as an array buffer.
 *
 * @param {string} imageUrl - The URL of an image hosted on a CDN.
 * @returns {Promise<ArrayBuffer>} An `ArrayBuffer` containing the image data.
 */
export async function getImageFromCDN(imageUrl) {
  const response = await fetch(imageUrl);
  return await response.arrayBuffer();
}
