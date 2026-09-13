/**
 * docxExtractor.ts — Universal High-Fidelity DOCX & Office OpenXML Parser
 * Extracts exact text, headings, font sizes, tabular matrices, and embedded images
 * from Microsoft Word (.docx) documents.
 * Works seamlessly in both Node.js and modern browser runtimes with zero external dependencies.
 */

import type { Block, BlockType } from "./api";

// Decode XML entities into readable Unicode characters
function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

/**
 * Universal ZIP Inflater:
 * Uses node:zlib if running in Node.js, or browser DecompressionStream if running client-side.
 */
async function inflateRaw(compressedData: Uint8Array): Promise<Uint8Array> {
  // 1. Node.js environment
  if (typeof process !== "undefined" && process.versions && process.versions.node) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const zlib = require("zlib");
      const buf = zlib.inflateRawSync(Buffer.from(compressedData.buffer, compressedData.byteOffset, compressedData.byteLength));
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    } catch (err) {
      // try standard inflate
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const zlib = require("zlib");
        const buf = zlib.inflateSync(Buffer.from(compressedData.buffer, compressedData.byteOffset, compressedData.byteLength));
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      } catch {}
    }
  }

  // 2. Modern Browser DecompressionStream
  if (typeof DecompressionStream !== "undefined") {
    try {
      const ds = new DecompressionStream("deflate-raw");
      const writer = ds.writable.getWriter();
      writer.write(compressedData);
      writer.close();

      const reader = ds.readable.getReader();
      const chunks: Uint8Array[] = [];
      let totalLen = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          totalLen += value.byteLength;
        }
      }
      const merged = new Uint8Array(totalLen);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return merged;
    } catch (e) {
      console.warn("Browser DecompressionStream failed, attempting fallback:", e);
    }
  }

  throw new Error("Unable to decompress DEFLATE stream in current environment");
}

interface ZipEntry {
  filename: string;
  data: Uint8Array;
}

/**
 * Parses all entries from a standard PKZip / DOCX file buffer.
 */
async function extractZipEntries(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const entries = new Map<string, Uint8Array>();
  const len = bytes.length;

  // Search backwards for End of Central Directory (EOCD): 0x06054b50
  let eocdOffset = -1;
  for (let i = len - 22; i >= Math.max(0, len - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset !== -1) {
    const cdEntriesCount = view.getUint16(eocdOffset + 10, true);
    const cdOffset = view.getUint32(eocdOffset + 16, true);

    let curCd = cdOffset;
    for (let i = 0; i < cdEntriesCount && curCd + 46 <= len; i++) {
      if (view.getUint32(curCd, true) !== 0x02014b50) break;

      const method = view.getUint16(curCd + 10, true);
      const compSize = view.getUint32(curCd + 20, true);
      const fnameLen = view.getUint16(curCd + 28, true);
      const extraLen = view.getUint16(curCd + 30, true);
      const commentLen = view.getUint16(curCd + 32, true);
      const localHeaderOffset = view.getUint32(curCd + 42, true);

      const filenameBytes = bytes.subarray(curCd + 46, curCd + 46 + fnameLen);
      const filename = new TextDecoder("utf-8").decode(filenameBytes);

      curCd += 46 + fnameLen + extraLen + commentLen;

      if (localHeaderOffset + 30 <= len && view.getUint32(localHeaderOffset, true) === 0x04034b50) {
        const localFnameLen = view.getUint16(localHeaderOffset + 26, true);
        const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
        const dataStart = localHeaderOffset + 30 + localFnameLen + localExtraLen;
        const compressedSlice = bytes.subarray(dataStart, dataStart + compSize);

        if (method === 8) {
          try {
            const decompressed = await inflateRaw(compressedSlice);
            entries.set(filename, decompressed);
          } catch (err) {
            console.warn(`Could not inflate ${filename}:`, err);
          }
        } else if (method === 0) {
          entries.set(filename, compressedSlice);
        }
      }
    }
  }

  // If central directory search failed, scan forward for local headers (0x04034b50)
  if (entries.size === 0) {
    let offset = 0;
    while (offset + 30 <= len) {
      if (view.getUint32(offset, true) !== 0x04034b50) {
        offset++;
        continue;
      }
      const method = view.getUint16(offset + 8, true);
      const compSize = view.getUint32(offset + 18, true);
      const fnameLen = view.getUint16(offset + 26, true);
      const extraLen = view.getUint16(offset + 28, true);

      const filenameBytes = bytes.subarray(offset + 30, offset + 30 + fnameLen);
      const filename = new TextDecoder("utf-8").decode(filenameBytes);
      const dataStart = offset + 30 + fnameLen + extraLen;

      if (compSize > 0 && dataStart + compSize <= len) {
        const compressedSlice = bytes.subarray(dataStart, dataStart + compSize);
        if (method === 8) {
          try {
            const decompressed = await inflateRaw(compressedSlice);
            entries.set(filename, decompressed);
          } catch {}
        } else if (method === 0) {
          entries.set(filename, compressedSlice);
        }
        offset = dataStart + compSize;
      } else {
        offset += 30 + fnameLen + extraLen;
      }
    }
  }

  return entries;
}

/**
 * Converts a raw image byte array into a Base64 Data URL.
 */
function toBase64DataUrl(data: Uint8Array, filename: string): string {
  let mime = "image/png";
  if (/\.jpe?g$/i.test(filename)) mime = "image/jpeg";
  else if (/\.gif$/i.test(filename)) mime = "image/gif";
  else if (/\.webp$/i.test(filename)) mime = "image/webp";
  else if (/\.svg$/i.test(filename)) mime = "image/svg+xml";

  let binary = "";
  const len = data.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(data[i]);
  }
  const base64 = typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(data).toString("base64");
  return `data:${mime};base64,${base64}`;
}

