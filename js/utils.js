export function replaceMarkerColor(marker, color1, color2) {
  marker._icon.classList.replace(
    `awesome-number-marker-icon-${color1}`,
    `awesome-number-marker-icon-${color2}`
  );
}

export function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function getCenter(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}
