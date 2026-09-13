// Fetches the Thirteen Pearls site from the repository at one pinned commit,
// checks every file against the fingerprint recorded below, and writes them
// into public/ to be served as ordinary static files.
//
// The check runs here, at build time, rather than in the visitor's browser.
// If a file does not match, this exits non-zero, the build fails, and Vercel
// keeps serving the previous deployment — nothing unverified ever goes live.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

const REPO = 't021551-tech/myport';
const REF  = '0d2ecb7575e65b8c8f043aa21fe4b4846c285cd3';

const FILES = {
  'index.html':   'bff27d968f1771e82f0c0432ed253786f10bbe3275db93539565039ca10472c7',
  'styles.css':   '0163af60abf83173723964c5e62f435efc2fe366e2b658c2429496cb61b926fb',
  'scenes.js':    '98b9c9a2982d22333c5368f36131994b2b3e227f72e29747ea0e70e62649302d',
  'three.min.js': '9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2'
};

const OUT = new URL('./public/', import.meta.url);
await mkdir(OUT, { recursive: true });

let failed = 0;

for (const [name, want] of Object.entries(FILES)) {
  const url = `https://raw.githubusercontent.com/${REPO}/${REF}/dives/${name}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`FAIL ${name}: HTTP ${res.status} from ${url}`);
    failed++;
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const got = createHash('sha256').update(buf).digest('hex');
  if (got !== want) {
    console.error(`FAIL ${name}: fingerprint mismatch\n  expected ${want}\n  received ${got}`);
    failed++;
    continue;
  }
  await writeFile(new URL(name, OUT), buf);
  console.log(`ok   ${name}  ${buf.length} bytes  ${got.slice(0, 16)}…`);
}

if (failed) {
  console.error(`\n${failed} file(s) failed verification — refusing to build.`);
  process.exit(1);
}
console.log(`\nAll ${Object.keys(FILES).length} files verified against ${REF.slice(0, 7)}.`);
