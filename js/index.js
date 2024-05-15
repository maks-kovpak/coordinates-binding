// Basic configuration
const sceneWidth = 1000;
const sceneHeight = 1000;

const stage = new Konva.Stage({
  container: 'image-canvas',
  width: sceneWidth,
  height: sceneHeight,
});

const layer = new Konva.Layer();

stage.add(layer);
stage.draw();

// Points
const imagePoints = [];
const mapPoints = [];

// Image
const globalImage = {
  width: sceneWidth,
  height: sceneHeight,
  pixelWidth: sceneWidth,
  pixelHeight: sceneHeight,
};

// Make canvas responsive
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

// Draw point on click
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

// Upload image
function uploadImage(e) {
  layer.destroyChildren();
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

// Leaflet
const map = L.map('map').setView([51.505, -0.09], 13);

map.on('click', function (e) {
  const marker = new L.Marker([e.latlng.lat, e.latlng.lng], {
    icon: new L.AwesomeNumberMarkers({
      number: mapPoints.length + 1,
      markerColor: 'red',
    }),
  });

  marker.addTo(map);

  mapPoints.push({
    latitude: e.latlng.lat,
    longitude: e.latlng.lng,
  });
});

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

// Send to server
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
