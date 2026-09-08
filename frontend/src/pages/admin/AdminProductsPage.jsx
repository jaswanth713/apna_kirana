import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Star,
  RefreshCw,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import adminService from "../../services/adminService";
import { formatCurrency, getErrorMessage } from "../../utils/formatters";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [activeFilter, setActiveFilter] = useState(""); // "", "true", "false"

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Quick Stock Edit Modal
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [newStockValue, setNewStockValue] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    name: "",
    category_id: "",
    brand: "",
    unit: "pack",
    weight_or_quantity: "",
    price: "",
    discount_price: "",
    stock_quantity: 10,
    image_url: "",
    description: "",
    is_featured: false,
    is_active: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  // Load initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodRes, catRes] = await Promise.all([
        adminService.getProducts({
          search: searchTerm || undefined,
          category_id: selectedCategory || undefined,
          low_stock_only: lowStockOnly ? true : undefined,
          is_active: activeFilter !== "" ? activeFilter === "true" : undefined,
          limit: 100,
        }),
        adminService.getCategories(),
      ]);

      if (prodRes.success) {
        setProducts(prodRes.data?.items || []);
      }
      if (catRes.success) {
        setCategories(catRes.data || []);
      }
    } catch (err) {
      console.error("Admin products fetch error:", err);
      setError("Failed to load products. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, lowStockOnly, activeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const openAddModal = () => {
    setModalMode("add");
    setSelectedProduct(null);
    setFormData({
      ...initialFormState,
      category_id: categories[0]?.id || "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setModalMode("edit");
    setSelectedProduct(prod);
    setFormData({
      name: prod.name || "",
      category_id: prod.category_id || "",
      brand: prod.brand || "",
      unit: prod.unit || "pack",
      weight_or_quantity: prod.weight_or_quantity || "",
      price: prod.price || "",
      discount_price: prod.discount_price || "",
      stock_quantity: prod.stock_quantity ?? 0,
      image_url: prod.image_url || "",
      description: prod.description || "",
      is_featured: !!prod.is_featured,
      is_active: !!prod.is_active,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        category_id: formData.category_id,
        brand: formData.brand.trim() || undefined,
        unit: formData.unit,
        weight_or_quantity: formData.weight_or_quantity.trim(),
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : undefined,
        stock_quantity: parseInt(formData.stock_quantity, 10),
        image_url: formData.image_url.trim() || undefined,
        description: formData.description.trim() || undefined,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
      };

      if (modalMode === "add") {
        const res = await adminService.createProduct(payload);
        if (res.success) {
          showNotification(`Product "${payload.name}" created successfully!`);
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const res = await adminService.updateProduct(selectedProduct.id, payload);
        if (res.success) {
          showNotification(`Product "${payload.name}" updated successfully!`);
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      console.error("Save product error:", err);
      setError(getErrorMessage(err, "Failed to save product."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!stockModalProduct) return;
    try {
      setSubmitting(true);
      const res = await adminService.updateStock(stockModalProduct.id, parseInt(newStockValue, 10));
      if (res.success) {
        showNotification(`Stock updated for ${stockModalProduct.name}!`);
        setStockModalProduct(null);
        fetchData();
      }
    } catch (err) {
      console.error("Stock update error:", err);
      setError("Failed to update stock quantity.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (prod) => {
    try {
      if (prod.is_active) {
        const confirm = window.confirm(`Deactivate "${prod.name}"? It will not appear in customer storefront.`);
        if (!confirm) return;
        const res = await adminService.deleteProduct(prod.id);
        if (res.success) {
          showNotification(`Product "${prod.name}" deactivated.`);
          fetchData();
        }
      } else {
        const res = await adminService.updateProduct(prod.id, { is_active: true });
        if (res.success) {
          showNotification(`Product "${prod.name}" activated!`);
          fetchData();
        }
      }
    } catch (err) {
      console.error("Toggle active error:", err);
      setError("Failed to change product status.");
    }
  };

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-900 text-emerald-100 px-4 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-2 animate-bounce-short text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-display">Product Catalog</h1>
          <p className="text-xs text-slate-500">Manage grocery items, live stock, pricing & discounts</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary text-xs font-semibold py-2.5 px-4 inline-flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product name, brand, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="btn-secondary text-xs font-semibold py-2 px-4 shrink-0">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="">All Items</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          {/* Low Stock Toggle */}
          <label className="flex items-center gap-2 cursor-pointer ml-auto bg-amber-50/80 text-amber-900 px-3 py-1 rounded-lg border border-amber-200/60 font-semibold text-xs">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded text-brand-600 focus:ring-0"
            />
            Low Stock Only (≤ 5)
          </label>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-brand-600 mb-2" />
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                    {/* Product info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&q=80"}
                          alt={prod.name}
                          className="h-10 w-10 rounded-lg object-cover bg-slate-100 border border-slate-100 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{prod.name}</span>
                            {prod.is_featured && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold inline-flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5 fill-amber-500" /> Featured
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {prod.brand ? `${prod.brand} • ` : ""}
                            {prod.weight_or_quantity || prod.unit}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {prod.category?.name || "—"}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 font-display">
                        {formatCurrency(prod.discount_price || prod.price)}
                      </div>
                      {prod.discount_price && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatCurrency(prod.price)}
                        </span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          setStockModalProduct(prod);
                          setNewStockValue(prod.stock_quantity);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                          prod.stock_quantity === 0
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : prod.stock_quantity <= 5
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                        title="Click to edit stock"
                      >
                        {prod.stock_quantity} units
                        <Edit2 className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {prod.is_active ? (
                        <span className="badge-success text-[10px]">Active</span>
                      ) : (
                        <span className="badge-neutral text-[10px]">Inactive</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                        title="Edit Product"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(prod)}
                        className={`p-1.5 rounded-lg transition ${
                          prod.is_active
                            ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                            : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={prod.is_active ? "Deactivate" : "Activate"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 font-display">
                {modalMode === "add" ? "Add New Grocery Product" : `Edit "${selectedProduct?.name}"`}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fortune Sunlite Sunflower Oil"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fortune, Amul, Tata"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Weight or Quantity display */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Weight / Quantity *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1 L, 500 g, Pack of 4"
                    value={formData.weight_or_quantity}
                    onChange={(e) => setFormData({ ...formData, weight_or_quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Unit Type
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="pack">Pack</option>
                    <option value="pcs">Pcs (Pieces)</option>
                    <option value="kg">Kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="l">L (Liters)</option>
                    <option value="ml">ml (Milliliters)</option>
                  </select>
                </div>

                {/* MRP Price */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    MRP Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="150.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Discounted Price */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Discount Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="135.00 (optional)"
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short description of product, brand qualities, or ingredients..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Toggles */}
                <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded text-brand-600 focus:ring-0"
                    />
                    Featured on Home Page
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded text-brand-600 focus:ring-0"
                    />
                    Active in Catalog
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs font-semibold py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs font-semibold py-2 px-6"
                >
                  {submitting ? "Saving..." : modalMode === "add" ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Modal */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 font-display">Update Stock Level</h3>
              <button onClick={() => setStockModalProduct(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleStockUpdate} className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-900 truncate">{stockModalProduct.name}</p>
                <p className="text-[11px] text-slate-400">Current stock: {stockModalProduct.stock_quantity} units</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  New Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStockModalProduct(null)}
                  className="btn-secondary text-xs font-semibold py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs font-semibold py-2 px-4"
                >
                  {submitting ? "Updating..." : "Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
