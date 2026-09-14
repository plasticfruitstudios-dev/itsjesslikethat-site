# How this site works (for future us)

The site is an [Astro](https://astro.build) project — the same codebase as
plasticfruit.co.uk, re-themed for Jess (pink `#eabcbc`, green accent `#2d6b5b`,
centred logo + nav, "motion" section). Astro is a build tool: it reads the files in
`src/` and generates plain HTML into `dist/`, which is what visitors get. No
JavaScript framework runs in the browser — the output is static HTML, same as the
old hand-written site, just generated instead of copy-pasted.

## Day-to-day

- **Add or edit a project**: edit its file in `src/content/projects/<page>.yaml`
  (credits, titles, image lists — it's all plain text). The build regenerates the
  page, its cards on the grids, its structured data (JSON-LD) and the sitemap.
  Vimeo film pages can carry `video: { uploadDate, duration }` for Google's video
  results.
- **Change which cards appear on the home/stills/motion grids, or their
  sizes/positions**: edit `src/data/grid-*.json`.
- **Site-wide things** (nav, footer, loader, meta tags): `src/layouts/Base.astro`
  and `src/components/` — each exists exactly once. Name, domain and the shared
  Person/WebSite structured data live in `src/lib/site.js`.
- **Styles**: `src/styles/` — `global.css` is shared (colours are the `--bg`,
  `--accent`, `--plate` tokens at the top); the others are per page family.
- **Static files** (videos, stills, fonts, logo, favicon): `public/` — served at the
  same URLs, e.g. `public/videos/x.mp4` → `www.itsjesslikethat.com/videos/x.mp4`.
  Images shown on pages also have a copy under `src/assets/` so the build can make
  AVIF/WebP sizes; keep both in sync when replacing a picture.

## Commands

```
npm install      # once per machine (Node version: see .nvmrc)
npm run dev      # local preview at localhost:4321
npm run build    # generate dist/
python3 scripts/verify-dist.py   # check every link/asset/sitemap entry resolves
git push origin main   # deploy — Cloudflare Pages builds and publishes
```

## Deploy (Cloudflare Pages)

Project `itsjesslikethat` (origin itsjesslikethat.pages.dev), git-connected to this
repo. Build settings (dashboard → the project → Settings → Build):
- Build command: `npm run build`
- Build output directory: `dist`

## Maintenance

Dependencies are pinned by `package-lock.json`. About once a quarter, ask Claude to
run a dependency update and verify the build. If the toolchain ever becomes a
problem: `npm run build` and commit the contents of `dist/` as a plain static site —
that's exactly the architecture the site had before, so it's always a safe exit.

## What the checks cover (and what they don't)

- The Astro build enforces the content schema — a page missing its description or
  alt text fails here. `scripts/verify-dist.py` then checks every
  asset/link/sitemap reference resolves, no file is over Cloudflare Pages' 25 MiB
  limit, and every indexable page carries title/description/canonical. **This
  validates structure, routes and assets — it is not a visual or behavioural test.**
- The migration was verified against the legacy hand-written pages with a
  field-level parity check (titles, every meta/OG/Twitter tag, JSON-LD, headings,
  credits, back links, grid card layout values, sitemap entries) plus side-by-side
  browser screenshots on desktop and iPhone. The pre-Astro HTML is kept locally in
  `_archive/legacy-html/` (not deployed, not in git).
- **`scripts/smoke-live.sh`** tests the live canonical URL matrix (http/https,
  apex → www, .html, trailing slash — one-hop redirects), real-404 behaviour, and
  sitemap/robots. Run it after any deploy that changes routing.
