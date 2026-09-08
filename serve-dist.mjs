/**
 * Miniaturni staticni streznik, ki posnema Cloudflare Pages:
 * poskusi datoteko, potem <pot>/index.html, sicer 404.html s statusom 404.
 * `npx serve -s` tega ne zna: vsak neznan naslov vrne index.html z 200,
 * kar je natanko tista napaka, ki jo hocemo loviti.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('./dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const port = Number(process.argv[2] ?? 4322);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
};

// iste glave kot public/_headers, da CSP res testiramo
const headersFile = await readFile(join(root, '_headers'), 'utf8').catch(() => '');
const extra = {};
for (const line of headersFile.split('\n')) {
  const m = line.match(/^\s{2}([A-Za-z-]+):\s*(.+)$/);
  if (m) extra[m[1]] = m[2].trim();
}

createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const safe = normalize(url).split('..').join('');
  const tries = [join(root, safe), join(root, safe, 'index.html')];
  for (const f of tries) {
    try {
      const buf = await readFile(f);
      res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream', ...extra });
      return res.end(buf);
    } catch {}
  }
  const nf = await readFile(join(root, '404.html')).catch(() => Buffer.from('Not found'));
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', ...extra });
  res.end(nf);
}).listen(port, () => console.log(`dist na http://localhost:${port}`));
