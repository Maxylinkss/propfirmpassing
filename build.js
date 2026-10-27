#!/usr/bin/env node
/**
 * Builds propfirmpassing.space — a single-page site about prop firm passing services.
 *
 * Sources:
 *   content/index.html            the page body, with {{TOKENS}} for generated blocks
 *   data/snapshot-<date>.json     the dated price and rule figures used in the tables
 *   data/faq.json                 questions and answers, rendered visibly AND as FAQPage schema
 *   assets/style.css              stylesheet, copied into the build
 *
 * Output: docs/ (GitHub Pages convention). Nothing in docs/ is hand-written.
 *
 * Performance rules this build follows: no JavaScript, no web fonts, no image
 * requests (every illustration is inline SVG), one stylesheet.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const CONTENT = path.join(ROOT, 'content', 'index.html');
const OUT = path.join(ROOT, 'docs');

const TELEGRAM = {
  handle: '@voraspas',
  url: 'https://t.me/voraspas'
};

// Brand mark for the header: a floor line with an equity step above it.
const MARK = `<svg class="mark" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" focusable="false"><rect x="1" y="1" width="30" height="30" rx="8" fill="#16624a"/><path d="M7 22 L12 17 L16 19 L25 10" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><line x1="7" y1="25" x2="25" y2="25" stroke="#8fd3bb" stroke-width="2" stroke-linecap="round"/></svg>`;

const TG_ICON = `<svg class="tg-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21.94 4.3 18.6 20.1c-.25 1.1-.9 1.38-1.82.86l-5.03-3.7-2.43 2.34c-.27.27-.5.5-1.02.5l.36-5.13 9.34-8.44c.4-.36-.09-.56-.63-.2L6.02 13.2.99 11.63c-1.1-.34-1.12-1.1.23-1.63L20.1 2.77c.91-.34 1.71.2 1.4 1.53Z"/></svg>`;

const SITE = {
  name: 'Prop Firm Passing',
  domain: 'propfirmpassing.space',
  url: 'https://propfirmpassing.space',
  title: 'Prop Firm Passing Service: Flat $220, Any Firm, Any Size',
  description:
    'A prop firm passing service that trades your evaluation to target for a flat $220 at any account size, with a free 7-day demo test first. What it costs, which firms allow it, and what voids a pass.',
  lastReviewed: '2026-10-27',
  // Search Console ownership. Both methods are emitted so verification cannot fail
  // on a stale file: the HTML file must stay at the site root after verification,
  // and the build wipes docs/ on every run, so it is written here rather than by hand.
  googleSiteVerification: 'google21a9e6a0ea2d4d8a',
  telegram: TELEGRAM,
  serviceUrl: 'https://elitepropx.com/services/passing-prop-firm-services.html',
  email: 'support@elitepropx.com',
  disclosure:
    'This site is maintained by ElitePropX, the provider the service described here belongs to. Prices for other providers in the table come from their own pricing pages, read on the dates shown, and the row for ElitePropX is our own price rather than an independent one.'
};

// ---------------------------------------------------------------- data loading

function latestSnapshot() {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^snapshot-\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
  if (!files.length) throw new Error('No snapshots found in ' + DATA_DIR);
  const file = files[files.length - 1];
  return { snapshot: JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')), file };
}

const loadFaq = () => JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'faq.json'), 'utf8'));

// ------------------------------------------------------------------ rendering

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function table(tableData) {
  const head = tableData.columns.map((c) => `<th scope="col">${esc(c)}</th>`).join('');
  const rows = tableData.rows
    .map((r) => {
      const cells = r.cells
        .map((c, i) =>
          i === 0
            ? `<th scope="row">${esc(c)}${
                r.source
                  ? ` <a class="src" href="${esc(r.source)}" rel="nofollow noopener" target="_blank">source</a>`
                  : ''
              }</th>`
            : `<td${/^\$[\d,]+$/.test(c) ? ' class="price"' : ''}>${esc(c)}</td>`
        )
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('\n          ');
  return `<div class="table-scroll"><table>
        <thead><tr>${head}</tr></thead>
        <tbody>
          ${rows}
        </tbody>
      </table></div>`;
}

function faqBlock(faq) {
  return faq.items
    .map(
      (item) =>
        `<details class="faq"><summary>${esc(item.q)}</summary><div class="faq-a"><p>${esc(
          item.a
        )}</p></div></details>`
    )
    .join('\n    ');
}

function schema(snapshot, faq) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://elitepropx.com/#organization',
        name: 'ElitePropX',
        url: 'https://elitepropx.com/',
        sameAs: [TELEGRAM.url],
        description: 'Managed prop firm evaluation passing service.'
      },
      {
        '@type': 'WebSite',
        '@id': SITE.url + '/#website',
        url: SITE.url + '/',
        name: SITE.name,
        description: SITE.description,
        inLanguage: 'en',
        dateModified: SITE.lastReviewed,
        publisher: { '@id': 'https://elitepropx.com/#organization' }
      },
      {
        '@type': 'Service',
        '@id': SITE.url + '/#service',
        name: 'Prop firm passing service',
        serviceType: 'Prop firm evaluation passing',
        description:
          "Completion of a prop firm evaluation to its profit target under the firm's own rules, for a flat fee at any account size, subject to the firm's terms permitting third-party account management. A free seven-day demo test is available before purchase.",
        url: SITE.url + '/',
        areaServed: 'Worldwide',
        provider: { '@id': 'https://elitepropx.com/#organization' },
        offers: {
          '@type': 'Offer',
          price: '220',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: TELEGRAM.url
        }
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a }
        }))
      }
    ]
  };
}

function layout({ title, desc, body, canonical, robots = 'index, follow', schemaData }) {
  const tgBtn = (label, cls = 'btn btn-tg') =>
    `<a class="${cls}" href="${TELEGRAM.url}" target="_blank" rel="noopener">${TG_ICON}<span>${esc(
      label
    )}</span></a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="${esc(robots)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#0f4a37">
<meta name="google-site-verification" content="${esc(SITE.googleSiteVerification)}">
<link rel="stylesheet" href="/assets/style.css">
${schemaData ? `<script type="application/ld+json">\n${JSON.stringify(schemaData, null, 2)}\n</script>\n` : ''}</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="wrap head-inner">
    <a class="brand" href="/">
      ${MARK}
      <span class="brand-text"><span class="brand-name">${esc(SITE.name)}</span><span class="brand-sub">${esc(
        SITE.domain
      )}</span></span>
    </a>
    <nav class="site-nav" aria-label="Sections">
      <a href="#demo">Demo test</a>
      <a href="#cost">Prices</a>
      <a href="#firms">Firm terms</a>
      <a href="#rules">Rules</a>
      <a href="#faq">FAQ</a>
      ${tgBtn('Telegram', 'btn btn-tg btn-sm')}
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-foot">
  <div class="wrap foot-grid">
    <div>
      <p class="foot-brand">${MARK}<span>${esc(SITE.name)}</span></p>
      <p class="disclosure"><strong>Disclosure.</strong> ${esc(SITE.disclosure)}</p>
    </div>
    <div>
      <p class="foot-h">Start</p>
      ${tgBtn('Message ' + TELEGRAM.handle)}
      <p class="foot-alt"><a href="${esc(SITE.serviceUrl)}" rel="noopener">Email</a> · <a href="mailto:${esc(
        SITE.email
      )}">${esc(SITE.email)}</a></p>
    </div>
  </div>
  <div class="wrap">
    <p class="meta">Figures in the tables were read from each provider's own pricing page or each firm's own documentation on the dates shown, and they change without notice — confirm against the source before acting on them. Nothing here is financial advice, and nothing here is a promise about a funded payout, which is governed by rules the evaluation does not test.</p>
    <p class="meta">Page last reviewed ${esc(SITE.lastReviewed)} · <a href="${esc(
    SITE.serviceUrl
  )}" rel="noopener">How the seven-day demo and the pass work in detail</a></p>
  </div>
</footer>
<a class="tg-float" href="${TELEGRAM.url}" target="_blank" rel="noopener" aria-label="Message us on Telegram ${esc(
    TELEGRAM.handle
  )}">${TG_ICON}<span class="tg-float-text"><strong>Pass your evaluation</strong><small>${esc(
    TELEGRAM.handle
  )}</small></span></a>
</body>
</html>
`;
}

function page404() {
  return layout({
    title: 'Page not found | ' + SITE.name,
    desc: 'That page does not exist on this site.',
    canonical: SITE.url + '/404.html',
    robots: 'noindex, follow',
    body: `
<section class="intro">
  <div class="wrap">
    <h1>That page does not exist</h1>
    <p class="lede">This site is a single page about prop firm passing services. The link may be out of date, or the address may have a typo in it.</p>
    <div class="cta-row"><a class="btn" href="/">Go to the page</a></div>
  </div>
</section>
`
  });
}

// ---------------------------------------------------------------------- write

function write(file, content) {
  const dest = path.join(OUT, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  return file;
}

const countWords = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;

function build() {
  const { snapshot, file } = latestSnapshot();
  const faq = loadFaq();

  const tokens = {
    '{{PRICES_CHECKED}}': esc(snapshot.passingServices.checked),
    '{{RULES_CHECKED}}': esc(snapshot.firms.forex.checked),
    '{{PRICE_TABLE}}': table(snapshot.passingServices),
    '{{FOREX_RULES}}': table(snapshot.firms.forex),
    '{{FUTURES_RULES}}': table(snapshot.firms.futures),
    '{{FAQ}}': faqBlock(faq),
    '{{TELEGRAM_URL}}': TELEGRAM.url,
    '{{TG_ICON}}': TG_ICON
  };

  let body = fs.readFileSync(CONTENT, 'utf8');
  for (const [token, value] of Object.entries(tokens)) {
    if (!body.includes(token)) console.warn('Warning: token ' + token + ' not found in content/index.html');
    body = body.split(token).join(value);
  }

  const html = layout({
    title: SITE.title,
    desc: SITE.description,
    canonical: SITE.url + '/',
    body,
    schemaData: schema(snapshot, faq)
  });

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const written = [];
  written.push(write('index.html', html));
  written.push(write('404.html', page404()));

  fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'assets', 'style.css'), path.join(OUT, 'assets', 'style.css'));
  written.push('assets/style.css');

  written.push(
    write(
      SITE.googleSiteVerification + '.html',
      'google-site-verification: ' + SITE.googleSiteVerification + '.html\n'
    )
  );

  fs.writeFileSync(path.join(OUT, 'CNAME'), SITE.domain + '\n');
  written.push('CNAME');

  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
  written.push('robots.txt');

  fs.writeFileSync(
    path.join(OUT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE.url}/</loc><lastmod>${SITE.lastReviewed}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>
`
  );
  written.push('sitemap.xml');

  const kb = (fs.statSync(path.join(OUT, 'index.html')).size / 1024).toFixed(1);
  const cssKb = (fs.statSync(path.join(OUT, 'assets', 'style.css')).size / 1024).toFixed(1);
  console.log(`Built ${written.length} files into docs/`);
  console.log(`Source snapshot: ${file} (prices read ${snapshot.passingServices.checked}, rules read ${snapshot.firms.forex.checked})`);
  console.log(`Page: ${countWords(html)} words, ${kb} KB html, ${cssKb} KB css, 0 image requests, 0 JS`);
  console.log(`FAQ entries: ${faq.items.length}`);
  return { written, html };
}

build();
