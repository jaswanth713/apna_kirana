import api from "./api";

export const orderService = {
  /**
   * Place a new order
   * @param {Object} payload - { delivery_address_id, payment_method, customer_notes }
   */
  async createOrder(payload) {
    const response = await api.post("/api/orders", payload);
    return response.data;
  },

  /**
   * Fetch all orders for current customer
   */
  async getOrders() {
    const response = await api.get("/api/orders");
    return response.data;
  },

  /**
   * Fetch single order by ID or order number
   * @param {string} idOrNumber
   */
  async getOrder(idOrNumber) {
    const response = await api.get(`/api/orders/${idOrNumber}`);
    return response.data;
  },

  /**
   * Cancel an order
   * @param {string} idOrNumber
   * @param {string} [reason]
   */
  async cancelOrder(idOrNumber, reason) {
    const response = await api.post(`/api/orders/${idOrNumber}/cancel`, {
      reason: reason || undefined,
    });
    return response.data;
  },
};

export default orderService;
