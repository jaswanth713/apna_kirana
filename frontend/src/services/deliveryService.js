import api from "./api";

export const deliveryService = {
  /**
   * Check if a postal PIN code is serviceable
   * @param {string} pincode
   */
  async checkPincode(pincode) {
    const response = await api.get(`/api/delivery/check/${pincode}`);
    return response.data;
  },
};

export default deliveryService;
