"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Check,
  X,
  Loader2,
  RotateCcw,
  Save,
  Split,
  Edit3,
  Layers,
  FileCode2,
  FileCheck,
  Image as ImageIcon,
  Download,
  ZoomIn,
  Type,
} from "lucide-react";
import type { Block, BlockType } from "@/lib/api";
import { api } from "@/lib/api";
import DiffViewer from "./DiffViewer";
import TabulationEditor from "./TabulationEditor";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

interface Props {
  block: Block | null;
  docId: string;
  onBlockUpdated: (block: Block) => void;
}

const TONE_OPTIONS = [
  "Professional",
  "Concise",
  "Executive C-Suite",
  "Persuasive",
  "Academic",
  "Neutral",
];

export default function EditorPanel({ block, docId, onBlockUpdated }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [content, setContent] = useState("");
  const [blockType, setBlockType] = useState<BlockType>("body");
  const [tableData, setTableData] = useState<string[][]>([]);
  const [instruction, setInstruction] = useState("");
  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [viewMode, setViewMode] = useState<"edit" | "diff">("edit");
  const [isRewriting, setIsRewriting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | string[][] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);

  useEffect(() => {
    if (block) {
      setContent(block.content || "");
      setBlockType(block.type);
      setTableData(block.table_data ? block.table_data.map((r) => [...r]) : []);
      setSuggestion(null);
      setInstruction("");
      setImageZoom(false);
    }
  }, [block?.id]);

  const primaryButtonClass = isDark
    ? "bg-gradient-to-r from-cyan-500 via-cyan-400 to-orange-500 hover:from-cyan-400 hover:to-orange-400 text-slate-950 font-bold shadow-cyanOrange border border-cyan-300/40"
    : "bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-purpleGlow border border-purple-400/40";

  const secondaryButtonClass = isDark
    ? "bg-cyber-card text-cyber-muted hover:text-cyan-300 hover:bg-cyber-border border border-cyber-border"
    : "bg-white text-slate-700 hover:text-purple-700 hover:bg-purple-50 border border-purple-200 shadow-sm";

  if (!block) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
        <Layers
          size={36}
          className={clsx("mb-3 animate-pulse", isDark ? "text-cyan-500/50" : "text-purple-400")}
        />
        <h3 className={clsx("font-semibold text-sm", isDark ? "text-cyber-muted" : "text-slate-700")}>
          {t("noElementSelected")}
        </h3>
        <p className={clsx("text-xs max-w-xs mt-1", isDark ? "text-cyber-subtle" : "text-slate-500")}>
          {t("selectPrompt")}
        </p>
      </div>
    );
  }

  const isTable = block.type === "table";
  const isImage = block.type === "image";
  const originalText = block.original_content || "";
  const isDirty = isTable
    ? JSON.stringify(tableData) !== JSON.stringify(block.table_data)
    : content !== block.content || blockType !== block.type;

  const presetSurgeries = [
    { label: t("presetProf"), instruction: "Rewrite in an executive, formal business tone with polished corporate diction" },
    { label: t("presetGrammar"), instruction: "Correct all grammar, punctuation, passive voice, and phrasing for clarity" },
    { label: t("presetSummarize"), instruction: "Distill this block down to its essential premise and key quantitative takeaway" },
    { label: t("presetBullets"), instruction: "Convert this narrative prose into punchy, high-impact bulleted takeaways" },
    { label: t("presetSimplify"), instruction: "Replace complex terminology with clear, plain-language equivalents without losing nuance" },
  ];

  async function handleSave() {
    setIsSaving(true);
    try {
      const updated = await api.updateBlock(docId, block!.id, {
        type: blockType,
        content: isTable ? undefined : content,
        table_data: isTable ? tableData : undefined,
      });
      onBlockUpdated(updated);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    setIsResetting(true);
    try {
      const reverted = await api.resetBlock(docId, block!.id);
      setContent(reverted.content || "");
      setBlockType(reverted.type);
      if (reverted.table_data) {
        setTableData(reverted.table_data.map((r) => [...r]));
      }
      setSuggestion(null);
      onBlockUpdated(reverted);
    } finally {
      setIsResetting(false);
    }
  }

  async function handleAIRewrite(customInstruction?: string) {
    const activeInstruction = customInstruction || instruction;
    if (!activeInstruction.trim()) return;

    setIsRewriting(true);
    setSuggestion(null);
    try {
      const res = await api.aiRewrite(docId, block!.id, activeInstruction, tone);
      setSuggestion(res.suggested_content as string | string[][]);
    } finally {
      setIsRewriting(false);
    }
  }

  function acceptSuggestion() {
    if (suggestion == null) return;
    if (isTable) {
      setTableData(suggestion as string[][]);
      api.updateBlock(docId, block!.id, { table_data: suggestion as string[][] }).then(onBlockUpdated);
    } else {
      const updatedContent = suggestion as string;
      setContent(updatedContent);
      api.updateBlock(docId, block!.id, { content: updatedContent }).then(onBlockUpdated);
    }
    setSuggestion(null);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden backdrop-blur-md">
      {/* Top Surgical Command Bar */}
      <div
        className={clsx(
          "flex items-center justify-between border-b px-6 py-3 transition-colors",
          isDark
            ? "bg-cyber-surface/90 border-cyber-border"
            : "bg-white/90 border-purple-200 shadow-sm"
        )}
      >
        <div className="flex items-center gap-3">
          {/* Classification Dropdown with all semantic types */}
          <div className="flex items-center gap-2">
            <span className={clsx("text-xs uppercase font-semibold tracking-wider", isDark ? "text-cyber-muted" : "text-slate-600")}>
              {t("typeLabel")}
            </span>
            <select
              value={blockType}
              onChange={(e) => setBlockType(e.target.value as BlockType)}
              className={clsx(
                "rounded px-2.5 py-1 text-xs font-semibold border outline-none transition-colors",
                isDark
                  ? "bg-cyber-card text-cyber-text border-cyber-border focus:border-cyan-400"
                  : "bg-white text-slate-900 border-purple-200 focus:border-purple-500 shadow-sm"
              )}
            >
              <option value="title">{t("docTitle")}</option>
              <option value="main_heading">{t("mainHeading")}</option>
              <option value="sub_heading">{t("subHeading")}</option>
              <option value="body">{t("bodyParagraph")}</option>
              <option value="sub_content">{t("subContentItem") || "Sub-content (Bullets/Notes)"}</option>
              <option value="table">{t("tabulationGrid")}</option>
              <option value="image">{t("imageBlock") || "Visual Image Asset"}</option>
              <option value="footer">{t("footerDoc")}</option>
            </select>
          </div>

          {/* Detected Font Size */}
          {block.font_size && (
            <span
              className={clsx(
                "text-xs font-mono px-2 py-0.5 rounded border flex items-center gap-1",
                isDark
                  ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/25"
                  : "bg-purple-100 text-purple-700 border-purple-200"
              )}
            >
              <Type size={11} /> {t("fontSize")}: {block.font_size}pt
            </span>
          )}

          {block.page && (
            <span
              className={clsx(
                "text-xs font-mono px-2 py-0.5 rounded border",
                isDark ? "bg-cyber-card text-cyber-subtle border-cyber-border" : "bg-slate-50 text-slate-500 border-slate-200"
              )}
            >
              {t("page")} {block.page}
            </span>
          )}
        </div>

        {/* View Mode and Action Controls */}
        <div className="flex items-center gap-2">
          {!isTable && !isImage && (
            <div
              className={clsx(
                "flex items-center gap-1 p-0.5 rounded border",
                isDark ? "bg-cyber-card border-cyber-border" : "bg-purple-50 border-purple-200"
              )}
            >
              <button
                onClick={() => setViewMode("edit")}
                className={clsx(
                  "px-3 py-1 text-xs rounded transition-all font-medium flex items-center gap-1",
                  viewMode === "edit"
                    ? isDark
                      ? "bg-cyber-surface text-cyan-300 shadow-sm border border-cyan-500/30"
                      : "bg-purple-600 text-white shadow-sm"
                    : isDark
                    ? "text-cyber-muted hover:text-cyber-text"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Edit3 size={12} /> {t("editorMode")}
              </button>
              <button
                onClick={() => setViewMode("diff")}
                className={clsx(
                  "px-3 py-1 text-xs rounded transition-all font-medium flex items-center gap-1",
                  viewMode === "diff"
                    ? isDark
                      ? "bg-cyber-surface text-orange-300 shadow-sm border border-orange-500/30"
                      : "bg-purple-600 text-white shadow-sm"
                    : isDark
                    ? "text-cyber-muted hover:text-cyber-text"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Split size={12} /> {t("liveDiffMode")}
              </button>
            </div>
          )}

          <button
            onClick={handleReset}
            disabled={isResetting || (!block.edited && !isDirty)}
            title={t("resetBlock")}
            className={clsx(
              "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40",
              secondaryButtonClass
            )}
          >
            <RotateCcw size={12} className={isResetting ? "animate-spin" : ""} />
            {t("resetBlock")}
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className={clsx(
              "flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-semibold transition-all disabled:opacity-40",
              primaryButtonClass
            )}
          >
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {isSaving ? t("saving") : t("saveBlock")}
          </button>
        </div>
      </div>

      {/* Center Canvas */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {isImage ? (
          /* Dedicated Extracted Visual Image Inspector */
          <div
            className={clsx(
              "flex flex-col h-full rounded-xl border p-6 space-y-4 shadow-card backdrop-blur-md transition-colors",
              isDark ? "bg-cyber-card/70 border-cyber-border" : "bg-white/85 border-purple-200"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className={isDark ? "text-cyan-400" : "text-purple-600"} />
                <h3 className={clsx("text-sm font-semibold", isDark ? "text-cyber-text" : "text-slate-900")}>
                  {t("extractedVisual") || "Extracted Visual Asset"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {block.image_metadata && (
                  <span
                    className={clsx(
                      "text-xs font-mono px-2 py-0.5 rounded border",
                      isDark ? "bg-cyber-surface border-cyber-border text-orange-300" : "bg-purple-50 border-purple-200 text-purple-800"
                    )}
                  >
                    {block.image_metadata.width} × {block.image_metadata.height} px · {block.image_metadata.format}
                  </span>
                )}
                {block.image_url && (
                  <a
                    href={block.image_url}
                    download="extracted_document_asset.png"
                    className={clsx("flex items-center gap-1 rounded px-3 py-1 text-xs font-medium border", secondaryButtonClass)}
                  >
                    <Download size={13} /> {t("downloadImage") || "Download"}
                  </a>
                )}
              </div>
            </div>

            {/* Visual Image Viewport */}
            <div
              className={clsx(
                "flex-1 min-h-[260px] rounded-lg border flex items-center justify-center p-4 relative overflow-hidden",
                isDark ? "bg-black/30 border-cyber-border" : "bg-slate-50 border-purple-100"
              )}
            >
              {block.image_url ? (
                <img
                  src={block.image_url}
                  alt={block.content || "Extracted Image Asset"}
                  className={clsx(
                    "max-h-[360px] w-auto object-contain rounded transition-transform cursor-pointer shadow-lg",
                    imageZoom && "scale-125"
                  )}
                  onClick={() => setImageZoom(!imageZoom)}
                />
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                  No visual image data preview available
                </div>
              )}
              {block.image_url && (
                <button
                  onClick={() => setImageZoom(!imageZoom)}
                  className="absolute bottom-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <ZoomIn size={14} />
                </button>
              )}
            </div>

            {/* Visual Caption / Transcription */}
            <div className="space-y-1">
              <label className={clsx("text-xs font-semibold", isDark ? "text-cyber-muted" : "text-slate-700")}>
                Image Label / Extracted Caption
              </label>
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter caption or visual description..."
                className={clsx(
                  "w-full rounded px-3 py-2 text-xs border outline-none",
                  isDark
                    ? "bg-cyber-surface text-cyber-text border-cyber-border focus:border-cyan-400"
                    : "bg-white text-slate-900 border-purple-200 focus:border-purple-500"
                )}
              />
            </div>
          </div>
        ) : isTable ? (
          <TabulationEditor
            data={tableData}
            onChange={(newData) => setTableData(newData)}
            originalData={block.original_table_data}
          />
        ) : viewMode === "diff" ? (
          <div className="h-[460px]">
            <DiffViewer
              original={originalText}
              modified={content}
              originalLabel="Original Extraction"
              modifiedLabel="Current Surgical Content"
            />
          </div>
        ) : (
          <div className="flex flex-col h-full space-y-2">
            <div
              className={clsx(
                "flex items-center justify-between text-xs font-mono",
                isDark ? "text-cyber-muted" : "text-slate-600"
              )}
            >
              <span className="flex items-center gap-1">
                <FileCode2 size={13} className={isDark ? "text-cyan-400" : "text-purple-600"} />
                {t("semanticContent")}
              </span>
              <span>
                {content.split(/\s+/).filter(Boolean).length} {t("words")} · {content.length} {t("characters")}
              </span>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={blockType === "body" ? 14 : blockType === "title" ? 3 : blockType === "sub_content" ? 8 : 5}
              className={clsx(
                "w-full flex-1 rounded-lg border p-4 text-sm leading-relaxed outline-none transition-all shadow-inner font-sans resize-y",
                isDark
                  ? "bg-cyber-card/60 text-cyber-text placeholder:text-cyber-subtle border-cyber-border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  : "bg-white text-slate-900 placeholder:text-slate-400 border-purple-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-sm"
              )}
            />
          </div>
        )}
      </div>

      {/* Bottom AI Surgical Toolkit Bar */}
      <div
        className={clsx(
          "border-t p-5 shadow-card backdrop-blur-md transition-colors",
          isDark
            ? "bg-cyber-surface/95 border-cyber-border"
            : "bg-white/95 border-purple-200"
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={14} className={isDark ? "text-orange-400 animate-pulse" : "text-purple-600 animate-pulse"} />
            <span className={isDark ? "text-cyber-text" : "text-slate-900"}>{t("targetedAiEngine")}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={clsx("text-xs", isDark ? "text-cyber-subtle" : "text-slate-500")}>
              {t("toneCalibration")}
            </span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className={clsx(
                "rounded px-2 py-1 text-xs border outline-none",
                isDark
                  ? "bg-cyber-card text-cyber-muted border-cyber-border focus:border-cyan-400"
                  : "bg-white text-slate-700 border-purple-200 focus:border-purple-500"
              )}
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {presetSurgeries.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setInstruction(p.instruction);
                handleAIRewrite(p.instruction);
              }}
              disabled={isRewriting}
              className={clsx(
                "rounded px-2.5 py-1 text-xs font-medium border transition-all disabled:opacity-50",
                isDark
                  ? "bg-cyber-card text-cyber-muted hover:text-cyan-300 hover:bg-cyber-border border-cyber-border/70 hover:border-cyan-500/40"
                  : "bg-purple-50/70 text-purple-800 hover:text-purple-950 hover:bg-purple-100 border-purple-200"
              )}
            >
              ⚡ {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAIRewrite();
            }}
            placeholder={t("customPromptPlaceholder")}
            className={clsx(
              "flex-1 rounded-md border px-3.5 py-2 text-xs outline-none transition-all",
              isDark
                ? "bg-cyber-card text-cyber-text placeholder:text-cyber-subtle border-cyber-border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                : "bg-white text-slate-900 placeholder:text-slate-400 border-purple-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            )}
          />

          <button
            onClick={() => handleAIRewrite()}
            disabled={isRewriting || !instruction.trim()}
            className={clsx(
              "flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50",
              primaryButtonClass
            )}
          >
            {isRewriting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {isRewriting ? t("synthesizing") : t("applySurgery")}
          </button>
        </div>

        {suggestion !== null && (
          <div
            className={clsx(
              "mt-4 rounded-lg border p-4 shadow-lg transition-all",
              isDark
                ? "border-cyan-500/40 bg-cyber-card shadow-glow"
                : "border-purple-300 bg-white shadow-purpleGlow"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={clsx("text-xs font-semibold flex items-center gap-1.5", isDark ? "text-cyan-300" : "text-purple-700")}>
                <FileCheck size={14} className={isDark ? "text-cyan-400" : "text-purple-600"} />
                {t("aiProposal")}
              </span>
              <span className={clsx("text-[11px] font-mono", isDark ? "text-cyber-muted" : "text-slate-500")}>
                {t("reviewDiffText")}
              </span>
            </div>

            {isTable ? (
              <div
                className={clsx(
                  "overflow-x-auto text-xs p-2 rounded border",
                  isDark ? "bg-cyber-surface/70 border-cyber-border" : "bg-purple-50/50 border-purple-200"
                )}
              >
                <table className="w-full border-collapse">
                  <tbody>
                    {(suggestion as string[][]).map((row, r) => (
                      <tr key={r} className={clsx("border-b", isDark ? "border-cyber-border/40" : "border-purple-100")}>
                        {row.map((cell, c) => (
                          <td key={c} className={clsx("p-2 border-r", isDark ? "border-cyber-border/40" : "border-purple-100")}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className={clsx(
                  "max-h-48 overflow-y-auto rounded p-3 text-xs leading-relaxed border font-sans scrollbar-thin",
                  isDark ? "bg-cyber-surface/70 border-cyber-border" : "bg-purple-50/30 border-purple-100"
                )}
              >
                <DiffViewer
                  original={content}
                  modified={suggestion as string}
                  originalLabel="Before Surgery"
                  modifiedLabel="After AI Surgery"
                />
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={acceptSuggestion}
                className={clsx("flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-semibold transition-all shadow-sm", primaryButtonClass)}
              >
                <Check size={13} /> {t("acceptMutation")}
              </button>
              <button
                onClick={() => {
                  if (!isTable) setContent(suggestion as string);
                  setSuggestion(null);
                }}
                className={clsx("flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all", secondaryButtonClass)}
              >
                <Edit3 size={12} /> {t("editSuggestion")}
              </button>
              <button
                onClick={() => setSuggestion(null)}
                className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium text-laser-rose hover:bg-laser-rose/10 transition-all border border-laser-rose/30"
              >
                <X size={13} /> {t("discard")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
