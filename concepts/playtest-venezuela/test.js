//`node test.js`
require('./data/catalog.js');
var S = require('./scraper.js');
var assert = require('assert');
var CATALOG = globalThis.CATALOG, LINKS = globalThis.CATALOG_LINKS, SC = globalThis.SCENARIO;
var failed = 0;
function test(name, fn) {
  try { fn(); console.log('ok   ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + e.message); }
}
function byId(id) { return CATALOG.filter(function (e) { return e.id === id; })[0]; }
var Q = { who: ['Donald Trump', 'Nicolás Maduro'], what: ['Kidnapping'], when: ['Jan 3 – Jan 16, 2026'], where: ['Venezuela'] };

test('catalog ids are unique and links point at real entries', function () {
  var ids = CATALOG.map(function (e) { return e.id; });
  assert.strictEqual(new Set(ids).size, ids.length);
  LINKS.forEach(function (l) { assert.ok(byId(l.a) && byId(l.b), l.a + ' -> ' + l.b); });
});
test('every team link is in the catalog', function () {
  assert.strictEqual(CATALOG.filter(function (e) { return e.added === 'team'; }).length, 14);
});
test('unread entries carry no claims', function () {
  CATALOG.filter(function (e) { return e.read === 'none'; }).forEach(function (e) { assert.strictEqual(e.claims.length, 0, e.id); });
});
test('all 7 classes exist in the catalog', function () {
  S.CLASSES.forEach(function (c) { assert.ok(CATALOG.some(function (e) { return e.cls === c; }), c); });
});
test('scope gate accepts the scenario and refuses others', function () {
  assert.ok(S.inScope(Q, SC));
  assert.ok(S.inScope({ who: ['nicolas maduro'], what: [], where: [] }, SC), 'accent-insensitive');
  assert.ok(!S.inScope({ who: ['Vladimir Putin'], what: ['invasion'], where: ['Ukraine'] }, SC));
});
test('date parsing', function () {
  assert.deepStrictEqual(S.parseWindow(['Jan 3 – Jan 16, 2026'], SC), { from: '2026-01-03', to: '2026-01-16', parsed: true });
  assert.deepStrictEqual(S.parseWindow(['January 3-16'], SC), { from: '2026-01-03', to: '2026-01-16', parsed: true });
  assert.deepStrictEqual(S.parseWindow(['1/5 to 1/8'], SC), { from: '2026-01-05', to: '2026-01-08', parsed: true });
  assert.strictEqual(S.parseWindow(['last winter'], SC).parsed, false);
});
test('search separates dates: out-of-window posts are held back, undated stay visible', function () {
  var r = S.search(Q, CATALOG, SC);
  var out = r.outside.map(function (x) { return x.entry.id; });
  assert.ok(out.indexOf('ig-trump-spanish') >= 0 && out.indexOf('ig-oct') >= 0 && out.indexOf('state-crisis') >= 0);
  assert.ok(r.inWindow.some(function (x) { return x.entry.id === 'bbc-video' && x.status === 'unknown'; }));
  assert.ok(r.inWindow.length >= 15 && r.inWindow.length <= 30, 'starter list is ' + r.inWindow.length);
});
test('narrower dates shrink the list', function () {
  var r = S.search({ who: Q.who, what: Q.what, where: Q.where, when: ['Jan 3 - Jan 4'] }, CATALOG, SC);
  assert.ok(r.outside.some(function (x) { return x.entry.id === 'bellingcat'; }));
});
test('expand widens into classes the picks do not touch', function () {
  var r = S.expand([byId('cambridge')], Q, CATALOG, LINKS, SC);
  assert.ok(r.missingClasses.indexOf('local') >= 0);
  var widened = r.gathered.filter(function (g) { return g.group === 'widened'; });
  assert.ok(widened.some(function (g) { return g.entry.cls === 'local'; }));
  assert.ok(widened.some(function (g) { return g.entry.cls === 'satellite'; }));
  assert.ok(!r.gathered.some(function (g) { return g.entry.id === 'cambridge'; }), 'picks are not repeated');
  assert.ok(!r.gathered.some(function (g) { return g.entry.id === 'ig-oct'; }), 'out-of-window posts are not gathered');
});
test('expand follows a documented link even without a shared topic', function () {
  var r = S.expand([byId('fox-100')], Q, CATALOG, LINKS, SC);
  var m = r.gathered.filter(function (g) { return g.entry.id === 'razon-cabello'; })[0];
  assert.ok(m && /Cabello/.test(m.why));
});
test('signals never give a score and flag unread sources', function () {
  var w = S.parseWindow(Q.when, SC);
  var labels = S.signals(byId('bbc-video'), w).map(function (s) { return s.label; });
  assert.ok(labels.indexOf('Not read') >= 0 && labels.indexOf('Date not confirmed') >= 0);
  S.signals(byId('pbs-ap'), w).forEach(function (s) { assert.ok(!/\d+%|score|credible/i.test(s.label)); });
});
test('gaps list empty classes and known gaps', function () {
  var g = S.gaps([byId('pbs-ap')], SC).map(function (x) { return x.title; });
  assert.ok(g.indexOf('Local media') >= 0 && g.indexOf('Court documents') >= 0);
  assert.ok(g.indexOf('Traditional media') < 0);
});

console.log(failed ? '\n' + failed + ' failed' : '\nall passed');
process.exit(failed ? 1 : 0);
