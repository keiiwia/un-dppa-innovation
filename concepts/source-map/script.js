/* Source Map: a collapsible tree in the style of OSINT Framework.
   The first level is the analyst's path (the funnel); branches and items hang off each stage.
   Parents open and close on click. Items, stages and the root open a detail panel. */
(() => {
  const DATA = window.SOURCE_MAP;
  const CHECK = window.LINK_CHECK || { date: null, results: {} };

  const FROM = {
    kelly: "Kelly's UN visit notes",
    ethan: "Ethan's UN visit notes",
    meeting: "10/27 meeting notes",
    concept: "Quiet or Unheard? README",
    added: "Added in this draft, to review",
  };
  const FROM_GROUP = { kelly: "visit", ethan: "visit", meeting: "meeting", concept: "concept", added: "added" };
  const COST = { free: "Free", freemium: "Freemium", paid: "Paid" };
  const ACCESS = { open: "Open", registration: "Registration", un: "UN or partner only" };
  const TYPE = { tool: "Tool", source: "Source", practice: "Practice", case: "Case study", input: "Required input" };
  const FILTERS = [
    { key: "cost", label: "Cost", options: COST },
    { key: "access", label: "Access", options: ACCESS },
    { key: "from", label: "From", options: { visit: "UN visit notes", meeting: "Meeting notes", concept: "Concept README", added: "Added in draft" } },
  ];

  const SEP = " › ";
  const ROW = 26;
  const COLS = [0, 300, 250, 230];               // distance from the previous column, by depth
  const colX = depth => COLS.slice(0, depth + 1).reduce((a, b) => a + b, 0);
  const DUR = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 280;
  const narrow = () => innerWidth < 700;   // panel becomes a bottom sheet
  const wide = () => innerWidth >= 1100;   // room for the panel beside the tree, so stages open it too

  // Stable keys, inherited stage numbers and parent links, set once on the source data.
  const byKey = new Map();
  (function prep(n, parent) {
    n._key = parent ? parent._key + SEP + n.name : n.name;
    n._stage = n.stage || (parent ? parent._stage : 0);
    n._parent = parent;
    byKey.set(n._key, n);
    (n.children || []).forEach(c => prep(c, n));
  })(DATA, null);

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const leaves = n => (n.children ? n.children.flatMap(leaves) : [n]);
  const parentsOf = n => (n.children ? [n, ...n.children.flatMap(parentsOf)] : []);
  const stageTitle = s => (s.stage <= 5 ? `${s.stage} · ${s.name}` : s.name);
  const dot = stage => `<span class="dot" style="--c: var(--s${stage})"></span>`;
  const fmtDate = s => (s ? new Date(s + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

  function wrap(text, max) {
    const lines = [""];
    for (const w of text.split(" ")) {
      const cur = lines[lines.length - 1];
      if (cur && (cur + " " + w).length > max) lines.push(w);
      else lines[lines.length - 1] = cur ? cur + " " + w : w;
    }
    return lines;
  }
  function tags(n) {
    if (n.type === "case") return n.status || "";
    if (n.type === "input") return "required";
    return [n.cost === "freemium" && "F", n.cost === "paid" && "P", n.access === "registration" && "R", n.access === "un" && "UN"]
      .filter(Boolean).join(" ");
  }

  /* ---------- Search and filters ---------- */

  const state = {
    q: "",
    cost: new Set(Object.keys(COST)),
    access: new Set(Object.keys(ACCESS)),
    from: new Set(Object.keys(FILTERS[2].options)),
  };
  const filtersOn = () => FILTERS.filter(f => state[f.key].size < Object.keys(f.options).length).length;
  const isFiltering = () => !!state.q || filtersOn() > 0;

  function passes(n, nameHit) {
    // Cases and required inputs have no cost or access to filter on.
    if (n.cost && (!state.cost.has(n.cost) || !state.access.has(n.access))) return false;
    if (!state.from.has(FROM_GROUP[n.from])) return false;
    if (!state.q || nameHit) return true;
    return [n.name, n.what, n.silence, n.limits, n.went, n.revealed].join(" ").toLowerCase().includes(state.q);
  }
  // A filtered copy of the tree: items that pass, and the branches and stages that still hold any.
  // Searching for a stage or branch name keeps everything inside it.
  function filterTree(n, nameHit = false) {
    const hit = nameHit || (!!state.q && n !== DATA && n.name.toLowerCase().includes(state.q));
    if (!n.children) return passes(n, hit) ? n : null;
    const kids = n.children.map(c => filterTree(c, hit)).filter(Boolean);
    return kids.length || n === DATA ? { ...n, children: kids } : null;
  }

  /* ---------- Tree ---------- */

  const svg = d3.select("#tree");
  const view = svg.append("g");
  const linkLayer = view.append("g");
  const nodeLayer = view.append("g");
  // Plain interpolation: the camera glides sideways instead of zooming out and back in on long moves.
  const zoom = d3.zoom().scaleExtent([0.35, 2]).interpolate(d3.interpolate).on("zoom", e => view.attr("transform", e.transform));
  svg.call(zoom).on("dblclick.zoom", null);

  // Stages carry a two-line question under their name, so they sit further apart.
  const layout = d3.tree().nodeSize([ROW, 1]).separation((a, b) =>
    a.depth === 1 && b.depth === 1 ? 2.7 : a.parent === b.parent ? 1 : 1.6);
  const diag = d3.linkHorizontal().x(p => p.y).y(p => p.x);

  let expanded = new Set([DATA._key]);
  let saved = null;          // what was open before a search or filter took over
  let pos = new Map();       // key -> last position, so nodes grow out of and fold into their parent
  let current = null;        // the last laid-out hierarchy
  let selected = null;       // key of the item shown in the panel
  let touched = false;       // has the viewer moved the view or opened anything yet
  let trailKey = null;       // the parent opened most recently, shown in the trail

  function render(anchorKey) {
    const shown = isFiltering() ? filterTree(DATA) : DATA;
    const root = d3.hierarchy(shown, n => (n.children && expanded.has(n._key) ? n.children : null));
    layout(root);
    root.each(d => { d.y = colX(d.depth); });
    const nodes = root.descendants();
    const next = new Map(nodes.map(d => [d.data._key, { x: d.x, y: d.y }]));
    const old = pos;
    const grownFrom = d => {
      for (let p = d.parent; p; p = p.parent) if (old.has(p.data._key)) return old.get(p.data._key);
      return d;
    };
    const foldInto = key => {
      let k = key;
      while (k.includes(SEP)) {
        k = k.slice(0, k.lastIndexOf(SEP));
        if (next.has(k)) return next.get(k);
      }
      return next.get(DATA._key);
    };

    const link = linkLayer.selectAll("path").data(root.links(), l => l.target.data._key);
    link.enter().append("path")
        .attr("class", "link")
        .attr("d", l => { const p = grownFrom(l.target); return diag({ source: p, target: p }); })
      .merge(link)
        .style("--c", l => `var(--s${l.target.data._stage})`)
      .transition().duration(DUR)
        .attr("d", diag);
    link.exit().transition().duration(DUR)
      .attr("d", l => { const p = foldInto(l.target.data._key); return diag({ source: p, target: p }); })
      .remove();

    const node = nodeLayer.selectAll("g.node").data(nodes, d => d.data._key);
    const enter = node.enter().append("g")
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("transform", d => { const p = grownFrom(d); return `translate(${p.y},${p.x})`; })
      .style("opacity", 0)
      .on("click", (e, d) => activate(d))
      .on("keydown", (e, d) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(d); } })
      .on("focus", (e, d) => ensureVisible(d));
    enter.append("circle");
    enter.each(function (d) { drawLabel(d3.select(this), d); });

    const merged = enter.merge(node)
      .attr("class", nodeClass)
      .style("--c", d => `var(--s${d.data._stage})`)
      .style("--f", d => (d.data.illustrates ? `var(--s${d.data.illustrates})` : null))
      .attr("aria-expanded", d => (d.data.children ? String(!!d.children) : null))
      .attr("aria-label", ariaLabel);
    merged.select("circle").attr("r", d => [7, 6.5, 5.5][d.depth] || 4.5);
    merged.transition().duration(DUR)
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .style("opacity", 1);
    node.exit().transition().duration(DUR)
      .attr("transform", d => { const p = foldInto(d.data._key); return `translate(${p.y},${p.x})`; })
      .style("opacity", 0)
      .remove();

    current = root;
    pos = next;
    document.getElementById("empty").hidden = !(isFiltering() && !shown.children.length);
    updateTrail();
    if (anchorKey) keepInView(anchorKey, old);
  }

  const trail = document.getElementById("trail");
  function updateTrail() {
    const n = trailKey && !isFiltering() ? byKey.get(trailKey) : null;
    trail.hidden = !n;
    if (!n) return;
    const path = [];
    for (let p = n; p._parent; p = p._parent) path.unshift(p._parent._parent ? p.name : stageTitle(p));
    trail.innerHTML = `<button class="back" aria-label="Back one level">‹</button>${dot(n._stage)}<span class="path">${esc(path.join(" › "))}</span>`;
  }
  trail.addEventListener("click", e => {
    if (!e.target.closest(".back")) return;
    const n = byKey.get(trailKey);
    parentsOf(n).forEach(p => expanded.delete(p._key));
    trailKey = n._parent._parent ? n._parent._key : null;
    render();
    trailKey ? frame(trailKey) : home(true);
    syncExpandBtn();
  });

  function nodeClass(d) {
    const n = d.data, c = ["node", "depth-" + d.depth];
    if (n.children) c.push(d.children ? "open" : "closed");
    if (n.type === "practice") c.push("practice");
    if (n.type === "case") c.push("case");
    if (n.type === "input") c.push("input");
    if (n.status === "to research") c.push("todo");
    if (n._key === selected) c.push("selected");
    return c.join(" ");
  }

  function ariaLabel(d) {
    const n = d.data;
    if (d.depth === 0) return `${n.name}: about this map`;
    if (d.depth === 1) return `${stageTitle(n)}. ${n.question}`;
    if (n.children) return n.name;
    if (n.type === "case") return `${n.name}, case study${n.status ? ", " + n.status : ""}`;
    if (n.type === "input") return `${n.name}, required input`;
    return `${n.name}, ${COST[n.cost]}, ${ACCESS[n.access]}`;
  }

  function drawLabel(g, d) {
    const n = d.data;
    const t = g.append("text").attr("class", "name");
    if (d.depth === 0) {
      t.attr("y", -16).attr("text-anchor", "middle").text(n.name);
      return;
    }
    const parent = !!n.children;
    t.attr("dy", "0.32em").attr("x", parent ? -12 : 10).attr("text-anchor", parent ? "end" : "start");
    if (d.depth === 1) {
      if (n.stage <= 5) t.append("tspan").attr("class", "num").text(n.stage + "  ");
      t.append("tspan").text(n.name);
      wrap(n.question, 38).forEach((line, i) =>
        g.append("text").attr("class", "question").attr("x", -12).attr("y", 20 + i * 15).attr("text-anchor", "end").text(line));
      return;
    }
    t.text(n.name);
    const tg = tags(n);
    if (tg) t.append("tspan").attr("class", "tags").text("  " + tg);
  }

  function activate(d) {
    const n = byKey.get(d.data._key);
    touched = true;
    if (d.depth === 0) { showPanel(n); clearOfPanel(n._key); return; }
    if (!n.children) { showPanel(n); clearOfPanel(n._key); return; }
    if (d.depth === 1 && wide()) showPanel(n);
    if (expanded.has(n._key)) {
      parentsOf(n).forEach(p => expanded.delete(p._key));   // reopen one level at a time
      trailKey = n._parent._parent ? n._parent._key : null;
    } else {
      expanded.add(n._key);
      trailKey = n._key;
    }
    render(n._key);
    syncExpandBtn();
  }

  /* ---------- Camera ---------- */

  const viewSize = () => {
    const { width, height } = svg.node().getBoundingClientRect();
    return { width: width - (panelOpen() && wide() ? panel.offsetWidth : 0), height };
  };

  // Keep the clicked node where it was, then nudge so what came out of it fits on screen.
  function keepInView(key, old) {
    const d = current.descendants().find(n => n.data._key === key);
    if (!d) return;
    const t = d3.zoomTransform(svg.node());
    const { width, height } = viewSize();
    const was = old.get(key) || d;
    let [sx, sy] = t.apply([was.y, was.x]);
    if (d.children) {
      const xs = d.descendants().map(n => n.x);
      const top = sy + t.k * (Math.min(...xs) - d.x) - 24;
      const bottom = sy + t.k * (Math.max(...xs) - d.x) + 44;
      if (bottom - top > height || top < 0) sy -= top;
      else if (bottom > height) sy -= bottom - height;
      sx = Math.min(sx, width - t.k * (COLS[d.depth + 1] + 220));
    }
    svg.transition().duration(DUR).call(zoom.transform, d3.zoomIdentity.translate(sx - t.k * d.y, sy - t.k * d.x).scale(t.k));
  }

  function clearOfPanel(key) {
    if (!wide()) return;
    const d = current.descendants().find(n => n.data._key === key);
    if (!d) return;
    const t = d3.zoomTransform(svg.node());
    const [sx] = t.apply([d.y, d.x]);
    const limit = viewSize().width - 230;
    if (sx > limit) svg.transition().duration(DUR).call(zoom.translateBy, (limit - sx) / t.k, 0);
  }

  function ensureVisible(d) {
    const t = d3.zoomTransform(svg.node());
    const [sx, sy] = t.apply([d.y, d.x]);
    const { width, height } = viewSize();
    if (sx > 40 && sx < width - 160 && sy > 30 && sy < height - 30) return;
    svg.transition().duration(DUR).call(zoom.translateTo, d.y + 100 / t.k, d.x);
  }

  const homeK = () => (narrow() ? 0.9 : 1);
  const homeX = () => (narrow() ? Math.max(84, svg.node().getBoundingClientRect().width - 28 - homeK() * COLS[1]) : 130);

  function home(animate) {
    const { height } = svg.node().getBoundingClientRect();
    const tr = d3.zoomIdentity.translate(homeX(), height / 2).scale(homeK());
    (animate ? svg.transition().duration(DUR) : svg).call(zoom.transform, tr);
  }

  // Put an open node where it would sit if you'd just walked to it from the start.
  function frame(key) {
    const d = current.descendants().find(n => n.data._key === key);
    if (!d) return;
    const t = d3.zoomTransform(svg.node());
    const { width, height } = viewSize();
    const xs = d.descendants().map(n => n.x);
    const sx = Math.min(homeX() + t.k * colX(d.depth), width - t.k * (COLS[d.depth + 1] + 220));
    const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
    svg.transition().duration(DUR).call(zoom.transform, d3.zoomIdentity.translate(sx - t.k * d.y, height / 2 - t.k * mid).scale(t.k));
  }

  function fit() {
    const nodes = current.descendants();
    const xs = nodes.map(d => d.x), ys = nodes.map(d => d.y);
    const { width, height } = viewSize();
    const left = Math.min(...ys) - 80, right = Math.max(...ys) + 240;
    const top = Math.min(...xs) - 30, bottom = Math.max(...xs) + 50;
    const k = Math.max(0.55, Math.min(1, width / (right - left), height / (bottom - top)));
    const tx = width > k * (right - left) ? (width - k * (right - left)) / 2 - k * left : 16 - k * left;
    const ty = height > k * (bottom - top) ? (height - k * (bottom - top)) / 2 - k * top : 12 - k * top;
    svg.transition().duration(DUR).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
  }

  /* ---------- Detail panel ---------- */

  const panel = document.getElementById("panel");
  const panelOpen = () => !panel.hidden;

  function showPanel(n) {
    selected = n._key;
    panel.innerHTML = `<button class="btn close" aria-label="Close details">✕</button>`
      + (!n._parent ? rootHTML() : n.children ? stageHTML(n) : itemHTML(n));
    panel.hidden = false;
    panel.scrollTop = 0;
    panel.querySelector(".close").addEventListener("click", closePanel);
    nodeLayer.selectAll("g.node").attr("class", nodeClass);
  }
  function closePanel() {
    selected = null;
    panel.hidden = true;
    nodeLayer.selectAll("g.node").attr("class", nodeClass);
  }

  function rootHTML() {
    const all = leaves(DATA), ours = all.filter(i => i.from !== "added").length;
    return `<p class="label">Concept draft</p>
      <h2>How might UN analysts tell a quiet place from an unheard one?</h2>
      <p>This map shows where an analyst can look, and what each source can tell them about silence.</p>
      <p>Start by setting the situation: country, region and issue. A person narrows the search, not the AI. Then read left to right, one stage at a time.</p>
      <ol class="stages">${DATA.children.map(s => `<li>${dot(s.stage)}${esc(stageTitle(s))}</li>`).join("")}</ol>
      <p class="stat hint">${all.length} items. ${ours} come from our UN visit, the 10/27 meeting or the concept README. ${all.length - ours} were added in this draft and need review.</p>`;
  }

  function stageHTML(n) {
    const items = leaves(n).filter(i => i.type !== "input"), ours = items.filter(i => i.from !== "added").length;
    const cases = n.stage > 5;
    return `<p class="label crumbs">${dot(n.stage)}${cases ? "After the five stages" : `Stage ${n.stage} of 5`}</p>
      <h2>${esc(n.name)}</h2>
      <h3>The question</h3><p>${esc(n.question)}</p>
      <h3>${cases ? "Who's researching" : "Who acts"}</h3><p>${esc(n.who)}</p>
      <h3>${cases ? "How to read it" : "Where a person decides"}</h3><p>${esc(n.decide)}</p>
      <p class="stat hint">${items.length} ${cases ? "cases" : "sources, tools and practices"} in ${n.children.length} branches. ${ours} come from our UN visit, meeting notes or concept README.</p>`;
  }

  function itemHTML(n) {
    const branch = n._parent, stage = branch._parent;
    const sec = (title, text) => (text ? `<h3>${title}</h3><p>${esc(text)}</p>` : "");
    const chips = [`<span class="tag">${TYPE[n.type]}</span>`];
    let body;
    if (n.type === "case") {
      if (n.status) chips.push(`<span class="tag todo">${esc(n.status)}</span>`);
      const ill = DATA.children.find(s => s.stage === n.illustrates);
      body = sec("What went silent", n.went)
        + sec(n.status ? "What to find out" : "What revealed it", n.revealed)
        + `<h3>Illustrates</h3><p class="crumbs">${dot(ill.stage)}${esc(stageTitle(ill))}</p>`;
    } else if (n.type === "input") {
      body = sec("What the analyst sets", n.what) + sec("Why it matters for silence", n.silence);
    } else {
      chips.push(`<span class="tag">${COST[n.cost]}</span>`, `<span class="tag">${ACCESS[n.access]}</span>`);
      body = sec("What it is", n.what) + sec("What it can tell you about silence", n.silence) + sec("What it can't see", n.limits);
    }
    return `<p class="label crumbs">${dot(stage.stage)}${esc(stageTitle(stage))} › ${esc(branch.name)}</p>
      <h2>${esc(n.name)}</h2>
      <div class="chips">${chips.join("")}</div>
      ${body}
      <p class="from">From: ${esc(FROM[n.from])}</p>
      ${n.type === "input" ? "" : linkHTML(n.url)}`;
  }

  function linkHTML(url) {
    if (!url) return `<p class="check hint">No public link.</p>`;
    const internal = !/^https?:/.test(url);
    const r = CHECK.results[url], when = fmtDate((CHECK.dates || {})[url] || CHECK.date);
    const note = internal ? "Opens our Quiet or Unheard? concept."
      : r === "ok" ? `Link checked ${when}.`
      : r === "blocked" ? `The site blocked an automated check on ${when}. Open it to confirm it still works.`
      : "Link not checked yet.";
    return `<a class="open-link" href="${esc(url)}"${internal ? "" : ' target="_blank" rel="noopener"'}>${internal ? "Open concept" : "Open site ↗"}</a>
      <p class="check hint">${note}</p>`;
  }

  /* ---------- Controls ---------- */

  const filtersEl = document.getElementById("filters");
  const filtersBtn = document.getElementById("filters-btn");
  const expandBtn = document.getElementById("expand-btn");
  const notes = document.getElementById("notes");

  filtersEl.innerHTML = FILTERS.map(f => `<div class="group" role="group" aria-label="${f.label}">
      <span class="label">${f.label}</span>
      ${Object.entries(f.options).map(([k, v]) => `<button class="chip" data-group="${f.key}" data-key="${k}" aria-pressed="true">${esc(v)}</button>`).join("")}
    </div>`).join("") + `<button class="reset" id="reset">Reset</button>`;

  filtersBtn.addEventListener("click", () => {
    const open = filtersEl.hidden;
    filtersEl.hidden = !open;
    filtersBtn.setAttribute("aria-expanded", String(open));
  });
  filtersEl.addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (chip) {
      const set = state[chip.dataset.group], k = chip.dataset.key;
      set.has(k) ? set.delete(k) : set.add(k);
      chip.setAttribute("aria-pressed", String(set.has(k)));
      applyFilters();
    } else if (e.target.id === "reset") {
      FILTERS.forEach(f => { state[f.key] = new Set(Object.keys(f.options)); });
      filtersEl.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", "true"));
      applyFilters();
    }
  });

  let timer;
  document.getElementById("search").addEventListener("input", e => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); applyFilters(); }, 150);
  });

  function applyFilters() {
    touched = true;
    const n = filtersOn();
    filtersBtn.textContent = n ? `Filters · ${n}` : "Filters";
    if (isFiltering()) {
      if (!saved) saved = expanded;
      expanded = new Set(parentsOf(filterTree(DATA)).map(p => p._key));
      render();
      fit();
    } else if (saved) {
      expanded = saved;
      saved = null;
      render();
      home(true);
    }
    syncExpandBtn();
  }

  const allOpen = () => parentsOf(DATA).every(p => expanded.has(p._key));
  function syncExpandBtn() { expandBtn.textContent = allOpen() ? "Collapse all" : "Expand all"; }
  expandBtn.addEventListener("click", () => {
    touched = true;
    trailKey = null;
    if (allOpen()) {
      expanded = new Set([DATA._key]);
      render();
      home(true);
    } else {
      expanded = new Set(parentsOf(DATA).map(p => p._key));
      render();
      fit();
    }
    syncExpandBtn();
  });

  document.getElementById("notes-btn").addEventListener("click", () => notes.showModal());
  notes.addEventListener("click", e => { if (e.target === notes) notes.close(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !notes.open && panelOpen()) closePanel(); });

  const all = leaves(DATA), results = Object.values(CHECK.results), later = Object.values(CHECK.dates || {});
  document.getElementById("from-counts").innerHTML = Object.entries(FROM)
    .map(([k, v]) => `<li>${esc(v)}: ${all.filter(i => i.from === k).length}</li>`).join("");
  document.getElementById("check-note").textContent = CHECK.date
    ? `Links checked ${fmtDate(CHECK.date)}${later.length ? `, and ${later.length} added since on ${fmtDate(later[later.length - 1])}` : ""}: ${results.filter(r => r === "ok").length} loaded, ${results.filter(r => r === "blocked").length} blocked the check and need opening by hand.`
    : "Links not checked yet.";
  const setHint = () => {
    document.getElementById("hint").textContent = narrow()
      ? "Tap a stage to open it. Drag to move. Pinch to zoom."
      : "Click a stage to open it. Drag to move. Scroll to zoom.";
  };

  render();
  syncExpandBtn();
  // The page can still be settling into its size when this runs, so re-centre on resize until the viewer takes over.
  zoom.on("start.viewer", e => { if (e.sourceEvent) touched = true; });
  new ResizeObserver(() => { setHint(); if (!touched) home(false); }).observe(svg.node());
})();
