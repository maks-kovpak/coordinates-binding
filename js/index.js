import { replaceMarkerColor, getDistance, getCenter } from './utils.js';

/* Basic configuration */

Konva.hitOnDragEnabled = true;

const sceneWidth = 1000;
const sceneHeight = 3000;

const stage = new Konva.Stage({
  container: 'image-canvas',
  width: sceneWidth,
  height: sceneHeight,
  draggable: true,
});

const layer = new Konva.Layer();

stage.add(layer);
stage.draw();

/* Points data */

let imagePoints = [];
let mapPoints = [];

let mapMarkers = [];

/* Image parameters */

const globalImage = {
  width: sceneWidth,
  height: sceneHeight,
  pixelWidth: sceneWidth,
  pixelHeight: sceneHeight,
};

/* Make canvas responsive */

function fitStageIntoParentContainer() {
  const container = document.querySelector('.image-container');
  const containerWidth = container.offsetWidth;
  const scale = containerWidth / sceneWidth;

  stage.width(sceneWidth * scale);
  stage.height(sceneHeight * scale);
  stage.scale({ x: scale, y: scale });
}

fitStageIntoParentContainer();
window.addEventListener('resize', fitStageIntoParentContainer);

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

layer.on('click', (e) => {
  const pos = layer.getRelativePointerPosition();
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

  layer.add(circleGroup);
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
  layer.destroyChildren();
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

    layer.add(image);
    layer.draw();

    // Change rotation center
    const imageCenter = { x: image.width() / 2, y: image.height() / 2 };
    layer.offset(imageCenter);
    layer.position(imageCenter);
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
  const currentRotation = layer.rotation();
  layer.rotation(currentRotation + 90);
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

/* Zoom */

stage.on('wheel', (e) => {
  e.evt.preventDefault();

  const scaleBy = 1.05;
  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();

  // Determine the mouse pointer position relative to the stage
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };

  // Adjust the scale factor based on the wheel direction
  let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
  newScale = Math.min(Math.max(0.2, newScale), 4); // Clamp between 0.2 and 4

  // Apply the new scale to the stage
  stage.scale({ x: newScale, y: newScale });

  // Adjust the position to keep the mouse pointer stable
  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };

  stage.position(newPos);
  stage.batchDraw();
});

/* Move, drag and drop */

let lastCenter = null;
let lastDist = 0;
let dragStopped = false;

stage.on('touchmove', function (e) {
  e.evt.preventDefault();
  const touch1 = e.evt.touches[0];
  const touch2 = e.evt.touches[1];

  // We need to restore dragging, if it was cancelled by multi-touch
  if (touch1 && !touch2 && !stage.isDragging() && dragStopped) {
    stage.startDrag();
    dragStopped = false;
  }

  if (touch1 && touch2) {
    // If the stage was under Konva's drag & drop
    // we need to stop it, and implement our own pan logic with two pointers
    if (stage.isDragging()) {
      dragStopped = true;
      stage.stopDrag();
    }

    const p1 = {
      x: touch1.clientX,
      y: touch1.clientY,
    };

    const p2 = {
      x: touch2.clientX,
      y: touch2.clientY,
    };

    if (!lastCenter) {
      lastCenter = getCenter(p1, p2);
      return;
    }

    const newCenter = getCenter(p1, p2);

    const dist = getDistance(p1, p2);

    if (!lastDist) {
      lastDist = dist;
    }

    // Local coordinates of center point
    const pointTo = {
      x: (newCenter.x - stage.x()) / stage.scaleX(),
      y: (newCenter.y - stage.y()) / stage.scaleX(),
    };

    const scale = stage.scaleX() * (dist / lastDist);

    stage.scaleX(scale);
    stage.scaleY(scale);

    const dx = newCenter.x - lastCenter.x;
    const dy = newCenter.y - lastCenter.y;

    const newPos = {
      x: newCenter.x - pointTo.x * scale + dx,
      y: newCenter.y - pointTo.y * scale + dy,
    };

    stage.position(newPos);

    lastDist = dist;
    lastCenter = newCenter;
  }
});

stage.on('touchend', function () {
  lastDist = 0;
  lastCenter = null;
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
