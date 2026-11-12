// playtest flow: 1 who/what/when/where -> 2 pick sources -> 3 loader -> 4 workspace -> 5 correlation map (later).
(function () {
  var S = window.MockScraper, SC = window.SCENARIO, CATALOG = window.CATALOG, LINKS = window.CATALOG_LINKS;
  var STORE = 'playtest-venezuela-v1';
  var COLS = [
    { key: 'who', label: 'Who', placeholder: 'People, governments, groups' },
    { key: 'what', label: 'What', placeholder: 'What type of crisis or problem is this?' },
    { key: 'when', label: 'When', placeholder: 'Time of occurrence' },
    { key: 'where', label: 'Where', placeholder: 'Countries, cities, sites' }
  ];
  var STEPS = ['Scope', 'Select', 'Search', 'Workspace', 'Correlations'];
  var DEFAULT_CATS = ['Uncategorized', 'Key evidence', 'Needs checking', 'Background', 'Set aside'];
  var RELATIONS = ['Supports', 'Contradicts', 'Different figures', 'Same claim', 'Same event', 'Same subject', 'Same origin', 'Checks this', 'Reports on', 'Other'];
  var DASHED = ['Contradicts', 'Different figures'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function fresh() {
    return {
      screen: 1, reached: 1, query: { who: [], what: [], when: [], where: [] }, picks: [], notes: {}, added: [],
      run: null, cats: DEFAULT_CATS.slice(), cat: {}, onMap: [], edges: [], pos: {}, dismissed: [],
      corr: { mode: 'map', x: 'date', y: 'cls', color: 'cls', group: 'cls', show: 'all', links: true }
    };
  }
  var state = load();
  // view-only state
  var view = { panel: null, opener: null, error: null, outOfScope: false, seedClass: 'all', seedText: '', showOutside: false, group: 'all', catFilter: 'all', picking: false, target: '' };
  var graph = null, corr = null, timers = [];

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE));
      if (saved && saved.query) {
        if (saved.screen === 3) saved.screen = 2;
        var base = fresh();
        saved.corr = Object.assign(base.corr, saved.corr, { mode: 'map' });
        return Object.assign(base, saved);
      }
    } catch (e) { /* private window or blocked storage: start fresh */ }
    return fresh();
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* the session still works, it just won't survive a reload */ }
  }

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // analyst typed links -> https hrefs
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function fmtDate(d) {
    if (!d) return 'Date not confirmed';
    var p = d.split('-');
    return MONTHS[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0];
  }
  function allEntries() { return CATALOG.concat(state.added); }
  function entry(id) { return allEntries().filter(function (e) { return e.id === id; })[0]; }
  function shortName(e) { return e.publisher.replace(/\s*\(.*$/, '').slice(0, 24); }
  function win() { return S.parseWindow(state.query.when, SC); }

  //top level rendering
  function render(moved) {
    var hash = '#' + STEPS[state.screen - 1].toLowerCase();
    if (location.hash !== hash) location.replace(hash);
    renderSteps();
    graph = null;
    if (corr) { corr.destroy(); corr = null; }
    ({ 1: renderScope, 2: renderSelect, 3: renderLoader, 4: renderWorkspace, 5: renderCorrelations })[state.screen]();
    renderPanel();
    if (moved) { $('screen').focus({ preventScroll: true }); window.scrollTo(0, 0); }
    save();
  }
  function go(n) {
    // the correlation map always opens on the world map
    if (n === 5 && state.screen !== 5) state.corr.mode = 'map';
    state.screen = n;
    state.reached = Math.max(state.reached, n);
    view.panel = null; view.picking = false; view.target = '';
    openFirstSource();
    render(true);
  }
  // Select opens on its first source, except on phones where the panel would cover the list
  function openFirstSource() {
    if (state.screen !== 2 || window.matchMedia('(max-width: 860px)').matches) return;
    var first = visibleSeeds(searchResult())[0];
    if (first) { view.panel = first.entry.id; view.opener = first.entry.id; }
  }
  function renderSteps() {
    $('steps').innerHTML = STEPS.map(function (label, i) {
      var n = i + 1, can = n <= state.reached && n !== 3 && state.screen !== 3;
      return '<button type="button" class="step' + (n === state.screen ? ' on' : '') + '"' + (n === state.screen ? ' aria-current="step"' : '') +
        (can ? ' data-action="go" data-n="' + n + '"' : ' disabled') + '><span>' + n + '</span> ' + label + '</button>';
    }).join('');
  }

  // --- 1 · Who / what / when / where ---
  function renderScope() {
    // keep "Still needed" current as fields get filled, once it has been shown
    if (view.error && view.error.indexOf('Still needed') === 0) {
      var stillMissing = missingCols();
      view.error = stillMissing.length ? 'Still needed: ' + stillMissing.join(', ') + '.' : null;
    }
    var parts = COLS.map(function (c) {
      var tokens = state.query[c.key];
      var unused = SC.suggestions[c.key].filter(function (s) { return tokens.indexOf(s) < 0; });
      return '<section class="col"><label for="in-' + c.key + '" class="col-label">' + c.label + '</label>' +
        '<ul class="tokens">' + tokens.map(function (t, i) {
          return '<li><button type="button" class="token" data-action="untoken" data-col="' + c.key + '" data-i="' + i + '" aria-label="Remove ' + esc(t) + '">' + esc(t) + ' <span aria-hidden="true">×</span></button></li>';
        }).join('') + '</ul>' +
        '<textarea id="in-' + c.key + '" data-col="' + c.key + '" class="col-input" rows="2" autocomplete="off" placeholder="' + esc(c.placeholder) + '"></textarea>' +
        (unused.length ? '<div class="suggest">' + unused.map(function (s) {
          return '<button type="button" class="suggestion" data-action="token" data-col="' + c.key + '" data-value="' + esc(s) + '">+ ' + esc(s) + '</button>';
        }).join('') + '</div>' : '') + '</section>';
    }).join('');
    $('screen').innerHTML =
      '<form id="scope-form" class="scope-page" novalidate><h1>Set your scope</h1>' +
      '<p class="muted">Add who, what, when and where. Type your own and press Enter, or pick a suggestion.</p>' +
      '<div class="wwww">' + parts + '</div>' +
      (view.error ? '<p class="error" role="alert">' + esc(view.error) + '</p>' : '') +
      (view.outOfScope ? '<div class="notice" role="alert"><p>This playtest only holds one scenario: the ' + esc(SC.label) + ', Jan 3–16, 2026.</p>' +
        '<button type="button" data-action="use-scenario">Use that scenario</button></div>' : '') +
      '<div class="row"><button type="submit" class="primary">Find sources</button></div></form>';
    $('scope-form').addEventListener('submit', submitScope);
    Array.prototype.forEach.call($('screen').querySelectorAll('textarea[data-col]'), function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (addToken(inp.getAttribute('data-col'), inp.value)) {
          var col = inp.getAttribute('data-col');
          render();
          $('in-' + col).focus();
        }
      });
    });
  }
  function addToken(col, value) {
    var v = value.trim();
    if (!v || state.query[col].indexOf(v) >= 0) return false;
    state.query[col].push(v);
    return true;
  }
  function missingCols() {
    return COLS.filter(function (c) { return !state.query[c.key].length; }).map(function (c) { return c.label; });
  }
  function submitScope(e) {
    e.preventDefault();
    // Text typed but not yet entered still counts
    Array.prototype.forEach.call($('screen').querySelectorAll('textarea[data-col]'), function (inp) {
      addToken(inp.getAttribute('data-col'), inp.value);
    });
    var missing = missingCols();
    view.error = missing.length ? 'Still needed: ' + missing.join(', ') + '.' : null;
    view.outOfScope = !missing.length && !S.inScope(state.query, SC);
    if (missing.length || view.outOfScope) return render();
    state.run = null;
    state.reached = 2;
    go(2);
  }

  // picking sources from the catalog
  function searchResult() {
    return S.search(state.query, allEntries(), SC);
  }
  function renderSelect() {
    var r = searchResult();
    var counts = {};
    r.inWindow.forEach(function (x) { counts[x.entry.cls] = (counts[x.entry.cls] || 0) + 1; });
    var q = state.query;
    $('screen').innerHTML =
      '<div class="select-wrap"><div class="select"><aside class="scope-side" aria-label="Your scope"><dl>' +
      COLS.map(function (c) { return '<div><dt>' + c.label + '</dt><dd>' + esc(q[c.key].join(', ')) + '</dd></div>'; }).join('') +
      '</dl><button type="button" class="link" data-action="go" data-n="1">Edit</button></aside>' +
      '<div class="page"><h1>Pick what to start from</h1>' +
      (r.window.parsed ? '' : '<p class="notice">Couldn\'t read those dates, so using ' + fmtDate(r.window.from) + ' to ' + fmtDate(r.window.to) + '.</p>') +
      '<div class="filters"><input id="seed-text" type="search" placeholder="Search in list" aria-label="Search in list" value="' + esc(view.seedText) + '">' +
      '<div class="pills" role="group" aria-label="Filter by source class">' +
        pill('all', 'All', r.inWindow.length) + S.CLASSES.filter(function (c) { return counts[c]; }).map(function (c) { return pill(c, S.CLASS_LABELS[c], counts[c]); }).join('') +
      '</div></div>' +
      '<ul id="seed-list" class="rows"></ul>' +
      '<div id="seed-outside"></div>' +
      '<div class="foot-spacer"></div></div></div></div>' +
      '<div id="select-foot" class="foot"></div>' + addDialog();
    $('seed-text').addEventListener('input', function () { view.seedText = this.value; renderSeedList(); });
    $('add-form').addEventListener('submit', submitAdd);
    renderSeedList();
    renderSelectFoot();
  }
  function pill(value, label, n) {
    return '<button type="button" class="pill" data-action="seed-class" data-value="' + value + '" aria-pressed="' + (view.seedClass === value) + '">' + esc(label) + ' <span class="count">' + n + '</span></button>';
  }
  function seedRow(x) {
    var e = x.entry, picked = state.picks.indexOf(e.id) >= 0;
    var warn = S.signals(e, win()).filter(function (s) { return s.warn; }).map(function (s) {
      return '<span class="flag" data-tip="' + esc(s.detail) + '">' + esc(s.label) + '<span class="sr">: ' + esc(s.detail) + '</span></span>';
    }).join('');
    var lang = e.lang !== 'English' && e.lang !== 'Unknown' ? '<span class="tag">' + esc(e.lang) + '</span>' : '';
    return '<li class="row-item' + (view.panel === e.id ? ' open' : '') + (picked ? ' picked' : '') + '">' +
      '<button type="button" class="row-main" data-action="open" data-id="' + esc(e.id) + '">' +
        '<span class="row-title">' + esc(e.title) + '</span>' +
        '<span class="row-meta">' + esc(e.publisher) + ' · ' + esc(fmtDate(e.published)) + ' · ' + esc(e.format) + '</span>' +
        (warn || lang ? '<span class="row-tags">' + lang + warn + '</span>' : '') +
      '</button>' +
      '<label class="tick"><input type="checkbox" data-action="pick" data-id="' + esc(e.id) + '"' + (picked ? ' checked' : '') + '><span class="sr">Select ' + esc(e.title) + '</span></label></li>';
  }
  function visibleSeeds(r) {
    var text = view.seedText.toLowerCase();
    return r.inWindow.filter(function (x) {
      return (view.seedClass === 'all' || x.entry.cls === view.seedClass) &&
        (!text || (x.entry.title + ' ' + x.entry.publisher + ' ' + x.entry.format + ' ' + x.entry.summary).toLowerCase().indexOf(text) >= 0);
    });
  }
  function renderSeedList() {
    var r = searchResult();
    var list = visibleSeeds(r);
    $('seed-list').innerHTML = list.map(seedRow).join('') || '<li class="empty">Nothing matches this filter.</li>';
    $('seed-outside').innerHTML = r.outside.length
      ? '<details class="more"' + (view.showOutside ? ' open' : '') + '><summary>' + plural(r.outside.length, 'source') + ' outside your dates</summary>' +
        '<p class="muted small">Kept here so nothing is hidden from you. You can still select them.</p><ul class="rows">' + r.outside.map(seedRow).join('') + '</ul></details>'
      : '';
    var d = $('seed-outside').querySelector('details');
    if (d) d.addEventListener('toggle', function () { view.showOutside = d.open; });
  }
  function renderSelectFoot() {
    var n = state.picks.length;
    $('select-foot').innerHTML =
      '<div class="foot-text"><strong>' + plural(n, 'source') + ' selected</strong></div>' +
      '<div class="foot-actions"><button type="button" data-action="add-open">+ Add a source</button>' +
      '<button type="button" class="primary" data-action="start"' + (n ? '' : ' disabled') + '>Search from these</button></div>';
  }
  function addDialog() {
    return '<dialog id="add-dialog"><form id="add-form"><h2>Add a source</h2>' +
      '<label>Title <input name="title" required></label>' +
      '<label>Link <input name="url" type="url" required placeholder="https://"></label>' +
      '<label>Class <select name="cls">' + S.CLASSES.map(function (c) { return '<option value="' + c + '">' + esc(S.CLASS_LABELS[c]) + '</option>'; }).join('') + '</select></label>' +
      '<label>Date (optional) <input name="date" type="date"></label>' +
      '<div class="row"><button type="submit" class="primary">Add and select</button><button type="button" data-action="add-close">Cancel</button></div></form></dialog>';
  }
  function submitAdd(e) {
    e.preventDefault();
    var f = e.target;
    var url = safeUrl(f.url.value.trim());
    if (!f.title.value.trim() || !url) { f.url.setCustomValidity(url ? '' : 'Use a link that starts with http or https.'); f.reportValidity(); f.url.setCustomValidity(''); return; }
    var id = 'added-' + (state.added.length + 1) + '-' + Date.now();
    state.added.push({
      id: id, title: f.title.value.trim(), url: url, publisher: 'Added by you', published: f.date.value || null,
      dateNote: f.date.value ? '' : 'You did not give a date.', cls: f.cls.value, format: 'Your source', lang: 'Unknown', added: 'analyst', read: 'analyst',
      origin: 'added by analyst', who: 'not stated', topics: [], seed: true, summary: 'You added this source. Add your own notes below.', claims: []
    });
    state.picks.push(id);
    state.run = null;
    state.reached = 2;
    render();
  }

  // loader
  function startSearch() {
    var picks = state.picks.map(entry).filter(Boolean);
    var r = S.expand(picks, state.query, allEntries(), LINKS, SC);
    var ids = r.gathered.map(function (g) { return { id: g.entry.id, group: g.group, why: g.why }; });
    state.run = { gathered: ids, skipped: r.skipped, missingClasses: r.missingClasses, steps: r.steps };
    state.onMap = state.picks.concat(state.onMap.filter(function (id) {
      return state.picks.indexOf(id) < 0 && ids.some(function (g) { return g.id === id; });
    }));
    state.edges = state.edges.filter(function (e) { return state.onMap.indexOf(e.a) >= 0 && state.onMap.indexOf(e.b) >= 0; });
    view.group = 'all'; view.catFilter = 'all';
    go(3);
    var i = 0;
    (function next() {
      i++;
      paintLoader(i);
      if (i < state.run.steps.length) timers.push(setTimeout(next, 800));
      else timers.push(setTimeout(function () { go(4); }, 900));
    })();
  }
  function cancelSearch() {
    timers.forEach(clearTimeout); timers = [];
    go(2);
  }
  function renderLoader() {
    $('screen').innerHTML = '<div class="page loader"><h1>Searching the web</h1>' +
      '<div class="progress" role="progressbar" aria-label="Search progress" aria-valuemin="0" aria-valuemax="' + state.run.steps.length + '" aria-valuenow="0"><span id="progress-bar"></span></div>' +
      '<ol id="load-steps" class="load-steps" aria-live="polite"></ol>' +
      '<p class="muted small">Playtest: this simulates a scraper over a prepared catalog of ' + allEntries().length + ' sources.</p>' +
      '<button type="button" data-action="cancel">Cancel</button></div>';
  }
  function paintLoader(done) {
    var steps = state.run.steps;
    var bar = $('progress-bar'); if (!bar) return;
    bar.style.width = (done / steps.length * 100) + '%';
    bar.parentNode.setAttribute('aria-valuenow', done);
    $('load-steps').innerHTML = steps.slice(0, done).map(function (s, i) {
      var active = i === done - 1;
      return '<li class="' + (active ? 'active' : 'done') + '"><span>' + esc(s.label) + '</span><span class="muted small">' + esc(s.result) + '</span></li>';
    }).join('');
  }

  //workspace/dashboard
  function workspaceRows() {
    var rows = state.picks.map(function (id) { return { id: id, group: 'pick' }; }).concat(state.run ? state.run.gathered : []);
    return rows.filter(function (r) { return entry(r.id); });
  }
  function catOf(id) { return state.cat[id] || state.cats[0]; }
  function catColor(name) { var i = state.cats.indexOf(name); return 'var(--cat-' + (i <= 0 ? 0 : ((i - 1) % 6) + 1) + ')'; }

  function renderWorkspace() {
    if (!state.run) return go(2);
    var ents = workspaceRows().map(function (r) { return entry(r.id); });
    var gaps = S.gaps(ents, SC);
    $('screen').innerHTML =
      '<div class="ws-page"><h1 class="sr">Workspace</h1>' +
      '<details class="missing"><summary><strong>What\'s missing</strong> <span class="count">' + gaps.length + '</span></summary><ul>' +
        gaps.map(function (g) { return '<li><strong>' + esc(g.title) + ':</strong> ' + esc(g.evidence) + '</li>'; }).join('') + '</ul></details>' +
      '<div class="ws"><section class="ws-list" aria-label="Sources"><div class="ws-filters" id="ws-filters"></div><ul id="ws-rows" class="rows compact"></ul></section>' +
      '<section class="ws-map" aria-label="Connections map">' +
        '<svg id="map" role="group" aria-label="Map of sources and connections"></svg>' +
        '<div id="map-hint" class="map-hint"></div>' +
        '<button type="button" class="primary map-next" data-action="go" data-n="5">Correlation map</button>' +
        '<div id="map-key" class="map-key"></div></section></div></div>';
    graph = window.NodeMap.create($('map'), {
      onSelect: nodeClicked,
      onSettle: function (points) { points.forEach(function (p) { state.pos[p.id] = { x: p.x, y: p.y }; }); save(); }
    });
    renderWsList();
    renderKey();
    drawMap(0.6);
  }
  function renderWsList() {
    var rows = workspaceRows();
    var groups = [['all', 'All'], ['pick', 'Your picks'], ['related', 'Related'], ['widened', 'Semi-related']];
    $('ws-filters').innerHTML = '<div class="pills" role="group" aria-label="Filter by how the source got here">' + groups.map(function (g) {
      var n = g[0] === 'all' ? rows.length : rows.filter(function (r) { return r.group === g[0]; }).length;
      return '<button type="button" class="pill" data-action="ws-group" data-value="' + g[0] + '" aria-pressed="' + (view.group === g[0]) + '">' + g[1] + ' <span class="count">' + n + '</span></button>';
    }).join('') + '</div><label class="small">Category <select id="cat-filter"><option value="all">All</option>' +
      state.cats.map(function (c) { return '<option' + (view.catFilter === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label>';
    $('cat-filter').addEventListener('change', function () { view.catFilter = this.value; renderWsList(); });
    var list = rows.filter(function (r) {
      return (view.group === 'all' || r.group === view.group) && (view.catFilter === 'all' || catOf(r.id) === view.catFilter);
    });
    $('ws-rows').innerHTML = list.map(function (r) {
      var e = entry(r.id), on = state.onMap.indexOf(r.id) >= 0, cat = catOf(r.id);
      return '<li class="row-item' + (view.panel === r.id ? ' open' : '') + '">' +
        '<button type="button" class="row-main" data-action="open" data-id="' + esc(r.id) + '">' +
        '<span class="row-title">' + esc(e.title) + '</span>' +
        '<span class="row-meta">' + esc(shortName(e)) + ' · ' + esc(fmtDate(e.published)) + (state.notes[r.id] ? ' · has note' : '') + '</span>' +
        '<span class="row-tags"><span class="cat-tag"><i style="background:' + catColor(cat) + '"></i>' + esc(cat) + '</span></span></button>' +
        '<button type="button" class="map-toggle" data-action="toggle-map" data-id="' + esc(r.id) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Remove from map: ' : 'Add to map: ') + esc(e.title) + '">' + (on ? 'On map' : '+ Map') + '</button></li>';
    }).join('') || '<li class="empty">Nothing in this view.</li>';
  }
  function renderKey() {
    $('map-key').innerHTML = '<strong class="small">Key</strong>' + state.cats.map(function (c) {
      return '<span class="cat-tag"><i style="background:' + catColor(c) + '"></i>' + esc(c) + '</span>';
    }).join('') + '<span class="small muted key-line">Dashed: differs or contradicts</span>';
  }
  function drawMap(energy) {
    if (!graph) return;
    var nodes = state.onMap.map(entry).filter(Boolean).map(function (e) {
      return { id: e.id, label: shortName(e), title: e.title, category: catOf(e.id), color: catColor(catOf(e.id)), position: state.pos[e.id] };
    });
    var edges = state.edges.map(function (e) {
      return { a: e.a, b: e.b, dashed: DASHED.indexOf(e.rel) >= 0, label: e.rel + (e.note ? ': ' + e.note : '') };
    });
    graph.update(nodes, edges, { selected: view.panel, picking: view.picking, energy: energy });
    var hint = $('map-hint');
    if (hint) {
      hint.textContent = view.picking ? 'Select the source to connect to. Press Esc to cancel.' :
        (nodes.length < 2 ? 'Add sources to the map from the list.' : (state.edges.length ? '' : 'Select a source to connect it to another.'));
      hint.className = 'map-hint' + (view.picking ? ' active' : '');
    }
  }
  function nodeClicked(id) {
    if (view.picking && view.panel && id !== view.panel) {
      view.target = id; view.picking = false;
      renderPanel(); drawMap(0);
      var rel = $('edge-rel'); if (rel) rel.focus();
      return;
    }
    openPanel(id, null);
  }

  // --- 5 · Correlation map ---
  // One dot per source. The analyst picks the arrangement; every option is a recorded fact or their own label.
  var VIEWS = [['map', 'Map'], ['axes', 'Scatter'], ['groups', 'Groups']];
  var ORIGIN_ORDER = ['official statement', 'wire', 'original reporting', 'analysis', 'fact-check', 'monitor', 'social post (via report)', 'user-generated'];
  var READ_LABELS = { direct: 'Text read', search: 'Search text only', none: 'Not read', analyst: 'Added by you' };
  var WHO_LABELS = { named: 'Named sources', pseudonymous: 'Pseudonymous sources', 'not stated': 'Sources not stated' };
  var GROUP_LABELS = { pick: 'Your picks', related: 'Related', widened: 'Semi-related' };
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function corrFields() {
    return {
      date: { label: 'Date published', dateOnly: true },
      cls: { label: 'Source class', order: S.CLASSES.map(function (c) { return S.CLASS_LABELS[c]; }), get: function (e) { return S.CLASS_LABELS[e.cls]; } },
      origin: { label: 'How it knows', order: ORIGIN_ORDER.map(cap), get: function (e) { return e.origin && cap(e.origin); } },
      read: { label: 'How it was read', order: ['Text read', 'Search text only', 'Not read', 'Added by you'], get: function (e) { return READ_LABELS[e.read]; } },
      who: { label: 'Who it names', order: ['Named sources', 'Pseudonymous sources', 'Sources not stated'], get: function (e) { return WHO_LABELS[e.who]; } },
      lang: { label: 'Language', order: ['English', 'Spanish', 'Unknown'], get: function (e) { return e.lang; } },
      group: { label: 'How it got here', order: ['Your picks', 'Related', 'Semi-related'] },
      cat: { label: 'Your category', order: state.cats, get: function (e) { return catOf(e.id); } }
    };
  }
  function renderCorrelations() {
    if (!state.run) return go(2);
    $('screen').innerHTML = '<div class="corr-page"><h1 class="sr">Correlation map</h1>' +
      '<div class="corr-bar"><div><h2>Correlation map</h2><p class="muted small">Click a dot to open its source.</p></div>' +
      '<div class="corr-tools"><div class="pills" role="group" aria-label="View">' + VIEWS.map(function (v) {
        return '<button type="button" class="pill" data-action="corr-view" data-value="' + v[0] + '" aria-pressed="' + (state.corr.mode === v[0]) + '">' + v[1] + '</button>';
      }).join('') + '</div><div id="corr-controls" class="corr-controls"></div></div></div>' +
      '<div id="corr-key" class="corr-key"></div>' +
      '<div class="corr-stage"><div id="corr-host" class="corr-host"></div></div>' +
      '<div class="corr-foot"><p id="corr-status" class="muted small" aria-live="polite"></p><div class="row">' +
      '<button type="button" id="corr-play" data-action="corr-play">Replay in order published</button>' +
      '<button type="button" data-action="go" data-n="4">Back to workspace</button>' +
      '<button type="button" data-action="export">Download this session (JSON)</button></div></div></div>';
    corr = window.CorrMap.create($('corr-host'), {
      onSelect: function (id) { return view.panel === id ? closePanel() : openPanel(id, id); }
    });
    renderCorrControls();
    drawCorr(false);
  }
  // a category edit in the panel updates whichever screen is showing
  function refreshAfterEdit() {
    if (state.screen === 4) { renderWsList(); renderKey(); drawMap(0); }
    if (state.screen === 5) { renderCorrControls(); drawCorr(false); }
  }
  function renderCorrControls() {
    var F = corrFields(), c = state.corr;
    function select(id, label, value, keys) {
      return '<label class="small">' + label + ' <select id="' + id + '">' + keys.map(function (k) {
        return '<option value="' + k + '"' + (k === value ? ' selected' : '') + '>' + esc(F[k].label) + '</option>';
      }).join('') + '</select></label>';
    }
    var facts = Object.keys(F).filter(function (k) { return !F[k].dateOnly; });
    var onMap = state.onMap.filter(function (id) { return workspaceRows().some(function (r) { return r.id === id; }); }).length;
    var html = '<label class="small">Show <select id="corr-show"><option value="all"' + (c.show !== 'map' ? ' selected' : '') + '>All gathered sources</option>' +
      '<option value="map"' + (c.show === 'map' ? ' selected' : '') + '>Only on my workspace map (' + onMap + ')</option></select></label>';
    if (c.mode === 'axes') html += select('corr-x', 'X', c.x, Object.keys(F)) + select('corr-y', 'Y', c.y, facts);
    if (c.mode === 'groups') html += select('corr-group', 'Group by', c.group, facts);
    html += select('corr-color', 'Color', c.color, facts);
    html += '<label class="small check"><input type="checkbox" id="corr-links"' + (c.links ? ' checked' : '') + '> Your connections</label>';
    $('corr-controls').innerHTML = html;
    [['corr-show', 'show'], ['corr-x', 'x'], ['corr-y', 'y'], ['corr-group', 'group'], ['corr-color', 'color']].forEach(function (p) {
      var el = $(p[0]);
      if (el) el.addEventListener('change', function () { state.corr[p[1]] = this.value; save(); drawCorr(true); });
    });
    $('corr-links').addEventListener('change', function () { state.corr.links = this.checked; save(); drawCorr(false); });
  }
  function drawCorr(animate) {
    if (!corr) return;
    var F = corrFields(), c = state.corr, w = win(), seen = {};
    var items = workspaceRows().filter(function (r) {
      if (c.show === 'map' && state.onMap.indexOf(r.id) < 0) return false;
      return !seen[r.id] && (seen[r.id] = true);
    }).map(function (r) {
      var e = entry(r.id), values = {};
      Object.keys(F).forEach(function (k) {
        if (F[k].dateOnly) return;
        values[k] = (k === 'group' ? GROUP_LABELS[r.group] : F[k].get(e)) || 'Not recorded';
      });
      return { id: e.id, title: e.title, sub: shortName(e) + ' · ' + fmtDate(e.published), date: e.published, status: S.windowStatus(e, w),
        values: values, claims: (e.claims || []).length, place: window.DEMO_PLACES.of(e.id) };
    });
    // categories in a fixed order; empty ones stay visible so gaps show
    function order(k) {
      var list = (F[k].order || []).slice();
      items.forEach(function (d) { if (list.indexOf(d.values[k]) < 0) list.push(d.values[k]); });
      return list;
    }
    var colorOrder = order(c.color);
    function colorOf(v) {
      if (c.color === 'cat') return catColor(v);
      if (v === 'Unknown' || v === 'Not recorded') return 'var(--cat-0)';
      return 'var(--cat-' + ((colorOrder.indexOf(v) % 8) + 1) + ')';
    }
    items.forEach(function (d) { d.color = colorOf(d.values[c.color]); });
    var byId = {}; items.forEach(function (d) { byId[d.id] = d; });
    var links = c.links ? state.edges.map(function (x) {
      return { a: x.a, b: x.b, dashed: DASHED.indexOf(x.rel) >= 0, label: x.rel + (x.note ? ': ' + x.note : '') };
    }) : [];
    corr.update({
      mode: c.mode, items: items, byId: byId, order: order, links: links, window: w,
      x: { key: c.x, label: F[c.x].label }, y: { key: c.y, label: F[c.y].label }, group: { key: c.group, label: F[c.group].label },
      scope: window.DEMO_PLACES.scope(state.query.where)
    }, animate);
    corr.highlight(view.panel);

    var counts = {}; items.forEach(function (d) { counts[d.values[c.color]] = (counts[d.values[c.color]] || 0) + 1; });
    $('corr-key').innerHTML = '<strong class="small">' + esc(F[c.color].label) + '</strong>' + colorOrder.filter(function (v) { return counts[v]; }).map(function (v) {
      return '<span class="cat-tag"><i style="background:' + colorOf(v) + '"></i>' + esc(v) + ' · ' + counts[v] + '</span>';
    }).join('') + (links.length ? '<span class="small muted key-line">Lines: your connections. Dashed: differs or contradicts</span>' : '');
    var undated = items.filter(function (d) { return d.status === 'unknown'; }).length;
    var outside = items.filter(function (d) { return d.status === 'out'; }).length;
    var unplaced = items.filter(function (d) { return !d.place; }).length;
    if (!items.length) { $('corr-status').textContent = 'No sources on your workspace map yet. Add some on screen 4, or show all gathered sources.'; return; }
    $('corr-status').textContent = plural(items.length, 'source') + (c.mode === 'map'
      ? ' · ' + unplaced + ' with no location recorded'
      : ' · ' + undated + ' with no confirmed date · ' + outside + ' outside your dates');
  }
  function toggleReplay() {
    var btn = $('corr-play');
    var status = $('corr-status').textContent;
    function done() { btn.textContent = 'Replay in order published'; $('corr-status').textContent = status; }
    if (corr.playing()) { corr.stop(true); return done(); }
    btn.textContent = 'Stop replay';
    corr.play(function (d, i, n) {
      $('corr-status').textContent = (d.status === 'in' ? fmtDate(d.date) : d.status === 'out' ? 'Outside your dates' : 'Date not confirmed') + ' · ' + i + ' of ' + n + ' sources';
    }, done);
  }
  function exportSession() {
    var data = { exported: new Date().toISOString(), query: state.query, picks: state.picks, notes: state.notes, categories: state.cats, assigned: state.cat, onMap: state.onMap, connections: state.edges, gathered: state.run && state.run.gathered, added: state.added };
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'playtest-session.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // source panel (p2,p4)
  function openPanel(id, opener) {
    view.panel = id; view.opener = opener; view.picking = false; view.target = '';
    renderPanel();
    markOpenRow();
    drawMap(0);
    if (corr) corr.highlight(id);
    var c = $('panel-close'); if (c) c.focus({ preventScroll: true });
  }
  function closePanel() {
    var opener = view.opener;
    view.panel = null; view.picking = false; view.target = '';
    renderPanel();
    markOpenRow();
    drawMap(0);
    if (corr) corr.highlight(null);
    if (opener) {
      var back = $('screen').querySelector('[data-action="open"][data-id="' + opener + '"]');
      if (back) back.focus({ preventScroll: true });
      else if (corr) corr.focus(opener);
    }
  }
  function markOpenRow() {
    Array.prototype.forEach.call($('screen').querySelectorAll('.row-item'), function (li) {
      var b = li.querySelector('[data-action="open"]');
      li.classList.toggle('open', !!b && b.getAttribute('data-id') === view.panel);
    });
  }
  function renderPanel() {
    var p = $('panel');
    var e = view.panel && entry(view.panel);
    p.hidden = !e;
    $('shell').classList.toggle('has-panel', !!e);
    if (!e) { p.innerHTML = ''; return; }
    var w = win();
    var signals = S.signals(e, w);
    var url = safeUrl(e.url);
    var body = '<div class="panel-top"><span class="muted small">' + esc(S.CLASS_LABELS[e.cls]) + ' · ' + esc(e.format) + '</span>' +
      '<button type="button" id="panel-close" class="icon" data-action="close" aria-label="Close source">×</button></div>' +
      (state.screen >= 4 ? categoryControls(e) : '') +
      '<h2 class="panel-title">' + esc(e.title) + '</h2>' +
      '<p class="muted small">' + esc(e.publisher) + ' · ' + esc(fmtDate(e.published)) + (e.lang !== 'Unknown' ? ' · ' + esc(e.lang) : '') + '</p>' +
      (url ? '<p><a class="open-link" href="' + esc(url) + '" target="_blank" rel="noopener">Open the original ↗</a></p>' : '');
    if (e.youtube) {
      body += '<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(e.youtube) + '" title="' + esc(e.title) + '" allowfullscreen loading="lazy"></iframe></div>';
    }
    if (state.screen === 2) {
      body += '<label class="panel-pick"><input type="checkbox" data-action="pick" data-id="' + esc(e.id) + '"' + (state.picks.indexOf(e.id) >= 0 ? ' checked' : '') + '> Work from this source</label>';
    }
    body += '<h3>About this source</h3><ul class="signals">' + signals.map(function (s) {
      return '<li><span class="' + (s.warn ? 'flag' : 'tag') + '">' + esc(s.label) + '</span> <span class="muted small">' + esc(s.detail) + '</span></li>';
    }).join('') + '</ul>';
    // Unknown and out-of-window dates already show this note in their signal
    if (e.dateNote && S.windowStatus(e, w) === 'in') body += '<p class="muted small">' + esc(e.dateNote) + '</p>';
    body += '<h3>Summary</h3><p>' + esc(e.summary) + '</p>';
    if (e.claims && e.claims.length) {
      body += '<h3>Who says what</h3><ul class="claims">' + e.claims.map(function (c) {
        return '<li><strong>' + esc(c.by) + '</strong><br>' + esc(c.text) + '</li>';
      }).join('') + '</ul>';
    }
    if (e.term && e.term.length) body += '<h3>Words it uses</h3><p class="small">' + esc(e.term.join(', ')) + '</p>';
    body += '<h3><label for="note">Your notes</label></h3><textarea id="note" rows="4" placeholder="What stands out? What would you check?">' + esc(state.notes[e.id] || '') + '</textarea>';
    if (state.screen === 4) body += connectionControls(e);
    p.innerHTML = body;
    $('note').addEventListener('input', function () { state.notes[e.id] = this.value; save(); });
    var catSel = $('cat-select');
    if (catSel) catSel.addEventListener('change', function () {
      state.cat[e.id] = this.value; save(); refreshAfterEdit();
    });
    var newCat = $('cat-form');
    if (newCat) newCat.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = $('cat-new').value.trim();
      if (name && state.cats.indexOf(name) < 0) state.cats.push(name);
      if (name) state.cat[e.id] = name;
      save(); renderPanel(); refreshAfterEdit();
    });
    var edgeForm = $('edge-form');
    if (edgeForm) edgeForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var target = $('edge-target').value;
      if (!target) return;
      addEdge(e.id, target, $('edge-rel').value, $('edge-note').value.trim());
    });
    var targetSel = $('edge-target');
    if (targetSel) targetSel.addEventListener('change', function () { view.target = this.value; });
  }
  function categoryControls(e) {
    return '<h3><label for="cat-select">Category</label></h3><select id="cat-select">' + state.cats.map(function (c) {
      return '<option' + (catOf(e.id) === c ? ' selected' : '') + '>' + esc(c) + '</option>';
    }).join('') + '</select><form id="cat-form" class="inline-form"><input id="cat-new" type="text" placeholder="New category" aria-label="New category"><button type="submit">Add</button></form>';
  }
  function connectionControls(e) {
    var mine = state.edges.filter(function (x) { return x.a === e.id || x.b === e.id; });
    var html = '<h3>Connections</h3>';
    html += mine.length ? '<ul class="edges">' + mine.map(function (x) {
      var other = entry(x.a === e.id ? x.b : x.a);
      return '<li><span><strong>' + esc(x.rel) + '</strong> ' + esc(other ? other.title : '') + (x.note ? '<br><span class="muted small">' + esc(x.note) + '</span>' : '') + '</span>' +
        '<button type="button" class="icon" data-action="remove-edge" data-id="' + esc(x.id) + '" aria-label="Remove connection">×</button></li>';
    }).join('') + '</ul>' : '';

    var options = workspaceRows().filter(function (r) { return r.id !== e.id; }).map(function (r) {
      return '<option value="' + esc(r.id) + '"' + (view.target === r.id ? ' selected' : '') + '>' + esc(shortName(entry(r.id))) + ': ' + esc(entry(r.id).title.slice(0, 48)) + '</option>';
    }).join('');
    html += '<form id="edge-form" class="edge-form"><label class="small">Connect to <select id="edge-target"><option value="">Choose a source</option>' + options + '</select></label>' +
      '<button type="button" class="link" data-action="pick-on-map">' + (view.picking ? 'Picking on the map…' : 'Pick on the map') + '</button>' +
      '<label class="small">Relationship <select id="edge-rel">' + RELATIONS.map(function (r) { return '<option>' + r + '</option>'; }).join('') + '</select></label>' +
      '<label class="small">Note (optional) <input id="edge-note" type="text"></label>' +
      '<button type="submit">Connect</button></form>';

    var suggestions = LINKS.filter(function (l) {
      if (l.a !== e.id && l.b !== e.id) return false;
      var other = l.a === e.id ? l.b : l.a;
      return workspaceRows().some(function (r) { return r.id === other; }) && !connected(l.a, l.b) && state.dismissed.indexOf(l.a + '|' + l.b) < 0;
    });
    if (suggestions.length) {
      html += '<h3>Documented links</h3><ul class="edges">' + suggestions.map(function (l) {
        var key = esc(l.a + '|' + l.b), other = entry(l.a === e.id ? l.b : l.a);
        return '<li><span><strong>' + esc(l.rel) + '</strong> ' + esc(other.title) + '<br><span class="muted small">' + esc(l.why) + '</span></span>' +
          '<span class="stack"><button type="button" data-action="accept-link" data-key="' + key + '">Add</button><button type="button" class="link" data-action="dismiss-link" data-key="' + key + '">Dismiss</button></span></li>';
      }).join('') + '</ul>';
    }
    return html;
  }
  function connected(a, b) { return state.edges.some(function (x) { return (x.a === a && x.b === b) || (x.a === b && x.b === a); }); }
  function addEdge(a, b, rel, note) {
    if (a === b || connected(a, b)) { view.target = ''; renderPanel(); return; }
    [a, b].forEach(function (id) { if (state.onMap.indexOf(id) < 0) state.onMap.push(id); });
    state.edges.push({ id: 'edge-' + Date.now() + '-' + state.edges.length, a: a, b: b, rel: rel, note: note });
    view.target = '';
    save(); renderPanel(); renderWsList(); drawMap(0.5);
  }

  // events
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-action]');
    if (!t) return;
    var a = t.getAttribute('data-action'), id = t.getAttribute('data-id');
    if (a === 'pick') return togglePick(id, t.checked);
    if (a === 'go') return go(+t.getAttribute('data-n'));
    if (a === 'token') {
      addToken(t.getAttribute('data-col'), t.getAttribute('data-value'));
      return render();
    }
    if (a === 'untoken') { state.query[t.getAttribute('data-col')].splice(+t.getAttribute('data-i'), 1); return render(); }
    if (a === 'use-scenario') {
      state.query = { who: ['Donald Trump', 'Nicolás Maduro'], what: ['Kidnapping'], when: ['Jan 3 – Jan 16, 2026'], where: ['Venezuela'] };
      view.outOfScope = false; view.error = null;
      return render();
    }
    if (a === 'seed-class') {
      view.seedClass = t.getAttribute('data-value');
      Array.prototype.forEach.call($('screen').querySelectorAll('[data-action="seed-class"]'), function (b) { b.setAttribute('aria-pressed', b === t); });
      return renderSeedList();
    }
    if (a === 'open') return view.panel === id ? closePanel() : openPanel(id, id);
    if (a === 'close') return closePanel();
    if (a === 'start') return startSearch();
    if (a === 'cancel') return cancelSearch();
    if (a === 'add-open') return $('add-dialog').showModal();
    if (a === 'add-close') return $('add-dialog').close();
    if (a === 'ws-group') { view.group = t.getAttribute('data-value'); return renderWsList(); }
    if (a === 'toggle-map') {
      var i = state.onMap.indexOf(id);
      if (i >= 0) {
        state.onMap.splice(i, 1);
        state.edges = state.edges.filter(function (x) { return x.a !== id && x.b !== id; });
      } else state.onMap.push(id);
      save(); renderWsList(); drawMap(0.5); renderPanel();
      return;
    }
    if (a === 'pick-on-map') { view.picking = !view.picking; renderPanel(); drawMap(0); return; }
    if (a === 'remove-edge') {
      state.edges = state.edges.filter(function (x) { return x.id !== id; });
      save(); renderPanel(); drawMap(0.3);
      return;
    }
    if (a === 'accept-link' || a === 'dismiss-link') {
      var key = t.getAttribute('data-key'), parts = key.split('|');
      if (a === 'dismiss-link') { state.dismissed.push(key); save(); return renderPanel(); }
      var link = LINKS.filter(function (l) { return l.a === parts[0] && l.b === parts[1]; })[0];
      return addEdge(link.a, link.b, RELATIONS.indexOf(link.rel) >= 0 ? link.rel : 'Other', link.why);
    }
    if (a === 'corr-view') {
      state.corr.mode = t.getAttribute('data-value'); save();
      Array.prototype.forEach.call($('screen').querySelectorAll('[data-action="corr-view"]'), function (b) { b.setAttribute('aria-pressed', b === t); });
      $('corr-play').textContent = 'Replay in order published';
      renderCorrControls(); return drawCorr(true);
    }
    if (a === 'corr-play') return toggleReplay();
    if (a === 'export') return exportSession();
    if (a === 'restart') {
      if (!window.confirm('Clear this session and start over?')) return;
      timers.forEach(clearTimeout); timers = [];
      state = fresh();
      view.panel = null; view.seedClass = 'all'; view.seedText = ''; view.error = null; view.outOfScope = false;
      render(true);
    }
  });
  function togglePick(id, on) {
    var i = state.picks.indexOf(id);
    if (on && i < 0) state.picks.push(id);
    if (!on && i >= 0) state.picks.splice(i, 1);
    //picks changed, so an earlier search no longer matches them
    state.run = null;
    state.reached = 2;
    save(); renderSteps(); renderSeedList(); renderSelectFoot(); renderPanel();
  }
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if ($('add-dialog') && $('add-dialog').open) return;
    if (view.picking) { view.picking = false; renderPanel(); drawMap(0); return; }
    if (view.panel) closePanel();
  });

  openFirstSource();
  render();
})();
