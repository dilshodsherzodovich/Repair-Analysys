"""Replace hand-written loading / empty blocks with LoadingState / EmptyState.

- a <div>/<p> holding only a spinner (Loader2 animate-spin or a border
  spinner) and optionally one label -> <LoadingState [label] [size]>
- a <div>/<p>/<TableCell colSpan> holding only a "no data" text
  ({t("noData")}, {t("empty")}, "Ma'lumot topilmadi", ...) -> <EmptyState>
- <TableRow><TableCell colSpan={n}><XState/></TableCell></TableRow>
  -> <TableStateRow colSpan={n}><XState/></TableStateRow>
Dropdown rows (py-1/py-2) are left alone.

    python scripts/codemods/states-to-standard.py [--dry] <file> ...
"""
import re
import sys
from pathlib import Path

src = Path(__file__).with_name("table-frames.py").read_text(encoding="utf-8")
ns = {}
exec(src[: src.index("def parent_div")], ns)
tag_end, element_end = ns["tag_end"], ns["element_end"]

DRY = "--dry" in sys.argv
files = [a for a in sys.argv[1:] if a != "--dry"]

EMPTY_KEY = re.compile(r"""\{\s*\w+\(\s*["'][\w.]*(?:no_?data|noData|empty|not_?found|notFound|no_?results|noResults|nothing|no_records|no_items|no_\w+)[\w.]*["']\s*\)\s*\}""")
EMPTY_TEXT = re.compile(r"Ma.lumot(?:lar)? (?:topilmadi|yo.q)|Hech narsa topilmadi|Natija topilmadi|Нет данных|Данные не найдены")
SPINNER = re.compile(r'<Loader2\b[^>]*animate-spin[^>]*/>|<div className="[^"]*animate-spin[^"]*"\s*(?:/>|></div>)')
LABEL = re.compile(r'^\s*(?:<(span|p|div)(?: className="[^"]*")?>\s*(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[^<{}]+?)\s*</\1>|(\{\w+\(["\'][^"\']+["\']\)\}|[A-Za-zА-Яа-яʻ\'’ .…]+?))\s*$', re.S)


def size_of(cls):
    if re.search(r"(?:absolute|fixed|inset-0)", cls):
        return None  # overlay over existing content
    if re.search(r"\bpy-(?:1|1\.5|2)\b", cls) and "px-3" in cls:
        return None  # dropdown row
    if re.search(r"min-h-(?:screen|\[\d+vh\])|\bpy-(?:2[0-9]|1[6-9])\b|\bh-(?:64|72|80|96|screen)\b", cls):
        return "page"
    if re.search(r"\bpy-[2-6]\b|\bh-(?:1[0-9]|2[0-4])\b|\bp-[2-4]\b", cls):
        return "compact"
    return "section"


def size_attr(sz):
    return "" if sz == "section" else f' size="{sz}"'


def rewrite(s):
    out, pos, changes = [], 0, []
    rx = re.compile(r'<(div|p|span|TableCell)\b')
    while True:
        m = rx.search(s, pos)
        if not m:
            break
        name = m.group(1)
        try:
            open_end = tag_end(s, m.start())
            if s[open_end - 1] == "/":
                raise ValueError
            end = element_end(s, m.start(), name)
        except ValueError:
            out.append(s[pos:m.end()]); pos = m.end(); continue
        tag = s[m.start():open_end + 1]
        inner = s[open_end + 1:end - len(f"</{name}>")]
        cm = re.search(r'className="([^"]*)"', tag)
        cls = cm.group(1) if cm else ""
        new = None
        if name == "TableCell" and "colSpan" not in tag:
            pass
        elif SPINNER.search(inner) and name != "span" and "inline" not in cls and "text-2xs" not in cls:
            rest = SPINNER.sub("", inner, count=1)
            if not SPINNER.search(rest):
                lm = LABEL.match(rest) if rest.strip() else None
                if not rest.strip() or lm:
                    sz = size_of(cls)
                    if sz:
                        label = ""
                        if lm:
                            text = (lm.group(2) or lm.group(3) or "").strip()
                            if text and not re.fullmatch(r"""\{\w+\(["']loading["']\)\}""", text):
                                label = f" label={text}" if text.startswith("{") else f' label="{text}"'
                        new = f"<LoadingState{label}{size_attr(sz)} />"
        elif "<" not in inner.strip() and (EMPTY_KEY.fullmatch(inner.strip()) or EMPTY_TEXT.search(inner)):
            sz = size_of(cls)
            text = inner.strip()
            if sz and len(text) < 120:
                title = f" title={text}" if text.startswith("{") else f' title="{" ".join(text.split())}"'
                if re.search(r"[А-Яа-я]", title):
                    title = ""  # hard-coded Russian: use the shared translated text
                new = f"<EmptyState{title}{size_attr('compact' if name in ('TableCell', 'span') and sz == 'section' else sz)} />"
        if new and name == "TableCell":
            col = re.search(r"colSpan=(\{[^}]*\}|\"\d+\")", tag).group(1)
            new = f"<TableStateRow colSpan={col}>{new}</TableStateRow>"
            # the TableCell's TableRow goes too
            row = re.search(r"<TableRow\b[^>]*>\s*$", s[:m.start()])
            close = re.match(r"\s*</TableRow>", s[end:])
            if row and close:
                out.append(s[pos:row.start()] + new)
                changes.append(new)
                pos = end + close.end()
                continue
            new = None
        if new:
            out.append(s[pos:m.start()] + new)
            changes.append(new)
            pos = end
        else:
            out.append(s[pos:m.end()])
            pos = m.end()
    out.append(s[pos:])
    s = "".join(out)
    # state components already wrapped in a full-width row
    def row(m):
        changes.append("row")
        return f"<TableStateRow colSpan={m.group(1)}>{m.group(2)}</TableStateRow>"
    s = re.sub(r"<TableRow\b[^>]*>\s*<TableCell colSpan=(\{[^}]*\}|\"\d+\")[^>]*>\s*(<(?:Loading|Empty|Error)State\b[^>]*/>)\s*</TableCell>\s*</TableRow>", row, s)
    return s, changes


def add_import(s, names):
    names = [n for n in names if re.search(rf"<{n}\b", s)]
    if not names:
        return s
    m = re.search(r'import \{([^}]*)\} from "@/ui/empty-state";', s)
    if m:
        have = [x.strip() for x in m.group(1).split(",") if x.strip()]
        merged = have + [n for n in names if n not in have]
        return s[:m.start()] + f'import {{ {", ".join(merged)} }} from "@/ui/empty-state";' + s[m.end():]
    last = list(re.finditer(r'^import [^;]+;\s*$', s, re.M))[-1]
    return s[:last.end()] + f'\nimport {{ {", ".join(names)} }} from "@/ui/empty-state";' + s[last.end():]


for path in files:
    s = open(path, encoding="utf-8").read()
    new, changes = rewrite(s)
    if not changes:
        continue
    if re.search(r"<Modal", new):
        new = new.replace(' size="page"', "")
    new = add_import(new, ["LoadingState", "EmptyState", "ErrorState", "TableStateRow"])
    print(f"{path}: {len(changes)}")
    for c in changes:
        if DRY:
            print("    " + c[:140])
    if not DRY:
        open(path, "w", encoding="utf-8", newline="").write(new)
