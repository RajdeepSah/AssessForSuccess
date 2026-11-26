// Rebuilds the Assess for Success logo as vector files, then generates favicons
// and social-share images from it.
//
// Sources:
//   design/legacy-site-assets/  original files from a4stopeka.com
//     logo1.png              108x60 raster logo (the reference we match)
//     safari-pinned-tab.svg  vector trace of the A4S monogram
//   design/fonts/             Roboto Condensed (closest match to the wordmark),
//                             Figtree and Barlow Condensed (site typefaces)
//
// Usage:  node scripts/build-brand.mjs [--compare <out.png>]
// The rebuilt logo is a stand-in until the client supplies the original vector file.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => path.join(root, ...p);

const C = {
  charcoal: '#333333',
  plumTop: '#7D277D',
  plumBottom: '#4D2A7C',
  plum: '#63297C',
  plum900: '#3D1A4D',
  paper: '#FBF9F6',
  ink: '#2A2A2E',
  muted: '#5C5862',
  gold: '#F2B33D',
  white: '#FFFFFF',
  lavender: '#E9D8F0',
};

// ---------------------------------------------------------------- helpers

async function loadFont(file) {
  const buf = await fs.readFile(at('design/fonts', file));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/** Serializes path commands ourselves: opentype.js's toPathData() optimizer can emit NaN. */
function pathData(p) {
  const n = (v) => String(Math.round(v * 100) / 100);
  let d = '';
  for (const c of p.commands) {
    if (c.type === 'M' || c.type === 'L') d += `${c.type}${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'Q') d += `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'C') d += `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'Z') d += 'Z';
  }
  return d;
}

/** Lays text out glyph by glyph with kerning (opentype.js's shaper chokes on some fonts). */
function layout(font, text, size, x = 0, y = 0, tracking = 0) {
  const scale = size / font.unitsPerEm;
  let pen = x;
  let prev = null;
  let d = '';
  const bb = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    if (prev) {
      const k = font.getKerningValue(prev, g);
      if (Number.isFinite(k)) pen += k * scale;
    }
    const gp = g.getPath(pen, y, size);
    const b = gp.getBoundingBox();
    if (Number.isFinite(b.x1)) {
      bb.x1 = Math.min(bb.x1, b.x1);
      bb.y1 = Math.min(bb.y1, b.y1);
      bb.x2 = Math.max(bb.x2, b.x2);
      bb.y2 = Math.max(bb.y2, b.y2);
    }
    d += pathData(gp);
    pen += g.advanceWidth * scale + tracking;
    prev = g;
  }
  return { d, bb, width: pen - x };
}

/** Text whose ink box has its top-left at (left, top) and exactly `height` tall. */
function fitText(font, text, left, top, height, tracking = 0) {
  const probe = layout(font, text, 1000, 0, 0, tracking * (1000 / 100));
  const s = height / (probe.bb.y2 - probe.bb.y1);
  const size = 1000 * s;
  return layout(font, text, size, left - probe.bb.x1 * s, top - probe.bb.y1 * s, tracking * (size / 100));
}

/** Text with its baseline at y and a given font size; returns path data and width. */
function line(font, text, size, x, y, tracking = 0) {
  return layout(font, text, size, x, y, tracking);
}

async function alphaBBox(svg, px) {
  const { data, info } = await sharp(Buffer.from(svg)).resize(px, px).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 127) {
        if (x < x1) x1 = x;
        if (y < y1) y1 = y;
        if (x > x2) x2 = x;
        if (y > y2) y2 = y;
      }
    }
  }
  return { x1, y1, x2: x2 + 1, y2: y2 + 1, w: info.width };
}

function icoFromPngs(pngs) {
  // ICO container holding PNG-compressed images (supported by all current browsers).
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, buf }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt8(0, e + 2);
    header.writeUInt8(0, e + 3);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(buf.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += buf.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.buf)]);
}

const gradient = (id) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0.17" stop-color="${C.plumTop}"/><stop offset="0.87" stop-color="${C.plumBottom}"/></linearGradient>`;

// ---------------------------------------------------------------- monogram

const traceSvg = await fs.readFile(at('design/legacy-site-assets/safari-pinned-tab.svg'), 'utf8');
const traceD = [...traceSvg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]).join(' ');
const tb = await alphaBBox(`<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000" viewBox="0 0 100 100"><path d="${traceD}"/></svg>`, 2000);
const unit = tb.w / 100;
const mark = { x: tb.x1 / unit, y: tb.y1 / unit, w: (tb.x2 - tb.x1) / unit, h: (tb.y2 - tb.y1) / unit };
const markViewBox = `${mark.x.toFixed(2)} ${mark.y.toFixed(2)} ${mark.w.toFixed(2)} ${mark.h.toFixed(2)}`;

// ---------------------------------------------------------------- logo (10x the original 108x60 grid)

const roboto = await loadFont('roboto-condensed-600.woff');
// Ink boxes measured from logo1.png: ASSESS (36,0)-(95,13), FOR (36,15)-(53,22), SUCCESS (36,24)-(107,37), mark (0,0)-(39,59)
const wASSESS = fitText(roboto, 'ASSESS', 360, 0, 140);
const wFOR = fitText(roboto, 'FOR', 360, 150, 80);
const wSUCCESS = fitText(roboto, 'SUCCESS', 360, 240, 140);
const ms = 600 / mark.h; // monogram scaled to the full logo height
const markTransform = `matrix(${ms.toFixed(4)} 0 0 ${ms.toFixed(4)} ${(-mark.x * ms).toFixed(2)} ${(-mark.y * ms).toFixed(2)})`;
const logoW = Math.ceil(Math.max(wSUCCESS.bb.x2, wASSESS.bb.x2, mark.w * ms));

function logoSvg({ id, markFill, word, forFill, title = 'Assess for Success' }) {
  const defs = markFill === 'gradient' ? `<defs>${gradient(id)}</defs>` : '';
  const mf = markFill === 'gradient' ? `url(#${id})` : markFill;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${logoW} 600" width="${logoW}" height="600" role="img" aria-labelledby="${id}-t"><title id="${id}-t">${title}</title>${defs}<path fill="${mf}" transform="${markTransform}" d="${traceD}"/><path fill="${word}" d="${wASSESS.d}${wSUCCESS.d}"/><path fill="${forFill}" d="${wFOR.d}"/></svg>`;
}

const logo = logoSvg({ id: 'a4s-logo', markFill: 'gradient', word: C.charcoal, forFill: C.plumTop });
const logoReversed = logoSvg({ id: 'a4s-logo-rev', markFill: C.white, word: C.white, forFill: C.lavender });
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${markViewBox}" role="img" aria-labelledby="a4s-mark-t"><title id="a4s-mark-t">A4S</title><defs>${gradient('a4s-mark')}</defs><path fill="url(#a4s-mark)" d="${traceD}"/></svg>`;

await fs.mkdir(at('src/assets/brand'), { recursive: true });
await fs.writeFile(at('src/assets/brand/logo.svg'), logo);
await fs.writeFile(at('src/assets/brand/logo-reversed.svg'), logoReversed);
await fs.writeFile(at('src/assets/brand/mark.svg'), markSvg);
await fs.writeFile(
  at('src/data/brand.ts'),
  `// Generated by scripts/build-brand.mjs: the A4S monogram traced from the original logo.\n` +
    `export const MARK_VIEWBOX = '${markViewBox}';\n` +
    `export const MARK_PATH = '${traceD}';\n` +
    `export const LOGO_SIZE = { width: ${logoW}, height: 600 } as const;\n`,
);

// ---------------------------------------------------------------- favicons

const pad = mark.h * 0.06;
const sq = mark.h + pad * 2;
const sqX = mark.x + mark.w / 2 - sq / 2;
const sqY = mark.y - pad;
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sqX.toFixed(2)} ${sqY.toFixed(2)} ${sq.toFixed(2)} ${sq.toFixed(2)}"><defs>${gradient('g')}</defs><style>@media (prefers-color-scheme: dark){path{fill:#E9C9F2}}</style><path fill="url(#g)" d="${traceD}"/></svg>`;
await fs.writeFile(at('public/favicon.svg'), faviconSvg);

const tile = async (size, scale, bg) => {
  const inner = Math.round(size * scale);
  const icon = await sharp(Buffer.from(markSvg)).resize({ height: inner }).png().toBuffer();
  const meta = await sharp(icon).metadata();
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: icon, left: Math.round((size - meta.width) / 2), top: Math.round((size - meta.height) / 2) }])
    .png()
    .toBuffer();
};
const clear = { r: 0, g: 0, b: 0, alpha: 0 };
await fs.writeFile(at('public/favicon.ico'), icoFromPngs([
  { size: 16, buf: await tile(16, 0.94, clear) },
  { size: 32, buf: await tile(32, 0.94, clear) },
  { size: 48, buf: await tile(48, 0.94, clear) },
]));
await fs.writeFile(at('public/apple-touch-icon.png'), await tile(180, 0.7, C.paper));
await fs.writeFile(at('public/icon-192.png'), await tile(192, 0.62, C.paper));
await fs.writeFile(at('public/icon-512.png'), await tile(512, 0.62, C.paper));
await fs.writeFile(
  at('public/site.webmanifest'),
  JSON.stringify(
    {
      name: 'Assess for Success',
      short_name: 'A4S',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
      theme_color: C.plum,
      background_color: C.paper,
      display: 'browser',
    },
    null,
    2,
  ) + '\n',
);

