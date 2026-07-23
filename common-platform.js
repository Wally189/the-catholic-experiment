(() => {
  const pathname = location.pathname.toLowerCase();
  const title = document.title.toLowerCase();
  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isCentral = pathname.includes('/the-catholic-experiment') || title === 'the catholic experiment';
  const isFaith = pathname.includes('/the-faith-experiment') || title.includes('faith experiment');
  const config = isCentral
    ? {name:'The Catholic Experiment', school:'Head Room', courseKey:'courses', courseLabel:'Courses', courseHref:'index.html#courses'}
    : isFaith
      ? {name:'The Faith Experiment', school:'Faith', courseKey:'course', courseLabel:'Course', courseHref:'course.html'}
      : {name:'The Latin Experiment', school:'Sacred Languages', courseKey:'course', courseLabel:'Course', courseHref:'course.html'};
  const centralHome = 'https://wally189.github.io/The-Catholic-Experiment/';
  const formEndpoint = 'https://formspree.io/f/mgvgrgvb';
  const items = [
    ['home','⌂','Home','index.html#home'],
    [config.courseKey,'▤',config.courseLabel,config.courseHref],
    ['schedule','◫','Schedule','index.html#schedule'],
    ['materials','▣','Materials',isFaith ? 'materials.html' : 'index.html#materials'],
    ['certificates','✦','Certificates','index.html#certificates'],
    ['contact','✉','Contact','index.html#contact']
  ];

  function activeKey() {
    const hash = location.hash.slice(1);
    if (isCentral) return items.some(([key]) => key === hash) ? hash : 'home';
    if (isFaith) {
      if (file === 'materials.html' || file === 'glossary.html') return 'materials';
      if (file === 'course.html' || file === 'journal.html' || /^lesson-\d+\.html$/.test(file)) return 'course';
      if (file === 'about.html') return 'home';
    } else {
      if (['course.html','why-latin.html','experiment.html','course-source.html'].includes(file)) return 'course';
      if (['vocabulary.html','pronunciation.html','terminology.html'].includes(file)) return 'materials';
    }
    return items.some(([key]) => key === hash) ? hash : 'home';
  }

  function navLinks() {
    return items.map(([key,icon,label,href]) => `<a href="${href}" data-platform-nav="${key}">${icon}<br>${label}</a>`).join('');
  }

  function canonicaliseNav(nav) {
    nav.classList.add('platform-nav');
    nav.setAttribute('aria-label','Primary navigation');
    nav.innerHTML = `<div class="brand platform-brand"><span class="brand-mark logo side-logo platform-logo" aria-hidden="true">✠</span></div><div class="nav-links platform-nav-links">${navLinks()}</div>`;
  }

  function updateActive() {
    const active = activeKey();
    document.querySelectorAll('[data-platform-nav]').forEach(link => {
      const selected = link.dataset.platformNav === active;
      link.classList.toggle('on', selected);
      if (selected) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
  }

  function contactMarkup() {
    return `<div class="platform-contact-layout"><aside class="platform-contact-note"><h2>A listening project</h2><p>Questions, corrections, broken links, accessibility reports and thoughtful source suggestions are welcome.</p></aside><form class="platform-contact-form" action="${formEndpoint}" method="POST" accept-charset="UTF-8"><input type="hidden" name="_subject" value="Message from ${config.name}"><input type="hidden" name="site" value="${config.name}"><label>Name<input name="name" autocomplete="name" required></label><label>Email<input type="email" name="email" autocomplete="email" required></label><label>Category<select name="category" required><option value="">Choose a category</option><option>Correction</option><option>Question</option><option>Broken link</option><option>Accessibility</option><option>Suggested source</option><option>Other</option></select></label><label>Subject<input name="subject" required></label><label>Message<textarea name="message" required></textarea></label><button class="platform-submit" type="submit">Send message →</button></form></div>`;
  }

  function ensureContactForm() {
    const contact = document.querySelector('[data-v="contact"], #contact[data-section], section#contact');
    if (!contact || contact.dataset.platformContact === 'true') return;
    const existingForm = contact.querySelector('form');
    const existingContainer = existingForm?.closest('.plan,.card,.platform-contact-layout');
    const mailLink = contact.querySelector('a[href^="mailto:"]');
    if (existingContainer) existingContainer.outerHTML = contactMarkup();
    else if (existingForm) existingForm.outerHTML = contactMarkup();
    else if (mailLink) mailLink.closest('p')?.insertAdjacentHTML('afterend', contactMarkup());
    else contact.insertAdjacentHTML('beforeend', contactMarkup());
    mailLink?.closest('p')?.remove();
    contact.dataset.platformContact = 'true';
  }

  function footerMarkup() {
    return `<div class="footer-project"><strong>${config.name}</strong><span>${config.name} is an independent learning project. It does not imply ecclesiastical approval.</span><span><a href="${centralHome}">Part of The Catholic Experiment</a></span><span>School: ${config.school}</span></div><div class="footer-ai">This website has been built with the assistance of AI tools. Where appropriate, content has been checked against Magnifica Humanae and relevant authoritative Catholic sources.</div><a class="footer-waylight" href="https://www.waylight-atlantic.co.uk/" target="_blank" rel="noopener">Waylight Atlantic →</a>`;
  }

  function ensureFooter() {
    const outer = document.querySelector('body > .app, .frame');
    if (!outer) return;
    let footer = document.querySelector('footer.programme-footer, footer.footer');
    if (!footer) {
      footer = document.createElement('footer');
      const target = outer.querySelector(':scope > .page-shell') || outer.querySelector(':scope > main.main, :scope > main#main-content') || outer;
      target.append(footer);
    }
    footer.className = 'programme-footer';
    footer.innerHTML = footerMarkup();
    footer.dataset.platformNormalised = 'true';
  }

  function stabiliseLatinCourse() {
    if (isCentral || isFaith || file !== 'course.html') return;
    const style = document.createElement('style');
    style.dataset.platformCourseFix = 'true';
    style.textContent = '@media(min-width:901px){.frame{grid-template-rows:auto auto minmax(0,1fr) auto!important}.frame>.mobile-catalogue{grid-row:1!important}.frame>.mobile-list{grid-row:2!important}.frame>.app{grid-row:3!important}.frame>.programme-footer{grid-row:4!important}}';
    document.head.append(style);
    document.addEventListener('click', event => {
      const lesson = event.target.closest('.lesson-link.published');
      if (!lesson) return;
      const number = Number(lesson.dataset.number);
      if (!Number.isInteger(number) || number < 1) return;
      setTimeout(() => {
        const displayed = Number(document.getElementById('lessonPage')?.dataset.currentLesson);
        if (displayed !== number) location.assign(`course.html?lesson=${number}`);
      }, 0);
    }, true);
  }

  document.querySelectorAll('body > .app > .nav, body > .app > .side-nav, .frame > .global-nav, .frame > .nav').forEach(canonicaliseNav);
  ensureContactForm();
  stabiliseLatinCourse();
  ensureFooter();
  updateActive();
  addEventListener('hashchange', () => setTimeout(updateActive, 0));
  addEventListener('popstate', () => setTimeout(updateActive, 0));
})();
