import L from 'leaflet';
import 'leaflet-polylinedecorator/src/L.PolylineDecorator';
import './RoundedArrowHead';

function getPlacements (placement) {
  switch (placement) {
    case 'begin':
      return [{ offset: 0, reverse: true }];

    case 'end':
      return [{ offset: '100%', reverse: false }];

    case 'begin-end':
      return [
        { offset: 0, reverse: true },
        { offset: '100%', reverse: false }
      ];

    default:
      return [];
  }
}

function reverseArrowHeading (arrow) {
  return {
    options: arrow.options,
    buildSymbol: function (directionPoint, latLngs, map, index, total) {
      return arrow.buildSymbol(
        {
          latLng: directionPoint.latLng,
          heading: (directionPoint.heading + 180) % 360
        },
        latLngs,
        map,
        index,
        total
      );
    }
  };
}

function getArrowPatterns (marker, symbol, styles, layerOptions) {
  var placements = getPlacements(marker.placement || 'end');

  if (!placements.length) {
    return [];
  }

  var color = styles.color !== undefined
    ? styles.color
    : (layerOptions.color !== undefined ? layerOptions.color : '#3388ff');
  var opacity = styles.opacity !== undefined
    ? styles.opacity
    : (layerOptions.opacity !== undefined ? layerOptions.opacity : 1);

  if (marker.color) {
    color = symbol.colorValue(marker.color);
    opacity = symbol.alphaValue(marker.color);
  }

  // ArcGIS size is expressed in points; Leaflet uses pixels.
  var lineWeight = styles.weight !== undefined ? styles.weight : layerOptions.weight;
  var pixelSize = !isNaN(marker.size)
    ? symbol.pixelValue(marker.size)
    : (!isNaN(lineWeight) ? lineWeight * 5 : 15);

  var pathOptions = {
    stroke: false,
    fill: true,
    color: color,
    fillColor: color,
    opacity: opacity,
    fillOpacity: opacity,
    interactive: false,
    className: 'esri-arrow-marker'
  };

  if (layerOptions.pane !== undefined) {
    pathOptions.pane = layerOptions.pane;
  }
  if (layerOptions.renderer !== undefined) {
    pathOptions.renderer = layerOptions.renderer;
  }

  var arrow = L.Symbol.roundedArrowHead({
    pixelSize: pixelSize,
    polygon: true,
    pathOptions: pathOptions
  });

  return placements.map(function (placement) {
    return {
      offset: placement.offset,
      repeat: 0,
      symbol: placement.reverse ? reverseArrowHeading(arrow) : arrow
    };
  });
}

export function attachArrowMarker (layer, feature, renderer) {
  if (!layer || !renderer || !feature.geometry) {
    return null;
  }

  var geometryType = feature.geometry.type;

  if (geometryType !== 'LineString' && geometryType !== 'MultiLineString') {
    return null;
  }

  var symbol = renderer._getSymbol(feature);

  if (!symbol || !symbol._marker || symbol._marker.style !== 'arrow') {
    return null;
  }

  var marker = symbol._marker;
  var initialStyles = renderer.style(feature);

  var decorator = L.polylineDecorator(layer, {
    patterns: getArrowPatterns(marker, symbol, initialStyles, layer.options)
  });

  // Keep decorator synchronized with the feature's style.
  // FeatureLayer calls setStyle() when applying renderer styles.
  var originalSetStyle = layer.setStyle;

  if (originalSetStyle) {
    layer.setStyle = function (styles) {
      originalSetStyle.call(this, styles);

      decorator.setPatterns(
        getArrowPatterns(marker, symbol, styles || {}, this.options)
      );

      return this;
    };
  }

  // A feature can be removed from the map and added again because
  // FeatureLayer caches layers between viewport requests.
  layer.on('add', function () {
    if (layer._map && decorator._map !== layer._map) {
      if (decorator._map) {
        decorator.remove();
      }

      decorator.addTo(layer._map);
    }
  });

  layer.on('remove', function () {
    if (decorator._map) {
      decorator.remove();
    }
  });

  return decorator;
}

export default attachArrowMarker;
