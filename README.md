# propfirmpassing.space

One page about prop firm passing services, targeting the queries buyers actually
type: *prop firm passing service*, *pass prop firm challenge for me*, *we pass your
prop firm challenge*, *passing prop firm challenge*.

It is a single page on its own domain, built for a simple reason. The providers
ranking for these terms are exact-match domains with one page each — `forexpas.com`,
`quickproppass.com`, `propfundingpass.com` — and most of them hold those positions
with a Domain Rating of 0. The thing that ranks is one focused page on a domain
about passing challenges, not authority and not a large site with internal links.
So this domain carries that page, and `elitepropx.com` stays the commercial site.

## Structure

```
tracker/
  content/index.html            the page body, with {{TOKENS}} for generated blocks
  data/
    snapshot-2026-10-26.json    dated price and rule figures used in the tables
    faq.json                    questions and answers (rendered visibly AND as FAQPage schema)
  assets/style.css              stylesheet, copied into the build
  build.js                      renders docs/ — nothing in docs/ is hand-written
  serve.js                      local preview on http://localhost:8099
  docs/                         GENERATED — do not edit by hand
```

Tokens available in `content/index.html`: `{{PRICES_CHECKED}}`, `{{RULES_CHECKED}}`,
`{{PRICE_TABLE}}`, `{{FOREX_RULES}}`, `{{FUTURES_RULES}}`, `{{FAQ}}`, `{{ORDER_URL}}`.
The build warns if a token disappears from the content.

## Editing

Prose lives in `content/index.html`. Tables and the figures inside them live in
`data/snapshot-*.json` — edit the numbers there, not in the generated HTML. FAQ
answers live in `data/faq.json`, which is one source for both the visible accordion
and the `FAQPage` schema, so the two can never drift apart.

```bash
cd tracker
node build.js        # prints word count, snapshot dates and FAQ count
node serve.js        # http://localhost:8099
```

The build prints the visible word count every time. It should stay north of 5,000;
the page is competing with a 5,758-word page that ranks first.

## Design rules this site follows

- **One converting link.** Every call to action points at the ElitePropX contact
  page, and the disclosure in the footer says who maintains the site. There is no
  keyword-anchor link repeated sitewide, in either direction.
- **Every figure is dated and sourced.** Prices carry the date they were read and
  link to the provider's own pricing page. A figure that could not be tied to a
  specific account size is published as "not published" rather than estimated.
- **Nothing promises a funded payout.** The funded phase has its own rules that the
  evaluation does not test. Saying otherwise would be both untrue and the fastest
  way to lose a buyer who checks.
- **The terms check comes before the fee.** Where a firm's rules prohibit
  third-party trading, the page says so and the work is declined. This is also the
  single best differentiator against providers who take payment first.

## Deployment

Site is served from `main` / `/docs` on `Maxylinkss/propfirmpassing`, with `CNAME`
holding `propfirmpassing.space`.

```bash
cd tracker
node build.js
git add -A
git commit -m "Rewrite as a single passing-service page"
git push
```

GitHub Pages redeploys on push. DNS at Namecheap: four apex `A` records
(`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and
`www` as a `CNAME` to `maxylinkss.github.io`.

**HTTPS is not provisioned yet (as of 27 October 2026).** The domain resolves to
GitHub Pages and serves over HTTP, but the certificate presented is the wildcard
`*.github.io`, so every `https://` visit fails with a name mismatch while the
canonical tag, sitemap and robots.txt all point at `https`. Fix it in the
repository's **Settings → Pages**: re-save the custom domain, then enable
**Enforce HTTPS** once GitHub finishes its DNS check and the option stops being
greyed out. Submit the sitemap in Search Console only after HTTPS works.

## History

The domain previously held a four-page dated tracker of passing-service prices and
firm rules. It was replaced on 27 October 2026 by this single page. The tracker is
recoverable from git: `git show 1d3d70d` for the version, and the snapshot data it
used is still in `data/`, feeding the price and rule tables on this page.
