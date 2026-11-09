"""Turn hand-written error boxes into the kit's <Alert variant="destructive">.

Matches a <div> whose classes include the destructive-subtle box
(`border-destructive/30 bg-destructive-subtle ... text-destructive`, which is
what migrate-colors.mjs turns the old red-50 / red-200 / red-700 boxes into)
and keeps any layout classes (mt-2, mb-4, ...) on the Alert.

    python scripts/codemods/error-box-to-alert.py <file> [<file> ...]
"""
import re
import sys

BOX_CLASSES = {
    "rounded-xl", "rounded-lg", "border", "border-destructive/30",
    "bg-destructive-subtle", "px-4", "py-3", "p-3", "p-4", "text-sm",
    "text-destructive",
}
OPEN = re.compile(r'<div className="([^"]*\bbg-destructive-subtle\b[^"]*)">')
IMPORT = 'import { Alert, AlertDescription } from "@/ui/alert";\n'


def closing_div(s, start):
    depth, i = 0, start
    tag = re.compile(r"<div\b|</div>")
    for m in tag.finditer(s, start):
        if m.group(0) == "</div>":
            depth -= 1
            if depth == 0:
                return m.start()
        else:
            # self-closing <div ... /> does not nest
            end = s.index(">", m.start())
            if s[end - 1] != "/":
                depth += 1
    raise ValueError("unbalanced div")


for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()
    count = 0
    pos = 0
    while True:
        m = OPEN.search(s, pos)
        if not m:
            break
        classes = m.group(1).split()
        if "text-destructive" not in classes:
            pos = m.end()
            continue
        extra = " ".join(c for c in classes if c not in BOX_CLASSES)
        close = closing_div(s, m.start())
        inner = s[m.end():close]
        attr = f' className="{extra}"' if extra else ""
        replacement = (
            f'<Alert variant="destructive"{attr}>'
            f"<AlertDescription>{inner}</AlertDescription>"
            f"</Alert>"
        )
        s = s[: m.start()] + replacement + s[close + len("</div>"):]
        pos = m.start() + len(replacement)
        count += 1
    if count and "@/ui/alert" not in s:
        # after the last import line
        imports = list(re.finditer(r"^import [^;]+;\n", s, re.M))
        at = imports[-1].end() if imports else 0
        s = s[:at] + IMPORT + s[at:]
    open(path, "w", encoding="utf-8", newline="").write(s)
    print(f"{path}: {count} box(es)")
