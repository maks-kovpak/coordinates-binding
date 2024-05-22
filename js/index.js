import ImageCanvas from './src/ImageCanvas.js';
import NumberedPoint from './src/NumberedPoint.js';
import GeoMap from './src/GeoMap.js';

/* Global data */

window.pixelCoordinates = [];
window.geoCoordinates = [];

window.points = [];
window.markers = [];

const canvas = new ImageCanvas('image-canvas');
const map = new GeoMap('map', [50.45145, 30.52433]);

/* Draw point on click */

canvas.layer.on('click', () => {
  const pos = canvas.layer.getRelativePointerPosition();
  const numberedPoint = new NumberedPoint(pos, pixelCoordinates.length + 1);
  numberedPoint.rotate(-90 * numberOfRotations);

  canvas.layer.add(numberedPoint);
  points.push(numberedPoint);

  pixelCoordinates.push({
    x: Math.round((pos.x / canvas.imageData.width) * canvas.imageData.pixelWidth),
    y: Math.round((pos.y / canvas.imageData.height) * canvas.imageData.pixelHeight),
  });

  document.dispatchEvent(new CustomEvent('AddedNewPoint'));
});

/* Upload image */

const uploadImageButton = document.getElementById('upload-img-button');

uploadImageButton.addEventListener('change', (e) => {
  window.pixelCoordinates = [];
  window.geoCoordinates = [];
  map.removeMarkers();

  if (e.target.files.length) {
    canvas.uploadImage({ file: e.target.files[0] });
    map.enable();
  }
});

/* Rotation */

const rotateButton = document.getElementById('rotate-btn');
let numberOfRotations = 0;

rotateButton.addEventListener('click', () => {
  const currentRotation = canvas.layer.rotation();
  canvas.layer.rotation(currentRotation + 90);
  numberOfRotations++;

  points.forEach((g) => {
    g.rotate(currentRotation - 90 * numberOfRotations);
  });
});

/* Send to server */

// TODO: modify if needed
const API_URL = `https://example.com/`;

function getFormattedData() {
  const data = [];
  const len = Math.min(pixelCoordinates.length, geoCoordinates.length);

  for (let i = 0; i < len; i++) {
    data.push({ ...pixelCoordinates[i], ...geoCoordinates[i] });
  }

  console.log(data);

  return data;
}

async function sendToServer() {
  const data = getFormattedData();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });

    // Redirect to url sent by server
    const responseData = await response.json();
    window.location.replace(responseData.url);
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

const undoButton = document.getElementById('undo-button');

function removeLastPoint() {
  const imagePoint = points.pop();
  imagePoint?.remove();
  pixelCoordinates.pop();
}

function removeLastMarker() {
  const marker = markers.pop();
  if (marker) map.instance.removeLayer(marker);

  geoCoordinates.pop();
}

undoButton.addEventListener('click', () => {
  if (pixelCoordinates.length >= geoCoordinates.length) {
    removeLastPoint();
  }

  if (pixelCoordinates.length <= geoCoordinates.length) {
    removeLastMarker();
  }
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
      headers: { 'Content-Type': 'application/json' },
    });

    const calculationErrorData = await response.json();
    field.value = calculationErrorData?.value ?? 'unknown';
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('AddedNewPoint', showCalculationError);
document.addEventListener('AddedNewMarker', showCalculationError);
