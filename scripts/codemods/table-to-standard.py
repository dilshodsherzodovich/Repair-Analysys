"""Strip per-page table styling so the kit Table owns the look.

On TableHead / TableCell / TableRow / TableHeader class strings (plain
strings, cn("...") arguments and the static parts of template literals):
- removed: backgrounds (unless the cell is sticky and needs a solid one),
  borders, padding, text size; on headers also text colour, weight, nowrap;
  on rows also hover tints and row lines.
- kept: alignment, widths, sticky / position / z-index, pin shadows, status
  highlights (bg-*-subtle, text-success, ...), emphasis on body cells.
Each <Table> in the file gets `bordered` when its cells drew a grid and
`density="compact"` when they used small text, unless already set.

    python scripts/codemods/table-to-standard.py <file> [<file> ...]
"""
import re
import sys
from pathlib import Path

src = Path(__file__).with_name("swap-element.py").read_text(encoding="utf-8")
ns = {}
exec(src[: src.index("spec = json.load")], ns)
tag_end, attr_span = ns["tag_end"], ns["attr_span"]

NEUTRAL_BG = r"(?:bg-(?:muted|border|surface-muted|background|card|transparent)(?:/\d+)?)"
COMMON_STRIP = [
    r"border(?:-[trblxy])?(?:-\d)?", r"border-(?:border|border-strong|transparent|muted)(?:/\d+)?",
    r"border-[trblxy]-(?:border|border-strong|0)", r"last:border-[rb]-0", r"border-collapse",
    r"p[xytrbl]?-[\d.]+", r"text-(?:xs|sm|2xs|base)", r"transition(?:-colors|-all)?",
    r"(?:hover|group-hover):" + NEUTRAL_BG, r"(?:hover|group-hover):bg-(?:muted|surface-muted)(?:/\d+)?",
]
HEAD_STRIP = COMMON_STRIP + [
    NEUTRAL_BG, r"text-(?:foreground|foreground-secondary|muted-foreground|foreground-subtle)",
    r"font-(?:medium|semibold|bold)", r"whitespace-nowrap", r"uppercase", r"tracking-\w+",
]
CELL_STRIP = COMMON_STRIP + [r"text-foreground"]
ROW_STRIP = COMMON_STRIP + [NEUTRAL_BG, r"text-(?:foreground|foreground-secondary)"]


def strip_tokens(text, patterns, keep_bg):
    out = []
    for tok in text.split():
        bare = tok
        if keep_bg and re.fullmatch(NEUTRAL_BG, bare) and bare != "bg-transparent":
            out.append(tok)  # pinned cells need a solid background
            continue
        if any(re.fullmatch(p, bare) for p in patterns):
            continue
        out.append(tok)
    return " ".join(out)


def rewrite_value(value, patterns):
    """Rewrite string literals inside a className={...} or "..." value."""
    sticky = "sticky" in value
    # plain "..." / '...' literals
    value = re.sub(r'"([^"\n]*)"', lambda m: '"' + strip_tokens(m.group(1), patterns, sticky) + '"', value)
    # static parts of template literals
    def static_part(part):
        kept = strip_tokens(part, patterns, sticky)
        if not kept:
            return " " if part.strip() == "" and part else " "
        lead = " " if part[:1].isspace() else ""
        trail = " " if part[-1:].isspace() else ""
        return f"{lead}{kept}{trail}"

    def tpl(m):
        parts = re.split(r"(\$\{[^}]*\})", m.group(1))
        body = "".join(p if p.startswith("${") else static_part(p) for p in parts)
        return "`" + re.sub(r" {2,}", " ", body).strip() + "`"
    value = re.sub(r"`([^`]*)`", tpl, value)
    return value


TARGETS = {"TableHead": HEAD_STRIP, "TableCell": CELL_STRIP, "TableRow": ROW_STRIP, "TableHeader": ROW_STRIP}

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()
    had_grid = bool(re.search(r"<Table(?:Head|Cell)\b[^>]*className=[^>]*\bborder(?:-r|-l)?\b(?![-\w])", s, re.S))
    small = len(re.findall(r"<Table(?:Head|Cell)\b[^>]*\btext-(?:xs|2xs)\b", s, re.S))
    cells = max(1, len(re.findall(r"<Table(?:Head|Cell)\b", s)))
    compact = small / cells >= 0.4 or bool(re.search(r"<Table\b[^>]*\btext-xs\b", s))

    out, i = [], 0
    for m in re.finditer(r"<(TableHead|TableCell|TableRow|TableHeader)\b", s):
        if m.start() < i:
            continue
        end = tag_end(s, m.start())
        tag = s[m.start(): end + 1]
        span = attr_span(tag, "className")
        if span:
            attr = tag[span[0]:span[1]]
            name_at = attr.index("className=") + len("className=")
            new_attr = attr[:name_at] + rewrite_value(attr[name_at:], TARGETS[m.group(1)])
            new_attr = re.sub(r'\s*className=""', "", new_attr)
            new_attr = re.sub(r'\s*className=\{""\}', "", new_attr)
            tag = tag[: span[0]] + new_attr + tag[span[1]:]
        out.append(s[i:m.start()] + tag)
        i = end + 1
    out.append(s[i:])
    s = "".join(out)

    # table options
    def table_opts(m):
        tag = m.group(0)
        extra = ""
        if had_grid and "bordered" not in tag:
            extra += " bordered"
        if compact and "density=" not in tag:
            extra += ' density="compact"'
        tag = re.sub(r'\s+text-xs(?=["\s])', "", tag)
        return tag[:6] + extra + tag[6:]
    s = re.sub(r"<Table(?=[\s>])[^>]*>", table_opts, s)

    open(path, "w", encoding="utf-8", newline="").write(s)
    print(f"{path}: bordered={had_grid} compact={compact}")
