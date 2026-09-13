"use client";

import { useMemo, useState } from "react";
import {
  Heading1,
  Heading2,
  Type,
  AlignLeft,
  Table2,
  MinusSquare,
  Search,
  X,
  Sparkles,
  Scissors,
  Trash2,
  Filter,
  ListChecks,
  Image as ImageIcon,
} from "lucide-react";
import clsx from "clsx";
import type { Block } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

type FilterCategory =
  | "all"
  | "title"
  | "heading"
  | "sub_heading"
  | "body"
  | "sub_content"
  | "table"
  | "image"
  | "footer";

interface Props {
  blocks: Block[];
  selectedId: string | null;
  onSelect: (block: Block) => void;
  onDeleteBlock?: (blockId: string) => void;
  onSplitBlock?: (blockId: string) => void;
}

export default function BlockList({
  blocks,
  selectedId,
  onSelect,
  onDeleteBlock,
  onSplitBlock,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filterItems: { key: FilterCategory; labelKey: string }[] = [
    { key: "all", labelKey: "allBlocks" },
    { key: "title", labelKey: "titles" },
    { key: "heading", labelKey: "headings" },
    { key: "sub_heading", labelKey: "subHeadings" },
    { key: "body", labelKey: "bodyText" },
    { key: "sub_content", labelKey: "subContents" },
    { key: "table", labelKey: "tables" },
    { key: "image", labelKey: "images" },
    { key: "footer", labelKey: "footers" },
  ];

  const typeConfig: Record<
    string,
    { labelKey: string; icon: React.ElementType; darkBadge: string; lightBadge: string }
  > = {
    title: {
      labelKey: "titles",
      icon: Type,
      darkBadge: "bg-laser-violet/15 text-laser-violet border-laser-violet/30",
      lightBadge: "bg-purple-100 text-purple-700 border-purple-200",
    },
    main_heading: {
      labelKey: "headings",
      icon: Heading1,
      darkBadge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
      lightBadge: "bg-blue-100 text-blue-700 border-blue-200",
    },
    heading: {
      labelKey: "headings",
      icon: Heading1,
      darkBadge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
      lightBadge: "bg-blue-100 text-blue-700 border-blue-200",
    },
    sub_heading: {
      labelKey: "subHeadings",
      icon: Heading2,
      darkBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      lightBadge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    },
    subheading: {
      labelKey: "subHeadings",
      icon: Heading2,
      darkBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      lightBadge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    },
    body: {
      labelKey: "bodyText",
      icon: AlignLeft,
      darkBadge: "bg-slate-700/30 text-slate-300 border-slate-700",
      lightBadge: "bg-slate-100 text-slate-700 border-slate-200",
    },
    sub_content: {
      labelKey: "subContents",
      icon: ListChecks,
      darkBadge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
      lightBadge: "bg-teal-100 text-teal-800 border-teal-200",
    },
    table: {
      labelKey: "tables",
      icon: Table2,
      darkBadge: "bg-orange-500/15 text-orange-300 border-orange-500/30",
      lightBadge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    image: {
      labelKey: "images",
      icon: ImageIcon,
      darkBadge: "bg-pink-500/15 text-pink-300 border-pink-500/30",
      lightBadge: "bg-pink-100 text-pink-700 border-pink-200",
    },
    footer: {
      labelKey: "footers",
      icon: MinusSquare,
      darkBadge: "bg-amber-400/15 text-amber-300 border-amber-400/30",
      lightBadge: "bg-amber-100 text-amber-800 border-amber-200",
    },
  };

  const normalizeType = (tStr: string): FilterCategory => {
    if (tStr === "main_heading" || tStr === "heading") return "heading";
    if (tStr === "sub_heading" || tStr === "subheading") return "sub_heading";
    if (tStr === "title") return "title";
    if (tStr === "sub_content") return "sub_content";
    if (tStr === "table") return "table";
    if (tStr === "image") return "image";
    if (tStr === "footer") return "footer";
    return "body";
  };

  const filteredBlocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return blocks.filter((b) => {
      if (activeFilter !== "all" && normalizeType(b.type) !== activeFilter) {
        return false;
      }
      if (q) {
        if (b.type === "table" && b.table_data) {
          const matches = b.table_data.some((row) =>
            row.some((cell) => cell?.toLowerCase().includes(q))
          );
          if (!matches) return false;
        } else {
          if (!b.content?.toLowerCase().includes(q)) return false;
        }
      }
      return true;
    });
  }, [blocks, activeFilter, searchQuery]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: blocks.length };
    for (const b of blocks) {
      const norm = normalizeType(b.type);
      c[norm] = (c[norm] || 0) + 1;
    }
    return c;
  }, [blocks]);

  return (
    <div
      className={clsx(
        "flex h-full flex-col border-r backdrop-blur-md transition-colors",
        isDark
          ? "bg-cyber-surface/85 border-cyber-border"
          : "bg-white/85 border-purple-200 shadow-sm"
      )}
    >
      {/* Top Search & Filter Bar */}
      <div
        className={clsx(
          "p-3.5 border-b space-y-3",
          isDark ? "bg-cyber-card/40 border-cyber-border" : "bg-purple-50/40 border-purple-100"
        )}
      >
        <div className="flex items-center justify-between">
          <span
            className={clsx(
              "text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5",
              isDark ? "text-cyber-muted" : "text-slate-700"
            )}
          >
            <Filter size={13} className={isDark ? "text-cyan-400" : "text-purple-600"} />
            {t("documentTree")} ({blocks.length})
          </span>
          <span
            className={clsx(
              "text-[11px] font-mono px-2 py-0.5 rounded border",
              isDark
                ? "text-orange-300 bg-orange-500/10 border-orange-500/20"
                : "text-purple-700 bg-purple-100 border-purple-200"
            )}
          >
            {blocks.filter((b) => b.edited).length} {t("modified")}
          </span>
        </div>

        {/* Real-time search */}
        <div className="relative">
          <Search
            size={13}
            className={clsx("absolute left-3 top-1/2 -translate-y-1/2", isDark ? "text-cyber-subtle" : "text-slate-400")}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className={clsx(
              "w-full rounded pl-8 pr-7 py-1.5 text-xs border outline-none transition-all",
              isDark
                ? "bg-cyber-surface text-cyber-text placeholder:text-cyber-subtle border-cyber-border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                : "bg-white text-slate-900 placeholder:text-slate-400 border-purple-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={clsx("absolute right-2.5 top-1/2 -translate-y-1/2", isDark ? "text-cyber-subtle hover:text-white" : "text-slate-400 hover:text-slate-700")}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1">
          {filterItems.map((item) => {
            const count = counts[item.key] || 0;
            const isActive = activeFilter === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveFilter(item.key)}
                className={clsx(
                  "rounded px-2 py-1 text-[11px] font-medium transition-all flex items-center gap-1",
                  isActive
                    ? isDark
                      ? "bg-gradient-to-r from-cyan-500 to-orange-500 text-slate-950 font-bold shadow-cyanOrange"
                      : "bg-purple-600 text-white font-semibold shadow-purpleGlow"
                    : isDark
                    ? "bg-cyber-card/80 text-cyber-muted hover:bg-cyber-border hover:text-cyber-text border border-cyber-border/80"
                    : "bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-900 border border-purple-200/80"
                )}
              >
                <span>{t(item.labelKey)}</span>
                <span
                  className={clsx(
                    "text-[10px] px-1 rounded font-mono",
                    isActive
                      ? isDark ? "bg-slate-950/20 text-slate-950" : "bg-white/25 text-white"
                      : isDark ? "text-cyber-subtle" : "text-slate-400"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Block List Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
        {filteredBlocks.length === 0 ? (
          <div className={clsx("p-8 text-center text-xs", isDark ? "text-cyber-subtle" : "text-slate-400")}>
            {t("noBlocksFound")}
          </div>
        ) : (
          filteredBlocks.map((block) => {
            const isSelected = block.id === selectedId;
            const meta = typeConfig[block.type] || typeConfig.body;
            const Icon = meta.icon;

            const preview =
              block.type === "table"
                ? `${t("tables")} (${block.table_data?.length || 0} × ${
                    block.table_data?.[0]?.length || 0
                  })`
                : block.type === "image"
                ? `[Extracted Visual Image] ${block.content}`
                : block.content
                ? block.content.slice(0, 95) + (block.content.length > 95 ? "…" : "")
                : "(Empty content)";

            return (
              <div
                key={block.id}
                onClick={() => onSelect(block)}
                className={clsx(
                  "group relative cursor-pointer rounded-md p-3 transition-all border text-left",
                  isSelected
                    ? isDark
                      ? "bg-cyber-card border-cyan-400 shadow-glow ring-1 ring-cyan-400/40"
                      : "bg-purple-50 border-purple-500 shadow-purpleGlow ring-1 ring-purple-500/30"
                    : isDark
                    ? "bg-cyber-surface/60 hover:bg-cyber-card/70 border-cyber-border/80 hover:border-cyber-borderLight"
                    : "bg-white/70 hover:bg-white border-purple-100 hover:border-purple-200"
                )}
              >
                {/* Meta Row */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={clsx(
                        "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border",
                        isDark ? meta.darkBadge : meta.lightBadge
                      )}
                    >
                      <Icon size={11} />
                      {t(meta.labelKey)}
                    </span>

                    {/* Font Size Tag */}
                    {block.font_size && (
                      <span
                        className={clsx(
                          "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                          isDark
                            ? "bg-cyber-card border-cyan-500/20 text-cyan-300"
                            : "bg-purple-50 border-purple-200 text-purple-700"
                        )}
                      >
                        {block.font_size}pt
                      </span>
                    )}

                    {block.page && (
                      <span
                        className={clsx(
                          "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                          isDark ? "bg-cyber-card border-cyber-border/60 text-cyber-subtle" : "bg-slate-50 border-slate-200 text-slate-500"
                        )}
                      >
                        p.{block.page}
                      </span>
                    )}
                  </div>

                  {block.edited && (
                    <span
                      className={clsx(
                        "flex items-center gap-1 text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded border animate-pulse-subtle",
                        isDark
                          ? "text-orange-300 bg-orange-500/15 border-orange-500/30"
                          : "text-purple-700 bg-purple-100 border-purple-300"
                      )}
                    >
                      <Sparkles size={10} /> {t("modified")}
                    </span>
                  )}
                </div>

                {/* Preview Thumbnail if Image block */}
                {block.type === "image" && block.image_url && (
                  <div className="mb-2 rounded overflow-hidden border border-cyber-border max-h-24 bg-black/20 flex items-center justify-center">
                    <img
                      src={block.image_url}
                      alt={block.content || "Document Visual Asset"}
                      className="max-h-24 w-auto object-contain"
                    />
                  </div>
                )}

                {/* Preview text */}
                <p
                  className={clsx(
                    "text-xs leading-relaxed line-clamp-2",
                    block.type === "title" || block.type === "heading" || block.type === "main_heading"
                      ? isDark ? "font-semibold text-cyber-text" : "font-semibold text-slate-900"
                      : isDark ? "text-cyber-muted" : "text-slate-600",
                    block.type === "table" && (isDark ? "font-mono text-[11px] text-orange-300" : "font-mono text-[11px] text-purple-700"),
                    block.type === "image" && (isDark ? "font-mono text-[11px] text-pink-300" : "font-mono text-[11px] text-pink-700")
                  )}
                >
                  {preview}
                </p>

                {/* Quick actions on hover */}
                <div
                  className={clsx(
                    "absolute right-2 bottom-2 hidden group-hover:flex items-center gap-1 px-1.5 py-0.5 rounded border shadow-sm",
                    isDark ? "bg-cyber-surface/95 border-cyber-border" : "bg-white/95 border-purple-200"
                  )}
                >
                  {block.type !== "table" && block.type !== "image" && onSplitBlock && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSplitBlock(block.id);
                      }}
                      title="Split this block at midpoint"
                      className={clsx("p-1 transition-colors", isDark ? "text-cyber-subtle hover:text-cyan-400" : "text-slate-400 hover:text-purple-600")}
                    >
                      <Scissors size={11} />
                    </button>
                  )}
                  {onDeleteBlock && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBlock(block.id);
                      }}
                      title="Delete block"
                      className="p-1 text-slate-400 hover:text-laser-rose transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
