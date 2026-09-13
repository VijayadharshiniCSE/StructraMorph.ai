"""
main.py — StructraMorph.ai Backend API Service
Enterprise document segmentation, surgical AI transformations, and multi-format recompilation.
"""
import io
import uuid
from typing import Dict, List

import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse

from .models import (
    Block, Document, UploadResponse, BlockUpdateRequest,
    AIRewriteRequest, AIRewriteResponse, ExportRequest, PasteRequest, BlockType
)
from .parser_service import parse_document, _parse_text
from .ai_service import rewrite_block
from .export_service import export_to_docx, export_to_pdf, export_to_txt, export_to_markdown
from .sample_data import SAMPLE_DOCUMENTS

# Ensure background images are copied to frontend/public for local serving
USER_UPLOADED_DIR = r"C:\Users\USER\.gemini\antigravity-ide\brain\841e17ea-458a-42f5-8775-5c613db301fb\.user_uploaded"
FRONTEND_PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public"))
try:
    os.makedirs(FRONTEND_PUBLIC_DIR, exist_ok=True)
    # media_1789293593817.png is the dark futuristic runway with orange/cyan lights
    dark_src = os.path.join(USER_UPLOADED_DIR, "media_1789293593817.png")
    dark_dst = os.path.join(FRONTEND_PUBLIC_DIR, "bg-dark.png")
    if not os.path.exists(dark_dst) and os.path.exists(dark_src):
        shutil.copyfile(dark_src, dark_dst)

    # media_1789293593825.png is the light ethereal pastel prism ribbons
    light_src = os.path.join(USER_UPLOADED_DIR, "media_1789293593825.png")
    light_dst = os.path.join(FRONTEND_PUBLIC_DIR, "bg-light.png")
    if not os.path.exists(light_dst) and os.path.exists(light_src):
        shutil.copyfile(light_src, light_dst)

    # media_1789293949992.png is the circular multicolored brand hub logo
    logo_src = os.path.join(USER_UPLOADED_DIR, "media_1789293949992.png")
    logo_dst = os.path.join(FRONTEND_PUBLIC_DIR, "logo.png")
    if not os.path.exists(logo_dst) and os.path.exists(logo_src):
        shutil.copyfile(logo_src, logo_dst)
except Exception as e:
    print(f"Notice: background assets sync: {e}")

