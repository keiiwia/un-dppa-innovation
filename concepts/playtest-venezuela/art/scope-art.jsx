// Live version of the scope illustrations: the Figma layer stack rebuilt on a 681×1024 stage, with the
// animated "PixelField Live" shader on top. Needs WebGPU; without it the static PNG behind stays visible.
// Build with `npm run build:art`. app.js calls window.ScopeArt.show(key).
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShaderFill } from '@figma/expressive-components';
import { setup, render, manifest } from './pixel-field.ts';

// Shader parameters as set in Figma (the same on all four screens)
const SHADER = {
  setup, render, manifest,
  params: {
    tint3: { r: 0.24300000071525574, g: 0.3880000114440918, b: 0.8669999837875366, a: 1 },
    background: { r: 0.953000009059906, g: 0.9570000171661377, b: 0.9649999737739563, a: 1 },
    cursorPull: 0.6000000238418579, cellSize: 18.72881317138672, numerals: 0.3499999940395355,
    tint1: { r: 0.7879999876022339, g: 0.8309999704360962, b: 0.984000027179718, a: 1 },
    numeralColor: { r: 1, g: 1, b: 1, a: 1 }, speed: 0.6000000238418579, palette: 0, tail: true,
    gap: 0.4423791766166687, grain: 0.3499999940395355, spread: 0.44999998807907104,
    tint2: { r: 0.5569999814033508, g: 0.6430000066757202, b: 0.9610000252723694, a: 1 },
    transparentBackground: true, density: 1, seed: 7
  }
};

// Layer positions in stage pixels: the Figma frame is 1440×1024 and the panel starts at x = 758.
// `photos` are the pixelated photo layers (static in Figma too); `field` is the shader rectangle.
// The photo exports come with a white backing, so they are multiplied onto the panel to drop it.
const STAGE = { w: 681, h: 1024 };
const LAYERS = {
  what: {
    photos: [
      { src: 'assets/img/layers/what-sketch.png', x: 0, y: 323, w: 682, h: 701, blend: 'multiply' },
      { src: 'assets/img/layers/what-photo.png', x: -18, y: 306, w: 700, h: 718, opacity: 0.5, blend: 'multiply' }
    ],
    field: { x: -126.88, y: 88.88, w: 1785, h: 1134.7, mirror: true }
  },
  when: {
    photos: [{ src: 'assets/img/layers/when-photo.png', x: 226.7, y: 399.9, w: 456, h: 625, blend: 'multiply' }],
    field: { x: -434, y: -84, w: 1785, h: 1134.7, mirror: false }
  },
  where: {
    photos: [],
    field: { x: -126.88, y: 88.88, w: 1785, h: 1134.7, mirror: true }
  },
  who: {
    photos: [{ src: 'assets/img/layers/who-photo.png', x: 79, y: 121, w: 603, h: 903, blend: 'multiply' }],
    field: { x: -157, y: -123, w: 1058, h: 1135, mirror: false }
  }
};

function Art({ name }) {
  const box = useRef(null);
  const [scale, setScale] = useState(1);
  // Cover the panel, anchored bottom right, the same way the static image is
  useEffect(() => {
    const el = box.current;
    const fit = () => setScale(Math.max(el.clientWidth / STAGE.w, el.clientHeight / STAGE.h) || 1);
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    return () => ro.disconnect();
  }, []);
  const layer = LAYERS[name], f = layer.field;
  // The shader measures cells in canvas pixels. Drawing at 1 canvas pixel per CSS pixel keeps the cells the size they are in Figma on high-density screens.
  const dpr = window.devicePixelRatio || 1;
  return (
    <div ref={box} className="art-box">
      <div className="art-stage" style={{ width: STAGE.w, height: STAGE.h, transform: `scale(${scale})` }}>
        {layer.photos.map((p) => (
          <img key={p.src} src={p.src} alt="" style={{ left: p.x, top: p.y, width: p.w, height: p.h, opacity: p.opacity, mixBlendMode: p.blend }} />
        ))}
        <div className="art-tint" />
        <div className="art-field" style={{ left: f.x, top: f.y, width: f.w, height: f.h, transform: f.mirror ? 'scaleX(-1)' : 'none' }}>
          <div style={{ width: f.w / dpr, height: f.h / dpr, transform: `scale(${dpr})`, transformOrigin: '0 0' }}>
            <ShaderFill shader={SHADER} width={f.w / dpr} height={f.h / dpr} />
          </div>
        </div>
      </div>
    </div>
  );
}

let root = null, supported = null, wanted = null;
const still = window.matchMedia('(prefers-reduced-motion: reduce)');
const narrow = window.matchMedia('(max-width: 860px)');

function paint() {
  const host = document.getElementById('art');
  if (!host) return;
  const name = supported && !still.matches && !narrow.matches && LAYERS[wanted] ? wanted : null;
  host.hidden = !name;
  if (!name) { if (root) { root.unmount(); root = null; } return; }
  if (!root) root = createRoot(host);
  root.render(<Art key={name} name={name} />);
}

window.ScopeArt = {
  show(name) {
    wanted = name;
    if (supported !== null) return paint();
    if (!navigator.gpu) { supported = false; return; }
    navigator.gpu.requestAdapter().then((a) => { supported = !!a; paint(); }, () => { supported = false; });
  }
};
still.addEventListener('change', paint);
narrow.addEventListener('change', paint);
