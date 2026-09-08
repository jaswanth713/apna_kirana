import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Sparkles,
  Truck,
  ShieldCheck,
  Banknote,
  ArrowRight,
  Clock,
  CheckCircle2,
  Percent,
} from "lucide-react";
import { useLocation } from "../context/LocationContext";
import productService from "../services/productService";
import ProductGrid from "../components/product/ProductGrid";
import { ProductSkeletonGrid } from "../components/common/LoadingSpinner";

export default function HomePage() {
  const { pincode, deliveryInfo } = useLocation();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true);
      try {
        const [catsRes, featRes, discRes] = await Promise.all([
          productService.getCategories(),
          productService.getProducts({ featured: true, limit: 8 }),
          productService.getProducts({ sort: "price_asc", limit: 4 }),
        ]);

        if (catsRes.success) setCategories(catsRes.data);
        if (featRes.success) setFeaturedProducts(featRes.data.items);
        if (discRes.success) setDiscountedProducts(discRes.data.items);
      } catch (err) {
        console.error("Failed loading home data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-900 text-white p-6 sm:p-10 lg:p-12 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-brand-100 border border-white/10">
            <Sparkles className="h-3.5 w-3.5 text-accent-300" />
            <span>Fast Regional General Store</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-tight">
            Everyday Essentials & Snacks at Your Doorstep in <span className="text-accent-300 underline decoration-accent-400">30 Mins</span>.
          </h1>

          <p className="text-sm sm:text-base text-brand-100 leading-relaxed max-w-xl">
            Order biscuits, chips, cold drinks, instant noodles, and everyday groceries directly from our local store. Delivered fast with <strong>Cash on Delivery</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/products"
              className="btn-accent px-6 py-3 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition"
            >
              Shop All Products <ArrowRight className="h-4 w-4 ml-2" />
            </Link>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs rounded-xl px-3.5 py-2.5 text-xs text-brand-100 border border-white/10">
              <Truck className="h-4 w-4 text-accent-300 shrink-0" />
              <span>
                Delivering to <strong>{pincode}</strong> ({deliveryInfo?.area_name || "Regional Area"})
              </span>
            </div>
          </div>
        </div>

        {/* Decorative background glows */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-brand-500/20 blur-2xl pointer-events-none" />
        <div className="absolute right-1/4 -top-12 w-60 h-60 rounded-full bg-accent-500/15 blur-xl pointer-events-none" />
      </section>

      {/* Value Badges */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">30–45 Mins Delivery</h4>
            <p className="text-[11px] text-slate-500">Fast neighborhood delivery</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center shrink-0">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Cash on Delivery</h4>
            <p className="text-[11px] text-slate-500">Pay when order arrives</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Best Store Prices</h4>
            <p className="text-[11px] text-slate-500">Daily savings & discounts</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">100% Genuine Stock</h4>
            <p className="text-[11px] text-slate-500">Fresh FMCG inventory</p>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              Featured Products
            </h2>
            <p className="text-xs text-slate-500">Popular everyday picks in your region</p>
          </div>
          <Link
            to="/products?featured=true"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            View All <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        <ProductGrid products={featuredProducts} loading={loading} />
      </section>

      {/* Explore Categories */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              Shop by Category
            </h2>
            <p className="text-xs text-slate-500">Explore grocery, snacks, beverages and household essentials</p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            All Categories <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-brand-300 hover:shadow-soft transition-all duration-200 flex flex-col items-center text-center justify-between"
            >
              <div className="h-20 w-20 rounded-xl overflow-hidden mb-2 bg-slate-50 flex items-center justify-center p-1">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="h-full w-full object-cover rounded-lg group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <ShoppingBag className="h-8 w-8 text-brand-500" />
                )}
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-brand-700 transition font-display line-clamp-1">
                {cat.name}
              </h3>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Value Essentials */}
      {discountedProducts.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display flex items-center gap-2">
                <span>Daily Value Deals</span>
                <span className="badge-offer text-xs font-bold">Special Discounts</span>
              </h2>
              <p className="text-xs text-slate-500">Everyday essentials at lowest prices</p>
            </div>
            <Link
              to="/products?sort=price_asc"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
            >
              See Deals <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <ProductGrid products={discountedProducts} loading={loading} />
        </section>
      )}

      {/* CTA Box */}
      <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-bold font-display">
            Fast Delivery in Your Neighborhood
          </h3>
          <p className="text-xs text-slate-400">
            Order online, receive fresh groceries in minutes, and pay via Cash on Delivery.
          </p>
        </div>
        <Link to="/products" className="btn-primary px-6 py-2.5 text-xs font-bold shrink-0">
          Browse Store Catalog
        </Link>
      </section>
    </div>
  );
}
