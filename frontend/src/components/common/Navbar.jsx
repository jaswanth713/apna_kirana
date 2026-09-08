import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  MapPin,
  User,
  LogOut,
  ShieldCheck,
  PackageCheck,
  ChevronDown,
  Clock,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLocation } from "../../context/LocationContext";
import LocationModal from "./LocationModal";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItemsCount, finalTotal } = useCart();
  const { pincode, deliveryInfo } = useLocation();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const categoriesQuickLinks = [
    { name: "All Products", path: "/products" },
    { name: "Biscuits & Cookies", slug: "biscuits-cookies" },
    { name: "Chips & Namkeen", slug: "chips-namkeen" },
    { name: "Chocolates", slug: "chocolates-sweets" },
    { name: "Cold Drinks", slug: "beverages-cold-drinks" },
    { name: "Instant Noodles", slug: "instant-food-noodles" },
    { name: "Atta, Rice & Staples", slug: "grocery-staples" },
    { name: "Dairy & Butter", slug: "dairy-breakfast" },
    { name: "Soaps & Care", slug: "personal-care" },
  ];

  return (
    <>
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
        {/* Top Banner: Regional Express SLA */}
        <div className="bg-brand-700 text-white text-xs py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-brand-200" />
              <span>
                <strong>Express Regional Delivery:</strong> Groceries & snacks delivered at your doorstep in under 45 minutes!
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-brand-100">
              <span>💵 Cash on Delivery Available</span>
              <span>•</span>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="hover:text-white underline cursor-pointer"
              >
                PIN: {pincode} ({deliveryInfo?.area_name || "Regional"})
              </button>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm group-hover:bg-brand-700 transition">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-900 block leading-tight">
                  Apna<span className="text-brand-600">Kirana</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 block">
                  Regional SuperStore
                </span>
              </div>
            </Link>

            {/* Delivery Location Pill Button */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden md:flex items-center gap-2.5 bg-slate-100 hover:bg-brand-50 hover:border-brand-200 border border-slate-200/80 rounded-xl py-2 px-3 text-left transition shrink-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-600 shadow-2xs">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="text-xs leading-tight">
                <div className="font-semibold text-slate-900 flex items-center gap-1">
                  Deliver to <span className="text-brand-600">{pincode}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div className="text-slate-500 truncate max-w-[140px]">
                  {deliveryInfo?.area_name || "Check Location"}
                </div>
              </div>
            </button>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:block">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for biscuits, cold drinks, maggi, atta, shampoo..."
                  className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-20 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                />
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Search
                </button>
              </div>
            </form>

            {/* User Profile & Cart Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User Account Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 rounded-xl p-2 sm:px-3 text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                      {user.full_name?.charAt(0) || "U"}
                    </div>
                    <div className="hidden lg:block text-left text-xs">
                      <div className="font-semibold text-slate-900 truncate max-w-[100px]">
                        {user.full_name}
                      </div>
                      <div className="text-slate-500 capitalize">{user.role}</div>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden lg:block" />
                  </button>

                  {isUserMenuOpen && (
                    <div
                      onMouseLeave={() => setIsUserMenuOpen(false)}
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-semibold text-slate-900">{user.full_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.phone}</p>
                      </div>

                      <Link
                        to="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                      >
                        <PackageCheck className="h-4 w-4 text-slate-400" />
                        My Orders
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition"
                        >
                          <ShieldCheck className="h-4 w-4 text-brand-600" />
                          Admin Dashboard
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                          navigate("/");
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition text-left mt-1"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="btn-secondary py-2 px-3 sm:px-4 text-xs font-semibold"
                  >
                    Login
                  </Link>
                </div>
              )}

              {/* Cart Button */}
              <Link
                to="/cart"
                className="relative inline-flex items-center gap-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-3 sm:px-4 shadow-sm hover:shadow transition active:scale-95"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="hidden sm:inline text-xs font-bold">
                  {totalItemsCount > 0 ? `₹${finalTotal.toFixed(0)}` : "Cart"}
                </span>
                {totalItemsCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-white text-[10px] font-black absolute -top-1.5 -right-1.5 ring-2 ring-white">
                    {totalItemsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="pb-3 sm:hidden">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search snacks, drinks, groceries..."
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2 pl-9 pr-16 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-2.5 bg-brand-600 text-white rounded-lg text-[10px] font-bold"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Categories Quick Navigation Bar */}
        <div className="border-t border-slate-100 bg-slate-50/70 overflow-x-auto no-scrollbar py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-600">
            {categoriesQuickLinks.map((cat, idx) => (
              <Link
                key={idx}
                to={cat.slug ? `/products?category=${cat.slug}` : cat.path}
                className="hover:text-brand-700 hover:bg-white rounded-lg px-3 py-1.5 transition border border-transparent hover:border-slate-200"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
