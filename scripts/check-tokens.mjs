#!/usr/bin/env node
/**
 * Flags styling that bypasses the design tokens (see app/globals.css and
 * /ui-kit): hex values in classes (text-[#0F172B]), Tailwind palette classes
 * (bg-blue-600), arbitrary font sizes (text-[11px]) and one-off shadows / radii
 * (shadow-[...], rounded-[...]). Use token classes instead (text-foreground,
 * bg-primary, text-2xs, shadow-sm, rounded-lg, ...).
 *
 * A file that legitimately needs raw colours (e.g. categorical chart series)
 * opts out with a comment in its first 5 lines: `tokens-allow-file: <reason>`.
 *
 *   npm run lint:tokens              report every file, summary at the end
 *   npm run lint:tokens -- <paths>   check only these files / folders
 *   npm run lint:tokens -- --strict  exit 1 when anything is found (for CI
 *                                    once the migration is done)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["app", "components", "ui", "layout"];
const EXTENSIONS = /\.(tsx|ts|jsx|js)$/;
const SKIP = new Set(["node_modules", ".next"]);

const PATTERNS = [
  { name: "hex", regex: /\[#[0-9a-fA-F]{3,8}\]/g },
  {
    name: "palette",
    regex:
      /\b(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
  },
  { name: "font-size", regex: /\btext-\[\d+(?:\.\d+)?(?:px|rem)\]/g },
  { name: "shadow", regex: /\bshadow-\[[^\]\s]+\]/g },
  // `rounded-[inherit]` passes the parent's radius on; it is not a value
  { name: "radius", regex: /\brounded(?:-[a-z]{1,2})?-\[(?!inherit\])[^\]\s]+\]/g },
];

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const targets = args.filter((arg) => !arg.startsWith("--"));

function collect(path, files) {
  const stats = statSync(path);
  if (stats.isDirectory()) {
    for (const entry of readdirSync(path)) {
      if (!SKIP.has(entry)) collect(join(path, entry), files);
    }
  } else if (EXTENSIONS.test(path)) {
    files.push(path);
  }
  return files;
}

const files = (targets.length ? targets : ROOTS).flatMap((root) => {
  try {
    return collect(root, []);
  } catch {
    return [];
  }
});

let total = 0;
const perFile = [];
for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  // Files that legitimately need raw colours (categorical chart series) opt out
  if (lines.slice(0, 5).some((line) => line.includes("tokens-allow-file:"))) {
    continue;
  }
  const hits = [];
  lines.forEach((line, index) => {
    for (const { name, regex } of PATTERNS) {
      for (const match of line.matchAll(regex)) {
        hits.push(`  ${index + 1}: ${match[0]} (${name})`);
      }
    }
  });
  if (hits.length) {
    total += hits.length;
    perFile.push({ file: relative(process.cwd(), file), hits });
  }
}

perFile
  .sort((a, b) => b.hits.length - a.hits.length)
  .forEach(({ file, hits }) => {
    console.log(`${file} — ${hits.length}`);
    if (targets.length) hits.forEach((hit) => console.log(hit));
  });

console.log(
  `\n${total} hardcoded value(s) in ${perFile.length} of ${files.length} file(s).` +
    (total ? " Replace them with token classes from /ui-kit." : ""),
);

if (strict && total > 0) process.exit(1);
