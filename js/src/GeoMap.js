import { replaceMarkerColor } from '../utils.js';
import { ColorsNames, ColorsValues } from '../constants.js';

const Leaflet = window.L;

class GeoMap {
  constructor(id, viewCenter) {
    this.instance = Leaflet.map(id).setView(viewCenter, 13);
    this.container = document.getElementById(id);
    this.init();
  }

  init() {
    const tilesUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    Leaflet.tileLayer(tilesUrl, { maxZoom: 19 }).addTo(this.instance);
    this.instance.on('click', (e) => this._onClick(e));
    this.disable();
  }

  enable() {
    this.instance._handlers.forEach((handler) => handler.enable());
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'all';
  }

  disable() {
    this.instance._handlers.forEach((handler) => handler.disable());
    this.container.style.opacity = '0.5';
    this.container.style.pointerEvents = 'none';
  }

  removeMarkers() {
    markers.forEach((m) => this.instance.removeLayer(m));
  }

  _onClick(e) {
    const index = markers.length;

    // Create a new marker
    const marker = new Leaflet.Marker([e.latlng.lat, e.latlng.lng], {
      icon: new Leaflet.AwesomeNumberMarkers({
        number: index + 1,
        markerColor: ColorsNames.Red,
      }),
    });

    // Highlight the marker and the corresponding point on hover
    marker.on('mouseover', () => {
      replaceMarkerColor(marker, ColorsNames.Red, ColorsNames.Orange);
      const circle = points[index]?.circle;
      circle?.setAttr('fill', ColorsValues.Orange);
    });

    // Remove highlight on mouse leave
    marker.on('mouseout', () => {
      replaceMarkerColor(marker, ColorsNames.Orange, ColorsNames.Red);
      const circle = points[index]?.circle;
      circle?.setAttr('fill', ColorsValues.Red);
    });

    // Display marker
    marker.addTo(this.instance);
    markers.push(marker);

    // Push geographic coordinates to a global array
    geoCoordinates.push({
      lat: e.latlng.lat,
      lon: e.latlng.lng,
    });

    // Notify about changes (added new marker)
    document.dispatchEvent(new CustomEvent('AddedNewMarker'));
  }
}

export default GeoMap;
