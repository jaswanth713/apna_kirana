import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUpDown, SlidersHorizontal, X } from "lucide-react";
import productService from "../services/productService";
import ProductGrid from "../components/product/ProductGrid";
import ProductFilter from "../components/product/ProductFilter";
import Pagination from "../components/product/Pagination";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state parameters
  const searchQuery = searchParams.get("search") || "";
  const selectedCategory = searchParams.get("category") || "";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";
  const inStockOnly = searchParams.get("in_stock") === "true";
  const sortBy = searchParams.get("sort") || "newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Component state
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // 1. Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await productService.getCategories();
        if (res.success) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error("Failed loading categories:", err);
      }
    }
    loadCategories();
  }, []);

  // 2. Fetch products whenever query params change
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = {
          search: searchQuery,
          category: selectedCategory,
          min_price: minPrice,
          max_price: maxPrice,
          in_stock: inStockOnly ? "true" : undefined,
          sort: sortBy,
          page: currentPage,
          limit: 12,
        };
        const res = await productService.getProducts(params);
        if (res.success) {
          setProducts(res.data.items);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error("Failed loading products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [searchQuery, selectedCategory, minPrice, maxPrice, inStockOnly, sortBy, currentPage]);

  // Helper to update specific search params while preserving others
  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value !== undefined && value !== null && value !== "") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset page to 1 whenever filters change
    if (key !== "page") {
      newParams.set("page", "1");
    }
    setSearchParams(newParams);
  };

  const handleSelectCategory = (catSlug) => {
    updateParam("category", catSlug);
  };

  const handleChangePrice = (min, max) => {
    const newParams = new URLSearchParams(searchParams);
    if (min) newParams.set("min_price", min);
    else newParams.delete("min_price");

    if (max) newParams.set("max_price", max);
    else newParams.delete("max_price");

    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleToggleStock = (checked) => {
    updateParam("in_stock", checked ? "true" : "");
  };

  const handleResetFilters = () => {
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set("search", searchQuery);
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    updateParam("page", newPage.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Find active category name
  const activeCategoryObj = categories.find(
    (c) => c.slug === selectedCategory || c.id === selectedCategory
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            {searchQuery
              ? `Search: "${searchQuery}"`
              : activeCategoryObj
              ? activeCategoryObj.name
              : "Store Catalog"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {pagination
              ? `Showing ${products.length} of ${pagination.total_items} items available for regional delivery`
              : "Browse fresh everyday products"}
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden btn-secondary py-2 px-3 text-xs font-semibold"
          >
            <SlidersHorizontal className="h-4 w-4 mr-1.5" /> Filters
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Desktop Filter Sidebar */}
        <div className="hidden md:block sticky top-24">
          <ProductFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onChangePrice={handleChangePrice}
            inStockOnly={inStockOnly}
            onToggleStock={handleToggleStock}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Mobile Filter Modal */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end md:hidden">
            <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 font-display">Filters</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 text-slate-400">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ProductFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  handleSelectCategory(cat);
                  setIsMobileFilterOpen(false);
                }}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onChangePrice={(min, max) => {
                  handleChangePrice(min, max);
                  setIsMobileFilterOpen(false);
                }}
                inStockOnly={inStockOnly}
                onToggleStock={handleToggleStock}
                onResetFilters={() => {
                  handleResetFilters();
                  setIsMobileFilterOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Product Grid & Pagination Area */}
        <div className="md:col-span-3 space-y-6">
          <ProductGrid
            products={products}
            loading={loading}
            emptyTitle={searchQuery ? `No matches for "${searchQuery}"` : "No Products Found"}
            emptyMessage="Try selecting a different category or clearing price filters."
            onReset={handleResetFilters}
          />

          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      </div>
    </div>
  );
}
