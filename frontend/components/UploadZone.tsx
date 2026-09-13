"use client";

import { useCallback, useState } from "react";
import {
  UploadCloud,
  FileText,
  FileCode,
  Image as ImageIcon,
  Sparkles,
  ClipboardCheck,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import BrandLogo from "@/components/BrandLogo";

interface Props {
  onFile: (file: File) => void;
  onPaste: (title: string, text: string) => void;
  onLoadSample: (sampleId: string) => void;
  isLoading: boolean;
}

export default function UploadZone({
  onFile,
  onPaste,
  onLoadSample,
  isLoading,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteContent.trim()) return;
    onPaste(pasteTitle.trim() || "Pasted Executive Document", pasteContent);
  }

  // Button styling based on user requirement:
  // light purple in light mode only, cyan+orange in dark theme
  const primaryButtonClass = isDark
    ? "bg-gradient-to-r from-cyan-500 via-cyan-400 to-orange-500 hover:from-cyan-400 hover:to-orange-400 text-slate-950 font-bold shadow-cyanOrange border border-cyan-300/40"
    : "bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-purpleGlow border border-purple-400/40";

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className={clsx(
          "absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500",
          isDark ? "bg-cyan-500/10" : "bg-purple-500/15"
        )}
      />
      <div
        className={clsx(
          "absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-500",
          isDark ? "bg-orange-500/10" : "bg-pink-400/15"
        )}
      />

      <div className="w-full max-w-2xl relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div
            className={clsx(
              "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border p-1 shadow-md transition-transform hover:scale-105",
              isDark
                ? "bg-slate-900/90 border-cyan-500/40 shadow-glow"
                : "bg-white border-purple-200 shadow-purpleGlow"
            )}
          >
            <BrandLogo className="h-full w-full object-contain rounded-xl" alt="StructraMorph.ai Brand Hub" />
          </div>

          <div
            className={clsx(
              "inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase transition-all",
              isDark
                ? "bg-gradient-to-r from-cyan-500/15 to-orange-500/15 border border-cyan-500/30 text-cyan-300 shadow-glow"
                : "bg-purple-100 border border-purple-200 text-purple-700 shadow-sm"
            )}
          >
            <Zap size={13} className={isDark ? "text-orange-400" : "text-purple-600"} />
            {t("precisionDocEng")}
          </div>

          <h1
            className={clsx(
              "text-3xl font-extrabold tracking-tight sm:text-4xl transition-colors",
              isDark ? "text-cyber-text" : "text-slate-900"
            )}
          >
            StructraMorph
            <span className={isDark ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-orange-400" : "text-purple-600"}>
              .ai
            </span>
          </h1>

          <p
            className={clsx(
              "text-sm max-w-lg mx-auto transition-colors",
              isDark ? "text-cyber-muted" : "text-slate-600"
            )}
          >
            {t("heroDesc")}
          </p>
        </div>

        {/* Ingestion Mode Tabs */}
        <div
          className={clsx(
            "flex items-center justify-center gap-2 p-1 border rounded-lg max-w-xs mx-auto shadow-sm backdrop-blur-md",
            isDark ? "bg-cyber-card/80 border-cyber-border" : "bg-white/80 border-purple-200"
          )}
        >
          <button
            onClick={() => setActiveTab("upload")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all",
              activeTab === "upload"
                ? isDark
                  ? "bg-cyber-surface text-cyan-300 shadow-sm border border-cyan-500/30"
                  : "bg-purple-600 text-white shadow-sm"
                : isDark
                ? "text-cyber-muted hover:text-cyber-text"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <UploadCloud size={14} className={activeTab === "upload" ? (isDark ? "text-cyan-400" : "text-white") : ""} />
            {t("uploadFile")}
          </button>
          <button
            onClick={() => setActiveTab("paste")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all",
              activeTab === "paste"
                ? isDark
                  ? "bg-cyber-surface text-orange-300 shadow-sm border border-orange-500/30"
                  : "bg-purple-600 text-white shadow-sm"
                : isDark
                ? "text-cyber-muted hover:text-cyber-text"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <ClipboardCheck size={14} className={activeTab === "paste" ? (isDark ? "text-orange-400" : "text-white") : ""} />
            {t("pasteText")}
          </button>
        </div>

        {/* Ingestion Container */}
        <div
          className={clsx(
            "rounded-xl border p-8 backdrop-blur-md shadow-card transition-all",
            isDark ? "glass-panel-dark border-cyber-border" : "glass-panel-light border-purple-200"
          )}
        >
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div
                  className={clsx(
                    "h-16 w-16 rounded-full border-4 animate-spin",
                    isDark ? "border-cyan-500/20 border-t-cyan-400" : "border-purple-200 border-t-purple-600"
                  )}
                />
                <Sparkles
                  size={20}
                  className={clsx(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse",
                    isDark ? "text-orange-400" : "text-purple-600"
                  )}
                />
              </div>
              <div className="space-y-1">
                <h3 className={clsx("text-base font-semibold", isDark ? "text-cyber-text" : "text-slate-900")}>
                  {t("segmentingDoc")}
                </h3>
                <p className={clsx("text-xs", isDark ? "text-cyber-muted" : "text-slate-500")}>
                  {t("classifyingElements")}
                </p>
              </div>
            </div>
          ) : activeTab === "upload" ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={clsx(
                "border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer",
                isDragging
                  ? isDark
                    ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]"
                    : "border-purple-500 bg-purple-50 scale-[1.01]"
                  : isDark
                  ? "border-cyber-border hover:border-cyan-400/50 bg-cyber-surface/40 hover:bg-cyber-surface/70"
                  : "border-purple-200 hover:border-purple-400 bg-purple-50/30 hover:bg-purple-50/60"
              )}
            >
              <div
                className={clsx(
                  "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border shadow-sm transition-transform hover:scale-105",
                  isDark
                    ? "bg-gradient-to-tr from-cyan-500/20 to-orange-500/20 text-cyan-300 border-cyan-500/30"
                    : "bg-purple-100 text-purple-600 border-purple-200"
                )}
              >
                <UploadCloud size={28} />
              </div>

              <h3 className={clsx("text-base font-semibold mb-1", isDark ? "text-cyber-text" : "text-slate-900")}>
                {t("dragDropText")}
              </h3>
              <p className={clsx("text-xs mb-6 max-w-sm mx-auto", isDark ? "text-cyber-muted" : "text-slate-500")}>
                {t("dragDropSub")}
              </p>

              <label
                className={clsx(
                  "inline-flex cursor-pointer items-center gap-2 rounded-md px-5 py-2.5 text-xs font-semibold transition-all hover:scale-105",
                  primaryButtonClass
                )}
              >
                <FileText size={15} />
                {t("browseDocument")}
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFile(file);
                  }}
                />
              </label>

              {/* Supported format badges */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[11px]">
                <span className={clsx("flex items-center gap-1 rounded px-2 py-0.5 border", isDark ? "bg-cyber-card border-cyber-border text-cyber-muted" : "bg-white border-purple-100 text-slate-600")}>
                  <FileText size={11} className="text-laser-rose" /> PDF
                </span>
                <span className={clsx("flex items-center gap-1 rounded px-2 py-0.5 border", isDark ? "bg-cyber-card border-cyber-border text-cyber-muted" : "bg-white border-purple-100 text-slate-600")}>
                  <FileCode size={11} className="text-laser-cyan" /> Word .docx
                </span>
                <span className={clsx("flex items-center gap-1 rounded px-2 py-0.5 border", isDark ? "bg-cyber-card border-cyber-border text-cyber-muted" : "bg-white border-purple-100 text-slate-600")}>
                  <ImageIcon size={11} className="text-laser-amber" /> Scanned OCR
                </span>
                <span className={clsx("flex items-center gap-1 rounded px-2 py-0.5 border", isDark ? "bg-cyber-card border-cyber-border text-cyber-muted" : "bg-white border-purple-100 text-slate-600")}>
                  <FileText size={11} className="text-laser-violet" /> Markdown
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <div>
                <label className={clsx("block text-xs font-semibold mb-1", isDark ? "text-cyber-muted" : "text-slate-700")}>
                  {t("docTitleOptional")}
                </label>
                <input
                  type="text"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  placeholder="e.g. System Architecture Technical Spec"
                  className={clsx(
                    "w-full rounded px-3 py-2 text-xs border outline-none transition-colors",
                    isDark
                      ? "bg-cyber-surface text-cyber-text border-cyber-border focus:border-cyan-400"
                      : "bg-white text-slate-900 border-purple-200 focus:border-purple-500"
                  )}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={clsx("text-xs font-semibold", isDark ? "text-cyber-muted" : "text-slate-700")}>
                    {t("pasteText")}
                  </label>
                  <span className={clsx("text-[11px] font-mono", isDark ? "text-cyber-subtle" : "text-slate-400")}>
                    {pasteContent.length} chars
                  </span>
                </div>
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  rows={8}
                  placeholder={t("pasteBodyPlaceholder")}
                  className={clsx(
                    "w-full rounded p-3 text-xs font-mono border outline-none transition-colors resize-y",
                    isDark
                      ? "bg-cyber-surface text-cyber-text placeholder:text-cyber-subtle border-cyber-border focus:border-cyan-400"
                      : "bg-white text-slate-900 placeholder:text-slate-400 border-purple-200 focus:border-purple-500"
                  )}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!pasteContent.trim()}
                className={clsx(
                  "w-full flex items-center justify-center gap-2 rounded-md py-2.5 text-xs font-semibold transition-all disabled:opacity-50",
                  primaryButtonClass
                )}
              >
                <Sparkles size={14} />
                {t("parseDeconstruct")}
              </button>
            </form>
          )}
        </div>

        {/* 1-Click Portfolio Demo Samples */}
        <div
          className={clsx(
            "rounded-lg border p-4 backdrop-blur-sm transition-all",
            isDark ? "bg-cyber-card/60 border-cyber-border" : "bg-white/80 border-purple-200/90 shadow-sm"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={clsx("text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5", isDark ? "text-cyber-muted" : "text-purple-900")}>
              <ShieldCheck size={14} className={isDark ? "text-cyan-400" : "text-purple-600"} />
              {t("instantSamples")}
            </span>
            <span className={clsx("text-[11px]", isDark ? "text-cyber-subtle" : "text-slate-400")}>
              {t("noFileRequired")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onLoadSample("architecture")}
              disabled={isLoading}
              className={clsx(
                "flex items-center justify-between p-3 rounded-md border transition-all text-left group",
                isDark
                  ? "bg-cyber-surface/60 hover:bg-cyber-surface border-cyber-border hover:border-cyan-400/40"
                  : "bg-purple-50/50 hover:bg-purple-50 border-purple-100 hover:border-purple-300"
              )}
            >
              <div>
                <p className={clsx("text-xs font-semibold transition-colors", isDark ? "text-cyber-text group-hover:text-cyan-300" : "text-slate-900 group-hover:text-purple-700")}>
                  {t("sampleArchTitle")}
                </p>
                <p className={clsx("text-[11px]", isDark ? "text-cyber-muted" : "text-slate-500")}>
                  {t("sampleArchDesc")}
                </p>
              </div>
              <ArrowRight
                size={14}
                className={clsx(
                  "transition-all group-hover:translate-x-1",
                  isDark ? "text-cyber-subtle group-hover:text-cyan-400" : "text-purple-400 group-hover:text-purple-700"
                )}
              />
            </button>

            <button
              onClick={() => onLoadSample("financial")}
              disabled={isLoading}
              className={clsx(
                "flex items-center justify-between p-3 rounded-md border transition-all text-left group",
                isDark
                  ? "bg-cyber-surface/60 hover:bg-cyber-surface border-cyber-border hover:border-orange-400/40"
                  : "bg-purple-50/50 hover:bg-purple-50 border-purple-100 hover:border-purple-300"
              )}
            >
              <div>
                <p className={clsx("text-xs font-semibold transition-colors", isDark ? "text-cyber-text group-hover:text-orange-300" : "text-slate-900 group-hover:text-purple-700")}>
                  {t("sampleFinTitle")}
                </p>
                <p className={clsx("text-[11px]", isDark ? "text-cyber-muted" : "text-slate-500")}>
                  {t("sampleFinDesc")}
                </p>
              </div>
              <ArrowRight
                size={14}
                className={clsx(
                  "transition-all group-hover:translate-x-1",
                  isDark ? "text-cyber-subtle group-hover:text-orange-400" : "text-purple-400 group-hover:text-purple-700"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
