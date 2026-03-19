from pathlib import Path
import json, textwrap, zipfile, math, os
base = Path('/mnt/data/catholic-experiment-site')
(base/'assets/css').mkdir(parents=True, exist_ok=True)
(base/'assets/js').mkdir(parents=True, exist_ok=True)
(base/'assets/img').mkdir(parents=True, exist_ok=True)
(base/'assets/data').mkdir(parents=True, exist_ok=True)

site = {
    'title': 'The Catholic Experiment',
    'tagline': 'A life ordered by faith, work, and stewardship.',
    'description': 'A personal and project site exploring Catholic living in the UK and Ireland through faith, work, stewardship, community, preparedness, and renewal.',
    'footer_credit': 'Website built by Waylight Atlantic',
    'footer_url': 'https://www.waylight-atlantic.co.uk/',
    'contact_email': 'hello@example.com',
    'newsletter_email': 'newsletter@example.com',
    'cms_pin': '',
}

pages = [
    ('index.html','Home','home','hero'),
    ('about.html','About','about','subhero'),
    ('journal.html','Journal','journal','subhero'),
    ('resources.html','Resources','resources','subhero'),
    ('contact.html','Contact','contact','subhero'),
    ('newsletter.html','Newsletter','newsletter','subhero'),
    ('faith-formation.html','Faith & Formation','faith','pillar'),
    ('vocation-work.html','Vocation & Work','vocation','pillar'),
    ('household-budgeting.html','Household & Budgeting','household','pillar'),
    ('community-relationships.html','Community & Relationships','community','pillar'),
    ('health-preparedness.html','Health & Preparedness','health','pillar'),
    ('rest-renewal.html','Rest & Renewal','rest','pillar'),
    ('prayer-rhythm.html','Prayer Rhythm','faith','article'),
    ('saints-examples.html','Saints & Examples','faith','article'),
    ('work-as-vocation.html','Work as Vocation','vocation','article'),
    ('craft-excellence.html','Craft & Excellence','vocation','article'),
    ('budgeting-stewardship.html','Budgeting as Stewardship','household','article'),
    ('household-order.html','Household Order','household','article'),
    ('parish-belonging.html','Parish & Belonging','community','article'),
    ('hospitality-charity.html','Hospitality & Charity','community','article'),
    ('stability-preparedness.html','Stability & Preparedness','health','article'),
    ('bodily-care.html','Bodily Care','health','article'),
    ('sabbath-rhythm.html','Sabbath Rhythm','rest','article'),
    ('beauty-leisure.html','Beauty & Leisure','rest','article'),
    ('privacy.html','Privacy Policy','legal','legal'),
    ('cookies.html','Cookie Policy','legal','legal'),
    ('terms.html','Terms of Use','legal','legal'),
    ('data-protection.html','Data Protection','legal','legal'),
    ('accessibility.html','Accessibility Statement','legal','legal'),
    ('admin.html','Site Steward','admin','admin'),
]

pillar_info = {
    'faith': {'title':'Faith & Formation','summary':'Prayer, study, discipline, and the slow forming of the soul.','image':'assets/img/20240406_143639.jpg'},
    'vocation': {'title':'Vocation & Work','summary':'Purposeful labour, craftsmanship, honest work, and the sanctification of ordinary effort.','image':'assets/img/20240406_143639.jpg'},
    'household': {'title':'Household & Budgeting','summary':'Stewardship, budgeting, provisioning, and the ordinary duties of home.','image':'assets/img/20240406_143639.jpg'},
    'community': {'title':'Community & Relationships','summary':'Parish life, hospitality, friendship, and the shared life of charity.','image':'assets/img/20240406_143639.jpg'},
    'health': {'title':'Health & Preparedness','summary':'Care of body and mind, resilience, prudence, and planning for the road ahead.','image':'assets/img/20240406_143639.jpg'},
    'rest': {'title':'Rest & Renewal','summary':'Sabbath, silence, leisure, beauty, and the restoring of proper rhythm.','image':'assets/img/20240406_143639.jpg'},
}

journal_posts = [
  {
    'id':'rule-of-life', 'title':'Why I Started a Rule of Life', 'excerpt':'A rule of life is less a prison than a trellis: it gives shape so that grace may grow in ordinary time.',
    'date':'2026-03-01', 'category':'Faith & Formation', 'approvedComments':[
      {'author':'M.','date':'2026-03-03','text':'This feels grounded and honest. The gardening image of a trellis is especially strong.'}
    ],
    'content': '<p class="dropcap">There comes a point when a person realises that drift has a cost. Not merely lost time, but a thinning out of purpose. A rule of life, approached humbly, can become a pattern that steadies the soul and makes room for prayer, work, and charity without theatricality.</p><p>This project is not a grand manifesto. It is an attempt to put habits, duties, and hopes into a shape that can be lived in the ordinary weather of the year.</p><blockquote>Order does not guarantee holiness. It does, however, remove some of the needless obstacles to it.</blockquote><p>Much of modern life encourages permanent improvisation. The older Christian instinct is gentler and wiser: establish rhythm, return to it, repent when you fail, and begin again.</p>'
  },
  {
    'id':'household-stewardship', 'title':'Budgeting as an Act of Stewardship', 'excerpt':'Budgets are not only spreadsheets. Properly understood, they are moral documents that reveal what we fear, what we value, and what we are preparing for.',
    'date':'2026-02-16', 'category':'Household & Budgeting', 'approvedComments':[],
    'content':'<p class="dropcap">To budget well is not to worship money. It is to tell the truth about limits. Stewardship begins where fantasy ends and responsibility takes its place.</p><p>A Catholic approach to household budgeting need not sound pious in every line. It is enough that it be prudent, honest, and generous where it can be.</p><p>The practical work matters: naming expenses, reducing waste, planning for feast and famine, and making decisions before panic makes them for you.</p>'
  },
  {
    'id':'parish-belonging', 'title':'Parish Belonging in an Age of Drift', 'excerpt':'It is easier to consume religious content than to belong to a parish. But Christianity was never intended to be lived as a private feed.',
    'date':'2026-01-10', 'category':'Community & Relationships', 'approvedComments':[],
    'content':'<p class="dropcap">Belonging is demanding. It asks for attendance, patience, and the willingness to encounter ordinary people in ordinary places. The parish remains one of the few institutions where the successful and the struggling may yet kneel side by side.</p><p>That is one reason why parish life matters: it trains the soul away from choice-as-identity and towards fidelity-as-love.</p>'
  }
]

search_index = []

# SVG placeholder generator

def svg_placeholder(title, subtitle, palette):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="t d">
<title id="t">{title}</title><desc id="d">{subtitle}</desc>
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="{palette[0]}"/>
    <stop offset="100%" stop-color="{palette[1]}"/>
  </linearGradient>
</defs>
<rect width="1600" height="900" fill="url(#g)"/>
<g opacity="0.17" fill="{palette[2]}">
  <circle cx="1300" cy="130" r="240"/>
  <circle cx="280" cy="780" r="250"/>
  <path d="M0 700 C 200 650, 350 570, 500 500 S 900 360, 1200 480 S 1450 620, 1600 580 V900 H0Z"/>
</g>
<g fill="none" stroke="{palette[3]}" stroke-width="5" opacity="0.42">
  <path d="M160 720 L320 350 L460 620 L650 230 L840 650 L1030 280 L1210 590 L1400 180"/>
  <path d="M420 680 C460 520, 470 430, 620 430 C780 430, 780 650, 930 650 C1070 650, 1080 470, 1240 470"/>
</g>
<g fill="{palette[4]}" opacity="0.95">
  <rect x="120" y="620" width="760" height="150" rx="20"/>
