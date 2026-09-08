import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PackageCheck, ArrowRight, Filter } from "lucide-react";
import orderService from "../services/orderService";
import OrderCard from "../components/orders/OrderCard";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const res = await orderService.getOrders();
        if (res.success) {
          setOrders(res.data);
        }
      } catch (err) {
        console.error("Failed loading orders:", err);
        setError("Failed to load your orders. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner text="Loading your store orders..." />
      </div>
    );
  }

  if (error || orders.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12">
        <EmptyState
          icon={PackageCheck}
          title="No Orders Found"
          message={error || "You haven't placed any orders yet. Explore our fresh FMCG groceries and snacks!"}
          actionLabel="Shop Products"
          onAction={() => (window.location.href = "/products")}
        />
      </div>
    );
  }

  // Filter orders
  const filteredOrders = orders.filter((ord) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "ACTIVE") {
      return ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(ord.order_status?.toUpperCase());
    }
    if (selectedFilter === "DELIVERED") {
      return ord.order_status?.toUpperCase() === "DELIVERED";
    }
    if (selectedFilter === "CANCELLED") {
      return ord.order_status?.toUpperCase() === "CANCELLED";
    }
    return true;
  });

  const filterTabs = [
    { key: "ALL", label: "All Orders", count: orders.length },
    {
      key: "ACTIVE",
      label: "Active / On the Way",
      count: orders.filter((o) => ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(o.order_status?.toUpperCase())).length,
    },
    {
      key: "DELIVERED",
      label: "Delivered",
      count: orders.filter((o) => o.order_status?.toUpperCase() === "DELIVERED").length,
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      count: orders.filter((o) => o.order_status?.toUpperCase() === "CANCELLED").length,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            My Orders
          </h1>
          <p className="text-xs text-slate-500">
            Track, view receipts, or manage your regional store orders
          </p>
        </div>
        <Link to="/products" className="btn-secondary py-2 px-3 text-xs font-semibold self-start sm:self-auto">
          Shop More Items
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              selectedFilter === tab.key
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedFilter === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700">No {selectedFilter.toLowerCase()} orders found.</p>
          <button
            type="button"
            onClick={() => setSelectedFilter("ALL")}
            className="text-brand-600 font-bold hover:underline"
          >
            View all orders
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
