"""Turn hand-built <Dialog><DialogContent><DialogHeader>... modals into <Modal>.

    python scripts/codemods/dialog-to-modal.py <file> [<file> ...]
"""
import re
import sys
from pathlib import Path

src = Path(__file__).with_name("table-frames.py").read_text(encoding="utf-8")
ns = {}
exec(src[: src.index("def parent_div")], ns)
tag_end, element_end = ns["tag_end"], ns["element_end"]

SIZES = [("max-w-sm", "sm"), ("max-w-md", "sm"), ("max-w-lg", "md"), ("max-w-xl", "md"),
         ("max-w-2xl", "lg"), ("max-w-3xl", "lg"), ("max-w-4xl", "xl"), ("max-w-5xl", "2xl"),
         ("max-w-6xl", "2xl")]


def inner(s, name):
    m = re.search(rf"<{name}\b", s)
    if not m:
        return None, None
    end = element_end(s, m.start(), name)
    open_end = tag_end(s, m.start())
    return s[open_end + 1:end - len(f"</{name}>")].strip(), s[m.start():open_end + 1]


for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()
    d = re.search(r"<Dialog\b(?!\w)", s)
    d_end = element_end(s, d.start(), "Dialog")
    d_open_end = tag_end(s, d.start())
    d_tag = s[d.start():d_open_end + 1]
    if "<DialogTrigger" in s[d.start():d_end]:
        print(f"{path}: has a trigger, skipped")
        continue
    is_open = re.search(r"open=\{([^}]*)\}", d_tag).group(1)
    oc = re.search(r"onOpenChange=\{(.*)\}\s*>$", d_tag, re.S).group(1).strip()
    m = re.fullmatch(r"\(\w+\)\s*=>\s*!\w+\s*&&\s*(\w+)\(\)", oc)
    on_close = m.group(1) if m else (oc if re.fullmatch(r"\w+", oc) and oc.startswith("on") else f"() => {oc}(false)")

    body_all = s[d_open_end + 1:d_end - len("</Dialog>")]
    c = re.search(r"<DialogContent\b", body_all)
    c_open_end = tag_end(body_all, c.start())
    c_tag = body_all[c.start():c_open_end + 1]
    c_end = element_end(body_all, c.start(), "DialogContent")
    content = body_all[c_open_end + 1:c_end - len("</DialogContent>")]

    size = next((sz for cls, sz in SIZES if re.search(rf"(?<![\w-]){re.escape(cls)}\b", c_tag)), "md")
    h = re.search(r"<DialogHeader\b", content)
    h_end = element_end(content, h.start(), "DialogHeader")
    header = content[h.start():h_end]
    title, _ = inner(header, "DialogTitle")
    desc, desc_tag = inner(header, "DialogDescription")
    rest = content[h_end:]

    title_prop = title if re.fullmatch(r"\{.*\}", title, re.S) and title.count("{") == 1 else "{<>" + title + "</>}"
    if re.fullmatch(r"\{[^{}]*\}", title):
        title_prop = title
    attrs = [f"isOpen={{{is_open}}}", f"onClose={{{on_close}}}", f"title={title_prop}"]
    if desc and "sr-only" not in (desc_tag or ""):
        attrs.append(f"description={desc if re.fullmatch(r'{[^{}]*}', desc) else '{<>' + desc + '</>}'}")
    attrs.append(f'size="{size}"')

    rest = re.sub(r"<DialogFooter[^>]*>", "<ModalFooter>", rest).replace("</DialogFooter>", "</ModalFooter>")
    # buttons in the footer take the standard size
    def footer_sizes(m):
        return re.sub(r'\s+size="sm"', "", m.group(0))
    rest = re.sub(r"<ModalFooter>.*?</ModalFooter>", footer_sizes, rest, flags=re.S)

    ind = re.match(r"[ \t]*", s[s.rfind("\n", 0, d.start()) + 1:]).group(0)
    new = f"<Modal\n{ind}  " + f"\n{ind}  ".join(attrs) + f"\n{ind}>" + rest.rstrip() + f"\n{ind}</Modal>"
    s = s[:d.start()] + new + s[d_end:]

    # imports
    s = re.sub(r'import \{[^}]*\} from "@/ui/(?:dialog|modal)";\n', "", s)
    names = ["Modal"] + (["ModalFooter"] if "<ModalFooter" in s else [])
    last = list(re.finditer(r'^import [^;]+;\s*$', s, re.M))[-1]
    s = s[:last.end()] + f'\nimport {{ {", ".join(names)} }} from "@/ui/modal";' + s[last.end():]
    open(path, "w", encoding="utf-8", newline="").write(s)
    print(f"{path}: size={size} onClose={on_close}")
