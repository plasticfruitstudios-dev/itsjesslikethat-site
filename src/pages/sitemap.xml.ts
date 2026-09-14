import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import gridIndex from '../data/grid-index.json';
import gridMotion from '../data/grid-motion.json';
import gridStills from '../data/grid-stills.json';
import { NAME, abs } from '../lib/site.js';

// Same URL set, order and extensions (image + video) as the hand-maintained
// legacy sitemap.xml: home, the two sections, info, then every project page in
// grid order. 404 stays out. Served at /sitemap.xml, which GSC already has.
export const GET: APIRoute = async () => {
  const projects = Object.fromEntries((await getCollection('projects')).map((p) => [p.id, p.data]));
  // Bump when content meaningfully changes; a per-build timestamp would restamp
  // every URL each deploy and devalue the lastmod signal in GSC.
  const lastmod = '2026-07-14';
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const gridImages = (grid: typeof gridIndex) =>
    grid.rows.flatMap((r) => r.cards).filter((c) => c.media.type === 'image').map((c) => c.media.src);
  const isoSeconds = (d: string) => {
    const m = /^PT(?:(\d+)M)?(?:(\d+)S)?$/.exec(d)!;
    return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
  };

  type Entry = { path: string; priority: string; images?: string[]; imageTitle?: string; video?: string };
  const entries: Entry[] = [
    { path: '', priority: '1.0', images: gridImages(gridIndex), imageTitle: NAME },
    { path: 'motion', priority: '0.9' },
    { path: 'stills', priority: '0.9', images: gridImages(gridStills), imageTitle: NAME },
    { path: 'info', priority: '0.9' },
  ];
  const slugs = [...new Set([...gridMotion.rows, ...gridStills.rows].flatMap((r) => r.cards.map((c) => c.slug)))];
  for (const slug of Object.keys(projects)) if (!slugs.includes(slug)) slugs.push(slug);
  for (const slug of slugs) {
    const d = projects[slug];
    const name = d.pageTitle.replace(` | ${NAME}`, '');
    const images = d.media.filter((m) => m.type === 'image').map((m) => m.src);
    let video;
    if (d.video && d.vimeo) {
      video =
        `    <video:video>\n` +
        `      <video:thumbnail_loc>${abs(d.ogImage)}</video:thumbnail_loc>\n` +
        `      <video:title>${esc(name)}</video:title>\n` +
        `      <video:description>${esc(name)}. Directed by ${NAME}.</video:description>\n` +
        `      <video:player_loc>https://player.vimeo.com/video/${d.vimeo.id}</video:player_loc>\n` +
        `      <video:duration>${isoSeconds(d.video.duration)}</video:duration>\n` +
        `      <video:publication_date>${d.video.uploadDate}T00:00:00+00:00</video:publication_date>\n` +
        `      <video:family_friendly>yes</video:family_friendly>\n` +
        `    </video:video>\n`;
    }
    entries.push({ path: slug, priority: '0.7', images, imageTitle: name, video });
  }

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n' +
    '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n' +
    entries.map((e) =>
      `  <url>\n    <loc>${abs(e.path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${e.priority}</priority>\n` +
      (e.images ?? []).map((src) =>
        `    <image:image>\n      <image:loc>${abs(src)}</image:loc>\n      <image:title>${esc(e.imageTitle!)}</image:title>\n    </image:image>\n`).join('') +
      (e.video ?? '') +
      '  </url>'
    ).join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
