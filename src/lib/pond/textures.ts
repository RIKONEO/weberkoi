// Tekstury rysowane w canvasie: wzory odmian koi (widok z góry), wspólna mapa wysokości
// ciała do cieniowania oraz liście lotosu.
import * as THREE from "three";

const TW = 512, TH = 256, CY = 128, X0 = 112, X1 = 486, MAXW = 56;
type Ctx = CanvasRenderingContext2D;
type Rand = () => number;

/** Połowa szerokości ciała w punkcie t (0 = nasada ogona, 1 = pysk), w px tekstury. */
function hw(t: number): number {
  const c = 0.6;
  let v: number;
  if (t < c) { const k = (t - c) / c; v = MAXW * Math.pow(Math.max(0, 1 - k * k), 1.3); }
  else { const k = (t - c) / (1 - c); v = MAXW * Math.sqrt(Math.max(0, 1 - k * k)); }
  return t < 0.2 ? Math.max(v, 9) : v;
}

function bodyPath(c: Ctx, scale = 1) {
  c.beginPath();
  for (let i = 0; i <= 90; i++) { const t = i / 90; c.lineTo(X0 + t * (X1 - X0), CY - hw(t) * scale); }
  for (let i = 90; i >= 0; i--) { const t = i / 90; c.lineTo(X0 + t * (X1 - X0), CY + hw(t) * scale); }
  c.closePath();
}

function canvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  return [cv, cv.getContext("2d")!];
}

export function heightTexture(): THREE.Texture {
  const [cv, c] = canvas(TW, TH);
  const img = c.createImageData(TW, TH);
  for (let x = 0; x < TW; x++) {
    const t = (x - X0) / (X1 - X0);
    if (t < 0 || t > 1) continue;
    const w = hw(t);
    for (let y = 0; y < TH; y++) {
      const dy = Math.abs(y - CY);
      if (dy < w) { const i = (y * TW + x) * 4; img.data[i] = Math.sqrt(1 - (dy / w) ** 2) * 255; img.data[i + 3] = 255; }
    }
  }
  c.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function blob(c: Ctx, r: Rand, x: number, y: number, rad: number, col: string) {
  const R = (a: number, b: number) => a + (b - a) * r();
  c.fillStyle = col;
  const n = 5 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    c.beginPath();
    c.ellipse(x + R(-rad, rad) * 0.6, y + R(-rad, rad) * 0.45, rad * R(0.45, 0.85), rad * R(0.4, 0.7), R(0, 3), 0, 6.283);
    c.fill();
  }
}

function scales(c: Ctx, col: string, alpha: number) {
  c.strokeStyle = col;
  c.globalAlpha = alpha;
  c.lineWidth = 1.2;
  for (let x = X0 + 40, row = 0; x < X1 - 55; x += 10, row++) {
    for (let y = CY - 60 + (row % 2) * 5; y < CY + 62; y += 10) { c.beginPath(); c.arc(x, y, 6.5, -1.9, 1.9); c.stroke(); }
  }
  c.globalAlpha = 1;
}

function fin(c: Ctx, col: string, cx: number, cy: number, rx: number, ry: number, rot: number) {
  c.save();
  c.translate(cx, cy);
  c.rotate(rot);
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(0, 0, rx, ry, 0, 0, 6.283);
  c.fill();
  c.strokeStyle = "rgba(255,255,255,.28)";
  c.lineWidth = 1;
  for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(rx * 0.85, 0); c.lineTo(-rx * 0.95, i * ry * 0.2); c.stroke(); }
  c.restore();
}

function fill(c: Ctx, style: string | CanvasGradient) {
  c.fillStyle = style;
  c.fillRect(0, 0, TW, TH);
}

function sideGradient(c: Ctx, edge: string, mid: string) {
  const g = c.createLinearGradient(0, CY - 56, 0, CY + 56);
  g.addColorStop(0, edge);
  g.addColorStop(0.5, mid);
  g.addColorStop(1, edge);
  return g;
}

type KindDef = { name: string; fin: string; metal: number; paint: (c: Ctx, r: Rand) => void };
const R = (r: Rand, a: number, b: number) => a + (b - a) * r();

