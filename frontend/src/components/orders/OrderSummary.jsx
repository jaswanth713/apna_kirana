import React from "react";
import { MapPin, Banknote, ShieldCheck, FileText } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export default function OrderSummary({ order, onOpenInvoice }) {
  if (!order) return null;

  return (
    <div className="space-y-4">
      {/* Bill Breakdown Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 font-display">
            Bill Summary
          </h3>
          {onOpenInvoice && (
            <button
              type="button"
              onClick={onOpenInvoice}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition"
            >
              <FileText className="h-3.5 w-3.5" /> View Receipt
            </button>
          )}
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Item Subtotal</span>
            <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
          </div>

          {order.discount_amount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Total Savings</span>
              <span>-{formatCurrency(order.discount_amount)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee</span>
            <span>
              {order.delivery_fee === 0 ? (
                <strong className="text-emerald-600">FREE</strong>
              ) : (
                formatCurrency(order.delivery_fee)
              )}
            </span>
          </div>

          <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline text-slate-900">
            <span className="font-bold text-sm">Total Paid / Payable</span>
            <span className="font-black text-xl font-display text-slate-900">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Payment mode pill */}
        <div className="pt-2">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5 text-xs text-slate-700">
            <Banknote className="h-4 w-4 text-accent-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900">
                Payment: {order.payment_method} ({order.payment_status})
              </span>
              <p className="text-[11px] text-slate-500">Pay cash/UPI at doorstep upon delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Address Card */}
      {order.delivery_address && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <MapPin className="h-4 w-4 text-brand-600" />
            <span>Delivery Address</span>
          </div>

          <div className="text-xs space-y-1 text-slate-600 leading-relaxed pl-6">
            <p className="font-bold text-slate-900">
              {order.delivery_address.recipient_name}
            </p>
            <p>
              {order.delivery_address.address_line}
              {order.delivery_address.landmark && `, ${order.delivery_address.landmark}`}
            </p>
            <p>
              {order.delivery_address.city}, {order.delivery_address.state} -{" "}
              <strong>{order.delivery_address.pincode}</strong>
            </p>
            <p className="text-[11px] text-slate-500 pt-1">
              Phone: <strong>{order.delivery_address.phone}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Customer Notes */}
      {order.customer_notes && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-600 space-y-1">
          <span className="font-bold text-slate-800 block">Delivery Instructions:</span>
          <p className="italic">"{order.customer_notes}"</p>
        </div>
      )}
    </div>
  );
}
