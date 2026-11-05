// Algorithm 1 · Source Gatherer
// Follows the "logic flow" frame in Figma (UN Innovation DPPA Sprint, node 14:65):
//
//   ANALYST INPUT -> G0 scope lock -> auto-derive -> A1 issue class -> A2 local languages
//   -> A3 geography AND issue (per source) -> A4 access tagging -> A5 >=1 per class -> OUTPUT 1 filtered side panel
//
// Every step only filters, tags and counts. Nothing here ranks a source as more or less trustworthy:
// order inside a class is by how specifically a source covers the scope, and the reason is shown.
// Pure functions, no DOM, so it runs in the browser (window.SourceGatherer) and in node (test.js).
(function (root) {
  var CLASSES = ['traditional', 'local', 'regional', 'un', 'academic', 'satellite', 'ground'];
  var CLASS_LABELS = {
    traditional: 'Traditional media', local: 'Local media', regional: 'Regional media', un: 'UN / institutional',
    academic: 'Academic / research', satellite: 'Satellite / OSINT', ground: 'Ground comms'
  };
  // Default search window by issue class: protests move in days, conflicts build over a year or more
  var WINDOW_DAYS = { conflict: 365, protest: 30, other: 90 };
  var GEO_RANK = { region: 5, country: 4, border: 3, regional: 2, global: 1 };
  // Classes where a missing local language plausibly explains an empty class
  var LANGUAGE_SENSITIVE = ['local', 'ground'];
  var DAY = 86400000;

  function isoDate(d) { return d.toISOString().slice(0, 10); }
  function unique(list) { return list.filter(function (x, i) { return list.indexOf(x) === i; }); }

  // --- G0 · Scope lock: nothing starts without human input ---
  function scopeCheck(input) {
    var missing = ['country', 'region', 'issue'].filter(function (f) { return !input || !input[f]; });
    return { ok: missing.length === 0, missing: missing };
  }

  // --- Auto-derive from scope (not asked). Every derived field can be overridden by the analyst. ---
  function deriveScope(input, geo, today, overrides) {
    overrides = overrides || {};
    var country = geo.countries[input.country] || { name: geo.names[input.country] || input.country, officialLanguages: [], blocs: [], borders: [], regions: {} };
    var allRegions = input.region === 'all';
    var region = allRegions ? null : country.regions[input.region];
    var issue = geo.issueTypes.filter(function (t) { return t.id === input.issue; })[0] ||
      { id: input.issue, label: input.issue, issueClass: 'other', keyword: input.issue };

    // Official languages plus the region's (or every region's, for a country-wide scope)
    var languages = country.officialLanguages.map(function (l) { return { code: l.code, name: l.name, official: true }; });
    var regional = allRegions
      ? Object.keys(country.regions).reduce(function (acc, k) { return acc.concat(country.regions[k].languages); }, [])
      : (region ? region.languages : []);
    regional.forEach(function (l) {
      if (!languages.some(function (x) { return x.code === l.code; })) {
        languages.push({ code: l.code, name: l.name, official: false, related: l.related || [] });
      }
    });
    if (overrides.languages) {
      languages = overrides.languages.map(function (code) {
        return languages.filter(function (l) { return l.code === code; })[0] || { code: code, name: code, official: false, related: [] };
      });
    }

    var windowDays = overrides.windowDays || WINDOW_DAYS[issue.issueClass];
    var since = new Date(today.getTime() - windowDays * DAY);
    var borders = overrides.borders || country.borders.slice();

    return {
      country: input.country,
      countryName: country.name,
      region: input.region,
      regionName: allRegions ? 'Country-wide' : (region ? region.name : input.region),
      issue: issue,
      issueClass: issue.issueClass,
      languages: languages,
      borders: borders,
      borderNames: borders.map(function (c) { return geo.names[c] || c; }),
      blocs: country.blocs,
      windowDays: windowDays,
      since: since,
      today: today,
      overridden: Object.keys(overrides).filter(function (k) { return overrides[k] != null; }),
      known: !!geo.countries[input.country]
    };
  }

  // Most specific way a source's geography touches the scope, or null
  function geoMatch(source, scope) {
    var best = null, otherRegion = false;
    function take(level) { if (!best || GEO_RANK[level] > GEO_RANK[best]) best = level; }
    source.geo.forEach(function (entry) {
      if (entry === 'global') return take('global');
      if (entry.indexOf('bloc:') === 0) {
        if (scope.blocs.indexOf(entry.slice(5)) >= 0) take('regional');
        return;
      }
      var parts = entry.split(':');
      if (parts[0] === scope.country) {
        if (!parts[1] || scope.region === 'all') take('country');
        else if (parts[1] === scope.region) take('region');
        else otherRegion = true;
      } else if (scope.borders.indexOf(parts[0]) >= 0) {
        take('border');
      }
    });
    return { level: best, otherRegion: otherRegion };
  }

  function issueMatch(source, scope) {
    return source.issues.indexOf('all') >= 0 || source.issues.indexOf(scope.issueClass) >= 0;
  }

  function geoReason(level, source, scope) {
    if (level === 'region') return 'Covers ' + scope.regionName + ' specifically';
    if (level === 'country') return 'Covers ' + scope.countryName;
    if (level === 'border') {
      var hit = source.geo.map(function (e) { return e.split(':')[0]; })
        .filter(function (c) { return scope.borders.indexOf(c) >= 0; });
      return 'Covers bordering state ' + unique(hit).map(function (c) { return scope.borderNames[scope.borders.indexOf(c)]; }).join(', ');
    }
    if (level === 'regional') return 'Covers the regional bloc (' + source.geo.filter(function (e) { return e.indexOf('bloc:') === 0; }).map(function (e) { return e.slice(5); }).join(', ') + ')';
    return 'Global coverage';
  }

  // Access events for this country, split into ones that block the scope now and ones that are only context
  function scopedEvents(geo, scope) {
    return geo.accessEvents.filter(function (e) { return e.country === scope.country; }).map(function (e) {
      var start = e.start ? new Date(e.start) : new Date(scope.today.getTime() - e.startDaysAgo * DAY);
      var end = e.end ? new Date(e.end) : null;
      var coversRegion = !e.regions || e.regions.indexOf(scope.region) >= 0;
      var partOfCountry = scope.region === 'all' && !!e.regions;
      return {
        note: e.note, ref: e.ref || null, mock: !!e.mock, affects: e.affects,
        start: isoDate(start), end: end ? isoDate(end) : null,
        ongoing: !end,
        inWindow: !end || end >= scope.since,
        // An ongoing event only blocks the scope when it covers the whole scope area
        blocks: !end && coversRegion && !partOfCountry,
        relevant: coversRegion || partOfCountry
      };
    }).filter(function (e) { return e.relevant; });
  }

  function searchLink(source, scope) {
    if (!source.search) return null;
    var q = [scope.region === 'all' ? '' : scope.regionName, scope.countryName, scope.issue.keyword]
      .filter(Boolean).join(' ');
    var since = isoDate(scope.since);
    return source.search
      .replace('{q}', encodeURIComponent(q))
      .replace('{since}', since)
      .replace('{sinceCompact}', since.replace(/-/g, '') + '000000');
  }

  function run(input, opts) {
    opts = opts || {};
    var geo = opts.geo || root.GEO;
    var phonebook = opts.phonebook || root.PHONEBOOK;
    var today = opts.today || new Date();
    var trace = [];
    function log(gate, label, outcome, detail) { trace.push({ gate: gate, label: label, outcome: outcome, detail: detail }); }

    // G0
    var check = scopeCheck(input);
    if (!check.ok) {
      log('G0', 'Scope lock', 'STOP', 'Missing: ' + check.missing.join(', ') + '. Nothing starts without human input.');
      return { stopped: true, missing: check.missing, trace: trace };
    }
    log('G0', 'Scope lock', 'YES', 'Country, region and issue are all set by the analyst.');

    var scope = deriveScope(input, geo, today, opts.overrides);
    log('AD', 'Auto-derive from scope', 'DONE',
      'Languages: ' + scope.languages.map(function (l) { return l.name; }).join(', ') +
      ' · Bordering: ' + (scope.borderNames.join(', ') || 'none') +
      ' · Window: ' + scope.windowDays + ' days (since ' + isoDate(scope.since) + ')' +
      (scope.overridden.length ? ' · Overridden by analyst: ' + scope.overridden.join(', ') : '') +
      (scope.known ? '' : ' · No geography record for this country, so languages and borders could not be derived.'));

    // A1
    log('A1', 'Issue class', scope.issueClass.toUpperCase(), scope.issue.label + ' is treated as ' + scope.issueClass + '.');

    var sources = phonebook.filter(function (s) { return s.kind === 'source'; });
    var tools = phonebook.filter(function (s) { return s.kind === 'tool'; });

    // A2 · a language counts as covered only by a source that names it and covers this country or region.
    // User-generated platforms ('*') carry every language but index none of them, so they never close a gap.
    var languageGaps = [];
    scope.languages.forEach(function (lang) {
      var local = sources.filter(function (s) {
        var lvl = geoMatch(s, scope).level;
        return (lvl === 'region' || lvl === 'country') && s.languages.indexOf(lang.code) >= 0;
      });
      if (local.length) return;
      var related = sources.filter(function (s) {
        return geoMatch(s, scope).level && (lang.related || []).some(function (r) { return s.languages.indexOf(r) >= 0; });
      });
      languageGaps.push({ language: lang, related: related.map(function (s) { return s.name; }) });
    });
    log('A2', 'Sources in each local language?', languageGaps.length ? 'NO' : 'YES',
      languageGaps.length
        ? 'Language gap logged for: ' + languageGaps.map(function (g) { return g.language.name; }).join(', ') + '. Feeds A5.'
        : 'Every derived language has at least one source.');

    // A3 · per phonebook source: covers this geography AND this issue?
    var candidates = [], possiblyRelevant = [], skipped = 0;
    sources.forEach(function (s) {
      var gm = geoMatch(s, scope);
      var issueOk = issueMatch(s, scope);
      if (gm.level && issueOk) {
        candidates.push({ source: s, cls: s.cls, geoLevel: gm.level, why: [geoReason(gm.level, s, scope)] });
      } else if (gm.level || gm.otherRegion) {
        // Some geographic tie is required; an outlet in an unrelated country is skipped, not "possibly relevant"
        var reason = !issueOk
          ? 'Covers the area but not ' + scope.issueClass + ' issues'
          : 'Covers other regions of ' + scope.countryName + ', not ' + scope.regionName;
        possiblyRelevant.push({ source: s, cls: s.cls, reason: reason });
      } else {
        skipped++;
      }
    });
    log('A3', 'Covers this geography AND issue?', candidates.length + ' YES',
      possiblyRelevant.length + ' tagged "possibly relevant", ' + skipped + ' skipped with no overlap.');

    // A4 · tags only, so the analyst can filter by their needs and budget
    var events = scopedEvents(geo, scope);
    var localCodes = scope.languages.filter(function (l) { return !l.official; }).map(function (l) { return l.code; });
    candidates.forEach(function (c) {
      var s = c.source;
      c.tags = { cost: s.cost, access: s.access, affiliation: s.affiliation, platform: s.platform, languages: s.languages };
      c.reduced = s.status === 'reduced';
      c.blockedBy = events.filter(function (e) { return e.blocks && e.affects.indexOf(c.cls) >= 0; });
      c.contextEvents = events.filter(function (e) { return !e.blocks && e.inWindow && e.affects.indexOf(c.cls) >= 0; });
      c.counted = !c.reduced && c.blockedBy.length === 0;
      var speaks = s.languages.filter(function (code) { return localCodes.indexOf(code) >= 0; });
      if (speaks.length) c.why.push('Publishes in a local language (' + speaks.join(', ') + ')');
      c.score = GEO_RANK[c.geoLevel] * 10 + speaks.length;
      c.searchLink = searchLink(s, scope);
    });
    var blockedCount = candidates.filter(function (c) { return c.blockedBy.length; }).length;
    log('A4', 'Access tagging', 'TAGGED',
      'Cost, access, affiliation and platform attached to ' + candidates.length + ' sources.' +
      (blockedCount ? ' ' + blockedCount + ' are behind an ongoing access disruption.' : ''));

    // A5 · at least one counted candidate in each of the 7 classes? If not, flag the missing data point.
    var byClass = {}, coverage = {}, gapFlags = [];
    CLASSES.forEach(function (cls) {
      var list = candidates.filter(function (c) { return c.cls === cls; })
        .sort(function (a, b) { return b.score - a.score || a.source.name.localeCompare(b.source.name); });
      var counted = list.filter(function (c) { return c.counted; });
      byClass[cls] = list;
      coverage[cls] = { expected: 1, observed: counted.length, listed: list.length };
      if (counted.length) return;

      // Categorise by evidence only: each category needs something in the data that points to it
      var categories = [];
      var blocked = list.filter(function (c) { return c.blockedBy.length; });
      if (blocked.length) {
        var notes = unique([].concat.apply([], blocked.map(function (c) {
          return c.blockedBy.map(function (e) { return (e.mock ? '[mock] ' : '') + e.note + ' (since ' + e.start + ')'; });
        })));
        categories.push({ category: 'access blocked', evidence: notes.concat([blocked.length + ' source(s) in this class are unreachable from the scope area.']) });
      }
      var reduced = list.filter(function (c) { return c.reduced; });
      if (reduced.length) {
        categories.push({ category: 'capacity', evidence: reduced.map(function (c) { return c.source.name + ': ' + (c.source.statusNote || 'reduced coverage'); }) });
      }
      if (LANGUAGE_SENSITIVE.indexOf(cls) >= 0 && languageGaps.length) {
        categories.push({ category: 'language/indexing', evidence: ['No indexed source in: ' + languageGaps.map(function (g) { return g.language.name; }).join(', ') + '.'] });
      }
      if (!categories.length) {
        var near = possiblyRelevant.filter(function (p) { return p.cls === cls; }).length;
        categories.push({ category: 'unknown', evidence: ['No phonebook source matches this class for the scope.' +
          (near ? ' ' + near + ' possibly-relevant source(s) cover nearby scope.' : '')] });
      }
      gapFlags.push({ kind: 'class', cls: cls, title: 'No usable ' + CLASS_LABELS[cls].toLowerCase() + ' source', expected: 1, observed: 0, listed: list.length, categories: categories });
    });
    languageGaps.forEach(function (g) {
      var evidence = ['No source covering ' + scope.countryName + ' publishes in ' + g.language.name + '.'];
      if (g.related.length) evidence.push('Closest related-language sources: ' + g.related.join(', ') + '.');
      gapFlags.push({ kind: 'language', language: g.language, title: 'No source in ' + g.language.name, categories: [{ category: 'language/indexing', evidence: evidence }] });
    });
    var missingClasses = gapFlags.filter(function (g) { return g.kind === 'class'; });
    log('A5', '>=1 candidate in each of 7 classes?', missingClasses.length ? 'NO' : 'YES',
      missingClasses.length
        ? 'Gap flag raised for: ' + missingClasses.map(function (g) { return CLASS_LABELS[g.cls]; }).join(', ') + '.'
        : 'Every class has at least one usable source.');

    var toolkit = tools.filter(function (t) { return issueMatch(t, scope); }).map(function (t) {
      return { source: t, tags: { cost: t.cost, access: t.access, affiliation: t.affiliation, platform: t.platform, languages: t.languages } };
    });

    log('OUT', 'Filtered side panel', 'READY', 'Grouped by class, gap flags pinned. The analyst reads and decides.');

    return {
      stopped: false,
      scope: scope,
      trace: trace,
      candidates: candidates,
      byClass: byClass,
      coverage: coverage,
      possiblyRelevant: possiblyRelevant,
      skipped: skipped,
      languageGaps: languageGaps,
      gapFlags: gapFlags,
      // Handed to the C1 cross-gate once Algorithm 2 (historical matcher) exists
      gapCategories: unique([].concat.apply([], gapFlags.map(function (g) { return g.categories.map(function (c) { return c.category; }); }))),
      events: events,
      toolkit: toolkit
    };
  }

  var api = {
    CLASSES: CLASSES, CLASS_LABELS: CLASS_LABELS, WINDOW_DAYS: WINDOW_DAYS,
    scopeCheck: scopeCheck, deriveScope: deriveScope, geoMatch: geoMatch, run: run
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SourceGatherer = api;
})(typeof window !== 'undefined' ? window : globalThis);
