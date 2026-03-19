# The Catholic Experiment

The Catholic Experiment is a static HTML/CSS/JS website for Britain, Ireland, and the islands around them. Its current direction is not to act as a teaching authority or a scraped mega-directory, but as a Catholic gateway that points people toward trusted diocesan, parish, Vatican, pilgrimage, retreat, and practical Catholic resources.

## Current state
- Static site with shared JS/CSS and a large set of hand-maintained HTML pages.
- Public rulebook and safeguarding pages are now part of the site structure.
- The parish experience is outward-link-first: trusted diocesan routes rather than a fragile copied parish database.
- The diocesan directory currently covers 55 territorial dioceses and archdioceses across England, Wales, Scotland, Ireland, and Northern Ireland.
- Business, shrine, retreat, monastery, and religious-house listings are seeded through the directory import pipeline and compiled into JSON collections.

## Directory workflow
The structured directory data lives under `assets/data/directory/`.

Seed files:
- `assets/data/directory/imports/dioceses.seed.json`
- `assets/data/directory/imports/businesses.seed.json`
- `assets/data/directory/imports/places.seed.json`
- other collection seed files in the same folder

Generated outputs:
- `assets/data/directory/collections/*.json`
- `assets/data/directory/derived/search-index.json`
- `assets/data/directory/review/issues.json`

Useful scripts:

```bash
npm run import:directory
npm run validate:directory
npm run build:directory
```

## Contact and moderation
- The public build is email-first.
- Browser form relays are disabled unless real endpoints are configured in `assets/data/site.json`.
- The public build does not expose a browser admin PIN or moderation dashboard.

If a fuller moderation or submissions workflow is needed later, it should sit behind a real backend with authentication, audit logging, and proper data handling.

## Local preview
Open `index.html` in a browser. Some browsers restrict `fetch()` from disk, so a local server is safer:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Governance notes
- This repo should continue to behave like a directory and gateway first.
- Official Catholic sources should be preferred wherever possible.
- If a listing is doubtful, broken, or unsafe, it should be corrected or removed.
- The public standards for inclusion and correction are now described on `content-model.html`.
- Public boundaries and reporting guidance are described on `safeguarding.html`.

## Legacy materials
Some older prototype-era files and generation scripts still exist in the repo. They should be treated as legacy scaffolding unless and until they are brought into line with the current directory-first governance model.
