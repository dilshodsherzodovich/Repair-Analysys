"""Replace hand-built wrappers around a <Table wrapper={false}> with the kit.

When the only content of the wrapper <div>(s) right around a table is that
table, the wrappers go:
- with an outline (border / rounded) -> <Table frame [maxHeight="..."]>
- plain scroll wrappers (overflow-x-auto) -> <Table> (its default wrapper)
Wrappers with other content (titles, notes) are left alone.

    python scripts/codemods/table-frames.py <file> [<file> ...]
"""
import re
import sys


def tag_end(s, i):
    depth, quote, j = 0, None, i + 1
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


def element_end(s, start, name):
    end = tag_end(s, start)
    if s[end - 1] == "/":
        return end + 1
    depth, j = 1, end + 1
    opener = re.compile(rf"<{name}(?=[\s>])")
    closer = f"</{name}>"
    while j < len(s):
        if s.startswith(closer, j):
            depth -= 1
            if depth == 0:
                return j + len(closer)
            j += len(closer)
        elif opener.match(s, j):
            e = tag_end(s, j)
            if s[e - 1] != "/":
                depth += 1
            j = e + 1
        else:
            j += 1
    raise ValueError("unbalanced")


def parent_div(s, start, end):
    """The <div ...> that wraps exactly s[start:end], or None."""
    before = s[:start].rstrip()
    m = re.search(r'<div className="([^"]*)">$', before)
    if not m:
        return None
    d_start = m.start()
    d_end = element_end(s, d_start, "div")
    inner = s[m.end():d_end - len("</div>")]
    if inner.strip() != s[start:end].strip():
        return None
    return d_start, d_end, m.group(1)


for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()
    count = 0
    pos = 0
    while True:
        m = re.compile(r"<Table\b[^>]*wrapper=\{false\}").search(s, pos)
        if not m:
            break
        t_start = m.start()
        t_end = element_end(s, t_start, "Table")
        classes, outer = [], (t_start, t_end)
        while True:
            p = parent_div(s, *outer)
            if not p:
                break
            classes += p[2].split()
            outer = (p[0], p[1])
        if outer == (t_start, t_end):
            pos = t_end
            continue
        framed = any(re.fullmatch(r"border(?:-[\w/-]+)?|rounded(?:-\w+)?", c) for c in classes)
        max_h = next((re.fullmatch(r"max-h-\[([^\]]+)\]", c).group(1) for c in classes if re.fullmatch(r"max-h-\[([^\]]+)\]", c)), None)
        table = s[t_start:t_end]
        opts = " frame" + (f' maxHeight="{max_h}"' if max_h else "") if framed else ""
        table = table.replace(" wrapper={false}", opts, 1)
        # keep the table's own indentation relative to the removed wrappers
        line_start = s.rfind("\n", 0, outer[0]) + 1
        indent = s[line_start:outer[0]]
        t_line_start = s.rfind("\n", 0, t_start) + 1
        t_indent = s[t_line_start:t_start]
        shift = len(t_indent) - len(indent)
        if shift > 0:
            table = "\n".join(l[shift:] if l.startswith(" " * shift) else l for l in table.split("\n"))
        s = s[:outer[0]] + table + s[outer[1]:]
        pos = outer[0] + len(table)
        count += 1
    open(path, "w", encoding="utf-8", newline="").write(s)
    print(f"{path}: {count} table(s) unwrapped")
