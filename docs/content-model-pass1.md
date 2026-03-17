# The Catholic Experiment — Data Model Pass 1

This pass locks the foundational collections for the platform.

## Collections
- businesses
- pilgrimage_sites
- dioceses
- tools
- events
- members
- moderation_log
- translations

## Shared fields
- id
- slug
- status
- featured
- created_at
- updated_at
- source_url
- source_checked_at
- language_default
- translation_status

## Key principles
1. Separate content from presentation.
2. Treat places as places, not articles.
3. Treat member identity privately and public witness separately.
4. Use dioceses as parent records.
5. Standardise categories from day one.

## Businesses (summary)
Required: id, slug, business_name, short_description, category, town_city, country, island_region, website_url, catholic_connection_statement, status.

## Pilgrimage sites (summary)
Required: id, slug, site_name, site_type, summary, town_city, country, island_region, latitude, longitude, status.

## Dioceses (summary)
Required: id, slug, diocese_name, type, country, island_region, rite, website_url, status.

## Tools (summary)
Required: id, slug, tool_name, tool_type, summary, official_url, trust_level, status.

## Events (summary)
Required: id, slug, event_name, event_type, summary, venue_name, town_city, country, island_region, start_datetime, end_datetime, timezone, status.

## Members (summary)
Required private fields: id, full_name, email, town_city, country, island_region, public_roll_opt_in, status.
Public fields: public_display_name, public_location, join_date, public_note_optional.
