from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')

# Homepage: preserve the existing proposition while making the experiment genuinely open-ended.
home_old = '<p>I am Alan, a Catholic convert and the learner behind this experiment. I am using books, notebooks, memory, authoritative Catholic sources and my background in technology to organise, test and document a long-term course of study.</p>'
home_new = home_old + '<p><strong>I do not yet know whether this method will work as well as I hope. That uncertainty is part of the point.</strong></p>'
text = text.replace(home_old, home_new, 1)

# Courses: curiosity before classification.
courses_old = '<section class="view" id="courses" data-section hidden><h1>Courses</h1><p class="lede">As the Experiment unfolds, the courses I have planned will become available below. After my conversion, I chose to dedicate my life to God, so it may seem like quite a number of courses—but remember, this is a venture I am in for the long haul. Feel free to follow my progress and join in!</p>'
courses_new = '<section class="view" id="courses" data-section hidden><h1>Courses</h1><p class="lede">Catholicism has had two thousand years to accumulate theology, languages, arguments, saints, controversies, prayers, laws and books of intimidating thickness. The difficulty is not finding something to study. It is deciding where on earth to begin.</p><p class="lede">As the Experiment unfolds, the courses I have planned will become available below. This is a venture for the long haul: serious enough to demand method, but human enough to allow questions, wrong turns and changes of pace.</p>'
text = text.replace(courses_old, courses_new, 1)

school_replacements = {
    'Doctrine, theology, moral life, prayer, worship and apostolate.': 'What does the Church actually teach, how does it fit together, and what might it ask of an ordinary life?',
    'Languages of Scripture, worship and Catholic tradition.': 'What becomes visible when the languages of Scripture, worship and Catholic tradition stop looking like code?',
    'Scripture, interpretation, history, literature and material context.': 'How does Scripture change when it is read as a whole received, interpreted and prayed by the Church?',
    'Logic, philosophy, natural theology and disciplined human judgement.': 'How can faith and reason help us distinguish a sound argument from one merely dressed to look clever?',
    'The Church across time and the lives through which she bears witness.': 'What can holiness, courage, confusion, politics, reform, failure and renewal teach us about the Church across time?',
    'Catholic life, law, culture, science and public responsibility.': 'What does Catholic belief look like when it meets law, culture, science, technology and public responsibility?'
}
for old, new in school_replacements.items():
    text = text.replace(f'<p>{old}</p></summary>', f'<p>{new}</p></summary>', 1)

course_replacements = {
    'A structured course in Catholic doctrine and formation using a historical catechetical spine checked against current authoritative Catholic teaching.': 'What does the Catholic Church actually teach, how do its teachings fit together, and how can an ordinary person distinguish doctrine from opinion or habit?',
    'Reading, handwriting, speaking, listening and reflection through a graded Ecclesiastical Latin course.': 'How much of the Church’s prayer, worship and intellectual history becomes visible when Latin stops looking like a code?',
    'A foundational route through Scripture within Sacred Tradition and the Magisterium.': 'What changes when Scripture is read not as isolated quotations, but as a whole received, interpreted and prayed by the Church?',
    'Terms, propositions, syllogisms, fallacies and argument testing.': 'How can we tell whether an argument is sound, persuasive, misleading or simply dressed up to look clever?'
}
for old, new in course_replacements.items():
    text = text.replace(f'<p>{old}</p>', f'<p>{new}</p>', 1)

# Schedule: begin from the ordinary human problem.
schedule_marker = '<section class="view" id="schedule" data-section hidden>\n<h1>Schedule</h1>'
schedule_intro = schedule_marker + '\n<p class="lede schedule-intro"><strong>Most ambitious study plans fail not because the learner lacks interest, but because the plan quietly assumes unlimited time, energy and concentration.</strong></p>'
text = text.replace(schedule_marker, schedule_intro, 1)

