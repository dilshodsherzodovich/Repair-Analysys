"""Replace hand-built expand/collapse row buttons with <DisclosureTrigger>.

Spec (JSON list): {"file", "line", "tag"} where `tag` is the full new opening
tag, e.g. '<DisclosureTrigger open={open} chevronSide="end" className="px-4 py-3">'.
The row's own <ChevronDown ... /> is removed, since the trigger draws one.

    python scripts/codemods/to-disclosure-trigger.py spec.json
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ns = {}
exec(Path(__file__).with_name("swap-element.py").read_text(encoding="utf-8").split("spec = json.load")[0], ns)
tag_end, element_end, ensure_import = ns["tag_end"], ns["element_end"], ns["ensure_import"]

IMPORT = 'import { DisclosureTrigger } from "@/ui/disclosure-trigger";'


def apply(s, entry):
    start = sum(len(l) + 1 for l in s.split("\n")[: entry["line"] - 1])
    m = re.compile(r"<button\b").search(s, start)
    if not m or s[: m.start()].count("\n") + 1 != entry["line"]:
        raise ValueError(f"{entry['file']}:{entry['line']}: no <button> here")
    t_end = tag_end(s, m.start())
    el_end, close_at = element_end(s, m.start(), "button")
    body = s[t_end + 1: close_at]
    chev = re.search(r"\n?[ \t]*<ChevronDown\b", body)
    if chev:
        c_start = chev.start()
        c_end = tag_end(body, body.index("<ChevronDown", c_start)) + 1
        body = body[:c_start] + body[c_end:]
    return s[: m.start()] + entry["tag"] + body + "</DisclosureTrigger>" + s[el_end:]


spec = json.load(open(sys.argv[1], encoding="utf-8"))
by_file = defaultdict(list)
for e in spec:
    by_file[e["file"]].append(e)
for path, entries in by_file.items():
    s = open(path, encoding="utf-8").read()
    for e in sorted(entries, key=lambda e: -e["line"]):
        s = apply(s, e)
    s = ensure_import(s, IMPORT)
    # drop ChevronDown from the lucide import if nothing uses it any more
    if not re.search(r"<ChevronDown\b", s):
        s = re.sub(r"(import \{[^}]*?)\bChevronDown,\s*", r"\1", s)
        s = re.sub(r",\s*ChevronDown\b(?=[^}]*\} from \"lucide-react\")", "", s)
        s = re.sub(r'^import \{\s*ChevronDown\s*\} from "lucide-react";\n', "", s, flags=re.M)
    open(path, "w", encoding="utf-8", newline="").write(s)
    print(f"{path}: {len(entries)} row(s)")
