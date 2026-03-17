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


  function dateOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function daysBetween(start, end) {
    const ms = 24 * 60 * 60 * 1000;
    return Math.round((dateOnly(end) - dateOnly(start)) / ms);
  }

  function yyyymmdd(date) {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  }

  function weekdayName(date) {
    return new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);
  }

  function universalisBase(locale) {
    return locale === 'ie' ? 'https://universalis.com/Europe.Ireland' : 'https://universalis.com/europe.england';
  }

  function universalisPath(locale, page, now = new Date()) {
    return `${universalisBase(locale)}/${yyyymmdd(now)}/${page}.htm`;
  }

  function universalisAppLink() {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'https://apps.apple.com/hu/app/universalis/id284942719';
    if (/Android/i.test(ua)) return 'https://play.google.com/store/apps/details?hl=en_IE&id=com.universalis.android.calendar';
    return 'https://universalis.com/n-apps.htm';
  }

  function fixedObservance(date, locale) {
    const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const common = {
      '01-01': { label: 'Mary, the Holy Mother of God', rank: 'Solemnity' },
      '03-19': { label: 'Saint Joseph, husband of the Blessed Virgin Mary', rank: 'Solemnity' },
      '03-25': { label: 'The Annunciation of the Lord', rank: 'Solemnity' },
      '06-24': { label: 'The Nativity of Saint John the Baptist', rank: 'Solemnity' },
      '06-29': { label: 'Saints Peter and Paul, Apostles', rank: 'Solemnity' },
      '08-15': { label: 'The Assumption of the Blessed Virgin Mary', rank: 'Solemnity' },
      '11-01': { label: 'All Saints', rank: 'Solemnity' },
      '11-02': { label: 'All Souls', rank: 'Commemoration' },
      '12-08': { label: 'The Immaculate Conception of the Blessed Virgin Mary', rank: 'Solemnity' },
      '12-25': { label: 'The Nativity of the Lord (Christmas)', rank: 'Solemnity' },
      '12-26': { label: 'Saint Stephen, Protomartyr', rank: 'Feast' },
      '12-27': { label: 'Saint John, Apostle, Evangelist', rank: 'Feast' },
      '12-28': { label: 'The Holy Innocents, Martyrs', rank: 'Feast' },
    };
    const local = {
      gb: {
        '03-17': { label: 'Saint Patrick, Bishop, Missionary', rank: 'Feast' },
        '04-23': { label: 'Saint George, Martyr', rank: 'Solemnity' },
        '12-29': { label: 'Saint Thomas Becket, Bishop, Martyr', rank: 'Feast' },
      },
      ie: {
        '02-01': { label: 'Saint Brigid, Abbess', rank: 'Feast' },
        '03-17': { label: 'Saint Patrick, Bishop, Missionary', rank: 'Solemnity' },
      },
    };
    return local[locale]?.[mmdd] || common[mmdd] || null;
  }

  function liturgicalDayLabel(now = new Date()) {
    const locale = currentLocale();
    const year = now.getFullYear();
    const easter = dateOnly(easterSunday(year));
    const ashWednesday = addDays(easter, -46);
    const palmSunday = addDays(easter, -7);
    const holyThursday = addDays(easter, -3);
    const goodFriday = addDays(easter, -2);
    const holySaturday = addDays(easter, -1);
    const pentecost = addDays(easter, 49);
    const trinitySunday = addDays(pentecost, 7);
    const baptismOfLord = (() => {
      const jan6 = new Date(year, 0, 6);
      const nextSunday = new Date(jan6);
      nextSunday.setDate(jan6.getDate() + ((7 - jan6.getDay()) % 7 || 7));
      return dateOnly(nextSunday);
    })();
    const advent = dateOnly(firstSundayOfAdvent(year));
    const christmas = new Date(year, 11, 25);
    const today = dateOnly(now);
    const fixed = fixedObservance(today, locale);

    if (fixed) return fixed;
    if (sameDate(today, ashWednesday)) return { label: 'Ash Wednesday', rank: 'Principal day' };
    if (sameDate(today, palmSunday)) return { label: 'Palm Sunday', rank: 'Sunday' };
    if (sameDate(today, holyThursday)) return { label: 'Holy Thursday', rank: 'Principal day' };
    if (sameDate(today, goodFriday)) return { label: 'Good Friday', rank: 'Principal day' };
    if (sameDate(today, holySaturday)) return { label: 'Holy Saturday', rank: 'Principal day' };
    if (sameDate(today, easter)) return { label: 'Easter Sunday', rank: 'Solemnity' };
    if (sameDate(today, pentecost)) return { label: 'Pentecost Sunday', rank: 'Solemnity' };
    if (sameDate(today, trinitySunday)) return { label: 'Trinity Sunday', rank: 'Solemnity' };

    if (between(today, ashWednesday, easter)) {
      const firstSunday = addDays(ashWednesday, 4);
      if (today.getDay() === 0) {
        const week = Math.floor(daysBetween(firstSunday, today) / 7) + 1;
        if (week === 4) return { label: '4th Sunday of Lent (Laetare Sunday)', rank: 'Sunday' };
        return { label: `${week}${week === 1 ? 'st' : week === 2 ? 'nd' : week === 3 ? 'rd' : 'th'} Sunday of Lent`, rank: 'Sunday' };
      }
      if (today < firstSunday) return { label: `${weekdayName(today)} after Ash Wednesday`, rank: 'Weekday' };
      const week = Math.floor(daysBetween(firstSunday, today) / 7) + 1;
      return { label: `${weekdayName(today)} of the ${week}${week === 1 ? 'st' : week === 2 ? 'nd' : week === 3 ? 'rd' : 'th'} week of Lent`, rank: 'Weekday' };
    }

    if (between(today, easter, addDays(pentecost, 1))) {
      if (today.getDay() === 0) {
        if (sameDate(today, easter)) return { label: 'Easter Sunday', rank: 'Solemnity' };
        const week = Math.floor(daysBetween(easter, today) / 7) + 1;
        return { label: `${week}${week === 1 ? 'st' : week === 2 ? 'nd' : week === 3 ? 'rd' : 'th'} Sunday of Easter`, rank: 'Sunday' };
      }
      if (daysBetween(easter, today) < 7) return { label: `${weekdayName(today)} within the Octave of Easter`, rank: 'Weekday' };
      const secondSunday = addDays(easter, 7);
      const week = Math.floor(daysBetween(secondSunday, today) / 7) + 2;
      return { label: `${weekdayName(today)} of the ${week}${week === 1 ? 'st' : week === 2 ? 'nd' : week === 3 ? 'rd' : 'th'} week of Easter`, rank: 'Weekday' };
    }

    if (between(today, advent, christmas)) {
      if (today.getDay() === 0) {
        const week = Math.floor(daysBetween(advent, today) / 7) + 1;
        return { label: `${week}${week === 1 ? 'st' : week === 2 ? 'nd' : week === 3 ? 'rd' : 'th'} Sunday of Advent`, rank: 'Sunday' };
      }
      const week = Math.floor(daysBetween(advent, today) / 7) + 1;
      return { label: `${weekdayName(today)} of the ${week}${week === 1 ? 'st' : week === 2 ? 'nd' : week === 3 ? 'rd' : 'th'} week of Advent`, rank: 'Weekday' };
    }

    if (between(today, new Date(year, 0, 1), addDays(baptismOfLord, 1)) || between(today, christmas, new Date(year + 1, 0, 13))) {
      return { label: 'Christmastide', rank: 'Seasonal day' };
    }

    return { label: `${weekdayName(today)} in Ordinary Time`, rank: 'Weekday' };
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
    const now = new Date();
    const locale = currentLocale();
    const hourInfo = canonicalHourInfo(now);
    const massUrl = universalisPath(locale, 'mass', now);
    const hourUrl = universalisPath(locale, hourInfo.slug, now);
    const todayUrl = universalisPath(locale, 'today', now);
    const appUrl = universalisAppLink();
    const isMobile = window.matchMedia('(max-width: 980px)').matches;

    document.querySelectorAll('[data-current-hour]').forEach((link) => {
      link.href = isMobile ? appUrl : hourUrl;
      link.dataset.desktopHref = hourUrl;
      const span = link.querySelector('span');
      if (isMobile) {
        if (span) span.textContent = 'Universalis app';
        else link.textContent = 'Universalis app';
      } else if (span) {
        span.textContent = hourInfo.label;
      } else {
        link.textContent = `${hourInfo.label} — Universalis`;
      }
    });

    document.querySelectorAll('[data-today-readings]').forEach((link) => {
      link.href = isMobile ? appUrl : massUrl;
      link.dataset.desktopHref = massUrl;
      link.textContent = isMobile ? 'Open Universalis app' : "Today's readings";
    });

    const dayLabel = document.getElementById('today-date-label');
    if (dayLabel) dayLabel.textContent = weekdayName(now);

    const observance = liturgicalDayLabel(now);
    const observanceLabel = document.getElementById('today-observance-label');
    if (observanceLabel) observanceLabel.textContent = observance.label;

    const rankLabel = document.getElementById('today-rank-label');
    if (rankLabel) rankLabel.textContent = observance.rank;

    const todayLink = document.getElementById('today-universalis-link');
    if (todayLink) {
      todayLink.href = todayUrl;
      todayLink.textContent = 'View today on Universalis';
    }
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


  function initMobileNav() {
    const nav = document.querySelector('.nav');
    const headerTools = document.querySelector('.header-tools');
    if (!nav || !headerTools) return;

    let button = document.querySelector('[data-nav-toggle]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-toggle';
      button.setAttribute('data-nav-toggle', '');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Toggle menu');
      button.textContent = 'Menu';
      headerTools.prepend(button);
    }

    const closeNav = () => {
      nav.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-nav-open');
    };

    const syncMode = () => {
      if (window.matchMedia('(max-width: 980px)').matches) {
        closeNav();
      } else {
        nav.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('mobile-nav-open');
      }
    };

    button.addEventListener('click', () => {
      if (!window.matchMedia('(max-width: 980px)').matches) return;
      const open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('mobile-nav-open', open);
    });

    window.addEventListener('scroll', () => {
      if (window.matchMedia('(max-width: 980px)').matches && window.scrollY > 24) closeNav();
    }, { passive: true });
    window.addEventListener('resize', () => { syncMode(); updateCurrentHourLink(); });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));
    document.addEventListener('click', (event) => {
      if (!window.matchMedia('(max-width: 980px)').matches) return;
      if (!nav.contains(event.target) && !button.contains(event.target)) closeNav();
    });
    syncMode();
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
    initMobileNav();
    initSearch();
    initCookieBanner();
    initParishFilter();
    initAdmin();
  }

  document.addEventListener('DOMContentLoaded', init);
  return { init, liturgicalInfo };
})();
