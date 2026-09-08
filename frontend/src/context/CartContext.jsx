import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import cartService from "../services/cartService";
import { getErrorMessage } from "../utils/formatters";

const CartContext = createContext(null);

const FREE_DELIVERY_THRESHOLD = 200.0;
const STANDARD_DELIVERY_FEE = 30.0;

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("store_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to compute local guest cart totals matching backend calculation
  const computeGuestSummary = useCallback((items) => {
    let sub = 0.0;
    let mrp = 0.0;
    let totalQty = 0;
    let hasOutOfStock = false;

    items.forEach((item) => {
      const effPrice = item.effective_price || item.price;
      const itemMrp = item.price;
      const isAvail = item.is_in_stock !== false && (item.stock_quantity ? item.stock_quantity >= item.quantity : true);
      if (!isAvail) hasOutOfStock = true;

      totalQty += item.quantity;
      if (isAvail) {
        sub += effPrice * item.quantity;
        mrp += itemMrp * item.quantity;
      }
    });

    sub = Math.round(sub * 100) / 100;
    mrp = Math.round(mrp * 100) / 100;
    const savings = Math.max(0, Math.round((mrp - sub) * 100) / 100);
    const fee = sub >= FREE_DELIVERY_THRESHOLD || sub === 0 ? 0.0 : STANDARD_DELIVERY_FEE;
    const amountForFree = sub >= FREE_DELIVERY_THRESHOLD ? 0.0 : Math.round((FREE_DELIVERY_THRESHOLD - sub) * 100) / 100;
    const finalTot = Math.round((sub + fee) * 100) / 100;

    return {
      subtotal: sub,
      mrp_total: mrp,
      discount_savings: savings,
      delivery_fee: fee,
      free_delivery_threshold: FREE_DELIVERY_THRESHOLD,
      amount_for_free_delivery: amountForFree,
      final_total: finalTot,
      total_items_count: totalQty,
      total_unique_items: items.length,
      has_out_of_stock_items: hasOutOfStock,
    };
  }, []);

  // Format backend cart items into standardized UI cart items
  const formatBackendItems = (backendItems) => {
    return backendItems.map((item) => ({
      id: item.product.id,
      cart_item_id: item.id,
      product_id: item.product_id,
      name: item.product.name,
      slug: item.product.slug,
      brand: item.product.brand,
      price: Number(item.product.price),
      discount_price: item.product.discount_price ? Number(item.product.discount_price) : null,
      effective_price: Number(item.item_price),
      image_url: item.product.image_url,
      unit: item.product.unit,
      weight_or_quantity: item.product.weight_or_quantity,
      stock_quantity: item.product.stock_quantity,
      is_in_stock: item.product.is_in_stock,
      quantity: item.quantity,
      item_total: item.item_total,
      item_mrp_total: item.item_mrp_total,
      item_savings: item.item_savings,
      is_available: item.is_available,
      stock_warning: item.stock_warning,
    }));
  };

  // Fetch or sync cart on auth change
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      // Local guest cart
      const saved = localStorage.getItem("store_cart");
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
      return;
    }

    setLoading(true);
    try {
      // Check if we have guest items in localStorage that need syncing
      const guestSaved = localStorage.getItem("store_cart");
      const guestItems = guestSaved ? JSON.parse(guestSaved) : [];

      if (guestItems.length > 0) {
        // Sync guest items to backend
        const syncPayload = guestItems.map((item) => ({
          product_id: item.id || item.product_id,
          quantity: item.quantity,
        }));
        const syncRes = await cartService.syncCart(syncPayload);
        if (syncRes.success) {
          setCartItems(formatBackendItems(syncRes.data.items));
          localStorage.removeItem("store_cart");
        }
      } else {
        // Fetch server cart
        const cartRes = await cartService.getCart();
        if (cartRes.success) {
          setCartItems(formatBackendItems(cartRes.data.items));
        }
      }
    } catch (err) {
      console.error("Failed to load user cart:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Persist guest cart to localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("store_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  /**
   * Add item to cart
   */
  const addToCart = async (product, quantity = 1) => {
    setError(null);
    if (isAuthenticated) {
      try {
        const res = await cartService.addToCart(product.id, quantity);
        if (res.success) {
          setCartItems(formatBackendItems(res.data.items));
          return res.data;
        }
      } catch (err) {
        const msg = getErrorMessage(err, "Failed to add item to cart");
        setError(msg);
        throw new Error(msg);
      }
    } else {
      // Guest local cart
      setCartItems((prevItems) => {
        const existingIndex = prevItems.findIndex((item) => item.id === product.id);
        const effectivePrice =
          product.discount_price && product.discount_price < product.price
            ? product.discount_price
            : product.price;

        if (existingIndex > -1) {
          const updated = [...prevItems];
          const currentQty = updated[existingIndex].quantity;
          const maxStock = product.stock_quantity ?? 99;
          const newQty = Math.min(currentQty + quantity, maxStock);
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
            item_total: Math.round(effectivePrice * newQty * 100) / 100,
            item_mrp_total: Math.round(product.price * newQty * 100) / 100,
            item_savings: Math.max(0, Math.round((product.price - effectivePrice) * newQty * 100) / 100),
          };
          return updated;
        } else {
          const newQty = Math.min(quantity, product.stock_quantity ?? 99);
          return [
            ...prevItems,
            {
              id: product.id,
              product_id: product.id,
              name: product.name,
              slug: product.slug,
              brand: product.brand,
              price: Number(product.price),
              discount_price: product.discount_price ? Number(product.discount_price) : null,
              effective_price: Number(effectivePrice),
              image_url: product.image_url,
              unit: product.unit,
              weight_or_quantity: product.weight_or_quantity,
              stock_quantity: product.stock_quantity,
              is_in_stock: product.stock_quantity > 0,
              quantity: newQty,
              item_total: Math.round(effectivePrice * newQty * 100) / 100,
              item_mrp_total: Math.round(product.price * newQty * 100) / 100,
              item_savings: Math.max(0, Math.round((product.price - effectivePrice) * newQty * 100) / 100),
              is_available: (product.stock_quantity ?? 1) >= newQty,
            },
          ];
        }
      });
    }
  };

  /**
   * Update quantity of item in cart
   */
  const updateQuantity = async (productId, newQuantity) => {
    setError(null);
    if (newQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (isAuthenticated) {
      try {
        const res = await cartService.updateCartItem(productId, newQuantity);
        if (res.success) {
          setCartItems(formatBackendItems(res.data.items));
        }
      } catch (err) {
        const msg = getErrorMessage(err, "Failed to update item quantity");
        setError(msg);
        throw new Error(msg);
      }
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === productId || item.product_id === productId) {
            const maxStock = item.stock_quantity ?? 99;
            const validQty = Math.min(newQuantity, maxStock);
            const effPrice = item.effective_price || item.price;
            return {
              ...item,
              quantity: validQty,
              item_total: Math.round(effPrice * validQty * 100) / 100,
              item_mrp_total: Math.round(item.price * validQty * 100) / 100,
              item_savings: Math.max(0, Math.round((item.price - effPrice) * validQty * 100) / 100),
            };
          }
          return item;
        })
      );
    }
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = async (productId) => {
    setError(null);
    if (isAuthenticated) {
      try {
        const res = await cartService.removeCartItem(productId);
        if (res.success) {
          setCartItems(formatBackendItems(res.data.items));
        }
      } catch (err) {
        console.error("Failed to remove cart item:", err);
      }
    } else {
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.id !== productId && item.product_id !== productId)
      );
    }
  };

  /**
   * Clear all items in cart
   */
  const clearCart = async () => {
    setError(null);
    if (isAuthenticated) {
      try {
        const res = await cartService.clearCart();
        if (res.success) {
          setCartItems([]);
        }
      } catch (err) {
        console.error("Failed to clear cart:", err);
      }
    } else {
      setCartItems([]);
      localStorage.removeItem("store_cart");
    }
  };

  // Computations
  const summary = computeGuestSummary(cartItems);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItemsCount: summary.total_items_count,
        subtotal: summary.subtotal,
        mrpTotal: summary.mrp_total,
        totalDiscount: summary.discount_savings,
        discountSavings: summary.discount_savings,
        deliveryFee: summary.delivery_fee,
        isFreeDelivery: summary.subtotal >= FREE_DELIVERY_THRESHOLD,
        freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
        amountForFreeDelivery: summary.amount_for_free_delivery,
        finalTotal: summary.final_total,
        hasOutOfStockItems: summary.has_out_of_stock_items,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
export default CartContext;
