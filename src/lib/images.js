// Maps the content model's public-rooted image paths (e.g. "stills/web/foo.jpg")
// to optimizable imports under src/assets. Files also remain in public/ so the
// original URLs (og:image, previously indexed images) keep resolving.
const modules = import.meta.glob('../assets/**/*.{jpg,jpeg,png,JPG,JPEG}', { eager: true, import: 'default' });

export function imageFor(path) {
  return modules['../assets/' + path] ?? null;
}
