# Prop Firm Passing Tracker — `propfirmpassing.space`

A dated tracker of what prop firm passing services charge and what firms require.
The point is not the current figures — those exist in a dozen places. The point is
that every figure here is stamped with the date it was read, and that the site keeps
a memory of what changed between snapshots.

The site is generated. Nothing in `docs/` is hand-written, so adding next month's
numbers is one file.

## Structure

```
tracker/
  data/
    snapshot-2026-10-26.json     one file per snapshot, filename is the snapshot date
  assets/style.css               stylesheet (copied into the build)
  build.js                       renders docs/ from every snapshot in data/
  serve.js                       local preview on http://localhost:8099
  docs/                          GENERATED — do not edit by hand
```

## Adding a snapshot

1. Copy the most recent file in `data/` to `data/snapshot-<YYYY-MM-DD>.json`, using
   the date you actually read the figures.
2. Update the figures you re-checked. Update `checked` on each table to the date you
   read it. Leave anything you did not re-check exactly as it was — a figure carried
   forward keeps its old date and that is the correct behaviour.
3. Set `status` to `"update"` and rewrite `summary`.
4. Run the build:

```bash
cd tracker
node build.js
```

The build diffs the newest snapshot against the previous one and generates the
change log automatically. It reports how many changes it found:

```
Built 9 files into docs/
Snapshots: 2 (latest 2026-11-30)
Changes detected since previous snapshot: 4
```

If that count looks wrong, the cause is almost always a row's **first cell** having
been edited. Rows are matched across snapshots by their first cell, so renaming
`FTMO — 2-Step Challenge` breaks the match and the row reads as removed-then-added.
Edit figures in place; don't rename providers or firms.

## Previewing locally

```bash
cd tracker
node serve.js      # http://localhost:8099
```

## Deployment

The build outputs a self-contained static site to `docs/`, including `CNAME`
holding `propfirmpassing.space`.

**Live setup (done 26 October 2026):**

- Repository: `Maxylinkss/propfirmpassing` — separate from the elitepropx.com
  repository, so this site's build and history stay independent. This folder is the
  git working tree and `origin` is already set.
- Pages: serving from `main` / `/docs`. The `CNAME` file sets the domain.
- DNS at Namecheap: four apex `A` records (`185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`) and `www` as a `CNAME` to
  `maxylinkss.github.io`. The old `A` record pointing at `51.20.251.145` (a dark AWS
  instance) was removed.

To publish a new snapshot:

```bash
cd tracker
node build.js
git add -A
git commit -m "Snapshot 2026-11-30"
git push
```

GitHub Pages redeploys on push. HTTPS is issued by GitHub once its DNS check
completes; until then the site is served over HTTP only and "Enforce HTTPS" in the
repository's Pages settings reads as unavailable.

## Design rules this site follows

These are deliberate and worth keeping if you extend it:

- **One outbound link, in context.** There are exactly two links to `elitepropx.com`
  on the whole site: the source citation on that provider's row in the price table
  (every row has a source link, so this is consistency, not promotion) and one
  contextual link in the "Who maintains this" section on the methodology page.
  There is no sitewide footer link and no keyword anchor repeated across pages. A
  tracker whose every page links out with an exact-match anchor reads as a link
  scheme, and the risk lands on `elitepropx.com`, not on this domain.
- **Disclosure in the footer of every page.** The tracker is maintained by one of
  the providers it lists. That is stated plainly rather than left to be discovered.
- **No estimated figures.** If a figure could not be read from a primary source, or
  could not be tied to a specific plan, it is not published. A number attributed to
  the wrong product is worse than no number.
- **Corrections become new snapshots** rather than silent edits, so the history
  stays honest.

## What this site deliberately does not do

It does not republish content from `elitepropx.com`. The two sites are meant to be
separate things: `elitepropx.com` is a commercial service site with editorial
guides, this is a reference record. Duplicating pages across the two would put them
in competition for the same keywords and split their authority.
