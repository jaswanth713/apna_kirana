/**
 * Formats a number into Indian Rupee currency format (₹).
 * Example: 250 -> '₹250' or 250.5 -> '₹250.50'
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  const num = Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
}

/**
 * Calculates percentage discount between original price and discount price.
 * Example: original=100, discount=85 -> '15% OFF'
 */
export function formatDiscountPercentage(originalPrice, discountPrice) {
  if (!originalPrice || !discountPrice || discountPrice >= originalPrice) return null;
  const saving = ((originalPrice - discountPrice) / originalPrice) * 100;
  return `${Math.round(saving)}% OFF`;
}

/**
 * Formats ISO date string into human-readable date.
 */
export function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Safely extracts human-readable error string from Axios/FastAPI error responses (including 422 validation error arrays).
 */
export function getErrorMessage(err, defaultMsg = "An error occurred. Please try again.") {
  if (!err) return defaultMsg;
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc.filter((x) => x !== "body").join(".") : "";
        const msg = d.msg || d.message || "Invalid input";
        return field ? `${field}: ${msg}` : msg;
      })
      .join(", ");
  }
  if (detail && typeof detail === "object") {
    return detail.message || detail.msg || JSON.stringify(detail);
  }
  return err.response?.data?.message || err.message || defaultMsg;
}