export interface DocxParseResult {
  title: string;
  blocks: Block[];
}

/**
 * Parses a Word .docx ArrayBuffer into structured component blocks
 * with typography-based font sizes, hierarchy classification, tables, and images.
 */
export async function parseDocx(
  buffer: ArrayBuffer,
  docId: string,
  filename: string
): Promise<DocxParseResult> {
  const entries = await extractZipEntries(buffer);
  const docXmlBytes = entries.get("word/document.xml");

  if (!docXmlBytes) {
    throw new Error("Invalid Word document: word/document.xml not found inside ZIP archive.");
  }

  const xmlText = new TextDecoder("utf-8").decode(docXmlBytes);
  const blocks: Block[] = [];
  let order = 0;

  // 1. Extract and preserve any embedded images in word/media/
  const mediaBlocks: Block[] = [];
  let imageCounter = 1;
  for (const [entryName, entryBytes] of entries.entries()) {
    if (entryName.startsWith("word/media/") && entryBytes.length > 200) {
      const dataUrl = toBase64DataUrl(entryBytes, entryName);
      const imgName = entryName.split("/").pop() || `Image_${imageCounter}`;
      mediaBlocks.push({
        id: `block-${docId}-img-${imageCounter}`,
        doc_id: docId,
        order: 0, // will be assigned
        type: "image",
        content: `Figure ${imageCounter}: ${imgName.replace(/\.[^/.]+$/, "")}`,
        original_content: `Figure ${imageCounter}: ${imgName.replace(/\.[^/.]+$/, "")}`,
        image_url: dataUrl,
        image_metadata: {
          filename: imgName,
          size_kb: Math.round(entryBytes.length / 102.4) / 10,
          format: imgName.split(".").pop()?.toUpperCase() || "PNG",
          caption: `Extracted visual figure from ${filename}`,
        },
        page: 1,
        confidence: 1.0,
        edited: false,
      });
      imageCounter++;
    }
  }

  // 2. Parse XML elements preserving sequence: paragraphs (<w:p>) and tables (<w:tbl>)
  // Match each <w:tbl>...</w:tbl> or <w:p>...</w:p> in sequential order
  const elementRegex = /<(w:tbl|w:p)[\s>][\s\S]*?<\/\1>/g;
  let match: RegExpExecArray | null;

  let docTitleCandidate = "";

  while ((match = elementRegex.exec(xmlText)) !== null) {
    const rawTag = match[1];
    const rawXml = match[0];

    // Handle Tables (<w:tbl>)
    if (rawTag === "w:tbl") {
      const tableRows: string[][] = [];
      const trRegex = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
      let trMatch: RegExpExecArray | null;

      while ((trMatch = trRegex.exec(rawXml)) !== null) {
        const rowCells: string[] = [];
        const tcRegex = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
        let tcMatch: RegExpExecArray | null;

        while ((tcMatch = tcRegex.exec(trMatch[0])) !== null) {
          const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
          let tMatch: RegExpExecArray | null;
          let cellText = "";
          while ((tMatch = tRegex.exec(tcMatch[0])) !== null) {
            cellText += tMatch[1];
          }
          rowCells.push(decodeXmlEntities(cellText.trim()));
        }
        if (rowCells.some((c) => c.length > 0)) {
          tableRows.push(rowCells);
        }
      }

      if (tableRows.length > 0) {
        blocks.push({
          id: `block-${docId}-${order}`,
          doc_id: docId,
          order: order++,
          type: "table",
          content: "",
          original_content: "",
          table_data: tableRows,
          original_table_data: tableRows.map((r) => [...r]),
          page: 1,
          confidence: 0.98,
          edited: false,
        });
      }
      continue;
    }

    // Handle Paragraphs (<w:p>)
    if (rawTag === "w:p") {
      // Extract all text inside <w:t> tags in this paragraph
      const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let tMatch: RegExpExecArray | null;
      let paraText = "";
      while ((tMatch = tRegex.exec(rawXml)) !== null) {
        paraText += tMatch[1];
      }

      paraText = decodeXmlEntities(paraText.trim());
      if (!paraText) continue; // skip blank spacing paragraphs

      // Extract style name if present: <w:pStyle w:val="Heading1"/>
      const styleMatch = /<w:pStyle[^>]+w:val="([^"]+)"/i.exec(rawXml);
      const styleName = styleMatch ? styleMatch[1].toLowerCase() : "";

      // Extract font size if present: <w:sz w:val="36"/> (in half-points)
      const szMatch = /<w:sz[^>]+w:val="(\d+)"/i.exec(rawXml);
      let fontSize: number | null = szMatch ? parseInt(szMatch[1], 10) / 2 : null;

      // Check for bold: <w:b/>
      const isBold = /<w:b(\/|>|\s)/i.test(rawXml);

      // Check for bullet or numbering: <w:numPr>
      const isBullet = /<w:numPr[\s>]/i.test(rawXml) || styleName.includes("bullet") || styleName.includes("list");

      // Classification Logic based on Typography & Style Hierarchy
      let type: BlockType = "body";

      if (styleName.includes("title") || (!docTitleCandidate && fontSize && fontSize >= 21)) {
        type = "title";
        fontSize = fontSize || 24.0;
        if (!docTitleCandidate) docTitleCandidate = paraText;
      } else if (styleName.includes("heading 1") || styleName === "heading1" || (fontSize && fontSize >= 16) || (isBold && paraText.length < 90 && /^\d+\.?\s+[A-Z]/.test(paraText))) {
        type = "main_heading";
        fontSize = fontSize || 18.0;
      } else if (styleName.includes("heading 2") || styleName === "heading2" || (fontSize && fontSize >= 13.5 && fontSize < 16) || (isBold && paraText.length < 100 && /^\d+\.\d+/.test(paraText))) {
        type = "sub_heading";
        fontSize = fontSize || 14.0;
      } else if (styleName.includes("heading 3") || styleName === "heading3" || (fontSize && fontSize >= 12.5 && fontSize < 13.5)) {
        type = "sub_heading";
        fontSize = fontSize || 13.0;
      } else if (isBullet || /^[•\-*]\s+/.test(paraText) || /^\d+\.\s+/.test(paraText)) {
        type = "sub_content";
        fontSize = fontSize || 9.5;
        if (!/^[•\-*]\s+/.test(paraText) && !/^\d+\.\s+/.test(paraText)) {
          paraText = `• ${paraText}`;
        }
      } else if (
        (fontSize && fontSize <= 9.0) ||
        (paraText.length < 100 && (paraText.toLowerCase().includes("page ") || paraText.toLowerCase().includes("confidential") || paraText.toLowerCase().includes("copyright") || paraText.toLowerCase().includes("all rights reserved")))
      ) {
        type = "footer";
        fontSize = fontSize || 8.5;
      } else {
        type = "body";
        fontSize = fontSize || 11.0;
      }

      blocks.push({
        id: `block-${docId}-${order}`,
        doc_id: docId,
        order: order++,
        type,
        content: paraText,
        original_content: paraText,
        font_size: fontSize,
        page: 1,
        confidence: 0.95,
        edited: false,
      });

      // If document title has not been set yet, use first title or first prominent heading
      if (!docTitleCandidate && (type === "title" || type === "main_heading")) {
        docTitleCandidate = paraText;
      }
    }
  }

  // Insert any extracted images into the block tree
  if (mediaBlocks.length > 0) {
    // Insert after the title or first heading if available
    const insertPos = blocks.length > 1 ? 2 : blocks.length;
    for (const imgBlock of mediaBlocks) {
      blocks.splice(insertPos, 0, imgBlock);
    }
    // Re-index orders
    blocks.forEach((b, idx) => {
      b.order = idx;
    });
  }

  // Fallback title if none was identified
  const finalTitle = docTitleCandidate || filename.replace(/\.[^/.]+$/, "").replace(/[_\-]/g, " ");

  // If no blocks were extracted, fallback cleanly
  if (blocks.length === 0) {
    blocks.push({
      id: `block-${docId}-0`,
      doc_id: docId,
      order: 0,
      type: "title",
      content: finalTitle,
      original_content: finalTitle,
      font_size: 24.0,
      page: 1,
      confidence: 0.99,
      edited: false,
    });
  }

  return {
    title: finalTitle,
    blocks,
  };
}
