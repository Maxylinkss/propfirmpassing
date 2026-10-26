#!/usr/bin/env node
/**
 * Builds propfirmpassing.space — a dated tracker of prop firm prices and rule changes.
 *
 * Data lives in data/snapshot-<YYYY-MM-DD>.json, one file per snapshot.
 * The build renders every page from those files and auto-generates the change log
 * by diffing the two most recent snapshots. Nothing on the site is hand-written
 * HTML, so adding next month's data is: add one JSON file, rerun the build.
 *
 * Output goes to docs/ (GitHub Pages convention).
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'docs');

const SITE = {
  name: 'Prop Firm Passing Tracker',
  domain: 'propfirmpassing.space',
  url: 'https://propfirmpassing.space',
  tagline: 'Dated records of what prop firm passing services charge and what firms require',
  description:
    'A dated tracker of prop firm passing service prices and evaluation rules, with every figure sourced and stamped with the date it was read.',
  // The single outbound link. Deliberately one contextual link, not a keyword anchor
  // repeated sitewide: a tracker that links out on every page reads as a link scheme.
  maintainer: {
    name: 'ElitePropX',
    url: 'https://elitepropx.com/services/passing-prop-firm-services.html',
    disclosure:
      'This tracker is maintained by ElitePropX, which is itself one of the providers listed in the price table. That is a conflict of interest and it is stated here rather than left for you to discover: the figures for every other provider come from their own published pricing, and the row for ElitePropX is our own price rather than an independent one.'
  }
};

// ---------------------------------------------------------------- data loading

function loadSnapshots() {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^snapshot-\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
  if (!files.length) throw new Error('No snapshots found in ' + DATA_DIR);
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')));
}

/** Rows are keyed by their first cell so the same provider or firm can be matched across snapshots. */
function rowMap(table) {
  const m = new Map();
  if (!table || !table.rows) return m;
  for (const r of table.rows) m.set(r.cells[0], r);
  return m;
}

function compareTable(prev, next, tableLabel) {
  const changes = [];
  const a = rowMap(prev);
  const b = rowMap(next);
  for (const [key, row] of b) {
    const before = a.get(key);
    if (!before) {
      changes.push({ table: tableLabel, row: key, kind: 'added', detail: 'new to this snapshot' });
      continue;
    }
    const cols = (next.columns || []).slice(1);
    for (let i = 1; i < row.cells.length; i++) {
      if ((before.cells[i] || '') !== (row.cells[i] || '')) {
        changes.push({
          table: tableLabel,
          row: key,
          kind: 'changed',
          field: cols[i - 1] || 'column ' + i,
          from: before.cells[i],
          to: row.cells[i]
        });
      }
    }
  }
  for (const key of a.keys()) {
    if (!b.has(key)) changes.push({ table: tableLabel, row: key, kind: 'removed', detail: 'no longer listed' });
  }
  return changes;
}

function diffSnapshots(prev, next) {
  if (!prev) return null;
  const changes = [];
  changes.push(...compareTable(prev.passingServices, next.passingServices, 'Passing service prices'));
  for (const market of ['forex', 'futures']) {
    const label = (next.firms[market] && next.firms[market].label) || market;
    changes.push(...compareTable(prev.firms[market], next.firms[market], label));
  }
  return changes;
}

