// playtest flow: 1 scope (what/when/where/who) -> 2 searching -> 3 pick sources -> 4 workspace -> 5 correlation map (later).
(function () {
  var S = window.MockScraper, SC = window.SCENARIO, CATALOG = window.CATALOG, LINKS = window.CATALOG_LINKS;
  var VOICES = window.VOICES, SPEAKERS = window.SPEAKERS;
  // Simulated teammates (data/team.js): their notes and connections, shown alongside the analyst's own
  var TEAM = window.TEAM || { members: {}, notes: [], edges: [] };
  var STORE = 'playtest-venezuela-v2';
  var COLS = [
    { key: 'who', label: 'Who', placeholder: 'People, governments, groups', question: 'Who/which parties are involved?' },
    { key: 'what', label: 'What', placeholder: 'What type of crisis or problem is this?', question: 'What crisis or issue are you researching?' },
    { key: 'when', label: 'When', placeholder: 'Time of occurrence', question: 'When did this occur?' },
    { key: 'where', label: 'Where', placeholder: 'Countries, cities, sites', question: 'Where did this occur?' }
  ];
  // Scope asks one question per screen, in this order
  var SCOPE_ORDER = ['what', 'when', 'where', 'who'];
  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var STEPS = ['Scope', 'Search', 'Select', 'Workspace', 'Correlations'];
  var DEFAULT_CATS = ['Uncategorized', 'Key evidence', 'Needs checking', 'Background', 'Set aside'];
  var RELATIONS = ['Supports', 'Contradicts', 'Different figures', 'Same claim', 'Same event', 'Same subject', 'Same origin', 'Checks this', 'Reports on', 'Other'];
  var DASHED = ['Contradicts', 'Different figures'];
  // Relations that run one way: a -> b. Drawn with an arrow on the map.
  var DIR_RELS = ['Checks this', 'Reports on'];
  // How each relation reads from either end, for the "Behind this source" chain
  var LINEAGE_RELS = { 'Checks this': ['Checks', 'Checked by'], 'Reports on': ['Reports on', 'Reported on by'], 'Same origin': ['Same origin as', 'Same origin as'] };
  var CLASS_SHORT = { traditional: 'Traditional', local: 'Local', regional: 'Regional', un: 'UN / institutional', academic: 'Academic', satellite: 'Satellite / OSINT', ground: 'Ground' };
  // What each origin value means for where the information actually comes from
  var ORIGIN_NOTES = {
    'wire': 'Wire copy: the reporting comes from a news agency, not from this outlet\'s own newsroom.',
    'original reporting': 'First-hand reporting by this outlet.',
    'official statement': 'A government or institution speaking for itself.',
    'analysis': 'Interpretation built on other reporting rather than first-hand news gathering.',
    'fact-check': 'Examines claims that were made somewhere else.',
    'monitor': 'A tally compiled from incident reports over time.',
    'user-generated': 'Posted by an individual. No newsroom stands behind it.',
    'social post (via report)': 'The post itself could not be read. Everything known about it comes from reporting or fact-checks that describe it.'
  };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function fresh() {
    return {
      screen: 1, reached: 1, scopeStep: 0, places: {}, query: { who: [], what: [], when: [], where: [] }, picks: [], notes: {}, added: [],
      run: null, cats: DEFAULT_CATS.slice(), cat: {}, onMap: [], edges: [], pos: {}, dismissed: [],
      corr: { mode: 'map', x: 'date', y: 'cls', color: 'cls', group: 'cls', show: 'all', links: true }
    };
  }
  var state = load();
  // view-only state
  var view = { results: [], cal: null, panel: null, opener: null, error: null, outOfScope: false, seedClass: 'all', seedText: '', showOutside: false, group: 'all', catFilter: 'all', clsFilter: 'all', originFilter: 'all', voiceFilter: 'all', picking: false, target: '' };
  var graph = null, corr = null, timers = [];

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE));
      if (saved && saved.query) {
        // The search animation can't be resumed halfway, so a reload lands on its result
        if (saved.screen === 2) { saved.screen = 3; saved.reached = Math.max(saved.reached || 1, 3); }
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

  // Class glyph: the same shape the node map draws for this class
  function clsGlyph(cls) {
    var pts = window.NodeMap.shapePoints(cls, 7);
    return '<svg class="cls-glyph" viewBox="-11 -11 22 22" aria-hidden="true">' + (pts ? '<polygon points="' + pts + '"/>' : '<circle r="7"/>') + '</svg>';
  }
  function clsTag(e) { return '<span class="tag cls-tag">' + clsGlyph(e.cls) + esc(CLASS_SHORT[e.cls] || e.cls) + '</span>'; }
  function voiceTag(key, prefix) {
    var v = VOICES[key] || VOICES.unknown;
    return '<span class="tag voice v-' + esc(v.kind.replace(/\s+/g, '-')) + '">' + esc((prefix || '') + v.label) + '</span>';
  }
  // Official statements name whose voice they are, so the Venezuelan government and the UN don't read as the same thing
  function govTag(e) { return e.origin === 'official statement' ? voiceTag(e.voice, 'Official · ') : ''; }
  function speaker(by) { return SPEAKERS[by] || { voice: 'unknown' }; }

  // --- Team (simulated) ---
  function teamNotes(sourceId) { return TEAM.notes.filter(function (n) { return n.source === sourceId; }); }
  function unseenNotes(sourceId) { return teamNotes(sourceId).filter(function (n) { return !(state.seen || {})[n.id]; }); }
  // A numbered square, as on the map: filled blue while there is something unread, outlined once read
  function teamBadge(sourceId) {
    var all = teamNotes(sourceId).length, fresh = unseenNotes(sourceId).length;
    return all ? '<span class="team-badge' + (fresh ? '' : ' is-seen') + '" title="' + plural(all, 'team note') + (fresh ? ', ' + fresh + ' unread' : '') + '">' + all + '<span class="sr"> team notes</span></span>' : '';
  }
  function memberMark(key) {
    var m = TEAM.members[key];
    return '<span class="member-mark" style="background:' + m.color + '" aria-hidden="true">' + esc(m.initials) + '</span>';
  }
  function markSeen(sourceId) {
    var fresh = unseenNotes(sourceId);
    if (!fresh.length) return false;
    state.seen = state.seen || {};
    fresh.forEach(function (n) { state.seen[n.id] = true; });
    save();
    return true;
  }
  // Teammates' connections that can be drawn: both ends are on the analyst's map
  function teamEdges() {
    return TEAM.edges.filter(function (e) { return state.onMap.indexOf(e.a) >= 0 && state.onMap.indexOf(e.b) >= 0; });
  }
  // Who else is working this scenario, shown on the map. Clicking a teammate filters the list to what they annotated.
  function renderTeam() {
    var box = $('team');
    if (!box) return;
    var gathered = workspaceRows().map(function (r) { return r.id; });
    box.innerHTML = Object.keys(TEAM.members).map(function (key) {
      var m = TEAM.members[key];
      var notes = TEAM.notes.filter(function (n) { return n.by === key && gathered.indexOf(n.source) >= 0; });
      var links = TEAM.edges.filter(function (e) { return e.by === key; }).length;
      var fresh = notes.filter(function (n) { return !(state.seen || {})[n.id]; }).length;
      return '<button type="button" class="member" data-action="team-filter" data-value="' + key + '" aria-pressed="' + (view.teamFilter === key) + '" ' +
        'title="' + esc(m.name + ' · ' + m.role + ' · ' + plural(notes.length, 'note') + ', ' + plural(links, 'connection') + ' · ' + m.active) + '">' +
        memberMark(key) + '<span class="member-n' + (fresh ? ' is-new' : '') + '">' + notes.length + '</span><span class="sr">' + esc(m.name) + ', ' + plural(notes.length, 'note') + '</span></button>';
    }).join('');
    box.hidden = !Object.keys(TEAM.members).length;
  }

  //top level rendering
  function render(moved) {
    var hash = '#' + STEPS[state.screen - 1].toLowerCase();
    if (location.hash !== hash) location.replace(hash);
    document.body.setAttribute('data-screen', state.screen);
    renderSteps();
    graph = null;
    if (corr) { corr.destroy(); corr = null; }
    ({ 1: renderScope, 2: renderSearching, 3: renderSelect, 4: renderWorkspace, 5: renderCorrelations })[state.screen]();
    renderPanel();
    var onMap = mapMode();
    if (onMap) document.body.setAttribute('data-map', ''); else document.body.removeAttribute('data-map');
    if (window.WhereMap) window.WhereMap.show(onMap, state.places);
    if (window.ScopeArt) window.ScopeArt.show(state.screen === 1 && !onMap ? scopeCol().key : null);
    if (moved) { $('screen').focus({ preventScroll: true }); window.scrollTo(0, 0); }
    save();
  }
  function go(n, scopeStep) {
    // the correlation map always opens on the world map
    if (n === 5 && state.screen !== 5) state.corr.mode = 'map';
    state.screen = n;
    if (n === 1) { state.scopeStep = scopeStep || 0; view.cal = null; view.error = null; }
    state.reached = Math.max(state.reached, n);
    view.panel = null; view.picking = false; view.target = '';
    render(true);
  }
  // Which steps the pagination can jump to. A step opens once what it needs is in place:
  // Search and Select need a complete scope, Workspace needs at least one picked source, Correlations needs the workspace.
  function scopeDone() { return COLS.every(function (c) { return state.query[c.key].length; }) && S.inScope(state.query, SC); }
  function canVisit(n) {
    if (n === 1) return true;
    if (n === 2 || n === 3) return scopeDone();
    if (n === 4) return scopeDone() && (!!state.run || state.picks.length > 0);
    return scopeDone() && !!state.run; // Correlations opens once the workspace has been built
  }
  function visit(n) {
    timers.forEach(clearTimeout); timers = [];
    if (!canVisit(n)) return;
    if (n === 2) return beginSearch(); // replays the search
    if (n === 4 && !state.run) return startSearch();
    go(n);
  }
  // Pagination: one square per step; the current step also shows its number and name
  function renderSteps() {
    $('steps').innerHTML = STEPS.map(function (label, i) {
      var n = i + 1, can = canVisit(n);
      if (n === state.screen) {
        return '<span class="pg-current" aria-current="step"><span class="pg-n">' + n + '</span><i class="pg-dot on" aria-hidden="true"></i><span class="pg-label">' + label + '</span></span>';
      }
      return '<button type="button" class="pg-dot"' + (can ? ' data-action="go" data-n="' + n + '"' : ' disabled') + ' title="' + n + ' ' + label + '"><span class="sr">' + n + ' ' + label + '</span></button>';
    }).join('');
  }

  // --- 1 · Scope: what / when / where / who, one question per screen ---
  function scopeCol() { return COLS.filter(function (c) { return c.key === SCOPE_ORDER[state.scopeStep]; })[0]; }
  function iso(y, m, d) { return y + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d; }
  function shortDate(d, withYear) { var p = d.split('-'); return MONTHS[+p[1] - 1] + ' ' + (+p[2]) + (withYear ? ', ' + p[0] : ''); }
  // Written the way the scraper's date reader expects: "Jan 3 – Jan 16, 2026"
  function rangeToken(from, to) { return to && to !== from ? shortDate(from) + ' – ' + shortDate(to, true) : shortDate(from, true); }
  function calendar() {
    if (view.cal) return view.cal;
    var w = state.query.when.length ? S.parseWindow(state.query.when, SC) : null;
    var from = w && w.parsed ? w.from : null, to = w && w.parsed ? w.to : null;
    var start = (from || SC.from).split('-');
    view.cal = { y: +start[0], m: +start[1] - 1, from: from, to: to };
    return view.cal;
  }
  function monthGrid(y, m, cal, side) {
    var first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate(), prevDays = new Date(y, m, 0).getDate();
    var cells = '', total = Math.ceil((first + days) / 7) * 7;
    for (var i = 0; i < total; i++) {
      var d = i - first + 1;
      if (d < 1 || d > days) { cells += '<span class="day out" aria-hidden="true">' + (d < 1 ? prevDays + d : d - days) + '</span>'; continue; }
      var date = iso(y, m, d), end = date === cal.from || date === cal.to;
      var inRange = cal.from && cal.to && date >= cal.from && date <= cal.to;
      var col = i % 7, cls = 'day' + (end ? ' end' : '') + (inRange ? ' in' : '');
      if (inRange && (col === 0 || date === cal.from || d === 1)) cls += ' range-start';
      if (inRange && (col === 6 || date === cal.to || d === days)) cls += ' range-end';
      cells += '<button type="button" class="' + cls + '" data-action="cal-day" data-date="' + date + '" aria-pressed="' + !!(end || inRange) + '" aria-label="' + MONTH_NAMES[m] + ' ' + d + ', ' + y + '">' + d + '</button>';
    }
    var prev = '<button type="button" class="cal-nav" data-action="cal-move" data-by="-1" aria-label="Previous month"><img src="assets/icons/chevron-left.svg" alt="" width="22" height="22"></button>';
    var next = '<button type="button" class="cal-nav" data-action="cal-move" data-by="1" aria-label="Next month"><img src="assets/icons/chevron-right.svg" alt="" width="22" height="22"></button>';
    return '<div class="month"><div class="month-head">' + (side === 0 ? prev : '<span class="cal-nav"></span>') + '<span class="month-name">' + MONTH_NAMES[m] + ' ' + y + '</span>' + (side === 1 ? next : '<span class="cal-nav"></span>') + '</div>' +
      '<div class="weekdays" aria-hidden="true">' + ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
      '<div class="days">' + cells + '</div></div>';
  }
  function whenField() {
    var cal = calendar(), next = new Date(cal.y, cal.m + 1, 1);
    var text = cal.from ? shortDate(cal.from, true) + (cal.to && cal.to !== cal.from ? ' - ' + shortDate(cal.to, true) : '') : 'Pick a start and end date';
    return '<div class="date-button' + (cal.from ? '' : ' empty') + '" aria-live="polite"><img src="assets/icons/calendar.svg" alt="" width="29" height="29"><span>' + text + '</span></div>' +
      '<div class="cal" role="group" aria-label="Date range">' + monthGrid(cal.y, cal.m, cal, 0) + monthGrid(next.getFullYear(), next.getMonth(), cal, 1) + '</div>';
  }
  function textField(c) {
    var tokens = state.query[c.key];
    return '<label class="field' + (c.key === 'what' ? ' pill-field' : '') + '">' +
      (c.key === 'what' ? '' : '<img src="assets/icons/search.svg" alt="" width="24" height="24">') +
      '<span class="sr">' + c.label + '</span>' +
      '<input id="in-' + c.key + '" data-col="' + c.key + '" type="text" autocomplete="off" placeholder="' + esc(c.placeholder) + '"></label>' +
      (c.key === 'where' ? '<ul id="where-results" class="results" hidden aria-label="Places found"></ul>' : '') +
      '<ul class="tokens">' + tokens.map(function (t, i) {
        return '<li><button type="button" class="token" data-action="untoken" data-col="' + c.key + '" data-i="' + i + '" aria-label="Remove ' + esc(t) + '">' + esc(t) + ' <span aria-hidden="true">×</span></button></li>';
      }).join('') + '</ul>';
  }
  // "Where" is asked over a full-screen map when the map library has loaded
  function mapMode() { return state.screen === 1 && scopeCol().key === 'where' && !!(window.WhereMap && window.WhereMap.available); }
  var SCOPE_LOGO = '<img class="scope-logo" src="assets/img/dppa-logo.png" alt="DPPA: Preventing Conflict. Sustaining Peace" width="82" height="106">';
  function renderScope() {
    // keep "Still needed" current as fields get filled, once it has been shown
    if (view.error && view.error.indexOf('Still needed') === 0) {
      var stillMissing = missingCols();
      view.error = stillMissing.length ? 'Still needed: ' + stillMissing.join(', ') + '.' : null;
    }
    var c = scopeCol(), step = state.scopeStep, last = step === SCOPE_ORDER.length - 1, onMap = mapMode();
    var unused = SC.suggestions[c.key].filter(function (s) { return state.query[c.key].indexOf(s) < 0; });
    $('screen').innerHTML =
      // The large DPPA logo belongs to the scope pages: above the question, or above the card on the map
      '<form id="scope-form" class="scope' + (onMap ? ' scope-map' : '') + '" novalidate>' + (onMap ? SCOPE_LOGO : '') + '<div class="scope-main">' + (onMap ? '' : SCOPE_LOGO) +
      '<h1 class="scope-q">' + esc(c.question) + '</h1><div class="rule" aria-hidden="true"></div>' +
      '<div class="scope-body">' + (c.key === 'when' ? whenField() : textField(c)) +
      (unused.length ? '<div class="suggest">' + unused.map(function (s) {
        return '<button type="button" class="suggestion" data-action="token" data-col="' + c.key + '" data-value="' + esc(s) + '">+ ' + esc(s) + '</button>';
      }).join('') + '</div>' : '') + '</div>' +
      (view.error ? '<p class="error" role="alert">' + esc(view.error) + '</p>' : '') +
      (view.outOfScope ? '<div class="notice" role="alert"><p>This playtest only holds one scenario: the ' + esc(SC.label) + ', Jan 3–16, 2026.</p>' +
        '<button type="button" data-action="use-scenario">Use that scenario</button></div>' : '') +
      '<div class="scope-nav"><span class="scope-count">' + (step + 1) + ' / ' + SCOPE_ORDER.length + '</span>' +
      (step ? '<button type="button" data-action="scope-back">Back</button>' : '') +
      '<button type="submit" class="primary">' + (last ? 'Find sources' : 'Next') + '</button></div></div>' +
      (onMap ? '' : '<div class="scope-art" aria-hidden="true" style="background-image:url(assets/img/scope-' + c.key + '.png)"></div>') + '</form>';
    $('scope-form').addEventListener('submit', submitScope);
    var inp = $('in-' + c.key);
    if (inp) inp.addEventListener('keydown', function (e) {
      // Enter adds what was typed; on an empty box it moves on
      if (e.key !== 'Enter' || !inp.value.trim()) return;
      e.preventDefault();
      // On the map, Enter takes the first place found
      if (onMap && view.results.length) return addPlace(view.results[0]);
      if (addToken(c.key, inp.value)) {
        if (onMap) locate(inp.value.trim());
        view.error = null; view.results = []; render(); $('in-' + c.key).focus();
      } else inp.value = '';
    });
    if (inp && onMap) {
      view.results = [];
      var wait = null;
      inp.addEventListener('input', function () {
        clearTimeout(wait);
        var text = inp.value.trim();
        if (text.length < 2) { view.results = []; return renderResults(); }
        wait = setTimeout(function () {
          window.WhereMap.search(text).then(function (found) { view.results = found; renderResults(); }, function () { /* a newer search replaced this one, or the search service is unreachable */ });
        }, 250);
      });
    }
  }
  // Places found for what is being typed, listed under the search box
  function renderResults() {
    var list = $('where-results');
    if (!list) return;
    list.hidden = !view.results.length;
    list.innerHTML = view.results.map(function (r, i) {
      return '<li><button type="button" class="result" data-action="place" data-i="' + i + '"><span class="result-name">' + esc(r.name) + '</span>' +
        (r.detail ? '<span class="result-detail">' + esc(r.detail) + '</span>' : '') + '</button></li>';
    }).join('');
  }
  function addPlace(r) {
    addToken('where', r.name);
    state.places[r.name] = { lng: r.lng, lat: r.lat, box: r.box, ref: r.ref };
    window.WhereMap.remember(r.name, r.shape);
    view.error = null; view.results = [];
    render();
    // A place clicked on the map is already in view, so the map stays put
    if (r.keepView) window.WhereMap.pins(state.places); else window.WhereMap.frame(state.places);
    var inp = $('in-where'); if (inp && !r.keepView) inp.focus();
  }
  if (window.WhereMap) window.WhereMap.onPick(function (place) { if (mapMode()) addPlace(place); });
  // Finds a typed or suggested place name so it gets a pin too. The answer still counts if nothing is found.
  function locate(name) {
    if (!window.WhereMap || !window.WhereMap.available || state.places[name]) return;
    window.WhereMap.search(name, 1).then(function (found) {
      if (!found.length || state.query.where.indexOf(name) < 0) return;
      state.places[name] = { lng: found[0].lng, lat: found[0].lat, box: found[0].box, ref: found[0].ref };
      save();
      if (mapMode()) window.WhereMap.frame(state.places);
    }, function () {});
  }
  function scopeMove(by) {
    state.scopeStep = Math.max(0, Math.min(SCOPE_ORDER.length - 1, state.scopeStep + by));
    view.error = null; view.outOfScope = false;
    render(true);
    var inp = $('in-' + scopeCol().key);
    if (inp) inp.focus();
  }
  function pickDay(date) {
    var cal = calendar();
    if (!cal.from || cal.to) { cal.from = date; cal.to = null; }
    else if (date < cal.from) { cal.to = cal.from; cal.from = date; }
    else cal.to = date;
    state.query.when = [rangeToken(cal.from, cal.to)];
    view.error = null;
    render();
    var again = $('screen').querySelector('[data-date="' + date + '"]');
    if (again) again.focus();
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
    var c = scopeCol(), inp = $('in-' + c.key);
    // Text typed but not yet entered still counts
    if (inp) addToken(c.key, inp.value);
    if (!state.query[c.key].length) {
      view.error = c.key === 'when' ? 'Pick a date or a date range to continue.' : 'Add at least one answer to continue.';
      return render();
    }
    if (state.scopeStep < SCOPE_ORDER.length - 1) return scopeMove(1);
    var missing = missingCols();
    view.error = missing.length ? 'Still needed: ' + missing.join(', ') + '.' : null;
    view.outOfScope = !missing.length && !S.inScope(state.query, SC);
    if (missing.length || view.outOfScope) return render();
    state.run = null;
    state.reached = 2;
    beginSearch();
  }

  // picking sources from the catalog
  function searchResult() {
    return S.search(state.query, allEntries(), SC);
  }
  function renderSelect() {
    var r = searchResult();
    var counts = {};
    r.inWindow.forEach(function (x) { counts[x.entry.cls] = (counts[x.entry.cls] || 0) + 1; });
    var q = state.query, mac = /Mac|iPhone|iPad/.test(navigator.platform);
    // The scope so far, in the order the sidebar shows it. Each pencil goes back to that question.
    var side = ['who', 'when', 'what', 'where'].map(function (key) {
      var c = COLS.filter(function (x) { return x.key === key; })[0];
      return '<div><dt><span>' + c.label + '</span><button type="button" class="edit" data-action="scope-edit" data-step="' + SCOPE_ORDER.indexOf(key) + '" aria-label="Edit ' + c.label.toLowerCase() + '">' +
        '<img src="assets/icons/edit.svg" alt="" width="16" height="16"></button></dt><dd>' + esc(q[key].join(', ')) + '</dd></div>';
    }).join('');
    $('screen').innerHTML =
      '<div class="select-wrap"><div class="select"><aside class="scope-side" aria-label="Your scope"><dl>' + side + '</dl></aside>' +
      '<div class="page"><h1>First pass: pick what to start from</h1>' +
      (r.window.parsed ? '' : '<p class="notice">Couldn\'t read those dates, so using ' + fmtDate(r.window.from) + ' to ' + fmtDate(r.window.to) + '.</p>') +
      '<div class="filters"><label class="field list-search"><img src="assets/icons/search-blue.svg" alt="" width="18" height="18"><span class="sr">Search in list</span>' +
        '<input id="seed-text" type="search" placeholder="Search in list..." value="' + esc(view.seedText) + '"><kbd>' + (mac ? '⌘' : 'Ctrl') + '</kbd><kbd>K</kbd></label>' +
      '<div class="pills" role="group" aria-label="Filter by source class">' +
        pill('all', 'All', r.inWindow.length) + S.CLASSES.filter(function (c) { return counts[c]; }).map(function (c) { return pill(c, S.CLASS_LABELS[c], counts[c]); }).join('') +
      '</div></div>' +
      '<div class="table-wrap"><table class="src-table"><thead><tr>' +
        '<th class="c-tick"><label class="tick"><input type="checkbox" id="pick-all" data-action="pick-all"><span class="sr">Select every source in this list</span></label></th>' +
        '<th>Source</th><th class="c-pub">Publisher</th><th class="c-date">Date</th><th class="c-type">Type</th></tr></thead>' +
        '<tbody id="seed-list"></tbody></table></div>' +
      '<div id="seed-outside"></div>' +
      '<div class="foot-spacer"></div></div></div></div>' +
      '<div id="select-foot" class="foot"></div>' + addDialog();
    $('seed-text').addEventListener('input', function () { view.seedText = this.value; renderSeedList(); });
    $('add-form').addEventListener('submit', submitAdd);
    renderSeedList();
    renderSelectFoot();
  }
  function pill(value, label, n) {
    return '<button type="button" class="pill" data-action="seed-class" data-value="' + value + '" aria-pressed="' + (view.seedClass === value) + '">' +
      (S.CLASS_LABELS[value] ? clsGlyph(value) + ' ' : '') + esc(label) + ' <span class="count">' + n + '</span></button>';
  }
  function seedRow(x) {
    var e = x.entry, picked = state.picks.indexOf(e.id) >= 0;
    var warn = S.signals(e, win()).filter(function (s) { return s.warn; }).map(function (s) {
      return '<span class="flag" data-tip="' + esc(s.detail) + '">' + esc(s.label) + '<span class="sr">: ' + esc(s.detail) + '</span></span>';
    }).join('');
    var lang = e.lang !== 'English' && e.lang !== 'Unknown' ? '<span class="tag">' + esc(e.lang) + '</span>' : '';
    return '<tr class="row-item' + (view.panel === e.id ? ' open' : '') + (picked ? ' picked' : '') + '">' +
      '<td class="c-tick"><label class="tick"><input type="checkbox" data-action="pick" data-id="' + esc(e.id) + '"' + (picked ? ' checked' : '') + '><span class="sr">Select ' + esc(e.title) + '</span></label></td>' +
      '<td class="c-title"><button type="button" class="row-main" data-action="open" data-id="' + esc(e.id) + '">' +
        '<span class="row-title">' + esc(e.title) + '</span>' +
        '<span class="row-tags">' + clsTag(e) + govTag(e) + lang + warn + '</span>' +
      '</button></td>' +
      '<td class="c-pub">' + esc(e.publisher) + '</td><td class="c-date">' + esc(fmtDate(e.published)) + '</td><td class="c-type">' + esc(e.format) + '</td></tr>';
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
    $('seed-list').innerHTML = list.map(seedRow).join('') || '<tr><td colspan="5" class="empty">Nothing matches this filter.</td></tr>';
    var all = $('pick-all');
    if (all) {
      var chosen = list.filter(function (x) { return state.picks.indexOf(x.entry.id) >= 0; }).length;
      all.checked = !!list.length && chosen === list.length;
      all.indeterminate = chosen > 0 && chosen < list.length;
    }
    $('seed-outside').innerHTML = r.outside.length
      ? '<details class="more"' + (view.showOutside ? ' open' : '') + '><summary>' + plural(r.outside.length, 'source') + ' outside your dates</summary>' +
        '<p class="muted small">Kept here so nothing is hidden from you. You can still select them.</p><div class="table-wrap"><table class="src-table"><tbody>' + r.outside.map(seedRow).join('') + '</tbody></table></div></details>'
      : '';
    var d = $('seed-outside').querySelector('details');
    if (d) d.addEventListener('toggle', function () { view.showOutside = d.open; });
  }
  function renderSelectFoot() {
    var n = state.picks.length, r = searchResult(), total = r.inWindow.length + r.outside.length;
    $('select-foot').innerHTML =
      '<div class="foot-text">' + n + ' of ' + plural(total, 'source') + ' selected.</div>' +
      '<div class="foot-actions"><button type="button" data-action="add-open">+ Add a source</button>' +
      '<button type="button" class="primary" data-action="start"' + (n ? '' : ' disabled') + '>Start from these</button></div>';
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
    state.reached = 3;
    render();
  }

  // --- 2 · Searching: the catalog is read class by class and each source found joins a column that scrolls as it grows ---
  function searchPlan() {
    var r = searchResult(), found = r.inWindow.concat(r.outside);
    return S.CLASSES.map(function (cls) {
      return { cls: cls, label: S.CLASS_LABELS[cls], items: found.filter(function (x) { return x.entry.cls === cls; }).map(function (x) { return x.entry; }) };
    });
  }
  function beginSearch() {
    timers.forEach(clearTimeout); timers = [];
    go(2);
    var plan = searchPlan(), still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var count = 0, step = 0;
    function later(fn, ms) { timers.push(setTimeout(fn, still ? Math.min(ms, 60) : ms)); }
    function nextClass() {
      if (step >= plan.length) return finishSearch();
      var group = plan[step++], i = 0;
      setWord(group.label.toLowerCase() + '...');
      (function nextItem() {
        if (i >= group.items.length) {
          logClass(group);
          return later(nextClass, group.items.length ? 260 : 620);
        }
        var e = group.items[i++];
        count++;
        addCard(e, count);
        var now = $('s-now'), n = $('s-n');
        if (now) now.textContent = e.publisher + ' · ' + e.title;
        if (n) n.textContent = count;
        later(nextItem, 120);
      })();
    }
    later(nextClass, 900);
  }
  // The rotating last line of the headline: the old word slides up and out as the new one comes in
  function setWord(text) {
    var slot = $('s-word');
    if (!slot) return;
    var old = slot.querySelector('.in');
    if (old) { old.className = 'out'; timers.push(setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 400)); }
    var word = document.createElement('span');
    word.className = 'in';
    word.textContent = text;
    slot.appendChild(word);
  }
  function addCard(e, n) {
    var stack = $('s-stack');
    if (!stack) return;
    var card = document.createElement('li');
    card.className = 's-card';
    card.innerHTML = '<span class="s-card-cls">' + clsGlyph(e.cls) + esc(CLASS_SHORT[e.cls] || e.cls) + '</span>' +
      '<span class="s-card-title">' + esc(e.title) + '</span><span class="s-card-meta">' + esc(shortName(e)) + ' · ' + esc(fmtDate(e.published)) + '</span>';
    stack.appendChild(card);
    // Auto-scroll: once the column outgrows the panel, slide it up so the newest card stays in view
    var view = stack.parentNode, over = stack.offsetHeight - view.clientHeight * 0.74;
    stack.style.transform = 'translate(-50%, ' + (-Math.max(0, over)) + 'px)';
  }
  function logClass(group) {
    var log = $('s-log');
    if (!log) return;
    var li = document.createElement('li');
    if (!group.items.length) li.className = 'none';
    li.innerHTML = clsGlyph(group.cls) + '<span>' + esc(group.label) + '</span><span class="s-log-n">' + (group.items.length ? group.items.length + ' found' : 'none found') + '</span>';
    log.appendChild(li);
  }
  // The column lifts away, then the page moves on to the list itself
  function finishSearch() {
    setWord('done.');
    var now = $('s-now'); if (now) now.textContent = 'Laying out what was found';
    timers.push(setTimeout(function () {
      var art = $('s-art'); if (art) art.classList.add('to-list');
      timers.push(setTimeout(showSelect, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 750));
    }, 500));
  }
  function showSelect() {
    timers.forEach(clearTimeout); timers = [];
    state.reached = Math.max(state.reached, 3);
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(function () { go(3); });
    else go(3);
  }
  function cancelSearch() {
    timers.forEach(clearTimeout); timers = [];
    go(1, SCOPE_ORDER.length - 1);
  }
  function renderSearching() {
    var total = allEntries().length;
    $('screen').innerHTML = '<div class="scope searching"><div class="scope-main">' +
      '<h1 class="scope-q">Searching <span id="s-word" class="s-word"><span class="in">the web...</span></span></h1><div class="rule" aria-hidden="true"></div>' +
      '<p id="s-now" class="s-now" aria-live="polite">Starting</p>' +
      '<ul id="s-log" class="s-log" aria-label="Searched so far"></ul>' +
      '<p class="muted small">Playtest: this simulates a scraper over a prepared catalog of ' + total + ' sources.</p>' +
      '<div class="scope-nav"><button type="button" data-action="cancel">Back</button><button type="button" data-action="skip-search">Skip</button></div></div>' +
      '<div id="s-art" class="searching-art"><div class="s-view"><ul id="s-stack" class="s-stack" aria-hidden="true"></ul>' +
      '<p class="s-count"><span id="s-n">0</span> sources catalogued</p></div></div></div>';
  }

  // Select -> Workspace: the scraper widens from the picks (related sources, plus classes the picks left out)
  function startSearch() {
    var picks = state.picks.map(entry).filter(Boolean);
    var r = S.expand(picks, state.query, allEntries(), LINKS, SC);
    var ids = r.gathered.map(function (g) { return { id: g.entry.id, group: g.group, why: g.why }; });
    state.run = { gathered: ids, skipped: r.skipped, missingClasses: r.missingClasses, steps: r.steps };
    state.onMap = state.picks.concat(state.onMap.filter(function (id) {
      return state.picks.indexOf(id) < 0 && ids.some(function (g) { return g.id === id; });
    }));
    state.edges = state.edges.filter(function (e) { return state.onMap.indexOf(e.a) >= 0 && state.onMap.indexOf(e.b) >= 0; });
    view.group = 'all'; view.catFilter = 'all'; view.clsFilter = 'all'; view.originFilter = 'all'; view.voiceFilter = 'all';
    go(4);
  }

  //workspace/dashboard
  function workspaceRows() {
    var rows = state.picks.map(function (id) { return { id: id, group: 'pick' }; }).concat(state.run ? state.run.gathered : []);
    return rows.filter(function (r) { return entry(r.id); });
  }
  function catOf(id) { return state.cat[id] || state.cats[0]; }
  function catColor(name) { var i = state.cats.indexOf(name); return 'var(--cat-' + (i <= 0 ? 0 : ((i - 1) % 6) + 1) + ')'; }

  function renderWorkspace() {
    if (!state.run) return go(3);
    var ents = workspaceRows().map(function (r) { return entry(r.id); });
    $('screen').innerHTML =
      '<div class="ws-page"><h1 class="sr">Workspace</h1>' +
      '<section class="cov-wrap" aria-label="Coverage"><button type="button" id="cov-toggle" class="cov-toggle" data-action="cov-toggle" aria-controls="coverage"><span class="cov-caret" aria-hidden="true"></span><strong>Coverage</strong> <span id="cov-sum" class="cov-sum"></span></button>' +
      '<div id="coverage" class="coverage"></div></section>' +
      '<div class="ws"><section class="ws-list" aria-label="Sources"><div class="ws-filters" id="ws-filters"></div><ul id="ws-rows" class="rows compact"></ul></section>' +
      '<section class="ws-map" aria-label="Connections map">' +
        '<svg id="map" role="group" aria-label="Map of sources and connections"></svg>' +
        '<div id="map-hint" class="map-hint"></div>' +
        '<div class="map-top"><div id="team" class="team" role="group" aria-label="Team (simulated)"></div>' +
        '<button type="button" class="primary map-next" data-action="go" data-n="5">Correlation map</button></div>' +
        '<div id="edge-menu" class="edge-menu" hidden></div>' +
        '<div class="zoom" role="group" aria-label="Zoom">' +
          '<button type="button" data-action="zoom" data-value="out" aria-label="Zoom out" title="Zoom out">−</button>' +
          '<button type="button" id="zoom-pct" class="zoom-pct" data-action="zoom" data-value="reset" title="Back to 100%">100%</button>' +
          '<button type="button" data-action="zoom" data-value="in" aria-label="Zoom in" title="Zoom in">+</button>' +
          '<button type="button" class="zoom-fit" data-action="zoom" data-value="fit" title="Show every source on the map">Fit</button></div>' +
        '<div id="map-key" class="map-key"></div><div id="gaps" class="gaps"></div></section></div></div>';
    graph = window.NodeMap.create($('map'), {
      onSelect: nodeClicked,
      onConnect: connectOnMap,
      view: state.mapView,
      // Pan and zoom are remembered; the connection menu follows its line
      onView: function (v) { state.mapView = v; saveSoon(); renderZoom(); if (view.edgeMenu) renderEdgeMenu(); },
      onEdge: function (id) { view.edgeMenu = view.edgeMenu === id ? null : id; drawMap(0); },
      onSettle: function (points) { points.forEach(function (p) { state.pos[p.id] = { x: p.x, y: p.y }; }); save(); }
    });
    renderCoverage();
    renderWsList();
    renderKey();
    renderGaps();
    renderTeam();
    renderZoom();
    drawMap(0.6);
  }
  var saveTimer = null;
  // Panning fires many times a second; write to storage once it pauses
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 250); }
  function renderZoom() { var pct = $('zoom-pct'); if (pct && graph) pct.textContent = Math.round(graph.zoom() * 100) + '%'; }
  // What's missing: an alert in the map's lower right corner that folds down to a red "!" button
  function renderGaps() {
    var box = $('gaps');
    if (!box) return;
    var gaps = S.gaps(workspaceRows().map(function (r) { return entry(r.id); }), SC);
    if (!gaps.length) { box.innerHTML = ''; return; }
    var open = state.gapsOpen !== false;
    box.innerHTML = open
      ? '<section class="gap-alert" role="alert" aria-labelledby="gap-title"><header><img src="assets/icons/circle-alert.svg" alt="" width="16" height="16">' +
          '<h2 id="gap-title">What\'s missing <span class="count">' + gaps.length + '</span></h2>' +
          '<button type="button" class="icon" data-action="gaps-toggle" aria-label="Collapse what\'s missing" title="Collapse">×</button></header><ul>' +
          gaps.map(function (g) { return '<li><strong>' + esc(g.title) + '.</strong> ' + esc(g.evidence) + '</li>'; }).join('') + '</ul></section>'
      : '<button type="button" class="gap-btn" data-action="gaps-toggle" aria-label="What\'s missing: ' + plural(gaps.length, 'gap') + '. Show." title="What\'s missing (' + gaps.length + ')">!</button>';
  }
  // Who is in front of the analyst: three side-by-side breakdowns (class, how each source knows, whose voices).
  // Every line is a count with a bar, so the balance reads at a glance. Lines double as the key for the map's
  // node shapes, and clicking one filters the list.
  function renderCoverage() {
    var box = $('coverage');
    if (!box) return;
    var ents = workspaceRows().map(function (r) { return entry(r.id); });
    function line(action, value, pressed, n, max, mark, label, title) {
      return '<li><button type="button" class="cov-item' + (n ? '' : ' zero') + '" data-action="' + action + '" data-value="' + esc(value) + '"' +
        (n ? '' : ' disabled') + ' aria-pressed="' + pressed + '" title="' + esc(title) + '">' +
        '<span class="cov-mark">' + mark + '</span><span class="cov-name">' + esc(label) + '</span>' +
        '<span class="cov-bar"><i style="width:' + (max ? Math.round(n / max * 100) : 0) + '%"></i></span>' +
        '<span class="cov-n">' + (n || 'none') + '</span></button></li>';
    }
    function card(title, note, lines, active, clear, wide) {
      return '<section class="cov-card' + (wide ? ' wide' : '') + '"><h2><span>' + title + '</span>' +
        (active ? '<button type="button" class="link" data-action="' + clear + '" data-value="' + esc(active) + '">Clear filter</button>' : '<span class="cov-note">' + note + '</span>') +
        '</h2><ul>' + lines + '</ul></section>';
    }
    var byCls = S.CLASSES.map(function (c) { return ents.filter(function (e) { return e.cls === c; }); });
    var maxCls = Math.max.apply(null, byCls.map(function (m) { return m.length; }).concat(1));
    var cls = S.CLASSES.map(function (c, i) {
      var mine = byCls[i], onMap = mine.filter(function (e) { return state.onMap.indexOf(e.id) >= 0; }).length;
      var title = mine.length ? plural(mine.length, 'source') + ' gathered, ' + onMap + ' on your map' : 'No source in this class was gathered.';
      return line('cov-cls', c, view.clsFilter === c, mine.length, maxCls, clsGlyph(c), CLASS_SHORT[c], title);
    }).join('');
    var origins = {};
    ents.forEach(function (e) { origins[e.origin] = (origins[e.origin] || 0) + 1; });
    var oriKeys = Object.keys(origins).sort(function (x, y) { return origins[y] - origins[x]; });
    var ori = oriKeys.map(function (o) {
      return line('cov-origin', o, view.originFilter === o, origins[o], origins[oriKeys[0]], '', o.charAt(0).toUpperCase() + o.slice(1), ORIGIN_NOTES[o] || '');
    }).join('');
    // Whose voices: how many sources carry each voice, in VOICES order (governments first)
    var vc = {};
    ents.forEach(function (e) { S.voices(e, SPEAKERS).forEach(function (v) { vc[v] = (vc[v] || 0) + 1; }); });
    var voiKeys = Object.keys(VOICES).filter(function (k) { return vc[k]; });
    var maxVoi = Math.max.apply(null, voiKeys.map(function (k) { return vc[k]; }).concat(1));
    var voi = voiKeys.map(function (k) {
      return line('cov-voice', k, view.voiceFilter === k, vc[k], maxVoi,
        '<i class="vdot v-' + esc(VOICES[k].kind.replace(/\s+/g, '-')) + '"></i>', VOICES[k].label,
        plural(vc[k], 'source') + ' quote or speak for: ' + VOICES[k].label + ' (' + VOICES[k].kind + ')');
    }).join('');
    var on = function (v) { return v !== 'all' ? v : ''; };
    // Collapsed, the header carries a one-line summary so the list and map can take the height
    var open = state.covOpen !== false, filters = [view.clsFilter, view.originFilter, view.voiceFilter].filter(on).length;
    box.hidden = !open;
    $('cov-toggle').setAttribute('aria-expanded', open);
    $('cov-sum').textContent = plural(ents.length, 'source') + ' · ' + byCls.filter(function (m) { return m.length; }).length + ' of ' + S.CLASSES.length + ' classes · ' +
      plural(voiKeys.length, 'voice') + (filters ? ' · ' + plural(filters, 'filter') + ' on' : '');
    box.innerHTML =
      card('Source class', plural(ents.length, 'source'), cls, on(view.clsFilter), 'cov-cls') +
      card('How it knows', 'Basis of each source', ori, on(view.originFilter), 'cov-origin') +
      card('Whose voices', 'Sources quoting each', voi, on(view.voiceFilter), 'cov-voice', true);
  }
  // Workspace source list: a header (search, how-it-got-here tabs, category, active filters) over grouped rows
  var WS_GROUPS = [['all', 'All'], ['pick', 'Your picks'], ['related', 'Related'], ['widened', 'Semi-related']];
  var WS_GROUP_NOTES = { pick: 'Sources you chose on Select', related: 'Linked to your picks or sharing a topic with them', widened: 'Added from classes your picks left out' };
  function renderWsList() {
    var rows = workspaceRows();
    var tabs = WS_GROUPS.map(function (g) {
      var n = g[0] === 'all' ? rows.length : rows.filter(function (r) { return r.group === g[0]; }).length;
      return '<button type="button" class="seg" data-action="ws-group" data-value="' + g[0] + '" aria-pressed="' + (view.group === g[0]) + '"' +
        (WS_GROUP_NOTES[g[0]] ? ' title="' + esc(WS_GROUP_NOTES[g[0]]) + '"' : '') + '>' + g[1] + ' <span class="count">' + n + '</span></button>';
    }).join('');
    // Filters set from the coverage cards, shown here so a short list explains itself
    var active = [['cov-cls', view.clsFilter, CLASS_SHORT[view.clsFilter]], ['cov-origin', view.originFilter, view.originFilter],
      ['cov-voice', view.voiceFilter, (VOICES[view.voiceFilter] || {}).label],
      ['team-filter', view.teamFilter, view.teamFilter && 'Notes by ' + TEAM.members[view.teamFilter].name]].filter(function (f) { return f[1] && f[1] !== 'all'; });
    $('ws-filters').innerHTML =
      '<div class="ws-head"><h2>Sources</h2><span id="ws-count" class="ws-count"></span></div>' +
      '<div class="ws-tools"><label class="field ws-search"><img src="assets/icons/search-blue.svg" alt="" width="16" height="16"><span class="sr">Search sources</span>' +
        '<input id="ws-text" type="search" placeholder="Search sources..." value="' + esc(view.wsText || '') + '"></label>' +
        '<label class="ws-cat"><span class="sr">Category</span><select id="cat-filter"><option value="all">All categories</option>' +
        state.cats.map(function (c) { return '<option' + (view.catFilter === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="segs" role="group" aria-label="Filter by how the source got here">' + tabs + '</div>' +
      (active.length ? '<div class="ws-active"><span class="muted small">Filtered by</span>' + active.map(function (f) {
        return '<button type="button" class="token" data-action="' + f[0] + '" data-value="' + esc(f[1]) + '" aria-label="Remove filter: ' + esc(f[2]) + '">' + esc(f[2]) + ' <span aria-hidden="true">×</span></button>';
      }).join('') + '</div>' : '');
    $('cat-filter').addEventListener('change', function () { view.catFilter = this.value; renderWsRows(); });
    $('ws-text').addEventListener('input', function () { view.wsText = this.value; renderWsRows(); });
    renderWsRows();
  }
  function wsRow(r) {
    var e = entry(r.id), on = state.onMap.indexOf(r.id) >= 0, cat = catOf(r.id);
    return '<li class="row-item ws-row' + (view.panel === r.id ? ' open' : '') + '" style="--cat:' + catColor(cat) + '">' +
      '<button type="button" class="row-main" data-action="open" data-id="' + esc(r.id) + '">' +
      '<span class="ws-meta">' + clsGlyph(e.cls) + '<span class="ws-meta-text">' + esc(shortName(e)) + ' · ' + esc(fmtDate(e.published)) + '</span>' + teamBadge(r.id) + '</span>' +
      '<span class="row-title">' + esc(e.title) + '</span>' +
      '<span class="row-tags"><span class="cat-tag"><i style="background:' + catColor(cat) + '"></i>' + esc(cat) + '</span>' + govTag(e) +
        (state.notes[r.id] ? '<span class="tag">Has note</span>' : '') + '</span>' +
      (r.group !== 'pick' && r.why ? '<span class="ws-why">' + esc(r.why) + '</span>' : '') + '</button>' +
      '<button type="button" class="map-toggle" data-action="toggle-map" data-id="' + esc(r.id) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Remove from map: ' : 'Add to map: ') + esc(e.title) + '">' + (on ? 'On map' : '+ Map') + '</button></li>';
  }
  function renderWsRows() {
    var rows = workspaceRows(), text = (view.wsText || '').toLowerCase().trim();
    var list = rows.filter(function (r) {
      var e = entry(r.id);
      return (view.group === 'all' || r.group === view.group) && (view.catFilter === 'all' || catOf(r.id) === view.catFilter) &&
        (view.clsFilter === 'all' || e.cls === view.clsFilter) && (view.originFilter === 'all' || e.origin === view.originFilter) &&
        (view.voiceFilter === 'all' || S.voices(e, SPEAKERS).indexOf(view.voiceFilter) >= 0) &&
        (!view.teamFilter || TEAM.notes.some(function (n) { return n.by === view.teamFilter && n.source === r.id; })) &&
        (!text || (e.title + ' ' + e.publisher + ' ' + e.format + ' ' + e.summary).toLowerCase().indexOf(text) >= 0);
    });
    var count = $('ws-count');
    if (count) count.textContent = list.length === rows.length ? rows.length + ' gathered' : list.length + ' of ' + rows.length;
    // With every group showing, rows sit under a heading for how they got here
    var html = view.group !== 'all' ? list.map(wsRow).join('') : WS_GROUPS.slice(1).map(function (g) {
      var mine = list.filter(function (r) { return r.group === g[0]; });
      return mine.length ? '<li class="ws-sub" title="' + esc(WS_GROUP_NOTES[g[0]]) + '">' + g[1] + ' <span class="count">' + mine.length + '</span></li>' + mine.map(wsRow).join('') : '';
    }).join('');
    $('ws-rows').innerHTML = html || '<li class="empty">Nothing matches. Clear a filter or the search to see more.</li>';
  }
  // Map key, lower left: a small panel that folds down to a key-icon button
  function renderKey() {
    var box = $('map-key');
    if (!box) return;
    box.innerHTML = state.keyOpen !== false
      ? '<section class="key-panel" aria-labelledby="key-title"><header><h2 id="key-title">Key</h2>' +
          '<button type="button" class="icon" data-action="key-toggle" aria-label="Collapse the key" title="Collapse">×</button></header>' +
          state.cats.map(function (c) { return '<span class="cat-tag"><i style="background:' + catColor(c) + '"></i>' + esc(c) + '</span>'; }).join('') +
          '<span class="small muted key-line">Shape: source class (see Coverage)</span>' +
          '<span class="small muted key-line">Dashed: differs or contradicts</span>' +
          '<span class="small muted key-line">Arrow: checks or reports on</span></section>'
      : '<button type="button" class="key-btn" data-action="key-toggle" aria-label="Show the map key" title="Key"><img src="assets/icons/key.svg" alt="" width="26" height="26"></button>';
  }
  function drawMap(energy) {
    if (!graph) return;
    var nodes = state.onMap.map(entry).filter(Boolean).map(function (e) {
      return { id: e.id, label: shortName(e), title: e.title, shape: e.cls, category: catOf(e.id) + ', ' + (CLASS_SHORT[e.cls] || e.cls), color: catColor(catOf(e.id)), position: state.pos[e.id], badge: teamNotes(e.id).length, badgeNew: unseenNotes(e.id).length > 0 };
    });
    var edges = state.edges.map(function (e) {
      return { a: e.a, b: e.b, dashed: DASHED.indexOf(e.rel) >= 0, id: e.id, dir: DIR_RELS.indexOf(e.rel) >= 0, rel: e.rel === 'Other' ? 'Related' : e.rel, label: e.rel + (e.note ? ': ' + e.note : '') };
    });
    // Teammates' lines are drawn in their colour and are read-only here
    edges = edges.concat(teamEdges().map(function (e) {
      var m = TEAM.members[e.by];
      return { id: e.id, a: e.a, b: e.b, dashed: DASHED.indexOf(e.rel) >= 0, dir: DIR_RELS.indexOf(e.rel) >= 0, rel: e.rel + ' · ' + m.initials, label: e.rel + ', by ' + m.name + (e.note ? ': ' + e.note : ''), team: true, color: m.color };
    }));
    graph.update(nodes, edges, { selected: view.panel, picking: view.picking, editing: view.edgeMenu });
    renderEdgeMenu();
    var hint = $('map-hint');
    if (hint) {
      hint.textContent = view.picking ? 'Select the source to connect to. Press Esc to cancel.' :
        (nodes.length < 2 ? 'Add sources to the map from the list.' : (state.edges.length ? '' : 'Drag from a dot beside a source to another source to connect them.'));
      hint.className = 'map-hint' + (view.picking ? ' active' : '');
    }
  }
  // Drawing a line between two sources on the map creates the connection straight away and opens its menu,
  // where the analyst says what the relationship is.
  function connectOnMap(a, b) {
    var existing = state.edges.filter(function (x) { return (x.a === a && x.b === b) || (x.a === b && x.b === a); })[0];
    if (!existing) {
      existing = { id: 'edge-' + Date.now() + '-' + state.edges.length, a: a, b: b, rel: 'Other', note: '' };
      state.edges.push(existing);
      save(); renderPanel();
    }
    view.edgeMenu = existing.id;
    drawMap(0);
    var first = $('edge-menu').querySelector('button'); if (first) first.focus();
  }
  // The small menu on a connection: pick what the relationship is, or remove the line
  function renderEdgeMenu() {
    var box = $('edge-menu');
    if (!box) return;
    var e = view.edgeMenu && state.edges.concat(TEAM.edges).filter(function (x) { return x.id === view.edgeMenu; })[0];
    var at = e && graph && graph.edgePoint(e.id);
    box.hidden = !at;
    if (!at) { view.edgeMenu = null; box.innerHTML = ''; return; }
    var a = entry(e.a), b = entry(e.b);
    if (e.by) {
      var who = TEAM.members[e.by];
      box.innerHTML = '<header><span class="edge-menu-title">' + esc(shortName(a)) + ' → ' + esc(shortName(b)) + '</span>' +
        '<button type="button" class="icon" data-action="edge-menu-close" aria-label="Close">×</button></header>' +
        '<p class="team-line">' + memberMark(e.by) + '<span><strong>' + esc(who.name) + '</strong> marked this <strong>' + esc(e.rel.toLowerCase()) + '</strong></span></p>' +
        (e.note ? '<p class="small">' + esc(e.note) + '</p>' : '') +
        '<p class="muted small">A teammate\'s connection. You can\'t change it here.</p>';
    } else box.innerHTML = '<header><span class="edge-menu-title">' + esc(shortName(a)) + ' → ' + esc(shortName(b)) + '</span>' +
      '<button type="button" class="icon" data-action="edge-menu-close" aria-label="Close">×</button></header>' +
      '<div class="edge-rels" role="group" aria-label="Relationship">' + RELATIONS.map(function (r) {
        return '<button type="button" class="pill" data-action="edge-rel" data-id="' + esc(e.id) + '" data-value="' + esc(r) + '" aria-pressed="' + (e.rel === r) + '">' + (r === 'Other' ? 'Related' : r) + '</button>';
      }).join('') + '</div>' +
      '<button type="button" class="link edge-del" data-action="remove-edge" data-id="' + esc(e.id) + '">Remove connection</button>';
    // Sits beside the line's midpoint, kept inside the map
    var map = $('map').getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight;
    box.style.left = Math.max(8, Math.min(map.width - w - 8, at.x - w / 2)) + 'px';
    box.style.top = Math.max(8, Math.min(map.height - h - 8, at.y + 16)) + 'px';
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
    if (!state.run) return go(3);
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
      scope: scopePlaces()
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
  // Where the scope is, for the map view: the demo gazetteer first, then coordinates saved from the Where map
  function scopePlaces() {
    var known = window.DEMO_PLACES.scope(state.query.where), names = known.map(function (p) { return p.name; });
    return known.concat(state.query.where.filter(function (t) { return names.indexOf(t) < 0 && (state.places || {})[t]; }).map(function (t) {
      return { name: t, lon: state.places[t].lng, lat: state.places[t].lat };
    }));
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
    // Reading a source's panel counts as reading its team notes
    if (markSeen(id) && state.screen === 4) { renderWsRows(); renderTeam(); }
    if (corr) corr.highlight(id);
    renderPanel();
    markOpenRow();
    drawMap(0);
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
    var warns = signals.filter(function (x) { return x.warn; });
    var picking = state.screen === 3, picked = state.picks.indexOf(e.id) >= 0;
    // Header: what it is, the title (with the pick checkbox beside it on Select), and anything to check before relying on it
    var body = '<div class="panel-top"><span class="muted small cls-tag">' + clsGlyph(e.cls) + esc(S.CLASS_LABELS[e.cls]) + ' · ' + esc(e.format) + ' · ' + esc(fmtDate(e.published)) + '</span>' +
      '<button type="button" id="panel-close" class="icon" data-action="close" aria-label="Close source">×</button></div>' +
      (state.screen >= 4 ? categoryControls(e) : '') +
      '<div class="panel-head">' +
        (picking ? '<label class="panel-check" title="Work from this source"><input type="checkbox" data-action="pick" data-id="' + esc(e.id) + '"' + (picked ? ' checked' : '') + '><span class="sr">Work from this source</span></label>' : '') +
        '<h2 class="panel-title">' + esc(e.title) + '</h2></div>' +
      (url ? '<p><a class="open-link" href="' + esc(url) + '" target="_blank" rel="noopener">Open the original ↗</a></p>' : '');
    if (warns.length) {
      body += '<ul class="panel-warn" aria-label="Check before relying on this">' + warns.map(function (x) {
        return '<li><strong>' + esc(x.label) + '.</strong> ' + esc(x.detail) + '</li>';
      }).join('') + '</ul>';
    }
    if (e.youtube) {
      body += '<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(e.youtube) + '" title="' + esc(e.title) + '" allowfullscreen loading="lazy"></iframe></div>';
    }
    body += '<p class="panel-summary">' + esc(e.summary) + '</p>';
    body += behindSection(e) + knowsSection(e, w) + claimsSection(e);
    if (e.term && e.term.length) body += '<h3 class="sec">Framing</h3><p class="terms">' + e.term.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join(' ') + '</p>';
    var tnotes = teamNotes(e.id);
    if (tnotes.length) {
      body += '<h3 class="sec">Team notes <span class="count">' + tnotes.length + '</span></h3><ul class="team-notes">' + tnotes.map(function (n) {
        var m = TEAM.members[n.by];
        return '<li>' + memberMark(n.by) + '<div><p class="team-who"><strong>' + esc(m.name) + '</strong> <span class="muted small">· ' + esc(m.role) + ' · ' + esc(n.at) + '</span></p><p>' + esc(n.text) + '</p></div></li>';
      }).join('') + '</ul><p class="muted small">Simulated for the playtest: these teammates are not real.</p>';
    }
    body += '<h3 class="sec"><label for="note">Your notes</label></h3><textarea id="note" rows="4" placeholder="What stands out? What would you check?">' + esc(state.notes[e.id] || '') + '</textarea>';
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
  // Where this source's information comes from: its origin, and the documented chain
  // around it (who checks it, who reports on it, who shares its origin). Informational
  // only; adding a link to the map stays in "Documented links" below.
  // --- Source panel sections ---
  function initials(name) {
    var words = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(function (x) { return /^[A-Za-zÀ-ÿ0-9]/.test(x); });
    return ((words[0] || '?').charAt(0) + (words[1] ? words[1].charAt(0) : '')).toUpperCase();
  }
  // 1 · Who is behind it: the publisher, who backs it, and how this piece reached it.
  // Owner, funding and ties come from window.PUBLISHERS (data/catalog.js) when someone has recorded them.
  function behindSection(e) {
    var v = VOICES[e.voice], pub = (window.PUBLISHERS || {})[e.publisher] || {};
    var kind = pub.type || (v ? v.label : S.CLASS_LABELS[e.cls]) || '';
    var rows = [['Owned by', pub.owner], ['Funded by', pub.funding], ['Ties to a party', pub.ties]].filter(function (r) { return r[1]; });
    var how = ORIGIN_NOTES[e.origin];
    if (e.origin === 'official statement' && v) how = 'The ' + v.label + ' speaking for itself (' + v.kind + ').';
    return '<h3 class="sec">Who is behind it</h3><div class="pub-card">' +
      '<div class="pub-head"><span class="pub-mark" aria-hidden="true">' + esc(initials(e.publisher)) + '</span>' +
        '<span><strong>' + esc(e.publisher) + '</strong><span class="muted small pub-kind">' + esc([kind, pub.country].filter(Boolean).join(' · ')) + '</span></span></div>' +
      '<dl class="facts">' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') +
        (how ? '<div><dt>How it got here</dt><dd>' + esc(how) + '</dd></div>' : '') + '</dl>' +
      (rows.length ? '' : '<p class="muted small pub-gap">Owner, funding and ties to a party: not recorded yet.</p>') +
      '</div>' + lineageSection(e, true);
  }
  // 2 · How it knows: the same facts for every source, as values. No score.
  function knowsSection(e, w) {
    var READ = { direct: 'Full text', search: 'Search text only', analyst: 'Added by you, not read', none: 'Not read' };
    var QUOTED = { named: 'Named', pseudonymous: 'Pseudonymous', 'not stated': 'Not stated' };
    var date = S.windowStatus(e, w);
    var cells = [
      ['Basis', e.origin, false],
      ['People quoted', QUOTED[e.who] || e.who, e.who === 'pseudonymous'],
      ['Read by the tool', READ[e.read] || READ.none, e.read !== 'direct'],
      ['Fact-check finding', e.factcheck || 'None published', !!e.factcheck],
      ['Date', date === 'in' ? 'Inside your dates' : date === 'out' ? 'Outside your dates' : 'Not confirmed', date !== 'in'],
      ['Language', e.lang, false]
    ];
    return '<h3 class="sec">How it knows</h3><dl class="know-grid">' + cells.map(function (c) {
      return '<div class="' + (c[2] ? 'check' : '') + '"><dt>' + c[0] + '</dt><dd>' + esc(c[1]) + '</dd></div>';
    }).join('') + '</dl>' +
      (e.dateNote ? '<p class="muted small">' + esc(e.dateNote) + '</p>' : '');
  }
  // 3 · Who says what: claims grouped by who the speaker speaks for, with the balance of voices on top
  function voiceColor(key) { var i = Object.keys(VOICES).indexOf(key); return key === 'unknown' || i < 0 ? 'var(--cat-0)' : 'var(--cat-' + ((i % 6) + 1) + ')'; }
  function claimsSection(e) {
    if (!e.claims || !e.claims.length) return '';
    var groups = {}, order = [];
    e.claims.forEach(function (c) {
      var key = speaker(c.by).voice || 'unknown';
      if (!groups[key]) { groups[key] = []; order.push(key); }
      groups[key].push(c);
    });
    order.sort(function (x, y) { return groups[y].length - groups[x].length; });
    // Voices heard somewhere in the catalog but not in this source
    var heard = {};
    allEntries().forEach(function (o) { (o.claims || []).forEach(function (c) { heard[speaker(c.by).voice || 'unknown'] = true; }); });
    var absent = Object.keys(VOICES).filter(function (k) { return k !== 'unknown' && heard[k] && !groups[k]; }).map(function (k) { return VOICES[k].label; });
    var label = function (k) { return (VOICES[k] || VOICES.unknown).label; };
    return '<h3 class="sec">Who says what</h3>' +
      '<div class="voice-bar" role="img" aria-label="' + esc(order.map(function (k) { return groups[k].length + ' ' + label(k); }).join(', ')) + '">' +
        order.map(function (k) { return '<i style="flex:' + groups[k].length + ';background:' + voiceColor(k) + '"></i>'; }).join('') + '</div>' +
      '<p class="muted small voice-sum">' + plural(e.claims.length, 'claim') + ' from ' + plural(order.length, 'voice') + '.' +
        (absent.length ? ' Not quoted here: ' + esc(absent.join(', ')) + '.' : '') + '</p>' +
      order.map(function (k) {
        return '<section class="voice-group"><h4><i style="background:' + voiceColor(k) + '"></i>' + esc(label(k)) + ' <span class="count">' + groups[k].length + '</span></h4><ul class="claims">' +
          groups[k].map(function (c) {
            var sp = speaker(c.by), who = [sp.role, sp.via ? 'relayed by ' + sp.via : ''].filter(Boolean).join(' · ');
            return '<li><strong>' + esc(c.by) + '</strong>' + (who ? ' <span class="muted small">· ' + esc(who) + '</span>' : '') + '<br>' + esc(c.text) + '</li>';
          }).join('') + '</ul></section>';
      }).join('');
  }
  // Documented links to other sources. `bare` leaves out the heading and origin note (the publisher card already has them).
  function lineageSection(e, bare) {
    var note = ORIGIN_NOTES[e.origin];
    if (e.origin === 'official statement' && VOICES[e.voice]) {
      note = 'The ' + VOICES[e.voice].label + ' speaking for itself (' + VOICES[e.voice].kind + '). Published by ' + e.publisher + '.';
    }
    var items = LINKS.filter(function (l) {
      return (l.a === e.id || l.b === e.id) && LINEAGE_RELS[l.rel];
    }).map(function (l) {
      var out = l.a === e.id, otherId = out ? l.b : l.a, o = entry(otherId);
      if (!o) return '';
      var away = state.screen === 4 && !workspaceRows().some(function (r) { return r.id === otherId; });
      return '<li><span><strong>' + esc(LINEAGE_RELS[l.rel][out ? 0 : 1]) + '</strong> ' +
        '<button type="button" class="link" data-action="open" data-id="' + esc(otherId) + '">' + esc(o.title) + '</button>' +
        (away ? ' <span class="tag">Not gathered</span>' : '') +
        '<br><span class="muted small">' + esc(l.why) + '</span></span></li>';
    }).join('');
    if (bare) return items ? '<ul class="edges lineage">' + items + '</ul>' : '';
    if (!note && !items) return '';
    return '<h3>Behind this source</h3>' +
      (note ? '<p class="muted small">' + esc(note) + '</p>' : '') +
      (items ? '<ul class="edges lineage">' + items + '</ul>' : '');
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
    if (a === 'pick-all') {
      visibleSeeds(searchResult()).forEach(function (x) {
        var at = state.picks.indexOf(x.entry.id);
        if (t.checked && at < 0) state.picks.push(x.entry.id);
        if (!t.checked && at >= 0) state.picks.splice(at, 1);
      });
      state.run = null; state.reached = 3;
      save(); renderSteps(); renderSeedList(); renderSelectFoot(); renderPanel();
      return;
    }
    if (a === 'scope-edit') return go(1, +t.getAttribute('data-step'));
    if (a === 'go') return visit(+t.getAttribute('data-n'));
    if (a === 'token') {
      // A date suggestion replaces the range instead of adding to it
      if (t.getAttribute('data-col') === 'when') { state.query.when = [t.getAttribute('data-value')]; view.cal = null; }
      else addToken(t.getAttribute('data-col'), t.getAttribute('data-value'));
      if (t.getAttribute('data-col') === 'where') locate(t.getAttribute('data-value'));
      view.error = null;
      return render();
    }
    if (a === 'untoken') {
      var gone = state.query[t.getAttribute('data-col')].splice(+t.getAttribute('data-i'), 1)[0];
      if (t.getAttribute('data-col') === 'where') delete state.places[gone];
      return render();
    }
    if (a === 'place') return addPlace(view.results[+t.getAttribute('data-i')]);
    if (a === 'scope-back') return scopeMove(-1);
    if (a === 'cal-day') return pickDay(t.getAttribute('data-date'));
    if (a === 'cal-move') {
      var cal = calendar(), moved = new Date(cal.y, cal.m + (+t.getAttribute('data-by')), 1);
      cal.y = moved.getFullYear(); cal.m = moved.getMonth();
      render();
      var nav = $('screen').querySelector('[data-action="cal-move"][data-by="' + t.getAttribute('data-by') + '"]');
      if (nav) nav.focus();
      return;
    }
    if (a === 'use-scenario') {
      state.query = { who: ['Donald Trump', 'Nicolás Maduro'], what: ['Kidnapping'], when: ['Jan 3 – Jan 16, 2026'], where: ['Venezuela'] };
      view.outOfScope = false; view.error = null; view.cal = null;
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
    if (a === 'skip-search') return showSelect();
    if (a === 'add-open') return $('add-dialog').showModal();
    if (a === 'add-close') return $('add-dialog').close();
    if (a === 'ws-group') { view.group = t.getAttribute('data-value'); return renderWsList(); }
    if (a === 'team-filter') {
      var member = t.getAttribute('data-value');
      view.teamFilter = view.teamFilter === member ? null : member;
      renderTeam(); renderWsList();
      return;
    }
    if (a === 'zoom' && graph) {
      var z = t.getAttribute('data-value');
      if (z === 'in') graph.zoomBy(1.25); else if (z === 'out') graph.zoomBy(0.8); else if (z === 'fit') graph.fit(); else graph.zoomTo(1);
      return;
    }
    if (a === 'key-toggle') {
      state.keyOpen = state.keyOpen === false; save(); renderKey();
      var keyNext = $('map-key').querySelector('[data-action="key-toggle"]'); if (keyNext) keyNext.focus();
      return;
    }
    if (a === 'gaps-toggle') {
      state.gapsOpen = state.gapsOpen === false; save(); renderGaps();
      var next = $('gaps').querySelector('[data-action="gaps-toggle"]'); if (next) next.focus();
      return;
    }
    if (a === 'cov-toggle') { state.covOpen = state.covOpen === false; save(); return renderCoverage(); }
    if (a === 'cov-cls' || a === 'cov-origin' || a === 'cov-voice') {
      var cv = t.getAttribute('data-value'), key = { 'cov-cls': 'clsFilter', 'cov-origin': 'originFilter', 'cov-voice': 'voiceFilter' }[a];
      view[key] = view[key] === cv ? 'all' : cv;
      renderCoverage(); renderWsList();
      return;
    }
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
      if (view.edgeMenu === id) view.edgeMenu = null;
      save(); renderPanel(); drawMap(0.3);
      return;
    }
    if (a === 'edge-rel') {
      var changed = state.edges.filter(function (x) { return x.id === id; })[0];
      if (changed) changed.rel = t.getAttribute('data-value');
      view.edgeMenu = null;
      save(); renderPanel(); drawMap(0);
      return;
    }
    if (a === 'edge-menu-close') { view.edgeMenu = null; return drawMap(0); }
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
    if (a === 'restart') return $('restart-dialog').showModal();
    if (a === 'restart-cancel') return $('restart-dialog').close();
    if (a === 'restart-confirm') {
      $('restart-dialog').close();
      timers.forEach(clearTimeout); timers = [];
      state = fresh();
      view.panel = null; view.seedClass = 'all'; view.seedText = ''; view.error = null; view.outOfScope = false; view.cal = null;
      view.group = 'all'; view.catFilter = 'all'; view.clsFilter = 'all'; view.originFilter = 'all'; view.voiceFilter = 'all';
      render(true);
    }
  });
  function togglePick(id, on) {
    var i = state.picks.indexOf(id);
    if (on && i < 0) state.picks.push(id);
    if (!on && i >= 0) state.picks.splice(i, 1);
    //picks changed, so an earlier search no longer matches them
    state.run = null;
    state.reached = 3;
    save(); renderSteps(); renderSeedList(); renderSelectFoot(); renderPanel();
  }
  document.addEventListener('keydown', function (ev) {
    // Cmd/Ctrl+K jumps to the list search on Select
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k' && $('seed-text')) { ev.preventDefault(); $('seed-text').focus(); return; }
    if (ev.key !== 'Escape') return;
    if ($('add-dialog') && $('add-dialog').open) return;
    if ($('restart-dialog').open) return;
    if (view.edgeMenu) { view.edgeMenu = null; drawMap(0); return; }
    if (view.picking) { view.picking = false; renderPanel(); drawMap(0); return; }
    if (view.panel) closePanel();
  });

  render();
})();
