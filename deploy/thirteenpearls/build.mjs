// Assembles thirteenpearls.vercel.app from the repository.
//
// Downloads the four files of dives/ at one pinned commit, checks each against
// the SHA-256 recorded below, and writes them into public/ only if every one
// matches. Unverified bytes are never written.
//
// This deliberately never exits non-zero. A failed build would leave whatever
// was previously live in place and tell nobody why, and the Vercel API refuses
// this account, so the build log cannot be read. Instead, a failure publishes a
// page that says what went wrong. public/build-report.txt is written either way.
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

const log = [];
const say = (line) => { log.push(line); console.log(line); };

say(`Thirteen Pearls build`);
say(`when      ${new Date().toISOString()}`);
say(`node      ${process.version}`);
say(`platform  ${process.platform}`);
say(`cwd       ${process.cwd()}`);
say(`out       ${OUT.pathname}`);
say(`source    ${REPO} @ ${REF}`);
say('');

const fetched = {};
const problems = [];

for (const [name, want] of Object.entries(FILES)) {
  const url = `https://raw.githubusercontent.com/${REPO}/${REF}/dives/${name}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const got = createHash('sha256').update(buf).digest('hex');
    if (got !== want) throw new Error(`fingerprint mismatch\n            wanted ${want}\n            got    ${got}`);
    fetched[name] = buf;
    say(`ok    ${name.padEnd(13)} ${String(buf.length).padStart(7)} bytes  ${got.slice(0, 16)}`);
  } catch (err) {
    problems.push(`${name}: ${err.message}`);
    say(`FAIL  ${name.padEnd(13)} ${err.message}`);
  }
}

say('');

if (problems.length === 0) {
  for (const [name, buf] of Object.entries(fetched)) {
    await writeFile(new URL(name, OUT), buf);
  }
  say(`PUBLISHED  all ${Object.keys(FILES).length} files verified and written.`);
} else {
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  await writeFile(new URL('index.html', OUT), `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Thirteen Pearls — not published</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;background:#02131B;color:#DCEAEC;
       font:400 15px/1.7 ui-monospace,Menlo,Consolas,monospace;padding:2rem 1.2rem}
  main{max-width:46rem;margin:0 auto}
  h1{font:600 1.3rem/1.3 system-ui,sans-serif;color:#D8A24A;margin:0 0 1rem}
  p{color:#8FADB6;font-family:system-ui,sans-serif;max-width:60ch}
  pre{background:#04202B;border:1px solid #143A47;padding:1rem;
      overflow-x:auto;white-space:pre-wrap;word-break:break-word;font-size:.82rem}
  a{color:#4FBFB0}
</style></head><body><main>
<h1>The site was not published</h1>
<p>The files could not be verified against their recorded fingerprints, so nothing
   was published rather than publishing something unchecked. The full build report
   is below. The site itself is unaffected and lives at
   <a href="https://github.com/${REPO}/tree/${REF}/dives">github.com/${REPO}</a>.</p>
<pre>${esc(log.join('\n'))}</pre>
</main></body></html>
`);
  say(`NOT PUBLISHED  ${problems.length} file(s) failed. A report page was published instead.`);
}

await writeFile(new URL('build-report.txt', OUT), log.join('\n') + '\n');
process.exit(0);
