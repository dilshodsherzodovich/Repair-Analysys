"""Drop named imports a file no longer uses (after a codemod removed code).

Only `import { a, b } from "x";` statements are touched; a name is unused when
it appears nowhere else in the file. Default and namespace imports are left.

    python scripts/codemods/prune-imports.py <file> [<file> ...]
"""
import re
import sys

STMT = re.compile(r"^import (type )?\{([^}]*)\} from (\"[^\"]+\");\n", re.M)

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()
    removed = []

    def prune(m):
        names = [n.strip() for n in m.group(2).split(",") if n.strip()]
        rest = s[: m.start()] + s[m.end():]
        keep = []
        for n in names:
            local = n.split(" as ")[-1].replace("type ", "").strip()
            if re.search(rf"\b{re.escape(local)}\b", rest):
                keep.append(n)
            else:
                removed.append(local)
        if not keep:
            return ""
        joined = ", ".join(keep)
        if len(joined) > 70:
            joined = "\n  " + ",\n  ".join(keep) + ",\n"
            return f"import {m.group(1) or ''}{{{joined}}} from {m.group(3)};\n"
        return f"import {m.group(1) or ''}{{ {joined} }} from {m.group(3)};\n"

    out = STMT.sub(prune, s)
    if out != s:
        open(path, "w", encoding="utf-8", newline="").write(out)
    print(f"{path}: removed {', '.join(removed) or 'nothing'}")
