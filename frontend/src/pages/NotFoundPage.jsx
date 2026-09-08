import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 px-4">
      <div className="h-16 w-16 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-2xl">
        404
      </div>
      <h1 className="text-2xl font-black text-slate-900 font-display">Page Not Found</h1>
      <p className="text-xs text-slate-500 max-w-sm">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/" className="btn-primary py-2.5 px-6 text-xs font-bold inline-flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Return to Store
      </Link>
    </div>
  );
}
