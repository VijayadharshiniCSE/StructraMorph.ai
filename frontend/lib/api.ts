import {
  SAMPLE_DOCS,
  docStore,
  parseFile,
  parseTextContent,
  performAIRewrite,
  exportDocumentClient,
} from "./clientEngine";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export type BlockType =
  | "title"
  | "heading"
  | "main_heading"
  | "subheading"
  | "sub_heading"
  | "body"
  | "sub_content"
  | "footer"
  | "table"
  | "image";

export interface BoundingBox {
  page: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Block {
  id: string;
  doc_id: string;
  order: number;
  type: BlockType;
  content: string;
  original_content?: string | null;
  table_data?: string[][] | null;
  original_table_data?: string[][] | null;
  image_url?: string | null;
  image_metadata?: Record<string, any> | null;
  font_size?: number | null;
  bbox?: BoundingBox | null;
  page?: number | null;
  confidence?: number | null;
  edited: boolean;
}

export interface DocumentMeta {
  id: string;
  filename: string;
  content_type: string;
  page_count?: number | null;
  status: string;
  created_at?: string;
}

export interface UploadResponse {
  document: DocumentMeta;
  blocks: Block[];
}

export interface AIRewriteResponse {
  block_id: string;
  original_content: unknown;
  suggested_content: unknown;
  diff_stats?: {
    words_original: number;
    words_modified: number;
    words_added: number;
    words_removed: number;
  };
}

export const api = {
  /**
   * Upload file (.pdf, .docx, image, .txt, .md) via multipart form
   * Resilient fallback to high-fidelity client parsing if backend is unreachable
   */
  async upload(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Backend unavailable, executing in-browser parsing engine:", e);
    }
    return parseFile(file);
  },

  /**
   * Directly ingest pasted text or Markdown
   */
  async paste(title: string, text: string): Promise<UploadResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/documents/paste`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Backend unavailable, executing in-browser text parsing:", e);
    }
    return parseTextContent(title, text);
  },

  /**
   * Load rich pre-configured sample document
   */
  async loadSample(sampleId: string): Promise<UploadResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/documents/sample/${sampleId}`, {
        method: "POST",
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Backend unavailable, loading cached evaluation sample:", e);
    }
    const sample = SAMPLE_DOCS[sampleId] || SAMPLE_DOCS.architecture;
    const docCopy: DocumentMeta = {
      ...sample.doc,
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    const blocksCopy: Block[] = sample.blocks.map((b) => ({
      ...b,
      doc_id: docCopy.id,
      original_content: b.original_content ?? b.content,
      original_table_data: b.table_data ? b.table_data.map((r) => [...r]) : null,
      edited: false,
    }));
    docStore.set(docCopy.id, { doc: docCopy, blocks: blocksCopy });
    return { document: docCopy, blocks: blocksCopy };
  },

