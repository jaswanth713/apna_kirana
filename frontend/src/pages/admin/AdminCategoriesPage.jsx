import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  RefreshCw,
  FolderPlus,
} from "lucide-react";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/formatters";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    name: "",
    slug: "",
    description: "",
    image_url: "",
    display_order: 0,
    is_active: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getCategories();
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (err) {
      console.error("Admin categories fetch error:", err);
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedCategory(null);
    setFormData({
      ...initialFormState,
      display_order: categories.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setModalMode("edit");
    setSelectedCategory(cat);
    setFormData({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",
      image_url: cat.image_url || "",
      display_order: cat.display_order ?? 0,
      is_active: !!cat.is_active,
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
        slug: formData.slug.trim() || undefined,
        description: formData.description.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
        display_order: parseInt(formData.display_order, 10),
        is_active: formData.is_active,
      };

      if (modalMode === "add") {
        const res = await adminService.createCategory(payload);
        if (res.success) {
          showNotification(`Category "${payload.name}" created successfully!`);
          setIsModalOpen(false);
          fetchCategories();
        }
      } else {
        const res = await adminService.updateCategory(selectedCategory.id, payload);
        if (res.success) {
          showNotification(`Category "${payload.name}" updated successfully!`);
          setIsModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      console.error("Save category error:", err);
      setError(getErrorMessage(err, "Failed to save category."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      if (cat.is_active) {
        const confirm = window.confirm(`Deactivate category "${cat.name}"?`);
        if (!confirm) return;
        const res = await adminService.deleteCategory(cat.id);
        if (res.success) {
          showNotification(res.message || `Category "${cat.name}" deactivated.`);
          fetchCategories();
        }
      } else {
        const res = await adminService.updateCategory(cat.id, { is_active: true });
        if (res.success) {
          showNotification(`Category "${cat.name}" activated!`);
          fetchCategories();
        }
      }
    } catch (err) {
      console.error("Toggle category error:", err);
      setError("Failed to update category status.");
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
          <h1 className="text-2xl font-black text-slate-900 font-display">Category Hierarchy</h1>
          <p className="text-xs text-slate-500">Organize store sections, display order & visual banners</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary text-xs font-semibold py-2.5 px-4 inline-flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Categories Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-brand-600 mb-2" />
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            No categories found. Click "Add Category" to create one.
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-white rounded-2xl p-5 border transition flex flex-col justify-between ${
                cat.is_active ? "border-slate-200/80 shadow-2xs" : "border-slate-200/60 bg-slate-50/50 opacity-75"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={cat.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=80"}
                  alt={cat.name}
                  className="h-14 w-14 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{cat.name}</h3>
                    {cat.is_active ? (
                      <span className="badge-success text-[10px]">Active</span>
                    ) : (
                      <span className="badge-neutral text-[10px]">Inactive</span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 truncate">/{cat.slug}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {cat.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-semibold text-slate-400">
                  Order: #{cat.display_order}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                    title="Edit Category"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className={`p-1.5 rounded-lg transition ${
                      cat.is_active
                        ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                        : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                    }`}
                    title={cat.is_active ? "Deactivate" : "Activate"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 font-display">
                {modalMode === "add" ? "Create New Category" : `Edit "${selectedCategory?.name}"`}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dairy & Eggs, Snacks, Beverages"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Custom Slug (optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank for auto-generated slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Banner / Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the grocery category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-0"
                  />
                  Active in Customer Storefront
                </label>
              </div>

              {/* Action buttons */}
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
                  {submitting ? "Saving..." : modalMode === "add" ? "Create Category" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