</g>
<text x="160" y="688" font-size="62" font-family="Georgia, 'Times New Roman', serif" fill="{palette[5]}">{title}</text>
<text x="160" y="735" font-size="28" font-family="system-ui, sans-serif" fill="{palette[6]}">{subtitle}</text>
</svg>'''

placeholders = {
    'letterkenny-faith.svg': ('St Eunan\'s, Letterkenny', 'faith and formation', ['#32263f','#6a577e','#f0dfbc','#f3e6cd','#11111144','#f5efe4','#f6f1e9']),
    'winchester-work.svg': ('Winchester & Work', 'vocation and labour', ['#24303e','#536778','#d4b27e','#e9d7b3','#11111144','#f6f1e8','#f6f1e8']),
    'wells-household.svg': ('Wells & Household', 'stewardship and domestic order', ['#2f4e43','#7b8c73','#ede3c0','#f1eadb','#11111144','#f7f2ea','#f6f2eb']),
    'glastonbury-community.svg': ('Glastonbury & Community', 'belonging and place', ['#3a4152','#8b6d6d','#e8d9c1','#e8d9c1','#11111144','#f6efe4','#f8f4eb']),
    'ireland-health.svg': ('Atlantic Light & Preparedness', 'health and resilience', ['#21455b','#66879b','#cee1dc','#dce9e5','#11111144','#f7f5ef','#f7f5ef']),
    'tide-rest.svg': ('Evening Tide & Renewal', 'rest and renewal', ['#23314a','#816c8f','#eddab6','#efe6d4','#11111144','#f7f3e9','#f8f5ee']),
    'home-hero.svg': ('The Catholic Experiment', 'A life ordered by faith, work, and stewardship', ['#2d3447','#5d706d','#d7c7a7','#efe6d8','#11111144','#f6f1e9','#f7f4ed']),
}

for filename, args in placeholders.items():
    (base/'assets/img'/filename).write_text(svg_placeholder(*args), encoding='utf-8')

# style
css = r'''
:root {
  --bg: #f6f1e9;
  --bg-soft: #efe7dc;
  --paper: rgba(255,255,255,.58);
  --text: #1f1c18;
  --muted: #5d554e;
  --line: rgba(31, 28, 24, .12);
  --shadow: 0 18px 45px rgba(0,0,0,.08);
  --radius: 24px;
  --max: 1240px;
  --season: #5b7a47;
  --season-soft: rgba(91,122,71,.14);
  --season-contrast: #fbfaf7;
  --season-name: "Ordinary Time";
}
[data-season="lent"], [data-season="advent"] { --season:#5f4a76; --season-soft:rgba(95,74,118,.14); --season-contrast:#f8f3fb;}
[data-season="christmas"], [data-season="easter"] { --season:#b08b3d; --season-soft:rgba(176,139,61,.14); --season-contrast:#fffdf7;}
[data-season="martyr"], [data-season="pentecost"], [data-season="holyweek"] { --season:#8f2231; --season-soft:rgba(143,34,49,.14); --season-contrast:#fff7f7;}
[data-season="rose"] { --season:#b0727f; --season-soft:rgba(176,114,127,.14); --season-contrast:#fff8fa;}
[data-theme="dark"] {
  --bg:#131416; --bg-soft:#1d1f22; --paper:rgba(255,255,255,.03); --text:#f1eee8; --muted:#b9aea3; --line:rgba(255,255,255,.12); --shadow:none;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:Georgia, 'Times New Roman', serif;background:radial-gradient(circle at top left, var(--season-soft), transparent 32%), var(--bg);color:var(--text);line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
button,input,textarea,select{font:inherit}
.skip-link{position:absolute;left:-999px;top:auto}.skip-link:focus{left:1rem;top:1rem;z-index:1000;background:var(--text);color:var(--bg);padding:.75rem 1rem;border-radius:12px}
.topbar{font-family:Inter,system-ui,sans-serif;font-size:.9rem;border-bottom:1px solid var(--line);background:color-mix(in srgb, var(--season) 9%, transparent)}
.topbar .wrap,.site-header .wrap,.page-shell,.footer-inner,.hero-inner,.subhero-inner,.page-grid,.journal-grid,.resource-grid,.admin-shell,.search-shell{width:min(var(--max), calc(100% - 2rem));margin:0 auto}
.topbar .wrap{display:flex;gap:1rem;justify-content:space-between;padding:.55rem 0;flex-wrap:wrap}
.season-pill{display:inline-flex;gap:.55rem;align-items:center;padding:.4rem .8rem;border-radius:999px;background:var(--season-soft);border:1px solid color-mix(in srgb,var(--season) 30%, transparent);font-family:Inter,system-ui,sans-serif;font-size:.85rem}
.site-header{position:sticky;top:0;z-index:40;backdrop-filter:blur(16px);background:color-mix(in srgb, var(--bg) 85%, transparent);border-bottom:1px solid var(--line)}
.site-header .wrap{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 0}
.brand{display:flex;flex-direction:column;gap:.15rem}
.brand strong{font-size:1.2rem;letter-spacing:.02em}
.brand span{font-family:Inter,system-ui,sans-serif;color:var(--muted);font-size:.9rem}
.nav-toggle{display:none}
.nav{display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.nav > a,.dropdown-toggle{font-family:Inter,system-ui,sans-serif;font-size:.96rem;padding:.45rem .1rem;border-bottom:2px solid transparent}
.nav > a.active,.nav > a:hover,.dropdown:hover>.dropdown-toggle,.dropdown-toggle:hover{border-color:var(--season)}
.dropdown{position:relative}
.dropdown-menu{position:absolute;left:0;top:calc(100% + .75rem);min-width:280px;padding:.7rem;background:var(--bg);border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow);display:none}
.dropdown:hover .dropdown-menu,.dropdown:focus-within .dropdown-menu{display:grid;gap:.2rem}
.dropdown-menu a{padding:.65rem .8rem;border-radius:14px;font-family:Inter,system-ui,sans-serif;font-size:.95rem}.dropdown-menu a:hover{background:var(--season-soft)}
.header-tools{display:flex;align-items:center;gap:.75rem}
.icon-btn{width:42px;height:42px;border-radius:999px;border:1px solid var(--line);background:var(--paper);display:grid;place-items:center;cursor:pointer}
.page-shell{padding:1.2rem 0 4rem}
.breadcrumbs{font-family:Inter,system-ui,sans-serif;font-size:.9rem;color:var(--muted);margin:0 0 1rem}.breadcrumbs a{color:var(--muted)}
.hero{min-height:78svh;display:grid;align-items:end;background:linear-gradient(180deg, rgba(10,10,10,.14), rgba(10,10,10,.52)), url('../img/home-hero.svg') center/cover;border-bottom:1px solid var(--line)}
.hero-inner{padding:8rem 0 5rem;color:#fff}.eyebrow,.hero-sub{font-family:Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}.eyebrow{font-size:.82rem;opacity:.8}
.hero h1,.subhero h1{font-size:clamp(2.7rem, 6vw, 5.6rem);line-height:1.02;margin:.6rem 0 1rem;font-weight:600}.hero p{max-width:54rem;font-size:1.2rem}.hero-actions{display:flex;gap:1rem;flex-wrap:wrap;margin-top:1.75rem}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;padding:.95rem 1.3rem;border-radius:999px;border:1px solid color-mix(in srgb, var(--season) 38%, var(--line));font-family:Inter,system-ui,sans-serif;background:var(--season);color:var(--season-contrast);cursor:pointer}
.btn.ghost{background:transparent;color:inherit}
.subhero{padding:4.25rem 0 2.2rem;background:linear-gradient(180deg, color-mix(in srgb, var(--season) 14%, transparent), transparent)}
.subhero-inner h1{margin-bottom:.6rem}.subhero p{max-width:48rem;color:var(--muted);font-size:1.08rem}
section{padding:2.5rem 0}
.intro{display:grid;grid-template-columns:1.15fr .85fr;gap:2rem;align-items:start}
.card,.glass{background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}
.card{padding:1.5rem}.glass{overflow:hidden}
.pillar-strip{display:grid;gap:1.25rem}
.pillar-band{display:grid;grid-template-columns:1.15fr .85fr;min-height:420px;overflow:hidden;border-radius:30px;background:var(--bg-soft);border:1px solid var(--line)}
.pillar-band:nth-child(even){grid-template-columns:.85fr 1.15fr}.pillar-band figure{margin:0;height:100%}.pillar-band img{width:100%;height:100%;object-fit:cover;transform:scale(1.02);transition:transform .7s ease}.pillar-band:hover img{transform:scale(1.06)}
.pillar-copy{padding:2.1rem;display:flex;flex-direction:column;justify-content:end;background:linear-gradient(180deg, transparent, color-mix(in srgb,var(--season) 7%, transparent));}
.kicker{font-family:Inter,system-ui,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);font-size:.78rem}
.pillar-copy h2,.article h2,.article h3,.resource-grid h2,.journal-grid h2{font-size:clamp(1.6rem, 3vw, 2.5rem);line-height:1.1;margin:.35rem 0 .85rem}
.pillar-copy p,.muted{color:var(--muted)}
.grid-2{display:grid;grid-template-columns:repeat(2, minmax(0,1fr));gap:1.2rem}.grid-3{display:grid;grid-template-columns:repeat(3, minmax(0,1fr));gap:1.2rem}
.tile{padding:1.35rem;border-radius:22px;background:var(--paper);border:1px solid var(--line)}
.tile h3{margin:.25rem 0 .5rem;font-size:1.25rem}.tile p{color:var(--muted);margin:0 0 .8rem}
.tile .more{font-family:Inter,system-ui,sans-serif;color:var(--season)}
.page-grid{display:grid;grid-template-columns:minmax(0,3fr) minmax(280px,1fr);gap:2rem;align-items:start}
.article{padding:2rem}.article p{font-size:1.06rem}.article .dropcap:first-letter{float:left;font-size:4.25rem;line-height:.9;padding-right:.5rem;padding-top:.2rem;color:var(--season)}
.article blockquote{border-left:4px solid var(--season);padding: .2rem 0 .2rem 1rem; margin:1.6rem 0; font-size:1.2rem; color:var(--muted)}
.article ul{padding-left:1.15rem}
.aside{position:sticky;top:5.8rem;padding:1.3rem}
.aside h3{margin-top:.1rem}.aside ul{padding-left:1rem;margin-bottom:0}
.callout{padding:1.2rem 1.2rem 1.1rem;border-left:4px solid var(--season);background:var(--season-soft);border-radius:18px}
.journal-grid,.resource-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.2rem}
.post-card{padding:1.4rem;border-radius:22px;background:var(--paper);border:1px solid var(--line)}
.post-meta{font-family:Inter,system-ui,sans-serif;color:var(--muted);font-size:.9rem}
.featured-post{display:grid;grid-template-columns:1.1fr .9fr;gap:1.2rem;align-items:stretch}
.featured-post .article{height:100%}
.featured-post figure{margin:0}
.form-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
label{display:block;font-family:Inter,system-ui,sans-serif;font-size:.95rem;margin-bottom:.35rem}
input,textarea,select{width:100%;padding:.95rem 1rem;border-radius:16px;border:1px solid var(--line);background:color-mix(in srgb,var(--bg) 78%, transparent);color:var(--text)}
textarea{min-height:170px;resize:vertical}
.form-note,.micro{font-family:Inter,system-ui,sans-serif;font-size:.87rem;color:var(--muted)}
.site-footer{border-top:1px solid var(--line);padding:2.4rem 0 3rem;margin-top:3rem;background:linear-gradient(180deg, transparent, color-mix(in srgb, var(--season) 8%, transparent))}
.footer-inner{display:grid;grid-template-columns:1.2fr .9fr .9fr .9fr;gap:1.5rem}.footer-inner h3{margin-top:0}.footer-inner ul{list-style:none;padding:0;margin:0;display:grid;gap:.45rem}
.footer-credit{font-family:Inter,system-ui,sans-serif;color:var(--muted)}
.site-search{position:fixed;inset:0;display:none;background:rgba(12,12,12,.45);backdrop-filter:blur(4px);z-index:50}.site-search.open{display:grid;place-items:start center;padding-top:9vh}
.search-shell{max-width:960px}.search-panel{padding:1.2rem 1.2rem 1rem;background:var(--bg);border:1px solid var(--line);border-radius:28px;box-shadow:var(--shadow)}
.search-results{display:grid;gap:.8rem;max-height:58vh;overflow:auto;margin-top:1rem}.search-result{padding:1rem;border-radius:18px;border:1px solid var(--line);background:var(--paper)}
.cookie-banner{position:fixed;left:1rem;right:1rem;bottom:1rem;display:none;z-index:60}.cookie-banner.show{display:block}.cookie-card{padding:1rem 1rem 1.1rem;display:grid;gap:.8rem;grid-template-columns:1.7fr auto;align-items:center}.cookie-actions{display:flex;gap:.7rem;flex-wrap:wrap;justify-content:end}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.notice{padding:1rem 1.1rem;border-radius:18px;background:var(--season-soft);border:1px solid color-mix(in srgb,var(--season) 20%, transparent)}
.journal-entry + .journal-entry{margin-top:2.5rem;padding-top:2.2rem;border-top:1px solid var(--line)}
.comment{padding:1rem 1rem .95rem;border-radius:18px;border:1px solid var(--line);background:var(--paper)}
.hidden{display:none !important}
.admin-shell{padding:2rem 0 4rem}.admin-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:1.5rem}.admin-block{padding:1.2rem}.pill{display:inline-flex;padding:.28rem .7rem;border-radius:999px;background:var(--season-soft);font-family:Inter,system-ui,sans-serif;font-size:.85rem}
@media (prefers-reduced-motion: reduce){*{scroll-behavior:auto;animation:none!important;transition:none!important}}
@media (max-width: 980px){.intro,.pillar-band,.featured-post,.page-grid,.footer-inner,.admin-grid,.journal-grid,.resource-grid,.grid-3{grid-template-columns:1fr}.grid-2,.form-row{grid-template-columns:1fr}.aside{position:static}.nav-toggle{display:inline-flex}.nav{display:none;position:absolute;left:1rem;right:1rem;top:calc(100% + .75rem);background:var(--bg);padding:1rem;border:1px solid var(--line);border-radius:24px;box-shadow:var(--shadow)}.nav.open{display:grid}.dropdown-menu{position:static;display:grid;box-shadow:none;border:none;padding:.4rem 0 0}.dropdown{display:grid;gap:.4rem}.site-header .wrap{align-items:start}}
'''
(base/'assets/css/styles.css').write_text(css, encoding='utf-8')

# JS
js = r'''
const TCE = (() => {
  const config = window.__TCE_CONFIG__ || {};

  function addYears(date, years) {
    const d = new Date(date); d.setFullYear(d.getFullYear() + years); return d;
  }
  function fmtDate(date) {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }
  function sameDate(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
  function between(date, start, end) { return date >= start && date < end; }
  function easterSunday(year) {
    const a = year % 19; const b = Math.floor(year / 100); const c = year % 100; const d = Math.floor(b / 4);
    const e = b % 4; const f = Math.floor((b + 8) / 25); const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30; const i = Math.floor(c / 4); const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7; const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31); const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }
  function firstSundayOfAdvent(year) {
    const christmas = new Date(year, 11, 25);
    const fourthSunday = new Date(christmas);
    fourthSunday.setDate(christmas.getDate() - ((christmas.getDay() + 7) % 7));
    const advent1 = new Date(fourthSunday); advent1.setDate(fourthSunday.getDate() - 21);
    return advent1;
  }
  function currentLocale() {
    const h = location.hostname || '';
    if (h.endsWith('.ie')) return 'ie';
    return 'gb';
  }
  function feastOverride(date, locale) {
    const mmdd = `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const overrides = {
      gb: {
        '04-23': { key:'martyr', label:'Saint George', liturgical:'Feast — Saint George', accent:'Red' },
        '12-29': { key:'martyr', label:'Saint Thomas Becket', liturgical:'Feast — Saint Thomas Becket', accent:'Red' },
      },
      ie: {
        '02-01': { key:'white', label:'Saint Brigid', liturgical:'Feast — Saint Brigid', accent:'White / Gold' },
        '03-17': { key:'white', label:'Saint Patrick', liturgical:'Solemnity — Saint Patrick', accent:'White / Gold' },
      }
    };
    return overrides[locale]?.[mmdd] || null;
  }
  function liturgicalInfo(now = new Date()) {
    const locale = currentLocale();
    const year = now.getFullYear();
    const easter = easterSunday(year);
    const ashWednesday = new Date(easter); ashWednesday.setDate(easter.getDate() - 46);
    const palmSunday = new Date(easter); palmSunday.setDate(easter.getDate() - 7);
    const holyThursday = new Date(easter); holyThursday.setDate(easter.getDate() - 3);
    const pentecost = new Date(easter); pentecost.setDate(easter.getDate() + 49);
    const baptismOfLord = (() => {
      const jan6 = new Date(year,0,6);
      const nextSunday = new Date(jan6); nextSunday.setDate(jan6.getDate() + ((7 - jan6.getDay()) % 7 || 7));
      return nextSunday;
    })();
    const advent = firstSundayOfAdvent(year);
    const christmas = new Date(year,11,25);
    const nextEaster = easterSunday(year+1);
    const nextAsh = new Date(nextEaster); nextAsh.setDate(nextEaster.getDate() - 46);
    const nextAdvent = firstSundayOfAdvent(year+1);

    const override = feastOverride(now, locale);
    const isGaudete = sameDate(now, new Date(advent.getFullYear(), advent.getMonth(), advent.getDate()+14));
    const isLaetare = sameDate(now, new Date(ashWednesday.getFullYear(), ashWednesday.getMonth(), ashWednesday.getDate()+25));
    if (isGaudete || isLaetare) return { key: 'rose', season: isGaudete ? 'Gaudete Sunday' : 'Laetare Sunday', accent: 'Rose', locale };
    if (override) return { ...override, season: override.liturgical, locale };
    if (sameDate(now, palmSunday) || sameDate(now, holyThursday) || sameDate(now, new Date(easter.getFullYear(), easter.getMonth(), easter.getDate()-2)) ) return { key: 'holyweek', season: 'Holy Week', accent: 'Red', locale };
    if (sameDate(now, pentecost)) return { key: 'pentecost', season: 'Pentecost', accent: 'Red', locale };

    if (between(now, christmas, addYears(advent,0))) return { key: 'christmas', season: 'Christmas', accent: 'White / Gold', locale };
    if (now < baptismOfLord && now >= new Date(year,0,1)) return { key: 'christmas', season: 'Christmas', accent: 'White / Gold', locale };
    if (between(now, ashWednesday, easter)) return { key: 'lent', season: 'Lent', accent: 'Violet', locale };
    if (between(now, easter, new Date(pentecost.getFullYear(), pentecost.getMonth(), pentecost.getDate()+1))) return { key: 'easter', season: 'Eastertide', accent: 'White / Gold', locale };
    if (between(now, advent, christmas)) return { key: 'advent', season: 'Advent', accent: 'Violet', locale };

    // Ordinary Time before Lent and after Pentecost until Advent.
    const ordinary1Start = new Date(baptismOfLord); ordinary1Start.setDate(baptismOfLord.getDate() + 1);
    const ordinary2Start = new Date(pentecost); ordinary2Start.setDate(pentecost.getDate() + 1);
    if (between(now, ordinary1Start, ashWednesday) || between(now, ordinary2Start, advent) || between(now, christmas, nextAsh) || between(now, new Date(year,0,1), ashWednesday)) {
      return { key: 'ordinary', season: 'Ordinary Time', accent: 'Green', locale };
    }
    return { key: 'ordinary', season: 'Ordinary Time', accent: 'Green', locale };
  }

  function applyLiturgicalTheme() {
    const info = liturgicalInfo(new Date());
    document.documentElement.dataset.season = info.key;
    document.documentElement.style.setProperty('--season-name', `"${info.season}"`);
    document.querySelectorAll('[data-season-name]').forEach(el => el.textContent = info.season);
    document.querySelectorAll('[data-season-accent]').forEach(el => el.textContent = info.accent);
    document.querySelectorAll('[data-locale-name]').forEach(el => el.textContent = info.locale === 'ie' ? 'Ireland' : 'England & Wales');
    return info;
  }

  function initDarkMode() {
    const key = 'tce-theme';
    const saved = localStorage.getItem(key);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem(key, next);
      });
    });
  }

  async function fetchJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch ${path}`);
    return res.json();
  }

  function initNav() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('.nav');
    if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  async function initSearch() {
    const panel = document.querySelector('.site-search');
    const input = document.querySelector('[data-search-input]');
    const results = document.querySelector('[data-search-results]');
    const openers = document.querySelectorAll('[data-open-search]');
    const closer = document.querySelector('[data-close-search]');
    if (!panel || !input || !results) return;
    let index = [];
    try { index = await fetchJSON('assets/data/search-index.json'); } catch (e) { index = []; }
    const render = (items) => {
      results.innerHTML = items.length ? items.map(item => `
        <a class="search-result" href="${item.url}">
          <div class="post-meta">${item.section}</div>
          <strong>${item.title}</strong>
          <p class="muted">${item.description}</p>
        </a>`).join('') : '<div class="search-result">No matching pages yet.</div>';
    };
    render(index.slice(0,6));
    openers.forEach(btn => btn.addEventListener('click', () => { panel.classList.add('open'); input.focus(); }));
    closer?.addEventListener('click', () => panel.classList.remove('open'));
    panel.addEventListener('click', (e) => { if (e.target === panel) panel.classList.remove('open'); });
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) return render(index.slice(0,6));
      const filtered = index.filter(item => `${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(q));
      render(filtered.slice(0,12));
    });
  }

  function initCookieBanner() {
    const key = 'tce-cookie-choice';
    const banner = document.querySelector('.cookie-banner');
    if (!banner) return;
    if (!localStorage.getItem(key)) banner.classList.add('show');
    banner.querySelectorAll('[data-cookie-choice]').forEach(btn => btn.addEventListener('click', () => {
      localStorage.setItem(key, btn.dataset.cookieChoice);
      banner.classList.remove('show');
    }));
  }

  async function initJournal() {
    const holder = document.querySelector('[data-journal-list]');
    if (!holder) return;
    const commentsHolder = document.querySelector('[data-comments-target]');
    const form = document.querySelector('[data-comment-form]');
    const targetPost = holder.dataset.post || '';
    const data = await fetchJSON('assets/data/journal.json');
    const pending = JSON.parse(localStorage.getItem('tce-pending-comments') || '[]');
    const postMatch = data.posts.find(p => p.id === targetPost);
    const renderComments = (post) => {
      if (!commentsHolder) return;
      const approved = [...(post.approvedComments || [])];
      commentsHolder.innerHTML = approved.length ? approved.map(c => `<div class="comment"><strong>${c.author}</strong><div class="post-meta">${c.date}</div><p>${c.text}</p></div>`).join('') : '<p class="muted">No approved comments yet.</p>';
    };
    if (targetPost && postMatch) {
      holder.innerHTML = `<article class="journal-entry article card"><div class="post-meta">${postMatch.category} · ${postMatch.date}</div><h2>${postMatch.title}</h2>${postMatch.content}</article>`;
      renderComments(postMatch);
      if (form) form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        pending.push({
          postId: targetPost,
          author: fd.get('author'),
          email: fd.get('email'),
          text: fd.get('text'),
          date: new Date().toISOString().slice(0,10),
          approved: false,
        });
        localStorage.setItem('tce-pending-comments', JSON.stringify(pending));
        form.reset();
        alert('Thank you. Your comment is awaiting approval.');
      });
      return;
    }
    holder.innerHTML = data.posts.map(post => `
      <article class="post-card">
        <div class="post-meta">${post.category} · ${post.date}</div>
        <h2>${post.title}</h2>
        <p>${post.excerpt}</p>
        <a class="more" href="journal.html?post=${post.id}">Read the journal entry →</a>
      </article>`).join('');
  }

  async function initAdmin() {
    const shell = document.querySelector('[data-admin]');
    if (!shell) return;
    const pinForm = document.querySelector('[data-pin-form]');
    const login = document.querySelector('[data-admin-login]');
    const panel = document.querySelector('[data-admin-panel]');
    const pinHint = document.querySelector('[data-pin-hint]');
    const expected = config.cms_pin || '';
    if (!expected) {
      pinHint.textContent = 'Browser admin disabled in the public build.';
      if (pinForm) {
        pinForm.querySelectorAll('input,button').forEach((control) => control.disabled = true);
      }
      return;
    }
    pinHint.textContent = `Configured PIN: ${expected}`;
    pinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = new FormData(pinForm).get('pin');
      if (pin !== expected) return alert('Incorrect PIN.');
      login.classList.add('hidden');
      panel.classList.remove('hidden');
      const siteData = await fetchJSON('assets/data/site.json');
      const journalData = await fetchJSON('assets/data/journal.json');
      document.querySelector('[name="siteTitle"]').value = siteData.title;
      document.querySelector('[name="tagline"]').value = siteData.tagline;
      document.querySelector('[name="contactEmail"]').value = siteData.contact_email;
      document.querySelector('[name="footerCredit"]').value = siteData.footer_credit;
      document.querySelector('[name="footerUrl"]').value = siteData.footer_url;
      const pending = JSON.parse(localStorage.getItem('tce-pending-comments') || '[]');
      const commentsBox = document.querySelector('[data-pending-comments]');
      const renderPending = () => {
        commentsBox.innerHTML = pending.length ? pending.map((c, i) => `
          <div class="comment">
            <strong>${c.author}</strong> <span class="post-meta">for ${c.postId} · ${c.date}</span>
            <p>${c.text}</p>
            <div class="hero-actions">
              <button class="btn" data-approve="${i}">Approve (stores locally)</button>
              <button class="btn ghost" data-delete="${i}">Delete</button>
            </div>
          </div>`).join('') : '<p class="muted">No pending comments in this browser yet.</p>';
      };
      renderPending();
      commentsBox.addEventListener('click', (e) => {
        const approve = e.target.closest('[data-approve]');
        const del = e.target.closest('[data-delete]');
        if (approve) {
          const idx = Number(approve.dataset.approve);
          pending[idx].approved = true;
          localStorage.setItem('tce-approved-comment-draft', JSON.stringify(pending[idx]));
          pending.splice(idx, 1);
          localStorage.setItem('tce-pending-comments', JSON.stringify(pending));
          renderPending();
          alert('Approved locally. To make it permanent, add it to assets/data/journal.json before publishing.');
        }
        if (del) {
          const idx = Number(del.dataset.delete);
          pending.splice(idx, 1);
          localStorage.setItem('tce-pending-comments', JSON.stringify(pending));
          renderPending();
        }
      });
      document.querySelector('[data-export-site]').addEventListener('click', () => {
        const payload = {
          title: document.querySelector('[name="siteTitle"]').value,
          tagline: document.querySelector('[name="tagline"]').value,
          contact_email: document.querySelector('[name="contactEmail"]').value,
          footer_credit: document.querySelector('[name="footerCredit"]').value,
          footer_url: document.querySelector('[name="footerUrl"]').value,
          posts: journalData.posts,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tce-export.json'; a.click();
      });
    });
  }

  function hydrateDynamicJournalLink() {
    const params = new URLSearchParams(location.search);
    const post = params.get('post');
    const holder = document.querySelector('[data-journal-list]');
    if (post && holder) holder.dataset.post = post;
  }

  return {
    init() {
      applyLiturgicalTheme();
      initDarkMode();
      initNav();
      initSearch();
      initCookieBanner();
      hydrateDynamicJournalLink();
      initJournal();
      initAdmin();
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => TCE.init());
'''
(base/'assets/js/app.js').write_text(js, encoding='utf-8')

(base/'assets/data/site.json').write_text(json.dumps(site, indent=2), encoding='utf-8')
(base/'assets/data/journal.json').write_text(json.dumps({'posts': journal_posts}, indent=2), encoding='utf-8')

# content helpers
lead_texts = {
'faith-formation.html': ('Faith & Formation','Prayer, study, discipline, and the quiet forming of the soul.','A Catholic life begins not in self-invention but in reception: grace received, prayer attempted, doctrine learned, and habits patiently re-ordered.'),
'vocation-work.html': ('Vocation & Work','Purposeful labour, craftsmanship, and the sanctification of effort.','Work is not merely a means of survival. Properly held, it is part of human dignity: a place where discipline, excellence, service, and sacrifice may be offered.'),
'household-budgeting.html': ('Household & Budgeting','Domestic order, prudent budgeting, and the faithful use of resources.','Homes can become places of peace or places of anxiety. Stewardship seeks to recover order, foresight, and material honesty without losing beauty or hospitality.'),
'community-relationships.html': ('Community & Relationships','Belonging, service, and the duties we owe to one another.','No Christian life is self-contained. A parish, a table, a street, and a neighbour all reveal how much of holiness is worked out in relation to others.'),
'health-preparedness.html': ('Health & Preparedness','Resilience, embodied life, and responsible planning.','Preparedness is not fear disguised as discipline. At its best, it is prudence: caring for body and mind, making sensible plans, and reducing avoidable fragility.'),
'rest-renewal.html': ('Rest & Renewal','Sabbath, leisure, silence, and the recovery of right proportion.','Rest is not laziness. It is a refusal to live as though utility were the highest good. Renewal restores gratitude, perspective, and delight.'),
}

articles = {
'prayer-rhythm.html': ('Prayer Rhythm','A daily rhythm of prayer need not be dramatic to be faithful. The point is not performance but return: morning offering, pauses of recollection, evening examination, and the humble beginning again.','Suggested practices','<ul><li>Begin with a simple morning offering.</li><li>Keep a small pocket prayer or psalm for the middle of the day.</li><li>End with gratitude, repentance, and one clear intention for tomorrow.</li></ul>'),
'saints-examples.html': ('Saints & Examples','The saints are not decorative additions to the Christian life. They are proof that grace takes root in every kind of temperament, trade, and place. Some call us to courage; others to steadiness, patience, labour, or fidelity in obscurity.','In this section','<ul><li>Companions for ordinary work</li><li>Witnesses to perseverance</li><li>Irish and British examples of sanctity</li></ul>'),
'work-as-vocation.html': ('Work as Vocation','Vocation in work is not limited to grand careers. It often appears in the conscientious answering of duty, in craftsmanship, in honesty, and in refusing shoddy work even when nobody seems to notice.','A practical examination','<ul><li>What work is mine to do?</li><li>What responsibilities have I neglected?</li><li>Where can I reduce waste and increase excellence?</li></ul>'),
'craft-excellence.html': ('Craft & Excellence','There is something deeply Christian about making things carefully. Precision, patience, and beauty resist the culture of disposability. The habit of doing small tasks well can become a school of humility.','A pattern to test','<ul><li>Finish one task properly before scattering to the next.</li><li>Use tools and systems that reduce friction.</li><li>Prefer clarity to novelty.</li></ul>'),
'budgeting-stewardship.html': ('Budgeting as Stewardship','A household budget can be an instrument of peace. It names reality, prevents self-deception, and gives shape to prudence. It also reveals what is being quietly worshipped.','Starter lines in a Catholic household budget','<ul><li>Housing, food, and utilities</li><li>Giving and obligations</li><li>Savings, contingencies, and feast-day provision</li><li>Maintenance and replacement cycles</li></ul>'),
'household-order.html': ('Household Order','Domestic order is more than tidiness. It is the set of rhythms by which a home supports rather than drains its people: meal planning, paper systems, maintenance lists, and spaces that invite both work and welcome.','Order in practice','<ul><li>A weekly reset and review</li><li>A visible calendar</li><li>A simple filing system</li></ul>'),
'parish-belonging.html': ('Parish & Belonging','To belong to a parish is to accept the discipline of proximity. It means showing up, learning names, bearing inconveniences, and discovering that holiness rarely arrives in ideal conditions.','Questions worth asking','<ul><li>Where am I actually committed?</li><li>Who do I know by name?</li><li>How am I serving beyond attendance?</li></ul>'),
'hospitality-charity.html': ('Hospitality & Charity','Hospitality is not limited to dinner parties. It includes ordinary availability, attentiveness, and the willingness to make room for others in one’s plans, table, and speech. Charity is the soul of community.','A domestic rule','<ul><li>Keep one simple meal you can offer with little warning.</li><li>Guard against resentment disguised as busyness.</li><li>Let generosity be practical before it is performative.</li></ul>'),
'stability-preparedness.html': ('Stability & Preparedness','Stability grows when foreseeable risks are reduced. Preparedness can include basic emergency plans, a will, insurance awareness, duplicate records, and sensible reserves. Prudence is not panic.','Preparedness checklist','<ul><li>Named emergency contacts</li><li>Copies of key documents</li><li>Medication and routine health review</li><li>Basic household contingencies</li></ul>'),
'bodily-care.html': ('Bodily Care','The body is not an inconvenience to the spiritual life. Sleep, walking, posture, nourishment, and appropriate medical care shape how well a person can pray, work, and love.','A modest rule','<ul><li>Guard sleep where possible</li><li>Walk daily</li><li>Eat with enough simplicity to be repeatable</li></ul>'),
'sabbath-rhythm.html': ('Sabbath Rhythm','One day must not be consumed by productivity alone. Sabbath reminds us that we are creatures before we are output. Worship, rest, family life, and unhurried attention belong here.','A gentle Sunday framework','<ul><li>Mass and unhurried preparation</li><li>A meal worth lingering over</li><li>Reduced digital noise</li></ul>'),
'beauty-leisure.html': ('Beauty & Leisure','Beauty is not an extra for the already comfortable. It is one of the ways the soul is recalled to gratitude. Leisure rightly understood includes reading, music, walks, conversation, and encounters with places that enlarge attention.','Things worth keeping near','<ul><li>A reading chair and a decent lamp</li><li>A short walking route</li><li>A small list of music, poems, or places that restore proportion</li></ul>'),
}

legal_content = {
'privacy.html': ('Privacy Policy','This starter privacy policy is written for a broad UK and Ireland audience and assumes the site may offer a contact form, newsletter sign-up, analytics subject to consent, and moderation of journal comments. It should be reviewed before any live launch.','Key points','<ul><li>Personal data is collected only where necessary for contact, subscriptions, moderation, security, and the lawful operation of the site.</li><li>Analytics and optional cookies should only run after consent where required.</li><li>Users should be told how to exercise their rights of access, rectification, erasure, restriction, objection, and complaint.</li></ul>'),
'cookies.html': ('Cookie Policy','This starter cookie policy distinguishes strictly necessary cookies from optional analytics or engagement cookies. The demo banner defaults to no optional cookies until a visitor chooses.','Categories used in the demo','<ul><li>Strictly necessary: accessibility and theme preferences stored locally.</li><li>Optional analytics: placeholder only, disabled by default.</li><li>Functional enhancements: search and comment moderation helpers stored locally.</li></ul>'),
'terms.html': ('Terms of Use','The terms page sets expectations around the informational nature of the content, respectful use of comment areas, intellectual property in original material, and the absence of liability for reliance on general guidance.','Points to refine before going live','<ul><li>Who operates the site</li><li>How comments are moderated</li><li>How external links are handled</li><li>What happens if services or mailing lists are withdrawn</li></ul>'),
'data-protection.html': ('Data Protection','This page gathers together the site’s data-protection commitments in a simpler explanatory form, pointing visitors towards privacy details, cookie choices, and rights information.','Suggested sections','<ul><li>Lawful bases for processing</li><li>Retention and deletion periods</li><li>International transfers if any service providers are used</li><li>How to complain to the relevant authority</li></ul>'),
'accessibility.html': ('Accessibility Statement','This accessibility statement sets out the current measures in place, recognised limitations, and a clear route for feedback. It also notes dark mode, keyboard navigation, reduced motion handling, and semantic structure.','Current accessibility features','<ul><li>Skip link and semantic landmarks</li><li>Keyboard-friendly navigation</li><li>Dark mode and reduced motion support</li><li>Readable contrast and scalable text</li></ul>'),
}

common_head = '''<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="assets/css/styles.css">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script>window.__TCE_CONFIG__ = %s;</script>
<script defer src="assets/js/app.js"></script>''' % json.dumps(site)

def header(active=''):
    return f'''
<a class="skip-link" href="#main-content">Skip to content</a>
<div class="topbar"><div class="wrap"><div>For <span data-locale-name>England & Wales</span> · liturgical colours adapt through the year</div><div class="season-pill">Season: <strong data-season-name>Ordinary Time</strong> · Accent: <span data-season-accent>Green</span></div></div></div>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="index.html"><strong>{site['title']}</strong><span>{site['tagline']}</span></a>
    <button class="icon-btn nav-toggle" data-nav-toggle aria-label="Open navigation">☰</button>
    <nav class="nav" aria-label="Primary">
      <a href="index.html" class="{'active' if active=='home' else ''}">Home</a>
      <a href="faith-formation.html" class="{'active' if active=='faith' else ''}">Faith & Formation</a>
      <a href="vocation-work.html" class="{'active' if active=='vocation' else ''}">Vocation & Work</a>
      <a href="household-budgeting.html" class="{'active' if active=='household' else ''}">Household & Budgeting</a>
      <a href="community-relationships.html" class="{'active' if active=='community' else ''}">Community & Relationships</a>
      <a href="health-preparedness.html" class="{'active' if active=='health' else ''}">Health & Preparedness</a>
      <a href="rest-renewal.html" class="{'active' if active=='rest' else ''}">Rest & Renewal</a>
      <div class="dropdown"><button class="dropdown-toggle">More</button><div class="dropdown-menu">
        <a href="about.html">About</a><a href="journal.html">Journal</a><a href="resources.html">Resources</a><a href="contact.html">Contact</a><a href="newsletter.html">Newsletter</a><a href="admin.html">Site Steward</a>
      </div></div>
    </nav>
    <div class="header-tools">
      <button class="icon-btn" data-open-search aria-label="Open search">⌕</button>
      <button class="icon-btn" data-theme-toggle aria-label="Toggle dark mode">◐</button>
    </div>
  </div>
</header>
'''

def footer():
    return f'''
<footer class="site-footer"><div class="footer-inner">
<div><h3>{site['title']}</h3><p class="muted">{site['tagline']}</p><p class="footer-credit"><a href="{site['footer_url']}">{site['footer_credit']}</a></p></div>
<div><h3>Explore</h3><ul><li><a href="about.html">About</a></li><li><a href="journal.html">Journal</a></li><li><a href="resources.html">Resources</a></li><li><a href="contact.html">Contact</a></li><li><a href="newsletter.html">Newsletter</a></li></ul></div>
<div><h3>Pillars</h3><ul><li><a href="faith-formation.html">Faith & Formation</a></li><li><a href="vocation-work.html">Vocation & Work</a></li><li><a href="household-budgeting.html">Household & Budgeting</a></li><li><a href="community-relationships.html">Community & Relationships</a></li><li><a href="health-preparedness.html">Health & Preparedness</a></li><li><a href="rest-renewal.html">Rest & Renewal</a></li></ul></div>
<div><h3>Legal</h3><ul><li><a href="privacy.html">Privacy Policy</a></li><li><a href="cookies.html">Cookie Policy</a></li><li><a href="terms.html">Terms of Use</a></li><li><a href="data-protection.html">Data Protection</a></li><li><a href="accessibility.html">Accessibility Statement</a></li></ul></div>
</div></footer>
<div class="site-search" aria-hidden="true"><div class="search-shell"><div class="search-panel"><div class="hero-actions" style="justify-content:space-between;align-items:center"><strong>Search the site</strong><button class="icon-btn" data-close-search aria-label="Close search">✕</button></div><label class="sr-only" for="site-search-field">Search the site</label><input id="site-search-field" data-search-input type="search" placeholder="Search pages, essays, guides, journal entries…"><div class="search-results" data-search-results></div></div></div></div>
<div class="cookie-banner"><div class="cookie-card card"><div><strong>Cookie choices</strong><div class="micro">This site uses local storage for theme preference, search helpers, and moderation tools. Optional analytics remain off unless accepted.</div></div><div class="cookie-actions"><button class="btn ghost" data-cookie-choice="necessary">Necessary only</button><button class="btn" data-cookie-choice="accept">Accept optional</button></div></div></div>
'''

def page_template(title, desc, body, active='', hero_type='subhero'):
    return f'''<!doctype html><html lang="en-GB"><head><title>{title} | {site['title']}</title><meta name="description" content="{desc}">{common_head}</head><body>{header(active)}{body}{footer()}</body></html>'''

home_body = f'''
<section class="hero"><div class="hero-inner"><div class="eyebrow">A personal and project site for the UK & Ireland</div><h1>{site['title']}</h1><p>{site['tagline']} A visual notebook of Catholic life in practice: faith, work, budgeting, community, resilience, and rest, shaped by the liturgical year.</p><div class="hero-actions"><a class="btn" href="#pillars">Begin the experiment</a><a class="btn ghost" href="about.html">About the project</a></div></div></section>
<main id="main-content" class="page-shell">
<section><div class="intro"><article class="card article"><div class="kicker">The shape of the site</div><h2>Not a content farm. A lived pattern.</h2><p class="dropcap">This is a personal and project site built to inspire without bludgeoning. Its six pillars hold together prayer, labour, domestic stewardship, community, resilience, and renewal. The imagery is spacious; the deeper pages are text-led. The colours breathe with the Church year so that a Catholic visitor senses the season before needing it named.</p><p>The result is meant to feel modern, restrained, and rooted in Britain and Ireland rather than imported from a louder online culture.</p></article><aside class="card"><h3>Liturgical rhythm today</h3><p class="muted">The site adapts automatically for <span data-locale-name>England & Wales</span>.</p><div class="notice"><strong data-season-name>Ordinary Time</strong><br><span class="micro">Current accent: <span data-season-accent>Green</span></span></div><p class="micro">Gaudete and Laetare are handled separately. On .ie domains, the script switches to the Ireland locale for featured national feasts.</p></aside></div></section>
<section id="pillars"><div class="pillar-strip">
'''
for key in ['faith','vocation','household','community','health','rest']:
    info = pillar_info[key]
    slug = [k for k,v in {
        'faith':'faith-formation.html','vocation':'vocation-work.html','household':'household-budgeting.html','community':'community-relationships.html','health':'health-preparedness.html','rest':'rest-renewal.html'}.items() if k==key][0]
    link = {'faith':'faith-formation.html','vocation':'vocation-work.html','household':'household-budgeting.html','community':'community-relationships.html','health':'health-preparedness.html','rest':'rest-renewal.html'}[key]
    home_body += f'''<article class="pillar-band"><figure><img src="{info['image']}" alt="Editorial placeholder for {info['title']}"></figure><div class="pillar-copy"><div class="kicker">Pillar</div><h2>{info['title']}</h2><p>{info['summary']}</p><div><a class="btn" href="{link}">Explore this pillar</a></div></div></article>'''
home_body += '''</div></section>
<section><div class="featured-post"><figure class="glass"><img src="assets/img/20240406_143639.jpg" alt="Featured journal atmosphere"></figure><article class="article card"><div class="kicker">From the journal</div><h2>Thoughtful essays, practical notes, and experiments in living</h2><p>The journal is where reflection meets practicality: rules of life, notes on stewardship, observations from parish and place, and experiments worth keeping.</p><div class="hero-actions"><a class="btn" href="journal.html">Read the journal</a><a class="btn ghost" href="resources.html">Browse resources</a></div></article></div></section>
</main>'''
(base/'index.html').write_text(page_template('Home', site['description'], home_body, 'home', 'hero'), encoding='utf-8')
search_index.append({'url':'index.html','title':'Home','section':'Home','description':'Overview of the six pillars, liturgical rhythm, and the purpose of The Catholic Experiment.','keywords':'catholic experiment six pillars faith work budgeting community preparedness renewal'})

# General pages
about_body = '''<section class="subhero"><div class="subhero-inner"><div class="eyebrow">About the project</div><h1>About the Experiment</h1><p>A personal and project site for the UK and Ireland: restrained in tone, quietly evangelical in spirit, and rooted in lived patterns rather than loud branding.</p></div></section>
<main id="main-content" class="page-shell"><div class="page-grid"><article class="article card"><div class="breadcrumbs"><a href="index.html">Home</a> / About</div><p class="dropcap">The Catholic Experiment is built as both a reflective publication and a practical framework. Its public face is visual and spacious; its inner pages are more textual and deliberate. The goal is to show that Catholic living can be intelligent, beautiful, orderly, and realistic.</p><p>This first version is intentionally full enough to feel alive: six pillars, a journal, resources, contact paths, newsletter sign-up, legal pages, search, accessible navigation, dark mode, and a lightweight site-steward interface for future enhancement.</p><h2>The six pillars</h2><div class="grid-2"><div class="tile"><h3>Faith & Formation</h3><p>Prayer, learning, doctrine, and spiritual companionship.</p></div><div class="tile"><h3>Vocation & Work</h3><p>Labour, discipline, craftsmanship, and professional honesty.</p></div><div class="tile"><h3>Household & Budgeting</h3><p>Domestic prudence, home systems, budgeting, and stewardship.</p></div><div class="tile"><h3>Community & Relationships</h3><p>Parish, hospitality, friendship, and duty to neighbour.</p></div><div class="tile"><h3>Health & Preparedness</h3><p>Embodied care, resilience, records, and foresight.</p></div><div class="tile"><h3>Rest & Renewal</h3><p>Sabbath, leisure, beauty, and the refusal of permanent agitation.</p></div></div></article><aside class="aside card"><h3>Project notes</h3><ul><li>Designed for a UK & Ireland audience.</li><li>Liturgical colour system changes through the year.</li><li>English and Irish contexts can later branch more fully by locale.</li><li>Footer attribution remains discreet on every page.</li></ul></aside></div></main>'''
(base/'about.html').write_text(page_template('About', 'About The Catholic Experiment.', about_body), encoding='utf-8')
search_index.append({'url':'about.html','title':'About the Experiment','section':'About','description':'Purpose, tone, and six-pillar structure of the project.','keywords':'about purpose catholic experiment six pillars rule of life'})

journal_body = '''<section class="subhero"><div class="subhero-inner"><div class="eyebrow">Journal</div><h1>Journal</h1><p>Essays, field notes, and practical reflections. Comments are moderated before publication.</p></div></section>
<main id="main-content" class="page-shell"><div class="page-grid"><div><div class="breadcrumbs"><a href="index.html">Home</a> / Journal</div><div data-journal-list></div><section class="card article"><h2>Leave a comment</h2><p class="muted">Comments are held for approval by the site steward.</p><form data-comment-form><div class="form-row"><div><label for="author">Name</label><input id="author" name="author" required></div><div><label for="email">Email</label><input id="email" name="email" type="email" required></div></div><label for="text">Comment</label><textarea id="text" name="text" required></textarea><div class="hero-actions"><button class="btn" type="submit">Submit for approval</button></div></form></section></div><aside class="aside card"><h3>Comment policy</h3><ul><li>Comments are moderated.</li><li>Clarity and charity matter more than speed.</li><li>Abusive or promotional submissions are not approved.</li></ul><h3>Approved comments</h3><div data-comments-target><p class="muted">Open a post to see its approved comments.</p></div></aside></div></main>'''
(base/'journal.html').write_text(page_template('Journal','Journal entries and moderated comments.',journal_body,'journal'), encoding='utf-8')
search_index.append({'url':'journal.html','title':'Journal','section':'Journal','description':'Essays, reflections, and moderated comments.','keywords':'journal comments essays reflections'})

resources_body = '''<section class="subhero"><div class="subhero-inner"><div class="eyebrow">Resources</div><h1>Resources</h1><p>A practical shelf: books, habits, templates, and patterns worth keeping to hand.</p></div></section>
<main id="main-content" class="page-shell"><div class="breadcrumbs"><a href="index.html">Home</a> / Resources</div><div class="resource-grid"><article class="post-card"><div class="kicker">Reading</div><h2>Foundational texts</h2><p>Scripture, catechetical works, Benedictine wisdom, essays on craftsmanship, and books on stewardship and domestic order.</p></article><article class="post-card"><div class="kicker">Systems</div><h2>Useful templates</h2><p>Budget sheets, weekly reviews, prayer prompts, emergency information summaries, and household reset checklists.</p></article><article class="post-card"><div class="kicker">Places</div><h2>Architecture and pilgrimage</h2><p>Editorial placeholders in this build nod towards places such as Letterkenny, Glastonbury, Wells, and Winchester.</p></article></div><section><div class="card article"><h2>For a later build</h2><p class="dropcap">This area is structured to grow into downloadable resources, reading lists, short liturgical guides, and practical domestic templates. In a fuller CMS version it could easily become a filtered library.</p></div></section></main>'''
(base/'resources.html').write_text(page_template('Resources','Resources and practical guides.',resources_body,'resources'), encoding='utf-8')
search_index.append({'url':'resources.html','title':'Resources','section':'Resources','description':'Books, templates, habits, and practical tools.','keywords':'resources books templates budgeting prayer checklist'})

contact_body = f'''<section class="subhero"><div class="subhero-inner"><div class="eyebrow">Contact</div><h1>Contact</h1><p>A modest contact form for enquiries, reflections, or correspondence.</p></div></section>
<main id="main-content" class="page-shell"><div class="page-grid"><article class="card article"><div class="breadcrumbs"><a href="index.html">Home</a> / Contact</div><p class="dropcap">This demo form does not submit to a live service yet. It shows the intended shape: a restrained route for thoughtful contact, not an aggressive funnel.</p><form><div class="form-row"><div><label for="name">Name</label><input id="name" required></div><div><label for="email2">Email</label><input id="email2" type="email" required></div></div><label for="subject">Subject</label><input id="subject"><label for="message">Message</label><textarea id="message"></textarea><div class="form-note">Future enhancement: connect to a mail service or static form backend, then align the privacy notice accordingly.</div><div class="hero-actions"><button class="btn" type="button">Send (demo)</button></div></form></article><aside class="aside card"><h3>Direct contact</h3><p class="muted">Placeholder address: <a href="mailto:{site['contact_email']}">{site['contact_email']}</a></p><p class="micro">Consider using an alias rather than a personal address on the live site.</p></aside></div></main>'''
(base/'contact.html').write_text(page_template('Contact','Contact form demo.',contact_body,'contact'), encoding='utf-8')
search_index.append({'url':'contact.html','title':'Contact','section':'Contact','description':'A restrained contact path with a simple contact path.','keywords':'contact form email'})

newsletter_body = f'''<section class="subhero"><div class="subhero-inner"><div class="eyebrow">Newsletter</div><h1>Newsletter</h1><p>An occasional letter, not a flood: new essays, useful resources, and seasonal notes.</p></div></section>
<main id="main-content" class="page-shell"><div class="page-grid"><article class="card article"><div class="breadcrumbs"><a href="index.html">Home</a> / Newsletter</div><p class="dropcap">The newsletter is imagined as a quiet extension of the site: infrequent, thoughtful, and brief. A live build could connect this form to a consent-aware mailing platform once the privacy language and double opt-in process are finalised.</p><form><div class="form-row"><div><label for="first">First name</label><input id="first"></div><div><label for="email3">Email</label><input id="email3" type="email" required></div></div><label><input type="checkbox" style="width:auto;margin-right:.5rem"> I would like to receive occasional emails about new posts and resources.</label><div class="hero-actions"><button class="btn" type="button">Subscribe (demo)</button></div></form></article><aside class="aside card"><h3>Newsletter principle</h3><ul><li>Double opt-in before any live launch</li><li>No third-party marketing lists</li><li>Easy unsubscribe in every email</li></ul></aside></div></main>'''
(base/'newsletter.html').write_text(page_template('Newsletter','Newsletter sign-up demo.',newsletter_body,'newsletter'), encoding='utf-8')
search_index.append({'url':'newsletter.html','title':'Newsletter','section':'Newsletter','description':'Occasional updates and seasonal notes sign-up page.','keywords':'newsletter subscribe email updates'})

# Pillars
pillar_subpages = {
'faith-formation.html': [('prayer-rhythm.html','Prayer Rhythm'),('saints-examples.html','Saints & Examples')],
'vocation-work.html': [('work-as-vocation.html','Work as Vocation'),('craft-excellence.html','Craft & Excellence')],
'household-budgeting.html': [('budgeting-stewardship.html','Budgeting as Stewardship'),('household-order.html','Household Order')],
'community-relationships.html': [('parish-belonging.html','Parish & Belonging'),('hospitality-charity.html','Hospitality & Charity')],
'health-preparedness.html': [('stability-preparedness.html','Stability & Preparedness'),('bodily-care.html','Bodily Care')],
'rest-renewal.html': [('sabbath-rhythm.html','Sabbath Rhythm'),('beauty-leisure.html','Beauty & Leisure')],
}

for file,title,key,kind in pages:
    if kind=='pillar':
        h1, sub, intro = lead_texts[file]
        info = pillar_info[key]
        links = pillar_subpages[file]
        body = f'''<section class="subhero"><div class="subhero-inner"><div class="eyebrow">Pillar</div><h1>{h1}</h1><p>{sub}</p></div></section>
<main id="main-content" class="page-shell"><div class="page-grid"><div><div class="breadcrumbs"><a href="index.html">Home</a> / {h1}</div><figure class="glass"><img src="{info['image']}" alt="{h1}"></figure><article class="card article"><p class="dropcap">{intro}</p><p>These lead pages are intentionally visual and thematic. They are meant to invite a visitor into a mode of life before the more text-based essays, guides, and notes deepen the material.</p><div class="callout"><strong>This pillar in version one</strong><p class="muted">Two sample inner pages are wired in now, with the structure ready for many more.</p></div></article><section class="grid-2">'''
        for link,label in links:
            body += f'''<article class="tile"><div class="kicker">Explore</div><h3>{label}</h3><p>{articles[link][1][:120]}…</p><a class="more" href="{link}">Open page →</a></article>'''
        body += '''</section></div><aside class="aside card"><h3>Within this pillar</h3><ul>'''
        for link,label in links:
            body += f'<li><a href="{link}">{label}</a></li>'
        body += '</ul><h3>Design note</h3><p class="muted">Seasonal accents, subtle iconography, and restrained motion are handled globally so the atmosphere remains coherent across the whole site.</p></aside></div></main>'
        (base/file).write_text(page_template(h1, sub, body, key), encoding='utf-8')
        search_index.append({'url':file,'title':h1,'section':'Pillar','description':sub,'keywords':f'{h1} pillar catholic life {sub}'})
    elif kind=='article':
        title2, text, box_title, box_html = articles[file]
        # map active key
        active_key = next(k for k,v in pillar_subpages.items() if any(x[0]==file for x in v))
        active_section = {'faith-formation.html':'faith','vocation-work.html':'vocation','household-budgeting.html':'household','community-relationships.html':'community','health-preparedness.html':'health','rest-renewal.html':'rest'}[active_key]
        parent_title = [p[1] for p in pages if p[0]==active_key][0]
        body = f'''<section class="subhero"><div class="subhero-inner"><div class="eyebrow">Essay / Guide</div><h1>{title2}</h1><p>{text[:120]}…</p></div></section>
<main id="main-content" class="page-shell"><div class="page-grid"><article class="card article"><div class="breadcrumbs"><a href="index.html">Home</a> / <a href="{active_key}">{parent_title}</a> / {title2}</div><p class="dropcap">{text}</p><p>This sample page is written with polished placeholder prose so the build feels inhabited from the outset. Its purpose is to demonstrate typography, spacing, drop caps, pull quotes, and the intended rhythm between long-form reading and practical side-notes.</p><blockquote>The best rules of life are sturdy enough to be lived and gentle enough to be resumed after failure.</blockquote><h2>{box_title}</h2>{box_html}<p>Future iterations can introduce more locale-specific examples for Britain and Ireland, richer references, audio reflections, or downloadable templates linked from the resources section.</p></article><aside class="aside card"><h3>Within {parent_title}</h3><ul>'''
        for link,label in pillar_subpages[active_key]:
            body += f'<li><a href="{link}">{label}</a></li>'
        body += '</ul><h3>Related</h3><p class="muted"><a href="journal.html">Journal reflections</a> and <a href="resources.html">resources</a> can cross-link here later.</p></aside></div></main>'
        (base/file).write_text(page_template(title2, text[:150], body, active_section), encoding='utf-8')
        search_index.append({'url':file,'title':title2,'section':parent_title,'description':text[:140],'keywords':title2+' '+parent_title})
    elif kind=='legal':
        title2, text, box_title, box_html = legal_content[file]
        body = f'''<section class="subhero"><div class="subhero-inner"><div class="eyebrow">Legal & compliance</div><h1>{title2}</h1><p>{text}</p></div></section>
<main id="main-content" class="page-shell"><div class="page-grid"><article class="card article"><div class="breadcrumbs"><a href="index.html">Home</a> / {title2}</div><p class="dropcap">{text}</p><p>Because the work serves readers across Britain and Ireland, the wording is kept clear and careful, with room for further refinement as the site grows in use and depth.</p><h2>{box_title}</h2>{box_html}<h2>Further practical work</h2><ul><li>Keep contact details current and easy to find.</li><li>List the processors and hosting providers that support the work.</li><li>Review and confirm retention periods.</li><li>Review legal wording regularly so it remains accurate in each jurisdiction served.</li></ul></article><aside class="aside card"><h3>Related pages</h3><ul><li><a href="privacy.html">Privacy Policy</a></li><li><a href="cookies.html">Cookie Policy</a></li><li><a href="terms.html">Terms of Use</a></li><li><a href="data-protection.html">Data Protection</a></li><li><a href="accessibility.html">Accessibility Statement</a></li></ul></aside></div></main>'''
        (base/file).write_text(page_template(title2, text, body, 'legal'), encoding='utf-8')
        search_index.append({'url':file,'title':title2,'section':'Legal','description':text,'keywords':title2+' privacy cookies gdpr accessibility terms'})

# admin
admin_body = '''<section class="subhero"><div class="subhero-inner"><div class="eyebrow">Lightweight CMS</div><h1>Site Steward</h1><p>A browser-based steward panel for this prototype: review comments, tweak core text fields, and export JSON for future enhancement.</p></div></section>
<main id="main-content" class="admin-shell" data-admin><div class="breadcrumbs"><a href="index.html">Home</a> / Site Steward</div><div data-admin-login class="card admin-block"><h2>Enter steward PIN</h2><p class="muted">This is a prototype admin area intended for local review only.</p><form data-pin-form><label for="pin">PIN</label><input id="pin" name="pin" type="password" required><div class="hero-actions"><button class="btn" type="submit">Enter</button><span class="pill" data-pin-hint></span></div></form></div><div data-admin-panel class="hidden"><div class="admin-grid"><section class="card admin-block"><h2>Core settings</h2><div class="form-row"><div><label>Site title</label><input name="siteTitle"></div><div><label>Tagline</label><input name="tagline"></div></div><div class="form-row"><div><label>Contact email</label><input name="contactEmail"></div><div><label>Footer credit</label><input name="footerCredit"></div></div><label>Footer URL</label><input name="footerUrl"><div class="hero-actions"><button class="btn" type="button" data-export-site>Export JSON snapshot</button></div><p class="micro">This prototype exports JSON for later use. Pure browser HTML cannot directly overwrite local files without a fuller backend.</p></section><section class="card admin-block"><h2>Pending comments</h2><div data-pending-comments><p class="muted">No pending comments yet.</p></div></section></div></div></main>'''
(base/'admin.html').write_text(page_template('Site Steward','Lightweight CMS / steward panel demo.',admin_body,'admin'), encoding='utf-8')
search_index.append({'url':'admin.html','title':'Site Steward','section':'Governance','description':'Public note explaining that browser admin is disabled in the public build.','keywords':'admin disabled governance'})

readme = '''# The Catholic Experiment

This legacy generator script predates the current public build and should be treated as historical scaffolding rather than a faithful description of the live site.

## Legacy note
- The repo now has a directory-first governance model, published rulebook, and public safeguarding page.
- Browser admin tooling and public moderation features are not part of the public build.
- Use the top-level README in the repo root for the current project description.

## How to preview
Open `index.html` in a browser. Some browsers restrict `fetch()` when opened directly from disk.
If that happens, run a simple local server in this folder, for example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Implementation note
If this generator is kept, it should be brought into line with the current public site before it is used to regenerate pages or data.
'''
(base/'README.md').write_text(readme, encoding='utf-8')

(base/'assets/data/search-index.json').write_text(json.dumps(search_index, indent=2), encoding='utf-8')

# Zip it
zip_path = Path('/mnt/data/The_Catholic_Experiment_Prototype.zip')
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for path in base.rglob('*'):
        if path.is_file() and path.name != 'generate_site.py':
            z.write(path, path.relative_to(base.parent))
print(zip_path)
