"""Move a page's <PageFilters> into its PageHeader (the page standard).

- Add / export props come off PageFilters and become <AddButton> and
  <ExportActions> in the header's `actions` (page actions first, then exports).
- With one PageHeader in the file, PageFilters goes into its `filters` slot.
- Without one (a tab or embedded table), it is wrapped in a <FilterPanel>
  whose `actions` hold the Add / export buttons.
- Non-standard props are dropped: empty labels and margin overrides.
- Formatting is kept: multi-line props stay multi-line, re-indented.

Only files with exactly one <PageFilters> are handled; others are reported.

    python scripts/codemods/move-page-filters.py <file> [<file> ...]
"""
import re
import sys
from pathlib import Path

ns = {}
exec(Path(__file__).with_name("swap-element.py").read_text(encoding="utf-8").split("spec = json.load")[0], ns)
tag_end, attr_span, ensure_import = ns["tag_end"], ns["attr_span"], ns["ensure_import"]

ACTION_PROPS = ["onAdd", "addButtonText", "addButtonIcon", "addButtonPermittion",
                "onExport", "exportButtonText", "exportButtonIcon", "exportLoading"]
# (prop, value to drop; None = any value)
DROP_PROPS = [("dateRangePickerLabel", '""'), ("className", '"!mb-0"'), ("bulkDeleteText", None)]


def take(tag, name):
    span = attr_span(tag, name)
    if not span:
        return tag, None
    raw = tag[span[0]:span[1]].strip()[len(name) + 1:]
    return tag[: span[0]] + tag[span[1]:], raw


def unwrap(raw):
    return raw[1:-1] if raw.startswith("{") else raw


def reindent(block, indent):
    lines = block.strip("\n").split("\n")
    rest = [l for l in lines[1:] if l.strip()]
    common = min((len(l) - len(l.lstrip()) for l in rest), default=0)
    # the closing "/>" sits one level less than the props
    out = [indent + lines[0].strip()]
    for l in lines[1:]:
        if not l.strip():
            out.append("")
            continue
        out.append(indent + l[common:])
    return "\n".join(out)


def action_lines(props):
    parts = []
    if props.get("onAdd"):
        perm = props.get("addButtonPermittion")
        perm_attr = f" permission={perm}" if perm else ""
        parts.append(f"<AddButton onClick={props['onAdd']}{perm_attr} />")
    if props.get("onExport"):
        busy = props.get("exportLoading")
        busy_attr = f' busy={{{unwrap(busy)} ? "excel" : null}}' if busy else ""
        parts.append(f"<ExportActions onExcel={props['onExport']}{busy_attr} />")
    return parts


def fragment(lines, indent):
    if len(lines) == 1:
        return lines[0]
    inner = "\n".join(indent + "  " + l for l in lines)
    return f"<>\n{inner}\n{indent}</>"


for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()
    hits = list(re.finditer(r"<PageFilters\b", s))
    if len(hits) != 1:
        print(f"{path}: {len(hits)} PageFilters, skipped (do by hand)")
        continue
    start = hits[0].start()
    end = tag_end(s, start) + 1
    tag = s[start:end]
    props = {}
    for name in ACTION_PROPS:
        tag, raw = take(tag, name)
        if raw is not None:
            props[name] = raw
    for name, bad in DROP_PROPS:
        span = attr_span(tag, name)
        if span and (bad is None or tag[span[0]:span[1]].strip() == f"{name}={bad}"):
            tag = tag[: span[0]] + tag[span[1]:]
    actions = action_lines(props)

    # lift the element (with its own line) out of the tree
    line_start = s.rfind("\n", 0, start)
    line_end = s.find("\n", end)
    own_line = s[line_start + 1:start].strip() == "" and s[end:line_end].strip() == ""
    orig_indent = s[line_start + 1:start] if own_line else "        "
    s = s[:line_start] + s[line_end:] if own_line else s[:start] + s[end:]
    # don't leave two blank lines where the element was
    while s[line_start - 1:line_start + 2] == "\n\n\n" or s[line_start:line_start + 3] == "\n\n\n":
        s = s[:line_start] + s[line_start + 1:]

    imports = []
    headers = list(re.finditer(r"<PageHeader\b", s))
    if len(headers) == 1:
        h = headers[0].start()
        base = s[s.rfind("\n", 0, h) + 1:h]
        prop_indent = base + "  "
        h_end = tag_end(s, h)
        head = s[h:h_end + 1]
        span = attr_span(head, "actions")
        if actions and span:
            existing = unwrap(head[span[0]:span[1]].strip()[len("actions="):]).strip()
            if existing.startswith("<>") and existing.endswith("</>"):
                existing = existing[2:-3].strip()
            actions = actions + [existing]
            head = head[: span[0]] + head[span[1]:]
        closing = "/>" if head.endswith("/>") else ">"
        body = head[: -len(closing)].rstrip()
        attrs = [f"filters={{\n{reindent(tag, prop_indent + '  ')}\n{prop_indent}}}"]
        if actions:
            attrs.append(f"actions={{{fragment(actions, prop_indent)}}}" if len(actions) == 1
                         else f"actions={{\n{prop_indent}  {fragment(actions, prop_indent + '  ')}\n{prop_indent}}}")
        if "\n" not in body:  # one-line header: break props onto their own lines
            name_end = len("<PageHeader")
            existing_attrs = body[name_end:].strip()
            body = "<PageHeader" + "".join(f"\n{prop_indent}{a}" for a in re.findall(r'\w[\w-]*=(?:"[^"]*"|\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})', existing_attrs))
        new_head = body + "".join(f"\n{prop_indent}{a}" for a in attrs) + f"\n{base}{closing}"
        s = s[:h] + new_head + s[h_end + 1:]
        where = "header"
    else:
        indent = orig_indent
        panel_actions = ""
        if actions:
            panel_actions = f" actions={{{fragment(actions, indent)}}}" if len(actions) == 1 else f"\n{indent}  actions={{\n{indent}    {fragment(actions, indent + '    ')}\n{indent}  }}\n{indent}"
        panel = f"\n{indent}<FilterPanel{panel_actions}>\n{reindent(tag, indent + '  ')}\n{indent}</FilterPanel>"
        s = s[:line_start] + panel + s[line_start:]
        imports.append('import { FilterPanel } from "@/ui/filter-bar";')
        where = "panel"
    if any(a.startswith("<AddButton") for a in actions):
        imports.append('import { AddButton } from "@/ui/add-button";')
    if any(a.startswith("<ExportActions") for a in actions):
        imports.append('import { ExportActions } from "@/ui/export-actions";')
    for imp in imports:
        s = ensure_import(s, imp)
    open(path, "w", encoding="utf-8", newline="").write(s)
    print(f"{path}: moved ({where}; {len(actions)} action(s))")
