/**
 * Membuat versi pratinjau NoBaku dalam SATU berkas HTML (JS, CSS, dan font digabung)
 * untuk dibagikan lewat halaman yang tidak mengizinkan berkas terpisah/service worker
 * (mis. Artifact claude.ai). Fitur & logika sama dengan build biasa.
 *
 * Pakai:  npm run build:preview   → hasil: preview/nobaku-preview.html
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist-preview');

// Panggil Vite langsung dengan Node yang sedang berjalan (tidak bergantung pada npx).
execSync(`"${process.execPath}" "${join(root, 'node_modules', 'vite', 'bin', 'vite.js')}" build --outDir "${out}" --emptyOutDir`, {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VITE_PREVIEW_EMBED: '1' },
});

const html = readFileSync(join(out, 'index.html'), 'utf8');
const cssHref = html.match(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"/)[1];
const jsSrc = html.match(/<script type="module"[^>]*src="\.\/([^"]+)"/)[1];

const MIME = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png' };
const cssDir = dirname(join(out, cssHref));
const css = readFileSync(join(out, cssHref), 'utf8').replace(/url\(\.?\/?([^)'"]+\.(woff2|woff|svg|png))\)/g, (m, file) => {
  const data = readFileSync(join(cssDir, file)).toString('base64');
  return `url(data:${MIME[extname(file)]};base64,${data})`;
});
const js = readFileSync(join(out, jsSrc), 'utf8').replace(/<\/script/gi, '<\\/script');
const favicon = readFileSync(join(root, 'public/icons/favicon-64.png')).toString('base64');

const page = `<title>NoBaku</title>
<meta name="description" content="Belajar bentuk baku (notasi ilmiah) langkah demi langkah untuk siswa SMP.">
<link rel="icon" href="data:image/png;base64,${favicon}">
<style>${css}</style>
<div id="root"></div>
<noscript>NoBaku membutuhkan JavaScript.</noscript>
<script type="module">${js}</script>
`;

const dest = join(root, 'preview', 'nobaku-preview.html');
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, page);
console.log(`Pratinjau satu berkas: ${dest} (${(page.length / 1024).toFixed(0)} KB)`);
