import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Banknote, ArrowRight, Package } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export default function OrderCard({ order }) {
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            Confirmed
          </span>
        );
      case "PREPARING":
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            Packing / Preparing
          </span>
        );
      case "OUT_FOR_DELIVERY":
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            Out for Delivery
          </span>
        );
      case "DELIVERED":
        return (
          <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            Delivered
          </span>
        );
      case "CANCELLED":
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4 hover:border-brand-200 hover:shadow-soft transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-slate-900">
              {order.order_number}
            </span>
            {getStatusBadge(order.order_status)}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(order.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Banknote className="h-3 w-3 text-emerald-600" />
              {order.payment_method}
            </span>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Total Amount
          </span>
          <span className="text-base font-black text-slate-900 font-display">
            {formatCurrency(order.total_amount)}
          </span>
        </div>
      </div>

      {/* Items Preview Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {order.items?.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden"
              title={`${item.product_name} (${item.quantity}x)`}
            >
              <img
                src={
                  item.product_image ||
                  "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100&auto=format&fit=crop&q=80"
                }
                alt={item.product_name}
                className="h-full w-full object-contain mix-blend-multiply"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100&auto=format&fit=crop&q=80";
                }}
              />
            </div>
          ))}
          {order.items?.length > 4 && (
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg shrink-0">
              +{order.items.length - 4} more
            </span>
          )}
        </div>

        <Link
          to={`/orders/${order.order_number || order.id}`}
          className="btn-secondary py-2 px-3 text-xs font-bold inline-flex items-center gap-1 shrink-0 hover:border-brand-300"
        >
          <span>Track Order</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
