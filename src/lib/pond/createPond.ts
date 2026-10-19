// Staw z rybami koi widziany z góry (WebGL, Three.js).
// Warstwy: dno + cienie + ryby renderowane do tekstury, potem przebieg „woda”
// (fale, kaustyki, refleksy), a na wierzchu liście lotosu, karma i płatki.
import * as THREE from "three";
import { KOI_KINDS, type KoiKind, heightTexture, koiTexture, lilyTexture } from "./textures";

export type PondOptions = { fishCount?: number; kinds?: KoiKind[]; pads?: boolean };

export type Pond = {
  setFishCount(n: number): void;
  setKinds(kinds: KoiKind[]): void;
  setPads(on: boolean): void;
  /** Rzuca karmę w punkcie ekranu (px względem canvasa) albo w okolice środka stawu. */
  feed(at?: { x: number; y: number }): void;
  start(): void;
  stop(): void;
  dispose(): void;
};

const MAX_RIPPLES = 24;

let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const R = (a: number, b: number) => a + (b - a) * rnd();
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

const KOI_VERT = /* glsl */ `
  uniform float uPhase, uAmp, uBend; varying vec2 vUv;
  void main(){
    vUv = uv; vec3 p = position;
    float s = 1.0 - (p.x + 1.0) * 0.5;
    float w = 0.06 + 0.94 * s * s;
    p.y += sin(p.x * 3.2 + uPhase) * uAmp * w + uBend * p.x * p.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;

const KOI_FRAG = /* glsl */ `
  uniform sampler2D uTex, uH; uniform float uHeading, uMetal; varying vec2 vUv;
  void main(){
    vec4 c = texture2D(uTex, vUv);
    if(c.a < 0.02) discard;
    vec2 e = vec2(2.0/512.0, 2.0/256.0);
    float h  = texture2D(uH, vUv).r;
    float hl = texture2D(uH, vUv - vec2(e.x,0.0)).r, hr = texture2D(uH, vUv + vec2(e.x,0.0)).r;
    float hd = texture2D(uH, vUv - vec2(0.0,e.y)).r, hu = texture2D(uH, vUv + vec2(0.0,e.y)).r;
    vec3 n = normalize(vec3((hl-hr)*5.0, (hd-hu)*7.0, 1.0));
    float cs = cos(uHeading), sn = sin(uHeading);
    n.xy = vec2(cs*n.x - sn*n.y, sn*n.x + cs*n.y);
    vec3 L = normalize(vec3(-0.5, 0.6, 1.0));
    float body = step(0.02, h);
    float dif = mix(1.0, 0.5 + 0.6*max(dot(n,L),0.0), body);
    float spec = pow(max(dot(reflect(-L,n), vec3(0.0,0.0,1.0)), 0.0), mix(14.0, 34.0, uMetal)) * mix(0.22, 0.85, uMetal) * body;
    vec3 col = c.rgb * dif * mix(1.0, mix(0.7, 1.0, smoothstep(0.0, 0.45, h)), body) + spec * vec3(1.0, 0.96, 0.86);
    gl_FragColor = vec4(col, c.a);
  }`;

const SHADOW_FRAG = /* glsl */ `
  uniform sampler2D uTex; varying vec2 vUv;
  void main(){ float a = texture2D(uTex, vUv, 3.0).a; gl_FragColor = vec4(0.0, 0.03, 0.04, a * 0.5); }`;

const BOTTOM_FRAG = /* glsl */ `
  varying vec2 vP; uniform vec2 uHalf;
  vec2 h2(vec2 p){ p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3))); return fract(sin(p)*43758.5453); }
  float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(h2(i).x,h2(i+vec2(1,0)).x,f.x), mix(h2(i+vec2(0,1)).x,h2(i+vec2(1,1)).x,f.x), f.y); }
  float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*n2(p); p*=2.03; a*=0.5; } return v; }
  void main(){
    vec2 p = vP*3.0;
    vec2 ip = floor(p), fp = fract(p);
    float f1=8.0, f2=8.0; vec2 cell=vec2(0.0);
    for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
      vec2 g=vec2(float(x),float(y)); vec2 o=h2(ip+g); vec2 r=g+o*0.85-fp; float d=dot(r,r);
      if(d<f1){ f2=f1; f1=d; cell=ip+g; } else if(d<f2){ f2=d; } }
    float edge = smoothstep(0.0, 0.18, sqrt(f2)-sqrt(f1));
    vec2 c = h2(cell+3.1);
    vec3 stone = mix(vec3(0.33,0.31,0.27), vec3(0.22,0.25,0.22), c.x);
    stone = mix(stone, vec3(0.42,0.36,0.28), step(0.8,c.y)*0.6);
    stone *= 0.75 + 0.35*(1.0-sqrt(f1));
    vec3 col = mix(vec3(0.05,0.08,0.07), stone, edge);
    float algae = fbm(vP*0.35 + 4.0);
    col = mix(col, vec3(0.13,0.24,0.12), smoothstep(0.45,0.75,algae)*0.6);
    col = mix(col, vec3(0.05,0.2,0.19), 0.45) * 1.15;
    vec2 q = vP/uHalf; col *= 1.0 - 0.35*dot(q*q, vec2(0.5));
    gl_FragColor = vec4(col,1.0);
  }`;

const WATER_FRAG = /* glsl */ `
  uniform sampler2D tScene; uniform float uTime; uniform vec2 uHalf; uniform vec4 uR[${MAX_RIPPLES}]; varying vec2 vUv;
  float caustic(vec2 uv, float t){
    vec2 p = mod(uv*6.2831, 6.2831) - 250.0; vec2 i = p; float c = 1.0; float inten = 0.005;
    for(int n=0;n<4;n++){ float tt = t*(1.0 - (3.5/float(n+1)));
      i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
      c += 1.0/length(vec2(p.x/(sin(i.x+tt)/inten), p.y/(cos(i.y+tt)/inten))); }
    c /= 4.0; c = 1.17 - pow(c, 1.4); return pow(abs(c), 8.0);
  }
  void main(){
    vec2 p = (vUv*2.0 - 1.0) * uHalf;
    vec2 g = vec2(sin(p.x*1.7 + uTime*0.8 + sin(p.y*1.3 + uTime*0.4)), cos(p.y*1.9 - uTime*0.7 + cos(p.x*1.1))) * 0.05;
    for(int k=0;k<${MAX_RIPPLES};k++){
      vec4 r = uR[k]; float age = uTime - r.z;
      if(age < 0.0 || age > 4.5) continue;
      vec2 dv = p - r.xy; float d = length(dv) + 1e-4;
      float x = d - age*1.5;
      float env = exp(-x*x*5.0) * exp(-age*1.0) * r.w * smoothstep(0.0, 0.12, age) / (1.0 + d*0.35);
      g += (dv/d) * cos(x*10.0) * env * 1.6;
    }
    vec2 uv = vUv + g * 0.10 / (uHalf*2.0);
    vec3 col = texture2D(tScene, uv).rgb;
    float ca = caustic(p*0.16 + g*0.08, uTime*0.45);
    col += vec3(0.55, 0.85, 0.8) * ca * 0.45;
    vec3 n = normalize(vec3(-g*1.4, 1.0));
    vec3 L = normalize(vec3(-0.5, 0.6, 1.0));
    float spec = pow(max(dot(reflect(-L,n), vec3(0.0,0.0,1.0)), 0.0), 70.0);
    col += vec3(1.0, 0.97, 0.9) * spec * 0.9;
    col = mix(col, vec3(0.03,0.13,0.14), 0.12);
    vec2 q = vUv - 0.5; col *= 1.0 - 0.5*pow(length(q)*1.35, 2.6);
    gl_FragColor = vec4(col, 1.0);
  }`;

type Fish = {
  m: THREE.Mesh; sh: THREE.Mesh; u: Record<string, THREE.IUniform>; size: number;
  x: number; y: number; a: number; speed: number; target: number; wander: number; bend: number; retarget: number;
};
type Pellet = { x: number; y: number; m: THREE.Mesh; s: THREE.Mesh; born: number };
type Pad = { m: THREE.Mesh; s: THREE.Mesh; fx: number; fy: number; rot: number; spin: number };
type Petal = { m: THREE.Mesh; x: number; y: number; r: number; vr: number; vx: number; vy: number };

/** Zwraca null, gdy przeglądarka nie obsługuje WebGL. */
export function createPond(canvas: HTMLCanvasElement, container: HTMLElement, opts: PondOptions = {}): Pond | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.autoClear = false;

  let W2 = 8, H2 = 5, clock = 0;
  const cam = new THREE.OrthographicCamera(-W2, W2, H2, -H2, 0.1, 50);
  cam.position.z = 10;
  const scene = new THREE.Scene();
  const surface = new THREE.Scene();
  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const rt = new THREE.WebGLRenderTarget(4, 4);

  const bottomMat = new THREE.ShaderMaterial({
    uniforms: { uHalf: { value: new THREE.Vector2(W2, H2) } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: BOTTOM_FRAG,
  });
  const bottom = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bottomMat);
  scene.add(bottom);

  // --- ryby ---
  const hTex = heightTexture();
  const fishGeo = new THREE.PlaneGeometry(2, 1, 40, 6);
  const fish: Fish[] = [];
  let kinds: KoiKind[] = opts.kinds?.length ? opts.kinds : (Object.keys(KOI_KINDS) as KoiKind[]);
  let fishCount = opts.fishCount ?? 12;

  function makeFish(kind: KoiKind) {
    const tex = koiTexture(kind, rnd);
    const u = {
      uTex: { value: tex }, uH: { value: hTex }, uPhase: { value: 0 }, uAmp: { value: 0.08 },
      uBend: { value: 0 }, uHeading: { value: 0 }, uMetal: { value: KOI_KINDS[kind].metal },
    };
    const m = new THREE.Mesh(fishGeo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: KOI_VERT, fragmentShader: KOI_FRAG, transparent: true, depthTest: false }));
    const sh = new THREE.Mesh(fishGeo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: KOI_VERT, fragmentShader: SHADOW_FRAG, transparent: true, depthTest: false }));
    const size = R(0.85, 1.35);
    m.scale.set(size, size, 1);
    sh.scale.set(size * 1.06, size * 1.1, 1);
    m.renderOrder = 10 + size * 10;
    sh.renderOrder = 2;
    scene.add(sh, m);
    fish.push({ m, sh, u, size, x: R(-W2 * 0.8, W2 * 0.8), y: R(-H2 * 0.8, H2 * 0.8), a: R(0, 6.283), speed: R(0.3, 0.6), target: R(0.35, 0.7), wander: R(-0.4, 0.4), bend: 0, retarget: R(2, 6) });
  }
  function removeFish(f: Fish) {
    scene.remove(f.m, f.sh);
    (f.m.material as THREE.Material).dispose();
    (f.sh.material as THREE.Material).dispose();
    (f.u.uTex.value as THREE.Texture).dispose();
  }
  function syncFish() {
    while (fish.length > fishCount) removeFish(fish.pop()!);
    while (fish.length < fishCount) makeFish(kinds[fish.length % kinds.length]);
  }

  // --- powierzchnia: liście, karma, płatki ---
  const pads: Pad[] = [];
  let showPads = opts.pads ?? true;
  const PAD_SPOTS: [number, number, number, boolean][] = [
    [0.78, 0.62, 1.25, true], [0.92, 0.05, 0.9, false], [0.62, 0.86, 0.7, false], [0.86, -0.72, 1.05, false], [-0.2, 0.88, 0.75, false],
  ];
  for (const [fx, fy, r, flower] of PAD_SPOTS) {
    const tex = lilyTexture(flower);
    tex.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.PlaneGeometry(2 * r, 2 * r);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    const s = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, color: 0x000000, transparent: true, opacity: 0.38 }));
    s.renderOrder = 1;
    surface.add(m);
    scene.add(s);
    pads.push({ m, s, fx, fy, rot: R(0, 6.283), spin: R(-0.02, 0.02) });
  }
  function layoutPads() {
    for (const p of pads) {
      p.m.position.set(p.fx * W2, p.fy * H2, 0);
      p.s.position.set(p.fx * W2 + 0.45, p.fy * H2 - 0.6, 0);
      p.m.visible = p.s.visible = showPads;
    }
  }

  const pellets: Pellet[] = [];
  const pelletGeo = new THREE.CircleGeometry(0.075, 10);
  const pelletMat = new THREE.MeshBasicMaterial({ color: 0xc08a4a });
  const pelletShadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });

  const petals: Petal[] = [];
  const petalGeo = new THREE.CircleGeometry(0.09, 12);
  petalGeo.scale(1.6, 1, 1);
  const petalMat = new THREE.MeshBasicMaterial({ color: 0xf3c6cf, transparent: true, opacity: 0.92 });
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(petalGeo, petalMat);
    surface.add(m);
    petals.push({ m, x: R(-1, 1), y: R(-1, 1), r: R(0, 6), vr: R(-0.3, 0.3), vx: R(0.02, 0.06), vy: R(-0.02, 0.02) });
  }

  // --- woda ---
  const ripples = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, -100, 0));
  let rIdx = 0;
  const ripple = (x: number, y: number, s: number) => {
    ripples[rIdx].set(x, y, clock, s);
    rIdx = (rIdx + 1) % MAX_RIPPLES;
  };
  const postMat = new THREE.ShaderMaterial({
    uniforms: { tScene: { value: rt.texture }, uTime: { value: 0 }, uHalf: { value: new THREE.Vector2(W2, H2) }, uR: { value: ripples } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: WATER_FRAG,
    depthTest: false,
  });
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

  function dropFood(x: number, y: number, n: number) {
    for (let i = 0; i < n && pellets.length <= 30; i++) {
      const px = x + R(-0.45, 0.45), py = y + R(-0.45, 0.45);
      const m = new THREE.Mesh(pelletGeo, pelletMat), s = new THREE.Mesh(pelletGeo, pelletShadowMat);
      m.position.set(px, py, 0);
      s.position.set(px + 0.3, py - 0.4, 0);
      s.renderOrder = 1;
      surface.add(m);
      scene.add(s);
      pellets.push({ x: px, y: py, m, s, born: clock });
    }
    ripple(x, y, 1.0);
  }
  function eat(p: Pellet) {
    surface.remove(p.m);
    scene.remove(p.s);
    pellets.splice(pellets.indexOf(p), 1);
    ripple(p.x, p.y, 0.45);
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    if (aspect >= 1) { H2 = 5; W2 = 5 * aspect; } else { W2 = 4.2; H2 = 4.2 / aspect; }
    cam.left = -W2; cam.right = W2; cam.top = H2; cam.bottom = -H2;
    cam.updateProjectionMatrix();
    bottom.scale.set(W2, H2, 1);
    bottomMat.uniforms.uHalf.value.set(W2, H2);
    postMat.uniforms.uHalf.value.set(W2, H2);
    const pr = renderer.getPixelRatio();
    rt.setSize(Math.floor(w * pr), Math.floor(h * pr));
    layoutPads();
  }

  function step(dt: number) {
    clock += dt;
    for (const f of fish) {
      const hx = f.x + Math.cos(f.a) * f.size * 0.9, hy = f.y + Math.sin(f.a) * f.size * 0.9;
      f.retarget -= dt;
      if (f.retarget < 0) { f.retarget = R(2, 7); f.target = R(0.3, 0.75); }
      f.wander = Math.max(-0.9, Math.min(0.9, f.wander + R(-1, 1) * dt * 1.2));
      let dx = Math.cos(f.a + f.wander * 0.7), dy = Math.sin(f.a + f.wander * 0.7);
      const mx = W2 - 1.0, my = H2 - 0.9;
      if (f.x > mx) dx -= (f.x - mx) * 1.6;
      if (f.x < -mx) dx += (-mx - f.x) * 1.6;
      if (f.y > my) dy -= (f.y - my) * 1.6;
      if (f.y < -my) dy += (-my - f.y) * 1.6;
      for (const o of fish) {
        if (o === f) continue;
        const ex = f.x - o.x, ey = f.y - o.y, d2 = ex * ex + ey * ey, lim = (f.size + o.size) * 0.9;
        if (d2 < lim * lim && d2 > 1e-4) { const d = Math.sqrt(d2), k = ((lim - d) / lim) * 0.9; dx += (ex / d) * k; dy += (ey / d) * k; }
      }
      let goal = f.target, maxTurn = 1.1, best: Pellet | null = null, bd = 4.5;
      for (const p of pellets) { const d = Math.hypot(p.x - hx, p.y - hy); if (d < bd) { bd = d; best = p; } }
      if (best) {
        dx += ((best.x - hx) / bd) * 3;
        dy += ((best.y - hy) / bd) * 3;
        goal = 1.5;
        maxTurn = 2.4;
        if (bd < 0.16 + f.size * 0.12) eat(best);
      }
      const turn = Math.max(-maxTurn, Math.min(maxTurn, wrapAngle(Math.atan2(dy, dx) - f.a) * 1.8));
      f.a += turn * dt;
      f.speed += (goal - f.speed) * Math.min(1, dt * 1.2);
      f.x += Math.cos(f.a) * f.speed * dt;
      f.y += Math.sin(f.a) * f.speed * dt;
      f.bend += (turn * 0.11 - f.bend) * Math.min(1, dt * 4);
      f.u.uPhase.value += dt * (1.6 + f.speed * 6.5);
      f.u.uAmp.value = 0.05 + f.speed * 0.07;
      f.u.uBend.value = f.bend;
      f.u.uHeading.value = f.a;
      f.m.position.set(f.x, f.y, 0);
      f.m.rotation.z = f.a;
      f.sh.position.set(f.x + 0.32, f.y - 0.42, 0);
      f.sh.rotation.z = f.a;
    }
    for (let i = pellets.length - 1; i >= 0; i--) {
      const p = pellets[i];
      p.x += 0.03 * dt;
      p.m.position.x = p.x;
      p.s.position.x = p.x + 0.3;
      if (clock - p.born > 30) eat(p);
    }
    for (const p of petals) {
      p.x += (p.vx * dt) / W2;
      p.y += (p.vy * dt) / H2;
      p.r += p.vr * dt;
      if (p.x > 1.08) { p.x = -1.08; p.y = R(-1, 1); }
      p.m.position.set(p.x * W2, p.y * H2, 0);
      p.m.rotation.z = p.r;
    }
    for (const p of pads) { p.rot += p.spin * dt; p.m.rotation.z = p.s.rotation.z = p.rot; }
    if (rnd() < dt * 0.25) ripple(R(-W2, W2), R(-H2, H2), 0.25);
  }

  function draw() {
    postMat.uniforms.uTime.value = clock;
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, cam);
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(postScene, postCam);
    renderer.render(surface, cam);
  }

  // --- wejście ---
  const toWorld = (cx: number, cy: number): [number, number] => {
    const r = canvas.getBoundingClientRect();
    return [((cx - r.left) / r.width * 2 - 1) * W2, -((cy - r.top) / r.height * 2 - 1) * H2];
  };
  let last: [number, number] = [1e9, 1e9], lastT = 0;
  const onMove = (e: PointerEvent) => {
    const [x, y] = toWorld(e.clientX, e.clientY);
    const now = performance.now();
    if (now - lastT > 70 && Math.hypot(x - last[0], y - last[1]) > 0.25) { ripple(x, y, 0.28); last = [x, y]; lastT = now; }
  };
  const onDown = (e: PointerEvent) => { const [x, y] = toWorld(e.clientX, e.clientY); dropFood(x, y, 5); };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", onDown);

  // --- pętla ---
  let running = false, prev = 0, raf = 0;
  const frame = (t: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (t - prev) / 1000 || 0.016);
    prev = t;
    step(dt);
    draw();
    raf = requestAnimationFrame(frame);
  };
  const ro = new ResizeObserver(() => { resize(); if (!running) draw(); });
  ro.observe(container);

  resize();
  syncFish();
  for (let i = 0; i < 60; i++) step(1 / 30);
  draw();

  const redrawIfIdle = () => { if (!running) draw(); };
  return {
    setFishCount(n) { fishCount = n; syncFish(); redrawIfIdle(); },
    setKinds(k) {
      if (!k.length) return;
      kinds = k;
      while (fish.length) removeFish(fish.pop()!);
      syncFish();
      redrawIfIdle();
    },
    setPads(on) { showPads = on; layoutPads(); redrawIfIdle(); },
    feed(at) {
      if (at) { const r = canvas.getBoundingClientRect(); const [x, y] = toWorld(r.left + at.x, r.top + at.y); dropFood(x, y, 5); }
      else dropFood(R(-W2 * 0.2, W2 * 0.4), R(-H2 * 0.3, H2 * 0.4), 7);
      redrawIfIdle();
    },
    start() { if (running) return; running = true; prev = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      while (fish.length) removeFish(fish.pop()!);
      scene.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); const m = o.material as THREE.MeshBasicMaterial; m.map?.dispose(); m.dispose(); } });
      surface.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); const m = o.material as THREE.MeshBasicMaterial; m.map?.dispose(); m.dispose(); } });
      hTex.dispose();
      postMat.dispose();
      rt.dispose();
      renderer.dispose();
    },
  };
}
