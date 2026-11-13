// The map behind the "Where did this occur?" question. Same setup as concepts/quiet-or-unheard-map:
// MapLibre GL with OpenFreeMap tiles. Place search uses Photon (photon.komoot.io); region outlines and map clicks use
// Nominatim (nominatim.openstreetmap.org). Both are built on OpenStreetMap.
// app.js drives it through window.WhereMap. If MapLibre did not load, WhereMap.available is false and Scope
// falls back to the plain question screen.
(function () {
  var STYLES = { light: 'https://tiles.openfreemap.org/styles/positron', dark: 'https://tiles.openfreemap.org/styles/dark' };
  var SEARCH = 'https://photon.komoot.io/api/';
  var OUTLINES = 'https://nominatim.openstreetmap.org/';
  var dark = window.matchMedia('(prefers-color-scheme: dark)');
  var map = null, markers = {}, pending = null, onPick = null;
  var shapes = {}, current = {}, queue = Promise.resolve();

  function host() { return document.getElementById('where-map'); }
  function theme() {
    var forced = document.documentElement.getAttribute('data-theme');
    return forced || (dark.matches ? 'dark' : 'light');
  }
  // Leave room for the question card so a place never lands underneath it
  function padding() {
    var card = document.querySelector('.scope-map .scope-main');
    var wide = window.matchMedia('(min-width: 861px)').matches;
    var r = card ? card.getBoundingClientRect() : { right: 0, bottom: 0 };
    return wide ? { top: 120, right: 80, bottom: 80, left: Math.round(r.right) + 60 } : { top: Math.round(r.bottom) + 30, right: 30, bottom: 50, left: 30 };
  }
  function build() {
    map = new maplibregl.Map({
      container: host(),
      style: STYLES[theme()],
      center: [-20, 20],
      zoom: 1.4,
      attributionControl: { compact: true }
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    // Quicker wheel and trackpad zoom than the defaults (1/450 and 1/100)
    map.scrollZoom.setWheelZoomRate(1 / 200);
    map.scrollZoom.setZoomRate(1 / 50);
    map.getCanvas().style.cursor = 'pointer';
    // Clicking the map picks the place under the pointer
    map.on('click', function (e) {
      whatIsHere(e.lngLat, map.getZoom()).then(function (place) { if (place && onPick) onPick(place); }, function () {});
    });
    dark.addEventListener('change', function () { map.setStyle(STYLES[theme()]); });
    // Runs for the first style and again after a light/dark switch, which drops added layers
    map.on('style.load', function () { addRegionLayers(); drawRegions(); });
  }

  // Highlight for the chosen regions, drawn under the map's place labels
  function addRegionLayers() {
    if (map.getSource('regions')) return;
    var color = theme() === 'dark' ? '#8ea4f5' : '#1f3fbf';
    var labels = map.getStyle().layers.filter(function (l) { return l.type === 'symbol'; })[0];
    map.addSource('regions', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'regions-fill', type: 'fill', source: 'regions', filter: ['!=', ['geometry-type'], 'Point'], paint: { 'fill-color': color, 'fill-opacity': 0.16 } }, labels && labels.id);
    map.addLayer({ id: 'regions-line', type: 'line', source: 'regions', filter: ['!=', ['geometry-type'], 'Point'], paint: { 'line-color': color, 'line-width': 1.6, 'line-opacity': 0.85 } }, labels && labels.id);
  }
  function drawRegions() {
    var src = map && map.getSource('regions');
    if (!src) return;
    src.setData({ type: 'FeatureCollection', features: Object.keys(current).filter(function (n) { return shapes[n]; }).map(function (n) {
      return { type: 'Feature', properties: { name: n }, geometry: shapes[n] };
    }) });
  }
  // Fetches a place's outline by its OpenStreetMap id. Requests go one at a time, a second apart, as the service asks.
  function outline(name, ref) {
    if (shapes[name] !== undefined || !ref) return;
    shapes[name] = null;
    queue = queue.then(function () {
      return fetch(OUTLINES + 'lookup?format=geojson&polygon_geojson=1&polygon_threshold=0.01&accept-language=en&osm_ids=' + encodeURIComponent(ref))
        .then(function (r) { return r.ok ? r.json() : { features: [] }; })
        .then(function (data) {
          var f = data.features && data.features[0];
          if (f && f.geometry) { shapes[name] = f.geometry; drawRegions(); }
        }, function () { delete shapes[name]; })
        .then(function () { return new Promise(function (done) { setTimeout(done, 1100); }); });
    });
  }

  // places: { name: { lng, lat, box } }. Draws one pin per place and removes pins that are gone.
  function setPlaces(places, fit) {
    if (!map) return;
    current = places;
    Object.keys(places).forEach(function (name) { outline(name, places[name].ref); });
    drawRegions();
    Object.keys(markers).forEach(function (name) {
      if (!places[name]) { markers[name].remove(); delete markers[name]; }
    });
    Object.keys(places).forEach(function (name) {
      if (markers[name]) return;
      var p = places[name];
      markers[name] = new maplibregl.Marker({ color: '#1f3fbf' }).setLngLat([p.lng, p.lat])
        .setPopup(new maplibregl.Popup({ offset: 28, closeButton: false }).setText(name)).addTo(map);
    });
    if (fit) frame(places);
  }
  // One place: zoom to its outline. Several: fit them all.
  function frame(places) {
    var names = Object.keys(places);
    if (!names.length) return;
    var b = new maplibregl.LngLatBounds();
    names.forEach(function (name) {
      var p = places[name];
      if (names.length === 1 && p.box) { b.extend([p.box[0], p.box[1]]); b.extend([p.box[2], p.box[3]]); }
      else b.extend([p.lng, p.lat]);
    });
    map.fitBounds(b, { padding: padding(), maxZoom: 11, duration: 450 });
  }

  // Search-as-you-type. Resolves to [{ name, detail, lng, lat, box }]; a newer search cancels the one before it.
  function search(text, limit) {
    if (pending) pending.abort();
    pending = new AbortController();
    var url = SEARCH + '?lang=en&limit=' + (limit || 5) + '&q=' + encodeURIComponent(text);
    return fetch(url, { signal: pending.signal }).then(function (r) { return r.ok ? r.json() : { features: [] }; }).then(function (data) {
      var seen = {};
      return (data.features || []).map(function (f) {
        var p = f.properties || {}, c = f.geometry.coordinates, e = p.extent;
        var detail = [p.city, p.county, p.state, p.country].filter(function (x, i, all) { return x && x !== p.name && all.indexOf(x) === i; }).join(', ');
        var ref = p.osm_type && p.osm_id ? p.osm_type + p.osm_id : null;
        return { name: p.name || p.country || text, detail: detail, kind: p.type || '', lng: c[0], lat: c[1], box: e ? [e[0], e[3], e[2], e[1]] : null, ref: ref };
      }).filter(function (r) {
        var key = r.name + '|' + r.detail;
        if (seen[key]) return false;
        seen[key] = true;
        return true;
      });
    });
  }

  // Finds the area that contains the clicked spot, at the level the map is zoomed to: a country from far out,
  // a state or region closer in, then a town. Comes back with its outline.
  function whatIsHere(at, zoom) {
    var level = zoom < 4.5 ? 3 : zoom < 7.5 ? 5 : 10, detail = zoom < 4.5 ? 0.05 : zoom < 7.5 ? 0.01 : 0.002;
    var url = OUTLINES + 'reverse?format=geojson&polygon_geojson=1&accept-language=en&zoom=' + level + '&polygon_threshold=' + detail +
      '&lon=' + at.lng.toFixed(5) + '&lat=' + at.lat.toFixed(5);
    return fetch(url).then(function (r) { return r.ok ? r.json() : { features: [] }; }).then(function (data) {
      var f = data.features && data.features[0], p = f && f.properties;
      if (!p || !p.name) return null;
      var ref = p.osm_type && p.osm_id ? p.osm_type.charAt(0).toUpperCase() + p.osm_id : null;
      return { name: p.name, lng: at.lng, lat: at.lat, box: f.bbox || null, ref: ref, shape: f.geometry, keepView: true };
    });
  }

  window.WhereMap = {
    // app.js sets this to receive a place picked by clicking the map
    onPick: function (fn) { onPick = fn; },
    pins: function (places) { setPlaces(places, false); },
    // Keeps an outline that came with a map click, so it is not fetched again
    remember: function (name, shape) { if (shape) shapes[name] = shape; },
    available: !!window.maplibregl,
    // Called on every render: shows or hides the map and keeps the pins in step with the chosen places
    show: function (on, places) {
      var el = host();
      if (!el) return;
      el.hidden = !on;
      if (!on || !window.maplibregl) return;
      var first = !map;
      if (first) build(); else map.resize();
      setPlaces(places || {}, first);
    },
    frame: function (places) { if (map) { setPlaces(places, true); } },
    search: search
  };
})();
