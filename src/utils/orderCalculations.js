/**
 * Order Pricing Calculation Utilities for AutoLedBlida
 * 
 * Core business rule:
 * Total = Prix sous-total (articles commandés) + Frais de livraison
 * The subtotal is already the total price of all items in the order.
 * It is NEVER multiplied by quantity again when adding delivery fees.
 */

/**
 * Calculates the total from subtotal and delivery fee.
 * Coerces inputs to numbers and ensures non-negative results.
 * @param {number|string} subtotal - Price of the ordered items
 * @param {number|string} deliveryFee - Delivery fee (home or desk)
 * @returns {number} The total amount to collect on delivery
 */
export function calculateOrderTotal(subtotal, deliveryFee) {
  const cleanSub = Math.max(0, Number(subtotal) || 0);
  const cleanFee = Math.max(0, Number(deliveryFee) || 0);
  return cleanSub + cleanFee;
}

/**
 * Derives subtotal from an existing order when subtotal might not be explicitly present.
 * Priority: order.subtotal -> (order.total - deliveryFee) -> order.productPrice -> 0
 * @param {object} order
 * @returns {number}
 */
export function deriveSubtotal(order = {}) {
  const safeOrder = order || {};
  const fee = Math.max(0, Number(safeOrder.deliveryFee) || 0);
  if (safeOrder.subtotal !== undefined && safeOrder.subtotal !== null && Number(safeOrder.subtotal) > 0) {
    return Number(safeOrder.subtotal);
  }
  if (safeOrder.total !== undefined && safeOrder.total !== null && Number(safeOrder.total) > fee) {
    return Number(safeOrder.total) - fee;
  }
  if (safeOrder.productPrice !== undefined && safeOrder.productPrice !== null) {
    return Math.max(0, Number(safeOrder.productPrice) || 0);
  }
  return 0;
}

/**
 * Computes subtotal from an array of items.
 * @param {Array<{ price?: number|string, productPrice?: number|string, quantity?: number|string }>} items
 * @returns {number}
 */
export function calculateItemsSubtotal(items = []) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((sum, item) => {
    const price = Math.max(0, Number(item.price ?? item.productPrice) || 0);
    const qty = Math.max(1, Math.min(100, Number(item.quantity) || 1));
    return sum + price * qty;
  }, 0);
}

/**
 * Full order pricing resolver for creation or update.
 * @param {object} params
 * @param {Array} [params.items]
 * @param {number|string} [params.productPrice]
 * @param {number|string} [params.quantity]
 * @param {number|string} [params.deliveryFee]
 * @param {number|string} [params.subtotal]
 * @param {number|string} [params.total]
 * @returns {{ subtotal: number, deliveryFee: number, total: number }}
 */
export function resolveOrderPricing({ items, productPrice, quantity, deliveryFee, subtotal, total } = {}) {
  const dFee = Math.max(0, Number(deliveryFee) || 0);

  let finalSubtotal;
  if (subtotal !== undefined && subtotal !== null && subtotal !== "") {
    finalSubtotal = Math.max(0, Number(subtotal) || 0);
  } else if (Array.isArray(items) && items.length > 0) {
    finalSubtotal = calculateItemsSubtotal(items);
  } else if (productPrice !== undefined && productPrice !== null && productPrice !== "") {
    const price = Math.max(0, Number(productPrice) || 0);
    const qty = Math.max(1, Number(quantity) || 1);
    finalSubtotal = price * qty;
  } else {
    finalSubtotal = 0;
  }

  let finalTotal;
  if (total !== undefined && total !== null && total !== "") {
    finalTotal = Math.max(0, Number(total) || 0);
  } else {
    finalTotal = finalSubtotal + dFee;
  }

  return {
    subtotal: finalSubtotal,
    deliveryFee: dFee,
    total: finalTotal
  };
}
