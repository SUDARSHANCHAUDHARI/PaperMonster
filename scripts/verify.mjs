import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourceFiles = ["index.html", "style.css", "script.js", "favicon.svg"];

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function check(name, callback) {
  try {
    callback();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

function cssColor(token) {
  const match = css.match(new RegExp(`--${token}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `Missing CSS color token --${token}`);
  return match[1];
}

function relativeLuminance(hexColor) {
  const channels = hexColor
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

const html = read("index.html");
const css = read("style.css");
const javascript = read("script.js");
const favicon = read("favicon.svg");

check("runtime files exist and are non-empty", () => {
  for (const file of sourceFiles) {
    assert.ok(statSync(resolve(root, file)).size > 0, `${file} is empty`);
  }
});

check("JavaScript parses", () => {
  const result = spawnSync(process.execPath, ["--check", resolve(root, "script.js")], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

check("HTML IDs are unique", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual([...new Set(duplicates)], []);
});

check("JavaScript DOM selectors resolve", () => {
  const selectors = [...javascript.matchAll(/querySelector\("#([^"]+)"\)/g)].map(
    (match) => match[1],
  );
  const missing = selectors.filter((id) => !html.includes(`id="${id}"`));
  assert.deepEqual(missing, []);
});

check("all failure modes and tenth-attempt success are present", () => {
  const expectedFailures = [
    "eat",
    "blank",
    "upside",
    "tiny",
    "paper",
    "apology",
    "word",
    "jam",
    "throw",
    "pullback",
  ];
  const failureIds = [
    ...javascript.matchAll(
      /id: "(eat|blank|upside|tiny|paper|apology|word|jam|throw|pullback)"/g,
    ),
  ].map((match) => match[1]);

  assert.deepEqual(failureIds, expectedFailures);
  assert.match(javascript, /if \(nextAttempt >= 10\) return CORRECT_OUTCOME/);
  assert.match(javascript, /completed: successful/);
});

check("every paper-producing failure has outcome styling", () => {
  const styledOutputs = ["blank", "upside", "tiny", "apology", "word", "throw", "pullback"];
  for (const outcome of styledOutputs) {
    assert.ok(css.includes(`outcome-${outcome}`), `Missing CSS for ${outcome}`);
  }
});

check("accessibility and reduced-motion contracts are present", () => {
  const requiredHtml = [
    '<a class="skip-link"',
    '<button class="print-button"',
    'id="sound-toggle"',
    'aria-pressed="true"',
    'role="status"',
    'aria-live="polite"',
    '<progress id="attempt-progress"',
  ];
  for (const fragment of requiredHtml) {
    assert.ok(html.includes(fragment), `Missing ${fragment}`);
  }
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(javascript, /prefers-reduced-motion: reduce/);
});

check("core interface color pairs meet WCAG AA contrast", () => {
  const textPairs = [
    ["ink", "paper"],
    ["ink", "orange"],
    ["screen-ink", "screen"],
    ["paper", "teal-dark"],
    ["ink", "green"],
  ];
  for (const [foreground, background] of textPairs) {
    const ratio = contrastRatio(cssColor(foreground), cssColor(background));
    assert.ok(ratio >= 4.5, `${foreground} on ${background} is only ${ratio.toFixed(2)}:1`);
  }
});

check("shared TinyChaos UI family contracts are present", () => {
  const sharedPalette = ["#15152a", "#fff5df", "#ff5d5d", "#4f7cff", "#ffd166", "#58d6a9", "#b695ff"];
  sharedPalette.forEach((color) => assert.match(css, new RegExp(color, "i")));

  assert.match(html, /href="https:\/\/sudarshanchaudhari\.github\.io\/TinyChaos\/"/);
  assert.match(html, /PaperMonster · by Sudarshan Chaudhari/);
  assert.match(css, /outline:\s*4px solid var\(--blue\)/);
  assert.match(css, /\.print-button:focus-visible,[\s\S]*?\.utility-button:focus-visible\s*\{[^}]*var\(--paper\)[^}]*var\(--ink\)/);
  assert.match(css, /--display:\s*Impact/);
  assert.match(css, /--body:\s*"Arial Rounded MT Bold"/);
  assert.match(css, /h1 span\s*\{[^}]*color:\s*var\(--coral-text\)/s);
  assert.match(css, /\.document-preview li::marker\s*\{[^}]*color:\s*var\(--coral-text\)/s);
  assert.match(css, /overflow-x:\s*clip/);
  assert.ok(contrastRatio(cssColor("blue"), cssColor("paper")) >= 3, "blue focus must contrast with paper");
  assert.ok(contrastRatio(cssColor("blue"), cssColor("ink")) >= 3, "blue focus must contrast with ink");
  assert.ok(contrastRatio(cssColor("coral-text"), cssColor("paper")) >= 4.5, "coral text must meet WCAG AA");

  for (const rule of css.matchAll(/(?:^|\n)(?:html|body)\s*\{([^}]*)\}/g)) {
    assert.doesNotMatch(rule[1], /min-width:\s*(?:280|320)px/);
  }
});

check("security policy and offline runtime constraints are present", () => {
  assert.match(html, /http-equiv="Content-Security-Policy"/);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(javascript, /\b(?:eval|Function)\s*\(/);
  assert.doesNotMatch(javascript, /\.innerHTML\s*=/);
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:\/\//);
});

check("generated audio and SVG artwork are available", () => {
  assert.match(javascript, /class PrinterAudio/);
  assert.match(javascript, /AudioContext/);
  assert.match(html, /<svg/);
  assert.match(favicon, /<svg/);
});

check("source files do not contain common credential formats", () => {
  const source = [html, css, javascript, favicon].join("\n");
  const secretPatterns = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
    /\bAIza[0-9A-Za-z_-]{20,}\b/,
  ];
  for (const pattern of secretPatterns) {
    assert.doesNotMatch(source, pattern);
  }
});

console.log("\nPaperMonster verification passed.");
