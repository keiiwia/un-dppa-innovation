// Node map in plain SVG, no library. It works like a whiteboard: a node stays exactly where the analyst puts it.
// Drag a node to move it. Drag from one of its small dots to another node to connect the two.
// Drag the background to pan; scroll to pan, pinch or Ctrl/Cmd+scroll to zoom. The canvas has no edges.
// Connections and their labels come from app state; this file only draws and reports gestures.
(function (root) {
  var NS = 'http://www.w3.org/2000/svg';
  // Each node is a shape with a label plate under it. BOX_H is the height of the pair; GAP is the clear space kept between two nodes.
  var R = 11, PLATE_H = 20, PLATE_Y = 18, BOX_H = R + PLATE_Y + PLATE_H, GAP = 10, TOP = 52, BOTTOM = 14, PORT = 13;

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }

  // Node shape per source class. Circle (traditional) returns null; the rest are regular polygons.
  var SHAPES = { local: [4, 45], regional: [4, 0], un: [6, 0], academic: [3, -90], satellite: [3, 90], ground: [5, -90] };
  function shapePoints(key, r) {
    var def = SHAPES[key];
    if (!def) return null;
    var sides = def[0], off = def[1] * Math.PI / 180;
    // Fewer sides look smaller at the same radius, so scale up a little
    var rr = r * (sides === 3 ? 1.35 : sides === 4 ? 1.2 : 1.1);
    var pts = [];
    for (var i = 0; i < sides; i++) {
      var a = off + i / sides * Math.PI * 2;
      pts.push((Math.cos(a) * rr).toFixed(1) + ',' + (Math.sin(a) * rr).toFixed(1));
    }
    return pts.join(' ');
  }

  function create(svg, opts) {
    var nodes = [], edges = [], byId = {}, W = 800, H = 500;
    var drag = null;   // moving a node
    var link = null;   // drawing a connection out of a node
    var defs = el('defs', {}, svg);
    // refX pulls the arrowhead back from the line's end so its tip sits at the node's edge, not under it
    var marker = el('marker', { id: 'map-arrow', markerUnits: 'userSpaceOnUse', markerWidth: 10, markerHeight: 10, refX: 25, refY: 5, orient: 'auto' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 Z', class: 'edge-arrow' }, marker);
    // Everything drawn sits in `world`, which is moved and scaled as the analyst pans and zooms
    var world = el('g', {}, svg);
    var edgeLayer = el('g', {}, world), nodeLayer = el('g', {}, world);
    var draft = el('line', { class: 'edge edge-draft', visibility: 'hidden' }, world);
    var cam = { k: 1, x: 0, y: 0 }, pan = null, ZOOM_MIN = 0.3, ZOOM_MAX = 2.5;
    if (opts.view) { cam.k = opts.view.k || 1; cam.x = opts.view.x || 0; cam.y = opts.view.y || 0; }
    function applyCam(quiet) {
      world.setAttribute('transform', 'translate(' + cam.x + ' ' + cam.y + ') scale(' + cam.k + ')');
      // The dot grid behind the map moves and scales with it
      var box = svg.parentNode;
      if (box && box.style) { box.style.backgroundPosition = cam.x + 'px ' + cam.y + 'px'; box.style.backgroundSize = 18 * cam.k + 'px ' + 18 * cam.k + 'px'; }
      if (!quiet && opts.onView) opts.onView({ k: cam.k, x: cam.x, y: cam.y });
    }
    // Zooms about a point on screen (map pixels), so what is under the pointer stays under it
    function zoomAt(k, sx, sy) {
      k = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, k));
      cam.x = sx - (sx - cam.x) * (k / cam.k);
      cam.y = sy - (sy - cam.y) * (k / cam.k);
      cam.k = k;
      applyCam();
    }
    function fit() {
      if (!nodes.length) { cam.k = 1; cam.x = 0; cam.y = 0; return applyCam(); }
      var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      nodes.forEach(function (n) {
        x0 = Math.min(x0, n.x - n.bw / 2); x1 = Math.max(x1, n.x + n.bw / 2);
        y0 = Math.min(y0, n.y - R - 14); y1 = Math.max(y1, n.y + PLATE_Y + PLATE_H);
      });
      var padX = 40, padTop = TOP + 10, padBottom = 64;
      var k = Math.min(1, (W - 2 * padX) / Math.max(1, x1 - x0), (H - padTop - padBottom) / Math.max(1, y1 - y0));
      cam.k = Math.max(ZOOM_MIN, k);
      cam.x = (W - (x0 + x1) * cam.k) / 2;
      cam.y = padTop + (H - padTop - padBottom - (y0 + y1) * cam.k) / 2 + 0;
      cam.y = (padTop + (H - padBottom)) / 2 - (y0 + y1) / 2 * cam.k;
      applyCam();
    }

    function measure() {
      var r = svg.getBoundingClientRect();
      W = Math.max(280, r.width); H = Math.max(240, r.height);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    }
    // The canvas has no edges, so a node may sit anywhere
    function clampX(n, x) { return x; }
    function clampY(y) { return y; }
    function overlapsAt(n, x, y) {
      return nodes.some(function (o) {
        return o !== n && o.placed && Math.abs(o.x - x) < (o.bw + n.bw) / 2 + GAP && Math.abs(o.y - y) < BOX_H + GAP;
      });
    }
    // Moves only this node, to the nearest free spot around where it was put. Nothing else on the map shifts.
    function settle(n) {
      var x0 = clampX(n, n.x), y0 = clampY(n.y);
      n.x = x0; n.y = y0;
      if (!overlapsAt(n, x0, y0)) return;
      for (var r = 12; r < 1400; r += 12) {
        var steps = Math.max(10, Math.round(r / 5));
        for (var k = 0; k < steps; k++) {
          var a = k / steps * Math.PI * 2;
          // Nodes are wider than tall, so search along a flattened ring
          var x = clampX(n, x0 + Math.cos(a) * r * 1.5), y = clampY(y0 + Math.sin(a) * r);
          if (!overlapsAt(n, x, y)) { n.x = x; n.y = y; return; }
        }
      }
    }
    // Where the analyst left the node. A narrower map (the source panel opening) may squeeze it in for a while;
    // it goes back here when the room returns, and this is the position that gets saved.
    function home(n) { n.hx = n.x; n.hy = n.y; }

    function paint() {
      nodes.forEach(function (n) { n.g.setAttribute('transform', 'translate(' + n.x + ' ' + n.y + ')'); });
      edges.forEach(function (e) {
        var a = byId[e.a], b = byId[e.b];
        if (!a || !b) return;
        e.line.setAttribute('x1', a.x); e.line.setAttribute('y1', a.y);
        e.line.setAttribute('x2', b.x); e.line.setAttribute('y2', b.y);
        e.tag.setAttribute('transform', 'translate(' + (a.x + b.x) / 2 + ' ' + (a.y + b.y) / 2 + ')');
      });
    }
    // True when the wanted spot only failed because it is off the edge of a narrowed map, not because of another node
    function overlapsNone(n, at) { return !overlapsAt(n, at.x, at.y); }
    function saved() {
      if (opts.onSettle) opts.onSettle(nodes.map(function (n) { return { id: n.id, x: n.hx, y: n.hy }; }));
    }
    function point(evt) {
      var r = svg.getBoundingClientRect();
      return { x: ((evt.clientX - r.left) - cam.x) / cam.k, y: ((evt.clientY - r.top) - cam.y) / cam.k };
    }
    function screenPoint(evt) { var r = svg.getBoundingClientRect(); return { x: evt.clientX - r.left, y: evt.clientY - r.top }; }

    // Panning: drag anywhere that is not a node or a label
    svg.addEventListener('pointerdown', function (evt) {
      if (evt.target !== svg || drag || link) return;
      var p = screenPoint(evt);
      pan = { sx: p.x, sy: p.y, cx: cam.x, cy: cam.y };
      svg.setPointerCapture(evt.pointerId);
      svg.classList.add('is-panning');
    });
    svg.addEventListener('pointermove', function (evt) {
      if (!pan) return;
      var p = screenPoint(evt);
      cam.x = pan.cx + p.x - pan.sx; cam.y = pan.cy + p.y - pan.sy;
      applyCam();
    });
    function endPan() { pan = null; svg.classList.remove('is-panning'); }
    svg.addEventListener('pointerup', endPan);
    svg.addEventListener('pointercancel', endPan);
    // Scroll pans. Pinch on a trackpad, or Ctrl/Cmd + scroll, zooms about the pointer.
    svg.addEventListener('wheel', function (evt) {
      evt.preventDefault();
      if (evt.ctrlKey || evt.metaKey) {
        var p = screenPoint(evt);
        zoomAt(cam.k * Math.exp(-evt.deltaY * 0.01), p.x, p.y);
      } else {
        cam.x -= evt.deltaX; cam.y -= evt.deltaY;
        applyCam();
      }
    }, { passive: false });
    function nodeAt(p, except) {
      for (var i = nodes.length - 1; i >= 0; i--) {
        var n = nodes[i];
        if (n !== except && Math.abs(p.x - n.x) <= n.bw / 2 + 8 && p.y >= n.y - R - 10 && p.y <= n.y + PLATE_Y + PLATE_H + 8) return n;
      }
      return null;
    }
    function setTarget(n) {
      if (link.over === n) return;
      if (link.over) link.over.g.classList.remove('is-target');
      link.over = n;
      if (n) n.g.classList.add('is-target');
    }

    function bindNode(n) {
      // Moving: the node follows the pointer and stays where it is dropped
      n.g.addEventListener('pointerdown', function (evt) {
        if (link) return;
        var p = point(evt);
        drag = { node: n, moved: false, sx: p.x, sy: p.y, ox: n.x - p.x, oy: n.y - p.y };
        n.g.setPointerCapture(evt.pointerId);
        evt.preventDefault();
      });
      n.g.addEventListener('pointermove', function (evt) {
        if (!drag || drag.node !== n) return;
        var p = point(evt);
        if (Math.abs(p.x - drag.sx) + Math.abs(p.y - drag.sy) > 4) drag.moved = true;
        if (!drag.moved) return;
        n.x = clampX(n, p.x + drag.ox); n.y = clampY(p.y + drag.oy);
        if (!drag.raised) {
          // On top while it moves. Re-inserting an element drops its pointer capture, so do it once and take the capture back.
          drag.raised = true;
          n.g.classList.add('is-dragging');
          if (nodeLayer.lastChild !== n.g) { nodeLayer.appendChild(n.g); try { n.g.setPointerCapture(evt.pointerId); } catch (err) { /* pointer already gone */ } }
        }
        paint();
      });
      function drop() {
        if (!drag || drag.node !== n) return;
        var moved = drag.moved;
        drag = null;
        n.g.classList.remove('is-dragging');
        if (!moved) return opts.onSelect(n.id);
        settle(n); // if it was dropped onto another node, it slips to the nearest free spot
        home(n);
        paint(); saved();
      }
      n.g.addEventListener('pointerup', drop);
      n.g.addEventListener('pointercancel', drop);
      n.g.addEventListener('keydown', function (evt) {
        if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); opts.onSelect(n.id); }
      });

      // Connecting: drag out of one of the node's dots and let go over another node
      n.ports.forEach(function (port) {
        port.addEventListener('pointerdown', function (evt) {
          evt.stopPropagation(); evt.preventDefault();
          link = { from: n, over: null };
          port.setPointerCapture(evt.pointerId);
          svg.classList.add('is-linking');
          n.g.classList.add('is-source');
          draft.setAttribute('x1', n.x); draft.setAttribute('y1', n.y);
          draft.setAttribute('x2', n.x); draft.setAttribute('y2', n.y);
          draft.setAttribute('visibility', 'visible');
        });
        port.addEventListener('pointermove', function (evt) {
          if (!link || link.from !== n) return;
          var p = point(evt);
          setTarget(nodeAt(p, n));
          // The line snaps to a node once the pointer is over it
          draft.setAttribute('x2', link.over ? link.over.x : p.x);
          draft.setAttribute('y2', link.over ? link.over.y : p.y);
        });
        function release() {
          if (!link || link.from !== n) return;
          var to = link.over;
          setTarget(null);
          link = null;
          svg.classList.remove('is-linking');
          n.g.classList.remove('is-source');
          draft.setAttribute('visibility', 'hidden');
          if (to && opts.onConnect) opts.onConnect(n.id, to.id);
        }
        port.addEventListener('pointerup', release);
        port.addEventListener('pointercancel', release);
      });
    }

    function update(nextNodes, nextEdges, state) {
      measure();
      var keep = {}, fresh = [];
      nextNodes.forEach(function (d) {
        keep[d.id] = true;
        var n = byId[d.id];
        if (!n) {
          n = { id: d.id, x: d.position ? d.position.x : (W / 2 - cam.x) / cam.k, y: d.position ? d.position.y : (H / 2 - cam.y) / cam.k, placed: false, bw: 2 * R + 8 };
          n.g = el('g', { class: 'node', tabindex: '0', role: 'button' }, nodeLayer);
          n.halo = el('circle', { r: R + 9, class: 'node-hit' }, n.g);
          var pts = shapePoints(d.shape, R);
          n.dot = pts ? el('polygon', { points: pts, class: 'node-dot' }, n.g) : el('circle', { r: R, class: 'node-dot' }, n.g);
          n.plate = el('rect', { y: PLATE_Y, height: PLATE_H, class: 'node-plate' }, n.g);
          n.text = el('text', { y: PLATE_Y + PLATE_H / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'node-label' }, n.g);
          // Connection dots: left, right and above the shape
          n.ports = [[-R - PORT, 0], [R + PORT, 0], [0, -R - PORT]].map(function (at) {
            var port = el('g', { class: 'node-port', transform: 'translate(' + at[0] + ' ' + at[1] + ')' }, n.g);
            el('circle', { r: 10, class: 'node-port-hit' }, port);
            el('circle', { r: 4.5, class: 'node-port-dot' }, port);
            el('title', {}, port).textContent = 'Drag to another source to connect';
            return port;
          });
          byId[d.id] = n;
          nodes.push(n);
          fresh.push(n);
          bindNode(n);
        }
        if (n.text.textContent !== d.label) {
          n.text.textContent = d.label;
          // The plate hugs the label; its width is also the node's width when keeping nodes apart
          var tw = 0;
          try { tw = n.text.getComputedTextLength(); } catch (err) { /* not laid out yet */ }
          n.bw = Math.max(2 * R + 8, Math.ceil(tw || d.label.length * 6.6) + 16);
          n.plate.setAttribute('x', -n.bw / 2);
          n.plate.setAttribute('width', n.bw);
        }
        n.dot.style.fill = d.color;
        // Teammates' notes on this source: a small numbered square at the shape's upper right
        if (n.badge) { n.g.removeChild(n.badge); n.badge = null; }
        if (d.badge) {
          n.badge = el('g', { class: 'node-badge' + (d.badgeNew ? '' : ' is-seen'), transform: 'translate(' + (R - 2) + ' ' + (-R - 12) + ')' }, n.g);
          el('rect', { width: 16, height: 16 }, n.badge);
          el('text', { x: 8, y: 8.5, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, n.badge).textContent = d.badge;
        }
        n.g.setAttribute('aria-label', d.title + ', ' + d.category + (d.badge ? ', ' + d.badge + ' team notes' : ''));
        n.g.setAttribute('class', 'node' + (d.id === state.selected ? ' is-selected' : '') + (state.picking ? ' is-picking' : ''));
      });
      nodes = nodes.filter(function (n) {
        if (keep[n.id]) return true;
        nodeLayer.removeChild(n.g); delete byId[n.id];
        return false;
      });
      // Only nodes new to the map are positioned; everything already placed stays put
      fresh.forEach(function (n) {
        var want = { x: n.x, y: n.y };
        settle(n); n.placed = true;
        // Keep the saved spot as home even if the map is too narrow to show it there right now
        n.hx = Math.abs(n.x - want.x) > 0 && overlapsNone(n, want) ? want.x : n.x; n.hy = n.hx === want.x ? want.y : n.y;
      });

      edgeLayer.textContent = '';
      edges = nextEdges.map(function (e) {
        var c = { id: e.id, a: e.a, b: e.b };
        c.line = el('line', { class: 'edge' + (e.dashed ? ' edge-dashed' : '') + (e.team ? ' edge-team' : '') }, edgeLayer);
        if (e.color) c.line.style.stroke = e.color;
        if (e.dir) c.line.setAttribute('marker-end', 'url(#map-arrow)');
        el('title', {}, c.line).textContent = e.label;
        return c;
      });
      // Labels go above every line, and open the connection's menu when clicked
      edges.forEach(function (c, i) {
        var e = nextEdges[i];
        c.tag = el('g', { class: 'edge-tag' + (e.id === state.editing ? ' is-editing' : '') + (e.team ? ' is-team' : ''), tabindex: '0', role: 'button', 'aria-label': 'Connection: ' + e.label + '. Change or remove.' }, edgeLayer);
        var text = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central' }, c.tag);
        text.textContent = e.rel;
        var w = 0;
        try { w = text.getComputedTextLength(); } catch (err) { /* not laid out yet */ }
        w = Math.ceil(w || e.rel.length * 6.4) + 12;
        c.tag.insertBefore(el('rect', { x: -w / 2, y: -9, width: w, height: 18 }), text);
        var open = function (evt) { evt.stopPropagation(); if (opts.onEdge) opts.onEdge(c.id); };
        c.tag.addEventListener('click', open);
        c.tag.addEventListener('keydown', function (evt) { if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); open(evt); } });
      });
      paint();
      if (fresh.length) saved();
    }

    // Midpoint of a connection in the map's own pixels, for placing its menu
    function edgePoint(id) {
      var e = edges.filter(function (x) { return x.id === id; })[0], a = e && byId[e.a], b = e && byId[e.b];
      return a && b ? { x: (a.x + b.x) / 2 * cam.k + cam.x, y: (a.y + b.y) / 2 * cam.k + cam.y } : null;
    }

    if (root.ResizeObserver) {
      // The map can change size (the source panel opening); nodes stay where they are and can be panned to
      new ResizeObserver(function () {
        measure();
      }).observe(svg);
    }
    applyCam(true);
    return {
      update: update, edgePoint: edgePoint, fit: fit,
      zoomBy: function (factor) { zoomAt(cam.k * factor, W / 2, H / 2); },
      zoomTo: function (k) { zoomAt(k, W / 2, H / 2); },
      zoom: function () { return cam.k; }
    };
  }

  root.NodeMap = { create: create, shapePoints: shapePoints };
})(window);