app = FastAPI(
    title="StructraMorph.ai API",
    description="Precision Document Parsing, Semantic Classification, and Surgical AI Transformation Engine",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Allow local dev and production frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/assets/bg-dark.png")
def get_bg_dark():
    path = os.path.join(FRONTEND_PUBLIC_DIR, "bg-dark.png")
    if not os.path.exists(path):
        dark_src = os.path.join(USER_UPLOADED_DIR, "media_1789293593817.png")
        if os.path.exists(dark_src):
            return FileResponse(dark_src, media_type="image/png")
        raise HTTPException(status_code=404, detail="Dark background image not found")
    return FileResponse(path, media_type="image/png")

@app.get("/api/assets/bg-light.png")
def get_bg_light():
    path = os.path.join(FRONTEND_PUBLIC_DIR, "bg-light.png")
    if not os.path.exists(path):
        light_src = os.path.join(USER_UPLOADED_DIR, "media_1789293593825.png")
        if os.path.exists(light_src):
            return FileResponse(light_src, media_type="image/png")
        raise HTTPException(status_code=404, detail="Light background image not found")
    return FileResponse(path, media_type="image/png")

@app.get("/api/assets/logo.png")
def get_logo():
    path = os.path.join(FRONTEND_PUBLIC_DIR, "logo.png")
    if not os.path.exists(path):
        logo_src = os.path.join(USER_UPLOADED_DIR, "media_1789293949992.png")
        if os.path.exists(logo_src):
            return FileResponse(logo_src, media_type="image/png")
        raise HTTPException(status_code=404, detail="Logo image not found")
    return FileResponse(path, media_type="image/png")

# In-memory document & block stores
STORE: Dict[str, Document] = {}
BLOCKS: Dict[str, List[Block]] = {}


def _get_doc_or_404(doc_id: str) -> Document:
    doc = STORE.get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


def _get_block_or_404(doc_id: str, block_id: str) -> Block:
    _get_doc_or_404(doc_id)
    for b in BLOCKS.get(doc_id, []):
        if b.id == block_id:
            return b
    raise HTTPException(status_code=404, detail="Block not found")


# --- Endpoints ---------------------------------------------------------------

@app.post("/api/documents/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    doc_id = str(uuid.uuid4())
    doc = Document(
        id=doc_id,
        filename=file.filename or "Uploaded_Document",
        content_type=file.content_type or "application/octet-stream",
        status="parsing",
    )
    STORE[doc_id] = doc

    try:
        blocks = parse_document(doc_id, doc.filename, doc.content_type, file_bytes)
    except ValueError as e:
        doc.status = "failed"
        raise HTTPException(status_code=415, detail=str(e))
    except Exception as e:
        doc.status = "failed"
        raise HTTPException(status_code=500, detail=f"Document parsing failure: {e}")

    BLOCKS[doc_id] = blocks
    doc.status = "parsed"
    doc.page_count = max((b.page or 1 for b in blocks), default=1)

    return UploadResponse(document=doc, blocks=blocks)


@app.post("/api/documents/paste", response_model=UploadResponse)
def paste_document(req: PasteRequest):
    """Ingests raw text or markdown directly and segments into blocks."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Pasted text cannot be empty.")

    doc_id = str(uuid.uuid4())
    filename = f"{req.title or 'Pasted_Document'}.txt"
    doc = Document(
        id=doc_id,
        filename=filename,
        content_type="text/plain",
        status="parsing",
    )
    STORE[doc_id] = doc

    blocks = _parse_text(doc_id, req.text.encode("utf-8"))
    BLOCKS[doc_id] = blocks
    doc.status = "parsed"
    doc.page_count = 1

    return UploadResponse(document=doc, blocks=blocks)


@app.post("/api/documents/sample/{sample_id}", response_model=UploadResponse)
def load_sample_document(sample_id: str):
    """Loads a high-fidelity pre-configured sample document for instant evaluation."""
    sample = SAMPLE_DOCUMENTS.get(sample_id)
    if not sample:
        # Default to architecture if not matched
        sample = SAMPLE_DOCUMENTS["architecture"]

    doc_template, blocks_template = sample

    # Deep clone with a fresh doc_id so edits don't mutate template
    new_doc_id = str(uuid.uuid4())
    doc = Document(
        id=new_doc_id,
        filename=doc_template.filename,
        content_type=doc_template.content_type,
        page_count=doc_template.page_count,
        status="parsed",
    )
    STORE[new_doc_id] = doc

    new_blocks: List[Block] = []
    for b in blocks_template:
        cloned = Block(
            id=str(uuid.uuid4()),
            doc_id=new_doc_id,
            order=b.order,
            type=b.type,
            content=b.content,
            original_content=b.original_content,
            table_data=[row[:] for row in b.table_data] if b.table_data else None,
            original_table_data=[row[:] for row in b.original_table_data] if b.original_table_data else None,
            image_url=b.image_url,
            image_metadata=b.image_metadata.copy() if b.image_metadata else None,
            font_size=b.font_size,
            page=b.page,
            confidence=b.confidence,
            edited=False,
        )
        new_blocks.append(cloned)

    BLOCKS[new_doc_id] = new_blocks
    return UploadResponse(document=doc, blocks=new_blocks)


@app.get("/api/documents/{doc_id}/blocks", response_model=List[Block])
def get_blocks(doc_id: str):
    _get_doc_or_404(doc_id)
    return sorted(BLOCKS.get(doc_id, []), key=lambda b: b.order)


@app.patch("/api/documents/{doc_id}/blocks/{block_id}", response_model=Block)
def update_block(doc_id: str, block_id: str, update: BlockUpdateRequest):
    block = _get_block_or_404(doc_id, block_id)
    if update.type is not None:
        block.type = update.type
    if update.content is not None:
        block.content = update.content
    if update.table_data is not None:
        block.table_data = update.table_data
    block.edited = True
    return block


@app.post("/api/documents/{doc_id}/blocks/{block_id}/reset", response_model=Block)
def reset_block(doc_id: str, block_id: str):
    """Reverts a single block back to its pristine original extraction state."""
    block = _get_block_or_404(doc_id, block_id)
    if block.original_content is not None:
        block.content = block.original_content
    if block.original_table_data is not None:
        block.table_data = [row[:] for row in block.original_table_data]
    block.edited = False
    return block


@app.post("/api/documents/{doc_id}/reset", response_model=List[Block])
def reset_document(doc_id: str):
    """Reverts all blocks in the document back to their original extraction states."""
    _get_doc_or_404(doc_id)
    blocks = BLOCKS.get(doc_id, [])
    for block in blocks:
        if block.original_content is not None:
            block.content = block.original_content
        if block.original_table_data is not None:
            block.table_data = [row[:] for row in block.original_table_data]
        block.edited = False
    return sorted(blocks, key=lambda b: b.order)


@app.post("/api/documents/{doc_id}/blocks/{block_id}/ai-rewrite",
          response_model=AIRewriteResponse)
def ai_rewrite(doc_id: str, block_id: str, req: AIRewriteRequest):
    block = _get_block_or_404(doc_id, block_id)
    suggestion, diff_stats = rewrite_block(
        content=block.content,
        instruction=req.instruction,
        tone=req.tone,
        target_language=req.target_language,
        table_data=block.table_data,
    )
    return AIRewriteResponse(
        block_id=block_id,
        original_content=block.content if block.table_data is None else block.table_data,
        suggested_content=suggestion,
        diff_stats=diff_stats,
    )


@app.delete("/api/documents/{doc_id}/blocks/{block_id}")
def delete_block(doc_id: str, block_id: str):
    _get_doc_or_404(doc_id)
    BLOCKS[doc_id] = [b for b in BLOCKS[doc_id] if b.id != block_id]
    # Re-normalize ordering
    for i, b in enumerate(BLOCKS[doc_id]):
        b.order = i
    return {"deleted": block_id}


@app.post("/api/documents/{doc_id}/blocks/{block_id}/split")
def split_block(doc_id: str, block_id: str):
    """Splits a single block into two semantic blocks at the midpoint."""
    block = _get_block_or_404(doc_id, block_id)
    words = block.content.split()
    mid = len(words) // 2
    if mid == 0:
        raise HTTPException(status_code=400, detail="Block text too concise to split.")

    block.content = " ".join(words[:mid])
    block.edited = True

    new_block = Block(
        id=str(uuid.uuid4()),
        doc_id=doc_id,
        order=block.order + 0.5,
        type=block.type,
        content=" ".join(words[mid:]),
        original_content=" ".join(words[mid:]),
        page=block.page,
        confidence=block.confidence,
        edited=True,
    )
    BLOCKS[doc_id].append(new_block)
    BLOCKS[doc_id].sort(key=lambda b: b.order)
    for i, b in enumerate(BLOCKS[doc_id]):
        b.order = i
    return {"blocks": BLOCKS[doc_id]}


@app.post("/api/export")
def export_document(req: ExportRequest):
    _get_doc_or_404(req.doc_id)
    blocks = BLOCKS.get(req.doc_id, [])
    doc = STORE[req.doc_id]
    base_name = doc.filename.rsplit(".", 1)[0]
    fmt = req.format.lower()

    if fmt == "docx":
        data = export_to_docx(blocks)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = f"{base_name}_surgical.docx"
    elif fmt == "pdf":
        data = export_to_pdf(blocks, doc_title=doc.filename)
        media_type = "application/pdf"
        filename = f"{base_name}_surgical.pdf"
    elif fmt == "md" or fmt == "markdown":
        data = export_to_markdown(blocks)
        media_type = "text/markdown"
        filename = f"{base_name}_surgical.md"
    elif fmt == "txt":
        data = export_to_txt(blocks)
        media_type = "text/plain"
        filename = f"{base_name}_surgical.txt"
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{req.format}'. Supported: pdf, docx, txt, md"
        )

    return StreamingResponse(
        io.BytesIO(data),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "DocSurgical AI",
        "version": "2.0.0",
        "active_documents": len(STORE),
    }
