"""Move hand-built form markup onto the kit (Field / FieldGrid / ModalFooter).

- <div [className]><Label ...>text</Label> control...</div>
    -> <Field label=... [htmlFor] [required] [span="full"]>control...</Field>
  (a trailing * in the label becomes `required`)
- <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> holding Fields
    -> <FieldGrid columns={2}>
- <div className="flex justify-end gap-3 pt-4"> holding buttons (modals)
    -> <ModalFooter>
- <Card className="border-none p-0 mt-N"> wrappers in modals: removed

    python scripts/codemods/forms-to-standard.py <file> [<file> ...]
"""
import re
import sys
from pathlib import Path

src = Path(__file__).with_name("table-frames.py").read_text(encoding="utf-8")
ns = {}
exec(src[: src.index("def parent_div")], ns)
tag_end, element_end = ns["tag_end"], ns["element_end"]

LAYOUT = re.compile(
    r"(?:space-y-[\d.]+|flex|flex-col|gap(?:-[xy])?-[\d.]+|grid|w-full|min-w-0|"
    r"(?:sm:|md:|lg:)?col-span-(?:1|2|3|full)|(?:sm:|md:|lg:)?col-span-\d)"
)
STAR = re.compile(
    r'\s*(?:<span className="[^"]*(?:destructive|red)[^"]*">\s*\*\s*</span>|\*)\s*$'
)


def label_prop(inner):
    inner = inner.strip()
    m = re.fullmatch(r"\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}", inner)
    if m:
        return "{" + m.group(1) + "}"
    if "<" not in inner and "{" not in inner and '"' not in inner and "\n" not in inner:
        return '"' + inner + '"'
    return "{<>" + inner + "</>}"


def to_fields(s):
    out, pos, n = [], 0, 0
    rx = re.compile(r'<div(?: className="([^"]*)")?>(\s*)<Label\b')
    while True:
        m = rx.search(s, pos)
        if not m:
            break
        d_start = m.start()
        try:
            d_end = element_end(s, d_start, "div")
        except ValueError:
            pos = m.end()
            continue
        l_start = m.end() - len("<Label")
        l_open_end = tag_end(s, l_start)
        l_close = s.find("</Label>", l_open_end)
        if l_close < 0 or s[l_open_end - 1] == "/":
            pos = m.end()
            continue
        label_tag = s[l_start:l_open_end + 1]
        label_inner = s[l_open_end + 1:l_close]
        body = s[l_close + len("</Label>"):d_end - len("</div>")]
        if not body.strip():
            pos = m.end()
            continue
        classes = (m.group(1) or "").split()
        span = any(re.fullmatch(r"(?:sm:|md:|lg:)?col-span-(?:2|3|full)", c) for c in classes)
        rest = [c for c in classes if not LAYOUT.fullmatch(c)]
        required = bool(STAR.search(label_inner))
        label_inner = STAR.sub("", label_inner)
        attrs = [f"label={label_prop(label_inner)}"]
        hf = re.search(r'htmlFor=(\{[^}]*\}|"[^"]*")', label_tag)
        if hf:
            attrs.append(f"htmlFor={hf.group(1)}")
        if required:
            attrs.append("required")
        if span:
            attrs.append('span="full"')
        if rest:
            attrs.append(f'className="{" ".join(rest)}"')
        new = "<Field " + " ".join(attrs) + ">" + body.rstrip() + "\n" + _indent_of(s, d_start) + "</Field>"
        out.append(s[pos:d_start] + new)
        pos = d_end
        n += 1
    out.append(s[pos:])
    return "".join(out), n


def _indent_of(s, i):
    ls = s.rfind("\n", 0, i) + 1
    return re.match(r"[ \t]*", s[ls:]).group(0)


def replace_div(s, class_rx, make_open, close, must_contain):
    out, pos, n = [], 0, 0
    rx = re.compile(r'<div className="(' + class_rx + r')">')
    while True:
        m = rx.search(s, pos)
        if not m:
            break
        end = element_end(s, m.start(), "div")
        inner = s[m.end():end - len("</div>")]
        if must_contain not in inner:
            out.append(s[pos:m.end()])
            pos = m.end()
            continue
        out.append(s[pos:m.start()] + make_open(m.group(1)) + inner + close)
        pos = end
        n += 1
    out.append(s[pos:])
    return "".join(out), n


def grid_open(cls):
    cols = max([int(c) for c in re.findall(r"grid-cols-(\d)", cls)] or [1])
    return "<FieldGrid>" if cols == 1 else f"<FieldGrid columns={{{cols}}}>"


def unwrap_card(s):
    n = 0
    while True:
        m = re.search(r'<Card className="border-none p-0[^"]*">', s)
        if not m:
            return s, n
        end = element_end(s, m.start(), "Card")
        inner = s[m.end():end - len("</Card>")]
        s = s[:m.start()] + inner.strip() + s[end:]
        n += 1


def add_import(s, names, module):
    names = [x for x in names if re.search(rf"<{x}\b", s)]
    if not names:
        return s
    m = re.search(rf'import \{{([^}}]*)\}} from "{re.escape(module)}";', s)
    if m:
        have = [x.strip() for x in m.group(1).split(",") if x.strip()]
        merged = have + [x for x in names if x not in have]
        return s[:m.start()] + f'import {{ {", ".join(merged)} }} from "{module}";' + s[m.end():]
    last = list(re.finditer(r'^import [^;]+;\s*$', s, re.M))[-1]
    return s[:last.end()] + f'\nimport {{ {", ".join(names)} }} from "{module}";' + s[last.end():]


for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()
    s, fields = to_fields(s)
    s, grids = replace_div(
        s, r"grid(?: grid-cols-1)?(?: (?:sm|md|lg):grid-cols-\d)* gap(?:-[xy])?-[\d.]+(?: gap-[xy]-[\d.]+)?",
        grid_open, "</FieldGrid>", "<Field ")
    in_modal = bool(re.search(r"<(Modal|DialogContent)\b", s))
    footers = cards = 0
    if in_modal:
        s, footers = replace_div(
            s, r"flex justify-end gap-[23] pt-[2-4]|flex justify-end gap-[23]",
            lambda c: "<ModalFooter>", "</ModalFooter>", "<Button")
        s = re.sub(r'(<ModalFooter>(?:(?!</ModalFooter>).)*?)\s*className="px-8"', r"\1", s, flags=re.S)
        s, cards = unwrap_card(s)
    s = add_import(s, ["Field", "FieldGrid"], "@/ui/field")
    if footers:
        s = add_import(s, ["ModalFooter"], "@/ui/modal")
    open(path, "w", encoding="utf-8", newline="").write(s)
    print(f"{path}: {fields} field(s), {grids} grid(s), {footers} footer(s), {cards} card(s)")
