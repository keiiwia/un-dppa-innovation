// "PixelField Live" shader module, exported from the Figma file (UN-Innovation-DPPA-Sprint). Kept as exported: edit it in Figma, not here.
// @ts-nocheck

// Property metadata is only used in Figma Design, so this is a no-op.
function defineProperties(
  _component: unknown,
  _properties: unknown,
): void {}

export default function Effect() { }
export function setup(device, frame) {
    const wgsl = `diagnostic(off,derivative_uniformity);
struct Uniforms {
  res: vec4f,
  p1: vec4f,
  p2: vec4f,
  p3: vec4f,
  bg: vec4f,
  c1: vec4f,
  c2: vec4f,
  c3: vec4f,
  num: vec4f,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

struct VsIn {
  @location(0) pos: vec2f,
  @location(1) uv: vec2f,
};
struct VsOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.position = vec4f(in.pos, 0.0, 1.0);
  out.uv = in.uv;
  return out;
}

fn hash21(p: vec2f) -> f32 {
  var q = fract(p * vec2f(123.34, 456.21));
  q = q + dot(q, q + 45.32);
  return fract(q.x * q.y);
}

fn hash11(x: f32) -> f32 {
  return fract(sin(x * 127.1 + 311.7) * 43758.5453);
}

fn vnoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let w = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}

fn digitBit(dg: i32, gx: i32, gy: i32) -> bool {
  var masks = array<i32, 10>(31599, 11415, 29671, 29647, 23497, 31183, 31215, 29257, 31727, 31695);
  let m = masks[clamp(dg, 0, 9)];
  let idx = gy * 3 + gx;
  return ((m >> u32(14 - idx)) & 1) == 1;
}

fn cluster(p: vec2f, aspect: f32, t: f32, seed: f32, spread: f32) -> f32 {
  var w = 0.0;
  for (var i = 0; i < 6; i = i + 1) {
    let fi = f32(i);
    let h1 = hash11(seed * 7.13 + fi * 1.7);
    let h2 = hash11(seed * 3.91 + fi * 2.3 + 5.0);
    let h3 = hash11(seed * 1.37 + fi * 4.1 + 9.0);
    let base = vec2f((0.3 + h1 * 0.36) * aspect, 0.22 + h2 * 0.5);
    let drift = vec2f(sin(t * (0.31 + h3 * 0.4) + fi * 2.1), cos(t * (0.27 + h1 * 0.35) + fi * 1.3)) * 0.06;
    let r = spread * (0.2 + h3 * 0.22) * (1.0 + 0.1 * sin(t * 0.6 + fi));
    let ang = h1 * 6.283 + 0.25 * sin(t * 0.2 + fi);
    let stretch = 1.5 + h2 * 1.8;
    let d = p - (base + drift);
    let ca = cos(ang);
    let sa = sin(ang);
    let rx = (d.x * ca + d.y * sa) / stretch;
    let ry = -d.x * sa + d.y * ca;
    w = max(w, exp(-(rx * rx + ry * ry) / (r * r)));
  }
  return w;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let res = max(u.res.xy, vec2f(1.0, 1.0));
  let t = u.res.z * u.p2.x;
  let seed = u.res.w;
  let cs = max(u.p1.x, 3.0);
  let gap = clamp(u.p1.y, 0.0, cs * 0.5);

  let px = uv * res;
  let cell = floor(px / cs);
  let lp = px - cell * cs;
  let center = (cell + 0.5) * cs;
  let aspect = res.x / res.y;
  let p = center / res.y;

  // The figure: drifting blobs with a ragged, breathing edge
  var w = cluster(p, aspect, t, seed, u.p1.w);
  w = w + (vnoise(cell * 0.32 + vec2f(t * 0.45, -t * 0.3) + seed) - 0.5) * 0.4 * smoothstep(0.05, 0.5, w);

  // The tail trailing off toward the lower right
  if (u.p3.w > 0.5) {
    let x0 = 0.55 * aspect;
    let ty = 0.6 + (p.x - x0) * 0.42 + 0.025 * sin(p.x * 9.0 - t * 1.4);
    let band = abs(p.y - ty) * res.y / cs;
    let along = select(0.0, 1.0, p.x > x0);
    w = max(w, along * select(0.0, 1.0, band < 0.6) * (0.5 + 0.12 * hash21(cell + 3.3)));
  }

  // Cursor pull
  if (u.p3.z > 0.5) {
    let m = u.p3.xy / res.y;
    let dm = p - m;
    w = max(w, u.p2.w * exp(-dot(dm, dm) / 0.016));
  }
  w = clamp(w, 0.0, 1.0);

  // Cells switch on and off on their own clocks, with a short fade
  let rate = 0.5 + hash21(cell + seed) * 1.1;
  let ph = t * rate * 1.6 + hash21(cell * 1.7) * 10.0;
  let k = floor(ph);
  let f = fract(ph);
  let thr = smoothstep(0.28, 0.6, w) * u.p1.z;
  let on0 = select(0.0, 1.0, hash21(cell + vec2f(k * 0.37, k * 1.91)) < thr);
  let on1 = select(0.0, 1.0, hash21(cell + vec2f((k + 1.0) * 0.37, (k + 1.0) * 1.91)) < thr);
  let a = mix(on0, on1, smoothstep(0.7, 1.0, f));

  // Three tints by strength, with some cells stepped down
  var lvl = 1.0;
  if (w > 0.45) { lvl = 2.0; }
  if (w > 0.72) { lvl = 3.0; }
  if (hash21(cell * 2.3 + 11.0) < 0.18) { lvl = max(1.0, lvl - 1.0); }
  var col = u.c1.rgb;
  if (lvl > 1.5) { col = u.c2.rgb; }
  if (lvl > 2.5) { col = u.c3.rgb; }

  // Grain inside each cell
  let g = vnoise(px * 0.55 + vec2f(t * 2.0, t * 1.3));
  col = col * (1.0 - u.p2.z * 0.22 * g);

  let inner = cs - gap;
  let inCell = lp.x < inner && lp.y < inner;

  // Pixel numerals in the strongest cells
  if (lvl > 2.5 && inner >= 7.0 && hash21(cell * 3.1 + vec2f(seed, 4.0)) < u.p2.y) {
    let gs = max(1.0, floor(inner * 0.62 / 5.0));
    let off = floor(vec2f((inner - 3.0 * gs) * 0.5, (inner - 5.0 * gs) * 0.5));
    let q = floor((lp - off) / gs);
    if (q.x >= 0.0 && q.x < 3.0 && q.y >= 0.0 && q.y < 5.0) {
      let tick = floor(t * 1.1 + hash21(cell * 0.7) * 6.0);
      let dg = i32(floor(hash21(cell + vec2f(tick * 0.13, 3.0 + tick * 0.71)) * 10.0));
      if (digitBit(dg, i32(q.x), i32(q.y))) { col = u.num.rgb; }
    }
  }

  let cover = select(0.0, a, inCell);
  let rgb = mix(u.bg.rgb, col, cover);
  let alpha = mix(u.bg.a, 1.0, cover);
  return vec4f(rgb * alpha, alpha);
}
`;
    frame.state.module = device.createShaderModule({ code: wgsl });
    frame.state.pipeline = null;
    frame.state.pipelineFormat = null;
    frame.state.quad = device.createBuffer({
        size: 6 * 4 * 4,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });
    new Float32Array(frame.state.quad.getMappedRange()).set([
        -1, -1, 0, 1,
        1, -1, 1, 1,
        -1, 1, 0, 0,
        -1, 1, 0, 0,
        1, -1, 1, 1,
        1, 1, 1, 0,
    ]);
    frame.state.quad.unmap();
    frame.state.uniforms = device.createBuffer({
        size: 9 * 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
}
export function render(device, frame) {
    const params = frame.params || {};
    function num(v, fallback) {
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
    }
    function rgba(c, fb) {
        const o = c || {};
        return [num(o.r, fb[0]), num(o.g, fb[1]), num(o.b, fb[2]), num(o.a, fb[3])];
    }
    // Palettes from the DPPA Innovation tokens
    const palettes = [
        // Paper: motif-1/2/3 on paper, white numerals
        [[0.953, 0.957, 0.965, 1], [0.788, 0.831, 0.984, 1], [0.557, 0.643, 0.961, 1], [0.243, 0.388, 0.867, 1], [1, 1, 1, 1]],
        // Field: white cells on the cobalt field, field-coloured numerals
        [[0.102, 0.239, 0.722, 1], [0.38, 0.47, 0.8, 1], [0.66, 0.72, 0.92, 1], [1, 1, 1, 1], [0.102, 0.239, 0.722, 1]],
        // Night: cobalt cells on night, serendipity numerals
        [[0.039, 0.071, 0.024, 1], [0.094, 0.153, 0.396, 1], [0.165, 0.247, 0.604, 1], [0.243, 0.388, 0.867, 1], [0.769, 0.925, 0.29, 1]],
    ];
    const mode = Math.round(num(params.palette, 0));
    let cols;
    if (mode >= 0 && mode < 3) {
        cols = palettes[mode];
    }
    else {
        cols = [
            rgba(params.background, palettes[0][0]),
            rgba(params.tint1, palettes[0][1]),
            rgba(params.tint2, palettes[0][2]),
            rgba(params.tint3, palettes[0][3]),
            rgba(params.numeralColor, palettes[0][4]),
        ];
    }
    if (params.transparentBackground === true) {
        cols = [[cols[0][0], cols[0][1], cols[0][2], 0], cols[1], cols[2], cols[3], cols[4]];
    }
    const mp = frame.mousePosition;
    const hasMouse = mp && Number.isFinite(Number(mp.x)) && Number.isFinite(Number(mp.y)) && num(params.cursorPull, 0) > 0 ? 1 : 0;
    const data = new Float32Array(36);
    data.set([
        frame.output.width, frame.output.height, Number(frame.time) * 0.001, num(params.seed, 7),
        num(params.cellSize, 18), num(params.gap, 1), num(params.density, 0.85), num(params.spread, 0.45),
        num(params.speed, 0.6), num(params.numerals, 0.35), num(params.grain, 0.35), num(params.cursorPull, 0.6),
        hasMouse ? Number(mp.x) : 0, hasMouse ? Number(mp.y) : 0, hasMouse, params.tail === false ? 0 : 1,
    ], 0);
    data.set(cols[0], 16);
    data.set(cols[1], 20);
    data.set(cols[2], 24);
    data.set(cols[3], 28);
    data.set(cols[4], 32);
    device.queue.writeBuffer(frame.state.uniforms, 0, data);
    const outputFormat = frame.output.format;
    if (frame.state.pipeline == null || frame.state.pipelineFormat !== outputFormat) {
        frame.state.pipeline = device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: frame.state.module,
                entryPoint: "vs_main",
                buffers: [{
                        arrayStride: 16,
                        attributes: [
                            { shaderLocation: 0, format: "float32x2", offset: 0 },
                            { shaderLocation: 1, format: "float32x2", offset: 8 },
                        ],
                    }],
            },
            fragment: {
                module: frame.state.module,
                entryPoint: "fs_main",
                targets: [{ format: outputFormat }],
            },
            primitive: { topology: "triangle-list" },
        });
        frame.state.pipelineFormat = outputFormat;
    }
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
        colorAttachments: [{
                view: frame.output.createView(),
                loadOp: "clear",
                clearValue: { r: 0, g: 0, b: 0, a: 0 },
                storeOp: "store",
            }],
    });
    pass.setPipeline(frame.state.pipeline);
    const bindGroup = device.createBindGroup({
        layout: frame.state.pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: frame.state.uniforms } }],
    });
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, frame.state.quad);
    pass.draw(6);
    pass.end();
    device.queue.submit([encoder.finish()]);
}
defineProperties(Effect, {
    palette: {
        type: "number",
        label: "Palette",
        control: "select",
        defaultValue: 0,
        options: [
            { label: "Paper", value: 0 },
            { label: "Field", value: 1 },
            { label: "Night", value: 2 },
            { label: "Custom", value: 3 },
        ],
    },
    seed: { type: "number", label: "Seed", control: "slider", min: 1, max: 100, step: 1, defaultValue: 7 },
    cellSize: { type: "number", label: "Cell size", control: "slider", min: 4, max: 48, step: 1, defaultValue: 18, unit: "px" },
    gap: { type: "number", label: "Gap", control: "slider", min: 0, max: 6, step: 0.5, defaultValue: 1, unit: "px" },
    density: { type: "number", label: "Density", control: "slider", min: 0, max: 1, step: 0.01, defaultValue: 0.85 },
    spread: { type: "number", label: "Spread", control: "slider", min: 0.1, max: 1, step: 0.01, defaultValue: 0.45 },
    speed: { type: "number", label: "Speed", control: "slider", min: 0, max: 3, step: 0.05, defaultValue: 0.6 },
    numerals: { type: "number", label: "Numerals", control: "slider", min: 0, max: 1, step: 0.01, defaultValue: 0.35 },
    grain: { type: "number", label: "Grain", control: "slider", min: 0, max: 1, step: 0.01, defaultValue: 0.35 },
    cursorPull: { type: "number", label: "Cursor pull", control: "slider", min: 0, max: 1, step: 0.01, defaultValue: 0.6 },
    tail: { type: "boolean", label: "Tail", defaultValue: true },
    transparentBackground: { type: "boolean", label: "Transparent background", defaultValue: false },
    background: { type: "color", label: "Background (Custom)", defaultValue: { r: 0.953, g: 0.957, b: 0.965, a: 1 } },
    tint1: { type: "color", label: "Tint 1 (Custom)", defaultValue: { r: 0.788, g: 0.831, b: 0.984, a: 1 } },
    tint2: { type: "color", label: "Tint 2 (Custom)", defaultValue: { r: 0.557, g: 0.643, b: 0.961, a: 1 } },
    tint3: { type: "color", label: "Tint 3 (Custom)", defaultValue: { r: 0.243, g: 0.388, b: 0.867, a: 1 } },
    numeralColor: { type: "color", label: "Numerals (Custom)", defaultValue: { r: 1, g: 1, b: 1, a: 1 } },
});

export const manifest = {
  "isAnimated": true,
  "name": "PixelField Live",
  "usesMouse": true,
  "version": 2
}
