import React, { useState } from "react";
import { MapPin, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useLocation } from "../../context/LocationContext";

export default function LocationModal({ isOpen, onClose }) {
  const { pincode, deliveryInfo, checking, checkPincode } = useLocation();
  const [inputPin, setInputPin] = useState(pincode || "");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputPin || inputPin.trim().length !== 6) {
      setErrorMsg("Please enter a valid 6-digit Indian PIN code");
      return;
    }
    setErrorMsg("");
    const res = await checkPincode(inputPin.trim());
    if (res && res.is_serviceable) {
      setTimeout(() => {
        onClose();
      }, 600);
    }
  };

  const samplePincodes = [
    { pin: "560034", area: "Koramangala 4th Block" },
    { pin: "560001", area: "MG Road Central" },
    { pin: "560078", area: "JP Nagar Phase 2" },
    { pin: "110001", area: "Connaught Place" },
    { pin: "400001", area: "Fort Market" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Select Delivery Location</h3>
            <p className="text-xs text-slate-500">Check store delivery serviceability in your area</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Enter 6-Digit PIN Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 560034"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 font-medium focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-center text-lg tracking-widest"
              />
              <button
                type="submit"
                disabled={checking || inputPin.length !== 6}
                className="btn-primary px-6"
              >
                {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Check"}
              </button>
            </div>
            {errorMsg && <p className="text-xs text-red-600 mt-1.5">{errorMsg}</p>}
          </div>

          {/* Delivery Info Status */}
          {deliveryInfo && (
            <div
              className={`rounded-xl p-3.5 text-xs flex items-start gap-2.5 border ${
                deliveryInfo.is_serviceable
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {deliveryInfo.is_serviceable ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {deliveryInfo.is_serviceable ? "Service Available" : "Location Not Serviceable"}
                </p>
                <p className="mt-0.5">{deliveryInfo.message}</p>
                {deliveryInfo.is_serviceable && (
                  <p className="mt-1 font-medium text-emerald-700">
                    Delivery Fee: ₹{deliveryInfo.delivery_fee} (Free above ₹{deliveryInfo.free_delivery_threshold})
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Select Popular Areas */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Popular Serviceable Areas:</p>
            <div className="flex flex-wrap gap-1.5">
              {samplePincodes.map((s) => (
                <button
                  key={s.pin}
                  type="button"
                  onClick={() => {
                    setInputPin(s.pin);
                    checkPincode(s.pin);
                  }}
                  className="rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-transparent px-2.5 py-1 text-xs text-slate-700 transition"
                >
                  {s.area} ({s.pin})
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
