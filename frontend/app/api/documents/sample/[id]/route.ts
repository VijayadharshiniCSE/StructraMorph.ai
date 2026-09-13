import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_DOCS } from "@/lib/clientEngine";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sampleId = params.id;

  // Try forwarding to FastAPI backend if available
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const res = await fetch(`http://localhost:8000/api/documents/sample/${sampleId}`, {
      method: "POST",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  // Fallback to embedded sample data
  const sample = SAMPLE_DOCS[sampleId] || SAMPLE_DOCS.architecture;
  const docCopy = {
    ...sample.doc,
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
  const blocksCopy = sample.blocks.map((b) => ({
    ...b,
    doc_id: docCopy.id,
    original_content: b.original_content ?? b.content,
    original_table_data: b.table_data ? b.table_data.map((r) => [...r]) : null,
    edited: false,
  }));

  return NextResponse.json({ document: docCopy, blocks: blocksCopy });
}
