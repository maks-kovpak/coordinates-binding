import { replaceMarkerColor } from './utils.js';
import ImageCanvas from './src/ImageCanvas.js';

/* Basic configuration */

const stage = new ImageCanvas('image-canvas');
stage.init();

/* Points data */

let imagePoints = [];
let mapPoints = [];

let mapMarkers = [];

/* Draw point on click */

const circleGroups = [];

function handleCircleHover(circleGroup) {
  const circle = circleGroup.find('Circle').at(0);

  circle.setAttr('fill', '#F69730');
  const idx = circleGroups.indexOf(circleGroup);

  const currentMarker = mapMarkers[idx];
  if (!currentMarker) return;

  replaceMarkerColor(currentMarker, 'red', 'orange');
}

function handleCircleLeave(circleGroup) {
  const circle = circleGroup.find('Circle').at(0);

  circle.setAttr('fill', '#D33D29');
  const idx = circleGroups.indexOf(circleGroup);

  const currentMarker = mapMarkers[idx];
  if (!currentMarker) return;

  replaceMarkerColor(currentMarker, 'orange', 'red');
}

stage.layer.on('click', (e) => {
  const pos = stage.layer.getRelativePointerPosition();
  const circleGroup = new Konva.Group();

  // Draw circle
  const circle = new Konva.Circle({
    x: pos.x,
    y: pos.y,
    radius: 10,
    fill: '#F69730',
  });

  circleGroup.add(circle);

  // Draw point number
  const number = new Konva.Text({
    x: pos.x,
    y: pos.y - 5,
    text: (imagePoints.length + 1).toString(),
    fontSize: 12,
    fontFamily: 'Arial',
    fill: 'white',
  });

  number.offsetX(number.width() / 2);
  circleGroup.add(number);

  // Highlight on hover
  circleGroup.on('mouseover', () => handleCircleHover(circleGroup));
  circleGroup.on('mouseout', () => handleCircleLeave(circleGroup));

  // Set circle rotation center
  const groupCenter = { x: pos.x + circleGroup.width() / 2, y: pos.y + circleGroup.height() / 2 };
  circleGroup.offset(groupCenter);
  circleGroup.position(groupCenter);

  circleGroup.rotate(-90 * numberOfRotations);

  stage.layer.add(circleGroup);
  circleGroups.push(circleGroup);

  imagePoints.push({
    x: Math.round((pos.x / globalImage.width) * globalImage.pixelWidth),
    y: Math.round((pos.y / globalImage.height) * globalImage.pixelHeight),
  });

  document.dispatchEvent(new CustomEvent('AddedNewPoint'));
});

/* Upload image */

function uploadImage(e) {
  // Clear canvas and map
  stage.layer.destroyChildren();
  imagePoints = [];
  mapPoints = [];
  mapMarkers.forEach((m) => map.removeLayer(m));

  // Create new image
  const img = new Image();

  img.onload = function () {
    const aspectRatio = img.width / img.height;
    globalImage.height = globalImage.width / aspectRatio;

    globalImage.pixelWidth = img.width;
    globalImage.pixelHeight = img.height;

    const image = new Konva.Image({
      image: img,
      width: globalImage.width,
      height: globalImage.height,
    });

    stage.layer.add(image);
    stage.layer.draw();

    // Change a rotation center
    const imageCenter = { x: image.width() / 2, y: image.height() / 2 };
    stage.layer.offset(imageCenter);
    stage.layer.position(imageCenter);
  };

  const reader = new FileReader();

  reader.onload = function () {
    if (e.target.files[0].type === 'image/tiff') {
      const tiff = new Tiff({ buffer: this.result });
      img.src = tiff.toDataURL();
    } else {
      img.src = URL.createObjectURL(e.target.files[0]);
    }
  };

  reader.readAsArrayBuffer(e.target.files[0]);

  enableMap();
}

const uploadImageButton = document.getElementById('upload-img-button');
uploadImageButton.addEventListener('change', uploadImage);

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
