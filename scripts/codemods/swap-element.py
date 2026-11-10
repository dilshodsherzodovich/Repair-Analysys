"""Swap raw elements for kit components, one spec entry per element.

Spec (JSON list), each entry:
    {
      "file": "app/x/page.tsx",
      "line": 120,                        # line where the opening tag starts
      "from": "button",                   # raw tag being replaced
      "to": "Button",                     # kit component
      "props": "variant=\"success\" size=\"sm\"",
      "className": "w-full",              # classes to keep; "" / omitted drops className
      "keepClassName": false,             # true keeps the original className as-is
      "import": "import { Button } from \"@/ui/button\";"
    }

Entries are applied bottom-up per file so earlier line numbers stay valid.

    python scripts/codemods/swap-element.py spec.json
"""
import json
import re
import sys
from collections import defaultdict


def tag_end(s, i):
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


def element_end(s, i, name):
    end = tag_end(s, i)
    if s[end - 1] == "/":
        return end + 1, None
    depth, j = 1, end + 1
    open_re = re.compile(rf"<{name}\b")
    close_tag = f"</{name}>"
    while j < len(s):
        if s.startswith(close_tag, j):
            depth -= 1
            if depth == 0:
                return j + len(close_tag), j
            j += len(close_tag)
        elif open_re.match(s, j):
            e = tag_end(s, j)
            if s[e - 1] != "/":
                depth += 1
            j = e + 1
        else:
            j += 1
    raise ValueError(f"no closing </{name}>")


def attr_span(tag, name):
    """(start, end) of `name=...` inside an opening tag, or None."""
    # include the whitespace / newline before the attribute so no blank line is left
    m = re.search(rf"\s+{name}=", tag)
    if not m:
        return None
    k = m.end()
    if tag[k] in "\"'":
        close = tag.index(tag[k], k + 1)
        return m.start(), close + 1
    if tag[k] == "{":
        depth, j = 0, k
        while j < len(tag):
            if tag[j] == "{":
                depth += 1
            elif tag[j] == "}":
                depth -= 1
                if depth == 0:
                    return m.start(), j + 1
            j += 1
    raise ValueError(f"cannot parse {name}=")


def apply(s, entry):
    lines = s.split("\n")
    start = sum(len(l) + 1 for l in lines[: entry["line"] - 1])
    m = re.compile(rf"<{entry['from']}\b").search(s, start)
    if not m or s[:m.start()].count("\n") + 1 != entry["line"]:
        raise ValueError(f"{entry['file']}:{entry['line']}: no <{entry['from']}> here")
    t_end = tag_end(s, m.start())
    tag = s[m.start(): t_end + 1]
    el_end, close_at = element_end(s, m.start(), entry["from"])

    new_tag = tag
    if not entry.get("keepClassName"):
        span = attr_span(new_tag, "className")
        if span:
            new_tag = new_tag[: span[0]] + new_tag[span[1]:]
        keep = entry.get("className", "")
        if not keep:
            extra = ""
        elif keep.startswith("{"):
            extra = f" className={keep}"  # an expression, e.g. {cn(...)}
        else:
            extra = f' className="{keep}"'
    else:
        extra = ""
    if entry.get("dropAttrs"):
        for name in entry["dropAttrs"]:
            span = attr_span(new_tag, name)
            if span:
                new_tag = new_tag[: span[0]] + new_tag[span[1]:]
    props = (" " + entry["props"]) if entry.get("props") else ""
    new_tag = f"<{entry['to']}{props}{extra}" + new_tag[len(entry["from"]) + 1:]

    out = s[: m.start()] + new_tag
    if close_at is not None:
        out += s[t_end + 1: close_at] + f"</{entry['to']}>" + s[el_end:]
    else:
        out += s[t_end + 1:]
    return out


def ensure_import(s, line):
    if not line:
        return s
    names = re.search(r"\{([^}]*)\}", line).group(1).split(",")
    source = re.search(r'from "([^"]+)"', line).group(1)
    existing = re.search(rf'import \{{([^}}]*)\}} from "{re.escape(source)}";', s)
    if existing:
        have = [n.strip() for n in existing.group(1).split(",") if n.strip()]
        merged = have + [n.strip() for n in names if n.strip() not in have]
        return s[: existing.start(1)] + " " + ", ".join(merged) + " " + s[existing.end(1):]
    imports = list(re.finditer(r"^import [^;]+;\n", s, re.M))
    at = imports[-1].end() if imports else 0
    return s[:at] + line.rstrip("\n") + "\n" + s[at:]


spec = json.load(open(sys.argv[1], encoding="utf-8"))
by_file = defaultdict(list)
for entry in spec:
    by_file[entry["file"]].append(entry)
for path, entries in by_file.items():
    s = open(path, encoding="utf-8").read()
    for entry in sorted(entries, key=lambda e: -e["line"]):
        s = apply(s, entry)
    for imp in {e.get("import", "") for e in entries}:
        s = ensure_import(s, imp)
    open(path, "w", encoding="utf-8", newline="").write(s)
    print(f"{path}: {len(entries)} element(s)")
