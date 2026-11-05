// UI over algorithm.js: scope form -> run -> filtered side panel.
// Progressive disclosure to keep the analyst from drowning: gaps first (one line each, evidence on expand),
// a class bar that doubles as the main filter, the top few sources per class, everything else one click away.
(function () {
  var SG = window.SourceGatherer, GEO = window.GEO;
  var $ = function (id) { return document.getElementById(id); };
  var TOP_N = 3;
  var state = {
    input: null, overrides: {}, result: null, baseline: null,
    cls: null, filters: {}, q: '', expanded: {}, openFacets: { cost: true, access: true }
  };

  var FACETS = [
    { key: 'cost', label: 'Cost', get: function (c) { return [c.tags.cost]; } },
    { key: 'access', label: 'Access', get: function (c) { return [c.tags.access]; } },
    { key: 'platform', label: 'Platform', get: function (c) { return [c.tags.platform]; } },
    { key: 'language', label: 'Language', get: function (c) { return c.tags.languages.length ? c.tags.languages : ['none']; }, name: langName },
    { key: 'affiliation', label: 'Affiliation', get: function (c) { return [c.tags.affiliation]; } },
    { key: 'status', label: 'Status', get: function (c) { return [c.counted ? 'usable' : 'not counted']; } }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function option(value, label) { return '<option value="' + esc(value) + '">' + esc(label) + '</option>'; }
  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  var LANG_NAMES = (function () {
    var map = {};
    Object.keys(GEO.countries).forEach(function (cc) {
      var c = GEO.countries[cc];
      c.officialLanguages.forEach(function (l) { map[l.code] = l.name; });
      Object.keys(c.regions).forEach(function (r) { c.regions[r].languages.forEach(function (l) { map[l.code] = l.name; }); });
    });
    Object.keys(GEO.languageNames).forEach(function (k) { map[k] = GEO.languageNames[k]; });
    return map;
  })();
  function langName(code) { return code === 'none' ? 'No text (imagery)' : (LANG_NAMES[code] || code); }

  // --- Scope form ---
  $('country').innerHTML = option('', 'Choose…') + Object.keys(GEO.countries).map(function (cc) {
    return option(cc, GEO.countries[cc].name);
  }).join('');
  $('issue').innerHTML = option('', 'Choose…') + GEO.issueTypes.map(function (t) { return option(t.id, t.label); }).join('');
  function fillRegions() {
    var c = GEO.countries[$('country').value];
    $('region').innerHTML = option('', 'Choose…') + (c ? option('all', 'Country-wide') + Object.keys(c.regions).map(function (r) {
      return option(r, c.regions[r].name);
    }).join('') : '');
  }
  $('country').addEventListener('change', fillRegions);
  fillRegions();

  $('scope').addEventListener('submit', function (e) {
    e.preventDefault();
    state.input = { country: $('country').value, region: $('region').value, issue: $('issue').value };
    state.overrides = {};
    state.cls = null; state.filters = {}; state.q = ''; state.expanded = {};
    $('q').value = '';
    $('derived').open = false;
    run();
  });

  $('rerun').addEventListener('click', function () {
    var base = state.baseline;
    var langs = checked('languages').concat($('add-lang').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean));
    var borders = checked('borders');
    var days = parseInt($('window').value, 10);
    state.overrides = {
      languages: same(langs, base.languages.map(function (l) { return l.code; })) ? undefined : langs,
      borders: same(borders, base.borders) ? undefined : borders,
      windowDays: days && days !== base.windowDays ? days : undefined
    };
    $('add-lang').value = '';
    run();
  });
  $('reset').addEventListener('click', function () { state.overrides = {}; run(); });
  $('q').addEventListener('input', function () { state.q = this.value.toLowerCase(); renderResults(); });

  function checked(id) {
    return Array.prototype.slice.call($(id).querySelectorAll('input:checked')).map(function (i) { return i.value; });
  }
  function same(a, b) { return a.slice().sort().join() === b.slice().sort().join(); }

  // One delegated handler for everything rendered with data-action
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var a = el.getAttribute('data-action'), v = el.getAttribute('data-value');
    if (a === 'class') state.cls = v || null;
    else if (a === 'expand') state.expanded[v] = !state.expanded[v];
    else if (a === 'unfilter') {
      var parts = v.split('|'), sel = state.filters[parts[0]];
      sel.splice(sel.indexOf(parts[1]), 1);
    } else if (a === 'clear') { state.filters = {}; state.cls = null; state.q = ''; $('q').value = ''; }
    else if (a === 'clear-q') { state.q = ''; $('q').value = ''; }
    else return;
    renderResults();
  });

  function run() {
    var r = SG.run(state.input, { overrides: state.overrides });
    state.result = r;
    $('stop').hidden = !r.stopped;
    $('out').hidden = r.stopped;
    if (r.stopped) {
      $('stop').textContent = 'Stopped: ' + r.missing.join(', ') + ' missing. Nothing starts without your input.';
      return;
    }
    state.baseline = SG.deriveScope(state.input, GEO, new Date());
    renderDerived(r.scope);
    // Gaps come from the unfiltered run, so they only re-render on a new search (keeps expanded ones open)
    renderGaps(r);
    renderResults();
  }

  // --- Auto-derived scope: one summary line, controls behind it ---
  function renderDerived(s) {
    var base = state.baseline;
    var langs = s.languages.map(function (l) { return l.code; });
    var adjusted = s.overridden.length ? ' <span class="tag">adjusted</span>' : '';
    $('derived-summary').innerHTML =
      '<strong>' + esc(s.countryName) + ' › ' + esc(s.regionName) + ' › ' + esc(s.issue.label) + '</strong>' +
      '<span class="muted"> · ' + esc(plural(s.languages.length, 'language')) + ' · ' + esc(plural(s.borders.length, 'bordering state')) +
      ' · last ' + s.windowDays + ' days</span>' + adjusted + ' <span class="link">Adjust</span>';

    var allLangs = base.languages.concat(s.languages.filter(function (l) { return langs.indexOf(l.code) >= 0 && !base.languages.some(function (b) { return b.code === l.code; }); }));
    $('languages').innerHTML = allLangs.map(function (l) {
      return '<label><input type="checkbox" value="' + esc(l.code) + '"' + (langs.indexOf(l.code) >= 0 ? ' checked' : '') + '> ' +
        esc(l.name) + (l.official ? ' <span class="muted">(official)</span>' : '') + '</label>';
    }).join('');
    $('borders').innerHTML = base.borders.map(function (cc) {
      return '<label><input type="checkbox" value="' + esc(cc) + '"' + (s.borders.indexOf(cc) >= 0 ? ' checked' : '') + '> ' + esc(GEO.names[cc] || cc) + '</label>';
    }).join('') || '<span class="muted">None on record</span>';
    $('window').value = s.windowDays;
  }

  // --- Filtering ---
  function matchesQuery(c) {
    if (!state.q) return true;
    var s = c.source;
    return [s.name, s.note, s.useFor, s.platform, s.affiliation, s.cost, s.access, (c.why || []).join(' ')]
      .join(' ').toLowerCase().indexOf(state.q) >= 0;
  }
  function passes(c, skipKey) {
    return FACETS.every(function (f) {
      var sel = state.filters[f.key];
      if (f.key === skipKey || !sel || !sel.length) return true;
      return f.get(c).some(function (v) { return sel.indexOf(v) >= 0; });
    }) && matchesQuery(c);
  }

  function renderResults() {
    var r = state.result;
    var visible = r.candidates.filter(function (c) { return passes(c); });
    renderClassbar(r);
    renderFacets(r.candidates.filter(function (c) { return !state.cls || c.cls === state.cls; }));
    renderChips();

    var inClass = visible.filter(function (c) { return !state.cls || c.cls === state.cls; });
    $('shown').textContent = inClass.length + ' of ' + r.candidates.length + ' sources';

    var classes = state.cls ? [state.cls] : SG.CLASSES;
    $('classes').innerHTML = classes.map(function (cls) {
      var all = r.byClass[cls];
      // Usable first, then not counted; the algorithm's specificity order is kept within each
      var list = all.filter(function (c) { return visible.indexOf(c) >= 0; });
      list = list.filter(function (c) { return c.counted; }).concat(list.filter(function (c) { return !c.counted; }));
      if (!all.length && !state.cls) return '';
      var cov = r.coverage[cls];
      var open = state.cls || state.expanded[cls];
      var shown = open ? list : list.slice(0, TOP_N);
      var head = '<h2 class="class-head">' + esc(SG.CLASS_LABELS[cls]) +
        ' <span class="count' + (cov.observed ? '' : ' bad') + '">' + cov.observed + ' usable of ' + cov.listed + '</span></h2>';
      if (!list.length) return '<section class="class">' + head + '<p class="muted">' + (all.length ? 'None match the current filters.' : 'No sources for this scope.') + '</p></section>';
      var more = !state.cls && list.length > TOP_N
        ? '<button type="button" class="link" data-action="expand" data-value="' + cls + '">' +
          (open ? 'Show fewer' : 'Show all ' + list.length) + '</button>'
        : '';
      return '<section class="class">' + head + '<ul class="cards">' + shown.map(card).join('') + '</ul>' + more + '</section>';
    }).join('');

    var pr = r.possiblyRelevant.filter(matchesQuery);
    $('possibly').hidden = !pr.length;
    $('possibly').innerHTML = '<summary>Possibly relevant <span class="count">' + pr.length + '</span></summary>' +
      '<p class="muted">Didn\'t match both geography and issue, kept in case you want sub-similar content.</p><ul class="cards">' +
      pr.map(function (p) { return card({ source: p.source, why: [p.reason], tags: tagsOf(p.source), counted: true }); }).join('') + '</ul>';

    var tk = r.toolkit.filter(matchesQuery);
    $('toolkit').innerHTML = '<summary>Verification toolkit <span class="count">' + tk.length + '</span></summary><ul class="cards">' +
      tk.map(function (t) { return card({ source: t.source, why: [t.source.useFor], tags: t.tags, counted: true }); }).join('') + '</ul>';

    $('trace').innerHTML = '<summary>How this was filtered</summary><ol class="trace">' +
      r.trace.map(function (t) {
        return '<li><strong>' + esc(t.label) + '</strong> <span class="tag">' + esc(t.outcome) + '</span><br><span class="muted">' + esc(t.detail) + '</span></li>';
      }).join('') + '</ol>';
  }

  function tagsOf(s) { return { cost: s.cost, access: s.access, affiliation: s.affiliation, platform: s.platform, languages: s.languages }; }

  function card(c) {
    var s = c.source, t = c.tags;
    var title = s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>' : '<span>' + esc(s.name) + '</span>';
    var langs = t.languages.length ? t.languages.map(langName).join(', ') : 'No text';
    var html = '<li class="card' + (c.counted === false ? ' off' : '') + '">' +
      '<div class="card-head">' + title + '<span class="pills">' +
        '<span class="pill pill-' + esc(t.cost) + '">' + esc(t.cost) + '</span>' +
        '<span class="pill">' + esc(t.access) + '</span></span></div>' +
      '<div class="why">' + esc((c.why || []).join(' · ')) + '</div>' +
      '<div class="meta">' + esc([t.platform, t.affiliation, langs].join(' · ')) + '</div>';
    if (c.reduced) html += '<div class="warn">Not counted: ' + esc(s.statusNote || 'reduced coverage') + '</div>';
    (c.blockedBy || []).forEach(function (e) { html += '<div class="warn">Not counted: ' + esc((e.mock ? '[mock] ' : '') + e.note) + '</div>'; });
    (c.contextEvents || []).forEach(function (e) {
      html += '<div class="meta">Context: ' + esc((e.mock ? '[mock] ' : '') + e.note) + ' (' + esc(e.start) + (e.end ? ' to ' + esc(e.end) : ', ongoing') + ')' +
        (e.ref ? ' <a href="' + esc(e.ref) + '" target="_blank" rel="noopener">ref</a>' : '') + '</div>';
    });
    var foot = [];
    if (s.note) foot.push('<span class="meta">' + esc(s.note) + '</span>');
    if (c.searchLink) foot.push('<a href="' + esc(c.searchLink) + '" target="_blank" rel="noopener">Search this scope ↗</a>');
    if (foot.length) html += '<div class="card-foot">' + foot.join(' ') + '</div>';
    return html + '</li>';
  }

  // --- Gaps: one line each, evidence on expand. Language gaps are merged into a single line. ---
  function renderGaps(r) {
    var classGaps = r.gapFlags.filter(function (g) { return g.kind === 'class'; });
    var langGaps = r.gapFlags.filter(function (g) { return g.kind === 'language'; });
    var items = classGaps.map(function (g) {
      return gapItem(g.categories.map(function (c) { return c.category; }),
        '<strong>' + esc(SG.CLASS_LABELS[g.cls]) + '</strong>: ' + g.observed + ' of ' + plural(g.listed, 'source') + ' usable',
        [].concat.apply([], g.categories.map(function (c) { return c.evidence.map(function (e) { return '<span class="tag">' + esc(c.category) + '</span> ' + esc(e); }); })),
        g.listed ? '<button type="button" class="link" data-action="class" data-value="' + g.cls + '">See these sources</button>' : '');
    });
    if (langGaps.length) {
      items.push(gapItem(['language/indexing'],
        '<strong>Languages</strong>: no source in ' + esc(langGaps.map(function (g) { return g.language.name; }).join(', ')),
        [].concat.apply([], langGaps.map(function (g) { return g.categories[0].evidence.map(esc); })), ''));
    }
    $('gaps').innerHTML = items.length
      ? '<h2>What\'s missing <span class="count">' + items.length + '</span></h2><ul class="gaplist">' + items.join('') + '</ul>'
      : '<p class="ok">Nothing missing: every class and language has at least one usable source.</p>';
  }
  function gapItem(cats, line, evidence, action) {
    return '<li><details><summary>' + line + ' ' + cats.map(function (c) { return '<span class="badge">' + esc(c) + '</span>'; }).join(' ') +
      '</summary><ul class="evidence">' + evidence.map(function (e) { return '<li>' + e + '</li>'; }).join('') + '</ul>' + action + '</details></li>';
  }

  // --- Class bar: the 7 classes at a glance, and the main way to narrow down ---
  function renderClassbar(r) {
    function btn(value, label, sub, bad) {
      var on = (state.cls || '') === value;
      return '<button type="button" data-action="class" data-value="' + value + '" aria-pressed="' + on + '" class="cb' + (bad ? ' bad' : '') + '">' +
        '<span>' + esc(label) + '</span><small>' + sub + '</small></button>';
    }
    $('classbar').innerHTML = btn('', 'All classes', r.candidates.length + ' sources', false) + SG.CLASSES.map(function (cls) {
      var cov = r.coverage[cls];
      return btn(cls, SG.CLASS_LABELS[cls], cov.observed ? cov.observed + ' usable' : 'gap', !cov.observed);
    }).join('');
  }

  function renderChips() {
    var chips = [];
    if (state.cls) chips.push(chip('Class: ' + SG.CLASS_LABELS[state.cls], 'class', ''));
    FACETS.forEach(function (f) {
      (state.filters[f.key] || []).forEach(function (v) { chips.push(chip(f.label + ': ' + (f.name ? f.name(v) : v), 'unfilter', f.key + '|' + v)); });
    });
    if (state.q) chips.push(chip('Text: "' + state.q + '"', 'clear-q', ''));
    $('chips').innerHTML = chips.length ? chips.join('') + '<button type="button" class="link" data-action="clear">Clear all</button>' : '';
  }
  function chip(label, action, value) {
    return '<button type="button" class="chip" data-action="' + action + '" data-value="' + esc(value) + '" aria-label="Remove ' + esc(label) + '">' + esc(label) + ' ×</button>';
  }

  // Counts per value are computed with every other filter applied, like a shopping site
  function renderFacets(all) {
    // On narrow screens the whole filter list folds into one box so sources aren't pushed a screen down
    var narrow = window.matchMedia('(max-width: 760px)').matches;
    var active = FACETS.reduce(function (n, f) { return n + (state.filters[f.key] || []).length; }, 0);
    var boxOpen = !narrow || state.filterBoxOpen;
    $('facets').innerHTML = '<details class="filterbox"' + (boxOpen ? ' open' : '') + '><summary>Filters' +
      (active ? ' <span class="count">' + active + ' active</span>' : '') + '</summary>' + FACETS.map(function (f) {
      var counts = {};
      all.forEach(function (c) {
        f.get(c).forEach(function (v) { counts[v] = counts[v] || 0; if (passes(c, f.key)) counts[v]++; });
      });
      var sel = state.filters[f.key] || [];
      var values = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
      return '<details data-facet="' + f.key + '"' + (state.openFacets[f.key] || sel.length ? ' open' : '') + '><summary>' + esc(f.label) +
        (sel.length ? ' <span class="count">' + sel.length + '</span>' : '') + '</summary>' +
        values.map(function (v) {
          return '<label class="' + (counts[v] ? '' : 'zero') + '"><input type="checkbox" data-facet="' + f.key + '" value="' + esc(v) + '"' + (sel.indexOf(v) >= 0 ? ' checked' : '') + '> ' +
            '<span>' + esc(f.name ? f.name(v) : v) + '</span><span class="count">' + counts[v] + '</span></label>';
        }).join('') + '</details>';
    }).join('') + '</details>';
    $('facets').querySelector('.filterbox').addEventListener('toggle', function () { if (narrow) state.filterBoxOpen = this.open; });
    Array.prototype.forEach.call($('facets').querySelectorAll('details[data-facet]'), function (d) {
      d.addEventListener('toggle', function () { state.openFacets[d.getAttribute('data-facet')] = d.open; });
    });
    Array.prototype.forEach.call($('facets').querySelectorAll('input'), function (box) {
      box.addEventListener('change', function () {
        var key = box.getAttribute('data-facet');
        var sel = state.filters[key] = state.filters[key] || [];
        if (box.checked) sel.push(box.value); else sel.splice(sel.indexOf(box.value), 1);
        renderResults();
      });
    });
  }
})();
