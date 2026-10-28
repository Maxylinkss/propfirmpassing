# propfirmpassing.space

One page about prop firm passing services, targeting the queries buyers actually
type: *prop firm passing service*, *pass prop firm challenge for me*, *we pass your
prop firm challenge*, *passing prop firm challenge*.

It is a single page on its own domain, built for a simple reason. The providers
ranking for these terms are exact-match domains with one page each — `forexpas.com`,
`quickproppass.com`, `propfundingpass.com` — and most of them hold those positions
with a Domain Rating of 0. The thing that ranks is one focused page on a domain
about passing challenges, not authority and not a large site with internal links.
So this domain carries that page.

It is run as a separate site from `elitepropx.com`, deliberately: separate brand,
separate schema, no links in either direction, no shared contact channel published
on the page. The service sold is the same, which is disclosed in the footer — the
separation is about how the two properties are presented, not about hiding that
the same provider stands behind both.

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

- **Telegram is the only call to action.** Every button on the page opens
  `https://t.me/voraspas`, and that URL is defined once in `build.js` as
  `TELEGRAM.url`. There is no other contact channel: no email address, form or
  phone number is published here.
- **This domain and `elitepropx.com` are kept separate.** Nothing here links to
  that domain and nothing on it links here — not in the footer, not in body copy,
  not in the `Organization` schema, which names `Prop Firm Passing` and
  `propfirmpassing.space` rather than the other site. The disclosure in the footer
  says the site is operated by the provider of the $220 service without naming the
  other brand, which states the conflict without merging the two properties. The
  price-table row for that service is therefore labelled "Prop Firm Passing (this
  site)" and carries no source link. Don't reintroduce a cross-link as a
  convenience; if the two ever need to be joined, that is a decision, not a
  formatting change.
- **Retired URLs redirect with a real 301, they don't 404.** `build.js` writes
  `docs/_redirects` from the `REDIRECTS` array, covering the addresses the
  four-page tracker used (`prices.html`, `rules.html`, `methodology.html`) plus
  `blog/*`, which retires that whole section — it covers the one post Bing still
  lists and any other old post address a link might still point at. Add any future
  retired URL to that array rather than leaving it to `404.html`. This is the reason the site moved off
  GitHub Pages: a static HTML host cannot send a 301 status code, and a meta
  refresh is only a stand-in for one.
- **The free 7-day demo test is offered before the fee.** Open a broker demo, send
  the demo login only, we trade it for seven days under a written plan the client
  receives first. It is the cheapest due-diligence step on the page and it belongs
  above the price table.
- **No JavaScript, no web fonts, no image files.** Every illustration is inline SVG,
  so the page renders in one request after the HTML and never shifts while loading.
  Keep it that way: a heavier design costs more than it returns on a page whose
  whole job is one conversion.
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

**Netlify** serves this site from `main` on `Maxylinkss/propfirmpassing`, using
`netlify.toml` at the repo root: build command `node build.js`, publish directory
`docs`. GitHub Pages is the former host and stays configured only until the DNS
cutover is confirmed.

```bash
cd tracker
node build.js      # regenerates docs/, including _redirects
git add -A
git commit -m "..."
git push           # Netlify builds and publishes from main
```

DNS at Namecheap, once the Netlify site exists and has issued its certificate:

| Record | Host | Value |
|---|---|---|
| `A` | `@` | `75.2.60.5` (Netlify's load balancer — confirm in the Netlify UI, it changes) |
| `CNAME` | `www` | `<site-name>.netlify.app` |

The four `185.199.x.x` GitHub Pages `A` records are removed at the same time; that
is the cutover, and the site is unreachable at the domain for as long as DNS takes
to propagate. Check the certificate is active in Netlify **before** changing DNS,
or the apex will serve an error until it provisions.

`docs/CNAME` is still emitted by the build so GitHub Pages keeps answering until
the cutover. Delete that line from `build.js` afterwards — Netlify ignores the
file, but it is confusing to leave a GitHub Pages custom-domain marker in the
publish directory.

**Rolling back** means restoring the four GitHub `A` records and re-enabling Pages
on `main` / `docs`. The `CNAME` file is still in the output, so Pages picks the
domain back up without further work.

### The old GitHub Pages setup, for reference

The site used to be served from `main` / `/docs` on GitHub Pages, with `CNAME`
holding `propfirmpassing.space` and four apex `A` records
(`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) plus
`www` as a `CNAME` to `maxylinkss.github.io`. HTTPS was provisioned and enforced on
27 October 2026. If that host is ever restored and the certificate needs reissuing:
GitHub had never started the ACME order, so re-saving the custom domain did nothing
and the API answered `404 The certificate does not exist yet`. **Toggling** the
domain did trigger it — set the custom domain to `www.propfirmpassing.space`, wait
about twenty seconds, set it back to `propfirmpassing.space`, and the state went to
`approved` within thirty seconds.

## History

The domain previously held a four-page dated tracker of passing-service prices and
firm rules. It was replaced on 27 October 2026 by this single page. The tracker is
recoverable from git: `git show 1d3d70d` for the version, and the snapshot data it
used is still in `data/`, feeding the price and rule tables on this page.
