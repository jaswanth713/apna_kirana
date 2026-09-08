import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Truck,
  ShieldCheck,
  ShoppingBag,
  Clock,
  PackageCheck,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLocation } from "../context/LocationContext";
import addressService from "../services/addressService";
import orderService from "../services/orderService";
import { formatCurrency, formatDiscountPercentage, getErrorMessage } from "../utils/formatters";
import AddressModal from "../components/checkout/AddressModal";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    totalItemsCount,
    subtotal,
    mrpTotal,
    discountSavings,
    deliveryFee,
    finalTotal,
    clearCart,
  } = useCart();
  const { pincode: locationPincode } = useLocation();

  // State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [customerNotes, setCustomerNotes] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [error, setError] = useState(null);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState(null);

  // Confirmed Order State
  const [placedOrder, setPlacedOrder] = useState(null);

  // 1. Fetch addresses
  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await addressService.getAddresses();
      if (res.success) {
        setAddresses(res.data);
        if (res.data.length > 0) {
          // Select default address or first address
          const defaultAddr = res.data.find((a) => a.is_default);
          setSelectedAddressId(defaultAddr ? defaultAddr.id : res.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed loading addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleAddressSaved = (savedAddress) => {
    loadAddresses();
    setSelectedAddressId(savedAddress.id);
  };

  const handleDeleteAddress = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await addressService.deleteAddress(id);
        loadAddresses();
      } catch (err) {
        console.error("Failed to delete address:", err);
      }
    }
  };

  // 2. Handle Place Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedAddressId) {
      setError("Please select or add a delivery address");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty. Please add items before placing an order.");
      return;
    }

    setSubmittingOrder(true);
    try {
      const payload = {
        delivery_address_id: selectedAddressId,
        payment_method: "COD",
        customer_notes: customerNotes.trim() || undefined,
      };

      const res = await orderService.createOrder(payload);
      if (res.success && res.data) {
        setPlacedOrder(res.data);
        clearCart();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("Failed to place order:", err);
      setError(getErrorMessage(err, "Failed to place order. Please try again."));
    } finally {
      setSubmittingOrder(false);
    }
  };

  // =========================================================================
  // SUCCESS / CONFIRMATION VIEW
  // =========================================================================
  if (placedOrder) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Success Banner */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-200 shadow-soft text-center space-y-5">
          <div className="h-20 w-20 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Order Placed Successfully!</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              Thank You, {user?.full_name || "Customer"}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Your regional store order has been received and confirmed.
            </p>
          </div>

          {/* Order Details Highlight Box */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Order Number
              </span>
              <span className="text-xs font-black text-slate-900 font-mono">
                {placedOrder.order_number}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Payment Method
              </span>
              <span className="text-xs font-black text-brand-700">
                Cash on Delivery (COD)
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Estimated Delivery
              </span>
              <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-brand-600" /> 30–45 Mins
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total to Pay
              </span>
              <span className="text-base font-black text-slate-900 font-display">
                {formatCurrency(placedOrder.total_amount)}
              </span>
            </div>
          </div>

          {/* Delivery Address Summary */}
          {placedOrder.delivery_address && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-left text-xs space-y-1">
              <span className="font-bold text-slate-700 block flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-600" /> Delivering to:
              </span>
              <p className="font-semibold text-slate-900">
                {placedOrder.delivery_address.recipient_name} ({placedOrder.delivery_address.phone})
              </p>
              <p className="text-slate-500">
                {placedOrder.delivery_address.address_line},{" "}
                {placedOrder.delivery_address.landmark && `${placedOrder.delivery_address.landmark}, `}
                {placedOrder.delivery_address.city}, {placedOrder.delivery_address.state} -{" "}
                <strong>{placedOrder.delivery_address.pincode}</strong>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/orders"
              className="btn-primary w-full sm:w-auto px-6 py-3 text-xs font-bold inline-flex items-center justify-center gap-2"
            >
              <PackageCheck className="h-4 w-4" /> View My Orders
            </Link>
            <Link
              to="/products"
              className="btn-secondary w-full sm:w-auto px-6 py-3 text-xs font-bold inline-flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // EMPTY CART CHECK
  // =========================================================================
  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-soft text-center space-y-4">
          <ShoppingBag className="h-12 w-12 text-slate-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 font-display">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500">
            Please add groceries or snacks before heading to checkout.
          </p>
          <Link to="/products" className="btn-primary w-full py-2.5 text-xs font-bold inline-block">
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CHECKOUT PAGE FORM VIEW
  // =========================================================================
  return (
    <>
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setAddressToEdit(null);
        }}
        onAddressSaved={handleAddressSaved}
        addressToEdit={addressToEdit}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-2 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Cart
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              Checkout & Delivery
            </h1>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Columns: Delivery Address & Payment Method */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Delivery Address Section */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 font-display">
                    1. Select Delivery Address
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAddressToEdit(null);
                    setIsAddressModalOpen(true);
                  }}
                  className="btn-secondary py-1.5 px-3 text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Address
                </button>
              </div>

              {loadingAddresses ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-brand-600" />
                  Loading delivery addresses...
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-6 space-y-3 bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-600 font-medium">
                    You don't have any saved delivery addresses yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Delivery Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;

                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`cursor-pointer rounded-2xl p-4 border transition-all text-xs space-y-2 relative ${
                          isSelected
                            ? "bg-brand-50/50 border-brand-500 ring-2 ring-brand-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="selected_address"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300"
                            />
                            <span className="font-bold text-slate-900">{addr.recipient_name}</span>
                          </div>

                          {addr.is_default && (
                            <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded text-[10px]">
                              Default
                            </span>
                          )}
                        </div>

                        <p className="text-slate-600 leading-relaxed pl-6">
                          {addr.address_line}
                          {addr.landmark && `, ${addr.landmark}`}
                          <br />
                          {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                        </p>

                        <div className="pt-2 pl-6 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-500">
                          <span>Phone: {addr.phone}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddressToEdit(addr);
                                setIsAddressModalOpen(true);
                              }}
                              className="text-slate-400 hover:text-brand-600 p-1"
                              title="Edit address"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteAddress(addr.id, e)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete address"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Delivery Notes */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Delivery Instructions (Optional)
              </h3>
              <input
                type="text"
                placeholder="e.g. Please leave at front door, ring doorbell, etc."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* 3. Payment Method Section */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="h-8 w-8 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
                  <Banknote className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 font-display">
                  2. Payment Method
                </h2>
              </div>

              {/* COD Option Selected */}
              <div className="rounded-2xl p-4 bg-accent-50/40 border-2 border-accent-500 text-xs flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-accent-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Cash on Delivery (COD)</h4>
                    <p className="text-slate-600 mt-0.5">
                      Pay with cash or UPI QR scan when our delivery partner reaches your doorstep.
                    </p>
                  </div>
                </div>
                <span className="badge-accent font-bold text-[10px] shrink-0">
                  Recommended
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Confirm Button */}
          <div className="space-y-4 sticky top-24">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-5">
              <h3 className="text-base font-black text-slate-900 font-display border-b border-slate-100 pb-3">
                Order Review
              </h3>

              {/* Mini Item List */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                        {item.quantity}x
                      </span>
                      <span className="text-slate-800 font-medium truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0 font-display">
                      {formatCurrency((item.effective_price || item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Total MRP ({totalItemsCount} items)</span>
                  <span>{formatCurrency(mrpTotal || subtotal)}</span>
                </div>

                {discountSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Store Discounts</span>
                    <span>-{formatCurrency(discountSavings)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <strong className="text-emerald-600">FREE</strong>
                    ) : (
                      formatCurrency(deliveryFee)
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline text-slate-900">
                  <span className="font-bold text-sm">Total Payable</span>
                  <span className="font-black text-xl font-display text-slate-900">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={submittingOrder || addresses.length === 0}
                className="btn-primary w-full py-3.5 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Order (COD)</span>
                  </>
                )}
              </button>
            </div>

            {/* Express SLA Trust Badge */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-600 shrink-0" />
                <span><strong>30–45 Mins Express Delivery</strong> to your doorstep.</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                <span><strong>No Advance Payment:</strong> Pay only when order is delivered.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
