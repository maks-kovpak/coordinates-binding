import { replaceMarkerColor } from '../utils.js';

const Leaflet = window.L;

class GeoMap {
  constructor(id, viewCenter) {
    this.instance = Leaflet.map(id).setView(viewCenter, 13);
    this.container = document.getElementById(id);
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
    mapMarkers.forEach((m) => this.instance.removeLayer(m));
  }

  _onClick(e) {
    const index = mapPoints.length;
    const marker = new Leaflet.Marker([e.latlng.lat, e.latlng.lng], {
      icon: new Leaflet.AwesomeNumberMarkers({
        number: index + 1,
        markerColor: 'red',
      }),
    });

    marker.on('mouseover', () => {
      replaceMarkerColor(marker, 'red', 'orange');
      const circle = circleGroups[index]?.findOne('Circle');
      circle?.setAttr('fill', '#F69730');
    });

    marker.on('mouseout', () => {
      replaceMarkerColor(marker, 'orange', 'red');
      const circle = circleGroups[index]?.findOne('Circle');
      circle?.setAttr('fill', '#D33D29');
    });

    marker.addTo(this.instance);
    mapMarkers.push(marker);

    mapPoints.push({
      lat: e.latlng.lat,
      lon: e.latlng.lng,
    });

    document.dispatchEvent(new CustomEvent('AddedNewMarker'));
  }
}

export default GeoMap;
