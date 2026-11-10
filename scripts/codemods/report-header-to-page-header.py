"""Turn hand-built report header cards into <PageHeader variant="card">.

The cards look like:

    <div className="... rounded-xl ... overflow-hidden">        card
      <div className="flex items-center justify-between ...">   header row
        <div ...>                                                title block
          <div ... bg-primary ...><Icon ... /></div>             icon tile
          <div ...><h1>TITLE</h1>DESCRIPTION</div>
        </div>
        <div ...>ACTIONS</div>                                   optional
      </div>
      <div className="... bg-surface-muted/60 ...">FILTERS</div>  optional
      ...REST                                                     optional
    </div>

Only cards that match this shape are rewritten; anything else is reported and
left alone.

    python scripts/codemods/report-header-to-page-header.py <file> [<file> ...]
"""
import re
import sys


def tag_end(s, i):
    """Index of the '>' closing the tag that starts at s[i] == '<'."""
    depth, quote = 0, None
    j = i + 1
    while j < len(s):
        c = s[j]
        if quote:
            if c == quote:
                quote = None
        elif c in "\"'`":
            quote = c
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        elif c == ">" and depth == 0:
            return j
        j += 1
    raise ValueError("unterminated tag")


def element_end(s, i):
    """End index (exclusive) of the JSX element starting at s[i] == '<'."""
    end = tag_end(s, i)
    if s[end - 1] == "/":
        return end + 1
    depth, j = 1, end + 1
    while j < len(s):
        if s.startswith("</", j):
            depth -= 1
            j = tag_end(s, j) + 1
            if depth == 0:
                return j
        elif s[j] == "<" and (s[j + 1].isalpha() or s[j + 1] == ">"):
            e = tag_end(s, j)
            if s[e - 1] != "/":
                depth += 1
            j = e + 1
        elif s[j] == "{":
            j = brace_end(s, j)
        else:
            j += 1
    raise ValueError("unterminated element")


def brace_end(s, i):
    depth, quote, j = 0, None, i
    while j < len(s):
        c = s[j]
        if quote:
            if c == "\\":
                j += 2
                continue
            if c == quote:
                quote = None
        elif c in "\"'`":
            quote = c
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return j + 1
        j += 1
    raise ValueError("unterminated brace")


def children(s):
    """Top-level children of a JSX fragment: list of (kind, text)."""
    out, j = [], 0
    while j < len(s):
        if s[j] == "<":
            e = element_end(s, j)
            out.append(("el", s[j:e]))
            j = e
        elif s[j] == "{":
            e = brace_end(s, j)
            out.append(("expr", s[j:e]))
            j = e
        elif s[j].isspace():
            j += 1
        else:
            k = j
            while k < len(s) and s[k] not in "<{":
                k += 1
            out.append(("text", s[j:k]))
            j = k
    return out


def inner(el):
    """Content between an element's opening and closing tags."""
    start = tag_end(el, 0) + 1
    close = el.rindex("</")
    return el[start:close]


def is_comment(kind, text):
    return kind == "expr" and text.strip().startswith("{/*")


def reindent(text, indent):
    """Strip the block's common indentation and indent it by `indent`."""
    lines = text.strip("\n").split("\n")
    # the first line was cut mid-line, so measure from the others
    rest = [l for l in lines[1:] if l.strip()]
    common = min((len(l) - len(l.lstrip()) for l in rest), default=0)
    out = [lines[0].strip()] + [l[common:] if l.strip() else "" for l in lines[1:]]
    return "\n".join((indent + l) if l else "" for l in out)


def convert(card, base, extra_attrs=""):
    kids = [k for k in children(inner(card)) if not is_comment(*k)]
    if not kids or kids[0][0] != "el":
        return None
    header = kids[0][1]
    hk = [k for k in children(inner(header)) if not is_comment(*k)]
    if not hk:
        return None
    title_block = hk[0][1]
    tb = [k for k in children(inner(title_block)) if not is_comment(*k)]
    if tb and tb[0][1].startswith("<h1"):
        # no icon tile: the title block holds the h1 directly
        icon_m, text_block = None, title_block
    elif len(tb) == 2:
        icon_m = re.search(r"<([A-Z]\w*)\b[^>]*/>", tb[0][1])
        text_block = tb[1][1]
    else:
        return None
    tk = [k for k in children(inner(text_block)) if not is_comment(*k)]
    if not tk or not tk[0][1].startswith("<h1"):
        return None
    title = inner(tk[0][1]).strip()
    desc_parts = []
    for kind, text in tk[1:]:
        if kind == "el" and text.startswith("<p"):
            desc_parts.append(inner(text).strip())
        else:
            desc_parts.append(text.strip())
    description = "\n".join(p for p in desc_parts if p)
    actions = ""
    if len(hk) > 1:
        action_el = hk[1][1]
        # a wrapper <div> around the buttons, or a single action element
        actions = inner(action_el).strip() if action_el.startswith("<div") else action_el.strip()

    rest = kids[1:]
    filters = ""
    if rest and rest[0][0] == "el" and "bg-surface-muted" in rest[0][1][: tag_end(rest[0][1], 0)]:
        filters = inner(rest[0][1]).strip()
        rest = rest[1:]
    body = "\n".join(text for _, text in rest)

    def wrap(value):
        if not value:
            return None
        parts = children(value)
        if len(parts) == 1 and parts[0][0] == "expr":
            # a single {expression}: pass it straight through
            return reindent(value.strip()[1:-1], base + "    ").lstrip()
        if "<" in value or "\n" in value:
            return "<>\n" + reindent(value, base + "      ") + "\n" + base + "    </>"
        if value.startswith("{") and value.endswith("}"):
            return value[1:-1]
        return '"' + value.replace('"', '\\"') + '"' if not value.startswith("{") else value

    props = ['variant="card"'] + ([extra_attrs] if extra_attrs else [])
    if icon_m:
        props.append(f"icon={{{icon_m.group(1)}}}")
    for name, value in (("title", title), ("description", description), ("actions", actions), ("filters", filters)):
        w = wrap(value)
        if w is None:
            continue
        if w.startswith('"'):
            props.append(f"{name}={w}")
        else:
            props.append(f"{name}={{{w}}}")
    open_tag = "<PageHeader\n" + "\n".join(base + "  " + p for p in props) + "\n"
    if body.strip():
        return open_tag + base + ">\n" + reindent(body, base + "  ") + "\n" + base + "</PageHeader>"
    return open_tag + base + "/>"


CARD = re.compile(r'<div className="[^"]*\brounded-xl\b[^"]*\boverflow-hidden\b[^"]*"([^>]*)>')

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()
    done = False
    pos = 0
    while True:
        m = CARD.search(s, pos)
        if not m:
            break
        end = element_end(s, m.start())
        card = s[m.start():end]
        if "<h1" not in card:
            pos = end
            continue
        line_start = s.rfind("\n", 0, m.start()) + 1
        new = convert(card, s[line_start:m.start()], m.group(1).strip())
        if new is None:
            print(f"{path}: card does not match the expected shape, left as is")
            break
        s = s[: m.start()] + new + s[end:]
        done = True
        break
    if done:
        if "@/ui/page-header" not in s:
            imports = list(re.finditer(r"^import [^;]+;\n", s, re.M))
            at = imports[-1].end()
            s = s[:at] + 'import { PageHeader } from "@/ui/page-header";\n' + s[at:]
        open(path, "w", encoding="utf-8", newline="").write(s)
        print(f"{path}: converted")
    elif "<h1" in s:
        print(f"{path}: no matching card found")
