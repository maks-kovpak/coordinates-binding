import { replaceMarkerColor } from './utils.js';
import ImageCanvas from './src/ImageCanvas.js';
import NumberedPoint from './src/NumberedPoint.js';

/* Basic configuration */

const stage = new ImageCanvas('image-canvas');
stage.init();

/* Points data */

let imagePoints = [];
let mapPoints = [];

window.circleGroups = [];
window.mapMarkers = [];

/* Draw point on click */

stage.layer.on('click', () => {
  const pos = stage.layer.getRelativePointerPosition();
  const numberedPoint = new NumberedPoint(pos, imagePoints.length + 1);
  numberedPoint.rotate(-90 * numberOfRotations);

  stage.layer.add(numberedPoint);
  circleGroups.push(numberedPoint);

  imagePoints.push({
    x: Math.round((pos.x / globalImage.width) * globalImage.pixelWidth),
    y: Math.round((pos.y / globalImage.height) * globalImage.pixelHeight),
  });

  document.dispatchEvent(new CustomEvent('AddedNewPoint'));
});

/* Upload image */

const uploadImageButton = document.getElementById('upload-img-button');

uploadImageButton.addEventListener('change', (e) => {
  stage.uploadImage({
    file: e.target.files[0],
    beforeUpload: () => {
      imagePoints = [];
      mapPoints = [];
      mapMarkers.forEach((m) => map.removeLayer(m));
    },
  });

  enableMap();
});

/* Rotation */

const rotateButton = document.getElementById('rotate-btn');
let numberOfRotations = 0;

rotateButton.addEventListener('click', () => {
  const currentRotation = stage.layer.rotation();
  stage.layer.rotation(currentRotation + 90);
  numberOfRotations++;

  circleGroups.forEach((g) => {
    g.rotate(currentRotation - 90 * numberOfRotations);
  });
});

/* Leaflet */

const map = L.map('map').setView([50.45145, 30.52433], 13);

map.on('click', function (e) {
  const index = mapPoints.length;
  const marker = new L.Marker([e.latlng.lat, e.latlng.lng], {
    icon: new L.AwesomeNumberMarkers({
      number: index + 1,
      markerColor: 'red',
    }),
  });

  marker.on('mouseover', () => {
    replaceMarkerColor(marker, 'red', 'orange');
    const circle = circleGroups[index]?.find('Circle')?.at(0);
    circle?.setAttr('fill', '#F69730');
  });

  marker.on('mouseout', () => {
    replaceMarkerColor(marker, 'orange', 'red');
    const circle = circleGroups[index]?.find('Circle')?.at(0);
    circle?.setAttr('fill', '#D33D29');
  });

  marker.addTo(map);
  mapMarkers.push(marker);

  mapPoints.push({
    lat: e.latlng.lat,
    lon: e.latlng.lng,
  });

  document.dispatchEvent(new CustomEvent('AddedNewMarker'));
});

const mapElement = document.getElementById('map');

function disableMap() {
  map._handlers.forEach((handler) => handler.disable());
  mapElement.style.opacity = '0.5';
  mapElement.style.pointerEvents = 'none';
}

function enableMap() {
  map._handlers.forEach((handler) => handler.enable());
  mapElement.style.opacity = '1';
  mapElement.style.pointerEvents = 'all';
}

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

disableMap();

/* Send to server */

// TODO: modify if needed
const API_URL = `https://example.com/`;

function getFormattedData() {
  const data = [];
  const len = Math.min(imagePoints.length, mapPoints.length);

  for (let i = 0; i < len; i++) {
    data.push({ ...imagePoints[i], ...mapPoints[i] });
  }

  console.log(data);

  return data;
}

async function sendToServer() {
  const data = getFormattedData();

  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error(err);
  }
}

const sendBtn = document.getElementById('send-btn');
sendBtn.addEventListener('click', async () => {
  sendBtn.textContent = 'Sending...';
  await sendToServer();
  sendBtn.textContent = 'Ok';
});

/* Undo */

const undoImageButton = document.getElementById('undo-image-button');
const undoMapButton = document.getElementById('undo-map-button');

undoImageButton.addEventListener('click', () => {
  const circleGroup = circleGroups.pop();
  circleGroup?.remove();
  imagePoints.pop();
});

undoMapButton.addEventListener('click', () => {
  const marker = mapMarkers.pop();
  if (marker) map.removeLayer(marker);

  mapPoints.pop();
});

/* Clear */

const clearButton = document.getElementById('clear-btn');
clearButton.addEventListener('click', () => window.location.reload());

/* Show calculation error */

async function showCalculationError() {
  const data = getFormattedData();
  const field = document.getElementById('calculation-error-field');

  if (data.length <= 2) return;

  try {
    // TODO: set the correct endpoint if needed
    const response = await fetch(API_URL + '/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const calculationErrorData = await response.json();
    field.value = calculationErrorData?.value ?? 'unknown';
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('AddedNewPoint', showCalculationError);
document.addEventListener('AddedNewMarker', showCalculationError);
