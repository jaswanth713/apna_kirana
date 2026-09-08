import React from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";

export default function OrderItems({ items = [] }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 font-display">
          Ordered Items ({items.length})
        </h3>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                <img
                  src={
                    item.product_image ||
                    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&auto=format&fit=crop&q=80"
                  }
                  alt={item.product_name}
                  className="h-full w-full object-contain mix-blend-multiply"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&auto=format&fit=crop&q=80";
                  }}
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {item.product_name}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {item.unit_info} • Qty: <strong>{item.quantity}</strong> × {formatCurrency(item.unit_price)}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 font-display">
              <span className="text-xs sm:text-sm font-black text-slate-900">
                {formatCurrency(item.total_price)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
