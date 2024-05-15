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
    radius: 5,
    fill: 'red',
  });

  layer.add(circle);
  imagePoints.push(pos);
  console.log(imagePoints);
});

// Upload image
function uploadImage(e) {
  const img = new Image();

  img.onload = function () {
    const aspectRatio = img.width / img.height;
    const width = sceneWidth;
    const height = width / aspectRatio;

    const image = new Konva.Image({ image: img, width, height });
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
  const marker = new L.Marker([e.latlng.lat, e.latlng.lng]);
  marker.addTo(map);

  mapPoints.push({
    latitude: e.latlng.lat,
    longitude: e.latlng.lng,
  });

  console.log(mapPoints);
});

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);
