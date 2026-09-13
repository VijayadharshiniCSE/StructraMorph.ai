import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const USER_DIR = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\841e17ea-458a-42f5-8775-5c613db301fb\\.user_uploaded";

const FILE_MAP: Record<string, string> = {
  "logo.png": "media_1789293949992.png",
  "bg-dark.png": "media_1789293593817.png",
  "bg-light.png": "media_1789293593825.png",
};

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;

  // 1. Check frontend/public
  const publicPath = path.join(process.cwd(), "public", filename);
  if (fs.existsSync(publicPath)) {
    const buffer = fs.readFileSync(publicPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // 2. Check user uploads dir
  const mapped = FILE_MAP[filename];
  if (mapped) {
    const userPath = path.join(USER_DIR, mapped);
    if (fs.existsSync(userPath)) {
      const buffer = fs.readFileSync(userPath);
      // Auto save to public for future requests
      try {
        const pDir = path.join(process.cwd(), "public");
        if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });
        fs.writeFileSync(publicPath, buffer);
      } catch {}

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  }

  return new NextResponse("Asset not found", { status: 404 });
}