// ---------------------------------------------------------------- social share images (1200x630)

const fig800 = await loadFont('figtree-800.woff');
const fig700 = await loadFont('figtree-700.woff');
const fig500 = await loadFont('figtree-500.woff');
const barlow = await loadFont('barlow-condensed-700.woff');

const logoInner = logo.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '').replace(/<title[^>]*>.*?<\/title>/, '');
const placeLogo = (x, y, h) => `<g transform="translate(${x} ${y}) scale(${h / 600})">${logoInner}</g>`;

function ogDefault() {
  const h1 = line(fig800, 'Assessments, treatment, and education', 58, 80, 352);
  const h2 = line(fig800, 'for adults and youth in Topeka', 58, 80, 424);
  const sub = line(fig500, 'Courts, including juvenile court, can refer  ·  (785) 338-8900', 30, 80, 500);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="${C.paper}"/>
<g opacity="0.07" transform="translate(860 -40) scale(${720 / mark.h}) translate(${-mark.x} ${-mark.y})"><path fill="${C.plum}" d="${traceD}"/></g>
${placeLogo(80, 72, 168)}
<path fill="${C.ink}" d="${h1.d}${h2.d}"/>
<path fill="${C.muted}" d="${sub.d}"/>
<rect y="606" width="1200" height="24" fill="${C.plum}"/>
</svg>`;
}

function ogSports() {
  const title = line(barlow, 'A4S SPORTS', 150, 80, 380, 1.5);
  const h2 = line(fig700, 'Teams  ·  One-on-one training  ·  Mentoring', 44, 80, 452);
  const sub = line(fig500, 'Youth sports from Assess for Success  ·  Topeka, Kansas', 30, 80, 512);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="${C.paper}"/>
<g opacity="0.16" transform="translate(860 -40) scale(${720 / mark.h}) translate(${-mark.x} ${-mark.y})"><path fill="${C.gold}" d="${traceD}"/></g>
${placeLogo(80, 64, 120)}
<path fill="${C.plum}" d="${title.d}"/>
<path fill="${C.ink}" d="${h2.d}"/>
<path fill="${C.muted}" d="${sub.d}"/>
<rect y="606" width="1200" height="24" fill="${C.gold}"/>
</svg>`;
}

