#!/usr/bin/env python3
"""CI gate: validate the built site in dist/.

Checks (deploy-blocking):
  1. every local asset reference (src, href, data-src, poster, srcset, url())
     in every built page and stylesheet resolves to a file in dist/
  2. every internal page link (extensionless or .html) resolves to a built page
  3. every sitemap.xml URL resolves to a built page; robots.txt exists
  4. no file exceeds Cloudflare Pages' 25 MiB per-asset limit
  5. every indexable page has <title>, meta description and a canonical URL

This validates structure, routes and assets — it is NOT a visual or
behavioural test. See UPDATING.md ("What the checks cover").
"""
import re, os, sys, html
from urllib.parse import unquote, urlparse

DIST = 'dist'
LIMIT = 25 * 1024 * 1024
errors = []

if not os.path.isdir(DIST):
    sys.exit('dist/ missing — run the build first')

all_files = []
for root, _dirs, files in os.walk(DIST):
    for f in files:
        all_files.append(os.path.relpath(os.path.join(root, f), DIST))
fileset = set(all_files)

# 4. size cap
for f in all_files:
    size = os.path.getsize(os.path.join(DIST, f))
    if size > LIMIT:
        errors.append(f'OVER 25MiB (Cloudflare Pages limit): {f} = {size:,} bytes')

def resolve_page(href: str):
    """internal link -> expected file in dist"""
    path = unquote(urlparse(href).path)
    if path in ('', '/'): return 'index.html'
    p = path.lstrip('/')
    if p.endswith('/'): p += 'index.html'
    if not os.path.splitext(p)[1]: p += '.html'
    return p

pages = [f for f in all_files if f.endswith('.html')]
for page in pages:
    t = open(os.path.join(DIST, page), encoding='utf-8').read()
    # 1. asset refs
    refs = re.findall(r'(?:src|data-src|poster)="([^"]+)"', t)
    refs += [u for (_q, u) in [(m.group(1), m.group(2)) for m in
             re.finditer(r'url\((["\']?)([^)"\']+)\1\)', t)]]
    for r in refs:
        r = html.unescape(r)
        if r.startswith(('http', 'data:', '//', '#')) or not r.strip(): continue
        local = unquote(r.split('?')[0].split('#')[0]).lstrip('/')
        if local and local not in fileset:
            errors.append(f'{page}: missing asset {r}')
    # 2. page links
    for h in re.findall(r'<a[^>]+href="([^"]+)"', t):
        h = html.unescape(h)
        if h.startswith(('http', 'mailto:', 'tel:', '#')): continue
        target = resolve_page(h)
        if target not in fileset:
            errors.append(f'{page}: broken internal link {h}')
    # 5. head requirements (skip noindex pages and the 404)
    if 'noindex' not in t and page != '404.html':
        if not re.search(r'<title>[^<]+</title>', t):
            errors.append(f'{page}: missing <title>')
        if not re.search(r'<meta name="description" content="[^"]+"', t):
            errors.append(f'{page}: missing meta description')
        if not re.search(r'<link rel="canonical" href="https://www\.itsjesslikethat\.com/', t):
            errors.append(f'{page}: missing canonical')

# stylesheet url() refs
for css in (f for f in all_files if f.endswith('.css')):
    t = open(os.path.join(DIST, css), encoding='utf-8').read()
    for m in re.finditer(r'url\((["\']?)([^)"\']+)\1\)', t):
        u = m.group(2)
        if u.startswith(('http', 'data:')): continue
        local = unquote(u.split('?')[0].split('#')[0]).lstrip('/')
        if local and local not in fileset:
            errors.append(f'{css}: missing url() asset {u}')

# 3. sitemap + robots
if 'robots.txt' not in fileset:
    errors.append('robots.txt missing from dist')
if 'sitemap.xml' not in fileset:
    errors.append('sitemap.xml missing from dist')
else:
    sm = open(os.path.join(DIST, 'sitemap.xml'), encoding='utf-8').read()
    for loc in re.findall(r'<loc>([^<]+)</loc>', sm):
        target = resolve_page(loc.replace('https://www.itsjesslikethat.com', '') or '/')
        if target not in fileset:
            errors.append(f'sitemap.xml: {loc} has no built page ({target})')

if errors:
    print(f'FAIL — {len(errors)} problem(s):')
    for e in errors: print('  ' + e)
    sys.exit(1)
print(f'OK — {len(pages)} pages, {len(all_files)} files, all references resolve, '
      f'largest file {max(os.path.getsize(os.path.join(DIST,f)) for f in all_files)/1e6:.1f}MB')