# Materials: reassurance before apparatus.
materials_marker = '<section class="view" id="materials" data-section hidden>\n<h1>Materials and study tools</h1>'
materials_intro = materials_marker + '\n<p class="lede materials-intro"><strong>Serious study does not require an expensive library, elaborate software or a perfectly organised life.</strong></p>'
text = text.replace(materials_marker, materials_intro, 1)

journal = '''<section class="view" id="journal" data-section hidden>
<h1>Journal</h1>
<p class="lede">This is the intellectual field notebook for The Catholic Experiment: not merely what was completed, but what surprised me, what resisted easy explanation, what I misunderstood and what still needs checking.</p>
<div class="notice"><strong>Programme record, not assessment:</strong> certificates remain on each individual course site. The journal records the wider learning journey honestly, including uncertainty and correction.</div>
<div class="media-list">
<article class="media-card" style="--accent:var(--blue)"><span class="status active">Faith and Formation</span><h2>The Faith Experiment journal</h2><p>Entries use the same candid structure: <strong>What I studied · What I noticed · What I got wrong · What remains uncertain · What I will do next.</strong></p><a class="button" href="https://wally189.github.io/The-Faith-Experiment/#journal">Open Faith journal →</a><a class="button" href="https://wally189.github.io/The-Faith-Experiment/">Open course →</a></article>
<article class="media-card" style="--accent:var(--burgundy)"><span class="status active">Sacred Languages</span><h2>The Latin Experiment journal</h2><p>Lessons, handwriting, vocabulary, grammar and corrections are recorded as working notes rather than polished claims of effortless progress.</p><a class="button" href="https://wally189.github.io/the-latin-experiment/#journal">Open Latin journal →</a><a class="button" href="https://wally189.github.io/the-latin-experiment/">Open course →</a></article>
</div>
</section>'''

videos = '''<section class="view" id="videos" data-section hidden>
<h1>Videos</h1>
<p class="lede"><strong>What happens when an ordinary Catholic tries to study the faith seriously—using old books, handwriting, modern tools and no guarantee that the method will work?</strong></p>
<p class="lede">These videos record the experiment as it happens: what I learned, what surprised me, what I misunderstood and whether any of it made a difference.</p>
<div class="notice"><strong>New here? Begin with the welcome video.</strong> It explains the question behind The Catholic Experiment, how the Schools fit together and why the mistakes matter as much as the successes.</div>
<article class="media-card" style="--accent:var(--gold);margin-top:24px"><span class="status planned">Welcome · Start here</span><h2>Can an ordinary Catholic build a serious education in the faith?</h2><p>I began with books, notebooks and a slightly unreasonable plan. This video explains what I am attempting, why I am documenting it publicly and what would count as success—or failure.</p><a class="button" href="#videos" aria-disabled="true">Coming soon</a></article>

<details class="course-accordion" style="--school:var(--blue);--school-soft:#edf4f8" open>
<summary><span class="status active">School 01</span><h2>Faith and Formation</h2><p>What changes when Catholic belief is treated not as a list of facts, but as something to be understood, tested and lived?</p></summary>
<div class="accordion-content"><h3>The Faith Experiment</h3><div class="media-list">
<article class="media-card" style="--accent:var(--blue)"><span class="status planned">Lessons 1–4</span><h2>Did the first four lessons change what I thought faith was?</h2><p>I began expecting information. Instead, the course raised questions about belief, worship, authority and what Catholic teaching might demand in ordinary life.</p></article>
<article class="media-card" style="--accent:var(--blue)"><span class="status planned">Lessons 5–8</span><h2>What became harder once the pieces started fitting together?</h2><p>The second reflection will look at the questions that emerged when separate doctrines began to connect—and when understanding them started to feel more demanding.</p></article>
<article class="media-card" style="--accent:var(--blue)"><span class="status planned">Lessons 9–12</span><h2>What did the whole course actually change?</h2><p>The final reflection will consider what remained, what needed correction and whether the course altered how I understood or practised the faith.</p></article>
</div></div></details>

<details class="course-accordion" style="--school:var(--burgundy);--school-soft:#faeef1" open>
<summary><span class="status active">School 02</span><h2>Sacred Languages</h2><p>What becomes visible when Latin stops looking like a code and begins to sound like a language?</p></summary>
<div class="accordion-content"><h3>The Latin Experiment</h3><div class="media-list">
<article class="media-card" style="--accent:var(--burgundy)"><span class="status planned">Lessons 1–5</span><h2>What happened when I actually tried to learn Latin?</h2><p>Five lessons in, I had copied vocabulary, read aloud, encountered the first signs of grammar and discovered that neat handwriting is not the same thing as understanding. Here is what worked, what did not and what I had misunderstood.</p></article>
</div></div></details>

<p class="muted" style="margin-top:22px">Other Schools will appear here as their Experiments begin.</p>
</section>'''

