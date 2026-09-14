import { defineConfig } from 'astro/config';

// build.format 'file' emits foo.html (not foo/index.html) so every URL on the
// live Cloudflare Pages site stays byte-identical to the previous hand-written site.
export default defineConfig({
  site: 'https://www.itsjesslikethat.com',
  trailingSlash: 'never',
  build: {
    format: 'file',
    // self-contained pages: no linked-stylesheet swap during view transitions
    inlineStylesheets: 'always',
  },
  // preload pages as their links scroll into view — navigation feels instant
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
