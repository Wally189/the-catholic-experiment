# The Catholic Experiment — Prototype build

This is a static HTML/CSS/JS prototype packaged as a downloadable site.

## What is included
- 30 HTML pages
- Liturgical colour switching by season, with special handling for Gaudete and Laetare
- Basic locale awareness (`.ie` uses Ireland overrides for sample national feasts)
- Search overlay powered by `assets/data/search-index.json`
- Journal entries powered by `assets/data/journal.json`
- Comment submission with browser-local moderation queue
- Prototype steward panel (`admin.html`) with JSON export and local comment approval
- Dark mode, skip links, reduced motion support, and an accessibility statement
- Starter legal/compliance pages that must be reviewed before any live launch

## Demo steward PIN
1975

## How to preview
Open `index.html` in a browser. Some browsers restrict `fetch()` when opened directly from disk.
If that happens, run a simple local server in this folder, for example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Notes on the lightweight CMS
Because this prototype is static HTML/JS, the steward panel can export JSON and manage comments in local storage, but it cannot write back to files on disk without a fuller backend.
Recommended future paths:
1. Decap CMS or TinaCMS for git-backed editing
2. A small Node/Express or serverless form/comment endpoint
3. A static site generator for templating and collections

## Legal pages
The privacy, cookie, data-protection, terms, and accessibility pages are broad starter texts only. They should be checked against the final hosting, analytics, newsletter, and contact-form stack before publication.
