import { NextRequest, NextResponse } from "next/server";
import { parseTextContent } from "@/lib/clientEngine";
import { parseDocx } from "@/lib/docxExtractor";
import { parsePdf } from "@/lib/pdfExtractor";

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ detail: "No file uploaded" }, { status: 400 });
  }

  // Try forwarding to FastAPI backend if available
  try {
    const fData = new FormData();
    fData.append("file", file);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch("http://localhost:8000/api/documents/upload", {
      method: "POST",
      body: fData,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  const filename = file.name || "uploaded_document.docx";
  const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // 1. Handle Word DOCX files: extract real text, headings, tables, font sizes, images
  if (/\.docx$/i.test(filename) || file.type.includes("wordprocessingml") || file.type.includes("officedocument")) {
    try {
      const buffer = await file.arrayBuffer();
      const result = await parseDocx(buffer, docId, filename);
      return NextResponse.json({
        document: {
          id: docId,
          filename,
          content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          page_count: 1,
          status: "parsed",
          created_at: new Date().toISOString(),
        },
        blocks: result.blocks,
      });
    } catch (e) {
      console.error("Server-side DOCX parse error:", e);
    }
  }

  // 2. Handle PDF files: extract real text without binary garble
  if (/\.pdf$/i.test(filename) || file.type.includes("pdf")) {
    try {
      const buffer = await file.arrayBuffer();
      const result = await parsePdf(buffer, docId, filename);
      return NextResponse.json({
        document: {
          id: docId,
          filename,
          content_type: "application/pdf",
          page_count: 1,
          status: "parsed",
          created_at: new Date().toISOString(),
        },
        blocks: result.blocks,
      });
    } catch (e) {
      console.error("Server-side PDF parse error:", e);
    }
  }

  // 3. Handle Plain Text / Markdown files (with binary guard)
  try {
    const text = await file.text();
    if (text && text.trim().length > 0 && !text.includes("\0") && !text.startsWith("PK\x03\x04")) {
      const title = filename.replace(/\.[^/.]+$/, "").replace(/[_\-]/g, " ");
      const res = parseTextContent(title, text);
      res.document.filename = filename;
      return NextResponse.json(res);
    }
  } catch {}

  const title = filename.replace(/\.[^/.]+$/, "").replace(/[_\-]/g, " ");
  const fallback = parseTextContent(
    title,
    `# ${title}\n\n## 1. Document Extraction Abstract\nDocument: ${filename}\nStatus: Ingested into StructraMorph.ai.`
  );
  fallback.document.filename = filename;
  return NextResponse.json(fallback);
}
