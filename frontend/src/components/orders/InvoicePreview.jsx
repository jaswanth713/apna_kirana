import React from "react";
import { X, Printer, ShoppingBag, Download } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export default function InvoicePreview({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
        {/* Header Actions */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Order Invoice Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-secondary py-1.5 px-3 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 sm:p-10 space-y-6 text-slate-800 font-sans print:p-0">
          {/* Store Branding */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <h1 className="text-xl font-black font-display text-slate-900">
                  Apna<span className="text-brand-600">Kirana</span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">Regional Express SuperStore</p>
              <p className="text-[11px] text-slate-400">Neighborhood Groceries & Snacks</p>
            </div>

            <div className="text-right text-xs">
              <span className="text-xs font-black font-mono text-slate-900 block">
                {order.order_number}
              </span>
              <p className="text-slate-500">
                Date:{" "}
                {new Date(order.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <span className="inline-block mt-1 bg-slate-100 font-semibold px-2 py-0.5 rounded text-[10px] text-slate-700">
                Status: {order.order_status}
              </span>
            </div>
          </div>

          {/* Customer & Delivery Address */}
          {order.delivery_address && (
            <div className="text-xs grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">
                  Billed & Delivered To:
                </span>
                <p className="font-bold text-slate-900">{order.delivery_address.recipient_name}</p>
                <p className="text-slate-600 leading-snug">
                  {order.delivery_address.address_line}
                  {order.delivery_address.landmark && `, ${order.delivery_address.landmark}`}
                </p>
                <p className="text-slate-600">
                  {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}
                </p>
                <p className="text-slate-500 mt-0.5">Phone: {order.delivery_address.phone}</p>
              </div>

              <div className="text-right">
                <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">
                  Payment Mode:
                </span>
                <p className="font-bold text-slate-900">{order.payment_method}</p>
                <p className="text-slate-500">Payment Status: {order.payment_status}</p>
              </div>
            </div>
          )}

          {/* Itemized Table */}
          <div className="space-y-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items?.map((item) => (
                  <tr key={item.id} className="py-2">
                    <td className="py-2.5">
                      <p className="font-bold text-slate-900">{item.product_name}</p>
                      <span className="text-[10px] text-slate-400">{item.unit_info}</span>
                    </td>
                    <td className="py-2.5 text-center font-semibold">{item.quantity}</td>
                    <td className="py-2.5 text-right text-slate-600">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bill Totals Breakdown */}
          <div className="border-t border-slate-200 pt-4 text-xs space-y-1.5 ml-auto max-w-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount Savings:</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee:</span>
              <span>{order.delivery_fee === 0 ? "FREE" : formatCurrency(order.delivery_fee)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-base text-slate-900 font-display">
              <span>Grand Total:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-6 border-t border-slate-100 text-[11px] text-slate-400">
            Thank you for shopping with <strong>Apna Kirana</strong>! For any questions, contact store support.
          </div>
        </div>
      </div>
    </div>
  );
}
