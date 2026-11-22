# Removes the phone number from the résumé header (the site must never publish it, DESIGN.md §2.7),
# re-centres the rest of the contact line in the PDF's own Arial and moves its links and underlines.
# Needs PyMuPDF:  python3 -m venv .venv && .venv/bin/pip install pymupdf
# Usage:          .venv/bin/python scripts/redact-resume-phone.py ~/Downloads/resume.pdf public/resume.pdf

import os, sys, pymupdf
SRC, OUT = sys.argv[1], sys.argv[2]
d = pymupdf.open(SRC); p = d[0]
spans = [s for b in p.get_text("dict")["blocks"] for l in b.get("lines", []) for s in l["spans"] if 57 < s["bbox"][1] < 58.5]
phone = next(s for s in spans if "9774" in s["text"])
keep = [s for s in spans if s is not phone and s["font"] == "ArialMT" and s["text"].strip()]
dx = -(phone["bbox"][2] - phone["bbox"][0]) / 2
xref = next(f[0] for f in p.get_fonts() if "ArialMT" in f[3] and "Bold" not in f[3])
buf = d.extract_font(xref)[3]
unders = [dr for dr in p.get_drawings() if 64 < dr["rect"].y0 < 70.5 and dr["rect"].height < 2]
links = [l for l in p.get_links() if 56 < l["from"].y0 < 58]
for l in links: p.delete_link(l)
p.add_redact_annot(pymupdf.Rect(40, 56.5, 560, 70))
p.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED)
p.insert_font(fontname="ArialRe", fontbuffer=buf)
for s in keep:
    x, y = s["origin"]; p.insert_text((x + dx, y), s["text"], fontname="ArialRe", fontsize=s["size"], color=(0, 0, 0))
for u in unders:
    r = u["rect"]; p.draw_line((r.x0 + dx, r.y0), (r.x1 + dx, r.y0), color=u["color"], width=u["width"])
for l in links:
    r = l["from"]; p.insert_link({"kind": pymupdf.LINK_URI, "from": pymupdf.Rect(r.x0 + dx, r.y0, r.x1 + dx, r.y1), "uri": l["uri"]})
d.set_metadata({"title": "Nguyen Quy Duc - Résumé", "author": "Nguyen Quy Duc"})
d.save(OUT, garbage=4, deflate=True, clean=True)
v = pymupdf.open(OUT)
alltext = "".join(pg.get_text() for pg in v)
raw = open(OUT, "rb").read()
assert "9774" not in alltext and "+65" not in alltext and b"9774" not in raw, "phone still present"
print("ok: no phone; email present:", "quyduc711@gmail.com" in alltext, "; size", os.path.getsize(OUT))
v[0].get_pixmap(dpi=110, clip=pymupdf.Rect(0, 20, 596, 140)).save(os.path.join(os.path.dirname(OUT), "head.png"))