export const KOI_KINDS = {
  kohaku: { name: "Kohaku", fin: "rgba(250,246,238,.42)", metal: 0.1, paint(c, r) {
    fill(c, "#f3eee4");
    const k = 2 + Math.floor(r() * 3);
    for (let i = 0; i < k; i++) blob(c, r, R(r, 170, 430), CY + R(r, -14, 14), R(r, 26, 42), "#cf2f1c");
    if (r() < 0.5) blob(c, r, 448, CY, 22, "#cf2f1c");
    scales(c, "#000", 0.05);
  } },
  sanke: { name: "Sanke", fin: "rgba(248,244,236,.42)", metal: 0.1, paint(c, r) {
    fill(c, "#f2ede3");
    for (let i = 0; i < 3; i++) blob(c, r, R(r, 180, 430), CY + R(r, -12, 12), R(r, 24, 38), "#cd2d1d");
    for (let i = 0; i < 6; i++) blob(c, r, R(r, 150, 400), CY + R(r, -38, 38), R(r, 7, 14), "#141414");
    scales(c, "#000", 0.05);
  } },
  showa: { name: "Showa", fin: "rgba(236,232,226,.42)", metal: 0.15, paint(c, r) {
    fill(c, "#19181b");
    for (let i = 0; i < 3; i++) blob(c, r, R(r, 170, 440), CY + R(r, -14, 14), R(r, 24, 36), "#cc2e1e");
    for (let i = 0; i < 3; i++) blob(c, r, R(r, 150, 420), CY + R(r, -30, 30), R(r, 16, 26), "#efe9df");
    blob(c, r, R(r, 300, 420), CY + R(r, -20, 20), R(r, 14, 20), "#19181b");
    scales(c, "#fff", 0.05);
  } },
  tancho: { name: "Tancho", fin: "rgba(250,246,238,.42)", metal: 0.12, paint(c) {
    fill(c, "#f4f0e7");
    c.fillStyle = "#d0301e";
    c.beginPath();
    c.arc(436, CY, 19, 0, 6.283);
    c.fill();
    scales(c, "#000", 0.05);
  } },
  ogon: { name: "Ogon", fin: "rgba(240,196,84,.42)", metal: 1.0, paint(c) {
    fill(c, sideGradient(c, "#b98520", "#f8d775"));
    scales(c, "#7a5410", 0.18);
  } },
  chagoi: { name: "Chagoi", fin: "rgba(150,100,55,.42)", metal: 0.35, paint(c) {
    fill(c, sideGradient(c, "#6b4322", "#9a683a"));
    scales(c, "#3b230f", 0.55);
  } },
  asagi: { name: "Asagi", fin: "rgba(225,110,60,.42)", metal: 0.2, paint(c) {
    fill(c, "#c8562f");
    c.fillStyle = "#7d95a8";
    bodyPath(c, 0.72);
    c.fill();
    c.fillStyle = "#dfe3e2";
    c.fillRect(428, 0, 80, TH);
    scales(c, "#e8eef2", 0.4);
  } },
} satisfies Record<string, KindDef>;

export type KoiKind = keyof typeof KOI_KINDS;

export function koiTexture(kind: KoiKind, r: Rand): THREE.Texture {
  const [cv, c] = canvas(TW, TH);
  const K: KindDef = KOI_KINDS[kind];
  // płetwy pod ciałem
  c.fillStyle = K.fin;
  c.beginPath();
  c.moveTo(X0 + 10, CY - 9);
  c.bezierCurveTo(X0 - 30, CY - 22, 46, CY - 74, 12, CY - 82);
  c.quadraticCurveTo(54, CY - 30, 46, CY);
  c.quadraticCurveTo(54, CY + 30, 12, CY + 82);
  c.bezierCurveTo(46, CY + 74, X0 - 30, CY + 22, X0 + 10, CY + 9);
  c.closePath();
  c.fill();
  c.strokeStyle = "rgba(255,255,255,.25)";
  c.lineWidth = 1;
  for (let i = -7; i <= 7; i++) { c.beginPath(); c.moveTo(X0 + 4, CY + i * 1.2); c.quadraticCurveTo(70, CY + i * 6, 22, CY + i * 11); c.stroke(); }
  // nasada płetwy przy ciele z przodu, końcówka odchylona do tyłu (w stronę ogona)
  fin(c, K.fin, 347, CY - 67, 36, 19, 0.55);
  fin(c, K.fin, 347, CY + 67, 36, 19, -0.55);
  fin(c, K.fin, 250, CY - 54, 20, 10, 0.5);
  fin(c, K.fin, 250, CY + 54, 20, 10, -0.5);
  // ciało ze wzorem odmiany
  const [pat, p] = canvas(TW, TH);
  K.paint(p, r);
  c.save();
  bodyPath(c);
  c.clip();
  c.drawImage(pat, 0, 0);
  for (const s of [-1, 1]) {
    c.fillStyle = "#121212";
    c.beginPath();
    c.arc(462, CY + s * 24, 3.6, 0, 6.283);
    c.fill();
    c.fillStyle = "rgba(255,255,255,.7)";
    c.beginPath();
    c.arc(463, CY + s * 24 - 1, 1.1, 0, 6.283);
    c.fill();
  }
  c.restore();
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  return tex;
}

export function lilyTexture(flower: boolean): THREE.Texture {
  const [cv, c] = canvas(256, 256);
  c.translate(128, 128);
  const g = c.createRadialGradient(-20, -20, 10, 0, 0, 120);
  g.addColorStop(0, "#6f9a3c");
  g.addColorStop(1, "#2f5a22");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, 0);
  c.arc(0, 0, 118, 0.22, 6.283 - 0.02);
  c.closePath();
  c.fill();
  c.strokeStyle = "rgba(20,45,15,.45)";
  c.lineWidth = 2;
  for (let a = 0.4; a < 6.2; a += 0.42) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 112, Math.sin(a) * 112); c.stroke(); }
  c.strokeStyle = "rgba(190,220,140,.35)";
  c.lineWidth = 3;
  c.beginPath();
  c.arc(0, 0, 116, 0.24, 6.26);
  c.stroke();
  if (flower) {
    for (let ring = 0; ring < 2; ring++) {
      for (let i = 0; i < 8; i++) {
        c.save();
        c.rotate((i / 8) * 6.283 + ring * 0.39);
        c.fillStyle = ring ? "#f7d6dc" : "#e9a3b3";
        c.beginPath();
        c.ellipse(26 - ring * 8, 0, 30 - ring * 8, 12 - ring * 2, 0, 0, 6.283);
        c.fill();
        c.restore();
      }
    }
    c.fillStyle = "#f2c94c";
    c.beginPath();
    c.arc(0, 0, 10, 0, 6.283);
    c.fill();
  }
  return new THREE.CanvasTexture(cv);
}
