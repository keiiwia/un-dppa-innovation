(function () {
  // --- Map ---
  // Illustrative coverage state for each Northwest subdivision. The borders are real; these states are made up.
  var stateByName = {
    'Kumbo': 'contradicted',
    'Furu-Awa': 'unheard', 'Nwa': 'unheard', 'Ako': 'unheard', 'Misaje': 'unheard', 'Andek': 'unheard', 'Elak': 'unheard',
    'Santa': 'quiet', 'Tubah': 'quiet', 'Bali': 'quiet', 'Fundong': 'quiet', 'Ndu': 'quiet', 'Balikumbat': 'quiet'
  };
  var regions = (window.NORTHWEST && window.NORTHWEST.features) || [];
  var names = regions.map(function (f) { return f.properties.name; });
  var states = names.map(function (n) { return stateByName[n] || 'reported'; });
  var captions = {
    reported: ['Reported', 'Coverage is near normal and reports are arriving. Nothing to flag.'],
    quiet: ['Quiet', 'Normal coverage, little happening. The low activity is real.'],
    unheard: ['Unheard', 'Coverage dropped or never existed. Few reports here tells you little.'],
    contradicted: ['Silent, but changing', '2 reports instead of about 15, none in local languages. Satellite shows newly burned farmland. The silence is the warning.']
  };
  var map = document.getElementById('map');
  var caption = document.getElementById('caption');
  var start = states.indexOf('contradicted');
  function setCaption(i) {
    var c = captions[states[i]];
    caption.innerHTML = '<strong>' + names[i] + '</strong><span class="state">' + c[0] + '</span>' + c[1];
  }

  // Fallback: the original tile grid, used when the map library or tiles can't load
  function buildGrid() {
    map.className = 'map';
    map.innerHTML = '';
    states.forEach(function (s, i) {
      var b = document.createElement('button');
      b.className = 'cell ' + s;
      b.setAttribute('aria-label', names[i] + ': ' + captions[s][0]);
      b.setAttribute('aria-pressed', 'false');
      function pick() {
        setCaption(i);
        map.querySelectorAll('.cell').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
      }
      b.addEventListener('click', pick);
      b.addEventListener('mouseenter', pick);
      map.appendChild(b);
    });
    map.children[start].dispatchEvent(new Event('click'));
  }

  // Real subdivision borders, each tagged with its illustrative state
  function regionGeoJSON() {
    return {
      type: 'FeatureCollection',
      features: regions.map(function (f, i) {
        return { type: 'Feature', id: i, properties: { name: names[i], state: states[i] }, geometry: f.geometry };
      })
    };
  }
  function regionBounds() {
    var b = [[180, 90], [-180, -90]];
    (function walk(c) {
      if (typeof c[0] === 'number') {
        b[0][0] = Math.min(b[0][0], c[0]); b[0][1] = Math.min(b[0][1], c[1]);
        b[1][0] = Math.max(b[1][0], c[0]); b[1][1] = Math.max(b[1][1], c[1]);
      } else c.forEach(walk);
    })(regions.map(function (f) { return f.geometry.coordinates; }));
    return b;
  }
  // Diagonal stripes for "unheard", matching the legend swatch
  function hatch(color) {
    var n = 8, c = document.createElement('canvas');
    c.width = c.height = n;
    var g = c.getContext('2d');
    g.strokeStyle = color; g.lineWidth = 2;
    for (var k = -n; k <= n; k += 4) { g.beginPath(); g.moveTo(k, n); g.lineTo(k + n, 0); g.stroke(); }
    return g.getImageData(0, 0, n, n);
  }

  // Keep the cells clear of the floating card: beside it on wide screens, above it on phones
  function fitPadding() {
    var card = document.querySelector('.card').getBoundingClientRect();
    var wide = window.innerWidth > 640;
    return { top: 24, right: wide ? 56 : 16, bottom: wide ? 24 : card.height + 40, left: wide ? card.width + 40 : 16 };
  }

  function buildMap() {
    var css = getComputedStyle(document.documentElement);
    var tok = function (n) { return css.getPropertyValue(n).trim(); };
    map.className = 'map map--live';
    var m = new maplibregl.Map({
      container: map,
      style: 'https://tiles.openfreemap.org/styles/positron',
      bounds: regionBounds(),
      fitBoundsOptions: { padding: fitPadding() },
      attributionControl: { compact: true },
      cooperativeGestures: true
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    m.on('error', function (e) { if (!m.loaded() && e && e.error && /style|fetch/i.test(String(e.error.message))) buildGrid(); });
    m.on('load', function () {
      m.addImage('hatch', hatch(tok('--unheard')));
      m.addSource('cells', { type: 'geojson', data: regionGeoJSON(), attribution: 'Boundaries: <a href="https://www.geoboundaries.org" target="_blank" rel="noopener">geoBoundaries</a>' });
      // Draw cells under the place labels so town names stay readable
      var labels = (m.getStyle().layers.find(function (l) { return l.type === 'symbol'; }) || {}).id;
      m.addLayer({
        id: 'cells-fill', type: 'fill', source: 'cells',
        filter: ['in', ['get', 'state'], ['literal', ['reported', 'quiet']]],
        paint: {
          'fill-color': tok('--quiet'),
          'fill-opacity': ['match', ['get', 'state'], 'reported', 0.55, 0.22]
        }
      }, labels);
      m.addLayer({
        id: 'cells-hatch', type: 'fill', source: 'cells',
        filter: ['in', ['get', 'state'], ['literal', ['unheard', 'contradicted']]],
        paint: { 'fill-pattern': 'hatch', 'fill-opacity': 0.85 }
      }, labels);
      // Neighbours share borders, so outlines are stacked: thin white borders, then the selection, then the alert on top
      m.addLayer({
        id: 'cells-line', type: 'line', source: 'cells',
        paint: { 'line-color': '#ffffff', 'line-width': 1.2, 'line-opacity': 0.9 }
      }, labels);
      m.addLayer({
        id: 'cells-selected', type: 'line', source: 'cells',
        paint: {
          'line-color': '#18212c', 'line-width': 2.5,
          'line-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 1, 0]
        }
      }, labels);
      m.addLayer({
        id: 'cells-alert', type: 'line', source: 'cells',
        filter: ['==', ['get', 'state'], 'contradicted'],
        paint: { 'line-color': tok('--alert'), 'line-width': 3 }
      }, labels);
      var selected = null;
      function select(i) {
        if (selected !== null) m.setFeatureState({ source: 'cells', id: selected }, { selected: false });
        selected = i;
        m.setFeatureState({ source: 'cells', id: i }, { selected: true });
        setCaption(i);
      }
      ['cells-fill', 'cells-hatch'].forEach(function (layer) {
        m.on('mousemove', layer, function (e) { m.getCanvas().style.cursor = 'pointer'; select(e.features[0].id); });
        m.on('mouseleave', layer, function () { m.getCanvas().style.cursor = ''; });
        m.on('click', layer, function (e) { select(e.features[0].id); });
      });
      select(start);
    });
  }

  if (window.maplibregl && regions.length) buildMap(); else buildGrid();

  // --- Menu panels ---
  var menuButtons = document.querySelectorAll('.menu button');
  function openPanel(id) {
    menuButtons.forEach(function (b) {
      var on = b.dataset.panel === id;
      b.setAttribute('aria-expanded', String(on));
      document.getElementById(b.dataset.panel).hidden = !on;
    });
  }
  menuButtons.forEach(function (b) {
    b.addEventListener('click', function () { openPanel(b.getAttribute('aria-expanded') === 'true' ? null : b.dataset.panel); });
  });
  document.querySelectorAll('.panel .close').forEach(function (c) { c.addEventListener('click', function () { openPanel(null); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openPanel(null); });

  // --- Words we use ---
  var terms = [
    ['Quiet', 'Normal coverage, nothing reported. The absence of events is real.'],
    ['Unheard', 'Coverage has dropped or never existed, so the absence of events means nothing.'],
    ['Silent, but changing', 'Reporting has gone quiet while independent signals show change. This is the alert.'],
    ['Normal coverage', 'How much reporting a place usually gets, from which sources and in which languages. Every gap is measured against it.'],
    ['Gap record', 'A short note that travels with an analysis: what it rests on, where it is silent, what disagrees. People can add to it, but not quietly delete it.'],
    ['Independent signal', 'Evidence from outside the usual reporting chain: satellite change, internet outages, people moving, market prices, ground sensors.']
  ];
  var chips = document.getElementById('chips');
  var term = document.getElementById('term');
  function showTerm(i) {
    term.innerHTML = '<strong>' + terms[i][0] + '.</strong> ' + terms[i][1];
    chips.querySelectorAll('.chip').forEach(function (c, j) { c.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
  }
  terms.forEach(function (t, i) {
    var b = document.createElement('button');
    b.className = 'chip'; b.textContent = t[0];
    b.addEventListener('click', function () { showTerm(i); });
    b.addEventListener('mouseenter', function () { showTerm(i); });
    chips.appendChild(b);
  });
  showTerm(0);

  // --- Flow ---
  var phases = [
    { t: 'Find the gap', s: 'Compare the reporting a place normally gets with what is arriving now.', who: 'Tool',
      d: 'The tool learns what normal coverage looks like for each place, watches what is actually arriving, and measures the difference by place, time, language and type of event.',
      ex: 'Normally about 15 reports a month from radio, NGOs and field staff, in French, English and Pidgin. This month: 2 English reports from the capital. Coverage is down about 85%.',
      steps: [
        { t: 'Expect', who: 'Both', d: 'Learn what normal coverage looks like for each place: how many reports, from which kinds of sources, in which languages, how often. Analysts help set this up.', ex: 'About 15 reports a month, 4 kinds of sources, 3 languages.' },
        { t: 'Observe', who: 'Tool', d: 'Track what is actually arriving now: from which sources, in which languages, and how recently.', ex: '2 reports this month, both in English, both from outlets in the capital.' },
        { t: 'Compare', who: 'Tool', d: 'Normal minus now is the gap. It also shows kinds of events the data can’t capture at all.', ex: 'Coverage down about 85%. No local-language sources. No farmer-herder events recorded.' }
      ] },
    { t: 'Check the silence', s: 'Test the silence against independent signals, then show it beside the analysis.', who: 'Tool',
      d: 'A gap alone proves nothing. The tool checks it against signals from outside the reporting chain, sorts it as quiet, unheard, or silent but changing, and shows it next to the map or briefing.',
      ex: 'Satellite shows newly burned farmland, so the district is marked "silent, but changing."',
      steps: [
        { t: 'Test', who: 'Tool', d: 'Test the silence against independent signals: satellite change, internet outages, people moving, market prices, ground sensors.', ex: 'Satellite shows newly burned farmland since last month.' },
        { t: 'Show', who: 'Both', d: 'Put the gap beside the analysis: what it rests on, where it’s silent, what disagrees, and who could fill the gap. No trust score, no verdict.', ex: '"Rests on 2 reports, none local. Satellite shows change. Closest contact: Peace & Development Adviser."' }
      ] },
    { t: 'Carry it up', s: 'A person decides, and the gap stays attached all the way to the envoy.', who: 'Person',
      d: 'The analyst decides what to do and notes why. The gap record then travels with the analysis, so the people deciding at the top know how solid the ground is. Afterwards, the team checks whether the silence hid something.',
      ex: 'Briefing line for the envoy: "Assessment rests on 2 sources, none from the district. Local check requested."',
      steps: [
        { t: 'Decide', who: 'Person', d: 'The analyst decides: ask someone closer, act anyway, or record "unknown," and notes why. This step is always a person.', ex: 'The desk officer asks the Peace & Development Adviser to check with local civil-society contacts.' },
        { t: 'Carry', who: 'Person', d: 'The gap record travels with the analysis up to the envoy. Each person can add to it; nobody can quietly delete it.', ex: '"Rests on 2 sources, none from the district. Local check requested."' },
        { t: 'Learn', who: 'Both', d: 'Afterwards, check whether the silence hid something, and update what normal coverage looks like. Over time this shows where the UN keeps going blind.', ex: 'Three weeks later, displacement reports confirm clashes. The district’s normal coverage is updated.' }
      ] }
  ];

  var flow = document.getElementById('flow');
  var detail = document.getElementById('detail');
  var v3 = document.getElementById('v3');
  var v8 = document.getElementById('v8');
  var pinned = null;

  function whoTag(w) { return '<span class="who' + (w === 'Person' ? ' person' : '') + '">' + w + '</span>'; }
  function render(it) {
    detail.innerHTML =
      '<div class="head"><span class="label">' + it.where + '</span>' + whoTag(it.who) + '</div>' +
      '<h3>' + it.t + '</h3><p>' + it.d + '</p>' +
      '<div class="ex"><span class="label">In the scenario</span>' + it.ex + '</div>';
  }
  function activate(btn) {
    flow.querySelectorAll('.active').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
  }
  function wire(btn, it) {
    function show() { render(it); activate(btn); }
    btn.addEventListener('mouseenter', show);
    btn.addEventListener('focus', show);
    btn.addEventListener('click', function () { pinned = { it: it, btn: btn }; show(); });
    btn.addEventListener('mouseleave', function () { if (pinned) { render(pinned.it); activate(pinned.btn); } });
    return btn;
  }

  function buildSimple() {
    var wrap = document.createElement('div');
    wrap.className = 'phases';
    phases.forEach(function (p, i) {
      var b = document.createElement('button');
      b.className = 'phase-card';
      b.innerHTML = '<span class="num">' + (i + 1) + '</span><span class="t">' + p.t + '</span><span class="s">' + p.s + '</span>' + whoTag(p.who);
      var it = { t: p.t, d: p.d, ex: p.ex, who: p.who, where: 'Phase ' + (i + 1) + ' of 3' };
      wrap.appendChild(wire(b, it));
      if (i === 0) pinned = { it: it, btn: b };
    });
    return wrap;
  }
  function buildFull() {
    var track = document.createElement('div');
    track.className = 'track';
    var n = 0;
    phases.forEach(function (p, pi) {
      var band = document.createElement('div');
      band.className = 'band';
      band.style.setProperty('--from', n + 1);
      band.style.setProperty('--span', p.steps.length);
      band.innerHTML = '<b>' + (pi + 1) + '</b> · ' + p.t;
      track.appendChild(band);
      p.steps.forEach(function (s) {
        n += 1;
        var b = document.createElement('button');
        b.className = 'tile';
        b.style.setProperty('--col', n);
        b.innerHTML = '<span class="num">' + n + '</span><span class="t">' + s.t + '</span>' + whoTag(s.who);
        var it = { t: s.t, d: s.d, ex: s.ex, who: s.who, where: 'Step ' + n + ' of 8 · ' + p.t };
        track.appendChild(wire(b, it));
        if (n === 1) pinned = { it: it, btn: b };
      });
    });
    return track;
  }
  function show(full) {
    v3.setAttribute('aria-pressed', String(!full));
    v8.setAttribute('aria-pressed', String(full));
    flow.innerHTML = '';
    flow.appendChild(full ? buildFull() : buildSimple());
    render(pinned.it); activate(pinned.btn);
  }
  v3.addEventListener('click', function () { show(false); });
  v8.addEventListener('click', function () { show(true); });
  show(false);
})();
