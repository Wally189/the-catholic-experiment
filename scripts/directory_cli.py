from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets" / "data" / "directory" / "manifest.json"
SITE_SEARCH_PATH = ROOT / "assets" / "data" / "search-index.json"
REVIEW_DIR = ROOT / "assets" / "data" / "directory" / "review"
DERIVED_DIR = ROOT / "assets" / "data" / "directory" / "derived"

VALID_VERIFICATION = {"trusted", "provisional", "manual-review"}


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=True)
        handle.write("\n")


def slugify(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value or "record"


def unique_strings(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        cleaned = str(value or "").strip()
        key = cleaned.lower()
        if not cleaned or key in seen:
            continue
        seen.add(key)
        result.append(cleaned)
    return result


def dedupe_sources(values: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[tuple[str, str]] = set()
    result: list[dict[str, Any]] = []
    for source in values:
        authority = str(source.get("authority") or "").strip()
        url = str(source.get("url") or "").strip()
        title = str(source.get("title") or "").strip()
        key = (authority.lower(), url.lower())
        if not authority or not url or not title or key in seen:
            continue
        seen.add(key)
        result.append({
            "authority": authority,
            "title": title,
            "url": url,
            **({"note": str(source.get("note")).strip()} if str(source.get("note") or "").strip() else {}),
        })
    return result


def load_manifest() -> dict[str, Any]:
    return load_json(MANIFEST_PATH)


def collection_meta_map() -> dict[str, dict[str, Any]]:
    manifest = load_manifest()
    return {item["name"]: item for item in manifest["collections"]}


def resolve(rel_path: str) -> Path:
    return ROOT / Path(rel_path)


def detail_url(meta: dict[str, Any], record_id: str) -> str:
    if meta.get("detail_page"):
        return f"{meta['detail_page']}?id={quote(record_id)}"
    return f"{meta['listing_page']}#{record_id}"


def normalize_record(record: dict[str, Any], meta: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(record)
    normalized["entity_type"] = meta["entity_type"]
    normalized["slug"] = slugify(str(normalized.get("slug") or normalized.get("name") or normalized.get("id") or "record"))
    normalized["verification_status"] = str(normalized.get("verification_status") or "manual-review")
    normalized["sources"] = dedupe_sources(list(normalized.get("sources") or []))
    normalized["search_terms"] = unique_strings(list(normalized.get("search_terms") or []))
    normalized["detail_url"] = detail_url(meta, str(normalized.get("id") or normalized["slug"]))
    for key in ["id", "name", "summary", "website_url", "country", "region", "locality", "postcode", "type", "short_name", "parish_type", "business_type", "school_type", "place_type", "organisation_type", "cathedral_city", "coverage_note", "jurisdiction_id", "diocese_id", "related_parish_id", "rite"]:
        if key in normalized and isinstance(normalized[key], str):
            normalized[key] = normalized[key].strip()
    if isinstance(normalized.get("country_scope"), list):
        normalized["country_scope"] = unique_strings(normalized["country_scope"])
    return normalized


def import_collection(name: str) -> list[dict[str, Any]]:
    meta = collection_meta_map()[name]
    source_records = load_json(resolve(meta["imports"]))
    normalized = [normalize_record(record, meta) for record in source_records]
    normalized.sort(key=lambda item: (str(item.get("country") or item.get("locality") or ""), str(item.get("name") or "")))
    write_json(resolve(meta["output"]), normalized)
    return normalized


def import_all() -> dict[str, list[dict[str, Any]]]:
    meta_map = collection_meta_map()
    return {name: import_collection(name) for name in meta_map}


def load_collections() -> dict[str, list[dict[str, Any]]]:
    meta_map = collection_meta_map()
    collections: dict[str, list[dict[str, Any]]] = {}
    for name, meta in meta_map.items():
        path = resolve(meta["output"])
        collections[name] = load_json(path) if path.exists() else []
    return collections


def add_issue(issues: list[dict[str, Any]], severity: str, collection: str, record_id: str, message: str) -> None:
    issues.append({
        "severity": severity,
        "collection": collection,
        "record_id": record_id,
        "message": message,
    })


def validate_collections(collections: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    meta_map = collection_meta_map()
    issues: list[dict[str, Any]] = []
    jurisdictions = {item["id"] for item in collections.get("jurisdictions", [])}
    dioceses = {item["id"] for item in collections.get("dioceses", [])}
    parishes = {item["id"] for item in collections.get("parishes", [])}

    for name, meta in meta_map.items():
        seen_ids: set[str] = set()
        for record in collections.get(name, []):
            record_id = str(record.get("id") or "missing-id")
            if record_id in seen_ids:
                add_issue(issues, "error", name, record_id, "Duplicate record id.")
            seen_ids.add(record_id)

            for field in meta.get("required_fields", []):
                value = record.get(field)
                if value in (None, "", []):
                    add_issue(issues, "error", name, record_id, f"Missing required field: {field}.")

            if record.get("verification_status") not in VALID_VERIFICATION:
                add_issue(issues, "error", name, record_id, "Invalid verification_status.")

            if not record.get("sources"):
                add_issue(issues, "error", name, record_id, "At least one source is required.")

            for key in ["website_url", "mass_times_url"]:
                if record.get(key) and not str(record[key]).startswith(("http://", "https://")):
                    add_issue(issues, "error", name, record_id, f"{key} must be an http or https URL.")

            if name == "dioceses" and record.get("jurisdiction_id") and record["jurisdiction_id"] not in jurisdictions:
                add_issue(issues, "error", name, record_id, "Unknown jurisdiction_id reference.")
            if name in {"parishes", "schools"} and record.get("diocese_id") and record["diocese_id"] not in dioceses:
                add_issue(issues, "error", name, record_id, "Unknown diocese_id reference.")
            if name == "places" and record.get("related_parish_id") and record["related_parish_id"] not in parishes:
                add_issue(issues, "error", name, record_id, "Unknown related_parish_id reference.")

            if record.get("verification_status") != "trusted":
                add_issue(issues, "warning", name, record_id, "Record still requires editorial review before broad publication.")

    write_json(REVIEW_DIR / "issues.json", issues)
    return issues


def build_geocode_queue(collections: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    queue: list[dict[str, Any]] = []
    for collection_name in ["dioceses", "parishes", "businesses", "schools", "places"]:
        for record in collections.get(collection_name, []):
            if record.get("latitude") is not None and record.get("longitude") is not None:
                continue
            locality = str(record.get("locality") or record.get("cathedral_city") or "").strip()
            country = str(record.get("country") or "").strip()
            postcode = str(record.get("postcode") or "").strip()
            if not any([locality, country, postcode]):
                continue
            parts = [part for part in [record.get("name"), locality, postcode, country] if part]
            queue.append({
                "collection": collection_name,
                "record_id": record["id"],
                "query": ", ".join(parts),
                "status": "pending-manual-geocode",
            })
    write_json(REVIEW_DIR / "geocode-queue.json", queue)
    return queue


def build_duplicate_candidates(collections: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    seen: dict[tuple[str, str, str], list[dict[str, str]]] = {}
    for collection_name, records in collections.items():
        for record in records:
            key = (
                slugify(str(record.get("name") or "")),
                slugify(str(record.get("locality") or record.get("cathedral_city") or "")),
                slugify(str(record.get("country") or "")),
            )
            seen.setdefault(key, []).append({"collection": collection_name, "record_id": record["id"]})
    duplicates = [
        {"normalized_key": " | ".join(key), "records": entries}
        for key, entries in seen.items()
        if len(entries) > 1
    ]
    write_json(REVIEW_DIR / "duplicate-candidates.json", duplicates)
    return duplicates


def build_directory_search(collections: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for collection_name, records in collections.items():
        for record in records:
            descriptor = record.get("summary") or f"{record.get('name')} in {record.get('locality') or record.get('country_scope') or record.get('country')}."
            keywords = unique_strings([
                str(record.get("name") or ""),
                str(record.get("short_name") or ""),
                str(record.get("type") or record.get("parish_type") or record.get("business_type") or record.get("organisation_type") or record.get("school_type") or record.get("place_type") or ""),
                str(record.get("locality") or ""),
                str(record.get("country") or ""),
                *list(record.get("country_scope") or []),
                *list(record.get("search_terms") or []),
            ])
            entries.append({
                "id": f"directory:{collection_name}:{record['id']}",
                "url": record.get("detail_url") or "directory.html",
                "title": record.get("name"),
                "section": f"Directory: {collection_name.title()}",
                "description": descriptor,
                "keywords": " ".join(keywords),
                "source": "directory",
            })
    write_json(DERIVED_DIR / "search-index.json", entries)

    existing = load_json(SITE_SEARCH_PATH) if SITE_SEARCH_PATH.exists() else []
    merged = [item for item in existing if item.get("source") != "directory"] + entries
    write_json(SITE_SEARCH_PATH, merged)
    return entries


def run_all() -> int:
    import_all()
    collections = load_collections()
    issues = validate_collections(collections)
    build_geocode_queue(collections)
    build_duplicate_candidates(collections)
    build_directory_search(collections)
    error_count = sum(1 for issue in issues if issue["severity"] == "error")
    print(f"Imported {sum(len(records) for records in collections.values())} directory records across {len(collections)} collections.")
    print(f"Validation issues written to {REVIEW_DIR / 'issues.json'}.")
    return 1 if error_count else 0


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Directory import and review tooling for The Catholic Experiment.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    import_parser = subparsers.add_parser("import", help="Normalize seed data into canonical collections.")
    import_parser.add_argument("collection", help="Collection name or 'all'.")

    subparsers.add_parser("validate", help="Validate existing collections.")
    subparsers.add_parser("geocode", help="Build a manual geocode queue.")
    subparsers.add_parser("dedupe", help="Build duplicate candidate report.")
    subparsers.add_parser("build-search", help="Generate directory search entries.")
    subparsers.add_parser("all", help="Run import, validate, dedupe, geocode, and search build.")

    args = parser.parse_args(argv)

    if args.command == "import":
        if args.collection == "all":
            import_all()
        else:
            import_collection(args.collection)
        return 0

    collections = load_collections()

    if args.command == "validate":
        issues = validate_collections(collections)
        print(f"Validated collections with {len(issues)} issues.")
        return 1 if any(issue["severity"] == "error" for issue in issues) else 0
    if args.command == "geocode":
        queue = build_geocode_queue(collections)
        print(f"Queued {len(queue)} records for manual geocoding.")
        return 0
    if args.command == "dedupe":
        duplicates = build_duplicate_candidates(collections)
        print(f"Found {len(duplicates)} duplicate candidates.")
        return 0
    if args.command == "build-search":
        entries = build_directory_search(collections)
        print(f"Built {len(entries)} directory search entries.")
        return 0
    if args.command == "all":
        return run_all()

    parser.error("Unsupported command")
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
