import React from "react";
import { Link, Outlet } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md">
            <ShoppingBag className="h-7 w-7" />
          </div>
        </Link>
        <h2 className="text-2xl font-black text-slate-900 font-display">
          Apna<span className="text-brand-600">Kirana</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Your neighborhood local general store
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-soft rounded-2xl border border-slate-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
