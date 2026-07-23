# The Catholic Experiment — Common Platform

This directory is the controlled source for programme-wide website standards. The common platform governs shared structure and behaviour; each Experiment retains its own subject matter, sources, course sequence and learner work.

## Approved primary navigation

### Central Catholic Experiment
Home / Courses / Schedule / Materials / Certificates / Contact

### Individual Experiments
Home / Course / Schedule / Materials / Certificates / Contact

The labels, functions and order are fixed. Experiment-specific items such as Journal, Grammar, Progress, Vocabulary, Pronunciation and Videos belong within a primary page or secondary course navigation.

## Fixed app-shell standard

Every maintained public route must use:

- the approved black-bordered frame;
- a continuous 105-pixel black desktop rail;
- a 55-pixel gold cross badge;
- the six-item primary menu in the approved order;
- consistent content starting position and active-item treatment;
- the same six functions in a horizontal, scrollable black navigation on mobile;
- visible keyboard focus, semantic current-page state and reduced-motion support.

A landing page alone is not sufficient. Course, lesson, schedule, materials, certificates, contact, journal, terminology, glossary, vocabulary, pronunciation, about and other supporting routes must be checked individually.

## Common footer and contact standard

Each Experiment must provide:

- an independent-learning-project and non-ecclesiastical-approval statement;
- a route back to The Catholic Experiment and its relevant School context;
- the approved AI disclosure referring to Magnifica Humanae and relevant authoritative Catholic sources;
- a Waylight Atlantic credit that occupies its own layout column and never overlays disclosure text;
- a corrections/contact route with the categories Correction, Question, Broken link, Accessibility, Suggested source and Other.

## Reference and control rule

The Latin Experiment is the proven reference implementation for the shared app-shell geometry and course-companion behaviour. Shared geometry, navigation, footer and accessibility behaviour may be carried to another Experiment; Latin subject content, Father Most material, Alan's journal and course-specific exercises may not.

The central Catholic Experiment remains the programme-control repository. A narrow common-platform correction must not replace a complete subject page unless the whole file has first been compared and all approved subject-specific content preserved.

## Current repository family

- Central: `Wally189/The-Catholic-Experiment`
- Latin: `Wally189/the-latin-experiment`
- Faith: `Wally189/The-Faith-Experiment`

All use the `main` branch and static or low-complexity HTML, CSS and JavaScript. The central repository controls the standard; each Experiment repository holds the locally recoverable production assets required for its own deployment.

## Change sequence

1. Read the controlling standards and the current route-specific source before editing.
2. Compare the proposed change with the Latin reference implementation and the other live Experiments.
3. Make the smallest complete common-platform correction without importing subject content between sites.
4. Apply or update the local shared shell files in the affected repository.
5. Test every maintained route on desktop, mobile and keyboard navigation.
6. Validate the footer, contact categories, disclosures, active states and central-programme route.
7. Deploy from `main`, verify the live Pages build and record the result.

## Minimum recovery procedure

1. Sign in to the GitHub account controlling `Wally189`.
2. Clone or download the relevant repository from the `main` branch.
3. Confirm `index.html`, all maintained public routes and local shared assets are present.
4. Reconnect GitHub Pages to the repository and deploy the repository root through the controlled workflow.
5. Test every primary navigation item, lesson link, contact route, footer link and external source link.
6. Record the restored URL, provider, date and tester in the Common Platform Implementation Appendix.

## Current Latin corrective audit

The route-by-route audit completed on 23 July 2026 is recorded in `Wally189/the-latin-experiment/COMMONALITY-AUDIT.md`. It localised the course CSS, introduced the shared Latin shell and footer controls, retired obsolete prototype routes and added deployment validation to prevent renewed drift.