// ------------------------------------------------------------------ rendering

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function layout({ title, desc, path: p, body, robots = 'index, follow' }) {
  const navHtml = [
    ['/', 'What changed'],
    ['/prices.html', 'Passing service prices'],
    ['/rules.html', 'Firm rules'],
    ['/methodology.html', 'Methodology']
  ]
    .map(([href, label]) => {
      const cur = href === p ? ' aria-current="page"' : '';
      return `<a href="${href}"${cur}>${label}</a>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | ${esc(SITE.name)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE.url}${p}">
<meta name="robots" content="${esc(robots)}">
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="wrap head-inner">
    <a class="brand" href="/">
      <span class="brand-name">${esc(SITE.name)}</span>
      <span class="brand-sub">${esc(SITE.domain)}</span>
    </a>
    <nav class="site-nav" aria-label="Sections">${navHtml}</nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-foot">
  <div class="wrap">
    <p class="disclosure"><strong>Disclosure.</strong> ${esc(SITE.maintainer.disclosure)}</p>
    <p class="meta">Snapshot data is read from each provider's and firm's own published documentation on the dates shown. Figures change without notice — always confirm against the source before acting on them.</p>
    <p class="meta"><a href="/methodology.html">How this tracker is built, and who maintains it</a></p>
  </div>
</footer>
</body>
</html>
`;
}

function table(table) {
  const head = table.columns.map((c) => `<th scope="col">${esc(c)}</th>`).join('');
  const rows = table.rows
    .map((r) => {
      const cells = r.cells
        .map((c, i) =>
          i === 0
            ? `<th scope="row">${esc(c)}${
                r.source ? ` <a class="src" href="${esc(r.source)}" rel="nofollow noopener" target="_blank">source</a>` : ''
              }</th>`
            : `<td>${esc(c)}</td>`
        )
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('\n');
  return `<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>\n${rows}\n</tbody></table></div>`;
}

function changeList(changes) {
  if (changes === null) {
    return `<p class="lede">This is the first snapshot, so there is nothing to compare it against yet. Every figure below becomes the baseline that the next snapshot is measured against.</p>`;
  }
  if (!changes.length) {
    return `<p class="lede">Nothing changed between the two most recent snapshots. Every figure that was recorded last time reads the same this time.</p>`;
  }
  const items = changes
    .map((c) => {
      if (c.kind === 'changed') {
        return `<li><strong>${esc(c.row)}</strong> — ${esc(c.field)}: <span class="was">${esc(c.from)}</span> → <span class="now">${esc(c.to)}</span> <span class="tag">${esc(c.table)}</span></li>`;
      }
      if (c.kind === 'added') {
        return `<li><strong>${esc(c.row)}</strong> was added to ${esc(c.table)}.</li>`;
      }
      return `<li><strong>${esc(c.row)}</strong> was removed from ${esc(c.table)}.</li>`;
    })
    .join('\n');
  return `<ul class="changelog">\n${items}\n</ul>`;
}

function pageIndex(snapshots, changes) {
  const latest = snapshots[snapshots.length - 1];
  const prev = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;

  const cheap = [...latest.passingServices.rows]
    .filter((r) => /^\$[\d,]+$/.test(r.cells[1]))
    .sort((a, b) => Number(a.cells[1].replace(/[$,]/g, '')) - Number(b.cells[1].replace(/[$,]/g, '')));

  const body = `
<section class="page-head">
  <div class="wrap">
    <p class="kicker">Snapshot · ${esc(latest.label)}</p>
    <h1>What prop firm passing services charge, and what firms require</h1>
    <p class="lede">${esc(latest.summary)}</p>
    <dl class="facts">
      <div><dt>Snapshots recorded</dt><dd>${snapshots.length}</dd></div>
      <div><dt>Latest snapshot</dt><dd>${esc(latest.label)}</dd></div>
      <div><dt>Prices checked</dt><dd>${esc(latest.passingServices.checked)}</dd></div>
      <div><dt>Rules checked</dt><dd>${esc(latest.firms.forex.checked)}</dd></div>
    </dl>
  </div>
</section>

<section class="section">
  <div class="wrap narrow">
    <h2>${prev ? `What changed since ${esc(prev.label)}` : 'Baseline snapshot'}</h2>
    ${changeList(changes)}
  </div>
</section>

<section class="section soft">
  <div class="wrap">
    <h2>Passing service fees at a $100,000 account, cheapest published first</h2>
    <p class="section-note">Three of the five publish a dollar figure at $100,000 and can be ranked against each other. One prices in pounds, so it is excluded from a dollar ranking and appears in the full table instead. One does not publish a price at all.</p>
    <div class="table-scroll">
      <table>
        <thead><tr><th scope="col">Provider</th><th scope="col">At $100k</th><th scope="col">At $200k</th><th scope="col">Fee model</th></tr></thead>
        <tbody>
          ${cheap
            .map(
              (r) =>
                `<tr><th scope="row">${esc(r.cells[0])}</th><td class="price">${esc(r.cells[1])}</td><td>${esc(r.cells[2])}</td><td>${esc(r.cells[3])}</td></tr>`
            )
            .join('\n          ')}
        </tbody>
      </table>
    </div>
    <p class="section-note">Full table with sources: <a href="/prices.html">passing service prices</a>.</p>
  </div>
</section>

<section class="section">
  <div class="wrap narrow">
    <h2>Why a dated tracker instead of a review</h2>
    <p>Prices in this niche move, and rules move more. A review written once is wrong within a quarter and gives you no way to tell how wrong. A tracker does two different things: it records what a figure was on a given date, and it records the fact that it changed.</p>
    <p>The second part is the useful one. If a firm shortens its minimum trading days, or a provider raises its fee at $200,000 while leaving the $100,000 price alone, that is a decision they made — and it is invisible in any static comparison, because a static comparison has no memory.</p>
    <p>Every figure on this site carries the date it was read from the provider's or firm's own documentation. Nothing here is estimated, and where a firm publishes several plans under one brand and the figures could not be tied to a specific plan, no figure is shown at all.</p>
    <p><a href="/methodology.html">How figures are collected, and what the dates mean →</a></p>
  </div>
</section>
`;
  return layout({
    title: 'Dated prop firm passing service prices and evaluation rules',
    desc: SITE.description,
    path: '/',
    body
  });
}

function pagePrices(snapshots) {
  const latest = snapshots[snapshots.length - 1];
  const t = latest.passingServices;

  const history = snapshots
    .map((s) => {
      const rows = s.passingServices.rows
        .map((r) => `<tr><th scope="row">${esc(r.cells[0])}</th><td>${esc(r.cells[1])}</td><td>${esc(r.cells[2])}</td></tr>`)
        .join('\n          ');
      return `<h3>${esc(s.label)}</h3>
    <div class="table-scroll"><table>
      <thead><tr><th scope="col">Provider</th><th scope="col">At $100k</th><th scope="col">At $200k</th></tr></thead>
      <tbody>
          ${rows}
      </tbody>
    </table></div>`;
    })
    .join('\n');

  const body = `
<section class="page-head">
  <div class="wrap">
    <p class="kicker">Price records</p>
    <h1>What passing services charge, as recorded</h1>
    <p class="lede">${esc(t.whatThisIs)}</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>Current snapshot — ${esc(latest.label)}</h2>
    <p class="section-note">Figures read from each provider's own pricing page on <strong>${esc(t.checked)}</strong>.</p>
    ${table(t)}
    <div class="callout">
      <p><strong>Not published means not published.</strong> A blank in that column is not a missing data point on our side — the provider does not list a price for that account size publicly. Where a provider quotes per client, the only way to get the figure is to ask, and the only thing to check when you get it is whether it still holds at the size you actually want.</p>
      <p>${esc(latest.fxNote)}</p>
    </div>
  </div>
</section>

<section class="section soft">
  <div class="wrap narrow">
    <h2>Charge per funded account, not charge per attempt</h2>
    <p>The fee is only half the number. The other half is what a failed attempt costs, and most providers do not publish it. A provider charging $400 with full-price retries is a more expensive service than one charging $588 where retries are covered, and no comparison table shows that, because the retry term lives in checkout or in a support reply.</p>
    <p>Two questions settle it:</p>
    <ol>
      <li>If the evaluation fails while you are running it, what do you owe for the next attempt?</li>
      <li>Does that answer change at $200,000, where two of the five providers raise their price?</li>
    </ol>
    <p>Until the retry term is stated in writing, a fee comparison is comparing attempt one and calling it the price of the service.</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>Recorded history</h2>
    <p class="section-note">Every snapshot taken, newest last. Figures are as read on the date of the snapshot shown.</p>
    ${history}
  </div>
</section>
`;
  return layout({
    title: 'Passing service prices, recorded by date',
    desc: 'What managed prop firm evaluation passing services charge at $100k and $200k, with the date each figure was read from the provider.',
    path: '/prices.html',
    body
  });
}

function pageRules(snapshots) {
  const latest = snapshots[snapshots.length - 1];
  const blocks = ['forex', 'futures']
    .map((market) => {
      const m = latest.firms[market];
      return `
<section class="section${market === 'futures' ? ' soft' : ''}">
  <div class="wrap">
    <h2>${esc(m.label)}</h2>
    <p class="section-note">${esc(m.whatThisIs)}</p>
    <p class="section-note">Read from each firm's own documentation on <strong>${esc(m.checked)}</strong>. Follow the source link on each row to the page the figures came from.</p>
    ${table(m)}
  </div>
</section>`;
    })
    .join('\n');

  const nc = latest.notCovered;
  const body = `
<section class="page-head">
  <div class="wrap">
    <p class="kicker">Rule records</p>
    <h1>Evaluation rules, recorded by date and by plan</h1>
    <p class="lede">Rules are listed per plan rather than per brand, because at most firms the plan name <em>is</em> the rulebook. A firm running four products has four different sets of rules, and treating the brand as one ruleset is the most common way an avoidable breach happens.</p>
  </div>
</section>
${blocks}
<section class="section">
  <div class="wrap narrow">
    <h2>${esc(nc.title)}</h2>
    <p>${esc(nc.why)}</p>
    <ul class="plain">
      ${nc.firms.map((f) => `<li>${esc(f)}</li>`).join('\n      ')}
    </ul>
    <div class="callout">
      <p><strong>Read the drawdown column before the target column.</strong> The target tells you where the finish line is. The drawdown type tells you whether you reach it. An intraday trailing threshold responds to unrealised profit, so a retracement can end an account on a day that finishes net positive — two firms with the same target and the same threshold can be completely different assignments.</p>
    </div>
  </div>
</section>
`;
  return layout({
    title: 'Prop firm evaluation rules, recorded by date and plan',
    desc: 'Targets, daily loss limits, drawdown type, minimum days and consistency for the firms recorded in this tracker, each with the date and source it was read from.',
    path: '/rules.html',
    body
  });
}

function pageMethodology(snapshots) {
  const latest = snapshots[snapshots.length - 1];
  const body = `
<section class="page-head">
  <div class="wrap narrow">
    <p class="kicker">Methodology</p>
    <h1>How figures get onto this site, and what the dates promise</h1>
    <p class="lede">Short version: nothing is estimated. Every figure was read from the provider's or firm's own published documentation on a stated date, and where a figure could not be tied to a specific plan, it is not published here at all.</p>
  </div>
</section>

<section class="section">
  <div class="wrap narrow">
    <h2>What a snapshot is</h2>
    <p>A snapshot is a dated record of everything this tracker checks. It is stored as a single data file, and the site is generated from those files rather than written by hand. That is what makes the history trustworthy: the change log is produced by comparing one snapshot against the previous one mechanically, not by someone remembering what moved.</p>
    <p>Currently <strong>${snapshots.length}</strong> snapshot${snapshots.length === 1 ? ' has' : 's have'} been recorded, most recently <strong>${esc(latest.label)}</strong>.</p>

    <h2>Where the numbers come from</h2>
    <ul>
      <li><strong>Passing service prices</strong> are read from the provider's own pricing page or checkout. Nothing is taken from a comparison article or a review, including ones written by us.</li>
      <li><strong>Firm rules</strong> are read from the firm's own help centre or plan documentation, and each row links to the page the figures came from.</li>
      <li><strong>Converted figures</strong> are marked as approximate. Where a provider prices in pounds, the dollar figure shown is a conversion at the rate in use when the price was read, and it will drift as the rate moves.</li>
    </ul>

    <h2>What a date does and does not promise</h2>
    <p>The date on a row is the date the figure was read. It is not a claim that the figure is still correct today. Promotions end, plans get replaced, and firms change thresholds without announcement. A date lets you judge how stale a figure is; it does not make it current.</p>
    <p>Where a firm's rules could not be tied to a specific plan, no figure is published. That is deliberate. A number attributed to the wrong product is worse than no number, because it is wrong in a way you cannot see.</p>

    <h2>What this tracker does not cover</h2>
    <ul>
      <li>Funded account terms and payout conditions. These are separate documents at every firm, and passing an evaluation is not the same permission as being paid from the funded account.</li>
      <li>Whether a firm permits third-party trading. That is a per-firm, per-plan question and it is the one you should check before paying anyone — including us.</li>
      <li>How any of it works in practice. This site records figures; it does not explain mechanics.</li>
    </ul>

    <h2>Corrections</h2>
    <p>If a figure here is wrong, it is wrong in a way that matters, because people use these numbers to decide what to pay. Corrections are welcome and are applied as a new snapshot rather than a silent edit, so the change is visible in the history.</p>

    <h2>Who maintains this</h2>
    <p>${esc(SITE.maintainer.disclosure)}</p>
    <p>The service ElitePropX runs is described on <a href="${SITE.maintainer.url}">the page it maintains for it</a>, and its fee is the first row of the price table above. The rest of the table is other providers' published pricing, read the same way every other figure on this site is read.</p>
  </div>
</section>
`;
  return layout({
    title: 'Methodology: how figures are collected and dated',
    desc: 'How the Prop Firm Passing Tracker collects prices and rules, what the snapshot dates mean, what the tracker does not cover, and how corrections are handled.',
    path: '/methodology.html',
    body
  });
}

function page404() {
  return layout({
    title: 'Page not found',
    desc: 'That page does not exist on this site.',
    path: '/404.html',
    robots: 'noindex, follow',
    body: `
<section class="page-head">
  <div class="wrap narrow">
    <h1>That page does not exist</h1>
    <p class="lede">The link may be out of date, or the address may have a typo in it.</p>
    <p><a href="/">Go to the current snapshot →</a></p>
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

function build() {
  const snapshots = loadSnapshots();
  const changes = snapshots.length > 1 ? diffSnapshots(snapshots[snapshots.length - 2], snapshots[snapshots.length - 1]) : null;

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const written = [];
  written.push(write('index.html', pageIndex(snapshots, changes)));
  written.push(write('prices.html', pagePrices(snapshots)));
  written.push(write('rules.html', pageRules(snapshots)));
  written.push(write('methodology.html', pageMethodology(snapshots)));
  written.push(write('404.html', page404()));

  fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'assets', 'style.css'), path.join(OUT, 'assets', 'style.css'));
  written.push('assets/style.css');

  fs.writeFileSync(path.join(OUT, 'CNAME'), SITE.domain + '\n');
  written.push('CNAME');

  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
  written.push('robots.txt');

  const urls = ['/', '/prices.html', '/rules.html', '/methodology.html'];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${SITE.url}${u}</loc><lastmod>${snapshots[snapshots.length - 1].snapshot}</lastmod><changefreq>monthly</changefreq><priority>${
        u === '/' ? '1.0' : '0.8'
      }</priority></url>`
  )
  .join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap);
  written.push('sitemap.xml');

  const changeCount = changes ? changes.length : 0;
  console.log(`Built ${written.length} files into docs/`);
  console.log(`Snapshots: ${snapshots.length} (latest ${snapshots[snapshots.length - 1].snapshot})`);
  console.log(`Changes detected since previous snapshot: ${changes === null ? 'n/a (baseline)' : changeCount}`);
  return { written, changeCount, snapshots: snapshots.length };
}

build();
