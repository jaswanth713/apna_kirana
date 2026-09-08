import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PackageCheck,
  Calendar,
  Banknote,
  FileText,
  XCircle,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import orderService from "../services/orderService";
import { formatCurrency, getErrorMessage } from "../utils/formatters";
import OrderTimeline from "../components/orders/OrderTimeline";
import OrderItems from "../components/orders/OrderItems";
import OrderSummary from "../components/orders/OrderSummary";
import InvoicePreview from "../components/orders/InvoicePreview";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // Invoice Modal State
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Fetch Order
  const loadOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getOrder(id);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setError("Order not found");
      }
    } catch (err) {
      console.error("Failed loading order detail:", err);
      setError("Unable to load order details. You may not have access to this order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadOrder();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [id]);

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    setCancelError(null);
    setCancelling(true);

    try {
      const res = await orderService.cancelOrder(order.order_number || order.id, cancelReason);
      if (res.success) {
        setOrder(res.data);
        setIsCancelModalOpen(false);
        setCancelReason("");
      }
    } catch (err) {
      setCancelError(getErrorMessage(err, "Failed to cancel order."));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner text="Loading order tracking details..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-12">
        <EmptyState
          icon={AlertCircle}
          title="Order Not Found"
          message={error || "The order you are looking for does not exist or has been removed."}
          actionLabel="Back to My Orders"
          onAction={() => navigate("/orders")}
        />
      </div>
    );
  }

  const isCancellable = ["PENDING", "CONFIRMED"].includes(order.order_status?.toUpperCase());

  return (
    <>
      {/* Invoice Modal */}
      <InvoicePreview
        order={order}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Cancel Order {order.order_number}?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to cancel this delivery?
                </p>
              </div>
            </div>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <form onSubmit={handleCancelOrder} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ordered by mistake / Changed delivery address"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="btn-secondary py-2 px-3 text-xs font-semibold"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {cancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to All Orders
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                Order <span className="font-mono">{order.order_number}</span>
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Placed on{" "}
              {new Date(order.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Top Actions: Invoice & Cancel */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsInvoiceOpen(true)}
              className="btn-secondary py-2 px-3.5 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" /> View Receipt
            </button>

            {isCancellable && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 py-2 px-3.5 rounded-xl transition inline-flex items-center gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* 1. Order Tracking Timeline */}
        <OrderTimeline
          status={order.order_status}
          cancellationReason={order.cancellation_reason}
          createdAt={order.created_at}
        />

        {/* 2. Main Order Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Ordered Items (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <OrderItems items={order.items} />
          </div>

          {/* Bill Breakdown & Address (Right 1 col) */}
          <div>
            <OrderSummary
              order={order}
              onOpenInvoice={() => setIsInvoiceOpen(true)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
