import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'assets', 'data', 'directory', 'manifest.json');
const SITE_SEARCH_PATH = path.join(ROOT, 'assets', 'data', 'search-index.json');
const REVIEW_DIR = path.join(ROOT, 'assets', 'data', 'directory', 'review');
const DERIVED_DIR = path.join(ROOT, 'assets', 'data', 'directory', 'derived');

const VALID_VERIFICATION = new Set(['trusted', 'provisional', 'manual-review']);
const VALID_BUSINESS_TYPES = new Set(['catholic-owned', 'catholic-serving', 'catholic-goods', 'ecclesial']);
const VALID_BUSINESS_VERIFICATION = new Set(['standard', 'reviewed', 'priest', 'diocesan']);

async function loadJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'record';
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];

  for (const rawValue of values || []) {
    const cleaned = String(rawValue || '').trim();
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

function dedupeSources(values) {
  const seen = new Set();
  const result = [];

  for (const source of values || []) {
    const authority = String(source?.authority || '').trim();
    const title = String(source?.title || '').trim();
    const url = String(source?.url || '').trim();
    const note = String(source?.note || '').trim();
    const key = `${authority.toLowerCase()}|${url.toLowerCase()}`;

    if (!authority || !title || !url || seen.has(key)) continue;
    seen.add(key);
    result.push({
      authority,
      title,
      url,
      ...(note ? { note } : {}),
    });
  }

  return result;
}

async function loadManifest() {
  return loadJson(MANIFEST_PATH);
}

async function collectionMetaMap() {
  const manifest = await loadManifest();
  return Object.fromEntries(manifest.collections.map((item) => [item.name, item]));
}

function resolvePath(relativePath) {
  return path.join(ROOT, relativePath);
}

function detailUrl(meta, recordId) {
  if (meta.detail_page) {
    return `${meta.detail_page}?id=${encodeURIComponent(recordId)}`;
  }
  return `${meta.listing_page}#${recordId}`;
}

function normalizeStringFields(record) {
  const keys = [
    'id',
    'name',
    'summary',
    'website_url',
    'country',
    'region',
    'locality',
    'postcode',
    'type',
    'short_name',
    'parish_type',
    'business_type',
    'school_type',
    'place_type',
    'organisation_type',
    'cathedral_city',
    'coverage_note',
    'jurisdiction_id',
    'diocese_id',
    'related_parish_id',
    'rite',
    'mass_times_url',
    'parish_directory_url',
    'conference_profile_url',
    'education_directory_url',
  ];

  for (const key of keys) {
    if (typeof record[key] === 'string') {
      record[key] = record[key].trim();
    }
  }
}

function normalizeRecord(record, meta) {
  const normalized = { ...record };
  normalized.entity_type = meta.entity_type;
  normalized.slug = slugify(normalized.slug || normalized.name || normalized.id || 'record');
  normalized.verification_status = String(normalized.verification_status || 'manual-review').trim();
  normalized.sources = dedupeSources(Array.isArray(normalized.sources) ? normalized.sources : []);
  normalized.search_terms = uniqueStrings(Array.isArray(normalized.search_terms) ? normalized.search_terms : []);
  normalized.detail_url = detailUrl(meta, String(normalized.id || normalized.slug));

  if (meta.name === 'businesses') {
    const verificationMap = {
      trusted: 'reviewed',
      provisional: 'standard',
      'manual-review': 'standard',
    };
    normalized.type = String(normalized.type || 'catholic-serving').trim();
    normalized.verification = String(normalized.verification || verificationMap[normalized.verification_status] || 'standard').trim();
    normalized.verification_status = ['reviewed', 'priest', 'diocesan'].includes(normalized.verification) ? 'trusted' : 'manual-review';
  }

  if (Array.isArray(normalized.country_scope)) {
    normalized.country_scope = uniqueStrings(normalized.country_scope);
  }
  if (Array.isArray(normalized.islands)) {
    normalized.islands = uniqueStrings(normalized.islands);
  }

  if (Array.isArray(normalized.resource_links)) {
    normalized.resource_links = normalized.resource_links
      .map((item) => ({
        label: String(item?.label || '').trim(),
        url: String(item?.url || '').trim(),
        type: String(item?.type || '').trim(),
        description: String(item?.description || '').trim(),
      }))
      .filter((item) => item.label && item.url);
  }

  normalizeStringFields(normalized);
  return normalized;
}

async function importCollection(name) {
  const metaMap = await collectionMetaMap();
  const meta = metaMap[name];
  if (!meta) {
    throw new Error(`Unknown collection: ${name}`);
  }

  const sourceRecords = await loadJson(resolvePath(meta.imports));
  const normalized = sourceRecords
    .map((record) => normalizeRecord(record, meta))
    .sort((a, b) => {
      const aKey = `${a.country || a.locality || ''}\u0000${a.name || ''}`;
      const bKey = `${b.country || b.locality || ''}\u0000${b.name || ''}`;
      return aKey.localeCompare(bKey);
    });

  await writeJson(resolvePath(meta.output), normalized);
  return normalized;
}

async function importAll() {
  const metaMap = await collectionMetaMap();
  const entries = await Promise.all(
    Object.keys(metaMap).map(async (name) => [name, await importCollection(name)]),
  );
  return Object.fromEntries(entries);
}

async function loadCollections() {
  const metaMap = await collectionMetaMap();
  const result = {};

  for (const [name, meta] of Object.entries(metaMap)) {
    const filePath = resolvePath(meta.output);
    try {
      result[name] = await loadJson(filePath);
    } catch (_) {
      result[name] = [];
    }
  }

  return result;
}

function addIssue(issues, severity, collection, recordId, message) {
  issues.push({
    severity,
    collection,
    record_id: recordId,
    message,
  });
}

async function validateCollections(collections) {
  const metaMap = await collectionMetaMap();
  const issues = [];
  const jurisdictions = new Set((collections.jurisdictions || []).map((item) => item.id));
  const dioceses = new Set((collections.dioceses || []).map((item) => item.id));
  const parishes = new Set((collections.parishes || []).map((item) => item.id));

  for (const [name, meta] of Object.entries(metaMap)) {
    const seenIds = new Set();

    for (const record of collections[name] || []) {
      const recordId = String(record.id || 'missing-id');

      if (seenIds.has(recordId)) {
        addIssue(issues, 'error', name, recordId, 'Duplicate record id.');
      }
      seenIds.add(recordId);

      for (const field of meta.required_fields || []) {
        const value = record[field];
        if (value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length)) {
          addIssue(issues, 'error', name, recordId, `Missing required field: ${field}.`);
        }
      }

      if (!VALID_VERIFICATION.has(record.verification_status)) {
        addIssue(issues, 'error', name, recordId, 'Invalid verification_status.');
      }

      if (name === 'businesses') {
        if (!VALID_BUSINESS_TYPES.has(record.type)) {
          addIssue(issues, 'error', name, recordId, 'Invalid business directory type.');
        }
        if (!VALID_BUSINESS_VERIFICATION.has(record.verification)) {
          addIssue(issues, 'error', name, recordId, 'Invalid business verification level.');
        }
      }

      if (!Array.isArray(record.sources) || !record.sources.length) {
        addIssue(issues, 'error', name, recordId, 'At least one source is required.');
      }

      for (const urlField of ['website_url', 'mass_times_url', 'parish_directory_url', 'conference_profile_url', 'education_directory_url']) {
        if (record[urlField] && !String(record[urlField]).startsWith('http://') && !String(record[urlField]).startsWith('https://')) {
          addIssue(issues, 'error', name, recordId, `${urlField} must be an http or https URL.`);
        }
      }

      if (name === 'dioceses' && record.jurisdiction_id && !jurisdictions.has(record.jurisdiction_id)) {
        addIssue(issues, 'error', name, recordId, 'Unknown jurisdiction_id reference.');
      }
      if ((name === 'parishes' || name === 'schools') && record.diocese_id && !dioceses.has(record.diocese_id)) {
        addIssue(issues, 'error', name, recordId, 'Unknown diocese_id reference.');
      }
      if (name === 'places' && record.related_parish_id && !parishes.has(record.related_parish_id)) {
        addIssue(issues, 'error', name, recordId, 'Unknown related_parish_id reference.');
      }

      if (name === 'businesses' && record.verification === 'standard') {
        addIssue(issues, 'warning', name, recordId, 'Business listing is still at standard listing level.');
      } else if (name !== 'businesses' && record.verification_status !== 'trusted') {
        addIssue(issues, 'warning', name, recordId, 'Record still requires editorial review before broad publication.');
      }
    }
  }

  await writeJson(path.join(REVIEW_DIR, 'issues.json'), issues);
  return issues;
}

