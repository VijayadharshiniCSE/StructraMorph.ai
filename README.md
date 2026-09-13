# StructraMorph.ai ⚡
> **Autonomous Document Component Deconstruction, Block-Level Surgical AI Transformations, and Native Vector Recompilation.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-000000?logo=next.js)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Design-Tailwind%20CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Languages](https://img.shields.io/badge/Languages-13%20Multilingual%20(incl.%20Tamil)-8B5CF6)](https://github.com)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://python.org)

StructraMorph.ai is an enterprise-grade document engineering platform that parses unstructured and multi-modal documents (Adobe PDF, Word `.docx`, scanned OCR imagery, and raw text/Markdown) into a structured semantic component graph (**Titles**, **Main Headings**, **Sub-headings**, **Body Paragraphs**, **Sub-contents/Bullets**, **Tabulations/Tables**, **Extracted Images**, and **Footers**).

Unlike monolithic LLM summarizers that suffer from hallucinations, high token costs, and destroyed formatting, StructraMorph.ai treats documents as addressable component trees. Users can isolate single blocks, apply surgical AI transforms (e.g., *Make Professional*, *Summarize*, *Fix Grammar*, *Convert to Bullets*, or custom prompt mutations), inspect real-time word-level diffs, interactively edit spreadsheets, and re-export into native **PDF** and **Word (.docx)** files.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      StructraMorph.ai Frontend                          │
│                      (Next.js 14 + Tailwind CSS)                        │
│                                                                         │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐  │
│  │     UploadZone        │  │              Workspace                 │  │
│  │ - Drag & Drop PDF/DOC │  │  ┌────────────────┐ ┌────────────────┐ │  │
│  │ - Text / MD Paste Tab │  │  │   BlockList    │ │  EditorPanel   │ │  │
│  │ - 1-Click Sample Demos│  │  │ - Live Search  │ │ - Inline Edit  │ │  │
│  └───────────────────────┘  │  │ - Filter Chips │ │ - AI Toolkit   │ │  │
│                             │  │ - Type Badges  │ │ - DiffViewer   │ │  │
│                             │  └────────────────┘ │ - Tabulation   │ │  │
│                             │                     └────────────────┘ │  │
│                             └────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │  REST / JSON
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       FastAPI Backend Services                          │
│                                                                         │
│  ┌───────────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   parser_service.py   │  │  ai_service.py   │  │export_service.py │  │
│  │ - pdfplumber (PDF)    │  │ - Dual Engine    │  │ - ReportLab PDF  │  │
│  │ - python-docx (DOCX)  │  │ - Smart Heuristic│  │ - python-docx    │  │
│  │ - pytesseract (OCR)   │  │ - Cloud LLM      │  │ - Markdown / TXT │  │
│  │ - Markdown Tables     │  │ - Diff Stats     │  │                  │  │
│  └───────────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Features

### 🧩 1. Font-Size Hierarchical Segmentation & Image Extraction
- **Automatic Font-Size Hierarchy:**
  - 👑 **Document Titles:** Dominant typographical font size (`font_size >= 21pt` or prominent first block).
  - 📌 **Main Headings (H1):** Primary section headers (`font_size >= 16pt` to `20pt`).
  - 📑 **Sub-Headings / Sub-Titles (H2):** Secondary section dividers (`font_size >= 12.5pt` to `15.5pt` or bold).
  - 📄 **Main Contents (Body):** Standard narrative paragraphs (`font_size ~10pt` to `12pt`).
  - 📋 **Sub-Contents:** Bulleted lists (`•`, `-`), numbered sequences (`1.`, `a)`), captions, footnotes, and fine print (`font_size < 9.5pt`).
  - 📊 **Tabulations:** 2D extracted spreadsheet matrices with editable cells, row/column operations, and CSV download.
  - 🖼️ **Extracted Images:** Embedded or uploaded visual figures extracted and displayed separately with high-resolution preview, metadata, zoom, and download.
  - 🔖 **Footers:** Bottom margin references, page numbers, and copyright statements.
- **Image-to-Tree Extraction:** When an image is added, the system isolates the visual asset as a dedicated figure block while simultaneously running OCR to categorize its text lines by bounding-box height.
- **Original Content Retention:** Every block retains its `original_content` and `original_table_data` for live visual diffing and lossless resets.
- **Direct Paste Mode:** Instant ingestion for contracts, executive memos, or markdown without needing a local file.
- **1-Click Portfolio Demos:** Immediate evaluation with pre-configured samples (*Architecture Whitepaper* and *Financial Tabulation Review*).

### ⚡ 2. Dual-Engine Surgical AI Pipeline
- **Autonomous Smart Transformer:** Built-in heuristic NLP engine performing authentic mutations (*Make Professional*, *Summarize*, *Fix Grammar*, *Convert to Bullets*, *Simplify Jargon*) out of the box with zero external API dependencies.
- **Pluggable Cloud LLMs:** Seamlessly connects to OpenAI (`gpt-4o-mini`, `gpt-4o`), Gemini, or Anthropic when an API key is configured.
- **Safety Previews:** AI mutations generate a structured proposal card with a live diff; changes are only committed when the user explicitly clicks **Accept Mutation**.

### 🔍 3. Live Diff Viewer
- **Word-Level Visual Diff:** Real-time Myers/LCS diff algorithm highlighting additions in surgical emerald (`+ green`) and removals in laser rose (`- red`).
- **Flexible Modes:** Toggle seamlessly between **Inline Unified Diff** and **Side-by-Side Comparison**.
- **Change Metrics:** Real-time statistics badge displaying word deltas (`+14 words / -6 words`).

### 📊 4. Dedicated Interactive Tabulation Editor
- **Spreadsheet Grid:** Renders extracted tables into an interactive, editable spreadsheet.
- **Row & Column Controls:** Add rows above/below, delete rows, duplicate rows, add columns, delete columns.
- **CSV Export:** Export individual tables as `.csv` with one click.
- **Table AI Operations:** Apply AI summaries or calculations to tabular grids.

### 📥 5. Multi-Format Re-compiler
- **Pure-Python PDF Generation:** Native, vector-rendered PDFs via ReportLab with custom typography, headers, alternating table fills, and footers.
- **Word (.docx) Recompilation:** Clean OpenXML styling with headings, bold titles, and formatted table borders.
- **Markdown & Plain Text:** Clean exports preserving hierarchy and table alignments.
- **Lossless Reset:** Single-block or whole-document revert to original extraction state.

---

## 3. Quick Start & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- *(Optional)* `tesseract-ocr` for scanned image OCR

### Windows (1-Click Start)
Simply run the included batch script:
```cmd
start.bat
```

### Manual Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
API Documentation and OpenAPI Swagger UI will be live at `http://localhost:8000/docs`.

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 4. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Multipart file upload (.pdf, .docx, image, .txt) |
| `POST` | `/api/documents/paste` | Direct text / markdown paste ingestion |
| `POST` | `/api/documents/sample/{id}` | Instant pre-configured sample document loader |
| `GET` | `/api/documents/{doc_id}/blocks` | Retrieve ordered block component tree |
| `PATCH` | `/api/documents/{doc_id}/blocks/{block_id}` | Update content, block type, or table data |
| `POST` | `/api/documents/{doc_id}/blocks/{block_id}/ai-rewrite` | Perform targeted surgical AI mutation |
| `POST` | `/api/documents/{doc_id}/blocks/{block_id}/reset` | Reset block to original extracted content |
| `POST` | `/api/documents/{doc_id}/reset` | Reset all document blocks to original state |
| `DELETE` | `/api/documents/{doc_id}/blocks/{block_id}` | Delete block from document |
| `POST` | `/api/documents/{doc_id}/blocks/{block_id}/split` | Split block at midpoint |
| `POST` | `/api/export` | Recompile document into `pdf`, `docx`, `txt`, or `md` |
| `GET` | `/api/health` | Service health and active document telemetry |

---

## 5. Technology Stack

- **Frontend:** React 18, Next.js 14 (App Router), Tailwind CSS, Lucide React, Framer Motion
- **Backend:** FastAPI, Python 3.10+, Pydantic v2, Uvicorn
- **Document Processing:** `pdfplumber`, `python-docx`, `pytesseract`, `Pillow`
- **Vector PDF & Word Generation:** `reportlab`, `python-docx`
- **AI Integration:** Autonomous Smart NLP Transformer + OpenAI SDK
