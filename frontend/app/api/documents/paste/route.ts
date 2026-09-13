import { NextRequest, NextResponse } from "next/server";
import { parseTextContent } from "@/lib/clientEngine";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { title, text } = body;

  // Try forwarding to FastAPI backend if available
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const res = await fetch("http://localhost:8000/api/documents/paste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, text }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  const result = parseTextContent(title || "Pasted Executive Document", text || "");
  return NextResponse.json(result);
}
