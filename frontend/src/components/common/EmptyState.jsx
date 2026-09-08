import React from "react";
import { PackageOpen, RotateCcw } from "lucide-react";

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = "No Products Found",
  message = "We couldn't find any products matching your active search or filters.",
  actionLabel,
  onAction,
  onReset,
}) {
  const handleAction = onAction || onReset;
  const label = actionLabel || (onReset ? "Clear Filters" : "Go Back");

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-soft text-center space-y-4 max-w-md mx-auto">
      <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
        <Icon className="h-8 w-8" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900 font-display">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
      </div>
      {handleAction && (
        <button
          type="button"
          onClick={handleAction}
          className="btn-secondary text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" /> {label}
        </button>
      )}
    </div>
  );
}
