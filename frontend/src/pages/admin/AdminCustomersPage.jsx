import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import adminService from "../../services/adminService";
import { formatCurrency, formatDate } from "../../utils/formatters";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getCustomers();
      if (res.success) {
        setCustomers(res.data || []);
      }
    } catch (err) {
      console.error("Admin customers fetch error:", err);
      setError("Failed to fetch registered customers list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-display">Registered Customers</h1>
          <p className="text-xs text-slate-500">Overview of customer accounts, order history & total spending</p>
        </div>
        <button
          onClick={fetchCustomers}
          className="btn-secondary text-xs font-semibold py-2 px-3 inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh List
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Orders Placed</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-brand-600 mb-2" />
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found matching the search term.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/60 transition">
                    {/* Full Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-xs">
                          {customer.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{customer.full_name}</p>
                          <span className="text-[10px] text-slate-400 capitalize">{customer.role}</span>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {customer.phone}
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 text-slate-500">
                      {customer.email || "—"}
                    </td>

                    {/* Orders */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 font-display">
                        {customer.total_orders} order{customer.total_orders !== 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-600 font-display">
                        {formatCurrency(customer.total_spent)}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3 px-4 text-slate-400">
                      {formatDate(customer.created_at)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-right">
                      {customer.is_active ? (
                        <span className="badge-success text-[10px]">Active</span>
                      ) : (
                        <span className="badge-neutral text-[10px]">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
