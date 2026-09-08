import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  Eye,
  AlertTriangle,
  RefreshCw,
  X,
  MapPin,
  Phone,
  User,
  ArrowRight,
} from "lucide-react";
import adminService from "../../services/adminService";
import { formatCurrency, formatDate, getErrorMessage } from "../../utils/formatters";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Details & Status Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const statusTabs = [
    { label: "All Orders", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Preparing", value: "PREPARING" },
    { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getOrders({
        status: statusFilter,
        search: searchTerm || undefined,
        page,
        limit: 50,
      });

      if (res.success) {
        setOrders(res.data?.items || []);
        setTotalOrders(res.data?.total || 0);
      }
    } catch (err) {
      console.error("Admin orders fetch error:", err);
      setError("Failed to fetch orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleStatusUpdate = async (orderIdOrNumber, newStatus, reason = null) => {
    try {
      setUpdatingStatus(true);
      const res = await adminService.updateOrderStatus(orderIdOrNumber, newStatus, reason);
      if (res.success) {
        showNotification(`Order status updated to ${newStatus}`);
        if (selectedOrder) {
          setSelectedOrder(res.data);
        }
        setIsCancelModalOpen(false);
        setCancelReason("");
        fetchOrders();
      }
    } catch (err) {
      console.error("Order status update error:", err);
      setError(getErrorMessage(err, "Failed to update order status."));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <span className="badge-warning text-[10px]">Pending</span>;
      case "CONFIRMED":
        return <span className="badge-info text-[10px]">Confirmed</span>;
      case "PREPARING":
        return <span className="badge-info text-[10px]">Preparing</span>;
      case "OUT_FOR_DELIVERY":
        return <span className="badge-accent text-[10px]">Out for Delivery</span>;
      case "DELIVERED":
        return <span className="badge-success text-[10px]">Delivered</span>;
      case "CANCELLED":
        return <span className="badge-error text-[10px]">Cancelled</span>;
      default:
        return <span className="badge-neutral text-[10px]">{status}</span>;
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case "PENDING":
        return "CONFIRMED";
      case "CONFIRMED":
        return "PREPARING";
      case "PREPARING":
        return "OUT_FOR_DELIVERY";
      case "OUT_FOR_DELIVERY":
        return "DELIVERED";
      default:
        return null;
    }
  };

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-900 text-emerald-100 px-4 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-2 animate-bounce-short text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-display">Order Management</h1>
          <p className="text-xs text-slate-500">Live order fulfillment, progression stepper & dispatch control</p>
        </div>
        <button
          onClick={fetchOrders}
          className="btn-secondary text-xs font-semibold py-2 px-3 inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Orders
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order number (e.g. ORD-2026), customer name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="btn-secondary text-xs font-semibold py-2 px-4 shrink-0">
            Search
          </button>
        </form>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-slate-100 scrollbar-none">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab.value
                  ? "bg-brand-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-brand-600 mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No orders found for the selected status.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const nextStatus = getNextStatus(order.order_status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition">
                      {/* Order & Date */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 font-mono">#{order.order_number}</span>
                        <p className="text-[11px] text-slate-400">{formatDate(order.created_at)}</p>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{order.delivery_address?.full_name || "Customer"}</p>
                        <p className="text-[11px] text-slate-500">
                          {order.delivery_address?.phone || "—"} • PIN: {order.delivery_address?.pincode}
                        </p>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">
                          {order.items?.length || 0} item{(order.items?.length || 0) > 1 ? "s" : ""}
                        </span>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {order.items?.map((i) => `${i.product_name} (${i.quantity})`).join(", ")}
                        </p>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-display">
                          {formatCurrency(order.total_amount)}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {order.payment_method} • {order.payment_status}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(order.order_status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-2">
                        {/* Next stage button */}
                        {nextStatus && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, nextStatus)}
                            disabled={updatingStatus}
                            className="bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200/80 px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition"
                            title={`Advance order to ${nextStatus}`}
                          >
                            Mark {nextStatus.replace(/_/g, " ")}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailModalOpen(true);
                          }}
                          className="btn-secondary text-[11px] font-semibold py-1 px-2.5 inline-flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 font-display">
                    Order #{selectedOrder.order_number}
                  </h2>
                  {getStatusBadge(selectedOrder.order_status)}
                </div>
                <p className="text-xs text-slate-400">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper Progression Actions */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Update Order Status
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].map((st) => (
                  <button
                    key={st}
                    disabled={updatingStatus || selectedOrder.order_status === st}
                    onClick={() => handleStatusUpdate(selectedOrder.id, st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedOrder.order_status === st
                        ? "bg-brand-600 text-white cursor-default shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {st.replace(/_/g, " ")}
                  </button>
                ))}

                {selectedOrder.order_status !== "CANCELLED" && (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="ml-auto bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-red-100 transition"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Delivery Address Details */}
            {selectedOrder.delivery_address && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  Delivery Destination
                </div>
                <p className="font-semibold text-slate-800">
                  {selectedOrder.delivery_address.full_name} ({selectedOrder.delivery_address.phone})
                </p>
                <p className="text-slate-600">
                  {selectedOrder.delivery_address.street_address}, {selectedOrder.delivery_address.area_name}
                </p>
                <p className="text-slate-600">
                  {selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.state} -{" "}
                  <span className="font-bold text-slate-900">{selectedOrder.delivery_address.pincode}</span>
                </p>
                {selectedOrder.delivery_notes && (
                  <p className="text-slate-500 italic pt-1">
                    Note: "{selectedOrder.delivery_notes}"
                  </p>
                )}
              </div>
            )}

            {/* Order Items */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Purchased Items
              </span>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-[11px] text-slate-400">
                        {formatCurrency(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 font-display">
                      {formatCurrency(item.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Product Savings</span>
                  <span>- {formatCurrency(selectedOrder.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span>{selectedOrder.delivery_fee === 0 ? "FREE" : formatCurrency(selectedOrder.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2 font-display">
                <span>Total Amount (COD)</span>
                <span>{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="btn-secondary text-xs font-semibold py-2 px-5"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {isCancelModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-sm font-bold font-display text-slate-900">Cancel Order #{selectedOrder.order_number}?</h3>
            </div>
            <p className="text-xs text-slate-500">
              This will restore stock quantities for all items in this order.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reason for cancellation
              </label>
              <input
                type="text"
                placeholder="e.g. Out of stock, Customer requested, Delivery unreachable"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="btn-secondary text-xs font-semibold py-2 px-3"
              >
                Back
              </button>
              <button
                disabled={updatingStatus}
                onClick={() => handleStatusUpdate(selectedOrder.id, "CANCELLED", cancelReason)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition"
              >
                {updatingStatus ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
