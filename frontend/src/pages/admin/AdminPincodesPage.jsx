import React, { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  RefreshCw,
  Truck,
} from "lucide-react";
import adminService from "../../services/adminService";
import { formatCurrency, getErrorMessage } from "../../utils/formatters";

export default function AdminPincodesPage() {
  const [pincodes, setPincodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [selectedPin, setSelectedPin] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    pincode: "",
    area_name: "",
    delivery_fee: 30,
    min_order_amount: 100,
    free_delivery_threshold: 499,
    is_active: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchPincodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getPincodes();
      if (res.success) {
        setPincodes(res.data || []);
      }
    } catch (err) {
      console.error("Admin pincodes fetch error:", err);
      setError("Failed to fetch serviceable PIN codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPincodes();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedPin(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (pin) => {
    setModalMode("edit");
    setSelectedPin(pin);
    setFormData({
      pincode: pin.pincode,
      area_name: pin.area_name || "",
      delivery_fee: pin.delivery_fee ?? 30,
      min_order_amount: pin.min_order_amount ?? 100,
      free_delivery_threshold: pin.free_delivery_threshold ?? 499,
      is_active: !!pin.is_active,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        pincode: formData.pincode.trim(),
        area_name: formData.area_name.trim(),
        delivery_fee: parseFloat(formData.delivery_fee),
        min_order_amount: parseFloat(formData.min_order_amount),
        free_delivery_threshold: parseFloat(formData.free_delivery_threshold),
        is_active: formData.is_active,
      };

      const res = await adminService.savePincode(payload);
      if (res.success) {
        showNotification(`PIN code ${payload.pincode} saved successfully!`);
        setIsModalOpen(false);
        fetchPincodes();
      }
    } catch (err) {
      console.error("Save pincode error:", err);
      setError(getErrorMessage(err, "Failed to save PIN code."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (pin) => {
    try {
      if (pin.is_active) {
        const confirm = window.confirm(`Deactivate deliveries to PIN code ${pin.pincode}?`);
        if (!confirm) return;
        const res = await adminService.deletePincode(pin.pincode);
        if (res.success) {
          showNotification(`PIN code ${pin.pincode} deactivated.`);
          fetchPincodes();
        }
      } else {
        const res = await adminService.savePincode({
          pincode: pin.pincode,
          area_name: pin.area_name,
          delivery_fee: pin.delivery_fee,
          min_order_amount: pin.min_order_amount,
          free_delivery_threshold: pin.free_delivery_threshold,
          is_active: true,
        });
        if (res.success) {
          showNotification(`PIN code ${pin.pincode} activated!`);
          fetchPincodes();
        }
      }
    } catch (err) {
      console.error("Toggle pincode error:", err);
      setError("Failed to update PIN code status.");
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
          <h1 className="text-2xl font-black text-slate-900 font-display">Serviceable PIN Codes</h1>
          <p className="text-xs text-slate-500">Configure delivery radius, delivery fees & free delivery thresholds</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary text-xs font-semibold py-2.5 px-4 inline-flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Serviceable PIN
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Pincodes Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">PIN Code</th>
                <th className="py-3 px-4">Area / Locality</th>
                <th className="py-3 px-4">Delivery Fee</th>
                <th className="py-3 px-4">Free Delivery Above</th>
                <th className="py-3 px-4">Min Order</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-brand-600 mb-2" />
                    Loading PIN zones...
                  </td>
                </tr>
              ) : pincodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No serviceable PIN codes configured.
                  </td>
                </tr>
              ) : (
                pincodes.map((pin) => (
                  <tr key={pin.id || pin.pincode} className="hover:bg-slate-50/60 transition">
                    {/* PIN */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 font-mono text-sm">{pin.pincode}</span>
                    </td>

                    {/* Area */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {pin.area_name || "—"}
                    </td>

                    {/* Delivery Fee */}
                    <td className="py-3 px-4">
                      {pin.delivery_fee === 0 ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        <span className="font-bold text-slate-900 font-display">
                          {formatCurrency(pin.delivery_fee)}
                        </span>
                      )}
                    </td>

                    {/* Free Delivery Threshold */}
                    <td className="py-3 px-4 font-medium text-slate-600">
                      Orders &gt; {formatCurrency(pin.free_delivery_threshold)}
                    </td>

                    {/* Min Order */}
                    <td className="py-3 px-4 text-slate-500">
                      {formatCurrency(pin.min_order_amount)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {pin.is_active ? (
                        <span className="badge-success text-[10px]">Serviceable</span>
                      ) : (
                        <span className="badge-neutral text-[10px]">Disabled</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(pin)}
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                        title="Edit PIN Code Rules"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(pin)}
                        className={`p-1.5 rounded-lg transition ${
                          pin.is_active
                            ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                            : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={pin.is_active ? "Disable Zone" : "Enable Zone"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit PIN Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 font-display">
                {modalMode === "add" ? "Add Serviceable PIN" : `Edit PIN ${selectedPin?.pincode}`}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              {/* PIN Code */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Postal PIN Code (6-digit) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 500001"
                  disabled={modalMode === "edit"}
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none disabled:opacity-60"
                />
              </div>

              {/* Area Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Area / Locality Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jubilee Hills, Banjara Hills, Gachibowli"
                  value={formData.area_name}
                  onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Delivery Fee */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Delivery Fee (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.delivery_fee}
                    onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Free Delivery Threshold */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Free Delivery Threshold (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.free_delivery_threshold}
                    onChange={(e) => setFormData({ ...formData, free_delivery_threshold: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Min Order */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-0"
                  />
                  Active & Serviceable for Checkout
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs font-semibold py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs font-semibold py-2 px-6"
                >
                  {submitting ? "Saving..." : modalMode === "add" ? "Add PIN Zone" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
