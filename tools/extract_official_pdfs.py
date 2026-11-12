"""Extract local Aeroclub PDFs into page-aware, formatted JSON for the web manual.

Requires PyMuPDF (``python -m pip install pymupdf``).
Run from the repository root: ``python tools/extract_official_pdfs.py``.
"""

import json
import re
from pathlib import Path

import pymupdf


ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "docs" / "official"
OUTPUT_DIR = ROOT / "docs" / "extracted"

DOCUMENTS = [
    ("comunicatii", "Comunicații aeronautice", "Comunicatii - Aeroclubul Romaniei.pdf", "#38c98a"),
    ("cunoasterea-aeronavei", "Cunoașterea generală a aeronavei", "Cunostinte generale despre aeronave - Aeroclubul Romaniei.pdf", "#67b7ef"),
    ("meteorologie", "Meteorologie", "Meteorologie - Aeroclubul Romaniei.pdf", "#f0b957"),
    ("navigatie", "Navigație aeriană", "Navigatie aeriana - Aeroclubul Romaniei.pdf", "#ac91f3"),
    ("performante-zbor", "Performanțe de zbor și planificarea zborului", "Performante de zbor si planificarea zborului - Aeroclubul Romaniei.pdf", "#5bcbd1"),
    ("performante-umane", "Performanțe și limite umane", "Performante si limite umane - Aeroclubul Romaniei.pdf", "#ed8da5"),
    ("principiile-zborului", "Principiile zborului", "Principiile zborului - Aeroclubul Romaniei.pdf", "#87c966"),
    ("proceduri-operationale", "Proceduri operaționale", "Proceduri operationale - Aeroclubul Romaniei.pdf", "#f19a62"),
    ("reglementari-aeronautice", "Reglementări aeronautice", "Reglementari aeronautice - Aeroclubul Romaniei.pdf", "#82a9f5"),
]


def clean_text(text):
    text = text.replace("\u00ad", "")
    text = re.sub(r"\s+", " ", text).strip()
    # Repair letter-spaced capitals used for decorative cover headings.
    text = re.sub(
        r"(?<!\w)(?:[A-ZĂÂÎȘȚ]\s+){2,}[A-ZĂÂÎȘȚ](?!\w)",
        lambda match: re.sub(r"\s+", "", match.group(0)),
        text,
    )
    return text


def merge_run(runs, text, bold, italic):
    if not text:
        return
    if runs and runs[-1]["bold"] == bold and runs[-1]["italic"] == italic:
        runs[-1]["text"] += text
    else:
        runs.append({"text": text, "bold": bold, "italic": italic})


def block_record(block):
    lines = block.get("lines", [])
    runs = []
    max_size = 0
    bold_spans = 0
    span_count = 0
    for line_index, line in enumerate(lines):
        spans = line.get("spans", [])
        if line_index:
            merge_run(runs, " ", False, False)
        for span in spans:
            text = re.sub(r"\s+", " ", span.get("text", "").replace("\u00ad", ""))
            if not text.strip():
                continue
            font = span.get("font", "").lower()
            flags = span.get("flags", 0)
            bold = "bold" in font or bool(flags & 16)
            italic = "italic" in font or bool(flags & 2)
            size = span.get("size", 0)
            max_size = max(max_size, size)
            bold_spans += int(bold)
            span_count += 1
            merge_run(runs, text, bold, italic)

    text = clean_text("".join(run["text"] for run in runs))
    if not text:
        return None

    is_bold = bool(span_count and bold_spans / span_count >= 0.5)
    if max_size >= 23:
        kind = "title"
    elif max_size >= 15:
        kind = "heading"
    elif max_size >= 12.5 and is_bold and len(text) < 200:
        kind = "subheading"
    elif text.startswith(("•", "▪", "◦", "– ", "- ")):
        kind = "list"
    else:
        kind = "paragraph"

    return {"type": kind, "text": text, "runs": runs}


def extract(slug, title, filename, accent):
    source = SOURCE_DIR / filename
    if not source.is_file():
        raise FileNotFoundError(source)
    pdf = pymupdf.open(source)
    pages = []
    for page_number, page in enumerate(pdf, start=1):
        blocks = []
        page_dict = page.get_text("dict", sort=True)
        for block in page_dict.get("blocks", []):
            if block.get("type") != 0:
                continue
            record = block_record(block)
            if record:
                blocks.append(record)
        if blocks:
            pages.append({"number": page_number, "blocks": blocks})

    record = {
        "id": slug,
        "title": title,
        "source": "docs/official/" + filename,
        "pages_total": len(pdf),
        "accent": accent,
        "pages": pages,
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUTPUT_DIR / (slug + ".json")
    output.write_text(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    return output, len(pages), sum(len(page["blocks"]) for page in pages)


if __name__ == "__main__":
    for document in DOCUMENTS:
        output, page_count, block_count = extract(*document)
        print(f"{output.relative_to(ROOT)}: {page_count} pages with text, {block_count} blocks")
