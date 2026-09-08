import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Package,
  Layers,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import adminService from "../../services/adminService";
import { formatCurrency, formatDate } from "../../utils/formatters";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getMetrics();
      if (res.success) {
        setMetrics(res.data);
      } else {
        setError(res.message || "Failed to load dashboard metrics");
      }
    } catch (err) {
      console.error("Dashboard metrics error:", err);
      setError("Unable to connect to admin dashboard service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <span className="badge-warning">Pending</span>;
      case "CONFIRMED":
        return <span className="badge-info">Confirmed</span>;
      case "PREPARING":
        return <span className="badge-info">Preparing</span>;
      case "OUT_FOR_DELIVERY":
        return <span className="badge-accent">Out for Delivery</span>;
      case "DELIVERED":
        return <span className="badge-success">Delivered</span>;
      case "CANCELLED":
        return <span className="badge-error">Cancelled</span>;
      default:
        return <span className="badge-neutral">{status}</span>;
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="h-8 w-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Computing store metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3 max-w-lg mx-auto">
        <AlertTriangle className="h-8 w-8 text-red-600 mx-auto" />
        <h3 className="text-sm font-bold text-red-900">Dashboard Error</h3>
        <p className="text-xs text-red-600">{error}</p>
        <button onClick={fetchMetrics} className="btn-secondary text-xs font-semibold inline-flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-display tracking-tight">Store Overview</h1>
          <p className="text-xs text-slate-500">Live inventory, order flow & customer insights</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="btn-secondary text-xs font-semibold py-2 px-3 inline-flex items-center gap-1.5"
            title="Refresh metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            to="/admin/products"
            className="btn-primary text-xs font-semibold py-2 px-3 inline-flex items-center gap-1.5"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Manage Catalog
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Sales</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-display">
            {formatCurrency(metrics?.total_sales || 0)}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">Excluding cancelled orders</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-display">
            {metrics?.total_orders || 0}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="text-amber-600 font-semibold">{metrics?.pending_orders || 0} active</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">{metrics?.delivered_orders || 0} delivered</span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Customers</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-display">
            {metrics?.total_customers || 0}
          </p>
          <p className="text-[11px] text-purple-600 font-medium">Registered customer accounts</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Low Stock</span>
            <div className={`p-2 rounded-xl ${(metrics?.low_stock_products_count || 0) > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-display">
            {metrics?.low_stock_products_count || 0}
          </p>
          <p className="text-[11px] text-amber-600 font-medium">Items with ≤ 5 units in stock</p>
        </div>
      </div>

      {/* Secondary Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-center">
          <p className="text-[11px] font-semibold text-amber-800">Pending / In-Prep</p>
          <p className="text-lg font-bold text-amber-900 font-display">{metrics?.pending_orders || 0}</p>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-3 text-center">
          <p className="text-[11px] font-semibold text-emerald-800">Delivered</p>
          <p className="text-lg font-bold text-emerald-900 font-display">{metrics?.delivered_orders || 0}</p>
        </div>
        <div className="bg-red-50/70 border border-red-200/60 rounded-xl p-3 text-center">
          <p className="text-[11px] font-semibold text-red-800">Cancelled</p>
          <p className="text-lg font-bold text-red-900 font-display">{metrics?.cancelled_orders || 0}</p>
        </div>
        <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-3 text-center">
          <p className="text-[11px] font-semibold text-blue-800">Active Products</p>
          <p className="text-lg font-bold text-blue-900 font-display">{metrics?.total_products || 0}</p>
        </div>
      </div>

      {/* Two-Column Grid: Recent Orders & Low Stock Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-display">Recent Orders</h2>
              <p className="text-[11px] text-slate-500">Latest customer checkouts</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {metrics?.recent_orders && metrics.recent_orders.length > 0 ? (
              metrics.recent_orders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-slate-50/60 transition flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">#{order.order_number}</span>
                      {getStatusBadge(order.order_status)}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {order.delivery_address?.full_name || "Customer"} • {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900 font-display">
                      {formatCurrency(order.total_amount)}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">
                      {order.items?.length || 0} item{(order.items?.length || 0) > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No orders placed yet.
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-display">Low Stock Watchlist</h2>
                <p className="text-[11px] text-slate-500">Items requiring immediate restock</p>
              </div>
            </div>
            <Link
              to="/admin/products"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {metrics?.low_stock_items && metrics.low_stock_items.length > 0 ? (
              metrics.low_stock_items.map((prod) => (
                <div key={prod.id} className="p-3.5 hover:bg-slate-50/60 transition flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&q=80"}
                      alt={prod.name}
                      className="h-10 w-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{prod.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {prod.category?.name || "Grocery"} • {formatCurrency(prod.discount_price || prod.price)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        prod.stock_quantity === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {prod.stock_quantity === 0 ? "Out of Stock" : `${prod.stock_quantity} left`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                All catalog items have healthy stock levels (&gt; 5 units).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
