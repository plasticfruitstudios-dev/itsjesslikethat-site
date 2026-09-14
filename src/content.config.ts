import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One entry per project page. The schema is the guard-rail the legacy site never
// had: a page missing its description, og image, or media alt text fails the build.
const projects = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
  schema: z.object({
    /** h1 artist line, plain text (entities decoded) */
    title: z.string().min(1),
    /** .title line under the artist */
    subtitle: z.string().optional(),
    kind: z.enum(['film', 'player', 'strip']),
    /** film pages: VideoObject details for structured data (ISO date, ISO 8601 duration) */
    video: z.object({
      uploadDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      duration: z.string().regex(/^PT(\d+M)?(\d+S)?$/),
    }).optional(),
    /** exact <title> text of the page */
    pageTitle: z.string().min(1),
    description: z.string().min(1),
    /** og:title when it differs from pageTitle */
    ogTitle: z.string().optional(),
    /** repo-relative path, e.g. stills/web/foo-large.jpg */
    ogImage: z.string().min(1),
    credits: z.array(z.object({
      text: z.string(),
      /** legacy style="margin-top:20px" separator before this line */
      gap: z.boolean().optional(),
    })).default([]),
    /** film pages: the main Vimeo player */
    vimeo: z.object({
      id: z.string(),
      /** CSS aspect-ratio value, e.g. "4 / 3" */
      aspect: z.string(),
      /** iframe title attribute */
      title: z.string(),
      /** query string after the id, kept verbatim for parity */
      query: z.string().default('title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479'),
    }).optional(),
    /** legacy nests the main Vimeo player inside .player-stack on some pages */
    stackPlayer: z.boolean().default(false),
    /** "watch on vimeo ↗" style external link */
    ext: z.object({ href: z.string(), label: z.string() }).optional(),
    /** strip images / player-stack media, in page order */
    media: z.array(z.object({
      type: z.enum(['image', 'video', 'iframe', 'instagram']),
      src: z.string(),
      alt: z.string().optional(),
      loading: z.enum(['eager', 'lazy']).optional(),
      poster: z.string().optional(),
      /** extra class on the .media wrapper, e.g. "ratio169" or "portrait" */
      klass: z.string().optional(),
      /** inline style on the wrapper, kept verbatim where legacy had one */
      style: z.string().optional(),
      /** iframe title attribute */
      title: z.string().optional(),
    })).default([]),
  }).superRefine((val, ctx) => {
    if (val.kind === 'film' && !val.vimeo)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'film pages need a vimeo block' });
    for (const m of val.media)
      if (m.type === 'image' && !m.alt)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `image ${m.src} needs alt text` });
  }),
});

export const collections = { projects };
