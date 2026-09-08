import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Truck, ShieldCheck, Banknote, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs mt-auto border-t border-slate-800">
      {/* Mini Highlights Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/40 py-3.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Truck className="h-4 w-4 text-brand-400" />
            <span><strong>Express Delivery:</strong> 30–45 Mins in Serviceable PINs</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Banknote className="h-4 w-4 text-accent-400" />
            <span><strong>Payment:</strong> Cash on Delivery (COD)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span><strong>Quality:</strong> 100% Genuine Grocery Essentials</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand Info */}
          <div className="col-span-2 sm:col-span-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span className="text-base font-black text-white font-display tracking-tight">
                Apna<span className="text-brand-500">Kirana</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
              Your neighborhood regional general store. Fresh groceries, snacks & cold drinks delivered fast.
            </p>
            <p className="text-[10px] text-slate-500">
              Open 7 Days • 7:00 AM – 11:00 PM
            </p>
          </div>

          {/* Quick Categories */}
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-200 mb-2.5">Categories</h5>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to="/products?category=biscuits-cookies" className="hover:text-white transition">
                  Biscuits & Cookies
                </Link>
              </li>
              <li>
                <Link to="/products?category=chips-namkeen" className="hover:text-white transition">
                  Chips & Snacks
                </Link>
              </li>
              <li>
                <Link to="/products?category=beverages-cold-drinks" className="hover:text-white transition">
                  Beverages & Drinks
                </Link>
              </li>
              <li>
                <Link to="/products?category=grocery-staples" className="hover:text-white transition">
                  Atta, Rice & Staples
                </Link>
              </li>
            </ul>
          </div>

          {/* Service Areas */}
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-200 mb-2.5">Delivery Zones</h5>
            <ul className="space-y-1 text-[11px] text-slate-400">
              <li>📍 Koramangala (560034)</li>
              <li>📍 MG Road / Central (560001)</li>
              <li>📍 JP Nagar Phase 2 (560078)</li>
              <li>📍 Regional Pincodes</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1 space-y-2">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-200 mb-2.5">Customer Support</h5>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                <span>support@apnakirana.local</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-brand-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">Koramangala 4th Block, Bengaluru</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
          <p>© {new Date().getFullYear()} Apna Kirana SuperStore. All rights reserved.</p>
          <p>Cash on Delivery Available • Express Regional Fulfillment</p>
        </div>
      </div>
    </footer>
  );
}
