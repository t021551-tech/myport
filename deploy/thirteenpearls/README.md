# thirteenpearls.vercel.app — deployment shim

This is what is deployed to the Vercel project `thirteenpearls`. It exists only
because the repository is **not connected** to that project: the Vercel API
refuses this account with `403 — you must re-authenticate to scope
"t021551-3544"`, so the project cannot be git-linked from here and files have to
be uploaded instead.

Uploading 760 KB of site through an API call is not practical, so this shim is
uploaded instead and Vercel assembles the real site during the build:

1. `build.mjs` downloads the four files of `dives/` from `raw.githubusercontent.com`
   at one pinned commit.
2. Each is checked against the SHA-256 recorded in `build.mjs`.
3. Only if all four match are they written to `public/`, which Vercel serves.

If any file fails its check the build exits non-zero, so the deployment fails and
Vercel keeps serving the previous one. Nothing unverified can reach the live site.

What visitors get is the real site: ordinary static files on your own address,
with no third party in the path at runtime and no code injected into the page.

## When the site changes

The commit and the fingerprints in `build.mjs` are pinned, so a new push does
**not** change the live site. After changing anything in `dives/`:

    sha256sum dives/index.html dives/styles.css dives/scenes.js dives/three.min.js

Put the new commit SHA in `REF` and the new hashes in `FILES`, then redeploy this
folder to the `thirteenpearls` project.

## Delete this once Git is connected

In the Vercel dashboard: project `thirteenpearls` → Settings → Git → connect
`t021551-tech/myport`, with the root directory set to `dives`. Every push then
publishes itself, the pinning above stops being a maintenance burden, and this
whole folder should be deleted.
