import api from "./api";

export const cartService = {
  /**
   * Fetch current authenticated user's cart
   */
  async getCart() {
    const response = await api.get("/api/cart");
    return response.data;
  },

  /**
   * Add a product to the cart
   * @param {string} productId
   * @param {number} quantity
   */
  async addToCart(productId, quantity = 1) {
    const response = await api.post("/api/cart/items", {
      product_id: productId,
      quantity,
    });
    return response.data;
  },

  /**
   * Update quantity of an existing item in the cart
   * @param {string} itemOrProductId - CartItem UUID or Product UUID
   * @param {number} quantity
   */
  async updateCartItem(itemOrProductId, quantity) {
    const response = await api.put(`/api/cart/items/${itemOrProductId}`, {
      quantity,
    });
    return response.data;
  },

  /**
   * Remove an item from the cart
   * @param {string} itemOrProductId - CartItem UUID or Product UUID
   */
  async removeCartItem(itemOrProductId) {
    const response = await api.delete(`/api/cart/items/${itemOrProductId}`);
    return response.data;
  },

  /**
   * Clear entire cart
   */
  async clearCart() {
    const response = await api.delete("/api/cart");
    return response.data;
  },

  /**
   * Sync guest localStorage cart items into customer account on login
   * @param {Array<{ product_id: string, quantity: number }>} items
   */
  async syncCart(items) {
    const response = await api.post("/api/cart/sync", { items });
    return response.data;
  },
};

export default cartService;
