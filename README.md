# PaperMonster

PaperMonster is a standalone cartoon printer that eats, mangles, and misprints a document for nine attempts. On the tenth attempt, it finally prints the document correctly and celebrates.

The project uses only HTML, CSS, inline SVG, and vanilla JavaScript. It has no package manager, build step, external fonts, images, or audio files.

## Run locally

Open `index.html` directly in a modern browser, or serve the directory with any static file server:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Verify

Run the complete offline quality gate from the repository root:

```sh
node scripts/verify.mjs
```

The verifier checks JavaScript syntax, required files, unique DOM IDs, JavaScript-to-DOM selector contracts, all ten failure modes, deterministic success on attempt ten, accessibility hooks, reduced-motion handling, generated audio, the Content Security Policy, and common secret patterns.

## Printer outcomes

Before the guaranteed successful tenth attempt, PaperMonster randomly chooses from these failures:

- Eats the document
- Prints a blank page
- Prints upside down
- Prints a tiny version
- Requests paper despite a visibly full tray
- Prints a handwritten apology
- Prints one word
- Creates a paper jam
- Throws the paper across the screen
- Pulls the output back inside

## Features

- Animated paper feed, rollers, printer shake, status lights, output, jams, and celebration confetti
- Generated motor, error, click, paper, and success sounds using the Web Audio API
- Sound toggle and reset controls
- A visible attempt counter, progress meter, and incident log
- Explicit state transitions that prevent overlapping print jobs
- Semantic controls, keyboard focus styles, live status announcements, and high-contrast labels
- Responsive layouts for desktop, tablet, and mobile
- `prefers-reduced-motion` support in both CSS and JavaScript timing

## Files

- `index.html` — semantic interface, inline SVG, and document template
- `style.css` — responsive printer artwork and animation system
- `script.js` — state, outcomes, timing, generated audio, and controls
- `favicon.svg` — standalone printer favicon
- `scripts/verify.mjs` — dependency-free production-readiness checks
- `AGENTS.md` — repository-specific implementation and verification guidance
- `CHANGELOG.md` — user-facing release history
- `.gitignore` — local, generated, secret, and signing-material exclusions

## Production deployment

PaperMonster is a static site. Its deployable artifact is:

- `index.html`
- `style.css`
- `script.js`
- `favicon.svg`

Upload those four files to the root of any static host. No environment variables, server functions, database, build command, or install command are required. Configure the host to serve `index.html` at the root and use HTTPS in production.

Before deploying:

1. Run `node scripts/verify.mjs`.
2. Review the game once with keyboard-only navigation.
3. Confirm sound on/off behavior in a real browser because browser audio policies vary.
4. Deploy from a reviewed commit.

Rollback is a static-file replacement: redeploy the four runtime files from the previous known-good commit. No data migration or cache invalidation is required.

Continuous integration is intentionally not configured. Repository policy requires explicit approval before adding or expanding GitHub Actions; until then, the verification command is the release gate.

## Security and privacy

The app collects, stores, and transmits no user data. It makes no network requests and uses a restrictive Content Security Policy. Printer sounds are synthesized locally after user interaction. There are no runtime dependencies, tokens, cookies, forms, or analytics.

## Notes

Browser audio policies require a user interaction before generated sounds can start. The first Print or Sound button press initializes the audio engine. No data is stored or transmitted; resetting or reloading starts a new ten-attempt run.
