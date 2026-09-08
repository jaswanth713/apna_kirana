import React, { useState, useEffect } from "react";
import { X, MapPin, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import addressService from "../../services/addressService";
import deliveryService from "../../services/deliveryService";
import { getErrorMessage } from "../../utils/formatters";

export default function AddressModal({
  isOpen,
  onClose,
  onAddressSaved,
  addressToEdit = null,
}) {
  const [formData, setFormData] = useState({
    recipient_name: "",
    phone: "",
    address_line: "",
    landmark: "",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "",
    is_default: false,
  });

  const [pinStatus, setPinStatus] = useState(null); // { checking, valid, message, area }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (addressToEdit) {
      setFormData({
        recipient_name: addressToEdit.recipient_name || "",
        phone: addressToEdit.phone || "",
        address_line: addressToEdit.address_line || "",
        landmark: addressToEdit.landmark || "",
        city: addressToEdit.city || "Bengaluru",
        state: addressToEdit.state || "Karnataka",
        pincode: addressToEdit.pincode || "",
        is_default: addressToEdit.is_default || false,
      });
      if (addressToEdit.pincode) {
        verifyPincode(addressToEdit.pincode);
      }
    } else {
      setFormData({
        recipient_name: "",
        phone: "",
        address_line: "",
        landmark: "",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        is_default: false,
      });
      verifyPincode("560001");
    }
    setError(null);
  }, [addressToEdit, isOpen]);

  const verifyPincode = async (pin) => {
    if (!pin || pin.trim().length < 6) {
      setPinStatus(null);
      return;
    }

    setPinStatus({ checking: true });
    try {
      const res = await deliveryService.checkPincode(pin.trim());
      if (res.success && res.data.is_serviceable) {
        setPinStatus({
          checking: false,
          valid: true,
          area: res.data.area_name,
          message: `Serviceable in ${res.data.area_name}`,
        });
      } else {
        setPinStatus({
          checking: false,
          valid: false,
          message: "PIN code is not in our serviceable region",
        });
      }
    } catch {
      setPinStatus({
        checking: false,
        valid: false,
        message: "PIN code is not serviceable for express delivery",
      });
    }
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: val }));
    if (val.length === 6) {
      verifyPincode(val);
    } else {
      setPinStatus(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (pinStatus && !pinStatus.valid) {
      setError("Please enter a valid serviceable PIN code");
      return;
    }

    setLoading(true);
    try {
      if (addressToEdit) {
        const res = await addressService.updateAddress(addressToEdit.id, formData);
        if (res.success) {
          onAddressSaved(res.data);
          onClose();
        }
      } else {
        const res = await addressService.createAddress(formData);
        if (res.success) {
          onAddressSaved(res.data);
          onClose();
        }
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save address. Please check all fields."));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">
                {addressToEdit ? "Edit Delivery Address" : "Add New Delivery Address"}
              </h3>
              <p className="text-xs text-slate-500">
                Where should we deliver your fresh groceries?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">House / Flat No., Street, Area *</label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Flat 302, Green Valley Apts, 5th Cross Road"
              value={formData.address_line}
              onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Landmark (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Near Metro Station / Temple"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">PIN Code *</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="6-digit PIN (e.g. 560001)"
                value={formData.pincode}
                onChange={handlePincodeChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500"
              />
              {pinStatus && (
                <div className="pt-1 text-[11px] font-semibold">
                  {pinStatus.checking ? (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Verifying PIN...
                    </span>
                  ) : pinStatus.valid ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {pinStatus.message}
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {pinStatus.message}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">City</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">State</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <span>Set as default delivery address</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2 px-4 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (pinStatus && !pinStatus.valid)}
              className="btn-primary py-2 px-5 text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{addressToEdit ? "Update Address" : "Save Address"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
