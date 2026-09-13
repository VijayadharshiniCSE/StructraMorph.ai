"""
parser_service.py
DocSurgical AI document segmentation engine.
Deconstructs PDF, DOCX, Images, and raw text/markdown into structured component blocks:
title, main_heading, sub_heading, body (main content), sub_content (bullets/captions), table, footer, and extracted visual images.
Performs precise font-size based hierarchical ranking and visual extraction.
"""
import io
import re
import uuid
import base64
from typing import List, Optional, Dict, Any

import pdfplumber
import docx as python_docx
from PIL import Image

try:
    import pytesseract
except ImportError:
    pytesseract = None

from .models import Block, BlockType, BoundingBox

HEADING_MAX_WORDS = 14


def _classify_line(text: str, font_size: float = 0, is_bold: bool = False,
                    is_first_block: bool = False) -> BlockType:
    """
    Heuristic classifier determining block semantics based on font size and formatting.
    - Title: Largest typographical size (>= 21pt)
    - Heading (Main Heading / H1): 16pt - 20pt
    - Sub Heading / Sub Title (H2): 12.5pt - 15.5pt (or bold)
    - Body (Main Content): standard body text (10pt - 12pt)
    - Sub Content: bullet points, list items, small notes, captions (< 9.5pt)
    - Footer: bottom margin, page numbers, legal notices
    """
    stripped = text.strip()
    word_count = len(stripped.split())

    # Footers
    if re.match(r"^(page \d+|©|copyright|confidential|all rights reserved|strictly confidential)", stripped.lower()):
        return BlockType.FOOTER
    if re.match(r"^\d+\s*of\s*\d+$", stripped.lower()):
        return BlockType.FOOTER

    # Sub-content indicators: bullet points, list items, footnotes
    if re.match(r"^([•\-*]|(\d+|[a-zA-Z])[\.\)])\s+", stripped):
        return BlockType.SUB_CONTENT
    if font_size > 0 and font_size < 9.5:
        return BlockType.SUB_CONTENT

    # Markdown style indicators
    if stripped.startswith("# "):
        return BlockType.TITLE
    if stripped.startswith("## "):
        return BlockType.MAIN_HEADING
    if stripped.startswith("### "):
        return BlockType.SUB_HEADING

    # Font size based classification (when font_size is extracted)
    if font_size >= 21:
        return BlockType.TITLE
    if font_size >= 16 and word_count <= HEADING_MAX_WORDS:
        return BlockType.MAIN_HEADING
    if font_size >= 12.5 and (is_bold or word_count <= HEADING_MAX_WORDS):
        return BlockType.SUB_HEADING

    # Fallback heuristics when font size is zero or uniform
    if is_first_block and word_count <= HEADING_MAX_WORDS and not stripped.endswith("."):
        return BlockType.TITLE
    if is_bold and word_count <= HEADING_MAX_WORDS:
        return BlockType.SUB_HEADING
    if word_count <= HEADING_MAX_WORDS and stripped.isupper() and not stripped.endswith("."):
        return BlockType.SUB_HEADING
    if re.match(r"^\d+(\.\d+)*\s+[A-Z]", stripped) and word_count <= HEADING_MAX_WORDS:
        return BlockType.MAIN_HEADING

    return BlockType.BODY


def _new_block(doc_id: str, order: int, btype: BlockType, content: str = "",
               table_data=None, image_url: Optional[str] = None,
               image_metadata: Optional[Dict[str, Any]] = None,
               font_size: Optional[float] = None, page: int = 1, bbox=None,
               confidence: float = 0.95) -> Block:
    return Block(
        id=str(uuid.uuid4()),
        doc_id=doc_id,
        order=order,
        type=btype,
        content=content,
        original_content=content,
        table_data=[[c for c in row] for row in table_data] if table_data else None,
        original_table_data=[[c for c in row] for row in table_data] if table_data else None,
        image_url=image_url,
        image_metadata=image_metadata,
        font_size=font_size,
        page=page,
        bbox=bbox,
        confidence=confidence,
        edited=False,
    )


