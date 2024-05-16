/* Basic configuration */

Konva.hitOnDragEnabled = true;

const sceneWidth = 1000;
const sceneHeight = 1000;

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
  const container = document.querySelector('.map-container');
  const containerWidth = container.offsetWidth;
  const scale = containerWidth / sceneWidth;

  stage.width(sceneWidth * scale);
  stage.height(sceneHeight * scale);
  stage.scale({ x: scale, y: scale });
}

fitStageIntoParentContainer();
window.addEventListener('resize', fitStageIntoParentContainer);

/* Draw point on click */

layer.on('click', (e) => {
  const pos = layer.getRelativePointerPosition();

  const circle = new Konva.Circle({
    x: pos.x,
    y: pos.y,
    radius: 10,
    fill: 'red',
  });

  const number = new Konva.Text({
    x: pos.x,
    y: pos.y - 5,
    text: (imagePoints.length + 1).toString(),
    fontSize: 12,
    fontFamily: 'Arial',
    fill: 'white',
  });

  number.offsetX(number.width() / 2);

  layer.add(circle);
  layer.add(number);

  imagePoints.push({
    top: (pos.y / globalImage.height) * globalImage.pixelHeight,
    left: (pos.x / globalImage.width) * globalImage.pixelWidth,
  });
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
  };

  img.src = URL.createObjectURL(e.target.files[0]);
}

const uploadImageButton = document.getElementById('upload-img-button');
uploadImageButton.addEventListener('change', uploadImage);

/* Leaflet */

const map = L.map('map').setView([51.505, -0.09], 13);

map.on('click', function (e) {
  const marker = new L.Marker([e.latlng.lat, e.latlng.lng], {
    icon: new L.AwesomeNumberMarkers({
      number: mapPoints.length + 1,
      markerColor: 'red',
    }),
  });

  marker.addTo(map);

  mapMarkers.push(marker);

  mapPoints.push({
    latitude: e.latlng.lat,
    longitude: e.latlng.lng,
  });
});

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

/* Send to server */

const API_URL = 'https://example.com';

async function sendToServer() {
  const data = [];
  const len = Math.min(imagePoints.length, mapPoints.length);

  for (let i = 0; i < len; i++) {
    data.push([imagePoints[i], mapPoints[i]]);
  }

  console.log(data);

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
  newScale = Math.min(Math.max(0.75, newScale), 4); // Clamp between 0.75 and 4

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

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function getCenter(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

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
