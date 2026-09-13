"use client";

import { useState, useMemo } from "react";
import { computeWordDiff, type DiffSegment } from "@/lib/diff";
import { Columns, Eye, ArrowRight, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/lib/theme";

interface Props {
  original: string;
  modified: string;
  originalLabel?: string;
  modifiedLabel?: string;
}

export default function DiffViewer({
  original,
  modified,
  originalLabel = "Original Extraction",
  modifiedLabel = "Surgically Modified",
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [viewMode, setViewMode] = useState<"inline" | "split">("inline");

  const { segments, stats } = useMemo(() => {
    return computeWordDiff(original, modified);
  }, [original, modified]);

  const hasChanges = original !== modified;

  return (
    <div
      className={clsx(
        "flex flex-col h-full rounded-lg border overflow-hidden shadow-card transition-colors backdrop-blur-md",
        isDark
          ? "border-cyber-border bg-cyber-surface/70"
          : "border-purple-200 bg-white/80"
      )}
    >
      {/* Diff Bar Header */}
      <div
        className={clsx(
          "flex items-center justify-between border-b px-4 py-2.5 transition-colors",
          isDark
            ? "border-cyber-border bg-cyber-surface"
            : "border-purple-200 bg-purple-50/70"
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={clsx(
              "text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5",
              isDark ? "text-cyber-muted" : "text-slate-700"
            )}
          >
            <Eye size={14} className={isDark ? "text-cyan-400" : "text-purple-600"} /> Live Diff Comparator
          </span>

          {hasChanges ? (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="rounded bg-laser-rose/15 text-laser-rose px-2 py-0.5 border border-laser-rose/20">
                -{stats.wordsRemoved} words
              </span>
              <span className="rounded bg-surgical/15 text-surgical px-2 py-0.5 border border-surgical/25 font-medium">
                +{stats.wordsAdded} words
              </span>
            </div>
          ) : (
            <span
              className={clsx(
                "flex items-center gap-1 text-xs px-2 py-0.5 rounded border",
                isDark
                  ? "text-cyber-muted bg-cyber-card border-cyber-border"
                  : "text-slate-600 bg-white border-purple-200"
              )}
            >
              <CheckCircle2 size={12} className={isDark ? "text-cyan-400" : "text-purple-600"} /> Identical to Original
            </span>
          )}
        </div>

        {/* View Toggle */}
        <div
          className={clsx(
            "flex items-center gap-1 p-0.5 rounded border",
            isDark ? "bg-cyber-card border-cyber-border" : "bg-white border-purple-200 shadow-sm"
          )}
        >
          <button
            onClick={() => setViewMode("inline")}
            className={clsx(
              "px-2.5 py-1 text-xs rounded transition-all font-medium",
              viewMode === "inline"
                ? isDark
                  ? "bg-cyber-surface text-cyan-300 shadow-sm border border-cyan-500/30"
                  : "bg-purple-600 text-white shadow-sm"
                : isDark
                ? "text-cyber-muted hover:text-cyber-text"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Inline Diff
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={clsx(
              "px-2.5 py-1 text-xs rounded transition-all font-medium flex items-center gap-1",
              viewMode === "split"
                ? isDark
                  ? "bg-cyber-surface text-cyan-300 shadow-sm border border-cyan-500/30"
                  : "bg-purple-600 text-white shadow-sm"
                : isDark
                ? "text-cyber-muted hover:text-cyber-text"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Columns size={12} /> Side-by-Side
          </button>
        </div>
      </div>

      {/* Diff Body Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {viewMode === "inline" ? (
          <div
            className={clsx(
              "text-sm leading-relaxed whitespace-pre-wrap font-sans p-3 rounded border",
              isDark
                ? "bg-cyber-card/40 border-cyber-border/60 text-cyber-text"
                : "bg-white border-purple-200/80 text-slate-900 shadow-sm"
            )}
          >
            {segments.map((seg: DiffSegment, index: number) => {
              if (seg.type === "added") {
                return (
                  <span key={index} className="diff-add">
                    {seg.value}
                  </span>
                );
              }
              if (seg.type === "removed") {
                return (
                  <span key={index} className="diff-del">
                    {seg.value}
                  </span>
                );
              }
              return <span key={index}>{seg.value}</span>;
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Original Column */}
            <div
              className={clsx(
                "flex flex-col rounded border overflow-hidden",
                isDark ? "border-cyber-border/70 bg-cyber-card/50" : "border-purple-200/80 bg-white"
              )}
            >
              <div
                className={clsx(
                  "px-3 py-1.5 border-b text-xs font-semibold flex items-center justify-between",
                  isDark ? "border-cyber-border bg-cyber-surface text-cyber-muted" : "border-purple-200 bg-purple-50/50 text-slate-700"
                )}
              >
                <span>{originalLabel}</span>
                <span className="font-mono text-[11px]">{stats.wordsOriginal} words</span>
              </div>
              <div
                className={clsx(
                  "p-3 text-sm leading-relaxed whitespace-pre-wrap font-sans flex-1 overflow-y-auto",
                  isDark ? "text-cyber-muted" : "text-slate-600"
                )}
              >
                {original || <span className="italic text-slate-400">(Empty)</span>}
              </div>
            </div>

            {/* Modified Column */}
            <div
              className={clsx(
                "flex flex-col rounded border overflow-hidden",
                isDark
                  ? "border-cyan-500/30 bg-cyber-card/50 shadow-glow"
                  : "border-purple-400 bg-white shadow-purpleGlow"
              )}
            >
              <div
                className={clsx(
                  "px-3 py-1.5 border-b text-xs font-semibold flex items-center justify-between",
                  isDark ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-300" : "border-purple-200 bg-purple-100/70 text-purple-900"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <ArrowRight size={12} className={isDark ? "text-cyan-400" : "text-purple-600"} /> {modifiedLabel}
                </span>
                <span className="font-mono text-[11px]">{stats.wordsModified} words</span>
              </div>
              <div
                className={clsx(
                  "p-3 text-sm leading-relaxed whitespace-pre-wrap font-sans flex-1 overflow-y-auto",
                  isDark ? "text-cyber-text" : "text-slate-900"
                )}
              >
                {modified || <span className="italic text-slate-400">(Empty)</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
