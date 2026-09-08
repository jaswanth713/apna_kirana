import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Truck, ShieldCheck, Banknote, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      {/* Features Bar */}
      <div className="border-b border-slate-800 bg-slate-950/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Superfast Regional Delivery</h4>
                <p className="text-xs text-slate-400 mt-0.5">Delivering to your doorstep in 30-45 minutes</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-400 border border-accent-500/20">
                <Banknote className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Cash on Delivery (COD)</h4>
                <p className="text-xs text-slate-400 mt-0.5">Pay only when you receive your fresh items</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">100% Genuine Products</h4>
                <p className="text-xs text-slate-400 mt-0.5">Directly sourced from verified FMCG distributors</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-xl font-black text-white font-display">
                Apna<span className="text-brand-500">Kirana</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your neighborhood general store online. Order biscuits, chips, chocolates, cold drinks, instant noodles, and everyday groceries with instant local delivery.
            </p>
            <div className="text-xs text-slate-500">
              <p>Store Timings: 7:00 AM – 11:00 PM</p>
              <p>7 Days a Week</p>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Categories</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/products?category=biscuits-cookies" className="hover:text-white transition">
                  Biscuits & Cookies
                </Link>
              </li>
              <li>
                <Link to="/products?category=chips-namkeen" className="hover:text-white transition">
                  Chips & Namkeen Snacks
                </Link>
              </li>
              <li>
                <Link to="/products?category=chocolates-sweets" className="hover:text-white transition">
                  Chocolates & Candies
                </Link>
              </li>
              <li>
                <Link to="/products?category=beverages-cold-drinks" className="hover:text-white transition">
                  Soft Drinks & Juices
                </Link>
              </li>
              <li>
                <Link to="/products?category=instant-food-noodles" className="hover:text-white transition">
                  Maggi & Instant Foods
                </Link>
              </li>
              <li>
                <Link to="/products?category=grocery-staples" className="hover:text-white transition">
                  Atta, Rice & Oils
                </Link>
              </li>
            </ul>
          </div>

          {/* Serviceable PIN Codes */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Service Areas</h5>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>📍 Koramangala (560034, 560095)</li>
              <li>📍 MG Road / Central (560001)</li>
              <li>📍 JP Nagar Phase 2 (560078)</li>
              <li>📍 Connaught Place (110001)</li>
              <li>📍 Fort South Market (400001)</li>
            </ul>
            <p className="text-[11px] text-brand-400 font-medium mt-3">
              Expanding to new localities every month!
            </p>
          </div>

          {/* Contact & Support */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Help & Support</h5>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-400 shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-400 shrink-0" />
                <span>support@apnakirana.local</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
                <span>Shop #14, Main Market Road, Koramangala 4th Block, Bangalore</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Apna Kirana SuperStore. All rights reserved.</p>
          <p className="text-slate-500">Built with React, Vite, Tailwind CSS & FastAPI on Neon PostgreSQL.</p>
        </div>
      </div>
    </footer>
  );
}
