#!/usr/bin/env node
/**
 * Rewrites hardcoded colour and font-size classes to design tokens, using the mapping agreed
 * for the design system (see /ui-kit). Colours with no token (one-off purples,
 * chart colours, ...) are left alone and listed so they can be handled by hand.
 *
 *   node scripts/migrate-colors.mjs <file> [<file> ...]
 *   node scripts/migrate-colors.mjs --dry <file> ...   show changes, write nothing
 */
import { readFileSync, writeFileSync } from "node:fs";

// Colour -> token. `text` overrides the token when used as a text colour.
const COLORS = {
  primary: ["#2354bf", "#2563eb", "#4978ce", "#3b82f6", "blue-400", "blue-500", "blue-600", "sky-400", "sky-500", "sky-600"],
  "primary-hover": ["#1d4ed8", "#1d4699", "#1e40af", "blue-700", "blue-800", "blue-900"],
  "primary-subtle": ["#eff6ff", "#dbeafe", "blue-50", "blue-100", "sky-50", "sky-100"],
  "primary/30": ["blue-200", "blue-300", "sky-200", "sky-300"],
  foreground: ["#0f172b", "#0f172a", "#1f2937", "#1e293b", "#111827", "#1c1c1c", "gray-900", "gray-800", "slate-900", "slate-800"],
  "foreground-secondary": ["#374151", "#475569", "#334155", "gray-700", "gray-600", "slate-700", "slate-600"],
  "muted-foreground": ["#6b7280", "#64748b", "gray-500", "slate-500"],
  "foreground-subtle": ["#9ca3af", "#94a3b8", "#90a1b9", "#9e9e9e", "gray-400", "slate-400"],
  "border-strong": { values: ["#d1d5db", "#cad5e2", "#cbd5e1", "gray-300", "slate-300"], text: "foreground-subtle" },
  border: { values: ["#e5e7eb", "#e2e8f0", "#e5ecf8", "gray-200", "slate-200"], text: "foreground-subtle" },
  muted: ["#f3f4f6", "#f1f5f9", "#f2f2f2", "gray-100", "slate-100"],
  "surface-muted": ["#f9fafb", "#f8fafc", "gray-50", "slate-50"],
  success: ["#10b981", "#059669", "#28a745", "#16a34a", "green-400", "green-500", "green-600", "green-700", "green-800", "green-900", "emerald-400", "emerald-500", "emerald-600", "emerald-700", "emerald-800", "emerald-900"],
  "success-subtle": ["#ecfdf5", "#f0fdf4", "green-50", "green-100", "emerald-50", "emerald-100"],
  "success/30": ["green-200", "green-300", "emerald-200", "emerald-300"],
  warning: ["#f59e0b", "#d97706", "amber-400", "amber-500", "amber-600", "amber-700", "amber-800", "amber-900", "yellow-400", "yellow-500", "yellow-600", "yellow-700", "yellow-800", "orange-400", "orange-500", "orange-600", "orange-700", "orange-800"],
  "warning-subtle": ["#fffbeb", "amber-50", "amber-100", "yellow-50", "yellow-100", "orange-50", "orange-100"],
  "warning/30": ["amber-200", "amber-300", "yellow-200", "yellow-300", "orange-200"],
  destructive: ["#dc2626", "#ff5959", "#ef4444", "#b91c1c", "red-400", "red-500", "red-600", "red-700", "red-800", "red-900"],
  "destructive-subtle": ["#fef2f2", "#fee2e2", "red-50", "red-100"],
  "destructive/30": ["red-200", "red-300"],
};

const lookup = new Map();
for (const [token, spec] of Object.entries(COLORS)) {
  const values = Array.isArray(spec) ? spec : spec.values;
  const text = Array.isArray(spec) ? undefined : spec.text;
  for (const value of values) lookup.set(value.toLowerCase(), { token, text });
}

const PREFIX =
  "(bg|text|border(?:-[trblxy])?|ring|ring-offset|divide|fill|stroke|outline|placeholder|from|via|to|accent|caret|decoration)";
const PALETTE =
  "(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}";
const CLASS = new RegExp(`\\b${PREFIX}-(\\[#[0-9a-fA-F]{6}\\]|${PALETTE})(\\/\\d+)?(?![\\w-])`, "g");

