import api from "./api";

export const addressService = {
  /**
   * Fetch all saved addresses for current customer
   */
  async getAddresses() {
    const response = await api.get("/api/addresses");
    return response.data;
  },

  /**
   * Add a new delivery address
   * @param {Object} payload - { recipient_name, phone, address_line, landmark, city, state, pincode, is_default }
   */
  async createAddress(payload) {
    const response = await api.post("/api/addresses", payload);
    return response.data;
  },

  /**
   * Update an existing address
   * @param {string} id - Address UUID
   * @param {Object} payload
   */
  async updateAddress(id, payload) {
    const response = await api.put(`/api/addresses/${id}`, payload);
    return response.data;
  },

  /**
   * Delete an address
   * @param {string} id
   */
  async deleteAddress(id) {
    const response = await api.delete(`/api/addresses/${id}`);
    return response.data;
  },

  /**
   * Set address as default
   * @param {string} id
   */
  async setDefaultAddress(id) {
    const response = await api.patch(`/api/addresses/${id}/default`);
    return response.data;
  },
};

export default addressService;
