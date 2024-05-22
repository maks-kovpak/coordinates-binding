import { replaceMarkerColor } from '../utils.js';

class NumberedPoint extends Konva.Group {
  constructor(position, number) {
    super();

    this.pos = position;
    this.number = number;

    this.circle = new Konva.Circle({
      x: this.pos.x,
      y: this.pos.y,
      radius: 10,
      fill: '#F69730',
    });

    this._create();
  }

  _onMouseOver() {
    this.circle.setAttr('fill', '#F69730');
    const idx = points.indexOf(this);

    const currentMarker = markers[idx];
    if (!currentMarker) return;

    replaceMarkerColor(currentMarker, 'red', 'orange');
  }

  _onMouseOut() {
    this.circle.setAttr('fill', '#D33D29');
    const idx = points.indexOf(this);

    const currentMarker = markers[idx];
    if (!currentMarker) return;

    replaceMarkerColor(currentMarker, 'orange', 'red');
  }

  _create() {
    // Draw circle
    this.add(this.circle);

    // Draw point number
    const numberText = new Konva.Text({
      x: this.pos.x,
      y: this.pos.y - 5,
      text: this.number.toString(),
      fontSize: 12,
      fontFamily: 'Arial',
      fill: 'white',
    });

    numberText.offsetX(numberText.width() / 2);
    this.add(numberText);

    // Highlight on hover
    this.on('mouseover', () => this._onMouseOver());
    this.on('mouseout', () => this._onMouseOut());

    // Set circle rotation center
    const rotationCenter = {
      x: this.pos.x + this.width() / 2,
      y: this.pos.y + this.height() / 2,
    };

    this.offset(rotationCenter);
    this.position(rotationCenter);
  }
}

export default NumberedPoint;