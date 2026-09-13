"""
Pydantic schemas for DocSurgical AI.
Shared across backend endpoints and mapped to TypeScript models on the frontend.
"""
from enum import Enum
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class BlockType(str, Enum):
    TITLE = "title"
    HEADING = "heading"
    MAIN_HEADING = "main_heading"
    SUBHEADING = "subheading"
    SUB_HEADING = "sub_heading"
    BODY = "body"
    SUB_CONTENT = "sub_content"
    FOOTER = "footer"
    TABLE = "table"
    IMAGE = "image"


class BoundingBox(BaseModel):
    page: int
    x0: float
    y0: float
    x1: float
    y1: float


class TableCell(BaseModel):
    row: int
    col: int
    text: str


class Block(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doc_id: str
    order: int
    type: BlockType
    content: str = ""                       # text content for headings/body/footer/title
    original_content: Optional[str] = None  # retained for live diff and block reset
    table_data: Optional[List[List[str]]] = None   # 2D array when type == TABLE
    original_table_data: Optional[List[List[str]]] = None  # retained for live diff & reset
    image_url: Optional[str] = None         # data URL or path when type == IMAGE
    image_metadata: Optional[Dict[str, Any]] = None # {width, height, format, size_kb, caption}
    font_size: Optional[float] = None       # detected typographical font size in pt
    bbox: Optional[BoundingBox] = None
    page: Optional[int] = 1
    confidence: Optional[float] = 0.95      # segmentation confidence score (0-1)
    edited: bool = False


class Document(BaseModel):
    id: str
    filename: str
    content_type: str
    page_count: Optional[int] = 1
    status: str = "parsed"                  # uploading | parsing | parsed | failed
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class UploadResponse(BaseModel):
    document: Document
    blocks: List[Block]


class PasteRequest(BaseModel):
    title: Optional[str] = "Pasted Document"
    text: str


class BlockUpdateRequest(BaseModel):
    type: Optional[BlockType] = None
    content: Optional[str] = None
    table_data: Optional[List[List[str]]] = None


class AIRewriteRequest(BaseModel):
    instruction: str                   # e.g. "Make professional", "Summarize", "Fix grammar"
    tone: Optional[str] = None
    target_language: Optional[str] = None


class AIRewriteResponse(BaseModel):
    block_id: str
    original_content: Any
    suggested_content: Any             # str for text blocks, List[List[str]] for tables
    diff_stats: Optional[Dict[str, int]] = None


class ExportRequest(BaseModel):
    doc_id: str
    format: str = "docx"               # docx | pdf | txt | md
