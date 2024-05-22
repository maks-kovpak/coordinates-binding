import ImageCanvas from './src/ImageCanvas.js';
import NumberedPoint from './src/NumberedPoint.js';
import GeoMap from './src/Map.js';

/* Global data */

window.imagePoints = [];
window.mapPoints = [];
window.circleGroups = [];
window.mapMarkers = [];

/* Canvas */

const stage = new ImageCanvas('image-canvas');
stage.init();

/* Map */

const map = new GeoMap('map', [50.45145, 30.52433]);
map.init();

/* Draw point on click */

stage.layer.on('click', () => {
  const pos = stage.layer.getRelativePointerPosition();
  const numberedPoint = new NumberedPoint(pos, imagePoints.length + 1);
  numberedPoint.rotate(-90 * numberOfRotations);

  stage.layer.add(numberedPoint);
  circleGroups.push(numberedPoint);

  imagePoints.push({
    x: Math.round((pos.x / stage.imageData.width) * stage.imageData.pixelWidth),
    y: Math.round((pos.y / stage.imageData.height) * stage.imageData.pixelHeight),
  });

  document.dispatchEvent(new CustomEvent('AddedNewPoint'));
});

/* Upload image */

const uploadImageButton = document.getElementById('upload-img-button');

uploadImageButton.addEventListener('change', (e) => {
  window.imagePoints = [];
  window.mapPoints = [];
  map.removeMarkers();

  if (e.target.files.length) {
    stage.uploadImage({ file: e.target.files[0] });
    map.enable();
  }
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
