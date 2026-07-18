# PaperMonster Repository Guide

## Purpose

PaperMonster is a zero-dependency static web toy. It must remain runnable by opening `index.html` directly or serving the repository with a basic static server.

## Runtime architecture

- `index.html` owns semantic structure, accessible labels, inline interface SVG, and the output document template.
- `style.css` owns responsive printer artwork, phase/outcome selectors, animations, focus treatment, and reduced-motion overrides.
- `script.js` owns the single game state, shuffled failure deck, print-job cancellation token, DOM rendering, output generation, and Web Audio synthesis.
- Attempt 10 must always select `CORRECT_OUTCOME`; attempts 1–9 select from the shuffled failure deck.

Do not add runtime dependencies, external fonts, analytics, network calls, user tracking, or a build step unless the product requirements genuinely need them.

## Development commands

Run locally:

```sh
python3 -m http.server 8000
```

Primary verification command:

```sh
node scripts/verify.mjs
```

## Change rules

- Preserve native buttons, live status announcements, keyboard focus visibility, responsive behavior, and `prefers-reduced-motion` support.
- Keep outcome-specific motion in CSS and state/timing in JavaScript.
- Keep reset capable of cancelling an active print sequence.
- Do not weaken the Content Security Policy without documenting the concrete requirement.
- Do not create or modify GitHub Actions without explicit user approval.
- Never commit environment files, credentials, signing material, generated output, or editor state.

## Release gate

Before committing a release candidate, run `node scripts/verify.mjs`, inspect the staged file list by name, and document any browser-only checks that remain manual. The deployable static artifact is `index.html`, `style.css`, `script.js`, and `favicon.svg`.
