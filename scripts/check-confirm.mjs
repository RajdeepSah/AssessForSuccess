// Fails the production build while any unconfirmed client detail remains.
// Unconfirmed details are rendered by src/components/Confirm.astro with a data-confirm attribute.
// Usage: node scripts/check-confirm.mjs [distDir]

import fs from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve(process.argv[2] ?? 'dist');

async function* htmlFiles(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const found = new Map(); // note -> Set(pages)
for await (const file of htmlFiles(dist)) {
  const html = await fs.readFile(file, 'utf8');
  const page = '/' + path.relative(dist, file).replace(/index\.html$/, '').replace(/\\/g, '/');
  for (const m of html.matchAll(/data-confirm="([^"]*)"/g)) {
    const note = decode(m[1]);
    if (!found.has(note)) found.set(note, new Set());
    found.get(note).add(page);
  }
  if (/\[CONFIRM/i.test(html)) {
    if (!found.has('[CONFIRM] text')) found.set('[CONFIRM] text', new Set());
    found.get('[CONFIRM] text').add(page);
  }
}

if (found.size === 0) {
  console.log('✔ No unconfirmed details. Safe to publish.');
  process.exit(0);
}

console.error(`✘ ${found.size} unconfirmed detail(s) still on the site. Confirm them with the client (docs/client-checklist.md), then update the content:\n`);
for (const [note, pages] of found) {
  console.error(`  • ${note}\n      ${[...pages].sort().join(', ')}`);
}
process.exit(1);
