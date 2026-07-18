# PaperMonster

> Feed it a memo. Hope it behaves.

PaperMonster is an interactive cartoon printer that eats, mangles, misprints, throws, and occasionally apologizes for documents instead of printing them correctly. Attempts 1–9 select distinct failures from a shuffled outcome deck; attempt 10 always prints the document correctly and celebrates.

**Version:** 1.0.0<br>
**Status:** Production-ready; repository remains private pending launch approval<br>
**Runtime:** Zero dependencies, zero build step

## Contents

- [Features](#features)
- [How the game works](#how-the-game-works)
- [Printer outcomes](#printer-outcomes)
- [Technology](#technology)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Verification](#verification)
- [Accessibility](#accessibility)
- [Security and privacy](#security-and-privacy)
- [Production deployment](#production-deployment)
- [Browser support and limitations](#browser-support-and-limitations)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

## Features

- Cartoon printer, paper tray, document preview, control panel, print button, and live status screen
- Animated paper feeding, output, rubber rollers, status lights, printer shaking, jams, retraction, and confetti
- Ten distinct failure outcomes selected without immediate repetition during a run
- Guaranteed correct document on attempt 10
- Generated motor, click, paper, error, chewing, and success sounds using the Web Audio API
- Sound toggle that remains unchanged when the game is reset
- Attempt counter, progress meter, and reverse-chronological incident log
- Interrupt-safe reset that cancels an active print sequence
- Responsive desktop, tablet, and mobile layouts
- Keyboard-accessible native controls and visible focus treatment
- CSS and JavaScript support for `prefers-reduced-motion`
- Restrictive Content Security Policy and no runtime network requests

## How the game works

1. Press **Print document**.
2. PaperMonster accepts—or rejects—the queued document.
3. The status screen reports each stage while the printer lights, rollers, and paper path animate.
4. One failure is recorded in the incident log.
5. Repeat until attempt 10, when the original document is printed correctly and the printer celebrates.

The **Sound** control enables or disables locally generated printer noises. **Reset** clears attempts, history, transient output, active timers, and the shuffled outcome deck without reloading the page.

## Printer outcomes

Before the guaranteed successful tenth attempt, PaperMonster chooses from:

- Eating the document
- Printing a blank page
- Printing upside down
- Printing a tiny version
- Requesting paper despite a visibly full tray
- Printing a handwritten apology
- Printing one word
- Creating a paper jam
- Throwing the paper across the screen
- Pulling the output back inside

## Technology

| Area | Implementation |
| --- | --- |
| Structure | Semantic HTML5 |
| Styling and artwork | CSS, CSS custom properties, and inline SVG |
| Behavior | Vanilla JavaScript |
| Sound | Web Audio API synthesis |
| State | Single in-memory state object with explicit phase transitions |
| Verification | Dependency-free Node.js script using built-in modules |
| Runtime dependencies | None |
| Build system | None |

No framework, package manager, external font, image service, analytics SDK, database, server function, environment variable, or binary audio asset is required.

## Architecture

PaperMonster intentionally separates behavior from presentation:

- [`index.html`](index.html) defines the semantic interface, accessible labels, inline SVG artwork, and reusable output-document template.
- [`script.js`](script.js) owns game state, the shuffled failure deck, the guaranteed tenth attempt, cancellation tokens, DOM rendering, generated output, and audio synthesis.
- [`style.css`](style.css) reads the printer's `data-phase` and `data-outcome` attributes to animate lights, rollers, paper, jams, errors, and success without frame-by-frame JavaScript.
- `jobGeneration` invalidates stale asynchronous work, allowing Reset to stop a print job safely even if audio initialization is still pending.
- Unsupported or blocked Web Audio degrades safely: the game remains playable and sound is disabled.

All game state is held in memory. Resetting or reloading starts a fresh ten-attempt run.

## Project structure

```text
PaperMonster/
├── index.html             # Semantic interface and document template
├── style.css              # Responsive artwork and animation system
├── script.js              # State, outcomes, timing, DOM, and audio
├── favicon.svg            # Standalone printer favicon
├── scripts/
│   └── verify.mjs         # Offline production-readiness checks
├── AGENTS.md              # Repository-specific development guidance
├── CHANGELOG.md           # User-facing release history
├── README.md              # Project documentation
└── .gitignore             # Local, generated, and sensitive exclusions
```

## Getting started

### Requirements

- A current desktop or mobile web browser
- Optional: Python 3 or another static server for local HTTP serving
- Optional: Node.js 18 or newer to run the verification gate

### Clone

The repository is currently private, so cloning requires access to the author's GitHub account or an approved collaborator account.

```sh
git clone https://github.com/SUDARSHANCHAUDHARI/PaperMonster.git
cd PaperMonster
```

### Run directly

Open `index.html` in a browser. No installation or build is required.

### Run with a local static server

```sh
python3 -m http.server 8000
```

Visit [http://localhost:8000](http://localhost:8000).

## Verification

Run the complete offline release gate from the repository root:

```sh
node scripts/verify.mjs
```

The verifier checks:

- Runtime files exist and are non-empty
- JavaScript parses successfully
- HTML IDs are unique
- JavaScript DOM selectors resolve to real elements
- All ten failure modes are present
- Attempt 10 deterministically selects the correct outcome
- Every paper-producing outcome has corresponding CSS
- Native controls, live regions, progress semantics, and reduced-motion hooks exist
- Core interface color pairs meet WCAG AA contrast
- Content Security Policy and offline-runtime constraints remain intact
- Generated audio and SVG artwork are available
- Common credential formats are absent from runtime source

The release gate uses only Node.js built-in modules and installs nothing.

Continuous integration is intentionally not configured. Repository policy requires explicit approval before GitHub Actions are created or expanded; until then, `node scripts/verify.mjs` is the primary quality gate.

## Accessibility

- Native `<button>` and `<progress>` elements provide predictable keyboard and assistive-technology behavior.
- A skip link moves keyboard users directly to the primary printer control.
- The printer status screen uses a polite live region for progress and outcome announcements.
- The incident log announces new entries without requiring focus changes.
- Focus indicators use a high-contrast teal outline.
- Core text and control color pairs meet WCAG AA contrast.
- `prefers-reduced-motion` removes ambient animation and shortens JavaScript-controlled print timing.
- Full game behavior remains available when sound is disabled or unavailable.

## Security and privacy

PaperMonster:

- Collects, stores, and transmits no personal data
- Makes no runtime network requests
- Uses no cookies, local storage, analytics, forms, authentication, or tracking
- Contains no client or server secrets
- Uses no third-party runtime dependencies
- Uses a restrictive Content Security Policy that blocks external scripts, connections, plugins, and form submissions
- Synthesizes sound locally after an explicit user interaction

The `.gitignore` excludes environment files, local configuration, signing material, dependency directories, build output, caches, logs, coverage, editor state, and operating-system files.

## Production deployment

PaperMonster is a static site. The complete deployable artifact is:

- `index.html`
- `style.css`
- `script.js`
- `favicon.svg`

Upload those four files to the root of any HTTPS static host. No install command, build command, environment variable, server runtime, database, or migration is required.

### Release checklist

1. Run `node scripts/verify.mjs`.
2. Review the staged file list by name.
3. Test Print, Sound, and Reset with keyboard-only navigation in a real browser.
4. Confirm generated sound behavior because browser audio policies vary.
5. Verify the tenth attempt prints correctly and celebrates.
6. Deploy the four runtime files from a reviewed commit.

### Rollback

Redeploy the four runtime files from the previous known-good commit. PaperMonster has no persistent data, backend, migration, or server cache to roll back.

## Browser support and limitations

PaperMonster targets current versions of Chrome, Edge, Firefox, and Safari on desktop and mobile.

- Browsers require user interaction before Web Audio can start; the first Print or Sound action initializes audio.
- Unsupported or blocked Web Audio does not block printing behavior.
- Game progress is intentionally session-only and resets on reload.
- Visual and audio judgment still requires a manual real-browser review; automated browser capture is not part of the release process.

## Contributing

The repository is currently private. Approved contributors should:

1. Create a focused branch.
2. Preserve the zero-dependency runtime and accessibility behavior.
3. Run `node scripts/verify.mjs` before requesting review.
4. Document user-facing changes in [`CHANGELOG.md`](CHANGELOG.md).

Do not add or modify GitHub Actions without explicit repository-owner approval.

## Author

**Sudarshan Chaudhari**<br>
Independent developer at **SudarshanTechLabs**

| Detail | Information |
| --- | --- |
| GitHub | [@SUDARSHANCHAUDHARI](https://github.com/SUDARSHANCHAUDHARI) |
| Location | Bangkok, Thailand |
| Developer email | [sunny.sudarshan@gmail.com](mailto:sunny.sudarshan@gmail.com) |
| Business and legal email | [sudarshantechlabs@gmail.com](mailto:sudarshantechlabs@gmail.com) |

PaperMonster was designed and developed as a standalone SudarshanTechLabs web project.

## License

No open-source license has been assigned to PaperMonster. The repository is private, and the code may not be copied, redistributed, sublicensed, or used commercially without written permission from the author.

Copyright © 2026 Sudarshan Chaudhari / SudarshanTechLabs. All rights reserved.
