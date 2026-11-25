import L from 'leaflet';

L.Symbol.RoundedArrowHead = L.Symbol.ArrowHead.extend({
  _buildArrowPath: function (dirPoint, map) {
    const d2r = Math.PI / 180;
    const tipPoint = map.project(dirPoint.latLng);
    const direction = -(dirPoint.heading - 90) * d2r;
    const radianArrowAngle = (this.options.headAngle / 2) * d2r;

    const headAngle1 = direction + radianArrowAngle;
    const headAngle2 = direction - radianArrowAngle;

    const pixelSize = this.options.pixelSize || 0;

    const arrowHead = L.point(
      tipPoint.x + pixelSize / 2 * Math.cos(direction),
      tipPoint.y - pixelSize / 2 * Math.sin(direction)
    );
    const arrowHead1 = L.point(
      arrowHead.x - pixelSize * Math.cos(headAngle1),
      arrowHead.y + pixelSize * Math.sin(headAngle1)
    );
    const arrowHead2 = L.point(
      arrowHead.x - pixelSize * Math.cos(headAngle2),
      arrowHead.y + pixelSize * Math.sin(headAngle2)
    );

    return [
      map.unproject(arrowHead1),
      map.unproject(arrowHead),
      map.unproject(arrowHead2),
      map.unproject(tipPoint)
    ];
  }
});

L.Symbol.roundedArrowHead = function (options) {
  return new L.Symbol.RoundedArrowHead(options);
};
