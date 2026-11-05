// Runs the mock scenarios through Algorithm 1 and checks each gate. `node test.js`
// Pass --verbose to print the full trace and side panel for each scenario.
require('./data/geo.js');
require('./data/phonebook.js');
var SG = require('./algorithm.js');
var assert = require('assert');

var today = new Date('2026-11-03T00:00:00Z');
var verbose = process.argv.indexOf('--verbose') >= 0;
var failed = 0;

function scenario(name, input, overrides, check) {
  var r = SG.run(input, { today: today, overrides: overrides });
  try {
    check(r);
    console.log('ok   ' + name);
  } catch (e) {
    failed++;
    console.log('FAIL ' + name + '\n     ' + e.message);
  }
  if (verbose && !r.stopped) print(r);
}

function print(r) {
  r.trace.forEach(function (t) { console.log('  ' + t.gate + ' ' + t.label + ' -> ' + t.outcome + '\n     ' + t.detail); });
  r.gapFlags.forEach(function (g) {
    console.log('  GAP ' + g.title);
    g.categories.forEach(function (c) { console.log('      [' + c.category + '] ' + c.evidence.join(' ')); });
  });
  SG.CLASSES.forEach(function (cls) {
    console.log('  ' + SG.CLASS_LABELS[cls] + ' (' + r.coverage[cls].observed + '/' + r.coverage[cls].listed + ')');
    r.byClass[cls].forEach(function (c) { console.log('      ' + c.source.name + ' · ' + c.why.join('; ') + (c.counted ? '' : ' · NOT COUNTED')); });
  });
  console.log('');
}

function gap(r, cls) { return r.gapFlags.filter(function (g) { return g.kind === 'class' && g.cls === cls; })[0]; }
function langGap(r, code) { return r.gapFlags.filter(function (g) { return g.kind === 'language' && g.language.code === code; })[0]; }
function names(list) { return list.map(function (c) { return c.source.id; }); }

// G0 · nothing starts without all three fields
scenario('G0 stops when region is missing', { country: 'CM', issue: 'armed-conflict' }, null, function (r) {
  assert.ok(r.stopped);
  assert.deepStrictEqual(r.missing, ['region']);
});

// Mock problem 1 · active conflict in a decentralised region
scenario('Cameroon / Northwest / armed conflict', { country: 'CM', region: 'NW', issue: 'armed-conflict' }, null, function (r) {
  assert.strictEqual(r.scope.issueClass, 'conflict');
  assert.strictEqual(r.scope.windowDays, 365);
  assert.ok(r.scope.borders.indexOf('NG') >= 0, 'Nigeria derived as bordering state');
  // A2: Lamnso' has no source; Cameroonian Pidgin only has a related-language (Nigerian Pidgin) source
  assert.ok(langGap(r, 'nso'), "Lamnso' gap");
  assert.ok(langGap(r, 'wes'), 'Cameroonian Pidgin gap');
  assert.ok(langGap(r, 'wes').categories[0].evidence.join(' ').indexOf('BBC News Pidgin') >= 0, 'related source surfaced');
  // A3: region-level source ranks above country-level, bordering state Nigeria included
  var local = names(r.byClass.local);
  assert.ok(local.indexOf('premiumtimes') >= 0, 'bordering-state outlet included');
  assert.ok(local.indexOf('mmi') < local.indexOf('camtribune'), 'region-specific source sorts first');
  // A4/A5: mock throttling blocks every ground-comms source -> access blocked gap
  var g = gap(r, 'ground');
  assert.ok(g, 'ground comms gap raised');
  assert.deepStrictEqual(g.categories.map(function (c) { return c.category; }), ['access blocked', 'language/indexing']);
  // The 2017 shutdown ended before the window, so it is not context
  assert.ok(r.byClass.ground[0].contextEvents.length === 0);
  // Reduced-capacity outlet is listed but not counted
  var gp = r.byClass.local.filter(function (c) { return c.source.id === 'guardianpost'; })[0];
  assert.ok(gp && !gp.counted);
  assert.ok(!gap(r, 'satellite') && !gap(r, 'un') && !gap(r, 'academic'));
});

// Mock problem 2 · protest
scenario('Kenya / Nairobi / protest', { country: 'KE', region: 'NBI', issue: 'protest' }, null, function (r) {
  assert.strictEqual(r.scope.issueClass, 'protest');
  assert.strictEqual(r.scope.windowDays, 30);
  assert.strictEqual(r.gapFlags.filter(function (g) { return g.kind === 'class'; }).length, 0, 'all 7 classes covered');
  assert.ok(langGap(r, 'sheng'), 'Sheng is not indexed anywhere');
  // UCDP is conflict-only: possibly relevant, not a candidate
  assert.ok(r.possiblyRelevant.some(function (p) { return p.source.id === 'ucdp'; }));
  assert.ok(names(r.candidates).indexOf('acled') >= 0, 'ACLED covers protests');
  // The June 2024 disruption is outside a 30-day window
  assert.strictEqual(r.byClass.ground[0].contextEvents.length, 0);
});

scenario('Kenya / Nairobi / protest, analyst widens window to 3 years', { country: 'KE', region: 'NBI', issue: 'protest' }, { windowDays: 1095 }, function (r) {
  assert.deepStrictEqual(r.scope.overridden, ['windowDays']);
  // Past event becomes context on ground sources but does not block them
  var x = r.byClass.ground.filter(function (c) { return c.source.id === 'x'; })[0];
  assert.strictEqual(x.contextEvents.length, 1);
  assert.ok(x.counted);
  assert.ok(x.searchLink.indexOf('since%3A2023-') >= 0 || x.searchLink.indexOf('since%3A2023') >= 0);
});

scenario('Sudan / West Darfur / armed conflict', { country: 'SD', region: 'WD', issue: 'armed-conflict' }, null, function (r) {
  assert.ok(langGap(r, 'mls') && langGap(r, 'fvr'));
  assert.ok(gap(r, 'ground'), 'telecom outage empties ground comms');
  assert.ok(r.gapCategories.indexOf('access blocked') >= 0);
  var d24 = r.byClass.local.filter(function (c) { return c.source.id === 'darfur24'; })[0];
  assert.ok(d24 && d24.reduced);
});

scenario('Country-wide scope does not let a regional outage block the whole country', { country: 'CM', region: 'all', issue: 'armed-conflict' }, null, function (r) {
  assert.ok(!gap(r, 'ground'));
  assert.ok(r.byClass.ground[0].contextEvents.length >= 1, 'regional outage shown as context');
});

scenario('Analyst overrides languages', { country: 'CM', region: 'NW', issue: 'armed-conflict' }, { languages: ['en', 'fr'] }, function (r) {
  assert.strictEqual(r.languageGaps.length, 0);
});

console.log(failed ? '\n' + failed + ' failed' : '\nall passed');
process.exit(failed ? 1 : 0);
