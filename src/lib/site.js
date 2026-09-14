// Site identity + structured data, in one place. Every page's JSON-LD graph is
// the shared WebSite + Person nodes followed by that page's own nodes.

export const SITE = 'https://www.itsjesslikethat.com';
export const NAME = 'Jessi Clover Belgrave';
export const PFS = { name: 'Plastic Fruit Studios', url: 'https://plasticfruit.co.uk' };

const PERSON_ID = `${SITE}/#person`;
const WEBSITE_ID = `${SITE}/#website`;

export const abs = (path) => `${SITE}/${path}`;

const shared = [
  {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE}/`,
    name: NAME,
    inLanguage: 'en-GB',
    publisher: { '@id': PERSON_ID },
  },
  {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: NAME,
    alternateName: ['Jessica Clover Belgrave', 'itsjesslikethat'],
    jobTitle: 'Director',
    description: 'London-based director and photographer working across music videos, commercials, editorial and photography.',
    url: `${SITE}/`,
    image: `${SITE}/assets/jessi.jpg`,
    email: 'jessi@plasticfruitstudios.com',
    address: { '@type': 'PostalAddress', addressLocality: 'London', addressCountry: 'GB' },
    worksFor: { '@type': 'Organization', ...PFS },
    knowsAbout: ['Music video direction', 'Commercial direction', 'Editorial photography', 'Artist branding'],
    sameAs: ['https://www.instagram.com/itsjesslikethat', 'https://vimeo.com/plasticfruit', PFS.url],
  },
];

export const graph = (nodes) => ({ '@context': 'https://schema.org', '@graph': [...shared, ...nodes] });

export const breadcrumbs = (...crumbs) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [['Home', ''], ...crumbs].map(([name, path], i) => ({
    '@type': 'ListItem', position: i + 1, name, item: abs(path),
  })),
});

/** home + section listing pages (motion, stills) */
export const collectionNodes = ({ path, title, description, primaryImage, crumbs = true }) => [
  {
    '@type': 'CollectionPage',
    '@id': `${abs(path)}#webpage`,
    url: abs(path),
    name: title,
    description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': PERSON_ID },
    ...(primaryImage ? { primaryImageOfPage: abs(primaryImage) } : {}),
    inLanguage: 'en-GB',
  },
  ...(crumbs ? [breadcrumbs()] : []),
];

export const profileNodes = ({ path, title, description }) => [
  {
    '@type': 'ProfilePage',
    '@id': `${abs(path)}#webpage`,
    url: abs(path),
    name: title,
    description,
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: { '@id': PERSON_ID },
    inLanguage: 'en-GB',
  },
  breadcrumbs(),
];

/** project pages: a video page (film/player kinds) or an image gallery (strip) */
export function projectNodes(slug, d) {
  const url = abs(slug);
  const name = d.pageTitle.replace(` | ${NAME}`, '');
  const ogImage = abs(d.ogImage);
  if (d.kind === 'strip') {
    return [
      {
        '@type': 'ImageGallery',
        '@id': `${url}#webpage`,
        url,
        name: d.pageTitle,
        description: d.description,
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': PERSON_ID },
        primaryImageOfPage: ogImage,
        inLanguage: 'en-GB',
        image: d.media.filter((m) => m.type === 'image').map((m) => ({
          '@type': 'ImageObject',
          contentUrl: abs(m.src),
          creator: { '@id': PERSON_ID },
          creditText: NAME,
          copyrightNotice: `© ${NAME}`,
          license: abs('info'),
        })),
      },
      breadcrumbs(['Stills', 'stills'], [name, slug]),
    ];
  }
  return [
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: d.pageTitle,
      description: d.description,
      isPartOf: { '@id': WEBSITE_ID },
      primaryImageOfPage: ogImage,
      inLanguage: 'en-GB',
    },
    {
      '@type': 'VideoObject',
      '@id': `${url}#video`,
      name,
      description: d.description,
      thumbnailUrl: ogImage,
      url,
      director: { '@id': PERSON_ID },
      creator: { '@id': PERSON_ID },
      productionCompany: { '@type': 'Organization', ...PFS },
      isFamilyFriendly: true,
      inLanguage: 'en',
      ...(d.video ? { uploadDate: d.video.uploadDate, duration: d.video.duration } : {}),
      ...(d.video && d.vimeo ? { embedUrl: `https://player.vimeo.com/video/${d.vimeo.id}` } : {}),
    },
    breadcrumbs(['Motion', 'motion'], [name, slug]),
  ];
}
