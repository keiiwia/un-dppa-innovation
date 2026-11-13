// Mock web scraper for the playtest. Pure functions over data/catalog.js, no DOM and no network.
// A real scraper would replace search() and expand(); the shape of what they return can stay.
//
// It never scores credibility. signals() reports facts about a source, and expand() deliberately adds
// sources from classes the analyst did not pick, so a first selection can't narrow the whole view.
(function (root) {
  var CLASS_LABELS = {
    traditional: 'Traditional media', local: 'Local media', regional: 'Regional media', un: 'UN / institutional',
    academic: 'Academic / research', satellite: 'Satellite / OSINT', ground: 'Ground comms'
  };
  var CLASSES = Object.keys(CLASS_LABELS);
  var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  var WIDEN_PER_CLASS = 2;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fold(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function allTerms(q) { return [].concat(q.who || [], q.what || [], q.where || []); }

  function inScope(q, scenario) {
    var words = fold(allTerms(q).join(' '));
    return scenario.keywords.some(function (k) { return words.indexOf(fold(k)) >= 0; });
  }

  // reads "Jan 3 – Jan 16, 2026" or  "January 3-16" or "1/3 to 1/16"
  function parseWindow(tokens, scenario) {
    var text = fold((tokens || []).join(' '));
    var year = (text.match(/\b(20\d\d)\b/) || [])[1] || scenario.from.slice(0, 4);
    var dates = [], m;
    var named = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{1,2})(?:\s*(?:-|–|—|to)\s*(\d{1,2})\b(?!\s*\/))?/g;
    while ((m = named.exec(text))) {
      dates.push(year + '-' + pad(MONTHS[m[1]]) + '-' + pad(+m[2]));
      if (m[3]) dates.push(year + '-' + pad(MONTHS[m[1]]) + '-' + pad(+m[3]));
    }
    if (!dates.length) {
      var numeric = /\b(\d{1,2})\/(\d{1,2})\b/g;
      while ((m = numeric.exec(text))) dates.push(year + '-' + pad(+m[1]) + '-' + pad(+m[2]));
    }
    if (!dates.length) return { from: scenario.from, to: scenario.to, parsed: false };
    dates.sort();
    return { from: dates[0], to: dates[dates.length - 1], parsed: true };
  }

  function windowStatus(entry, w) {
    if (entry.dateBefore) return 'out';
    if (!entry.published) return 'unknown';
    return entry.published >= w.from && entry.published <= w.to ? 'in' : 'out';
  }

  function haystack(e) {
    return fold([e.title, e.publisher, e.summary, (e.topics || []).join(' ')]
      .concat((e.claims || []).map(function (c) { return c.by + ' ' + c.text; })).join(' '));
  }

  // Words from what the analyst typed that this entry mentions. Short filler words are ignored.
  function matchedTerms(e, q) {
    var hay = haystack(e);
    return allTerms(q).filter(function (t) {
      return fold(t).split(/\s+/).some(function (w) { return w.length > 2 && hay.indexOf(w) >= 0; });
    });
  }

  // First screen -> second screen: the starter list the analyst picks from
  function search(q, catalog, scenario) {
    var w = parseWindow(q.when, scenario);
    var rows = catalog.filter(function (e) { return e.seed; }).map(function (e) {
      return { entry: e, status: windowStatus(e, w), matched: matchedTerms(e, q) };
    });
    function order(a, b) {
      return b.matched.length - a.matched.length ||
        (a.entry.published || '9').localeCompare(b.entry.published || '9') ||
        a.entry.title.localeCompare(b.entry.title);
    }
    return {
      window: w,
      inWindow: rows.filter(function (r) { return r.status !== 'out'; }).sort(order),
      outside: rows.filter(function (r) { return r.status === 'out'; }).sort(order)
    };
  }

  function signals(e, w) {
    var out = [];
    if (e.read === 'direct') out.push({ label: 'Text read', detail: 'The page was opened and read for this summary.' });
    else if (e.read === 'analyst') out.push({ label: 'Added by you', detail: 'You added this link. It has not been read by the tool.' });
    else if (e.read === 'search') out.push({ label: 'Search text only', detail: 'The page would not open. This summary uses search-result text.', warn: true });
    else out.push({ label: 'Not read', detail: 'The content could not be read. Only the link or title is known.', warn: true });
    out.push({ label: e.origin, detail: 'How this source knows what it says.' });
    if (e.who === 'pseudonymous') out.push({ label: 'Pseudonymous sources', detail: 'People quoted are not identified by real name, at their request.' });
    else if (e.who === 'named') out.push({ label: 'Named sources', detail: 'People or bodies quoted are named.' });
    if (e.factcheck) out.push({ label: e.factcheck, detail: 'A published fact-check finding, not this tool\'s judgement.', warn: true });
    if (w) {
      var s = windowStatus(e, w);
      if (s === 'unknown') out.push({ label: 'Date not confirmed', detail: e.dateNote || 'No publication date found.', warn: true });
      if (s === 'out') out.push({ label: 'Outside your dates', detail: e.dateNote || 'Published outside the dates you set.', warn: true });
    }
    return out;
  }

  // Whose voices a source carries: its own (for official statements) plus every quoted speaker's.
  // Returns distinct VOICES keys in first-seen order. Speakers missing from the table count as 'unknown'.
  function voices(e, speakers) {
    var out = [];
    function add(v) { if (v && out.indexOf(v) < 0) out.push(v); }
    add(e.voice);
    (e.claims || []).forEach(function (c) { add((speakers[c.by] || { voice: 'unknown' }).voice); });
    return out;
  }

  // per selection/entry
  function profile(entries) {
    function tally(get) {
      var counts = {};
      entries.forEach(function (e) { [].concat(get(e)).forEach(function (v) { if (v) counts[v] = (counts[v] || 0) + 1; }); });
      return counts;
    }
    return {
      classes: tally(function (e) { return e.cls; }),
      topics: tally(function (e) { return e.topics || []; }),
      origins: tally(function (e) { return e.origin; })
    };
  }

  // selection -> dashboard
  function expand(picks, q, catalog, links, scenario) {
    var w = parseWindow(q.when, scenario);
    var pickIds = picks.map(function (e) { return e.id; });
    var prof = profile(picks);
    var related = [], rest = [];

    catalog.forEach(function (e) {
      if (pickIds.indexOf(e.id) >= 0 || windowStatus(e, w) === 'out') return;
      var shared = (e.topics || []).filter(function (t) { return prof.topics[t]; });
      var linked = links.filter(function (l) {
        return (l.a === e.id && pickIds.indexOf(l.b) >= 0) || (l.b === e.id && pickIds.indexOf(l.a) >= 0);
      });
      if (shared.length || linked.length) {
        var why = linked.length ? linked[0].why : 'Shares a topic with your picks: ' + shared.join(', ') + '.';
        related.push({ entry: e, group: 'related', why: why, weight: linked.length * 3 + shared.length }); 
      } else {
        rest.push(e);
      }
    });
    related.sort(function (a, b) { return b.weight - a.weight || a.entry.title.localeCompare(b.entry.title); }); //unpicked classes are added on purpose

    // classes missing from the picks get their closest sources anyway
    var widened = [];
    var missing = CLASSES.filter(function (c) { return !prof.classes[c]; });
    missing.forEach(function (cls) {
      related.filter(function (r) { return r.entry.cls === cls; }).slice(0, WIDEN_PER_CLASS).forEach(function (r) {
        r.group = 'widened';
        r.why = 'Added because none of your picks are ' + CLASS_LABELS[cls].toLowerCase() + '. ' + r.why;
      });
      rest.filter(function (e) { return e.cls === cls; }).slice(0, WIDEN_PER_CLASS).forEach(function (e) {
        widened.push({ entry: e, group: 'widened', why: 'Added because none of your picks are ' + CLASS_LABELS[cls].toLowerCase() + '.', weight: 0 });
      });
    });

    var gathered = related.concat(widened);
    var topics = Object.keys(prof.topics);
    return {
      window: w,
      gathered: gathered,
      skipped: catalog.length - pickIds.length - gathered.length,
      missingClasses: missing,
      steps: [
        { label: 'Reading your ' + picks.length + ' selected source' + (picks.length === 1 ? '' : 's'), result: topics.length ? 'Topics: ' + topics.join(', ') : 'No topics could be read from these' },
        { label: 'Searching news, research, UN and open-source records', result: catalog.length + ' records in the playtest catalog' },
        { label: 'Comparing dates against ' + w.from + ' to ' + w.to, result: catalog.filter(function (e) { return windowStatus(e, w) === 'out'; }).length + ' set aside as outside your dates' },
        { label: 'Checking all 7 source classes', result: missing.length ? 'Also adding: ' + missing.map(function (c) { return CLASS_LABELS[c]; }).join(', ') : 'Your picks already touch every class' },
        { label: 'Tagging how each source was read', result: gathered.length + ' sources gathered' }
      ]
    };
  }

  // The missing data points for the sources now in front of the analyst
  function gaps(entries, scenario) {
    var out = [];
    CLASSES.forEach(function (cls) {
      var list = entries.filter(function (e) { return e.cls === cls; });
      var read = list.filter(function (e) { return e.read === 'direct'; });
      if (!list.length) out.push({ title: CLASS_LABELS[cls], evidence: 'No source in this class has been gathered.' });
      else if (!read.length) out.push({ title: CLASS_LABELS[cls], evidence: list.length + ' source(s) gathered, none could be read directly.' });
    });
    return out.concat(scenario.knownGaps);
  }

  var api = {
    CLASSES: CLASSES, CLASS_LABELS: CLASS_LABELS,
    inScope: inScope, parseWindow: parseWindow, windowStatus: windowStatus,
    search: search, signals: signals, voices: voices, profile: profile, expand: expand, gaps: gaps
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MockScraper = api;
})(typeof window !== 'undefined' ? window : globalThis);
