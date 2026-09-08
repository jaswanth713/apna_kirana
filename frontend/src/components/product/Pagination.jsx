import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.total_pages <= 1) return null;

  const { page, total_pages, has_next, has_prev } = pagination;

  // Generate page numbers
  const pages = [];
  for (let i = 1; i <= total_pages; i++) {
    if (
      i === 1 ||
      i === total_pages ||
      (i >= page - 1 && i <= page + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 pt-6 sm:pt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!has_prev}
        className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {pages.map((p, idx) => (
        <button
          key={idx}
          onClick={() => typeof p === "number" && onPageChange(p)}
          disabled={p === "..." || p === page}
          className={`h-9 w-9 rounded-xl text-xs font-bold transition flex items-center justify-center ${
            p === page
              ? "bg-brand-600 text-white shadow-sm"
              : p === "..."
              ? "text-slate-400 cursor-default bg-transparent"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-2xs"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!has_next}
        className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
