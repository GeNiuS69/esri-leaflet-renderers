/* global L beforeEach describe expect it */
describe('FeatureLayerHook', function () {
  it('should allow constructing a cluster FeatureLayer', function () {
    var featureLayer = L.esri.Cluster.featureLayer({
      url: 'https://example.com/FeatureServer/0'
    });

    expect(featureLayer).to.be.an('object');
  });

  describe('arrow marker layer options', function () {
    var lineLayer;

    beforeEach(function () {
      lineLayer = createArrowLine('end', [[0, 0], [1, 1]]);
    });

    it('should inherit pane and renderer when created', function () {
      var pathOptions = lineLayer._esriArrowDecorator._patterns[0]
        .symbolFactory.options.pathOptions;

      expect(pathOptions.pane).to.equal('servicePane');
      expect(pathOptions.renderer).to.equal(lineLayer.options.renderer);
      expect(pathOptions.className).to.equal('esri-arrow-marker');
    });

    it('should preserve pane and renderer after setStyle', function () {
      lineLayer.setStyle({ color: 'red' });

      var pathOptions = lineLayer._esriArrowDecorator._patterns[0]
        .symbolFactory.options.pathOptions;

      expect(pathOptions.pane).to.equal('servicePane');
      expect(pathOptions.renderer).to.equal(lineLayer.options.renderer);
    });

    it('should scale the default marker size with line weight and updates', function () {
      var thinLine = createArrowLine('end', [[0, 0], [1, 1]], { weight: 1 });
      var thickLine = createArrowLine('end', [[0, 0], [1, 1]], { weight: 8 });
      var thinSize = getArrowOptions(thinLine).pixelSize;
      var thickSize = getArrowOptions(thickLine).pixelSize;

      expect(thickSize / thinSize).to.equal(8);

      thinLine.setStyle({ weight: 2 });

      expect(getArrowOptions(thinLine).pixelSize / thinSize).to.equal(2);
    });

    it('should use the configured marker size instead of line weight', function () {
      var explicitSizeLine = createArrowLine(
        'end',
        [[0, 0], [1, 1]],
        { weight: 8 },
        12
      );

      expect(getArrowOptions(explicitSizeLine).pixelSize).to.equal(12);
    });

    it('should retain effective color when only opacity changes', function () {
      var styledLine = createArrowLine(
        'end',
        [[0, 0], [1, 1]],
        { color: 'orange', opacity: 0.4 }
      );

      styledLine.setStyle({ opacity: 0.5 });

      var pathOptions = getArrowOptions(styledLine).pathOptions;
      expect(pathOptions.color).to.equal('orange');
      expect(pathOptions.fillColor).to.equal('orange');
      expect(pathOptions.opacity).to.equal(0.5);
      expect(pathOptions.fillOpacity).to.equal(0.5);

      styledLine.setStyle({ opacity: 0 });

      expect(getArrowOptions(styledLine).pathOptions.opacity).to.equal(0);
    });

    it('should retain effective opacity when only color changes', function () {
      var styledLine = createArrowLine(
        'end',
        [[0, 0], [1, 1]],
        { color: 'orange', opacity: 0.4 }
      );

      styledLine.setStyle({ color: 'blue' });

      var pathOptions = getArrowOptions(styledLine).pathOptions;
      expect(pathOptions.color).to.equal('blue');
      expect(pathOptions.fillColor).to.equal('blue');
      expect(pathOptions.opacity).to.equal(0.4);
      expect(pathOptions.fillOpacity).to.equal(0.4);
    });

    it('should point the begin marker outwards for either coordinate order', function () {
      var forwardLine = createArrowLine('begin', [[0, 0], [0, 1]]);
      var reversedLine = createArrowLine('begin', [[0, 1], [0, 0]]);
      var forwardHead = getHeadCoordinates(
        forwardLine._esriArrowDecorator._patterns[0].symbolFactory,
        [0, 0],
        90
      );
      var reversedHead = getHeadCoordinates(
        reversedLine._esriArrowDecorator._patterns[0].symbolFactory,
        [0, 1],
        270
      );

      expect(forwardHead.base.lng).to.be.greaterThan(forwardHead.tip.lng);
      expect(reversedHead.base.lng).to.be.lessThan(reversedHead.tip.lng);
    });

    it('should reverse only the begin marker for begin-end placement', function () {
      var beginEndLine = createArrowLine('begin-end', [[0, 0], [0, 1]]);
      var patterns = beginEndLine._esriArrowDecorator._patterns;
      var beginHead = getHeadCoordinates(patterns[0].symbolFactory, [0, 0], 90);
      var endHead = getHeadCoordinates(patterns[1].symbolFactory, [0, 1], 90);

      expect(beginHead.base.lng).to.be.greaterThan(beginHead.tip.lng);
      expect(endHead.base.lng).to.be.lessThan(endHead.tip.lng);
    });
  });
});

function createArrowLine (placement, coordinates, styles, markerSize) {
  var renderer = L.svg();
  var featureLayer = L.esri.featureLayer({
    url: 'https://example.com/FeatureServer/0',
    pane: 'servicePane',
    renderer: renderer
  });
  featureLayer._renderer = {
    _getSymbol: function () {
      return {
        _marker: {
          style: 'arrow',
          placement: placement,
          size: markerSize
        },
        pixelValue: function (value) {
          return value;
        }
      };
    },
    style: function () {
      return styles || {};
    }
  };

  var lineLayer = featureLayer.createNewLayer({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    }
  });
  lineLayer.setStyle(styles || {});

  return lineLayer;
}

function getArrowOptions (lineLayer) {
  return lineLayer._esriArrowDecorator._patterns[0].symbolFactory.options;
}

function getHeadCoordinates (symbolFactory, tip, heading) {
  var shape = symbolFactory.buildSymbol(
    {
      latLng: L.latLng(tip[0], tip[1]),
      heading: heading
    },
    [],
    {
      project: function (latLng) {
        return L.point(latLng.lng, -latLng.lat);
      },
      unproject: function (point) {
        return L.latLng(-point.y, point.x);
      }
    },
    0,
    1
  );
  var points = shape.getLatLngs()[0];

  return {
    base: points[0],
    tip: points[1]
  };
}
