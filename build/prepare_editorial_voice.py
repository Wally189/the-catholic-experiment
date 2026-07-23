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

required = [
    'That uncertainty is part of the point',
    'deciding where on earth to begin',
    'Most ambitious study plans fail',
    'Serious study does not require an expensive library',
    'What I got wrong',
    'Can an ordinary Catholic build a serious education in the faith?',
    'Did the first four lessons change what I thought faith was?',
    'What happened when I actually tried to learn Latin?',
    'Other Schools will appear here as their Experiments begin.'
]
missing = [item for item in required if item not in text]
if missing:
    raise RuntimeError(f'Missing editorial content: {missing}')

path.write_text(text, encoding='utf-8')
