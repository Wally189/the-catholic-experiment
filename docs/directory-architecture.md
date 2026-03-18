# Directory Architecture

## Best-fit approach

The site remains static-first.

The directory now uses:

- canonical JSON collections under `assets/data/directory/collections/`
- seed/import files under `assets/data/directory/imports/`
- review queues under `assets/data/directory/review/`
- a derived directory search index under `assets/data/directory/derived/search-index.json`
- lightweight browser rendering through `assets/js/directory.js`
- Node tooling in `scripts/directory_cli.mjs`

## Collections

- `jurisdictions.json`: bishops' conferences and other higher-level church structures
- `dioceses.json`: dioceses, archdioceses, eparchies, ordinariates
- `parishes.json`: parishes, cathedrals, pro-cathedrals, chaplaincies, missions
- `organisations.json`: charities, services, apostolates
- `businesses.json`: Catholic businesses, publishers, commercial listings
- `schools.json`: Catholic schools and colleges
- `places.json`: shrines, religious houses, chaplaincies, mass centres, retreat places

## Public pages

- `directory.html`: hub
- `find-diocese.html`: diocesan listing
- `diocese.html`: diocesan detail
- `find-parish.html`: parish listing
- `parish.html`: parish detail
- `businesses.html`: business listing
- `organisations.html`: organisation listing
- `schools.html`: school listing
- `places.html`: shrine and place listing

## Review policy

Records should stay `provisional` or `manual-review` until:

- the official public source has been confirmed
- exact URLs resolve cleanly
- locality and address data have been checked
- geocodes have been added or intentionally left blank with a review note

## Current manual-review items

- Orkney parish and diocesan oversight gap
- Channel Islands parish records
- Isle of Man mission/parish records
- exact school detail confirmation for the seeded Westminster school records
- recheck of the St Andrews and Edinburgh archdiocesan site and Dublin pro-cathedral detail page
