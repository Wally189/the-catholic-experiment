const TCE = (() => {
  const config = Object.assign({
    support_page_url: 'donate.html',
    support_one_off_url: '',
    support_monthly_url: '',
    support_partnerships_url: 'contact.html',
    support_featured_listing_url: 'businesses.html#future-supported-listings',
    liturgical_locale: '',
  }, window.__TCE_CONFIG__ || {});

  let regionalResourcesPromise = null;
  let siteConfigPromise = null;

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

  function normalizeLocale(locale) {
    const value = String(locale || '').trim().toLowerCase();
    if (!value) return '';
    if (['ie', 'ireland', 'roi', 'republic-of-ireland'].includes(value)) return 'ie';
    return 'gb';
  }

  function currentLocale() {
    const configured = normalizeLocale(config.liturgical_locale);
    if (configured) return configured;
    const host = window.location.hostname || '';
    return host.endsWith('.ie') ? 'ie' : 'gb';
  }

  function epiphanyDate(year, locale) {
    if (locale === 'ie') return new Date(year, 0, 6);
    const jan2 = new Date(year, 0, 2);
    return addDays(jan2, (7 - jan2.getDay()) % 7);
  }

  function baptismOfLordDate(year, locale) {
    const epiphany = dateOnly(epiphanyDate(year, locale));
    if (locale === 'ie') {
      return addDays(epiphany, epiphany.getDay() === 0 ? 7 : (7 - epiphany.getDay()) % 7);
    }
    return epiphany.getDate() >= 7 ? addDays(epiphany, 1) : addDays(epiphany, 7);
  }

  function isChristmasSeason(date, locale) {
    const today = dateOnly(date);
    const year = today.getFullYear();
    return (
      between(today, new Date(year, 0, 1), addDays(baptismOfLordDate(year, locale), 1)) ||
      between(today, new Date(year, 11, 25), addDays(baptismOfLordDate(year + 1, locale), 1))
    );
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

    if (isChristmasSeason(today, locale)) {
      return { label: 'Christmastide', rank: 'Seasonal day' };
    }

    return { label: `${weekdayName(today)} in Ordinary Time`, rank: 'Weekday' };
  }

  function feastOverride(date, locale) {
    const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const overrides = {
      common: {
        '01-01': { key: 'white', season: 'Mary, Mother of God', accent: 'White / Gold' },
        '03-19': { key: 'white', season: 'Saint Joseph', accent: 'White / Gold' },
        '03-25': { key: 'white', season: 'The Annunciation', accent: 'White / Gold' },
        '06-29': { key: 'martyr', season: 'Saints Peter and Paul', accent: 'Red' },
        '08-15': { key: 'white', season: 'The Assumption', accent: 'White / Gold' },
        '11-01': { key: 'white', season: 'All Saints', accent: 'White / Gold' },
        '12-08': { key: 'white', season: 'The Immaculate Conception', accent: 'White / Gold' },
        '12-26': { key: 'martyr', season: 'Saint Stephen', accent: 'Red' },
        '12-27': { key: 'white', season: 'Saint John', accent: 'White / Gold' },
        '12-28': { key: 'martyr', season: 'Holy Innocents', accent: 'Red' },
      },
      gb: {
        '03-17': { key: 'white', season: 'Saint Patrick', accent: 'White / Gold' },
        '04-23': { key: 'martyr', season: 'Saint George', accent: 'Red' },
        '11-30': { key: 'martyr', season: 'Saint Andrew', accent: 'Red' },
        '12-29': { key: 'martyr', season: 'Saint Thomas Becket', accent: 'Red' },
      },
      ie: {
        '02-01': { key: 'white', season: 'Saint Brigid', accent: 'White / Gold' },
        '03-17': { key: 'white', season: 'Saint Patrick', accent: 'White / Gold' },
      },
    };
    return overrides[locale]?.[mmdd] || overrides.common[mmdd] || null;
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
    if (sameDate(now, holyThursday)) return { key: 'white', season: 'Holy Thursday', accent: 'White / Gold', locale };
    if (sameDate(now, goodFriday)) return { key: 'holyweek', season: 'Good Friday', accent: 'Red', locale };
    if (sameDate(now, pentecost)) return { key: 'pentecost', season: 'Pentecost', accent: 'Red', locale };
    if (isChristmasSeason(now, locale)) return { key: 'christmas', season: 'Christmastide', accent: 'White / Gold', locale };
    if (between(now, ashWednesday, easter)) return { key: 'lent', season: 'Lent', accent: 'Violet', locale };
    if (between(now, easter, new Date(pentecost.getFullYear(), pentecost.getMonth(), pentecost.getDate() + 1))) return { key: 'easter', season: 'Eastertide', accent: 'White / Gold', locale };
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

  let chromeSyncFrame = 0;

  function syncChromeOffset() {
    const root = document.documentElement;
    const topbar = document.querySelector('.topbar');
    const header = document.querySelector('.site-header');
    const topbarHeight = topbar ? Math.ceil(topbar.getBoundingClientRect().height) : 0;
    const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    if (topbarHeight) root.style.setProperty('--topbar-h', `${topbarHeight}px`);
    if (headerHeight) root.style.setProperty('--header-h', `${headerHeight}px`);
    root.style.setProperty('--chrome-offset', `${topbarHeight + headerHeight}px`);
  }

  function queueChromeSync() {
    if (chromeSyncFrame) return;
    chromeSyncFrame = window.requestAnimationFrame(() => {
      chromeSyncFrame = 0;
      syncChromeOffset();
    });
  }

  function stableHash(input) {
    let hash = 0;
    const value = String(input || '');
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) - hash) + value.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function diversifyHeroImages() {
    const heroImages = [
      'assets/img/20240406_143636.jpg',
      'assets/img/20240406_143646.jpg',
      'assets/img/20240406_143657.jpg',
      'assets/img/20240406_143845.jpg',
      'assets/img/20240406_143858.jpg',
      'assets/img/20240406_143907.jpg',
      'assets/img/20240406_143931.jpg',
      'assets/img/20240406_143941.jpg',
      'assets/img/20240406_143954.jpg',
      'assets/img/20240406_144013.jpg',
      'assets/img/20240406_144030.jpg',
      'assets/img/20240406_144053.jpg',
      'assets/img/20240413_143159.jpg',
      'assets/img/20240413_143207.jpg',
      'assets/img/20240413_143211.jpg',
      'assets/img/20240413_143244.jpg',
      'assets/img/20240413_143309.jpg',
      'assets/img/20240413_143313.jpg',
      'assets/img/20240413_143339.jpg',
      'assets/img/20240413_143443.jpg',
      'assets/img/20240413_143512.jpg',
      'assets/img/20240413_143514.jpg',
      'assets/img/20240413_143525.jpg',
      'assets/img/20240413_143603.jpg',
      'assets/img/20240413_144034.jpg',
      'assets/img/20240413_144041.jpg',
      'assets/img/20240413_144515.jpg',
      'assets/img/20240413_144527.jpg',
      'assets/img/20240413_144545.jpg',
      'assets/img/20240413_144550.jpg',
    ];
    const heroes = Array.from(document.querySelectorAll('.subhero.with-image'));
    heroes.forEach((hero, index) => {
      const inlineStyle = hero.getAttribute('style') || '';
      if (!/20240406_143639\.jpg/i.test(inlineStyle)) return;
      const title = hero.querySelector('h1')?.textContent || '';
      const seed = `${window.location.pathname}|${title}|${index}`;
      const image = heroImages[stableHash(seed) % heroImages.length];
      hero.style.backgroundImage = `url('${image}')`;
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

  function ensureFloatingLinks() {
    let floating = document.querySelector('.floating-links');
    if (!floating) {
      floating = document.createElement('div');
      floating.className = 'floating-links';
      const anchor = document.querySelector('.site-search') || document.querySelector('.cookie-banner');
      if (anchor?.parentNode) {
        anchor.parentNode.insertBefore(floating, anchor);
      } else {
        document.body.append(floating);
      }
    }

    let todayLink = floating.querySelector('[data-today-readings]');
    if (!todayLink) {
      todayLink = document.createElement('a');
      todayLink.setAttribute('data-today-readings', '');
      todayLink.setAttribute('href', 'https://universalis.com/mass.htm');
      todayLink.setAttribute('rel', 'noopener');
      todayLink.setAttribute('target', '_blank');
      todayLink.textContent = "Today's readings";
    }

    let currentHourLink = floating.querySelector('[data-current-hour]');
    if (!currentHourLink) {
      currentHourLink = document.createElement('a');
      currentHourLink.className = 'secondary';
      currentHourLink.setAttribute('data-current-hour', '');
      currentHourLink.setAttribute('href', 'https://universalis.com/lauds.htm');
      currentHourLink.setAttribute('rel', 'noopener');
      currentHourLink.setAttribute('target', '_blank');
      const label = document.createElement('span');
      label.textContent = 'Lauds';
      currentHourLink.append(label, ' - Universalis');
    }

    todayLink.textContent = "Today's readings";
    todayLink.classList.remove('secondary');
    currentHourLink.classList.add('secondary');
    floating.replaceChildren(todayLink, currentHourLink);
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
      link.setAttribute('aria-label', isMobile ? `Open ${hourInfo.label} in the Universalis app` : `Open ${hourInfo.label} on Universalis`);
      const span = link.querySelector('span');
      if (span) {
        span.textContent = hourInfo.label;
      } else {
        link.textContent = `${hourInfo.label} — Universalis`;
      }
    });

    document.querySelectorAll('[data-today-readings]').forEach((link) => {
      link.href = isMobile ? appUrl : massUrl;
      link.dataset.desktopHref = massUrl;
      link.textContent = "Today's readings";
      link.setAttribute('aria-label', isMobile ? "Open today's readings in the Universalis app" : "Open today's readings on Universalis");
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
    const onScroll = () => {
      const mobile = window.matchMedia('(max-width: 980px)').matches;
      const threshold = mobile ? 18 : 48;
      const next = window.scrollY > threshold && !document.body.classList.contains('mobile-nav-open');
      if (document.body.classList.contains('header-condensed') === next) return;
      document.body.classList.toggle('header-condensed', next);
      queueChromeSync();
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  function initLanguageSwitch() {
    const button = document.querySelector('[data-lang-toggle]');
    if (!button) return;
    
const languages = [
  { code: 'en-GB', label: 'English' },
  { code: 'ga', label: 'Gaeilge' },
  { code: 'gv', label: 'Manx (Gaelg)' },
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

  function refinePrimaryNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    const buildNavLink = (item) => {
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      if (item.external) {
        link.target = '_blank';
        link.rel = 'noopener';
      }
      return link;
    };

    let vaticanGroup = null;
    nav.querySelectorAll('.nav-group > .dropdown-toggle').forEach((button) => {
      if (/(Official\s*\/\s*Vatican|Vatican Resources)/i.test(button.textContent || '')) {
        button.textContent = 'Vatican Resources';
        vaticanGroup = button.closest('.nav-group');
      }
    });

    if (vaticanGroup) {
      const menu = vaticanGroup.querySelector('.dropdown-menu');
      if (menu) {
        menu.replaceChildren(
          buildNavLink({ href: 'vatican-resources.html', label: 'Overview' }),
          buildNavLink({ href: 'https://www.vatican.va/', label: 'Holy See', external: true }),
          buildNavLink({ href: 'https://www.vaticannews.va/en.html', label: 'Vatican News', external: true }),
          buildNavLink({ href: 'https://www.vatican.va/content/romancuria/en.html', label: 'Roman Curia', external: true }),
          buildNavLink({ href: 'https://www.vatican.va/archive/ENG0015/_INDEX.HTM', label: 'Catechism', external: true }),
          buildNavLink({ href: 'https://www.vatican.va/archive/cod-iuris-canonici/cic_index_en.html', label: 'Canon Law', external: true }),
        );
      }
    }

    if (nav.querySelector('[data-nav-group="other-resources"]')) return;

    const group = document.createElement('div');
    group.className = 'dropdown nav-group';
    group.setAttribute('data-nav-group', 'other-resources');

    const button = document.createElement('button');
    button.className = 'dropdown-toggle';
    button.type = 'button';
    button.textContent = 'Other resources';

    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';

    [
      { href: 'resources.html', label: 'Overview' },
      { href: 'resources.html#north-america', label: 'North America' },
      { href: 'resources.html#latin-america', label: 'Latin America' },
      { href: 'resources.html#europe', label: 'Europe' },
      { href: 'resources.html#africa-asia-pacific', label: 'Africa & Asia-Pacific' },
    ].forEach((item) => {
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      menu.append(link);
    });

    group.append(button, menu);
    nav.append(group);
  }

  function initNav() {
    document.querySelectorAll('.dropdown-toggle').forEach((button) => {
      button.setAttribute('type', 'button');
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const parent = button.closest('.dropdown');
        if (!parent) return;
        const willOpen = !parent.classList.contains('open');
        document.querySelectorAll('.dropdown.open').forEach((menu) => {
          if (menu !== parent) {
            menu.classList.remove('open');
            menu.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
          }
        });
        parent.classList.toggle('open', willOpen);
        button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
    });
    document.addEventListener('click', (event) => {
      document.querySelectorAll('.dropdown.open').forEach((menu) => {
        if (!menu.contains(event.target)) {
          menu.classList.remove('open');
          menu.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
        }
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      document.querySelectorAll('.dropdown.open').forEach((menu) => {
        menu.classList.remove('open');
        menu.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
      });
    });
  }


  function initMobileNav() {
    const nav = document.querySelector('.nav');
    const headerTools = document.querySelector('.header-tools');
    if (!nav || !headerTools) return;
    const isMobile = () => window.matchMedia('(max-width: 980px)').matches;

    let button = document.querySelector('[data-nav-toggle]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-toggle';
      button.setAttribute('data-nav-toggle', '');
      headerTools.prepend(button);
    }

    if (!nav.id) {
      nav.id = 'site-primary-nav';
    }
    button.setAttribute('aria-controls', nav.id);

    let utilityGroup = nav.querySelector('.mobile-utility-links');
    if (!utilityGroup) {
      const utilityLinks = Array.from(document.querySelectorAll('.topbar-left a[href]'));
      if (utilityLinks.length) {
        utilityGroup = document.createElement('div');
        utilityGroup.className = 'mobile-utility-links';
        utilityLinks.forEach((source) => {
          const link = document.createElement('a');
          link.href = source.href;
          link.textContent = source.matches('.donate-mini') ? 'Support' : (source.textContent?.trim() || 'Open');
          utilityGroup.append(link);
        });
        nav.append(utilityGroup);
      }
    }

    const setNavState = (open) => {
      nav.classList.toggle('open', open);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      button.textContent = open ? 'Close' : 'Menu';
      document.body.classList.toggle('mobile-nav-open', open);
      if (!open) {
        nav.querySelectorAll('.dropdown.open').forEach((menu) => {
          menu.classList.remove('open');
          menu.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
        });
      }
      if (open) {
        document.body.classList.remove('header-condensed');
      } else if (isMobile()) {
        document.body.classList.toggle('header-condensed', window.scrollY > 18);
      }
      queueChromeSync();
    };

    const closeNav = () => {
      setNavState(false);
    };

    const syncMode = () => {
      if (isMobile()) {
        closeNav();
      } else {
        setNavState(false);
      }
      queueChromeSync();
    };

    button.addEventListener('click', () => {
      if (!isMobile()) return;
      const open = !nav.classList.contains('open');
      setNavState(open);
    });

    window.addEventListener('resize', () => { syncMode(); updateCurrentHourLink(); });
    window.visualViewport?.addEventListener('resize', queueChromeSync);
    window.addEventListener('orientationchange', queueChromeSync);
    window.addEventListener('load', queueChromeSync);
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));
    document.addEventListener('click', (event) => {
      if (!isMobile()) return;
      if (!nav.contains(event.target) && !button.contains(event.target)) closeNav();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav();
    });
    syncMode();
  }

  async function fetchJSON(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to fetch ${path}`);
    return response.json();
  }

  function loadSiteConfig() {
    if (!siteConfigPromise) {
      siteConfigPromise = fetchJSON('assets/data/site.json')
        .then((data) => {
          if (data && typeof data === 'object') {
            Object.assign(config, data);
          }
          return config;
        })
        .catch(() => config);
    }
    return siteConfigPromise;
  }

  function fetchRegionalResources() {
    if (!regionalResourcesPromise) {
      regionalResourcesPromise = fetchJSON('assets/data/regional-resources.json')
        .then((data) => Array.isArray(data) ? data : [])
        .catch(() => []);
    }
    return regionalResourcesPromise;
  }

  function normalizeSearchItem(item, fallbackSection = 'Explore') {
    if (!item || typeof item !== 'object') return null;

    const title = String(item.title || item.cardTitle || item.name || '').trim();
    const url = String(item.url || item.href || '').trim();
    const description = String(item.description || item.summary || item.cardSummary || '').trim();
    const keywords = Array.isArray(item.keywords)
      ? item.keywords.join(' ')
      : Array.isArray(item.tags)
        ? item.tags.join(' ')
        : String(item.keywords || '').trim();
    const section = String(item.section || item.region || fallbackSection).trim() || fallbackSection;

    if (!title || !url) return null;
    return { title, url, description, keywords, section };
  }

  function dedupeSearchItems(items) {
    const seen = new Set();
    return items.filter((item) => {
      const key = `${item.url}::${item.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function renderRegionalQuickLink(item) {
    const primary = item.primaryLink || {};
    const secondary = item.secondaryLink || {};

    return `
      <article class="tile">
        <div class="kicker">Region</div>
        <h3><a href="${item.url}">${item.cardTitle || item.title || ''}</a></h3>
        <p>${item.cardSummary || item.description || ''}</p>
        <div class="hero-actions">
          <a class="btn ghost" href="${primary.url || item.url}">${primary.label || 'Open region'}</a>
          ${secondary.url ? `<a class="more" href="${secondary.url}">${secondary.label || 'More links'}</a>` : ''}
        </div>
      </article>`;
  }

  async function initRegionalQuickLinks() {
    const containers = Array.from(document.querySelectorAll('[data-regional-quick-links]'));
    if (!containers.length) return;

    const resources = await fetchRegionalResources();

    containers.forEach((container) => {
      const context = container.getAttribute('data-regional-quick-links') || '';
      const items = resources.filter((item) => !context || !Array.isArray(item.contexts) || item.contexts.includes(context));
      const section = container.closest('[data-regional-quick-links-section]');

      if (!items.length) {
        if (section) section.hidden = true;
        return;
      }

      container.innerHTML = items.map(renderRegionalQuickLink).join('');
      if (section) section.hidden = false;
    });
  }

  async function initSearch() {
    const panel = document.querySelector('.site-search');
    const input = document.querySelector('[data-search-input]');
    const results = document.querySelector('[data-search-results]');
    const openers = document.querySelectorAll('[data-open-search]');
    const closer = document.querySelector('[data-close-search]');
    if (!panel || !input || !results) return;

    let index = [];
    try {
      const [baseIndex, directoryIndex, regionalResources] = await Promise.all([
        fetchJSON('assets/data/search-index.json').catch(() => []),
        fetchJSON('assets/data/directory/derived/search-index.json').catch(() => []),
        fetchRegionalResources(),
      ]);

      index = dedupeSearchItems([
        ...baseIndex.map((item) => normalizeSearchItem(item)).filter(Boolean),
        ...directoryIndex.map((item) => normalizeSearchItem(item, 'Directory')).filter(Boolean),
        ...regionalResources.map((item) => normalizeSearchItem(item, 'Region')).filter(Boolean),
      ]);
    } catch (_) {
      index = [];
    }

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

  function configuredEmail(value) {
    const email = String(value || '').trim();
    if (!email || /@example\.com$/i.test(email)) return '';
    return email;
  }

  function bindEmailChannel(type, email) {
    const hasEmail = Boolean(email);

    document.querySelectorAll(`[data-${type}-email-link]`).forEach((link) => {
      if (!hasEmail) {
        link.hidden = true;
        link.removeAttribute('href');
        return;
      }

      link.hidden = false;
      link.setAttribute('href', `mailto:${email}`);
      if (!link.textContent.trim() || link.hasAttribute(`data-${type}-email-text`)) {
        link.textContent = email;
      }
    });

    document.querySelectorAll(`[data-${type}-email-text]`).forEach((node) => {
      node.textContent = email;
      node.hidden = !hasEmail;
    });

    document.querySelectorAll(`[data-${type}-email-block]`).forEach((node) => {
      node.hidden = !hasEmail;
    });

    document.querySelectorAll(`[data-${type}-email-pending]`).forEach((node) => {
      node.hidden = hasEmail;
    });
  }

  function initContactChannels() {
    const contactEmail = configuredEmail(config.contact_email);
    const newsletterEmail = configuredEmail(config.newsletter_email) || contactEmail;

    bindEmailChannel('contact', contactEmail);
    bindEmailChannel('newsletter', newsletterEmail);
  }

  function initLiveForms() {
    const forms = Array.from(document.querySelectorAll('form[data-live-form]'));
    if (!forms.length) return;

    forms.forEach((form) => {
      const status = form.querySelector('[data-form-status]');
      const submit = form.querySelector('button[type="submit"]');
      const consent = form.querySelector('[data-consent]');
      const kind = form.getAttribute('data-form-kind') || 'contact';
      const recipient = kind === 'newsletter'
        ? configuredEmail(config.newsletter_email) || configuredEmail(config.contact_email)
        : configuredEmail(config.contact_email);

      if (!recipient) {
        if (status) {
          status.textContent = kind === 'newsletter'
            ? 'Newsletter signup is not configured yet. A working list contact will appear here once the site email is set.'
            : 'Form service is not configured yet. A working contact email will appear on this page once the site inbox is set.';
        }
        return;
      }

      const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`;
      form.setAttribute('action', endpoint);
      form.setAttribute('method', 'post');

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (consent && !consent.checked) {
          if (status) {
            status.textContent = 'Please confirm consent before submitting this form.';
          }
          return;
        }

        const formData = new FormData(form);
        if (status) status.textContent = 'Sending...';
        if (submit) submit.disabled = true;

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            headers: { Accept: 'application/json' },
          });

          if (!response.ok) throw new Error('Submission failed');
          if (status) status.textContent = 'Thank you. Your submission has been received.';
          form.reset();
        } catch (_) {
          if (status) {
            status.textContent = 'Submission failed. Please try again, or use the direct email contact on this page.';
          }
        } finally {
          if (submit) submit.disabled = false;
        }
      });
    });
  }

  function initSupportLinks() {
    const supportPageUrl = String(config.support_page_url || 'donate.html').trim() || 'donate.html';
    const oneOffUrl = String(config.support_one_off_url || '').trim();
    const monthlyUrl = String(config.support_monthly_url || '').trim();
    const partnershipsUrl = String(config.support_partnerships_url || 'contact.html').trim() || 'contact.html';
    const featuredListingUrl = String(config.support_featured_listing_url || 'businesses.html#future-supported-listings').trim()
      || 'businesses.html#future-supported-listings';

    document.querySelectorAll('a[href="donate.html"], a[href="support.html"], a[data-support-page]').forEach((link) => {
      link.setAttribute('href', supportPageUrl);

      if (link.classList.contains('donate-mini')) {
        link.textContent = 'Support';
        link.setAttribute('aria-label', 'Support this project');
        return;
      }

      if (link.closest('.site-footer')) {
        link.textContent = 'Support this project';
      }
    });

    document.querySelectorAll('[data-support-link]').forEach((link) => {
      const type = link.getAttribute('data-support-link');
      const url = type === 'one_off'
        ? oneOffUrl
        : type === 'monthly'
          ? monthlyUrl
          : type === 'partnerships'
            ? partnershipsUrl
            : featuredListingUrl;

      if (url) {
        link.hidden = false;
        link.setAttribute('href', url);
        if (/^https?:\/\//i.test(url)) {
          link.setAttribute('rel', 'noopener');
          link.setAttribute('target', '_blank');
        }
        return;
      }

      link.hidden = true;
    });

    const pendingNote = document.querySelector('[data-support-pending]');
    if (pendingNote) {
      pendingNote.hidden = Boolean(oneOffUrl || monthlyUrl);
    }
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
          support_page_url: config.support_page_url || '',
          support_one_off_url: config.support_one_off_url || '',
          support_monthly_url: config.support_monthly_url || '',
          support_partnerships_url: config.support_partnerships_url || '',
          support_featured_listing_url: config.support_featured_listing_url || '',
          liturgical_locale: config.liturgical_locale || '',
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

  async function init() {
    try {
      await loadSiteConfig();
    } catch (_) {}
    applyLiturgicalTheme();
    diversifyHeroImages();
    initSupportLinks();
    refinePrimaryNav();
    ensureFloatingLinks();
    updateCurrentHourLink();
    initStickyHeader();
    initLanguageSwitch();
    initDarkMode();
    initNav();
    initMobileNav();
    queueChromeSync();
    if (document.fonts?.ready) {
      document.fonts.ready.then(queueChromeSync).catch(() => {});
    }
    initSearch();
    initRegionalQuickLinks();
    initContactChannels();
    initCookieBanner();
    initParishFilter();
    initLiveForms();
    initAdmin();
  }

  document.addEventListener('DOMContentLoaded', init);
  return { init, liturgicalInfo };
})();
