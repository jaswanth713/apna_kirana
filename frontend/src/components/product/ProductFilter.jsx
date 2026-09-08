import React from "react";
import { Filter, RotateCcw, Check, Sparkles } from "lucide-react";

export default function ProductFilter({
  categories = [],
  selectedCategory = "",
  onSelectCategory,
  minPrice = "",
  maxPrice = "",
  onChangePrice,
  inStockOnly = false,
  onToggleStock,
  onResetFilters,
}) {
  const priceRanges = [
    { label: "All Prices", min: "", max: "" },
    { label: "Under ₹30", min: "", max: "30" },
    { label: "₹30 – ₹75", min: "30", max: "75" },
    { label: "₹75 – ₹150", min: "75", max: "150" },
    { label: "Above ₹150", min: "150", max: "" },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-5">
      {/* Filter Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900 font-display">
          <Filter className="h-4 w-4 text-brand-600" />
          <span>Filters</span>
        </div>
        <button
          onClick={onResetFilters}
          className="text-[11px] font-semibold text-slate-500 hover:text-brand-600 flex items-center gap-1 transition"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      {/* Categories Filter */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          Categories
        </label>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onSelectCategory("")}
            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
              selectedCategory === ""
                ? "bg-brand-50 text-brand-700 font-bold"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>All Categories</span>
            {selectedCategory === "" && <Check className="h-3.5 w-3.5 text-brand-600" />}
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                  isSelected
                    ? "bg-brand-50 text-brand-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="truncate pr-2">{cat.name}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-brand-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Price Ranges */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          Price Range
        </label>
        <div className="space-y-1">
          {priceRanges.map((range, idx) => {
            const isSelected = minPrice === range.min && maxPrice === range.max;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChangePrice(range.min, range.max)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                  isSelected
                    ? "bg-brand-50 text-brand-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{range.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-brand-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* In Stock Only Toggle */}
      <div className="pt-3 border-t border-slate-100">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onToggleStock(e.target.checked)}
            className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 rounded-md"
          />
          <span>In-Stock Items Only</span>
        </label>
      </div>
    </div>
  );
}
