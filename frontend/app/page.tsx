"use client";

import { useState, useMemo } from "react";
import {
  Download,
  FileDown,
  RotateCcw,
  FilePlus,
  ChevronDown,
  Zap,
  Sun,
  Moon,
  Globe,
  Check,
} from "lucide-react";
import clsx from "clsx";
import UploadZone from "@/components/UploadZone";
import BlockList from "@/components/BlockList";
import EditorPanel from "@/components/EditorPanel";
import ResetModal from "@/components/ResetModal";
import CursorGlow from "@/components/CursorGlow";
import BrandLogo from "@/components/BrandLogo";
import { api, type Block, type DocumentMeta } from "@/lib/api";
import { ThemeProvider, useTheme } from "@/lib/theme";
import {
  LanguageProvider,
  useTranslation,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "@/lib/i18n";

function StructraMorphApp() {
  const { t, language, setLanguage, currentMeta } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [doc, setDoc] = useState<DocumentMeta | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selected, setSelected] = useState<Block | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed document metrics
  const stats = useMemo(() => {
    const totalBlocks = blocks.length;
    const modifiedBlocks = blocks.filter((b) => b.edited).length;
    let wordCount = 0;
    for (const b of blocks) {
      if (b.type === "table" && b.table_data) {
        for (const row of b.table_data) {
          for (const cell of row) {
            wordCount += (cell || "").split(/\s+/).filter(Boolean).length;
          }
        }
      } else {
        wordCount += (b.content || "").split(/\s+/).filter(Boolean).length;
      }
    }
    return { totalBlocks, modifiedBlocks, wordCount };
  }, [blocks]);

  async function handleFile(file: File) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.upload(file);
      setDoc(res.document);
      setBlocks(res.blocks);
      setSelected(res.blocks[0] || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Document upload failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePaste(title: string, text: string) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.paste(title, text);
      setDoc(res.document);
      setBlocks(res.blocks);
      setSelected(res.blocks[0] || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Direct text parsing failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLoadSample(sampleId: string) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.loadSample(sampleId);
      setDoc(res.document);
      setBlocks(res.blocks);
      setSelected(res.blocks[0] || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sample loading failed");
    } finally {
      setIsLoading(false);
    }
  }

  function handleBlockUpdated(updated: Block) {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setSelected(updated);
  }

  async function handleDeleteBlock(blockId: string) {
    if (!doc) return;
    try {
      await api.deleteBlock(doc.id, blockId);
      setBlocks((prev) => {
        const next = prev.filter((b) => b.id !== blockId);
        if (selected?.id === blockId) {
          setSelected(next[0] || null);
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete block");
    }
  }

  async function handleSplitBlock(blockId: string) {
    if (!doc) return;
    try {
      const res = await api.splitBlock(doc.id, blockId);
      setBlocks(res.blocks);
      const matched = res.blocks.find((b) => b.id === blockId);
      if (matched) setSelected(matched);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to split block");
    }
  }

  async function handleResetDocument() {
    if (!doc) return;
    try {
      const revertedBlocks = await api.resetDocument(doc.id);
      setBlocks(revertedBlocks);
      if (selected) {
        const refreshed = revertedBlocks.find((b) => b.id === selected.id);
        if (refreshed) setSelected(refreshed);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    }
  }

  async function handleExport(format: "pdf" | "docx" | "txt" | "md") {
    if (!doc) return;
    setIsExporting(true);
    setExportMenuOpen(false);
    try {
      const blob = await api.exportDocument(doc.id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanBaseName = doc.filename.replace(/\.[^.]+$/, "");
      a.download = `${cleanBaseName}_surgical.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Export to ${format.toUpperCase()} failed`);
    } finally {
      setIsExporting(false);
    }
  }

  // Button styling requirement:
  // light purple in light mode only, cyan+orange in dark theme
  const primaryButtonClass = isDark
    ? "bg-gradient-to-r from-cyan-500 via-cyan-400 to-orange-500 hover:from-cyan-400 hover:to-orange-400 text-slate-950 font-bold shadow-cyanOrange border border-cyan-300/40"
    : "bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-purpleGlow border border-purple-400/40";

  const secondaryButtonClass = isDark
    ? "bg-cyber-card text-cyber-text hover:bg-cyber-border border border-cyber-border"
    : "bg-white text-slate-800 hover:bg-purple-50 border border-purple-200 shadow-sm";

  return (
    <div
      className={clsx(
        "relative flex h-screen flex-col overflow-hidden transition-colors duration-500",
        isDark ? "text-cyber-text app-bg-dark" : "text-slate-900 app-bg-light"
      )}
    >
      {/* Interactive Cursor Glow (Cyan+Orange in dark, Light Purple in light) */}
      <CursorGlow />

      {/* Sticky Header Bar */}
      <header
        className={clsx(
          "flex h-14 shrink-0 items-center justify-between border-b px-6 z-20 backdrop-blur-md transition-colors",
          isDark
            ? "bg-cyber-surface/90 border-cyber-border"
            : "bg-white/90 border-purple-200 shadow-sm"
        )}
      >
        {/* Left: Branding & Document Details */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition-transform hover:scale-105 overflow-hidden p-0.5",
                isDark
                  ? "bg-slate-900/90 border-cyan-500/40 shadow-glow"
                  : "bg-white border-purple-200 shadow-purpleGlow"
              )}
            >
              <BrandLogo className="h-full w-full object-contain rounded-md" />
            </div>
            <div className="flex flex-col">
              <span
                className={clsx(
                  "font-extrabold tracking-tight text-sm",
                  isDark ? "text-cyber-text" : "text-slate-900"
                )}
              >
                StructraMorph
                <span className={isDark ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-orange-400" : "text-purple-600"}>
                  .ai
                </span>
              </span>
              <span className={clsx("text-[10px] font-mono", isDark ? "text-cyber-subtle" : "text-slate-400")}>
                {t("appSubtitle")}
              </span>
            </div>
          </div>

          {doc && (
            <div
              className={clsx(
                "ml-4 flex items-center gap-2 pl-4 border-l",
                isDark ? "border-cyber-border" : "border-purple-200"
              )}
            >
              <span
                className={clsx(
                  "rounded px-2 py-0.5 text-xs font-medium border max-w-xs truncate",
                  isDark ? "bg-cyber-card border-cyber-border text-cyber-text" : "bg-purple-50 border-purple-200 text-purple-900"
                )}
              >
                {doc.filename}
              </span>
              <span className={clsx("text-[11px] font-mono", isDark ? "text-cyber-subtle" : "text-slate-500")}>
                {stats.totalBlocks} {t("totalBlocks")} · {stats.wordCount} {t("words")}
              </span>
              {stats.modifiedBlocks > 0 && (
                <span
                  className={clsx(
                    "text-[11px] font-mono px-2 py-0.5 rounded border animate-pulse-subtle",
                    isDark
                      ? "text-orange-300 bg-orange-500/10 border-orange-500/30"
                      : "text-purple-700 bg-purple-100 border-purple-300"
                  )}
                >
                  {stats.modifiedBlocks} {t("modified")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Theme Toggle, Multilingual 10+ Languages, Export Toolbar */}
        <div className="flex items-center gap-2">
          {/* Multilingual Selector (10+ Languages) */}
          <div className="relative">
            <button
              onClick={() => {
                setLangMenuOpen(!langMenuOpen);
                setExportMenuOpen(false);
              }}
              title="Select Language (10+ Languages)"
              className={clsx(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border transition-colors",
                isDark
                  ? "bg-cyber-card text-cyber-text hover:bg-cyber-border border-cyber-border"
                  : "bg-white text-slate-800 hover:bg-purple-50 border-purple-200 shadow-sm"
              )}
            >
              <span>{currentMeta.flag}</span>
              <span className="hidden sm:inline font-mono">{currentMeta.code.toUpperCase()}</span>
              <ChevronDown size={12} className={isDark ? "text-cyber-subtle" : "text-slate-400"} />
            </button>

            {langMenuOpen && (
              <div
                className={clsx(
                  "absolute right-0 top-full mt-1.5 w-48 rounded-lg border p-1 shadow-2xl z-50 max-h-72 overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-100",
                  isDark ? "bg-cyber-surface border-cyber-border" : "bg-white border-purple-200"
                )}
              >
                <div className={clsx("px-2 py-1 text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-cyber-subtle" : "text-slate-400")}>
                  {t("changeLanguage")} ({SUPPORTED_LANGUAGES.length})
                </div>
                {SUPPORTED_LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => {
                      setLanguage(item.code);
                      setLangMenuOpen(false);
                    }}
                    className={clsx(
                      "flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs transition-colors",
                      language === item.code
                        ? isDark
                          ? "bg-cyan-500/15 text-cyan-300 font-semibold"
                          : "bg-purple-100 text-purple-900 font-semibold"
                        : isDark
                        ? "text-cyber-text hover:bg-cyber-card"
                        : "text-slate-700 hover:bg-purple-50"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{item.flag}</span>
                      <span>{item.nativeName}</span>
                    </span>
                    {language === item.code && (
                      <Check size={13} className={isDark ? "text-cyan-400" : "text-purple-600"} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark / Light Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={isDark ? t("lightMode") : t("darkMode")}
            className={clsx(
              "flex items-center gap-1.5 rounded-md p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium border transition-all",
              isDark
                ? "bg-cyber-card text-orange-300 hover:bg-cyber-border border-cyber-border hover:border-orange-500/40 shadow-sm"
                : "bg-white text-purple-700 hover:bg-purple-50 border-purple-200 hover:border-purple-400 shadow-sm"
            )}
          >
            {isDark ? (
              <>
                <Sun size={14} className="text-orange-400 animate-spin-slow" />
                <span className="hidden md:inline">{t("lightMode")}</span>
              </>
            ) : (
              <>
                <Moon size={14} className="text-purple-600" />
                <span className="hidden md:inline">{t("darkMode")}</span>
              </>
            )}
          </button>

          {/* Action buttons if document is active */}
          {doc && (
            <>
              {/* Reset All Changes */}
              <button
                onClick={() => setResetModalOpen(true)}
                disabled={stats.modifiedBlocks === 0}
                className={clsx(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border transition-all disabled:opacity-40",
                  secondaryButtonClass
                )}
              >
                <RotateCcw size={13} />
                {t("resetAll")}
              </button>

              {/* Export Word (.docx) */}
              <button
                onClick={() => handleExport("docx")}
                disabled={isExporting}
                className={clsx(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold border transition-all disabled:opacity-50",
                  secondaryButtonClass
                )}
              >
                <FileDown size={13} className={isDark ? "text-cyan-400" : "text-purple-600"} />
                {t("exportWord")}
              </button>

              {/* Export PDF (Button color requirement: light purple in light mode, cyan+orange in dark mode) */}
              <button
                onClick={() => handleExport("pdf")}
                disabled={isExporting}
                className={clsx(
                  "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 hover:scale-105",
                  primaryButtonClass
                )}
              >
                <Download size={13} />
                {t("exportPdf")}
              </button>

              {/* Dropdown for Markdown & TXT */}
              <div className="relative">
                <button
                  onClick={() => {
                    setExportMenuOpen(!exportMenuOpen);
                    setLangMenuOpen(false);
                  }}
                  className={clsx(
                    "flex items-center gap-1 rounded-md px-2 py-1.5 text-xs border",
                    secondaryButtonClass
                  )}
                >
                  <ChevronDown size={13} />
                </button>

                {exportMenuOpen && (
                  <div
                    className={clsx(
                      "absolute right-0 top-full mt-1.5 w-36 rounded-lg border p-1 shadow-2xl z-50 animate-in fade-in duration-100",
                      isDark ? "bg-cyber-surface border-cyber-border" : "bg-white border-purple-200"
                    )}
                  >
                    <button
                      onClick={() => handleExport("md")}
                      className={clsx(
                        "flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs transition-colors",
                        isDark ? "text-cyber-text hover:bg-cyber-card" : "text-slate-700 hover:bg-purple-50"
                      )}
                    >
                      {t("exportMd")}
                    </button>
                    <button
                      onClick={() => handleExport("txt")}
                      className={clsx(
                        "flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs transition-colors",
                        isDark ? "text-cyber-text hover:bg-cyber-card" : "text-slate-700 hover:bg-purple-50"
                      )}
                    >
                      {t("exportTxt")}
                    </button>
                  </div>
                )}
              </div>

              {/* Ingest New Document */}
              <button
                onClick={() => {
                  setDoc(null);
                  setBlocks([]);
                  setSelected(null);
                }}
                title={t("ingestNew")}
                className={clsx(
                  "ml-1 p-1.5 rounded-md transition-colors",
                  isDark ? "text-cyber-subtle hover:text-cyber-text hover:bg-cyber-card" : "text-slate-400 hover:text-purple-700 hover:bg-purple-50"
                )}
              >
                <FilePlus size={16} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Error Alert Banner */}
      {error && (
        <div className="flex items-center justify-between border-b border-laser-rose/30 bg-laser-rose/10 px-6 py-2 text-xs text-laser-rose z-20">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:text-white font-mono">
            Dismiss [✕]
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <div className="relative flex-1 overflow-hidden z-10">
        {!doc ? (
          <UploadZone
            onFile={handleFile}
            onPaste={handlePaste}
            onLoadSample={handleLoadSample}
            isLoading={isLoading}
          />
        ) : (
          <div className="flex h-full overflow-hidden">
            {/* Left Sidebar: Document Tree Outline */}
            <aside className="w-[360px] shrink-0 h-full overflow-hidden">
              <BlockList
                blocks={blocks}
                selectedId={selected?.id ?? null}
                onSelect={setSelected}
                onDeleteBlock={handleDeleteBlock}
                onSplitBlock={handleSplitBlock}
              />
            </aside>

            {/* Center Canvas: Surgical Block & Tabulation Editor */}
            <section className="flex-1 h-full overflow-hidden">
              <EditorPanel
                block={selected}
                docId={doc.id}
                onBlockUpdated={handleBlockUpdated}
              />
            </section>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Reset All */}
      <ResetModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleResetDocument}
        modifiedCount={stats.modifiedBlocks}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <StructraMorphApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}
