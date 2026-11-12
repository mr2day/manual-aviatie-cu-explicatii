"""Extract local Aeroclub PDFs into page-aware, formatted JSON for the web manual.

Requires PyMuPDF (``python -m pip install pymupdf``).
Run from the repository root: ``python tools/extract_official_pdfs.py``.
"""

import json
import re
import unicodedata
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
    text = text.translate(str.maketrans({"ǎ": "ă", "Ţ": "Ț", "ţ": "ț", "Ş": "Ș", "ş": "ș"}))
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


def block_records(block, split_lines=False):
    records = [block_record({"lines": [line]}) for line in block.get("lines", [])]
    records = [record for record in records if record]
    if split_lines:
        return records

    grouped = []
    for record in records:
        if record["type"] != "paragraph" or not grouped or grouped[-1]["type"] != "paragraph":
            grouped.append(record)
            continue
        previous = grouped[-1]
        previous["text"] = clean_text(previous["text"] + " " + record["text"])
        for run in record["runs"]:
            merge_run(previous["runs"], run["text"], run["bold"], run["italic"])
    return grouped


def normalize_heading(text):
    text = re.sub(r"\.{2,}.*$", "", text)
    text = re.sub(r"\s+\d{1,3}\s*$", "", text)
    text = unicodedata.normalize("NFKD", text.casefold())
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = re.sub(r"^\s*(?:\d+(?:\.\d+)*\.?\s*)+", "", text)
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def add_document_anchors(blocks):
    headings = {}
    used_anchors = set()

    def assign_anchor(block, key):
        base = "section-" + re.sub(r"[^a-z0-9]+", "-", key).strip("-")[:80]
        anchor = base
        suffix = 2
        while anchor in used_anchors:
            anchor = base + "-" + str(suffix)
            suffix += 1
        used_anchors.add(anchor)
        block["anchor"] = anchor
        return anchor

    for block in blocks:
        if block["type"] not in ("title", "heading", "subheading") and not (
            len(block["text"]) < 180 and block["runs"] and all(run["bold"] for run in block["runs"])
        ):
            continue
        key = normalize_heading(block["text"])
        if key:
            anchor = assign_anchor(block, key)
            headings.setdefault(key, anchor)

    for index, block in enumerate(blocks):
        if block["type"] != "toc":
            continue
        key = normalize_heading(block["text"])
        anchor = headings.get(key)
        if not anchor and key:
            for candidate in blocks[index + 1:]:
                if candidate["type"] == "toc":
                    continue
                candidate_text = normalize_heading(candidate["text"])
                if key in candidate_text or (len(candidate_text) > 8 and candidate_text in key):
                    anchor = candidate.get("anchor") or assign_anchor(candidate, key)
                    break
        if not anchor and key:
            tokens = set(key.split()) - {"si", "de", "la", "in", "a", "al", "ale", "un", "o"}
            best = None
            best_score = 0
            for candidate in blocks[index + 1:]:
                if candidate["type"] == "toc" or candidate["type"] not in ("title", "heading", "subheading", "paragraph"):
                    continue
                if candidate["type"] == "paragraph" and not (
                    len(candidate["text"]) < 180 and candidate["runs"] and all(run["bold"] for run in candidate["runs"])
                ):
                    continue
                candidate_key = normalize_heading(candidate["text"])
                candidate_tokens = set(candidate_key.split()) - {"si", "de", "la", "in", "a", "al", "ale", "un", "o"}
                score = len(tokens & candidate_tokens) / max(len(tokens), 1)
                if score > best_score:
                    best, best_score = candidate, score
            if best_score >= 0.5:
                anchor = best.get("anchor") or assign_anchor(best, normalize_heading(best["text"]))
        if anchor:
            block["href"] = "#" + anchor


def extract(slug, title, filename, accent):
    source = SOURCE_DIR / filename
    if not source.is_file():
        raise FileNotFoundError(source)
    pdf = pymupdf.open(source)
    blocks = []
    for page in pdf:
        page_dict = page.get_text("dict", sort=True)
        source_blocks = [block for block in page_dict.get("blocks", []) if block.get("type") == 0]
        page_lines = [line for block in source_blocks for line in block.get("lines", [])]
        lines_text = " ".join(span.get("text", "") for line in page_lines for span in line.get("spans", []))
        is_contents = "cuprins" in lines_text.casefold() or "contents" in lines_text.casefold()
        page_blocks = []
        for source_block in source_blocks:
            page_blocks.extend(block_records(source_block, split_lines=is_contents))

        for record in page_blocks:
            text = record["text"]
            if normalize_heading(text) == "pagina lasata goala":
                continue
            if re.match(r"^cuprins\s+\d+$", text, re.IGNORECASE):
                continue
            if re.match(r"^bibliografie\s+\d+$", text, re.IGNORECASE):
                continue
            if re.match(r"^\s*\S.{0,70}\s+\d{1,3}\s*$", text) and re.search(re.escape(title.split()[0]), text, re.IGNORECASE):
                continue

            if is_contents:
                match = re.match(r"^(.*?)\s*\.{3,}\s*(?:\d{1,3})?\s*$", text)
                if match and match.group(1).strip():
                    record["text"] = match.group(1).strip()
                    record["type"] = "toc"
                    record["runs"] = [{"text": record["text"], "bold": False, "italic": False}]
            blocks.append(record)

    add_document_anchors(blocks)

    record = {
        "id": slug,
        "title": title,
        "source": "docs/official/" + filename,
        "pages_total": len(pdf),
        "accent": accent,
        "blocks": blocks,
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUTPUT_DIR / (slug + ".json")
    output.write_text(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    return output, len(blocks)


if __name__ == "__main__":
    for document in DOCUMENTS:
        output, block_count = extract(*document)
        print(f"{output.relative_to(ROOT)}: {block_count} text blocks")