async function buildGeocodeQueue(collections) {
  const queue = [];
  for (const collectionName of ['dioceses', 'parishes', 'businesses', 'schools', 'places']) {
    for (const record of collections[collectionName] || []) {
      if (record.latitude !== undefined && record.longitude !== undefined && record.latitude !== null && record.longitude !== null) {
        continue;
      }

      const locality = String(record.locality || record.cathedral_city || '').trim();
      const country = String(record.country || '').trim();
      const postcode = String(record.postcode || '').trim();
      if (!locality && !country && !postcode) continue;

      const parts = [record.name, locality, postcode, country].filter(Boolean);
      queue.push({
        collection: collectionName,
        record_id: record.id,
        query: parts.join(', '),
        status: 'pending-manual-geocode',
      });
    }
  }

  await writeJson(path.join(REVIEW_DIR, 'geocode-queue.json'), queue);
  return queue;
}

async function buildDuplicateCandidates(collections) {
  const seen = new Map();

  for (const [collectionName, records] of Object.entries(collections)) {
    for (const record of records || []) {
      const key = [
        slugify(record.name || ''),
        slugify(record.locality || record.cathedral_city || ''),
        slugify(record.country || ''),
      ].join('|');
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key).push({ collection: collectionName, record_id: record.id });
    }
  }

  const duplicates = [...seen.entries()]
    .filter(([, records]) => records.length > 1)
    .map(([normalizedKey, records]) => ({ normalized_key: normalizedKey.replace(/\|/g, ' | '), records }));

  await writeJson(path.join(REVIEW_DIR, 'duplicate-candidates.json'), duplicates);
  return duplicates;
}

