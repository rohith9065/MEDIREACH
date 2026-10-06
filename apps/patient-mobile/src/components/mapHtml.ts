// Loaded into a WebView via `source={{ html: MAP_HTML }}` rather than a bundled .html asset —
// avoids needing extra Metro `assetExts` config just for one static page, and keeps the whole
// map implementation in one reviewable file. MapLibre GL JS + a public OSM-derived demo style
// (not Google Maps), per the original brief. The public demo tile/style infra used here is a
// known dev-only shortcut — see the root README for the production swap-in note.
export const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link href="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .hospital-marker {
      width: 26px;
      height: 26px;
      border-radius: 13px;
      background: #FF5A36;
      border: 3px solid #ffffff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    }
    .user-marker {
      width: 18px;
      height: 18px;
      border-radius: 9px;
      background: #151A3D;
      border: 3px solid #ffffff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    }
    .ambulance-marker {
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

    var hospitalMarkers = [];
    var userMarker = null;
    var ambulanceMarker = null;

    function post(message) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    }

    window.setMapData = function (payload) {
      hospitalMarkers.forEach(function (m) { m.remove(); });
      hospitalMarkers = [];

      if (payload.user) {
        if (userMarker) userMarker.remove();
        var userEl = document.createElement('div');
        userEl.className = 'user-marker';
        userMarker = new maplibregl.Marker({ element: userEl })
          .setLngLat([payload.user.longitude, payload.user.latitude])
          .addTo(map);
      }

      (payload.hospitals || []).forEach(function (h) {
        var el = document.createElement('div');
        el.className = 'hospital-marker';
        el.addEventListener('click', function () {
          post({ type: 'markerTap', hospitalId: h.id });
        });
        var marker = new maplibregl.Marker({ element: el })
          .setLngLat([h.longitude, h.latitude])
          .addTo(map);
        hospitalMarkers.push(marker);
      });

      if (payload.recenter && payload.user) {
        map.setCenter([payload.user.longitude, payload.user.latitude]);
      }
    };

    // Called on every ambulance:location-updated event — moves just this one marker instead
    // of re-running setMapData's full hospital/user diff, so trip tracking feels smooth.
    window.updateAmbulancePosition = function (lat, lng) {
      if (lat == null || lng == null) return;
      if (!ambulanceMarker) {
        var el = document.createElement('div');
        el.className = 'ambulance-marker';
        ambulanceMarker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      } else {
        ambulanceMarker.setLngLat([lng, lat]);
      }
    };

    window.clearAmbulancePosition = function () {
      if (ambulanceMarker) {
        ambulanceMarker.remove();
        ambulanceMarker = null;
      }
    };

    map.on('load', function () {
      post({ type: 'mapReady' });
    });
  </script>
</body>
</html>
`;
