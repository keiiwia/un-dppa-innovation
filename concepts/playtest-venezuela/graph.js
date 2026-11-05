// Small force-directed node map (Obsidian style) in plain SVG, no library.
// The analyst drags nodes, clicks to select, and connections come from app state.
(function (root) {
  var NS = 'http://www.w3.org/2000/svg';
  var REPULSE = 5200, SPRING_LENGTH = 130, SPRING = 0.035, GRAVITY = 0.012, DAMPING = 0.82, PAD = 34;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }

  function create(svg, opts) {
    var nodes = [], edges = [], byId = {}, selected = null, picking = false;
    var alpha = 0, raf = null, W = 800, H = 500, drag = null;
    var edgeLayer = el('g', {}, svg), nodeLayer = el('g', {}, svg);

    function measure() {
      var r = svg.getBoundingClientRect();
      W = Math.max(280, r.width); H = Math.max(240, r.height);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    }

    function tick() {
      var i, j, a, b, dx, dy, d2, d, f;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy || 1;
          f = REPULSE / d2 * alpha; d = Math.sqrt(d2);
          a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
        }
        a.vx += (W / 2 - a.x) * GRAVITY * alpha;
        a.vy += (H / 2 - a.y) * GRAVITY * alpha;
      }
      edges.forEach(function (e) {
        a = byId[e.a]; b = byId[e.b];
        if (!a || !b) return;
        dx = b.x - a.x; dy = b.y - a.y; d = Math.sqrt(dx * dx + dy * dy) || 1;
        f = (d - SPRING_LENGTH) * SPRING * alpha;
        a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
      });
      nodes.forEach(function (n) {
        if (drag && drag.node === n) { n.vx = n.vy = 0; return; }
        n.vx *= DAMPING; n.vy *= DAMPING;
        n.x = Math.min(W - PAD, Math.max(PAD, n.x + n.vx));
        n.y = Math.min(H - PAD, Math.max(PAD, n.y + n.vy));
      });
      alpha *= 0.985;
    }

    function paint() {
      nodes.forEach(function (n) { n.g.setAttribute('transform', 'translate(' + n.x + ' ' + n.y + ')'); });
      edges.forEach(function (e) {
        var a = byId[e.a], b = byId[e.b];
        if (!a || !b || !e.line) return;
        e.line.setAttribute('x1', a.x); e.line.setAttribute('y1', a.y);
        e.line.setAttribute('x2', b.x); e.line.setAttribute('y2', b.y);
      });
    }

    function run(energy) {
      alpha = Math.max(alpha, energy);
      if (reduced) {
        for (var i = 0; i < 300; i++) tick();
        alpha = 0; paint(); settled();
        return;
      }
      if (raf) return;
      (function loop() {
        tick(); paint();
        if (alpha > 0.02 || drag) raf = requestAnimationFrame(loop);
        else { raf = null; settled(); }
      })();
    }

    function settled() {
      if (opts.onSettle) opts.onSettle(nodes.map(function (n) { return { id: n.id, x: n.x, y: n.y }; }));
    }

    function point(evt) {
      var r = svg.getBoundingClientRect();
      return { x: (evt.clientX - r.left) * (W / r.width), y: (evt.clientY - r.top) * (H / r.height) };
    }

    function bindNode(n) {
      n.g.addEventListener('pointerdown', function (evt) {
        var p = point(evt);
        drag = { node: n, moved: false, sx: p.x, sy: p.y };
        n.g.setPointerCapture(evt.pointerId);
        evt.preventDefault();
      });
      n.g.addEventListener('pointermove', function (evt) {
        if (!drag || drag.node !== n) return;
        var p = point(evt);
        if (Math.abs(p.x - drag.sx) + Math.abs(p.y - drag.sy) > 4) drag.moved = true;
        if (!drag.moved) return;
        n.x = Math.min(W - PAD, Math.max(PAD, p.x));
        n.y = Math.min(H - PAD, Math.max(PAD, p.y));
        if (reduced) paint(); else run(0.12);
      });
      n.g.addEventListener('pointerup', function () {
        var moved = drag && drag.moved;
        drag = null;
        if (!moved) opts.onSelect(n.id);
        else if (reduced) settled();
      });
      n.g.addEventListener('keydown', function (evt) {
        if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); opts.onSelect(n.id); }
      });
    }

    // Nodes keep their position across updates so the analyst's layout doesn't jump
    function update(nextNodes, nextEdges, state) {
      measure();
      selected = state.selected; picking = state.picking;
      var keep = {};
      nextNodes.forEach(function (d, i) {
        keep[d.id] = true;
        var n = byId[d.id];
        if (!n) {
          var angle = i / Math.max(1, nextNodes.length) * Math.PI * 2;
          var saved = d.position;
          n = { id: d.id, vx: 0, vy: 0,
            x: saved ? saved.x : W / 2 + Math.cos(angle) * Math.min(W, H) * 0.3,
            y: saved ? saved.y : H / 2 + Math.sin(angle) * Math.min(W, H) * 0.3 };
          n.g = el('g', { class: 'node', tabindex: '0', role: 'button' }, nodeLayer);
          n.halo = el('circle', { r: 20, class: 'node-hit' }, n.g);
          n.dot = el('circle', { r: 9, class: 'node-dot' }, n.g);
          n.text = el('text', { y: 24, 'text-anchor': 'middle', class: 'node-label' }, n.g);
          byId[d.id] = n;
          nodes.push(n);
          bindNode(n);
        }
        n.text.textContent = d.label;
        n.dot.style.fill = d.color;
        n.g.setAttribute('aria-label', d.title + ', ' + d.category);
        n.g.setAttribute('class', 'node' + (d.id === selected ? ' is-selected' : '') + (picking ? ' is-picking' : ''));
      });
      nodes = nodes.filter(function (n) {
        if (keep[n.id]) return true;
        nodeLayer.removeChild(n.g); delete byId[n.id];
        return false;
      });

      edgeLayer.textContent = '';
      edges = nextEdges.map(function (e) {
        var c = { a: e.a, b: e.b };
        c.line = el('line', { class: 'edge' + (e.dashed ? ' edge-dashed' : '') }, edgeLayer);
        el('title', {}, c.line).textContent = e.label;
        return c;
      });
      paint();
      run(state.energy == null ? 0.5 : state.energy);
    }

    if (root.ResizeObserver) {
      new ResizeObserver(function () { measure(); run(0.15); }).observe(svg);
    }
    return { update: update };
  }

  root.NodeMap = { create: create };
})(window);
