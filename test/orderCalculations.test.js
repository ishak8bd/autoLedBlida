import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateOrderTotal,
  deriveSubtotal,
  calculateItemsSubtotal,
  resolveOrderPricing
} from "../src/utils/orderCalculations.js";

describe("Order Pricing Calculations (Financial Safety)", () => {
  describe("calculateOrderTotal(subtotal, deliveryFee)", () => {
    it("should correctly compute total = subtotal + deliveryFee (home delivery)", () => {
      const subtotal = 4500;
      const deliveryFee = 700;
      assert.strictEqual(calculateOrderTotal(subtotal, deliveryFee), 5200);
    });

    it("should correctly compute total = subtotal + deliveryFee (desk delivery)", () => {
      const subtotal = 4500;
      const deliveryFee = 450;
      assert.strictEqual(calculateOrderTotal(subtotal, deliveryFee), 4950);
    });

    it("should handle free delivery (0 fee)", () => {
      const subtotal = 3200;
      const deliveryFee = 0;
      assert.strictEqual(calculateOrderTotal(subtotal, deliveryFee), 3200);
    });

    it("CRITICAL: should NOT multiply subtotal by quantity when adding delivery fee (prevents 1fa2368 regression)", () => {
      // Scenario: Customer ordered 3 units of LED headlights, subtotal is already 9000 DZD (3000 x 3).
      // Delivery fee is 500 DZD.
      // Total MUST be 9500 DZD, NOT (9000 * 3) + 500 = 27500 DZD!
      const subtotal = 9000;
      const deliveryFee = 500;
      const quantity = 3;

      const total = calculateOrderTotal(subtotal, deliveryFee);
      assert.strictEqual(total, 9500);
      assert.notStrictEqual(total, subtotal * quantity + deliveryFee);
    });

    it("should coerce string inputs without string concatenation", () => {
      // Bug prevention: "3500" + "500" should be 4000, not "3500500"
      assert.strictEqual(calculateOrderTotal("3500", "500"), 4000);
      assert.strictEqual(calculateOrderTotal("1200", 300), 1500);
      assert.strictEqual(calculateOrderTotal(1200, "300"), 1500);
    });

    it("should clamp negative numbers to zero", () => {
      assert.strictEqual(calculateOrderTotal(-500, 500), 500);
      assert.strictEqual(calculateOrderTotal(2000, -300), 2000);
    });

    it("should handle undefined and null gracefully", () => {
      assert.strictEqual(calculateOrderTotal(undefined, undefined), 0);
      assert.strictEqual(calculateOrderTotal(null, null), 0);
      assert.strictEqual(calculateOrderTotal(2500, null), 2500);
      assert.strictEqual(calculateOrderTotal(null, 600), 600);
    });
  });

  describe("deriveSubtotal(order)", () => {
    it("should use order.subtotal when explicitly present and > 0", () => {
      const order = { subtotal: 3500, total: 4200, deliveryFee: 700, productPrice: 1750 };
      assert.strictEqual(deriveSubtotal(order), 3500);
    });

    it("should derive subtotal from total - deliveryFee when subtotal is missing", () => {
      const order = { total: 5000, deliveryFee: 600, productPrice: 4400 };
      assert.strictEqual(deriveSubtotal(order), 4400);
    });

    it("should fallback to productPrice if total is not greater than deliveryFee", () => {
      const order = { productPrice: 2800, deliveryFee: 500 };
      assert.strictEqual(deriveSubtotal(order), 2800);
    });

    it("should return 0 if order is empty or has no pricing data", () => {
      assert.strictEqual(deriveSubtotal({}), 0);
      assert.strictEqual(deriveSubtotal(null), 0);
    });
  });

  describe("calculateItemsSubtotal(items)", () => {
    it("should compute price * quantity for a single item", () => {
      const items = [{ price: 2500, quantity: 2 }];
      assert.strictEqual(calculateItemsSubtotal(items), 5000);
    });

    it("should compute sum of price * quantity across multiple items", () => {
      const items = [
        { price: 1500, quantity: 2 }, // 3000
        { price: 4000, quantity: 1 }, // 4000
        { price: 800, quantity: 3 }   // 2400
      ];
      assert.strictEqual(calculateItemsSubtotal(items), 9400);
    });

    it("should handle productPrice property alias", () => {
      const items = [{ productPrice: 3000, quantity: 2 }];
      assert.strictEqual(calculateItemsSubtotal(items), 6000);
    });

    it("should default missing quantity to 1", () => {
      const items = [{ price: 3200 }];
      assert.strictEqual(calculateItemsSubtotal(items), 3200);
    });

    it("should handle empty or invalid items array", () => {
      assert.strictEqual(calculateItemsSubtotal([]), 0);
      assert.strictEqual(calculateItemsSubtotal(null), 0);
    });
  });

  describe("resolveOrderPricing(params)", () => {
    it("should resolve pricing from multi-item order", () => {
      const result = resolveOrderPricing({
        items: [
          { price: 2000, quantity: 2 },
          { price: 1500, quantity: 1 }
        ],
        deliveryFee: 600
      });
      assert.deepStrictEqual(result, {
        subtotal: 5500,
        deliveryFee: 600,
        total: 6100
      });
    });

    it("should prioritize explicit subtotal over items calculation", () => {
      const result = resolveOrderPricing({
        subtotal: 4000,
        deliveryFee: 500,
        items: [{ price: 1000, quantity: 1 }]
      });
      assert.deepStrictEqual(result, {
        subtotal: 4000,
        deliveryFee: 500,
        total: 4500
      });
    });

    it("should resolve pricing from productPrice and quantity for single product", () => {
      const result = resolveOrderPricing({
        productPrice: 3500,
        quantity: 2,
        deliveryFee: 700
      });
      assert.deepStrictEqual(result, {
        subtotal: 7000,
        deliveryFee: 700,
        total: 7700
      });
    });

    it("should preserve explicit total when provided", () => {
      const result = resolveOrderPricing({
        subtotal: 5000,
        deliveryFee: 500,
        total: 5200 // e.g. custom negotiated discount
      });
      assert.deepStrictEqual(result, {
        subtotal: 5000,
        deliveryFee: 500,
        total: 5200
      });
    });
  });
});