  /**
   * Retrieve all component blocks for a document
   */
  async getBlocks(docId: string): Promise<Block[]> {
    try {
      const res = await fetch(`${API_BASE}/api/documents/${docId}/blocks`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    const entry = docStore.get(docId);
    return entry ? entry.blocks : [];
  },

  /**
   * Update a specific block's content, type, or table data
   */
  async updateBlock(
    docId: string,
    blockId: string,
    update: { type?: BlockType; content?: string; table_data?: string[][] }
  ): Promise<Block> {
    try {
      const res = await fetch(
        `${API_BASE}/api/documents/${docId}/blocks/${blockId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update),
        }
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    // In-memory update
    const entry = docStore.get(docId);
    if (entry) {
      const block = entry.blocks.find((b) => b.id === blockId);
      if (block) {
        if (update.type) block.type = update.type;
        if (update.content !== undefined) block.content = update.content;
        if (update.table_data !== undefined) block.table_data = update.table_data;
        block.edited = true;
        return { ...block };
      }
    }
    return {
      id: blockId,
      doc_id: docId,
      order: 0,
      type: update.type || "body",
      content: update.content || "",
      table_data: update.table_data,
      edited: true,
    };
  },

  /**
   * Trigger targeted surgical AI mutation on a single block
   */
  async aiRewrite(
    docId: string,
    blockId: string,
    instruction: string,
    tone?: string,
    targetLanguage?: string
  ): Promise<AIRewriteResponse> {
    try {
      const res = await fetch(
        `${API_BASE}/api/documents/${docId}/blocks/${blockId}/ai-rewrite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instruction,
            tone: tone || undefined,
            target_language: targetLanguage || undefined,
          }),
        }
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    const entry = docStore.get(docId);
    const block = entry?.blocks.find((b) => b.id === blockId);
    if (block) {
      return performAIRewrite(block, instruction, tone);
    }
    return {
      block_id: blockId,
      original_content: "",
      suggested_content: `[Mutated] ${instruction}`,
    };
  },

  /**
   * Reset a single block to its pristine extraction state
   */
  async resetBlock(docId: string, blockId: string): Promise<Block> {
    try {
      const res = await fetch(
        `${API_BASE}/api/documents/${docId}/blocks/${blockId}/reset`,
        { method: "POST" }
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    const entry = docStore.get(docId);
    const block = entry?.blocks.find((b) => b.id === blockId);
    if (block) {
      block.content = block.original_content ?? block.content;
      block.table_data = block.original_table_data
        ? block.original_table_data.map((r) => [...r])
        : block.table_data;
      block.edited = false;
      return { ...block };
    }
    throw new Error("Block not found");
  },

  /**
   * Reset all blocks in a document back to original state
   */
  async resetDocument(docId: string): Promise<Block[]> {
    try {
      const res = await fetch(`${API_BASE}/api/documents/${docId}/reset`, {
        method: "POST",
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    const entry = docStore.get(docId);
    if (entry) {
      for (const b of entry.blocks) {
        b.content = b.original_content ?? b.content;
        b.table_data = b.original_table_data
          ? b.original_table_data.map((r) => [...r])
          : b.table_data;
        b.edited = false;
      }
      return entry.blocks.map((b) => ({ ...b }));
    }
    return [];
  },

  /**
   * Delete a block from the document
   */
  async deleteBlock(docId: string, blockId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/documents/${docId}/blocks/${blockId}`, {
        method: "DELETE",
      });
    } catch (e) {}

    const entry = docStore.get(docId);
    if (entry) {
      entry.blocks = entry.blocks.filter((b) => b.id !== blockId);
    }
  },

  /**
   * Split a block into two at midpoint
   */
  async splitBlock(docId: string, blockId: string): Promise<{ blocks: Block[] }> {
    try {
      const res = await fetch(
        `${API_BASE}/api/documents/${docId}/blocks/${blockId}/split`,
        { method: "POST" }
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    const entry = docStore.get(docId);
    if (entry) {
      const idx = entry.blocks.findIndex((b) => b.id === blockId);
      if (idx !== -1) {
        const b = entry.blocks[idx];
        const sentences = (b.content || "").split(/(?<=[.?!])\s+/);
        const mid = Math.ceil(sentences.length / 2);
        const p1 = sentences.slice(0, mid).join(" ");
        const p2 = sentences.slice(mid).join(" ") || "[Segment 2]";
        b.content = p1;
        b.edited = true;
        const b2: Block = {
          ...b,
          id: `block-${docId}-${Date.now()}`,
          order: b.order + 1,
          content: p2,
          original_content: p2,
          edited: true,
        };
        entry.blocks.splice(idx + 1, 0, b2);
        return { blocks: entry.blocks.map((item) => ({ ...item })) };
      }
    }
    return { blocks: [] };
  },

  /**
   * Recompile and download finalized document (PDF, DOCX, TXT, MD)
   */
  async exportDocument(
    docId: string,
    format: "pdf" | "docx" | "txt" | "md"
  ): Promise<Blob> {
    try {
      const res = await fetch(`${API_BASE}/api/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: docId, format }),
      });
      if (res.ok) {
        return await res.blob();
      }
    } catch (e) {}

    const entry = docStore.get(docId);
    return exportDocumentClient(entry ? entry.blocks : [], format);
  },
};
