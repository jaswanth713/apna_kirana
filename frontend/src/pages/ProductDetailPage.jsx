import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Banknote,
  Clock,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import productService from "../services/productService";
import { useCart } from "../context/CartContext";
import { useLocation } from "../context/LocationContext";
import { formatCurrency, formatDiscountPercentage } from "../utils/formatters";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import ProductCard from "../components/product/ProductCard";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { pincode, deliveryInfo } = useLocation();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQty, setSelectedQty] = useState(1);

  // Fetch product data
  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError(null);
      try {
        const res = await productService.getProduct(id);
        if (res.success && res.data) {
          setProduct(res.data);

          // Fetch related products in the same category
          if (res.data.category_id || (res.data.category && res.data.category.slug)) {
            const catSlug = res.data.category?.slug || res.data.category_id;
            const relatedRes = await productService.getProducts({
              category: catSlug,
              limit: 4,
            });
            if (relatedRes.success) {
              // Exclude current product
              setRelatedProducts(
                relatedRes.data.items.filter((item) => item.id !== res.data.id).slice(0, 4)
              );
            }
          }
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Failed loading product detail:", err);
        setError("Unable to load product details. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProduct();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner text="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={AlertCircle}
          title="Product Not Found"
          message={error || "The product you are looking for is unavailable or has been removed."}
          actionLabel="Back to Catalog"
          onAction={() => navigate("/products")}
        />
      </div>
    );
  }

  // Cart item state for this specific product
  const cartItem = cartItems.find((item) => item.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const discountText = formatDiscountPercentage(product.price, product.discount_price);
  const effectivePrice =
    product.discount_price && product.discount_price < product.price
      ? product.discount_price
      : product.price;

  const handleAddToCart = () => {
    addToCart(product, selectedQty);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 overflow-x-auto pb-1">
        <Link to="/" className="hover:text-brand-600 transition">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <Link to="/products" className="hover:text-brand-600 transition">
          Products
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Link
              to={`/products?category=${product.category.slug}`}
              className="hover:text-brand-600 transition"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-900 font-semibold truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Main Product Showcase Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-soft grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left: Product Image */}
        <div className="relative bg-slate-50 rounded-2xl p-8 border border-slate-100 flex items-center justify-center aspect-square overflow-hidden group">
          {discountText && (
            <div className="absolute top-4 left-4 z-10">
              <span className="badge-offer text-xs font-black shadow-xs">
                {discountText}
              </span>
            </div>
          )}

          <img
            src={
              product.image_url ||
              "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80"
            }
            alt={product.name}
            className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src =
                "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80";
            }}
          />

          {!product.is_in_stock && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center">
              <span className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
                Currently Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="space-y-6">
          {/* Brand & Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">
                {product.brand || "General Store"}
              </span>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {product.weight_or_quantity}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display leading-snug">
              {product.name}
            </h1>
          </div>

          {/* Pricing Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline gap-3">
            <span className="text-3xl font-black text-slate-900 font-display">
              {formatCurrency(effectivePrice)}
            </span>
            {product.discount_price && product.discount_price < product.price && (
              <>
                <span className="text-base text-slate-400 line-through">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  Save {formatCurrency(product.price - product.discount_price)}
                </span>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {product.is_in_stock ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>In Stock ({product.stock_quantity} available)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Out of Stock</span>
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Product Description
              </h4>
              <p>{product.description}</p>
            </div>
          )}

          {/* Quantity Picker & Add to Cart */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            {product.is_in_stock ? (
              inCartQty > 0 ? (
                <div className="flex items-center gap-4 bg-brand-50 border border-brand-200 p-3 rounded-2xl">
                  <div className="text-xs font-bold text-brand-800">
                    Already in your cart:
                  </div>
                  <div className="flex items-center bg-brand-600 text-white rounded-xl shadow-xs overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, inCartQty - 1)}
                      className="px-3 py-2 hover:bg-brand-700 transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 text-xs font-black text-center min-w-[28px]">
                      {inCartQty}
                    </span>
                    <button
                      type="button"
                      disabled={inCartQty >= product.stock_quantity}
                      onClick={() => updateQuantity(product.id, inCartQty + 1)}
                      className="px-3 py-2 hover:bg-brand-700 transition disabled:opacity-50"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Link
                    to="/cart"
                    className="ml-auto text-xs font-bold text-brand-700 hover:text-brand-800 underline"
                  >
                    View Cart →
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                      className="px-3 py-3 hover:bg-slate-200 transition text-slate-700"
                      disabled={selectedQty <= 1}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900 min-w-[24px] text-center">
                      {selectedQty}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedQty(Math.min(product.stock_quantity, selectedQty + 1))
                      }
                      className="px-3 py-3 hover:bg-slate-200 transition text-slate-700"
                      disabled={selectedQty >= product.stock_quantity}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="btn-primary flex-1 py-3 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Add {selectedQty > 1 ? `${selectedQty} Items` : ""} to Cart
                  </button>
                </div>
              )
            ) : (
              <button
                disabled
                className="w-full bg-slate-100 text-slate-400 font-bold py-3 text-xs rounded-xl cursor-not-allowed"
              >
                Item Sold Out
              </button>
            )}
          </div>

          {/* Delivery & Service Assurances */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-[11px] text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl flex flex-col items-center text-center gap-1.5">
              <Clock className="h-4 w-4 text-brand-600" />
              <span className="font-semibold text-slate-900">30–45 Mins</span>
              <span className="text-[10px] text-slate-500">Fast Regional Delivery</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex flex-col items-center text-center gap-1.5">
              <Banknote className="h-4 w-4 text-accent-600" />
              <span className="font-semibold text-slate-900">COD Available</span>
              <span className="text-[10px] text-slate-500">Pay on Delivery</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex flex-col items-center text-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-slate-900">100% Genuine</span>
              <span className="text-[10px] text-slate-500">Fresh Stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-display">
                Related Items in {product.category?.name || "this category"}
              </h2>
              <p className="text-xs text-slate-500">Customers also bought these everyday picks</p>
            </div>
            {product.category && (
              <Link
                to={`/products?category=${product.category.slug}`}
                className="text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                View Category →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {relatedProducts.map((relProduct) => (
              <ProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