function uniqueSearchKeywords(record) {
  return uniqueStrings([
    record.name,
    record.short_name,
    record.type || record.parish_type || record.business_type || record.organisation_type || record.school_type || record.place_type,
    record.verification,
    record.locality,
    record.country,
    ...(record.country_scope || []),
    ...(record.search_terms || []),
    ...(record.islands || []),
  ]);
}

async function buildDirectorySearch(collections) {
  const entries = [];

  for (const [collectionName, records] of Object.entries(collections)) {
    for (const record of records || []) {
      const descriptor = record.summary || `${record.name} in ${record.locality || record.country || (record.country_scope || []).join(', ')}.`;
      entries.push({
        id: `directory:${collectionName}:${record.id}`,
        url: record.detail_url || 'directory.html',
        title: record.name,
        section: `Directory: ${collectionName.charAt(0).toUpperCase()}${collectionName.slice(1)}`,
        description: descriptor,
        keywords: uniqueSearchKeywords(record).join(' '),
        source: 'directory',
      });
    }
  }

  await writeJson(path.join(DERIVED_DIR, 'search-index.json'), entries);

  let existing = [];
  try {
    existing = await loadJson(SITE_SEARCH_PATH);
  } catch (_) {
    existing = [];
  }

  const merged = existing.filter((item) => item.source !== 'directory').concat(entries);
  await writeJson(SITE_SEARCH_PATH, merged);
  return entries;
}

async function runAll() {
  await importAll();
  const collections = await loadCollections();
  const issues = await validateCollections(collections);
  await buildGeocodeQueue(collections);
  await buildDuplicateCandidates(collections);
  await buildDirectorySearch(collections);

  const recordCount = Object.values(collections).reduce((sum, records) => sum + records.length, 0);
  const errorCount = issues.filter((issue) => issue.severity === 'error').length;

  console.log(`Imported ${recordCount} directory records across ${Object.keys(collections).length} collections.`);
  console.log(`Validation issues written to ${path.join(REVIEW_DIR, 'issues.json')}.`);
  return errorCount ? 1 : 0;
}

function usage() {
  console.log('Usage: node scripts/directory_cli.mjs <command> [collection]');
  console.log('Commands: import <collection|all>, validate, geocode, dedupe, build-search, all');
}

async function main(argv) {
  const [command, collection] = argv;
  if (!command) {
    usage();
    return 2;
  }

  if (command === 'import') {
    if (!collection) {
      usage();
      return 2;
    }
    if (collection === 'all') {
      await importAll();
    } else {
      await importCollection(collection);
    }
    return 0;
  }

  const collections = await loadCollections();

  if (command === 'validate') {
    const issues = await validateCollections(collections);
    console.log(`Validated collections with ${issues.length} issues.`);
    return issues.some((issue) => issue.severity === 'error') ? 1 : 0;
  }

  if (command === 'geocode') {
    const queue = await buildGeocodeQueue(collections);
    console.log(`Queued ${queue.length} records for manual geocoding.`);
    return 0;
  }

  if (command === 'dedupe') {
    const duplicates = await buildDuplicateCandidates(collections);
    console.log(`Found ${duplicates.length} duplicate candidates.`);
    return 0;
  }

  if (command === 'build-search') {
    const entries = await buildDirectorySearch(collections);
    console.log(`Built ${entries.length} directory search entries.`);
    return 0;
  }

  if (command === 'all') {
    return runAll();
  }

  usage();
  return 2;
}

process.exitCode = await main(process.argv.slice(2));
