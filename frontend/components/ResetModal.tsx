"use client";

import { AlertTriangle, RotateCcw, X } from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  modifiedCount: number;
}

export default function ResetModal({
  isOpen,
  onClose,
  onConfirm,
  modifiedCount,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={clsx(
          "w-full max-w-md rounded-xl border p-6 shadow-2xl relative transition-all",
          isDark
            ? "border-orange-500/40 bg-cyber-surface text-cyber-text"
            : "border-purple-300 bg-white text-slate-900 shadow-xl"
        )}
      >
        <button
          onClick={onClose}
          className={clsx("absolute right-4 top-4 p-1 rounded transition-colors", isDark ? "text-cyber-subtle hover:text-white" : "text-slate-400 hover:text-slate-800")}
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3">
          <div
            className={clsx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
              isDark ? "bg-orange-500/15 text-orange-400 border-orange-500/30" : "bg-purple-100 text-purple-700 border-purple-200"
            )}
          >
            <AlertTriangle size={20} />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              {t("revertConfirmTitle")}
            </h3>
            <p className={clsx("text-xs leading-relaxed", isDark ? "text-cyber-muted" : "text-slate-600")}>
              {t("revertConfirmDesc")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className={clsx(
              "rounded px-3.5 py-1.5 text-xs font-medium border transition-colors",
              isDark
                ? "text-cyber-muted hover:text-cyber-text hover:bg-cyber-card border-cyber-border"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
            )}
          >
            {t("cancel")}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={clsx(
              "flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-semibold shadow-sm transition-all",
              isDark
                ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 shadow-cyanOrange"
                : "bg-purple-600 hover:bg-purple-500 text-white shadow-purpleGlow"
            )}
          >
            <RotateCcw size={13} /> {t("confirmFullReset")} ({modifiedCount})
          </button>
        </div>
      </div>
    </div>
  );
}
