"""Put a page on the spacing standard.

For each listed file:
- the page root (the element right after `  return (`, at 4 spaces) becomes
  <Page> when it is a spacing-only <div> or a fragment;
- spacing-only wrappers given by line (gutters / gaps such as px-6 py-4, mt-6)
  are unwrapped into fragments, so their content sits directly in the page
  and takes Page's 24px rhythm.

Spec (JSON): {"<file>": {"root": true|false, "unwrap": [<line>, ...]}}

    python scripts/codemods/normalize-page-spacing.py spec.json
"""
import json
import re
import sys
from pathlib import Path

ns = {}
exec(Path(__file__).with_name("swap-element.py").read_text(encoding="utf-8").split("spec = json.load")[0], ns)
tag_end, ensure_import = ns["tag_end"], ns["ensure_import"]


def element_span(s, start):
    """(open_end, close_start, close_end) of the element (div or fragment) at `start`."""
    if s.startswith("<>", start):
        depth, j = 1, start + 2
        while j < len(s):
            if s.startswith("<>", j):
                depth += 1; j += 2
            elif s.startswith("</>", j):
                depth -= 1
                if depth == 0:
                    return start + 2, j, j + 3
                j += 3
            else:
                j += 1
        raise ValueError("unbalanced fragment")
    name = re.match(r"<([A-Za-z][\w.]*)", s[start:]).group(1)
    open_end = tag_end(s, start) + 1
    depth, j = 1, open_end
    opener = re.compile(rf"<{re.escape(name)}(?=[\s>])")
    closer = f"</{name}>"
    while j < len(s):
        if s.startswith(closer, j):
            depth -= 1
            if depth == 0:
                return open_end, j, j + len(closer)
            j += len(closer)
        elif opener.match(s, j):
            e = tag_end(s, j)
            if s[e - 1] != "/":
                depth += 1
            j = e + 1
        else:
            j += 1
    raise ValueError(f"no closing {closer}")


def line_offset(s, line):
    return sum(len(l) + 1 for l in s.split("\n")[: line - 1])


spec = json.load(open(sys.argv[1], encoding="utf-8"))
for path, job in spec.items():
    s = open(path, encoding="utf-8").read()
    edits = []  # (start, end, replacement)
    for line in job.get("unwrap", []):
        at = s.index("<div", line_offset(s, line))
        open_end, close_start, close_end = element_span(s, at)
        edits.append((at, open_end, "<>"))
        edits.append((close_start, close_end, "</>"))
    if job.get("root"):
        for m in re.finditer(r"\n  return \(\n    (<>|<div className=\"[^\"]*\">)\n", s):
            at = m.start(1)
            open_end, close_start, close_end = element_span(s, at)
            # only the component that holds the unwrapped sections (or the only one)
            targets = job.get("unwrap", [])
            if targets and not any(at < line_offset(s, l) < close_start for l in targets):
                continue
            edits.append((at, open_end, "<Page>"))
            edits.append((close_start, close_end, "</Page>"))
            break
    for start, end, text in sorted(edits, key=lambda e: -e[0]):
        s = s[:start] + text + s[end:]
    if job.get("root"):
        s = ensure_import(s, 'import { Page } from "@/ui/page";')
    open(path, "w", encoding="utf-8", newline="").write(s)
    print(f"{path}: root={'Page' if job.get('root') else '-'} unwrapped={len(job.get('unwrap', []))}")
