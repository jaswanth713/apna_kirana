import api from "./api";

export const adminService = {
  /**
   * Get store dashboard metrics
   */
  async getMetrics() {
    const response = await api.get("/api/admin/metrics");
    return response.data;
  },

  /**
   * List all store orders (search, status, pagination)
   */
  async getOrders(params = {}) {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        cleanParams[key] = params[key];
      }
    });
    const response = await api.get("/api/admin/orders", { params: cleanParams });
    return response.data;
  },

  /**
   * Get single order details
   */
  async getOrder(idOrNumber) {
    const response = await api.get(`/api/admin/orders/${idOrNumber}`);
    return response.data;
  },

  /**
   * Update order progression status
   */
  async updateOrderStatus(idOrNumber, orderStatus, cancellationReason) {
    const response = await api.patch(`/api/admin/orders/${idOrNumber}/status`, {
      order_status: orderStatus,
      cancellation_reason: cancellationReason || undefined,
    });
    return response.data;
  },

  /**
   * List all products for admin
   */
  async getProducts(params = {}) {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        cleanParams[key] = params[key];
      }
    });
    const response = await api.get("/api/admin/products", { params: cleanParams });
    return response.data;
  },

  /**
   * Create new product
   */
  async createProduct(payload) {
    const response = await api.post("/api/admin/products", payload);
    return response.data;
  },

  /**
   * Update product details
   */
  async updateProduct(id, payload) {
    const response = await api.put(`/api/admin/products/${id}`, payload);
    return response.data;
  },

  /**
   * Update product stock quantity
   */
  async updateStock(id, stockQuantity) {
    const response = await api.patch(`/api/admin/products/${id}/stock`, {
      stock_quantity: stockQuantity,
    });
    return response.data;
  },

  /**
   * Deactivate product
   */
  async deleteProduct(id) {
    const response = await api.delete(`/api/admin/products/${id}`);
    return response.data;
  },

  /**
   * List all categories (active & inactive)
   */
  async getCategories() {
    const response = await api.get("/api/admin/categories");
    return response.data;
  },

  /**
   * Create category
   */
  async createCategory(payload) {
    const response = await api.post("/api/admin/categories", payload);
    return response.data;
  },

  /**
   * Update category
   */
  async updateCategory(id, payload) {
    const response = await api.put(`/api/admin/categories/${id}`, payload);
    return response.data;
  },

  /**
   * Delete or deactivate category
   */
  async deleteCategory(id) {
    const response = await api.delete(`/api/admin/categories/${id}`);
    return response.data;
  },

  /**
   * List all serviceable PIN codes
   */
  async getPincodes() {
    const response = await api.get("/api/admin/pincodes");
    return response.data;
  },

  /**
   * Create or update PIN code
   */
  async savePincode(payload) {
    const response = await api.post("/api/admin/pincodes", payload);
    return response.data;
  },

  /**
   * Deactivate PIN code
   */
  async deletePincode(pincode) {
    const response = await api.delete(`/api/admin/pincodes/${pincode}`);
    return response.data;
  },

  /**
   * List registered customers with stats
   */
  async getCustomers() {
    const response = await api.get("/api/admin/customers");
    return response.data;
  },
};

export default adminService;
