import React from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, ShoppingBag, Eye } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { formatCurrency, formatDiscountPercentage } from "../../utils/formatters";

export default function ProductCard({ product }) {
  const { cartItems, addToCart, updateQuantity } = useCart();

  // Find item in cart
  const cartItem = cartItems.find((item) => item.id === product.id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;
  const discountText = formatDiscountPercentage(product.price, product.discount_price);
  const effectivePrice = product.discount_price && product.discount_price < product.price
    ? product.discount_price
    : product.price;

  return (
    <div className="card-product group relative">
      {/* Discount Badge */}
      {discountText && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="badge-offer shadow-2xs font-bold text-[10px]">
            {discountText}
          </span>
        </div>
      )}

      {/* Product Image Area */}
      <Link
        to={`/products/${product.slug || product.id}`}
        className="block relative bg-slate-50/80 p-4 aspect-square overflow-hidden flex items-center justify-center"
      >
        <img
          src={product.image_url || "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80"}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80";
          }}
        />
        {!product.is_in_stock && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center">
            <span className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content Area */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          {/* Brand & Weight */}
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-slate-600 truncate max-w-[120px]">
              {product.brand || "General Store"}
            </span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600">
              {product.weight_or_quantity}
            </span>
          </div>

          {/* Product Name */}
          <Link
            to={`/products/${product.slug || product.id}`}
            className="block text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-brand-600 transition leading-snug"
          >
            {product.name}
          </Link>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Prices */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-black text-slate-900 font-display">
                {formatCurrency(effectivePrice)}
              </span>
              {product.discount_price && product.discount_price < product.price && (
                <span className="text-[11px] text-slate-400 line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Add / Quantity Button */}
          {product.is_in_stock ? (
            cartQuantity > 0 ? (
              <div className="flex items-center bg-brand-600 text-white rounded-xl shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, cartQuantity - 1)}
                  className="px-2 py-1.5 hover:bg-brand-700 transition"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 text-xs font-bold text-center min-w-[20px]">
                  {cartQuantity}
                </span>
                <button
                  type="button"
                  disabled={cartQuantity >= product.stock_quantity}
                  onClick={() => updateQuantity(product.id, cartQuantity + 1)}
                  className="px-2 py-1.5 hover:bg-brand-700 transition disabled:opacity-50"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => addToCart(product, 1)}
                className="inline-flex items-center gap-1 rounded-xl bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white border border-brand-200 hover:border-brand-600 px-3 py-1.5 text-xs font-bold transition-all shadow-2xs active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>ADD</span>
              </button>
            )
          ) : (
            <button
              disabled
              className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-xl cursor-not-allowed"
            >
              Sold Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
