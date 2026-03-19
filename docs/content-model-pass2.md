# The Catholic Experiment — Data Model Pass 2

This pass adds the collections needed to make the site genuinely useful across the British Isles and Ireland.

## New collections
- parishes
- saints
- education_institutions
- charities
- media_outlets
- retreat_centres
- regional_resources

## Parishes
Required: id, slug, parish_name, diocese_id, town_city, country, island_region, postcode, latitude, longitude, website_url, status.
Optional: mass_times_summary, livestream_url, confession_notes, contact_email, phone, accessibility_notes, languages_offered.

## Saints
Required: id, slug, saint_name, feast_day_mmdd, patronage_summary, associated_regions, summary, status.
Optional: titles, century, canonisation_status, iconography, linked_sites, linked_prayers, source_url.

## Education institutions
Required: id, slug, institution_name, institution_type, town_city, country, island_region, website_url, catholic_identity_summary, status.
Types: primary_school, secondary_school, sixth_form, college, university, seminary, chaplaincy.

## Charities
Required: id, slug, charity_name, scope, summary, website_url, trust_level, status.
Scopes: parish, diocesan, national, international.

## Media outlets
Required: id, slug, outlet_name, media_type, summary, website_url, trust_level, status.
Types: newspaper, news_site, podcast, radio, video, magazine, diocesan_media.

## Retreat centres
Required: id, slug, centre_name, centre_type, town_city, country, island_region, latitude, longitude, website_url, status.
Types: monastery, priory, retreat_house, conference_centre, shrine_guesthouse.

## Regional resources
Required: id, region, title, description, url, section, contexts.
Optional: keywords, cardTitle, cardSummary, primaryLink, secondaryLink.
Purpose: drive regional quick links for island and edge-case regions, and feed long-term search/discovery without hard-coding every discovery entry into the base search index.

## Validation priorities
1. Every map-facing record must have latitude and longitude.
2. Every directory record must have controlled categories.
3. Every public-facing suggestion must run through moderation_log.
4. Postcode search should resolve first to parishes and then to diocesan context.
5. Regional resource records should be reusable for homepage/hub quick links and search indexing.
