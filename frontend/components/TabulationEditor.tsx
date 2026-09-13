"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Table as TableIcon,
  Copy,
  Download,
  RotateCcw,
} from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

interface Props {
  data: string[][];
  onChange: (newData: string[][]) => void;
  originalData?: string[][] | null;
}

export default function TabulationEditor({
  data,
  onChange,
  originalData,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);

  const rows = data.length > 0 ? data : [["", ""]];
  const colCount = rows[0]?.length || 2;

  function updateCell(r: number, c: number, value: string) {
    const updated = rows.map((row, rIdx) => {
      if (rIdx !== r) return [...row];
      const newRow = [...row];
      newRow[c] = value;
      return newRow;
    });
    onChange(updated);
  }

  function addRow(afterIndex?: number) {
    const newRow = new Array(colCount).fill("");
    const updated = [...rows];
    if (typeof afterIndex === "number") {
      updated.splice(afterIndex + 1, 0, newRow);
    } else {
      updated.push(newRow);
    }
    onChange(updated);
  }

  function deleteRow(rIndex: number) {
    if (rows.length <= 1) return;
    const updated = rows.filter((_, idx) => idx !== rIndex);
    onChange(updated);
  }

  function duplicateRow(rIndex: number) {
    const updated = [...rows];
    updated.splice(rIndex + 1, 0, [...rows[rIndex]]);
    onChange(updated);
  }

  function addColumn() {
    const updated = rows.map((row) => [...row, ""]);
    onChange(updated);
  }

  function deleteColumn(cIndex: number) {
    if (colCount <= 1) return;
    const updated = rows.map((row) => row.filter((_, idx) => idx !== cIndex));
    onChange(updated);
  }

  function resetTable() {
    if (originalData && originalData.length > 0) {
      onChange(originalData.map((row) => [...row]));
    }
  }

  function exportCSV() {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows
        .map((row) =>
          row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "table_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div
      className={clsx(
        "flex flex-col h-full rounded-lg border overflow-hidden shadow-card transition-colors backdrop-blur-md",
        isDark
          ? "border-cyber-border bg-cyber-card/60"
          : "border-purple-200 bg-white/80 shadow-md"
      )}
    >
      {/* Spreadsheet Toolbar */}
      <div
        className={clsx(
          "flex items-center justify-between border-b px-4 py-2.5 transition-colors",
          isDark
            ? "border-cyber-border bg-cyber-surface/90"
            : "border-purple-200 bg-purple-50/70"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <TableIcon size={15} className={isDark ? "text-cyan-400" : "text-purple-600"} />
            <span className={isDark ? "text-cyber-text" : "text-slate-900"}>{t("tabulationTitle")}</span>
          </div>
          <span
            className={clsx(
              "text-xs font-mono px-2 py-0.5 rounded border",
              isDark
                ? "text-orange-300 bg-cyber-card border-cyber-border"
                : "text-purple-700 bg-white border-purple-200"
            )}
          >
            {rows.length} rows × {colCount} cols
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => addRow()}
            className={clsx(
              "flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium border transition-colors",
              isDark
                ? "bg-cyber-surface text-cyan-300 hover:bg-cyber-border border-cyber-border"
                : "bg-white text-purple-700 hover:bg-purple-100 border-purple-200 shadow-sm"
            )}
          >
            <Plus size={13} className={isDark ? "text-cyan-400" : "text-purple-600"} /> {t("addRow")}
          </button>

          <button
            onClick={addColumn}
            className={clsx(
              "flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium border transition-colors",
              isDark
                ? "bg-cyber-surface text-orange-300 hover:bg-cyber-border border-cyber-border"
                : "bg-white text-purple-700 hover:bg-purple-100 border-purple-200 shadow-sm"
            )}
          >
            <Plus size={13} className={isDark ? "text-orange-400" : "text-purple-600"} /> {t("addColumn")}
          </button>

          <button
            onClick={exportCSV}
            title="Export CSV"
            className={clsx(
              "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium border transition-colors",
              isDark
                ? "bg-cyber-surface text-cyber-muted hover:text-white border-cyber-border"
                : "bg-white text-slate-600 hover:text-slate-900 border-purple-200 shadow-sm"
            )}
          >
            <Download size={13} /> CSV
          </button>

          {originalData && (
            <button
              onClick={resetTable}
              title={t("resetTable")}
              className={clsx(
                "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium border transition-colors",
                isDark
                  ? "bg-cyber-surface text-cyber-muted hover:text-orange-400 border-cyber-border"
                  : "bg-white text-slate-600 hover:text-purple-700 border-purple-200 shadow-sm"
              )}
            >
              <RotateCcw size={13} /> {t("resetTable")}
            </button>
          )}
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="flex-1 overflow-auto p-4 scrollbar-thin">
        <div
          className={clsx(
            "inline-block min-w-full rounded border overflow-hidden shadow-inner transition-colors",
            isDark
              ? "border-cyber-border bg-cyber-surface/40"
              : "border-purple-200 bg-white"
          )}
        >
          <table className="w-full border-collapse text-sm text-left">
            <thead>
              <tr
                className={clsx(
                  "border-b transition-colors",
                  isDark ? "bg-cyber-surface/90 border-cyber-border" : "bg-purple-50/80 border-purple-200"
                )}
              >
                <th className={clsx("w-12 border-r p-2 text-center font-mono text-[11px]", isDark ? "border-cyber-border text-cyber-subtle" : "border-purple-200 text-purple-600")}>
                  #
                </th>
                {Array.from({ length: colCount }).map((_, c) => (
                  <th
                    key={c}
                    className={clsx("border-r p-2 font-mono text-[11px] relative group", isDark ? "border-cyber-border text-cyber-muted" : "border-purple-200 text-purple-900")}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        COL {String.fromCharCode(65 + (c % 26))}
                      </span>
                      {colCount > 1 && (
                        <button
                          onClick={() => deleteColumn(c)}
                          title={`Delete Column ${String.fromCharCode(65 + (c % 26))}`}
                          className="opacity-0 group-hover:opacity-100 hover:text-laser-rose p-0.5 rounded transition-opacity"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className={clsx("w-16 p-2 text-center font-mono text-[11px]", isDark ? "text-cyber-subtle" : "text-purple-600")}>
                  Act
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => {
                const isHeaderRow = r === 0;
                return (
                  <tr
                    key={r}
                    className={clsx(
                      "border-b transition-colors",
                      isDark ? "border-cyber-border/60" : "border-purple-100",
                      isHeaderRow
                        ? isDark ? "bg-cyber-card/70 font-semibold" : "bg-purple-50/50 font-semibold"
                        : isDark ? "hover:bg-cyber-card/40" : "hover:bg-purple-50/20"
                    )}
                  >
                    <td
                      className={clsx(
                        "border-r p-2 text-center font-mono text-xs select-none",
                        isDark ? "border-cyber-border bg-cyber-surface/50 text-cyber-subtle" : "border-purple-200 bg-purple-50/30 text-purple-600"
                      )}
                    >
                      {r + 1}
                    </td>

                    {row.map((cell, c) => {
                      const isFocused = selectedCell?.r === r && selectedCell?.c === c;
                      return (
                        <td
                          key={c}
                          className={clsx(
                            "border-r p-0 transition-all",
                            isDark ? "border-cyber-border/50" : "border-purple-100",
                            isFocused
                              ? isDark
                                ? "bg-cyan-500/10 ring-1 ring-cyan-400"
                                : "bg-purple-100/60 ring-1 ring-purple-500"
                              : ""
                          )}
                        >
                          <input
                            type="text"
                            value={cell || ""}
                            onFocus={() => setSelectedCell({ r, c })}
                            onChange={(e) => updateCell(r, c, e.target.value)}
                            className={clsx(
                              "w-full min-w-[140px] bg-transparent px-3 py-2 text-xs font-sans outline-none",
                              isHeaderRow
                                ? isDark ? "font-semibold text-cyan-300" : "font-semibold text-purple-900"
                                : isDark ? "text-cyber-text" : "text-slate-800"
                            )}
                          />
                        </td>
                      );
                    })}

                    <td className={clsx("p-1 text-center", isDark ? "bg-cyber-surface/30" : "bg-purple-50/20")}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => duplicateRow(r)}
                          title="Duplicate"
                          className={clsx("p-1 rounded transition-colors", isDark ? "text-cyber-subtle hover:text-white" : "text-slate-400 hover:text-purple-700")}
                        >
                          <Copy size={12} />
                        </button>
                        {rows.length > 1 && (
                          <button
                            onClick={() => deleteRow(r)}
                            title="Delete"
                            className="p-1 text-slate-400 hover:text-laser-rose transition-colors rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