def _parse_pdf(doc_id: str, file_bytes: bytes) -> List[Block]:
    blocks: List[Block] = []
    order = 0

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page_idx, page in enumerate(pdf.pages, start=1):
            # 1. Native table extraction
            extracted_tables = page.extract_tables() or []
            for table in extracted_tables:
                cleaned = [[(cell or "").strip() for cell in row] for row in table if any(row)]
                if cleaned and len(cleaned) > 0:
                    blocks.append(_new_block(
                        doc_id=doc_id,
                        order=order,
                        btype=BlockType.TABLE,
                        content="",
                        table_data=cleaned,
                        page=page_idx,
                        confidence=0.98,
                    ))
                    order += 1

            # 2. Extract embedded images
            if hasattr(page, "images") and page.images:
                for img_idx, img_dict in enumerate(page.images[:3]):  # limit to top embedded images per page
                    try:
                        x0, top, x1, bottom = img_dict["x0"], img_dict["top"], img_dict["x1"], img_dict["bottom"]
                        cropped = page.crop((x0, top, x1, bottom)).to_image()
                        img_buf = io.BytesIO()
                        cropped.original.save(img_buf, format="PNG")
                        b64_str = base64.b64encode(img_buf.getvalue()).decode("utf-8")
                        data_url = f"data:image/png;base64,{b64_str}"

                        blocks.append(_new_block(
                            doc_id=doc_id,
                            order=order,
                            btype=BlockType.IMAGE,
                            content=f"Extracted Image #{img_idx + 1} (Page {page_idx})",
                            image_url=data_url,
                            image_metadata={
                                "width": round(x1 - x0),
                                "height": round(bottom - top),
                                "format": "PNG",
                                "caption": f"Embedded visual element on page {page_idx}",
                            },
                            page=page_idx,
                            confidence=0.99,
                        ))
                        order += 1
                    except Exception:
                        pass

            # 3. Text lines grouped by Y-coordinate and typography size
            words = page.extract_words(extra_attrs=["size", "fontname"]) or []
            lines = {}
            for w in words:
                key = round(w["top"], 0)
                lines.setdefault(key, []).append(w)

            for top in sorted(lines.keys()):
                line_words = lines[top]
                text = " ".join(w["text"] for w in line_words).strip()
                if not text:
                    continue
                avg_size = sum(w["size"] for w in line_words) / len(line_words)
                is_bold = any("bold" in (w.get("fontname") or "").lower() for w in line_words)
                btype = _classify_line(text, avg_size, is_bold, is_first_block=(order == 0))

                blocks.append(_new_block(
                    doc_id=doc_id,
                    order=order,
                    btype=btype,
                    content=text,
                    font_size=round(avg_size, 1),
                    page=page_idx,
                    confidence=0.94,
                ))
                order += 1

    return blocks if blocks else [_new_block(doc_id, 0, BlockType.BODY, "No extractable text found in PDF.")]


def _parse_docx(doc_id: str, file_bytes: bytes) -> List[Block]:
    blocks: List[Block] = []
    order = 0
    document = python_docx.Document(io.BytesIO(file_bytes))

    # 1. Extract embedded images from Word document package
    try:
        img_counter = 1
        for part in document.part.related_parts.values():
            if "image" in part.content_type:
                img_data = part.blob
                b64_str = base64.b64encode(img_data).decode("utf-8")
                mime = part.content_type
                data_url = f"data:{mime};base64,{b64_str}"

                blocks.append(_new_block(
                    doc_id=doc_id,
                    order=order,
                    btype=BlockType.IMAGE,
                    content=f"Embedded Word Figure #{img_counter}",
                    image_url=data_url,
                    image_metadata={
                        "format": mime.split("/")[-1].upper(),
                        "size_kb": round(len(img_data) / 1024, 1),
                        "caption": f"Document illustration #{img_counter}",
                    },
                    confidence=0.99,
                ))
                order += 1
                img_counter += 1
    except Exception:
        pass

    # 2. Walk paragraphs and tables in document order
    body = document.element.body
    para_map = {p._p: p for p in document.paragraphs}
    table_map = {t._tbl: t for t in document.tables}

    for child in body.iterchildren():
        if child in para_map:
            para = para_map[child]
            text = para.text.strip()
            if not text:
                continue

            style = (para.style.name or "").lower()
            is_bold = any(run.bold for run in para.runs) if para.runs else False

            # Extract font size if present
            font_size = None
            if para.runs and para.runs[0].font.size:
                font_size = para.runs[0].font.size.pt

            if "title" in style:
                btype = BlockType.TITLE
            elif "heading 1" in style:
                btype = BlockType.MAIN_HEADING
            elif "heading 2" in style:
                btype = BlockType.SUB_HEADING
            elif "heading" in style:
                btype = BlockType.SUB_HEADING
            elif "bullet" in style or "list" in style:
                btype = BlockType.SUB_CONTENT
            else:
                btype = _classify_line(text, font_size or 0, is_bold=is_bold, is_first_block=(order == 0))

            blocks.append(_new_block(
                doc_id=doc_id,
                order=order,
                btype=btype,
                content=text,
                font_size=round(font_size, 1) if font_size else None,
                confidence=0.96,
            ))
            order += 1

        elif child in table_map:
            table = table_map[child]
            grid = [[cell.text.strip() for cell in row.cells] for row in table.rows]
            if grid:
                blocks.append(_new_block(doc_id, order, BlockType.TABLE, "", table_data=grid, confidence=0.99))
                order += 1

    return blocks if blocks else [_new_block(doc_id, 0, BlockType.BODY, "Empty Word document.")]


