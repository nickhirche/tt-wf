/**
 * Vendor-Bundle inkl. Rive-WASM als separate Datei.
 * Absolute WASM-URL per esbuild `publicPath`, damit kein 404 auf Unterpfaden (Netlify usw.).
 *
 * Env: RIVE_WASM_BASE — Basis-URL des Verzeichnisses, in dem vendor.min.js + rive-*.wasm liegen
 *      (mit trailing slash). Default: Produktion unter assets.tiptap.dev/tt-wf/static/.
 */
import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const watch = process.argv.includes('--watch');

const baseRaw =
  process.env.RIVE_WASM_BASE || 'https://assets.tiptap.dev/tt-wf/static/';
const publicPath = baseRaw.endsWith('/') ? baseRaw : `${baseRaw}/`;

const config = {
  absWorkingDir: root,
  entryPoints: [path.join(root, 'js/vendor.js')],
  bundle: true,
  outfile: path.join(root, 'dist/vendor.min.js'),
  minify: !watch,
  sourcemap: true,
  target: 'es2018',
  loader: { '.wasm': 'file' },
  publicPath,
};

if (watch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('[build-vendor] watching… RIVE_WASM_BASE=%s', publicPath);
  await new Promise(() => {});
} else {
  await esbuild.build({ ...config, minify: true });
  console.log('[build-vendor] ok publicPath=%s', publicPath);
}
