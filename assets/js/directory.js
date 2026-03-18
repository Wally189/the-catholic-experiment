(() => {
  const collectionCache = new Map();

  const collectionMeta = {
    jurisdictions: {
      path: 'assets/data/directory/collections/jurisdictions.json',
      title: 'Jurisdictions',
      primaryField: 'country_scope',
      secondaryField: 'type',
    },
    dioceses: {
      path: 'assets/data/directory/collections/dioceses.json',
      title: 'Dioceses',
      primaryField: 'country',
      secondaryField: 'type',
    },
    parishes: {
      path: 'assets/data/directory/collections/parishes.json',
      title: 'Parishes',
      primaryField: 'country',
      secondaryField: 'diocese_id',
    },
    organisations: {
      path: 'assets/data/directory/collections/organisations.json',
      title: 'Organisations',
      primaryField: 'country_scope',
      secondaryField: 'organisation_type',
    },
    businesses: {
      path: 'assets/data/directory/collections/businesses.json',
      title: 'Businesses',
      primaryField: 'country',
      secondaryField: 'business_type',
    },
    schools: {
      path: 'assets/data/directory/collections/schools.json',
      title: 'Schools',
      primaryField: 'country',
      secondaryField: 'diocese_id',
    },
    places: {
      path: 'assets/data/directory/collections/places.json',
      title: 'Places',
      primaryField: 'country',
      secondaryField: 'place_type',
    },
  };

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function fetchCollection(name) {
    if (!collectionCache.has(name)) {
      const meta = collectionMeta[name];
      const promise = fetch(meta.path)
        .then((response) => {
          if (!response.ok) throw new Error(`Failed to fetch ${meta.path}`);
          return response.json();
        })
        .catch(() => []);
      collectionCache.set(name, promise);
    }
    return collectionCache.get(name);
  }

  async function loadDirectoryContext() {
    const [manifest, reviewIssues, ...collections] = await Promise.all([
      fetch('assets/data/directory/manifest.json').then((response) => response.ok ? response.json() : { collections: [] }).catch(() => ({ collections: [] })),
      fetch('assets/data/directory/review/issues.json').then((response) => response.ok ? response.json() : []).catch(() => []),
      ...Object.keys(collectionMeta).map((name) => fetchCollection(name)),
    ]);

    const names = Object.keys(collectionMeta);
    const map = {};
    names.forEach((name, index) => {
      map[name] = collections[index];
    });
    map.manifest = manifest;
    map.reviewIssues = reviewIssues;
    return map;
  }

  function buildLookup(records) {
    const lookup = new Map();
    (records || []).forEach((record) => lookup.set(record.id, record));
    return lookup;
  }

  function firstSource(record) {
    return Array.isArray(record.sources) && record.sources.length ? record.sources[0] : null;
  }

  function sourceMarkup(record) {
    if (!Array.isArray(record.sources) || !record.sources.length) {
      return '<span class="micro">Source pending review</span>';
    }
    return record.sources.map((source) => `
      <li>
        <a href="${escapeHtml(source.url)}" rel="noopener" target="_blank">${escapeHtml(source.title)}</a>
        <span class="micro">${escapeHtml(source.authority)}</span>
      </li>`).join('');
  }

  function badge(text, variant = '') {
    return `<span class="badge${variant ? ` ${variant}` : ''}">${escapeHtml(text)}</span>`;
  }

  function statusBadge(status) {
    const tone = status === 'trusted' ? 'badge-trusted' : status === 'provisional' ? 'badge-provisional' : 'badge-review';
    return badge(status, tone);
  }

  function domainFromUrl(value) {
    try {
      return new URL(value).hostname.replace(/^www\./i, '');
    } catch (_) {
      return '';
    }
  }

  function trustedParishSearchUrl(record, query = '') {
    const domain = domainFromUrl(record.website_url || record.conference_profile_url || '');
    if (!domain) return record.website_url || record.conference_profile_url || '';
    const terms = [
      `site:${domain}`,
      query,
      'parish',
      'catholic',
      record.short_name || record.name || '',
    ].filter(Boolean).join(' ');
    return `https://www.google.com/search?q=${encodeURIComponent(terms)}`;
  }

  function islandLinksForRecord(record) {
    const map = {
      'Isle of Man': { label: 'Isle of Man hub', url: 'catholic-britain-ireland.html#isle-of-man', description: 'Regional hub page for the Isle of Man.' },
      'Channel Islands': { label: 'Channel Islands hub', url: 'catholic-britain-ireland.html#channel-islands-jersey', description: 'Regional hub page for Jersey and the wider Channel Islands.' },
      Jersey: { label: 'Channel Islands hub', url: 'catholic-britain-ireland.html#channel-islands-jersey', description: 'Regional hub page for Jersey and the wider Channel Islands.' },
      Guernsey: { label: 'Channel Islands hub', url: 'catholic-britain-ireland.html#channel-islands-jersey', description: 'Regional hub page for Jersey and the wider Channel Islands.' },
      'Isles of Scilly': { label: 'Britain & Ireland hub', url: 'catholic-britain-ireland.html#england', description: 'Regional hub page for England and associated island routes.' },
      Orkney: { label: 'Orkney and Shetland hub', url: 'catholic-britain-ireland.html#orkney-and-shetland', description: 'Regional hub page for northern island Catholic routes.' },
      Shetland: { label: 'Orkney and Shetland hub', url: 'catholic-britain-ireland.html#orkney-and-shetland', description: 'Regional hub page for northern island Catholic routes.' },
      Anglesey: { label: 'Wales hub', url: 'catholic-britain-ireland.html#wales', description: 'Regional hub page for Wales and north Wales diocesan routes.' },
      'Aran Islands': { label: 'Ireland hub', url: 'catholic-britain-ireland.html#ireland', description: 'Regional hub page for Ireland and island diocesan routes.' },
      'Inner Hebrides': { label: 'Scotland hub', url: 'catholic-britain-ireland.html#scotland', description: 'Regional hub page for Scotland and island diocesan routes.' },
      'Outer Hebrides': { label: 'Scotland hub', url: 'catholic-britain-ireland.html#scotland', description: 'Regional hub page for Scotland and island diocesan routes.' },
    };

    return (record.islands || [])
      .map((name) => map[name])
      .filter(Boolean);
  }

  function educationLinksForRecord(record) {
    const links = [];

    if (record.country === 'England' || record.country === 'Wales') {
      links.push(
        {
          label: 'Catholic Education Service',
          url: 'https://www.catholiceducation.org.uk/',
          description: 'National Catholic education route for England and Wales.',
        },
        {
          label: "St Mary's University, Twickenham",
          url: 'https://www.stmarys.ac.uk/',
          description: 'Catholic university in England.',
        },
        {
          label: 'Newman University',
          url: 'https://www.newman.ac.uk/',
          description: 'Catholic university in Birmingham.',
        },
      );
    }

    if (record.country === 'Scotland') {
      links.push({
        label: 'Scottish Catholic Education Service',
        url: 'https://sces.uk.com/',
        description: 'Official national Catholic education route for Scotland.',
      });
    }

    if (record.country === 'Northern Ireland') {
      links.push(
        {
          label: 'Council for Catholic Maintained Schools',
          url: 'https://onlineccms.com/',
          description: 'Official route into Catholic maintained schools in Northern Ireland.',
        },
        {
          label: "St Mary's University College Belfast",
          url: 'https://www.stmarys-belfast.ac.uk/',
          description: 'Catholic university college in Belfast.',
        },
      );
    }

    if (record.country === 'Ireland') {
      links.push(
        {
          label: 'Catholic Primary School Management Association',
          url: 'https://cpsma.ie/',
          description: 'National Catholic primary school management route for Ireland.',
        },
        {
          label: 'Catholic Education Irish Schools Trust',
          url: 'https://ceist.ie/',
          description: 'Catholic trust body for post-primary schools in Ireland.',
        },
        {
          label: "St Patrick's Pontifical University, Maynooth",
          url: 'https://sppu.ie/',
          description: 'Pontifical university for theology, philosophy, canon law, and formation.',
        },
        {
          label: 'Mary Immaculate College',
          url: 'https://www.mic.ul.ie/',
          description: 'Catholic-founded higher-education route in Limerick.',
        },
      );
    }

    return links;
  }

  function officialParishLinks(record, query = '') {
    const links = [];

    if (record.website_url) {
      links.push({
        label: 'Official diocesan site',
        url: record.website_url,
        description: 'Open the diocesan website directly.',
      });
    }

    if (record.conference_profile_url) {
      links.push({
        label: 'Conference profile',
        url: record.conference_profile_url,
        description: 'Open the bishops’ conference profile for this diocese.',
      });
    }

    const searchUrl = trustedParishSearchUrl(record, query);
    if (searchUrl) {
      links.push({
        label: query ? `Search official results for "${query}"` : 'Search official parish results',
        url: searchUrl,
        description: 'Google site search restricted to the official diocesan domain.',
      });
    }

    return links;
  }

  function linksToListItems(links) {
    return links.map((item) => `
      <li>
        <a href="${escapeHtml(item.url)}" rel="noopener" target="_blank">${escapeHtml(item.label)}</a>
        ${item.description ? `<span class="micro">${escapeHtml(item.description)}</span>` : ''}
      </li>`);
  }

  function summarizeValues(record, field, lookups) {
    const value = record[field];
    if (Array.isArray(value)) return value;
    if (field === 'diocese_id') {
      const diocese = lookups.dioceses.get(value);
      return diocese ? [diocese.short_name || diocese.name] : [];
    }
    return value ? [String(value)] : [];
  }

  function filterRecords(records, query, primaryValue, secondaryValue, meta, lookups) {
    const normalizedQuery = String(query || '').trim().toLowerCase();
    return records.filter((record) => {
      if (primaryValue) {
        const values = summarizeValues(record, meta.primaryField, lookups).map((item) => item.toLowerCase());
        if (!values.includes(primaryValue.toLowerCase())) return false;
      }
      if (secondaryValue) {
        const values = summarizeValues(record, meta.secondaryField, lookups).map((item) => item.toLowerCase());
        if (!values.includes(secondaryValue.toLowerCase())) return false;
      }
      if (!normalizedQuery) return true;
      const haystack = [
        record.name,
        record.summary,
        record.country,
        record.region,
        record.locality,
        record.postcode,
        record.short_name,
        record.type,
        record.parish_type,
        record.business_type,
        record.school_type,
        record.place_type,
        record.organisation_type,
        ...(record.search_terms || []),
      ].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }

  function optionLabel(field, value, lookups) {
    if (field === 'diocese_id') {
      const diocese = lookups.dioceses.get(value);
      return diocese ? (diocese.short_name || diocese.name) : value;
    }
    return value;
  }

  function populateFilter(select, values, field, lookups, label) {
    if (!select) return;
    const options = ['<option value="">' + escapeHtml(label) + '</option>'];
    values.forEach((value) => {
      options.push(`<option value="${escapeHtml(value)}">${escapeHtml(optionLabel(field, value, lookups))}</option>`);
    });
    select.innerHTML = options.join('');
  }

  function uniqueFilterValues(records, field) {
    const seen = new Set();
    const values = [];
    records.forEach((record) => {
      const rawValue = record[field];
      const items = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];
      items.forEach((item) => {
        const value = String(item).trim();
        if (!value || seen.has(value)) return;
        seen.add(value);
        values.push(value);
      });
    });
    return values.sort((a, b) => a.localeCompare(b));
  }

  function rowForCollection(name, record, lookups) {
    if (name === 'dioceses') {
      const jurisdiction = lookups.jurisdictions.get(record.jurisdiction_id);
      return `
        <tr id="${escapeHtml(record.id)}">
          <td><strong><a href="${escapeHtml(record.detail_url)}">${escapeHtml(record.short_name || record.name)}</a></strong><span class="micro">${escapeHtml(record.name)}</span></td>
          <td>${badge(record.country)} ${(record.islands || []).map((item) => badge(item)).join(' ')}<div class="micro">${escapeHtml(record.region || '')}</div></td>
          <td>${escapeHtml(record.coverage_note || record.summary || '')}</td>
          <td>${badge(record.type || 'diocese')}<div class="micro">${escapeHtml(jurisdiction ? jurisdiction.name : '')}</div></td>
          <td>${statusBadge(record.verification_status)}</td>
          <td>${record.website_url ? `<a href="${escapeHtml(record.website_url)}" rel="noopener" target="_blank">Official site</a>` : (firstSource(record) ? `<a href="${escapeHtml(firstSource(record).url)}" rel="noopener" target="_blank">${escapeHtml(firstSource(record).title)}</a>` : '')}</td>
        </tr>`;
    }

    if (name === 'parishes') {
      const diocese = lookups.dioceses.get(record.diocese_id);
      return `
        <tr id="${escapeHtml(record.id)}">
          <td><strong><a href="${escapeHtml(record.detail_url)}">${escapeHtml(record.name)}</a></strong><span class="micro">${escapeHtml(record.parish_type || 'parish')}</span></td>
          <td>${escapeHtml(record.locality || '')}<div class="micro">${escapeHtml(record.postcode || '')}</div></td>
          <td>${escapeHtml(diocese ? (diocese.short_name || diocese.name) : '')}</td>
          <td>${badge(record.country)}<div class="micro">${escapeHtml(record.region || '')}</div></td>
          <td>${statusBadge(record.verification_status)}</td>
          <td>${firstSource(record) ? `<a href="${escapeHtml(firstSource(record).url)}" rel="noopener" target="_blank">${escapeHtml(firstSource(record).title)}</a>` : ''}</td>
        </tr>`;
    }

    if (name === 'businesses') {
      return `
        <tr id="${escapeHtml(record.id)}">
          <td><strong>${escapeHtml(record.name)}</strong><span class="micro">${escapeHtml(record.summary || '')}</span></td>
          <td>${escapeHtml(record.locality || '')}<div class="micro">${escapeHtml(record.region || '')}</div></td>
          <td>${badge(record.country)}</td>
          <td>${badge(record.business_type || 'business')}</td>
          <td>${statusBadge(record.verification_status)}</td>
          <td><a href="${escapeHtml(record.website_url || record.detail_url)}" rel="noopener" target="_blank">Visit</a></td>
        </tr>`;
    }

    if (name === 'organisations') {
      return `
        <tr id="${escapeHtml(record.id)}">
          <td><strong>${escapeHtml(record.name)}</strong><span class="micro">${escapeHtml(record.summary || '')}</span></td>
          <td>${(record.country_scope || []).map((item) => badge(item)).join(' ')}</td>
          <td>${badge(record.organisation_type || 'organisation')}</td>
          <td>${statusBadge(record.verification_status)}</td>
          <td><a href="${escapeHtml(record.website_url || record.detail_url)}" rel="noopener" target="_blank">Official site</a></td>
        </tr>`;
    }

    if (name === 'schools') {
      const diocese = lookups.dioceses.get(record.diocese_id);
      return `
        <tr id="${escapeHtml(record.id)}">
          <td><strong>${escapeHtml(record.name)}</strong><span class="micro">${escapeHtml(record.summary || '')}</span></td>
          <td>${escapeHtml(record.locality || '')}</td>
          <td>${escapeHtml(diocese ? (diocese.short_name || diocese.name) : (record.region || 'National route'))}</td>
          <td>${badge(record.school_type || 'school')}</td>
          <td>${statusBadge(record.verification_status)}</td>
          <td><a href="${escapeHtml(record.website_url || record.detail_url)}" rel="noopener" target="_blank">Official site</a></td>
        </tr>`;
    }

    if (name === 'places') {
      const relatedParish = lookups.parishes.get(record.related_parish_id);
      return `
        <tr id="${escapeHtml(record.id)}">
          <td><strong>${escapeHtml(record.name)}</strong><span class="micro">${escapeHtml(record.summary || '')}</span></td>
          <td>${escapeHtml(record.locality || '')}<div class="micro">${escapeHtml(record.region || '')}</div></td>
          <td>${badge(record.country)}</td>
          <td>${badge(record.place_type || 'place')}</td>
          <td>${relatedParish ? `<a href="${escapeHtml(relatedParish.detail_url)}">${escapeHtml(relatedParish.name)}</a>` : '<span class="micro">Standalone listing</span>'}</td>
          <td><a href="${escapeHtml(record.website_url || record.detail_url)}" rel="noopener" target="_blank">Official site</a></td>
        </tr>`;
    }

    return '';
  }

  async function renderListPage(name) {
    const data = await loadDirectoryContext();
    const records = data[name] || [];
    const lookups = {
      dioceses: buildLookup(data.dioceses),
      parishes: buildLookup(data.parishes),
      jurisdictions: buildLookup(data.jurisdictions),
    };
    const meta = collectionMeta[name];
    const filterLabels = {
      dioceses: { primary: 'All countries', secondary: 'All jurisdictions' },
      parishes: { primary: 'All countries', secondary: 'All dioceses' },
      organisations: { primary: 'All scopes', secondary: 'All types' },
      businesses: { primary: 'All countries', secondary: 'All categories' },
      schools: { primary: 'All scopes', secondary: 'All types' },
      places: { primary: 'All countries', secondary: 'All types' },
      jurisdictions: { primary: 'All scopes', secondary: 'All types' },
    };
    const tbody = document.querySelector('[data-directory-table-body]');
    const queryInput = document.querySelector('[data-directory-search]');
    const primarySelect = document.querySelector('[data-directory-filter-primary]');
    const secondarySelect = document.querySelector('[data-directory-filter-secondary]');
    const countNode = document.querySelector('[data-directory-results-count]');
    const reviewNode = document.querySelector('[data-directory-review-count]');

    populateFilter(primarySelect, uniqueFilterValues(records, meta.primaryField), meta.primaryField, lookups, filterLabels[name]?.primary || 'All places');
    populateFilter(secondarySelect, uniqueFilterValues(records, meta.secondaryField), meta.secondaryField, lookups, filterLabels[name]?.secondary || 'All types');

    const render = () => {
      const filtered = filterRecords(records, queryInput ? queryInput.value : '', primarySelect ? primarySelect.value : '', secondarySelect ? secondarySelect.value : '', meta, lookups);
      if (countNode) {
        countNode.textContent = `${filtered.length} of ${records.length} records visible`;
      }
      if (!tbody) return;
      if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="6"><span class="micro">No matching records yet.</span></td></tr>';
        return;
      }
      tbody.innerHTML = filtered.map((record) => rowForCollection(name, record, lookups)).join('');
    };

    if (reviewNode) {
      const issues = (data.reviewIssues || []).filter((issue) => issue.collection === name && issue.severity !== 'error');
      reviewNode.textContent = issues.length ? `${issues.length} records still flagged for review.` : 'No current review warnings for this collection.';
    }

    [queryInput, primarySelect, secondarySelect].forEach((control) => {
      if (control) control.addEventListener('input', render);
      if (control) control.addEventListener('change', render);
    });

    render();
  }

  function relatedMarkup(title, records, emptyMessage) {
    return `
      <section class="card article detail-related-block">
        <h2>${escapeHtml(title)}</h2>
        ${records.length ? `<ul class="detail-related-list">${records.join('')}</ul>` : `<p class="micro">${escapeHtml(emptyMessage)}</p>`}
      </section>`;
  }

  async function renderDetailPage(name) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const data = await loadDirectoryContext();
    const records = data[name] || [];
    const record = records.find((item) => item.id === id);
    const titleNode = document.querySelector('[data-detail-title]');
    const summaryNode = document.querySelector('[data-detail-summary]');
    const metaNode = document.querySelector('[data-detail-meta]');
    const sourcesNode = document.querySelector('[data-detail-sources]');
    const relatedNode = document.querySelector('[data-detail-related]');

    if (!record) {
      if (titleNode) titleNode.textContent = 'Record not found';
      if (summaryNode) summaryNode.textContent = 'This record has not been seeded yet or is still under review.';
      return;
    }

    document.title = `${record.name} | The Catholic Experiment`;
    if (titleNode) titleNode.textContent = record.name;
    if (summaryNode) summaryNode.textContent = record.summary || '';

    const dioceses = buildLookup(data.dioceses);
    const parishes = buildLookup(data.parishes);
    const jurisdictions = buildLookup(data.jurisdictions);
    const metaItems = [];

    if (record.country) metaItems.push(badge(record.country));
    if (record.region) metaItems.push(badge(record.region));
    if (record.locality) metaItems.push(badge(record.locality));
    if (record.type) metaItems.push(badge(record.type));
    if (record.parish_type) metaItems.push(badge(record.parish_type));
    if (record.business_type) metaItems.push(badge(record.business_type));
    if (record.school_type) metaItems.push(badge(record.school_type));
    if (record.place_type) metaItems.push(badge(record.place_type));
    if (record.organisation_type) metaItems.push(badge(record.organisation_type));
    metaItems.push(statusBadge(record.verification_status));

    if (record.website_url) {
      metaItems.push(`<a class="btn ghost" href="${escapeHtml(record.website_url)}" rel="noopener" target="_blank">Official site</a>`);
    }
    if (record.diocese_id && dioceses.get(record.diocese_id)) {
      const diocese = dioceses.get(record.diocese_id);
      metaItems.push(`<a class="btn ghost" href="${escapeHtml(diocese.detail_url)}">${escapeHtml(diocese.short_name || diocese.name)}</a>`);
    }
    if (record.jurisdiction_id && jurisdictions.get(record.jurisdiction_id)) {
      const jurisdiction = jurisdictions.get(record.jurisdiction_id);
      metaItems.push(badge(jurisdiction.name));
    }
    if (metaNode) metaNode.innerHTML = metaItems.join(' ');
    if (sourcesNode) sourcesNode.innerHTML = sourceMarkup(record);

    if (!relatedNode) return;

    const relatedSections = [];
    if (name === 'dioceses') {
      if (record.coverage_note || (record.islands || []).length) {
        relatedSections.push(`
          <section class="card article detail-related-block">
            <h2>Coverage</h2>
            ${record.coverage_note ? `<p>${escapeHtml(record.coverage_note)}</p>` : ''}
            ${(record.islands || []).length ? `<p class="micro">Island scope: ${escapeHtml(record.islands.join(', '))}</p>` : ''}
          </section>`);
      }

      relatedSections.push(relatedMarkup(
        'Official parish routes',
        linksToListItems(officialParishLinks(record)),
        'No official parish routes have been recorded for this diocese yet.',
      ));

      relatedSections.push(relatedMarkup(
        'Education and higher-education routes',
        linksToListItems(educationLinksForRecord(record)),
        'No education routes have been recorded for this diocese yet.',
      ));

      const islandLinks = islandLinksForRecord(record);
      if (islandLinks.length) {
        relatedSections.push(relatedMarkup(
          'Island coverage links',
          linksToListItems(islandLinks),
          'No island links recorded.',
        ));
      }

      const relatedParishes = (data.parishes || []).filter((item) => item.diocese_id === record.id).map((item) => `<li><a href="${escapeHtml(item.detail_url)}">${escapeHtml(item.name)}</a><span class="micro">${escapeHtml(item.locality || '')}</span></li>`);
      const relatedSchools = (data.schools || []).filter((item) => item.diocese_id === record.id).map((item) => `<li><a href="${escapeHtml(item.detail_url)}">${escapeHtml(item.name)}</a></li>`);
      relatedSections.push(relatedMarkup('Seeded parishes', relatedParishes, 'No parish records seeded for this diocese yet.'));
      relatedSections.push(relatedMarkup('Seeded schools', relatedSchools, 'No school records seeded for this diocese yet.'));
    }
    if (name === 'parishes') {
      const relatedPlaces = (data.places || []).filter((item) => item.related_parish_id === record.id).map((item) => `<li><a href="${escapeHtml(item.detail_url)}">${escapeHtml(item.name)}</a></li>`);
      relatedSections.push(relatedMarkup('Related places', relatedPlaces, 'No related places have been linked yet.'));
    }
    relatedNode.innerHTML = relatedSections.join('');
  }

  async function renderHubPage() {
    const data = await loadDirectoryContext();
    const target = document.querySelector('[data-directory-hub]');
    const reviewTarget = document.querySelector('[data-directory-hub-review]');
    if (!target) return;

    const cards = Object.keys(collectionMeta).map((name) => {
      const meta = collectionMeta[name];
      const items = data[name] || [];
      const manifestEntry = (data.manifest.collections || []).find((entry) => entry.name === name) || {};
      const link = manifestEntry.listing_page || 'directory.html';
      return `
        <article class="tile">
          <div class="kicker">${escapeHtml(meta.title)}</div>
          <h3><a href="${escapeHtml(link)}">${escapeHtml(meta.title)}</a></h3>
          <p>${items.length} seeded records in the current first-pass dataset.</p>
          <a class="more" href="${escapeHtml(link)}">Browse ${escapeHtml(meta.title.toLowerCase())}</a>
        </article>`;
    });
    target.innerHTML = cards.join('');

    if (reviewTarget) {
      const issues = data.reviewIssues || [];
      reviewTarget.innerHTML = issues.length
        ? `<ul class="detail-related-list">${issues.map((issue) => `<li><strong>${escapeHtml(issue.collection)}</strong><span class="micro">${escapeHtml(issue.message)}</span></li>`).join('')}</ul>`
        : '<p class="micro">No review issues are currently recorded.</p>';
    }
  }

  function dioceseSearchScore(record, query) {
    const needle = String(query || '').trim().toLowerCase();
    if (!needle) return 0;

    let score = 0;
    const name = `${record.name || ''} ${record.short_name || ''}`.toLowerCase();
    const coverage = `${record.coverage_note || ''} ${record.summary || ''}`.toLowerCase();
    const islands = (record.islands || []).join(' ').toLowerCase();
    const searchTerms = (record.search_terms || []).join(' ').toLowerCase();

    if (name.includes(needle)) score += 60;
    if (coverage.includes(needle)) score += 25;
    if (islands.includes(needle)) score += 20;
    if (searchTerms.includes(needle)) score += 15;
    if ((record.country || '').toLowerCase().includes(needle)) score += 10;
    return score;
  }

  function trustedParishCard(record, query) {
    const links = officialParishLinks(record, query);
    return `
      <article class="tile trusted-parish-card">
        <div class="kicker">${escapeHtml(record.country || 'Diocese')}</div>
        <h3>${escapeHtml(record.short_name || record.name)}</h3>
        <p>${escapeHtml(record.coverage_note || record.summary || '')}</p>
        ${(record.islands || []).length ? `<p class="micro">Island scope: ${escapeHtml(record.islands.join(', '))}</p>` : ''}
        <div class="trusted-parish-actions">
          ${links.map((item) => `<a class="${item.label.startsWith('Search') ? 'btn' : 'btn ghost'}" href="${escapeHtml(item.url)}" rel="noopener" target="_blank">${escapeHtml(item.label)}</a>`).join('')}
        </div>
      </article>`;
  }

  async function initTrustedParishSearch() {
    const panel = document.querySelector('[data-trusted-parish-search]');
    if (!panel) return;

    const data = await loadDirectoryContext();
    const dioceses = data.dioceses || [];
    const queryInput = panel.querySelector('[data-trusted-parish-query]');
    const countrySelect = panel.querySelector('[data-trusted-parish-country]');
    const dioceseSelect = panel.querySelector('[data-trusted-parish-diocese]');
    const results = panel.querySelector('[data-trusted-parish-results]');
    if (!queryInput || !countrySelect || !dioceseSelect || !results) return;

    const countryOptions = uniqueFilterValues(dioceses, 'country');
    populateFilter(countrySelect, countryOptions, 'country', { dioceses: new Map() }, 'All countries');

    const updateDioceseOptions = () => {
      const country = countrySelect.value;
      const filtered = country ? dioceses.filter((item) => item.country === country) : dioceses;
      const values = filtered.map((item) => item.id).sort((a, b) => optionLabel('diocese_id', a, { dioceses: buildLookup(dioceses) }).localeCompare(optionLabel('diocese_id', b, { dioceses: buildLookup(dioceses) })));
      populateFilter(dioceseSelect, values, 'diocese_id', { dioceses: buildLookup(dioceses) }, 'All dioceses');
    };

    const render = () => {
      const query = queryInput.value.trim();
      const country = countrySelect.value;
      const dioceseId = dioceseSelect.value;
      const filtered = dioceses
        .filter((record) => !country || record.country === country)
        .filter((record) => !dioceseId || record.id === dioceseId)
        .map((record) => ({ record, score: dioceseSearchScore(record, query) }))
        .filter((item) => dioceseId || !query || item.score > 0)
        .sort((a, b) => (b.score - a.score) || (a.record.name || '').localeCompare(b.record.name || ''))
        .slice(0, dioceseId ? 1 : 8)
        .map((item) => item.record);

      if (!query && !dioceseId) {
        results.innerHTML = '<p class="micro">Enter a town, island, parish name, or choose a diocese to open trusted parish routes on official diocesan domains.</p>';
        return;
      }

      if (!filtered.length) {
        results.innerHTML = '<p class="micro">No diocesan route matched yet. Try a broader place name, nearby city, or the diocese filter.</p>';
        return;
      }

      results.innerHTML = filtered.map((record) => trustedParishCard(record, query)).join('');
    };

    countrySelect.addEventListener('change', () => {
      updateDioceseOptions();
      render();
    });
    dioceseSelect.addEventListener('change', render);
    queryInput.addEventListener('input', render);

    updateDioceseOptions();
    render();
  }

  function init() {
    const listPage = document.body.getAttribute('data-directory-page');
    const detailPage = document.body.getAttribute('data-directory-detail');
    const hubPage = document.body.hasAttribute('data-directory-hub-page');

    if (hubPage) {
      renderHubPage();
    }
    if (listPage && collectionMeta[listPage]) {
      renderListPage(listPage);
    }
    if (detailPage && collectionMeta[detailPage]) {
      renderDetailPage(detailPage);
    }
    initTrustedParishSearch();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