def _parse_image(doc_id: str, file_bytes: bytes) -> List[Block]:
    """
    Image ingestion path:
    1. Extracts and shows the uploaded image separately as an IMAGE block with base64 data preview.
    2. Performs OCR and splits all detected text lines into Title, Headings, Sub-headings, Body, Sub-content based on bounding box height!
    """
    blocks: List[Block] = []
    order = 0

    image = Image.open(io.BytesIO(file_bytes))
    img_format = (image.format or "PNG").lower()
    b64_str = base64.b64encode(file_bytes).decode("utf-8")
    data_url = f"data:image/{img_format};base64,{b64_str}"

    # 1. Standalone extracted visual image block
    blocks.append(_new_block(
        doc_id=doc_id,
        order=order,
        btype=BlockType.IMAGE,
        content=f"Visual Image Source ({image.width} × {image.height} px)",
        image_url=data_url,
        image_metadata={
            "width": image.width,
            "height": image.height,
            "format": img_format.upper(),
            "size_kb": round(len(file_bytes) / 1024, 1),
            "caption": "Full extracted visual document asset",
        },
        confidence=1.0,
    ))
    order += 1

    # 2. OCR Text extraction and font-size/bounding height classification
    if pytesseract is None:
        blocks.append(_new_block(
            doc_id,
            order,
            BlockType.BODY,
            "Visual image extracted successfully. (pytesseract OCR binary is optional for scanned text transcription)",
            confidence=0.8,
        ))
        return blocks

    try:
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        lines = {}
        n = len(data.get("text", []))

        for i in range(n):
            text = (data["text"][i] or "").strip()
            if not text:
                continue
            line_key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
            lines.setdefault(line_key, {"words": [], "height": data["height"][i]})
            lines[line_key]["words"].append(text)

        # Classify lines by bounding box height (proxy for font size)
        for key, line in lines.items():
            text = " ".join(line["words"]).strip()
            if not text:
                continue
            box_height = line["height"]
            btype = _classify_line(text, font_size=box_height, is_first_block=(order == 1))
            blocks.append(_new_block(
                doc_id=doc_id,
                order=order,
                btype=btype,
                content=text,
                font_size=float(box_height),
                confidence=0.88,
            ))
            order += 1

    except Exception as e:
        blocks.append(_new_block(doc_id, order, BlockType.BODY, f"Visual asset extracted. OCR note: {e}"))

    return blocks


def _parse_text(doc_id: str, file_bytes: bytes) -> List[Block]:
    """Parses raw text or Markdown, classifying titles, headings, body, sub-contents, and tables."""
    raw_text = file_bytes.decode("utf-8", errors="ignore")
    lines = raw_text.splitlines()

    blocks: List[Block] = []
    order = 0
    i = 0
    n = len(lines)

    while i < n:
        line = lines[i].strip()
        if not line:
            i += 1
            continue

        # Markdown Table Detection
        if line.startswith("|") and line.endswith("|"):
            table_rows = []
            while i < n and lines[i].strip().startswith("|") and lines[i].strip().endswith("|"):
                row_raw = lines[i].strip()
                if not re.match(r"^\|(\s*:?-+:?\s*\|)+$", row_raw):
                    cells = [c.strip() for c in row_raw.split("|")[1:-1]]
                    table_rows.append(cells)
                i += 1

            if table_rows:
                blocks.append(_new_block(
                    doc_id=doc_id,
                    order=order,
                    btype=BlockType.TABLE,
                    content="",
                    table_data=table_rows,
                    confidence=0.98,
                ))
                order += 1
            continue

        # Hierarchy classification
        font_size = None
        if line.startswith("# "):
            btype = BlockType.TITLE
            clean_content = line[2:].strip()
            font_size = 24.0
        elif line.startswith("## "):
            btype = BlockType.MAIN_HEADING
            clean_content = line[3:].strip()
            font_size = 18.0
        elif line.startswith("### "):
            btype = BlockType.SUB_HEADING
            clean_content = line[4:].strip()
            font_size = 14.0
        elif re.match(r"^([•\-*]|(\d+|[a-zA-Z])[\.\)])\s+", line):
            btype = BlockType.SUB_CONTENT
            clean_content = line
            font_size = 10.5
        else:
            btype = _classify_line(line, is_first_block=(order == 0))
            clean_content = line
            font_size = 11.0

        blocks.append(_new_block(
            doc_id=doc_id,
            order=order,
            btype=btype,
            content=clean_content,
            font_size=font_size,
            confidence=0.95,
        ))
        order += 1
        i += 1

    return blocks if blocks else [_new_block(doc_id, 0, BlockType.BODY, "Empty text document.")]


def parse_document(doc_id: str, filename: str, content_type: str,
                    file_bytes: bytes) -> List[Block]:
    """Unified routing dispatcher based on MIME type and file extension."""
    name = filename.lower()
    if content_type == "application/pdf" or name.endswith(".pdf"):
        return _parse_pdf(doc_id, file_bytes)
    if name.endswith(".docx") or "officedocument.wordprocessingml" in content_type:
        return _parse_docx(doc_id, file_bytes)
    if content_type.startswith("image/") or any(name.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".tiff", ".bmp"]):
        return _parse_image(doc_id, file_bytes)
    if content_type.startswith("text/") or name.endswith(".txt") or name.endswith(".md"):
        return _parse_text(doc_id, file_bytes)

    return _parse_text(doc_id, file_bytes)
