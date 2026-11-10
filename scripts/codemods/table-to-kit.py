"""Rewrite raw <table> markup to the kit's Table parts.

<table> -> <Table wrapper={false}> (the page keeps its own scroll frame),
<thead>/<tbody>/<tfoot>/<tr>/<th>/<td> -> TableHeader / TableBody /
TableFooter / TableRow / TableHead / TableCell. Existing classes stay and win
over the kit defaults through cn().

    python scripts/codemods/table-to-kit.py <file> [<file> ...]
"""
import re
import sys

PARTS = [
    ("table", "Table"),
    ("thead", "TableHeader"),
    ("tbody", "TableBody"),
    ("tfoot", "TableFooter"),
    ("tr", "TableRow"),
    ("th", "TableHead"),
    ("td", "TableCell"),
]

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()
    used = set()
    for raw, kit in PARTS:
        opener = re.compile(rf"<{raw}(?=[\s>/])")
        if opener.search(s) or f"</{raw}>" in s:
            used.add(kit)
        s = opener.sub(f"<{kit} wrapper={{false}}" if raw == "table" else f"<{kit}", s)
        s = s.replace(f"</{raw}>", f"</{kit}>")
    if used:
        m = re.search(r'import \{([^}]*)\} from "@/ui/table";', s)
        if m:
            have = {n.strip() for n in m.group(1).split(",") if n.strip()}
            names = sorted(have | used)
            s = s[: m.start()] + "import {\n  " + ",\n  ".join(names) + ',\n} from "@/ui/table";' + s[m.end():]
        else:
            imports = list(re.finditer(r"^import [^;]+;\n", s, re.M))
            at = imports[-1].end()
            s = s[:at] + "import {\n  " + ",\n  ".join(sorted(used)) + ',\n} from "@/ui/table";\n' + s[at:]
    open(path, "w", encoding="utf-8", newline="").write(s)
    print(f"{path}: {', '.join(sorted(used)) or 'nothing'}")
