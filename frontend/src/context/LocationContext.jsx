import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [pincode, setPincode] = useState(() => localStorage.getItem("selected_pincode") || "560034");
  const [deliveryInfo, setDeliveryInfo] = useState({
    is_serviceable: true,
    pincode: "560034",
    area_name: "Koramangala 4th Block",
    delivery_fee: 25.0,
    min_order_amount: 100.0,
    free_delivery_threshold: 399.0,
    message: "Delivery available in Koramangala 4th Block! Free delivery above ₹399",
  });
  const [checking, setChecking] = useState(false);

  // Validate on load
  useEffect(() => {
    if (pincode) {
      checkPincode(pincode);
    }
  }, []);

  const checkPincode = async (pin) => {
    if (!pin || pin.trim().length < 5) return null;
    setChecking(true);
    try {
      const res = await api.get(`/api/delivery/check/${pin.trim()}`);
      if (res.data.success) {
        setDeliveryInfo(res.data.data);
        if (res.data.data.is_serviceable) {
          setPincode(pin.trim());
          localStorage.setItem("selected_pincode", pin.trim());
        }
        return res.data.data;
      }
    } catch (err) {
      const fallback = {
        is_serviceable: false,
        pincode: pin,
        message: "Unable to check location. Please try again.",
      };
      setDeliveryInfo(fallback);
      return fallback;
    } finally {
      setChecking(false);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        pincode,
        deliveryInfo,
        checking,
        checkPincode,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);