text, journal_count = re.subn(r'<section class="view" id="journal" data-section hidden>.*?</section>\s*<section class="view" id="videos"', journal + '\n<section class="view" id="videos"', text, count=1, flags=re.S)
if journal_count != 1:
    raise RuntimeError(f'Expected one Journal section, replaced {journal_count}')
text, video_count = re.subn(r'<section class="view" id="videos" data-section hidden>.*?</section>\s*<section class="view" id="contact"', videos + '\n<section class="view" id="contact"', text, count=1, flags=re.S)
if video_count != 1:
    raise RuntimeError(f'Expected one Videos section, replaced {video_count}')

# Visual-only redesign. This deliberately changes no site copy, links, sections or behaviour.
monastic_css = r'''
/* Catholix monastic visual layer */
:root{--ink:#07182d;--burgundy:#7c2438;--blue:#244e78;--gold:#b88a31;--green:#345e4c;--purple:#514566;--rose:#865064;--ivory:#f3ecdc;--stone:#6e675d;--paper:#fbf7ed;--ground:#06172b;--muted:#655f56;--line:#d6c9ad;--navy:#06172b;--navy-soft:#0d2947;--parchment:#f7f0e2;--rule:#b88a31}
*{box-sizing:border-box}
html{background:var(--navy)}
body{margin:0;padding:18px;background:var(--navy);font:17px/1.72 Georgia,'Times New Roman',serif;color:var(--ink)}
body::before{content:'JMJ';position:fixed;z-index:20;top:27px;right:35px;color:var(--gold);font:700 15px/1 Georgia,serif;letter-spacing:.18em;pointer-events:none}
.app{min-height:calc(100vh - 36px);border:2px solid var(--gold);outline:1px solid rgba(184,138,49,.42);outline-offset:-8px;border-radius:0;background:var(--paper);display:grid;grid-template-columns:105px minmax(0,1fr);overflow:hidden;box-shadow:0 20px 70px rgba(0,0,0,.36)}
.nav{position:relative;background:linear-gradient(180deg,#06172b,#0a223c 72%,#06172b);color:#fff;padding:27px 9px 24px;border-right:1px solid var(--gold);display:flex;flex-direction:column}
.nav::before,.nav::after{content:'✦';display:block;color:var(--gold);text-align:center;font-size:13px;letter-spacing:.25em}
.nav::before{margin-bottom:14px}.nav::after{margin-top:auto;padding-top:22px;border-top:1px solid rgba(184,138,49,.44)}
.logo{width:61px;height:61px;border:1px solid var(--gold);border-radius:50%;background:transparent;color:var(--gold);margin:0 auto 24px;display:grid;place-items:center;font:35px Georgia,serif;box-shadow:inset 0 0 0 5px rgba(184,138,49,.06)}
.nav a{position:relative;color:#d9d2c3;text-decoration:none;text-align:center;padding:15px 2px 14px;border:0;border-top:1px solid rgba(255,255,255,.08);border-radius:0;margin:0;font:700 11px/1.4 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}
.nav a:last-of-type{border-bottom:1px solid rgba(255,255,255,.08)}
.nav a:hover,.nav a:focus-visible,.nav a.on{color:#fff;background:linear-gradient(90deg,rgba(184,138,49,.18),transparent);box-shadow:inset 3px 0 var(--gold);outline:none}
main{min-width:0;background:var(--paper);background-image:radial-gradient(circle at 20% 10%,rgba(184,138,49,.05),transparent 28%),linear-gradient(rgba(255,255,255,.25),rgba(255,255,255,.25))}
.view{padding:54px clamp(28px,5vw,78px) 70px;min-height:82vh}
.view>h1{margin:0 0 24px;padding:0 0 18px;border-bottom:1px solid var(--gold);font:400 clamp(42px,6vw,72px)/1.05 Georgia,serif;letter-spacing:.015em;color:var(--navy)}
.view>h1::after{content:'✠';float:right;color:var(--gold);font-size:.42em;margin-top:.55em}
.hero{position:relative;overflow:hidden;min-height:70vh;border:0;border-radius:0;padding:clamp(44px,7vw,92px);color:var(--navy);background:linear-gradient(90deg,rgba(251,247,237,.98) 0 57%,rgba(251,247,237,.82) 57% 100%),repeating-linear-gradient(90deg,transparent 0 84px,rgba(184,138,49,.09) 85px 86px),linear-gradient(135deg,#efe3ca,#fbf7ed);display:flex;flex-direction:column;justify-content:center;border-bottom:1px solid var(--gold)}
.hero::before{content:'✠';position:absolute;right:7%;top:10%;width:210px;height:300px;border:1px solid rgba(184,138,49,.55);border-bottom:0;border-radius:120px 120px 0 0;display:grid;place-items:center;color:rgba(184,138,49,.5);font-size:72px;background:linear-gradient(180deg,rgba(184,138,49,.06),transparent)}
.hero::after{content:'';position:absolute;left:clamp(44px,7vw,92px);right:clamp(44px,7vw,92px);bottom:38px;height:1px;background:linear-gradient(90deg,var(--gold),transparent)}
.hero>*{position:relative;max-width:min(760px,72%)}
.hero small{font:700 12px/1.4 Arial,sans-serif;letter-spacing:.2em;color:var(--gold)}
.hero h1{font:400 clamp(58px,7vw,98px)/.94 Georgia,serif;margin:18px 0 26px;max-width:850px;color:var(--navy);letter-spacing:-.025em}
.hero .question{max-width:790px;font:italic 28px/1.42 Georgia,serif;margin:0 0 22px;color:#243247}
.hero p{max-width:790px;font-size:18px;color:#3f3a34}
.hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px}
.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--gold);border-radius:0;padding:12px 17px;background:var(--navy);color:#fff;font:700 12px/1.2 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}
.button:hover,.button:focus-visible{background:var(--gold);color:var(--navy);outline:2px solid var(--navy);outline-offset:2px}
.button.secondary{background:transparent;color:var(--navy);border-color:var(--navy)}
h1,h2,h3{font-family:Georgia,'Times New Roman',serif;font-weight:400}h1{font-size:52px;line-height:1.08}h2{font-size:34px;line-height:1.18}h3{font-size:24px;line-height:1.24}
.lede{max-width:900px;color:#555047;font-size:19px}.story{max-width:980px;margin:56px auto 0}.story p{font-size:18px}.story>h2,.story section>h2{padding-bottom:12px;border-bottom:1px solid var(--line)}
.pullquote{margin:38px 0;padding:28px 34px;border:0;border-left:3px solid var(--gold);background:transparent;border-radius:0;font:italic 27px/1.5 Georgia,serif;color:#233149}
.method-list{columns:2;column-gap:54px;padding:22px 0 0;list-style:none;border-top:1px solid var(--line)}.method-list li{break-inside:avoid;margin:0;padding:10px 0 10px 26px;border-bottom:1px dotted #c9baa0;position:relative}.method-list li::before{content:'✦';position:absolute;left:2px;color:var(--gold);font-size:10px;top:15px}
.cards,.grid{display:block;margin-top:26px}.card{display:block;border:0;border-top:1px solid var(--line);border-radius:0;padding:24px 10px 25px 36px;background:transparent;text-decoration:none;position:relative}.card:last-child{border-bottom:1px solid var(--line)}.card::before{content:'✠';position:absolute;left:3px;top:26px;color:var(--accent,var(--gold));font-size:17px}.card h3{margin:0 0 6px}.card p,.muted{color:var(--muted)}.school-grid .card{min-height:0;transition:padding .15s ease,background .15s ease}.school-grid .card:hover,.school-grid .card:focus-visible{transform:none;box-shadow:none;outline:none;padding-left:45px;background:rgba(184,138,49,.055)}
.status{display:inline-block;padding:4px 9px;border:1px solid currentColor;border-radius:0;background:transparent;font:700 10px/1.3 Arial,sans-serif;text-transform:uppercase;letter-spacing:.1em;color:var(--gold)}.status.active{background:transparent;color:var(--green)}.status.planned{background:transparent;color:var(--stone)}
.notice{margin:28px 0;padding:20px 24px;border:1px solid var(--line);border-left:4px solid var(--gold);background:rgba(184,138,49,.055);border-radius:0}
.section-heading{display:flex;align-items:end;justify-content:space-between;gap:24px;margin:48px 0 8px;padding-bottom:14px;border-bottom:1px solid var(--gold)}.section-heading h2{margin:7px 0 0}.section-heading p{max-width:650px;margin:0;color:var(--muted)}
.course-accordion{--school:var(--burgundy);--school-soft:transparent;margin-top:0;border:0;border-bottom:1px solid var(--line);border-left:0;border-radius:0;background:transparent;overflow:hidden;scroll-margin-top:24px}.course-accordion:first-of-type{border-top:1px solid var(--line)}
.course-accordion summary{position:relative;display:block;padding:28px 68px 26px 8px;cursor:pointer;list-style:none;background:transparent}.course-accordion summary::-webkit-details-marker{display:none}.course-accordion summary::before{content:'✠';position:absolute;left:8px;top:33px;color:var(--school);font-size:14px}.course-accordion summary::after{content:'＋';position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:25px;font-weight:400;color:var(--school)}.course-accordion[open] summary::after{content:'−'}.course-accordion summary:hover,.course-accordion summary:focus-visible{filter:none;outline:none;background:rgba(184,138,49,.045)}.course-accordion summary>*{margin-left:32px}.course-accordion summary h2{margin-top:7px;margin-bottom:5px;font-size:32px;line-height:1.15}.course-accordion summary p{color:var(--muted);font-size:16px;line-height:1.55;max-width:780px}.course-accordion summary .status{background:transparent;color:var(--school)}
.accordion-content{padding:0 8px 32px 40px}.syllabus{display:block}.course-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 26px;align-items:center;padding:22px 0;border:0;border-top:1px dotted #c9baa0;border-radius:0;background:transparent;min-width:0}.course-row:first-child{border-top:1px solid var(--line)}.course-row>div:first-child,.course-row>div:nth-child(2){grid-column:1}.course-row h3{margin:5px 0 0;font-size:26px}.course-row p{margin:0;color:var(--muted);font-size:17px;line-height:1.58}.course-row .button{grid-column:2;grid-row:1/3;align-self:center;background:var(--navy);color:#fff}.course-row.planned{background:transparent}.route{font-size:19px;line-height:1.9}.standards{max-width:960px;margin-top:42px;padding:28px 0;border:0;border-top:1px solid var(--gold);border-bottom:1px solid var(--line);border-radius:0;background:transparent}
.schedule-grid{display:block;margin:30px 0 42px}.schedule-card{border:0;border-top:1px solid var(--line);border-radius:0;padding:24px 8px 25px 36px;background:transparent;position:relative}.schedule-card:last-child{border-bottom:1px solid var(--line)}.schedule-card::before{content:'✠';position:absolute;left:4px;color:var(--accent,var(--gold))}.schedule-card h3{margin:0 0 8px}.schedule-card p{margin:0;color:var(--muted)}
.schedule-table-wrap{overflow-x:auto;margin:22px 0 34px;border:1px solid var(--line);border-radius:0;background:rgba(255,255,255,.35)}.schedule-table th,.schedule-table td{padding:17px 18px;border-bottom:1px solid var(--line)}.schedule-table th{background:var(--navy);color:#fff;font:700 11px/1.4 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}.schedule-note{max-width:960px;padding:28px;border:1px solid var(--line);border-left:4px solid var(--green);border-radius:0;background:rgba(52,94,76,.045)}
.central-course-links{display:flex;gap:8px}.central-course-links .button.secondary-link{background:transparent;color:var(--navy);border-color:var(--gold)}
.media-list{display:block;margin-top:28px}.media-card{border:0;border-top:1px solid var(--line);border-radius:0;padding:26px 8px 28px 36px;background:transparent;position:relative}.media-card:last-child{border-bottom:1px solid var(--line)}.media-card::before{content:'✠';position:absolute;left:5px;top:30px;color:var(--accent,var(--gold))}.media-card h2{margin:5px 0 9px}.media-card p{color:var(--muted)}.media-card .button{margin:7px 7px 0 0}
.programme-footer{position:relative;padding:28px 38px 34px;border-top:1px solid var(--gold);background:var(--navy);color:#d9d2c3;text-align:left}.footer-ai{opacity:.42}.footer-waylight{color:var(--gold)}
@media(min-width:1250px){.syllabus{grid-template-columns:none}.course-row{grid-template-columns:minmax(0,1fr) auto}.course-row>div:first-child,.course-row>div:nth-child(2){grid-column:1}.course-row .button{grid-column:2;grid-row:1/3;justify-self:auto;margin-top:0}}
@media(max-width:900px){.hero>*{max-width:100%}.hero::before{opacity:.28;right:-40px}.hero h1{font-size:62px}.cards,.grid{display:block}.course-row{grid-template-columns:1fr}.course-row>div:first-child,.course-row>div:nth-child(2),.course-row .button{grid-column:1;grid-row:auto}.course-row .button{justify-self:start}.central-course-links{justify-content:flex-start}}
@media(max-width:800px){body{padding:0}body::before{top:15px;right:13px}.app{min-height:100vh;border-width:2px;outline:none;grid-template-columns:1fr}.nav{position:sticky;top:0;z-index:15;flex-direction:row;overflow-x:auto;padding:7px 56px 7px 7px;border-right:0;border-bottom:1px solid var(--gold)}.nav::before,.nav::after,.logo{display:none}.nav a{min-width:91px;border:0;border-right:1px solid rgba(255,255,255,.08);padding:11px 4px}.view{padding:34px 23px 54px}.view>h1{font-size:44px}.hero{min-height:75vh;padding:58px 25px 64px}.hero::before{width:170px;height:250px;top:8%;right:-65px}.hero::after{left:25px;right:25px;bottom:28px}.hero h1{font-size:48px}.hero .question{font-size:22px}.method-list{columns:1}.section-heading{align-items:flex-start;flex-direction:column}.course-accordion summary{padding:23px 48px 22px 0}.course-accordion summary::before{left:0}.course-accordion summary>*{margin-left:27px}.course-accordion summary::after{right:4px}.accordion-content{padding:0 0 26px 27px}.course-row{padding:20px 0}.programme-footer{padding:24px 22px;text-align:center}.footer-waylight{position:static;display:block;margin-top:16px}}
'''

if '/* Catholix monastic visual layer */' not in text:
    text = text.replace('</style>', monastic_css + '\n</style>', 1)

required = [
    'That uncertainty is part of the point',
    'deciding where on earth to begin',
    'Most ambitious study plans fail',
    'Serious study does not require an expensive library',
    'What I got wrong',
    'Can an ordinary Catholic build a serious education in the faith?',
    'Did the first four lessons change what I thought faith was?',
    'What happened when I actually tried to learn Latin?',
    'Other Schools will appear here as their Experiments begin.',
    '/* Catholix monastic visual layer */'
]
missing = [item for item in required if item not in text]
if missing:
    raise RuntimeError(f'Missing editorial content: {missing}')

path.write_text(text, encoding='utf-8')