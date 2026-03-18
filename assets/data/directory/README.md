# Directory Data Model

This folder holds the structured Catholic directory data for The Catholic Experiment.

## Layout

- `imports/`: seed or imported source data before editorial normalization.
- `collections/`: canonical records used by the site.
- `review/`: unresolved issues, duplicate candidates, and geocode tasks.
- `derived/`: generated search indexes and other build outputs.
- `../schemas/`: JSON Schema documents for each collection.

## Editorial rules

- Prefer official diocesan, parish, bishops' conference, shrine, school, or organisation sources.
- Keep `sources` on every record.
- Use `verification_status` to distinguish trusted, provisional, and manual-review records.
- Do not publish guessed coordinates or contact details.
- Put unresolved concerns into `review/issues.json` rather than inventing placeholder facts.
