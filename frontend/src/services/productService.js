import api from "./api";

export const productService = {
  /**
   * Fetch all active categories
   */
  async getCategories() {
    const response = await api.get("/api/categories");
    return response.data;
  },

  /**
   * Fetch single category by UUID or slug
   */
  async getCategory(idOrSlug) {
    const response = await api.get(`/api/categories/${idOrSlug}`);
    return response.data;
  },

  /**
   * Fetch paginated & filtered products
   * @param {Object} params - { search, category, min_price, max_price, in_stock, featured, sort, page, limit }
   */
  async getProducts(params = {}) {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        cleanParams[key] = params[key];
      }
    });

    const response = await api.get("/api/products", { params: cleanParams });
    return response.data;
  },

  /**
   * Fetch single product by UUID or slug
   */
  async getProduct(idOrSlug) {
    const response = await api.get(`/api/products/${idOrSlug}`);
    return response.data;
  },
};

export default productService;
