import { getCenter, getDistance } from '../utils.js';

class ImageCanvas extends Konva.Stage {
  static sceneWidth = 1000;
  static sceneHeight = 3000;

  constructor(containerId) {
    super({
      container: containerId,
      width: ImageCanvas.sceneWidth,
      height: ImageCanvas.sceneHeight,
      draggable: true,
    });

    this.layer = new Konva.Layer();

    window.globalImage = {
      width: ImageCanvas.sceneWidth,
      height: ImageCanvas.sceneHeight,
      pixelWidth: ImageCanvas.sceneWidth,
      pixelHeight: ImageCanvas.sceneHeight,
    };

    this.lastCenter = null;
    this.lastDist = 0;
    this.dragStopped = false;
  }

  init() {
    Konva.hitOnDragEnabled = true;

    this.add(this.layer);
    this.draw();

    this.fitIntoParentContainer();
    window.addEventListener('resize', () => this.fitIntoParentContainer());

    this.on('wheel', (e) => this.onWheel(e));
    this.on('touchmove', (e) => this.onTouchMove(e));
    this.on('touchend', () => this.onTouchEnd());
  }

  fitIntoParentContainer() {
    const parent = this.attrs.container.parentElement;
    const containerWidth = parent.offsetWidth;
    const scale = containerWidth / ImageCanvas.sceneWidth;

    this.width(ImageCanvas.sceneWidth * scale);
    this.height(ImageCanvas.sceneHeight * scale);
    this.scale({ x: scale, y: scale });
  }

  onWheel(e) {
    e.evt.preventDefault();

    const scaleBy = 1.05;
    const oldScale = this.scaleX();
    const pointer = this.getPointerPosition();

    // Determine the mouse pointer position relative to the stage
    const mousePointTo = {
      x: (pointer.x - this.x()) / oldScale,
      y: (pointer.y - this.y()) / oldScale,
    };

    // Adjust the scale factor based on the wheel direction
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.min(Math.max(0.2, newScale), 4); // Clamp between 0.2 and 4

    // Apply the new scale to the stage
    this.scale({ x: newScale, y: newScale });

    // Adjust the position to keep the mouse pointer stable
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    this.position(newPos);
    this.batchDraw();
  }

  onTouchMove(e) {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    // We need to restore dragging, if it was cancelled by multi-touch
    if (touch1 && !touch2 && !this.isDragging() && this.dragStopped) {
      this.startDrag();
      this.dragStopped = false;
    }

    if (touch1 && touch2) {
      // If the stage was under Konva's drag & drop,
      // we need to stop it, and implement our own pan logic with two pointers
      if (this.isDragging()) {
        this.dragStopped = true;
        this.stopDrag();
      }

      const p1 = {
        x: touch1.clientX,
        y: touch1.clientY,
      };

      const p2 = {
        x: touch2.clientX,
        y: touch2.clientY,
      };

      if (!this.lastCenter) {
        this.lastCenter = getCenter(p1, p2);
        return;
      }

      const newCenter = getCenter(p1, p2);

      const dist = getDistance(p1, p2);

      if (!this.lastDist) {
        this.lastDist = dist;
      }

      // Local coordinates of center point
      const pointTo = {
        x: (newCenter.x - this.x()) / this.scaleX(),
        y: (newCenter.y - this.y()) / this.scaleX(),
      };

      const scale = this.scaleX() * (dist / this.lastDist);

      this.scaleX(scale);
      this.scaleY(scale);

      const dx = newCenter.x - this.lastCenter.x;
      const dy = newCenter.y - this.lastCenter.y;

      const newPos = {
        x: newCenter.x - pointTo.x * scale + dx,
        y: newCenter.y - pointTo.y * scale + dy,
      };

      this.position(newPos);

      this.lastDist = dist;
      this.lastCenter = newCenter;
    }
  }

  onTouchEnd() {
    this.lastDist = 0;
    this.lastCenter = null;
  }
}

export default ImageCanvas;