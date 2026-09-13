import { NextRequest, NextResponse } from "next/server";
import { docStore, exportDocumentClient } from "@/lib/clientEngine";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { doc_id, format } = body;

  // Try forwarding to FastAPI backend if available
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const res = await fetch("http://localhost:8000/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc_id, format }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const blob = await res.blob();
      return new NextResponse(blob, {
        headers: {
          "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
          "Content-Disposition": res.headers.get("Content-Disposition") || `attachment; filename="export.${format}"`,
        },
      });
    }
  } catch {}

  const entry = docStore.get(doc_id);
  const blob = exportDocumentClient(entry ? entry.blocks : [], format || "txt");
  return new NextResponse(blob, {
    headers: {
      "Content-Type": blob.type,
      "Content-Disposition": `attachment; filename="export.${format}"`,
    },
  });
}
