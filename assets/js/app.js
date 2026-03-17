const TCE = (() => {
  const config = Object.assign({}, window.__TCE_CONFIG__ || {});

  function safeLocalStorage(action, key, value = null) {
    try {
      if (action === 'get') return window.localStorage.getItem(key);
      if (action === 'set') window.localStorage.setItem(key, value);
    } catch (_) {}
    return null;
  }

  function sameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function between(date, start, end) {
    return date >= start && date < end;
  }

  function easterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  function firstSundayOfAdvent(year) {
    const christmas = new Date(year, 11, 25);
    const fourthSunday = new Date(christmas);
    fourthSunday.setDate(christmas.getDate() - ((christmas.getDay() + 7) % 7));
    const advent1 = new Date(fourthSunday);
    advent1.setDate(fourthSunday.getDate() - 21);
    return advent1;
  }

  function currentLocale() {
    const host = window.location.hostname || '';
    return host.endsWith('.ie') ? 'ie' : 'gb';
  }

  function feastOverride(date, locale) {
    const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const overrides = {
      gb: {
        '04-23': { key: 'martyr', season: 'Saint George', accent: 'Red' },
        '12-29': { key: 'martyr', season: 'Saint Thomas Becket', accent: 'Red' },
      },
      ie: {
        '02-01': { key: 'white', season: 'Saint Brigid', accent: 'White' },
        '03-17': { key: 'white', season: 'Saint Patrick', accent: 'White' },
      },
    };
    return overrides[locale]?.[mmdd] || null;
  }

  function liturgicalInfo(now = new Date()) {
    const locale = currentLocale();
    const year = now.getFullYear();
    const easter = easterSunday(year);
    const ashWednesday = new Date(easter);
    ashWednesday.setDate(easter.getDate() - 46);
    const palmSunday = new Date(easter);
    palmSunday.setDate(easter.getDate() - 7);
    const holyThursday = new Date(easter);
    holyThursday.setDate(easter.getDate() - 3);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    const pentecost = new Date(easter);
    pentecost.setDate(easter.getDate() + 49);
    const baptismOfLord = (() => {
      const jan6 = new Date(year, 0, 6);
      const nextSunday = new Date(jan6);
      nextSunday.setDate(jan6.getDate() + ((7 - jan6.getDay()) % 7 || 7));
      return nextSunday;
    })();
    const advent = firstSundayOfAdvent(year);
    const christmas = new Date(year, 11, 25);
    const override = feastOverride(now, locale);
    const isGaudete = sameDate(now, new Date(advent.getFullYear(), advent.getMonth(), advent.getDate() + 14));
    const isLaetare = sameDate(now, new Date(ashWednesday.getFullYear(), ashWednesday.getMonth(), ashWednesday.getDate() + 25));

    const forced = String(config.preview_season || '').toLowerCase();
    if (forced) {
      return {
        key: forced,
        season: forced === 'ordinary' ? 'Ordinary Time' : forced.charAt(0).toUpperCase() + forced.slice(1),
        accent: forced === 'ordinary' ? 'Green' : forced,
        locale,
      };
    }
    if (isGaudete || isLaetare) return { key: 'rose', season: isGaudete ? 'Gaudete Sunday' : 'Laetare Sunday', accent: 'Rose', locale };
    if (override) return { ...override, locale };
    if (sameDate(now, palmSunday)) return { key: 'holyweek', season: 'Palm Sunday', accent: 'Red', locale };
    if (sameDate(now, holyThursday)) return { key: 'white', season: 'Holy Thursday', accent: 'White', locale };
    if (sameDate(now, goodFriday)) return { key: 'holyweek', season: 'Good Friday', accent: 'Red', locale };
    if (sameDate(now, pentecost)) return { key: 'pentecost', season: 'Pentecost', accent: 'Red', locale };
    if (between(now, new Date(year, 0, 1), baptismOfLord) || between(now, christmas, new Date(year + 1, 0, 13))) return { key: 'christmas', season: 'Christmastide', accent: 'White', locale };
    if (between(now, ashWednesday, easter)) return { key: 'lent', season: 'Lent', accent: 'Violet', locale };
    if (between(now, easter, new Date(pentecost.getFullYear(), pentecost.getMonth(), pentecost.getDate() + 1))) return { key: 'easter', season: 'Eastertide', accent: 'White', locale };
    if (between(now, advent, christmas)) return { key: 'advent', season: 'Advent', accent: 'Violet', locale };
    return { key: 'ordinary', season: 'Ordinary Time', accent: 'Green', locale };
  }

  function applyLiturgicalTheme() {
    const info = liturgicalInfo(new Date());
    document.documentElement.dataset.season = info.key;
    document.querySelectorAll('[data-season-name]').forEach((el) => { el.textContent = info.season; });
    document.querySelectorAll('[data-season-accent]').forEach((el) => { el.textContent = info.accent; });
    document.querySelectorAll('[data-locale-name]').forEach((el) => {
      el.textContent = info.locale === 'ie' ? 'Ireland' : 'England, Wales & Scotland';
    });
  }

  function canonicalHourInfo(now = new Date()) {
    const hour = now.getHours() + now.getMinutes() / 60;
    if (hour < 5.0) return { label: 'Office of Readings', slug: 'readings' };
    if (hour < 8.5) return { label: 'Lauds', slug: 'lauds' };
    if (hour < 11.5) return { label: 'Terce', slug: 'terce' };
    if (hour < 14.5) return { label: 'Sext', slug: 'sext' };
    if (hour < 17.5) return { label: 'None', slug: 'none' };
    if (hour < 20.5) return { label: 'Vespers', slug: 'vespers' };
    return { label: 'Compline', slug: 'compline' };
  }

  function updateCurrentHourLink() {
    document.querySelectorAll('[data-current-hour]').forEach((link) => {
      const info = canonicalHourInfo(new Date());
      link.href = `https://universalis.com/${info.slug}.htm`;
      const span = link.querySelector('span');
      if (span) span.textContent = info.label;
      else link.textContent = `${info.label} — Universalis`;
    });
    document.querySelectorAll('[data-today-readings]').forEach((link) => {
      link.href = 'https://universalis.com/mass.htm';
    });
  }

  function initStickyHeader() {
    const onScroll = () => document.body.classList.toggle('header-condensed', window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initLanguageSwitch() {
    const button = document.querySelector('[data-lang-toggle]');
    if (!button) return;
    
const languages = [
  { code: 'en-GB', label: 'English' },
  { code: 'ga', label: 'Gaeilge' },
  { code: 'cy', label: 'Cymraeg' },
  { code: 'gd', label: 'Gàidhlig' },
  { code: 'sco', label: 'Scots' },
  { code: 'uls', label: 'Ulstèr-Scotch' },
  { code: 'kw', label: 'Kernewek' }
];
    const apply = (lang) => {
      const index = Math.max(0, languages.findIndex((item) => item.code === lang));
      const current = languages[index];
      document.documentElement.lang = current.code;
      button.textContent = current.label;
      button.setAttribute('data-lang-current', current.code);
      button.setAttribute('aria-label', `Current language: ${current.label}. Activate to switch language.`);
      safeLocalStorage('set', 'tce-language', current.code);
    };
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const current = button.getAttribute('data-lang-current') || safeLocalStorage('get', 'tce-language') || 'en-GB';
      const index = languages.findIndex((item) => item.code === current);
      const next = languages[(index + 1) % languages.length];
      apply(next.code);
    });
    apply(safeLocalStorage('get', 'tce-language') || 'en-GB');
  }

  function initDarkMode() {
    const saved = safeLocalStorage('get', 'tce-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        safeLocalStorage('set', 'tce-theme', next);
      });
    });
  }

  function initNav() {
    document.querySelectorAll('.dropdown-toggle').forEach((button) => {
      button.setAttribute('type', 'button');
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const parent = button.closest('.dropdown');
        if (!parent) return;
        parent.classList.toggle('open');
      });
    });
    document.addEventListener('click', (event) => {
      document.querySelectorAll('.dropdown.open').forEach((menu) => {
        if (!menu.contains(event.target)) menu.classList.remove('open');
      });
    });
  }

  async function fetchJSON(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to fetch ${path}`);
    return response.json();
  }

  async function initSearch() {
    const panel = document.querySelector('.site-search');
    const input = document.querySelector('[data-search-input]');
    const results = document.querySelector('[data-search-results]');
    const openers = document.querySelectorAll('[data-open-search]');
    const closer = document.querySelector('[data-close-search]');
    if (!panel || !input || !results) return;

    let index = [];
    try { index = await fetchJSON('assets/data/search-index.json'); } catch (_) { index = []; }

    const render = (items) => {
      results.innerHTML = items.length
        ? items.map((item) => `
          <a class="search-result" href="${item.url}">
            <div class="post-meta">${item.section || ''}</div>
            <strong>${item.title || ''}</strong>
            <p class="muted">${item.description || ''}</p>
          </a>`).join('')
        : '<div class="search-result">No matching pages yet.</div>';
    };

    const open = () => {
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      input.focus();
    };
    const close = () => {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    };

    render(index.slice(0, 8));
    openers.forEach((btn) => btn.addEventListener('click', open));
    if (closer) closer.addEventListener('click', close);
    panel.addEventListener('click', (event) => { if (event.target === panel) close(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      if (!query) return render(index.slice(0, 8));
      const filtered = index.filter((item) => `${item.title || ''} ${item.description || ''} ${item.keywords || ''}`.toLowerCase().includes(query));
      render(filtered.slice(0, 16));
    });
  }

  function initCookieBanner() {
    const banner = document.querySelector('.cookie-banner');
    if (!banner) return;
    const key = 'tce-cookie-choice';
    if (!safeLocalStorage('get', key)) banner.classList.add('show');
    banner.querySelectorAll('[data-cookie-choice]').forEach((btn) => {
      btn.addEventListener('click', () => {
        safeLocalStorage('set', key, btn.getAttribute('data-cookie-choice') || 'necessary');
        banner.classList.remove('show');
      });
    });
  }

  function initParishFilter() {
    const input = document.getElementById('parishQuery');
    const rows = Array.from(document.querySelectorAll('#parishTable tbody tr'));
    if (!input || !rows.length) return;
    const apply = () => {
      const query = (input.value || '').trim().toLowerCase();
      rows.forEach((row) => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
      });
    };
    input.addEventListener('input', apply);
    window.filterParishes = apply;
  }

  function initAdmin() {
    const admin = document.querySelector('[data-admin]');
    if (!admin) return;
    const login = document.querySelector('[data-admin-login]');
    const panel = document.querySelector('[data-admin-panel]');
    const form = document.querySelector('[data-pin-form]');
    const hint = document.querySelector('[data-pin-hint]');
    const exportButton = document.querySelector('[data-export-site]');
    const pendingComments = document.querySelector('[data-pending-comments]');
    const pin = String(config.cms_pin || '1975');

    if (pendingComments) {
      const comments = JSON.parse(safeLocalStorage('get', 'tce-pending-comments') || '[]');
      pendingComments.innerHTML = comments.length
        ? comments.map((comment) => `<div class="comment"><strong>${comment.author || 'Anonymous'}</strong><div class="post-meta">${comment.date || ''}</div><p>${comment.text || ''}</p></div>`).join('')
        : '<p class="muted">No pending comments yet.</p>';
    }

    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const entered = String(new FormData(form).get('pin') || '');
        if (entered === pin) {
          if (login) login.classList.add('hidden');
          if (panel) panel.classList.remove('hidden');
          if (hint) hint.textContent = 'Access granted';
        } else if (hint) {
          hint.textContent = 'Incorrect PIN';
        }
      });
    }

    if (exportButton) {
      exportButton.addEventListener('click', () => {
        const snapshot = {
          title: config.title || 'The Catholic Experiment',
          tagline: config.tagline || '',
          contact_email: config.contact_email || '',
          footer_credit: config.footer_credit || '',
          footer_url: config.footer_url || '',
        };
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'site-settings.json';
        link.click();
        URL.revokeObjectURL(link.href);
      });
    }
  }

  function init() {
    applyLiturgicalTheme();
    updateCurrentHourLink();
    initStickyHeader();
    initLanguageSwitch();
    initDarkMode();
    initNav();
    initSearch();
    initCookieBanner();
    initParishFilter();
    initAdmin();
  }

  document.addEventListener('DOMContentLoaded', init);
  return { init, liturgicalInfo };
})();
