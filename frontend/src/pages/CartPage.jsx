import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  Truck,
  ShieldCheck,
  Banknote,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useLocation } from "../context/LocationContext";
import { formatCurrency, formatDiscountPercentage } from "../utils/formatters";

export default function CartPage() {
  const navigate = useNavigate();
  const {
    cartItems,
    totalItemsCount,
    subtotal,
    mrpTotal,
    discountSavings,
    deliveryFee,
    isFreeDelivery,
    freeDeliveryThreshold,
    amountForFreeDelivery,
    finalTotal,
    hasOutOfStockItems,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { pincode, deliveryInfo } = useLocation();

  // Progress percentage for free delivery
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  if (cartItems.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-soft text-center space-y-5">
          <div className="h-20 w-20 rounded-3xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center shadow-inner">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-slate-900 font-display">
              Your Cart is Empty
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              You don't have any items in your shopping bag. Explore our fresh snacks, drinks, and groceries!
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/products"
              className="btn-primary w-full py-3 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              Start Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              Shopping Cart
            </h1>
            <span className="bg-brand-50 text-brand-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-brand-200">
              {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Express regional delivery to PIN: <strong>{pincode}</strong> ({deliveryInfo?.area_name || "Service Area"})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="btn-secondary py-2 px-3 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Continue Shopping
          </Link>
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition border border-rose-100 flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear Cart
          </button>
        </div>
      </div>

      {/* Free Delivery Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Truck className="h-4 w-4 text-brand-600" />
            {isFreeDelivery ? (
              <span className="text-emerald-700 font-bold">
                🎉 Congratulations! You have unlocked <strong>FREE Express Delivery</strong>!
              </span>
            ) : (
              <span>
                Add <strong className="text-brand-600">{formatCurrency(amountForFreeDelivery)}</strong> more to get <strong>FREE Delivery</strong>!
              </span>
            )}
          </div>
          <span className="font-bold text-slate-600">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isFreeDelivery ? "bg-emerald-500" : "bg-brand-600"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Cart Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-3">
          {cartItems.map((item) => {
            const effPrice = item.effective_price || item.price;
            const discountTxt = formatDiscountPercentage(item.price, item.discount_price);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:border-slate-300"
              >
                {/* Left: Product Thumbnail & Title */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <Link
                    to={`/products/${item.slug || item.id}`}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shrink-0 overflow-hidden group"
                  >
                    <img
                      src={
                        item.image_url ||
                        "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&auto=format&fit=crop&q=80"
                      }
                      alt={item.name}
                      className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-200"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&auto=format&fit=crop&q=80";
                      }}
                    />
                  </Link>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {item.brand || "General Store"}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                        {item.weight_or_quantity}
                      </span>
                    </div>

                    <Link
                      to={`/products/${item.slug || item.id}`}
                      className="font-bold text-xs sm:text-sm text-slate-900 hover:text-brand-600 transition block truncate"
                    >
                      {item.name}
                    </Link>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-sm font-black text-slate-900 font-display">
                        {formatCurrency(effPrice)}
                      </span>
                      {item.discount_price && item.discount_price < item.price && (
                        <>
                          <span className="text-xs text-slate-400 line-through">
                            {formatCurrency(item.price)}
                          </span>
                          {discountTxt && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                              {discountTxt}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Stock warning if applicable */}
                    {item.stock_warning && (
                      <div className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>{item.stock_warning}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Quantity modifiers & Total */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  {/* Quantity Counter */}
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded-lg hover:bg-white hover:text-slate-900 text-slate-600 transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900 min-w-[24px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.stock_quantity && item.quantity >= item.stock_quantity}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-lg hover:bg-white hover:text-slate-900 text-slate-600 transition disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right min-w-[75px]">
                    <div className="text-sm font-black text-slate-900 font-display">
                      {formatCurrency(effPrice * item.quantity)}
                    </div>
                    {item.discount_price && item.discount_price < item.price && (
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        Saved {formatCurrency((item.price - effPrice) * item.quantity)}
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Sidebar: Order Summary */}
        <div className="space-y-4 sticky top-24">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-5">
            <h3 className="text-base font-black text-slate-900 font-display border-b border-slate-100 pb-3">
              Order Summary
            </h3>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total MRP ({totalItemsCount} items)</span>
                <span className="font-semibold">{formatCurrency(mrpTotal || subtotal)}</span>
              </div>

              {discountSavings > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Product Discount</span>
                  <span>-{formatCurrency(discountSavings)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  Delivery Fee ({pincode})
                </span>
                <span>
                  {deliveryFee === 0 ? (
                    <strong className="text-emerald-600">FREE</strong>
                  ) : (
                    formatCurrency(deliveryFee)
                  )}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline text-slate-900">
                <span className="font-bold text-sm">To Pay (COD)</span>
                <span className="font-black text-xl font-display text-slate-900">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            {/* Savings Banner */}
            {discountSavings > 0 && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>You will save <strong>{formatCurrency(discountSavings)}</strong> on this order!</span>
              </div>
            )}

            {/* Out of stock warning */}
            {hasOutOfStockItems && (
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Some items exceed available stock. Please adjust quantities to proceed.</span>
              </div>
            )}

            {/* Checkout Button */}
            <button
              type="button"
              disabled={hasOutOfStockItems}
              onClick={() => navigate("/checkout")}
              className="btn-primary w-full py-3.5 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <Banknote className="h-4 w-4 text-accent-600 shrink-0" />
              <span><strong>Cash on Delivery:</strong> Pay safely at your door when your groceries arrive.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 text-brand-600 shrink-0" />
              <span><strong>Fast Regional Delivery:</strong> Neighborhood dispatch in under 45 mins.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
              <span><strong>100% Genuine Items:</strong> Fresh products from verified suppliers.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
