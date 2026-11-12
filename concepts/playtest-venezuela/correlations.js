// Screen 5 · correlation map. One dot per source; the analyst chooses how the dots are arranged.
// Views: Map (default, zoomable, demo locations), Scatter (X/Y picker, beeswarm), Groups (packed blobs).
// Every arrangement uses facts recorded about each source, or the analyst's own labels. Nothing is scored.
(function () {
  var R = 7, DUR = 750;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COUNTRIES_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
  var countries = null, mapFailed = false, mapLoading = false, cityCountry = {};

  function create(host, opts) {
    var svg = d3.select(host).append('svg').attr('class', 'corr-svg').attr('role', 'group')
      .attr('aria-label', 'Sources arranged by the chosen view');
    var bg = svg.append('g').attr('class', 'corr-bg');
    var linkG = svg.append('g').attr('class', 'corr-links');
    var dotG = svg.append('g').attr('class', 'corr-dots');
    var tip = d3.select(host).append('div').attr('class', 'corr-tip').attr('hidden', true);
    var spec = null, pos = {}, selected = null, timers = [], frame = 0;
    var zoomT = d3.zoomIdentity, mapCtx = null, lastMode = null;
    var zoom = d3.zoom().scaleExtent([1, 12]).on('zoom', function (ev) {
      zoomT = ev.transform;
      if (mapCtx && spec.mode === 'map') { hideTip(); applyZoom(); }
    });
    var zoomBar = d3.select(host).append('div').attr('class', 'corr-zoom').attr('hidden', true);
    [['+', 'Zoom in', function () { svg.transition().duration(300).call(zoom.scaleBy, 1.8); }],
     ['−', 'Zoom out', function () { svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.8); }],
     ['Reset', 'Reset zoom', function () { svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity); }]
    ].forEach(function (b) { zoomBar.append('button').attr('type', 'button').attr('aria-label', b[1]).text(b[0]).on('click', b[2]); });

    var ro = new ResizeObserver(function () {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () { if (spec) draw(false); });
    });
    ro.observe(host);

    function size() { return { W: Math.max(320, host.clientWidth), H: Math.max(320, host.clientHeight) }; }

    // ---------- layouts: each returns target {x, y, r} per item id and draws its own background ----------
    function layoutAxes(W, H) {
      var items = spec.items, xF = spec.x, yF = spec.y;
      var ml = 170, mr = 20, mt = 28, mb = 64;
      var yOrder = spec.order(yF.key);
      var y = d3.scaleBand().domain(yOrder).range([mt, H - mb]).paddingInner(0.08);
      var target = {}, x, bands = null;

      if (xF.key === 'date') {
        var bandW = Math.max(72, Math.min(110, W * 0.1)), gap = 14;
        var right = W - mr - 2 * bandW - 2 * gap;
        x = d3.scaleUtc().domain([utc(spec.window.from), utc(spec.window.to, 1)]).range([ml, right]);
        bands = { out: right + gap + bandW / 2, unknown: right + 2 * gap + bandW * 1.5, w: bandW };
        items.forEach(function (d) {
          var tx = d.status === 'in' ? x(utc(d.date, 0.5)) : d.status === 'out' ? bands.out : bands.unknown;
          target[d.id] = { x: tx, y: y(d.values[yF.key]) + y.bandwidth() / 2 };
        });
      } else {
        x = d3.scaleBand().domain(spec.order(xF.key)).range([ml, W - mr]).paddingInner(0.06);
        items.forEach(function (d) {
          target[d.id] = { x: x(d.values[xF.key]) + x.bandwidth() / 2, y: y(d.values[yF.key]) + y.bandwidth() / 2 };
        });
      }
      settle(target, 0.9, function (d) {
        // keep each dot inside its row
        var top = y(d.values[yF.key]) + R, bottom = top + y.bandwidth() - 2 * R;
        d.y = Math.max(top, Math.min(bottom, d.y));
        d.x = Math.max(ml + R, Math.min(W - mr - R, d.x));
      });

      // background
      var g = fresh();
      var counts = countBy(items, function (d) { return d.values[yF.key]; });
      var rows = g.append('g').attr('class', 'grid');
      yOrder.forEach(function (v, i) {
        var top = y(v);
        if (i % 2 === 0) rows.append('rect').attr('class', 'band').attr('x', ml - 8).attr('y', top).attr('width', W - mr - ml + 8).attr('height', y.bandwidth());
        var t = rows.append('text').attr('x', ml - 14).attr('y', top + y.bandwidth() / 2).attr('dy', '0.35em').attr('text-anchor', 'end');
        t.append('tspan').attr('class', counts[v] ? 'lbl-strong' : 'lbl-empty').text(clip(v, 22));
        t.append('tspan').attr('class', 'lbl-count').text('  ' + (counts[v] || 0));
      });
      g.append('text').attr('class', 'axis-title').attr('x', ml - 14).attr('y', 16).attr('text-anchor', 'end').text(yF.label + ' ↓');

      var axisY = H - mb + 6;
      if (xF.key === 'date') {
        var ax = g.append('g').attr('class', 'x-axis').attr('transform', 'translate(0,' + axisY + ')')
          .call(d3.axisBottom(x).ticks(d3.utcDay.every(Math.max(1, Math.ceil(52 / (x(utc(spec.window.from, 1)) - x(utc(spec.window.from)))))))
            .tickFormat(d3.utcFormat('%b %-d')).tickSizeOuter(0));
        ax.select('.domain').attr('class', 'domain');
        [['out', 'Outside your dates'], ['unknown', 'Date not confirmed']].forEach(function (b) {
          var cx = bands[b[0]], n = items.filter(function (d) { return d.status === b[0]; }).length;
          g.insert('rect', ':first-child').attr('class', 'side-band').attr('x', cx - bands.w / 2).attr('y', mt).attr('width', bands.w).attr('height', H - mb - mt);
          wrap(g.append('text').attr('x', cx).attr('y', axisY + 16).attr('text-anchor', 'middle'), b[1] + ' · ' + n, bands.w);
        });
      } else {
        var xc = countBy(items, function (d) { return d.values[xF.key]; });
        spec.order(xF.key).forEach(function (v) {
          var t = g.append('text').attr('x', x(v) + x.bandwidth() / 2).attr('y', axisY + 14).attr('text-anchor', 'middle')
            .attr('class', xc[v] ? 'lbl-strong' : 'lbl-empty');
          wrap(t, v + ' · ' + (xc[v] || 0), Math.max(60, x.bandwidth() - 6));
        });
      }
      g.append('text').attr('class', 'axis-title').attr('x', (ml + W - mr) / 2).attr('y', H - 8).attr('text-anchor', 'middle').text(xF.label + ' →');
      return target;
    }

    function layoutGroups(W, H) {
      var key = spec.group.key, order = spec.order(key);
      var groups = order.map(function (v) {
        var members = spec.items.filter(function (d) { return d.values[key] === v; })
          .map(function (d) { return { id: d.id, r: R + 1.2 }; });
        if (members.length) d3.packSiblings(members);
        var enc = members.length ? d3.packEnclose(members) : { x: 0, y: 0, r: 20 };
        members.forEach(function (m) { m.x -= enc.x; m.y -= enc.y; });
        return { value: v, members: members, inner: enc.r + 10, r: enc.r + 10 + 26 };
      });
      d3.packSiblings(groups);
      var x0 = d3.min(groups, function (g) { return g.x - g.r; }), x1 = d3.max(groups, function (g) { return g.x + g.r; });
      var y0 = d3.min(groups, function (g) { return g.y - g.r; }), y1 = d3.max(groups, function (g) { return g.y + g.r; });
      var k = Math.min((W - 40) / (x1 - x0), (H - 40) / (y1 - y0), 2.2);
      var ox = W / 2 - k * (x0 + x1) / 2, oy = H / 2 - k * (y0 + y1) / 2;

      var target = {};
      var g = fresh();
      groups.forEach(function (gr) {
        var cx = ox + k * gr.x, cy = oy + k * gr.y;
        g.append('circle').attr('class', gr.members.length ? 'group-ring' : 'group-ring empty').attr('cx', cx).attr('cy', cy).attr('r', k * gr.inner);
        var t = g.append('text').attr('x', cx).attr('y', cy - k * gr.inner - 8).attr('text-anchor', 'middle')
          .attr('class', gr.members.length ? 'lbl-strong' : 'lbl-empty');
        t.append('tspan').text(clip(gr.value, 26));
        t.append('tspan').attr('class', 'lbl-count').text('  ' + gr.members.length);
        gr.members.forEach(function (m) {
          target[m.id] = { x: cx + k * m.x, y: cy + k * m.y, r: Math.max(3, k * (m.r - 1.2)) };
        });
      });
      return target;
    }

    // Map: zoom with scroll/pinch or the buttons; dots keep their size and spread apart as you zoom in
    function layoutMap(W, H) {
      var g = fresh();
      var proj = d3.geoNaturalEarth1().fitExtent([[16, 34], [W - 16, H - 70]], { type: 'Sphere' });
      var path = d3.geoPath(proj);
      zoom.extent([[0, 0], [W, H]]).translateExtent([[0, 0], [W, H]]);
      var zg = g.append('g').attr('class', 'map-zoom').attr('transform', zoomT);
      zg.append('path').attr('class', 'sphere').attr('d', path({ type: 'Sphere' }));
      zg.append('path').attr('class', 'graticule').attr('d', path(d3.geoGraticule10()));
      if (countries) {
        var counts = countryCounts();
        zg.selectAll('path.country').data(countries.features).join('path').attr('class', 'country').attr('d', path)
          .on('mouseenter', function (ev, f) { d3.select(this).classed('hover', true).raise(); countryTip(ev, f, counts); })
          .on('mousemove', function (ev, f) { countryTip(ev, f, counts); })
          .on('mouseleave', function () { d3.select(this).classed('hover', false); hideTip(); });
      } else if (mapFailed) {
        g.append('text').attr('x', W / 2).attr('y', H / 2).attr('text-anchor', 'middle').text('Map outline could not load (offline?). Dots are still placed by location.');
      } else loadCountries();

      // places from "Where" on screen 1; nearby ones share a ring and a label
      var marks = [];
      (spec.scope || []).forEach(function (p) {
        var c = proj([p.lon, p.lat]);
        var near = marks.filter(function (m) { return Math.hypot(m.p[0] - c[0], m.p[1] - c[1]) < 40; })[0];
        if (near) near.names.push(p.name); else marks.push({ p: c, names: [p.name] });
      });
      var marksG = g.append('g');
      marks.forEach(function (m) {
        m.ring = marksG.append('circle').attr('class', 'scope-ring').attr('r', 26);
        m.label = marksG.append('text').attr('class', 'scope-lbl').text('In your scope: ' + m.names.join(', '));
      });

      var pileX = 28, pileY = H - 30, placed = [], pile = {}, unplaced = 0;
      spec.items.forEach(function (d) {
        if (d.place) placed.push({ id: d.id, p: proj([d.place.lon, d.place.lat]) });
        else { pile[d.id] = { x: pileX + 14 + (unplaced % 14) * 15, y: pileY - Math.floor(unplaced / 14) * 15 }; unplaced++; }
      });
      var pileTop = pileY - 16 - Math.floor(Math.max(0, unplaced - 1) / 14) * 15;
      g.append('rect').attr('class', 'pile-bg').attr('x', pileX - 10).attr('y', pileTop - 18)
        .attr('width', Math.max(200, Math.min(unplaced, 14) * 15 + 30)).attr('height', pileY - pileTop + 30).attr('rx', 6);
      g.append('text').attr('class', 'lbl-strong').attr('x', pileX).attr('y', pileTop).text('Location not recorded · ' + unplaced);
      g.append('text').attr('class', 'demo-note').attr('x', 16).attr('y', 20)
        .text(W < 620 ? 'Demo locations, not verified. Pinch or use + − to zoom.'
          : 'Demo locations: each outlet’s home city, filled in by hand. Not verified. Scroll or use + − to zoom.');
      mapCtx = { zg: zg, marks: marks, placed: placed, pile: pile };
      return mapTargets();
    }
    function mapTargets() {
      var target = {};
      mapCtx.placed.forEach(function (d) { var q = zoomT.apply(d.p); target[d.id] = { x: q[0], y: q[1] }; });
      Object.keys(mapCtx.pile).forEach(function (id) { target[id] = mapCtx.pile[id]; });
      settle(target, 0.7, null, 90);
      mapCtx.marks.forEach(function (m) {
        var q = zoomT.apply(m.p);
        m.ring.attr('cx', q[0]).attr('cy', q[1]);
        m.label.attr('x', q[0] + 30).attr('y', q[1] + 4);
      });
      return target;
    }
    function applyZoom() {
      mapCtx.zg.attr('transform', zoomT);
      pos = mapTargets();
      dotG.selectAll('circle.dot').interrupt().attr('cx', function (d) { return pos[d.id].x; }).attr('cy', function (d) { return pos[d.id].y; });
      linkG.selectAll('line').interrupt()
        .attr('x1', function (l) { return pos[l.a].x; }).attr('y1', function (l) { return pos[l.a].y; })
        .attr('x2', function (l) { return pos[l.b].x; }).attr('y2', function (l) { return pos[l.b].y; });
    }
    // how many of the analyst's sources are based in each country (a count, nothing more)
    function countryCounts() {
      var counts = {};
      spec.items.forEach(function (d) {
        if (!d.place) return;
        var key = d.place.name;
        if (!(key in cityCountry)) {
          var f = countries.features.filter(function (c) { return d3.geoContains(c, [d.place.lon, d.place.lat]); })[0];
          cityCountry[key] = f ? f.properties.name : null;
        }
        var name = cityCountry[key];
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
      return counts;
    }
    function countryTip(ev, f, counts) {
      var n = counts[f.properties.name] || 0, at = d3.pointer(ev, host);
      tip.attr('hidden', null).html('<strong>' + esc(f.properties.name) + '</strong><br><span>' +
        (n ? n + ' of your sources based here' : 'None of your sources based here') + '</span>');
      tip.style('left', Math.min(at[0] + 14, host.clientWidth - tip.node().offsetWidth - 6) + 'px').style('top', Math.max(4, at[1] - 10) + 'px');
    }
    function loadCountries() {
      if (mapLoading) return;
      mapLoading = true;
      d3.json(COUNTRIES_URL).then(function (topo) {
        countries = topojson.feature(topo, topo.objects.countries);
        if (spec && spec.mode === 'map') draw(false);
      }).catch(function () { mapFailed = true; if (spec && spec.mode === 'map') draw(false); });
    }

    // Nudge dots apart around their targets so none overlap (a beeswarm)
    function settle(target, strength, clamp, ticks) {
      // small fixed offsets (not random) so the same view always lands the same way
      var nodes = Object.keys(target).map(function (id, i) {
        var t = target[id], d = spec.byId[id];
        return { id: id, tx: t.x, ty: t.y, x: t.x + Math.cos(i * 2.4) * 0.8, y: t.y + Math.sin(i * 2.4) * 0.8, values: d.values };
      });
      var sim = d3.forceSimulation(nodes)
        .force('x', d3.forceX(function (n) { return n.tx; }).strength(strength))
        .force('y', d3.forceY(function (n) { return n.ty; }).strength(strength))
        .force('c', d3.forceCollide(R + 1.4))
        .stop();
      for (var i = 0; i < (ticks || 160); i++) { sim.tick(); if (clamp) nodes.forEach(clamp); }
      nodes.forEach(function (n) { target[n.id] = { x: n.x, y: n.y }; });
    }

    function fresh() {
      bg.selectAll('*').interrupt().remove();
      return bg.append('g').attr('class', 'layer');
    }

    // ---------- drawing ----------
    function draw(animate) {
      var s = size();
      svg.attr('viewBox', '0 0 ' + s.W + ' ' + s.H);
      if (spec.mode === 'map') {
        if (lastMode !== 'map') zoomT = d3.zoomIdentity;
        svg.call(zoom); svg.node().__zoom = zoomT;
      } else { svg.on('.zoom', null); mapCtx = null; }
      svg.classed('zoomable', spec.mode === 'map');
      zoomBar.attr('hidden', spec.mode === 'map' ? null : true);
      lastMode = spec.mode;
      var target = spec.mode === 'groups' ? layoutGroups(s.W, s.H) : spec.mode === 'map' ? layoutMap(s.W, s.H) : layoutAxes(s.W, s.H);
      var dur = animate && !reduce ? DUR : 0;
      if (dur) bg.select('.layer').style('opacity', 0).transition().duration(400).style('opacity', 1);
      pos = target;

      var dots = dotG.selectAll('circle.dot').data(spec.items, function (d) { return d.id; });
      if (dur) dots.exit().transition().duration(dur).attr('r', 0).remove();
      else dots.exit().interrupt().remove();
      var enter = dots.enter().append('circle').attr('class', 'dot')
        .attr('tabindex', 0).attr('role', 'button')
        .attr('cx', function (d) { return target[d.id].x; }).attr('cy', function (d) { return target[d.id].y; }).attr('r', 0)
        .on('click', function (ev, d) { opts.onSelect(d.id); })
        .on('keydown', function (ev, d) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); opts.onSelect(d.id); } })
        .on('mouseenter focus', function (ev, d) { showTip(d, this); })
        .on('mouseleave blur', hideTip);
      enter.merge(dots)
        .attr('aria-label', function (d) { return d.title + ', ' + d.sub; })
        .classed('sel', function (d) { return d.id === selected; })
        .style('fill', function (d) { return d.color; })
        .transition().duration(dur).ease(d3.easeCubicInOut)
        .attr('cx', function (d) { return target[d.id].x; })
        .attr('cy', function (d) { return target[d.id].y; })
        .attr('r', function (d) { return target[d.id].r || R; });

      var links = linkG.selectAll('line').data(spec.links.filter(function (l) { return target[l.a] && target[l.b]; }), function (l) { return l.a + '|' + l.b; });
      links.exit().remove();
      links.enter().append('line').attr('class', function (l) { return 'link' + (l.dashed ? ' dashed' : ''); })
        .attr('x1', function (l) { return target[l.a].x; }).attr('y1', function (l) { return target[l.a].y; })
        .attr('x2', function (l) { return target[l.b].x; }).attr('y2', function (l) { return target[l.b].y; })
        .append('title').text(function (l) { return l.label; });
      links.transition().duration(dur).ease(d3.easeCubicInOut)
        .attr('x1', function (l) { return target[l.a].x; }).attr('y1', function (l) { return target[l.a].y; })
        .attr('x2', function (l) { return target[l.b].x; }).attr('y2', function (l) { return target[l.b].y; });
    }

    function showTip(d, el) {
      var hb = host.getBoundingClientRect(), b = el.getBoundingClientRect();
      tip.attr('hidden', null).html('<strong>' + esc(d.title) + '</strong><br><span>' + esc(d.sub) + '</span>');
      var tw = tip.node().offsetWidth, left = b.left - hb.left + 14, top = b.top - hb.top - 8;
      if (left + tw > hb.width - 8) left = b.left - hb.left - tw - 6;
      tip.style('left', Math.max(4, left) + 'px').style('top', Math.max(4, top) + 'px');
    }
    function hideTip() { tip.attr('hidden', true); }

    // ---------- replay: dots appear in the order they were published ----------
    function play(onStep, onEnd) {
      stop(true);
      var order = spec.items.slice().sort(function (a, b) {
        var ra = rank(a), rb = rank(b);
        return ra !== rb ? ra - rb : String(a.date).localeCompare(String(b.date));
      });
      var all = dotG.selectAll('circle.dot');
      all.interrupt().attr('r', 0);
      linkG.style('opacity', 0);
      var step = reduce ? 0 : Math.max(140, Math.min(320, 6000 / order.length));
      order.forEach(function (d, i) {
        timers.push(setTimeout(function () {
          all.filter(function (x) { return x.id === d.id; })
            .transition().duration(reduce ? 0 : 260).attr('r', (pos[d.id] && pos[d.id].r) || R);
          onStep(d, i + 1, order.length);
          if (i === order.length - 1) timers.push(setTimeout(function () { linkG.style('opacity', null); timers = []; onEnd(); }, 300));
        }, i * step));
      });
    }
    function rank(d) { return d.status === 'in' ? 0 : d.status === 'out' ? 1 : 2; }
    function stop(silent) {
      timers.forEach(clearTimeout);
      var was = timers.length > 0; timers = [];
      linkG.style('opacity', null);
      dotG.selectAll('circle.dot').interrupt().attr('r', function (d) { return (pos[d.id] && pos[d.id].r) || R; });
      return was && !silent;
    }

    return {
      update: function (next, animate) { stop(true); spec = next; draw(animate !== false); },
      focus: function (id) {
        var el = dotG.selectAll('circle.dot').filter(function (d) { return d.id === id; }).node();
        if (el) el.focus({ preventScroll: true });
      },
      highlight: function (id) { selected = id; dotG.selectAll('circle.dot').classed('sel', function (d) { return d.id === id; }); },
      play: play,
      stop: stop,
      playing: function () { return timers.length > 0; },
      destroy: function () { stop(true); ro.disconnect(); cancelAnimationFrame(frame); svg.on('.zoom', null); svg.remove(); tip.remove(); zoomBar.remove(); }
    };
  }

  // ---------- helpers ----------
  function utc(iso, dayFraction) {
    var p = iso.split('-');
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]) + (dayFraction || 0) * 864e5);
  }
  function countBy(items, f) { var m = {}; items.forEach(function (d) { var k = f(d); m[k] = (m[k] || 0) + 1; }); return m; }
  function clip(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Wrap an SVG label onto a few lines so long category names fit their column
  function wrap(text, str, width) {
    var words = String(str).split(/\s+/), line = [], lines = 0, x = text.attr('x');
    var tspan = text.append('tspan').attr('x', x).attr('dy', 0);
    words.forEach(function (w) {
      line.push(w); tspan.text(line.join(' '));
      if (tspan.node().getComputedTextLength() > width && line.length > 1 && lines < 2) {
        line.pop(); tspan.text(line.join(' ')); line = [w]; lines++;
        tspan = text.append('tspan').attr('x', x).attr('dy', '1.15em').text(w);
      }
    });
  }

  window.CorrMap = { create: create };
})();
