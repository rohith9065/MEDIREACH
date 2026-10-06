// Adapted from apps/patient-mobile's mapHtml.ts for the driver's view: a pickup pin (the
// patient's location) plus the driver's own live position — no hospital markers here.
// Intentionally duplicated rather than shared; shared/ is TS types/Zod only, and a shared RN
// component package isn't proportional for one file in a demo-scoped project.
export const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link href="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .pickup-marker {
      width: 24px;
      height: 24px;
      border-radius: 12px;
      background: #FF5A36;
      border: 3px solid #ffffff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    }
    .self-marker {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: #FFB300;
      border: 3px solid #14171A;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.js"></script>
  <script>
    var map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors'
          }
        },
        layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm' }]
      },
      center: [77.5946, 12.9716],
      zoom: 12
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    var pickupMarker = null;
    var selfMarker = null;
    var hasCentered = false;

    function post(message) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    }

    window.setPickup = function (lat, lng) {
      if (lat == null || lng == null) {
        if (pickupMarker) { pickupMarker.remove(); pickupMarker = null; }
        return;
      }
      if (!pickupMarker) {
        var el = document.createElement('div');
        el.className = 'pickup-marker';
        pickupMarker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      } else {
        pickupMarker.setLngLat([lng, lat]);
      }
      if (!hasCentered) {
        map.setCenter([lng, lat]);
        hasCentered = true;
      }
    };

    window.setSelfPosition = function (lat, lng) {
      if (lat == null || lng == null) return;
      if (!selfMarker) {
        var el = document.createElement('div');
        el.className = 'self-marker';
        selfMarker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      } else {
        selfMarker.setLngLat([lng, lat]);
      }
    };

    map.on('load', function () {
      post({ type: 'mapReady' });
    });
  </script>
</body>
</html>
`;
