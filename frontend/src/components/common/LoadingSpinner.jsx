import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingSpinner({ text = "Loading fresh products..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      <p className="text-xs font-medium">{text}</p>
    </div>
  );
}

export function ProductSkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs space-y-3 animate-pulse"
        >
          <div className="bg-slate-100 rounded-xl h-36 w-full" />
          <div className="space-y-1.5">
            <div className="h-3 bg-slate-100 rounded w-1/3" />
            <div className="h-4 bg-slate-100 rounded w-4/5" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="h-5 bg-slate-100 rounded w-1/3" />
            <div className="h-8 bg-slate-100 rounded-xl w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingSpinner;