// Arbitrary font sizes -> nearest step of the type scale (11px for dense tables)
const FONT_SIZES = {
  "9px": "text-2xs",
  "10px": "text-2xs",
  "11px": "text-2xs",
  "12px": "text-xs",
  "13px": "text-sm",
  "14px": "text-sm",
  "15px": "text-base",
  "16px": "text-base",
  "18px": "text-lg",
  "20px": "text-xl",
  "24px": "text-2xl",
  "30px": "text-3xl",
};
const FONT_SIZE = /\btext-\[(\d+px)\](?![\w-])/g;

// Radii above the scale (it stops at xl = 12px) -> xl
const BIG_RADIUS = /\b(rounded(?:-[a-z]{1,2})?)-(?:2xl|3xl|4xl)\b/g;

// White / black. Surfaces become background, overlays scrim; text-white takes
// the on-fill colour of the fill on the same line (bg-success -> success-foreground).
const BW = /\b(bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|from|to|via|fill|stroke|divide|outline|placeholder|accent|caret|decoration)-(white|black)(?![\w-])/g;
const FILLS = [
  ["success", "text-success-foreground"],
  ["destructive", "text-destructive-foreground"],
  ["warning", "text-warning-foreground"],
];

function blackWhite(line) {
  return line.replace(BW, (_match, prefix, color) => {
    if (color === "black") {
      if (prefix === "text") return "text-foreground";
      if (prefix === "bg" || prefix === "from" || prefix === "to" || prefix === "via") return `${prefix}-scrim`;
      return `${prefix}-foreground`;
    }
    if (prefix === "text") {
      const fill = FILLS.find(([name]) => new RegExp(`\\bbg-${name}\\b`).test(line));
      return fill ? fill[1] : "text-primary-foreground";
    }
    return `${prefix}-background`;
  });
}

// bg-[var(--primary)] -> bg-primary. Undefined table vars map to their roles.
const VAR_CLASS = /\b(bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-\[var\(--([a-z0-9-]+)\)\]/g;
const VAR_ALIASES = { "table-header-fg": "foreground-secondary", "table-header-bg": "surface-muted" };

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const files = args.filter((arg) => !arg.startsWith("--"));

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const leftovers = new Set();
  let changes = 0;

  let output = source
    // Dark mode is not enabled, so dark: variants are dead code
    .replace(/ dark:[^\s"'`]+/g, () => {
      changes++;
      return "";
    })
    .replace(VAR_CLASS, (_match, prefix, name) => {
      changes++;
      return `${prefix}-${VAR_ALIASES[name] ?? name}`;
    })
    .replace(BIG_RADIUS, (_match, prefix) => {
      changes++;
      return `${prefix}-xl`;
    })
    .replace(FONT_SIZE, (match, size) => {
      if (!FONT_SIZES[size]) {
        leftovers.add(match);
        return match;
      }
      changes++;
      return FONT_SIZES[size];
    })
    .replace(CLASS, (match, prefix, color, opacity = "") => {
    const key = color.startsWith("[") ? color.slice(1, -1).toLowerCase() : color;
    const hit = lookup.get(key);
    if (!hit) {
      // Category hues (no status meaning): token + opacity for light shades
      const category = /^(violet|purple|rose|pink|indigo|teal|cyan|lime|fuchsia)-(\d{2,3})$/.exec(key);
      if (category) {
        const hue = category[1] === "purple" ? "violet" : category[1];
        const shade = Number(category[2]);
        const alpha = opacity || ({ 50: "/10", 100: "/15", 200: "/25", 300: "/40", 400: "/60" }[shade] ?? "");
        changes++;
        return `${prefix}-category-${hue}${alpha}`;
      }
      leftovers.add(match);
      return match;
    }
    let token = prefix === "text" || prefix === "placeholder" ? hit.text ?? hit.token : hit.token;
    // A token that already carries opacity (success/30) keeps it unless the class set its own
    if (opacity && token.includes("/")) token = token.split("/")[0];
    changes++;
    return `${prefix}-${token}${opacity}`;
  });

  const beforeBw = output;
  output = output.split("\n").map(blackWhite).join("\n");
  if (output !== beforeBw) {
    changes += (beforeBw.match(BW) ?? []).length;
  }

  if (!dry && output !== source) writeFileSync(file, output);
  console.log(
    `${file}: ${changes} replaced` +
      (leftovers.size ? `, left as is: ${[...leftovers].join(" ")}` : ""),
  );
}