await fs.mkdir(at('public/og'), { recursive: true });
await sharp(Buffer.from(ogDefault())).png().toFile(at('public/og/default.png'));
await sharp(Buffer.from(ogSports())).png().toFile(at('public/og/sports.png'));

// ---------------------------------------------------------------- fidelity check vs the original

const ref = await sharp(at('design/legacy-site-assets/logo1.png')).flatten({ background: '#ffffff' }).raw().toBuffer({ resolveWithObject: true });
const W = ref.info.width, H = ref.info.height;
const viewW = 1080; // the original's 108px grid at 10x
const cmpSvg = logo.replace(/viewBox="[^"]*" width="\d+" height="600"/, `viewBox="0 0 ${viewW} 600" width="${W}" height="${H}"`);
const mine = await sharp(Buffer.from(cmpSvg)).flatten({ background: '#ffffff' }).raw().toBuffer({ resolveWithObject: true });
let diff = 0;
for (let i = 0; i < ref.data.length; i++) diff += Math.abs(ref.data[i] - mine.data[i]);
const mae = diff / ref.data.length;
console.log(`monogram trace bbox: ${markViewBox} (rendered ${(mark.w * ms).toFixed(0)}x600; original 400x600)`);
console.log(`logo width: ${logoW} (original grid 1080)`);
console.log(`pixel MAE vs logo1.png: ${mae.toFixed(2)} / 255`);

const cmpIdx = process.argv.indexOf('--compare');
if (cmpIdx > -1) {
  const out = process.argv[cmpIdx + 1];
  const S = 8;
  const a = await sharp(at('design/legacy-site-assets/logo1.png')).flatten({ background: '#ffffff' }).resize(W * S, H * S, { kernel: 'nearest' }).png().toBuffer();
  const b = await sharp(Buffer.from(cmpSvg.replace(`width="${W}" height="${H}"`, `width="${W * S}" height="${H * S}"`))).flatten({ background: '#ffffff' }).png().toBuffer();
  const overlay = await sharp(Buffer.from(cmpSvg.replace(`width="${W}" height="${H}"`, `width="${W * S}" height="${H * S}"`).replace(/fill="[^"]*"/g, 'fill="rgba(255,0,0,0.45)"').replace(/<defs>.*?<\/defs>/, ''))).png().toBuffer();
  const gap = 24;
  await sharp({ create: { width: W * S * 3 + gap * 2, height: H * S, channels: 3, background: '#ffffff' } })
    .composite([
      { input: a, left: 0, top: 0 },
      { input: b, left: W * S + gap, top: 0 },
      { input: a, left: (W * S + gap) * 2, top: 0 },
      { input: overlay, left: (W * S + gap) * 2, top: 0 },
    ])
    .png()
    .toFile(out);
  console.log('comparison written to', out);
}
