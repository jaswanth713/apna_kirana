import React from "react";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  CheckCheck,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function OrderTimeline({ status, cancellationReason, createdAt }) {
  const steps = [
    { key: "PENDING", label: "Order Placed", icon: Clock },
    { key: "CONFIRMED", label: "Order Confirmed", icon: CheckCircle2 },
    { key: "PREPARING", label: "Packing / Preparing", icon: Package },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: Truck },
    { key: "DELIVERED", label: "Delivered", icon: CheckCheck },
  ];

  const statusOrder = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
  const currentIdx = statusOrder.indexOf(status?.toUpperCase());

  if (status?.toUpperCase() === "CANCELLED") {
    return (
      <div className="bg-rose-50 rounded-2xl p-5 border border-rose-200 space-y-2">
        <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
          <XCircle className="h-5 w-5" />
          <span>This Order Has Been Cancelled</span>
        </div>
        <p className="text-xs text-rose-600">
          <strong>Reason:</strong> {cancellationReason || "Cancelled by customer"}
        </p>
        <p className="text-[11px] text-slate-500">
          No charges apply. Any inventory reserved for this order has been returned to the store.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 font-display">
          Delivery Tracking Status
        </h3>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-brand-600" />
          Estimated SLA: <strong>30–45 Mins</strong>
        </span>
      </div>

      {/* Stepper Bar */}
      <div className="relative">
        {/* Connecting Line */}
        <div className="hidden sm:block absolute top-5 left-6 right-6 h-0.5 bg-slate-100 -z-0">
          <div
            className="h-full bg-brand-600 transition-all duration-500"
            style={{
              width: `${(Math.max(0, currentIdx) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
          {steps.map((step, idx) => {
            const isCompleted = currentIdx >= idx;
            const isCurrent = currentIdx === idx;
            const Icon = step.icon;

            return (
              <div
                key={step.key}
                className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center"
              >
                <div
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 ${
                    isCurrent
                      ? "bg-brand-600 text-white shadow-md ring-4 ring-brand-100"
                      : isCompleted
                      ? "bg-brand-50 text-brand-700 border border-brand-200"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <h4
                    className={`text-xs font-bold leading-tight ${
                      isCurrent
                        ? "text-brand-700"
                        : isCompleted
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider block mt-0.5">
                      Current Status
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
