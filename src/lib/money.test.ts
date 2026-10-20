import { describe, it, expect } from 'vitest';
import {
  priceToPaise,
  paiseToPrice,
  quantityToMilliunits,
  milliunitsToQuantity,
  calculateLineTotal,
  formatLineItem,
  calculateCollectAmount,
  formatCollectAmount,
} from './money';

describe('money helpers', () => {
  describe('priceToPaise', () => {
    it('converts rupee string to paise', () => {
      expect(priceToPaise('120')).toBe(12000);
      expect(priceToPaise('120.50')).toBe(12050);
      expect(priceToPaise('0.5')).toBe(50);
    });

    it('converts rupee number to paise', () => {
      expect(priceToPaise(120)).toBe(12000);
      expect(priceToPaise(120.5)).toBe(12050);
    });

    it('rounds correctly for floating point precision', () => {
      expect(priceToPaise(10.999)).toBe(1100);
      expect(priceToPaise(10.001)).toBe(1000);
    });
  });

  describe('paiseToPrice', () => {
    it('converts paise to price string', () => {
      expect(paiseToPrice(12000)).toBe('₹120.00');
      expect(paiseToPrice(12050)).toBe('₹120.50');
      expect(paiseToPrice(50)).toBe('₹0.50');
    });

    it('formats with 2 decimal places', () => {
      expect(paiseToPrice(1)).toBe('₹0.01');
      expect(paiseToPrice(10)).toBe('₹0.10');
    });
  });

  describe('quantityToMilliunits', () => {
    it('converts quantity string to milliunits', () => {
      expect(quantityToMilliunits('0.5')).toBe(500);
      expect(quantityToMilliunits('1')).toBe(1000);
      expect(quantityToMilliunits('1.5')).toBe(1500);
    });

    it('converts quantity number to milliunits', () => {
      expect(quantityToMilliunits(0.5)).toBe(500);
      expect(quantityToMilliunits(1)).toBe(1000);
      expect(quantityToMilliunits(1.5)).toBe(1500);
    });

    it('rounds correctly', () => {
      expect(quantityToMilliunits(0.001)).toBe(1);
      expect(quantityToMilliunits(0.0005)).toBe(1); // rounds up
    });
  });

  describe('milliunitsToQuantity', () => {
    it('converts milliunits back to quantity string', () => {
      expect(milliunitsToQuantity(500)).toBe('0.5');
      expect(milliunitsToQuantity(1000)).toBe('1');
      expect(milliunitsToQuantity(1500)).toBe('1.5');
    });

    it('handles zero', () => {
      expect(milliunitsToQuantity(0)).toBe('0');
    });
  });

  describe('calculateLineTotal', () => {
    it('calculates 0.5 × ₹120 = ₹60', () => {
      const qty = quantityToMilliunits('0.5'); // 500
      const price = priceToPaise('120'); // 12000
      const lineTotal = calculateLineTotal(qty, price); // (500 * 12000) / 1000 = 6000
      expect(lineTotal).toBe(6000); // ₹60.00
      expect(paiseToPrice(lineTotal)).toBe('₹60.00');
    });

    it('calculates 1.5 × ₹40 = ₹60', () => {
      const qty = quantityToMilliunits('1.5'); // 1500
      const price = priceToPaise('40'); // 4000
      const lineTotal = calculateLineTotal(qty, price); // (1500 * 4000) / 1000 = 6000
      expect(lineTotal).toBe(6000); // ₹60.00
      expect(paiseToPrice(lineTotal)).toBe('₹60.00');
    });

    it('calculates 1 × ₹120 = ₹120', () => {
      const qty = quantityToMilliunits('1');
      const price = priceToPaise('120');
      const lineTotal = calculateLineTotal(qty, price);
      expect(lineTotal).toBe(12000);
      expect(paiseToPrice(lineTotal)).toBe('₹120.00');
    });

    it('handles decimal prices correctly', () => {
      const qty = quantityToMilliunits('2');
      const price = priceToPaise('50.25'); // ₹50.25
      const lineTotal = calculateLineTotal(qty, price); // (2000 * 5025) / 1000 = 10050
      expect(lineTotal).toBe(10050);
      expect(paiseToPrice(lineTotal)).toBe('₹100.50');
    });

    it('rounds correctly for precision', () => {
      // 0.333 × ₹100 = ₹33.30
      const qty = quantityToMilliunits('0.333');
      const price = priceToPaise('100');
      const lineTotal = calculateLineTotal(qty, price); // (333 * 10000) / 1000 = 3330
      expect(lineTotal).toBe(3330);
      expect(paiseToPrice(lineTotal)).toBe('₹33.30');
    });
  });

  describe('formatLineItem', () => {
    it('formats a standard line item', () => {
      const result = formatLineItem('Garlic', '0.5', '1kg', '120');
      expect(result).toBe('Garlic, 0.5 × 1kg @ ₹120.00 = ₹60.00');
    });

    it('formats with unavailable flag', () => {
      const result = formatLineItem('Onion', '1', '1kg', '80', true);
      expect(result).toBe('Onion, 1 × 1kg @ ₹80.00 = ₹80.00 [UNAVAILABLE]');
    });

    it('formats fractional quantities and prices', () => {
      const result = formatLineItem('Rice', '1.5', '500g', '40.50');
      expect(result).toBe('Rice, 1.5 × 500g @ ₹40.50 = ₹60.75');
    });
  });

  describe('calculateCollectAmount', () => {
    it('sums available items only', () => {
      const items = [
        { quantity: '0.5', price_snapshot: '120', unavailable: false },
        { quantity: '1', price_snapshot: '100', unavailable: false },
        { quantity: '1', price_snapshot: '50', unavailable: true }, // excluded
      ];
      const total = calculateCollectAmount(items);
      // 0.5×120 + 1×100 = 60 + 100 = 160
      expect(total).toBe(16000); // ₹160.00
      expect(paiseToPrice(total)).toBe('₹160.00');
    });

    it('returns 0 when all items are unavailable', () => {
      const items = [
        { quantity: '1', price_snapshot: '100', unavailable: true },
        { quantity: '1', price_snapshot: '50', unavailable: true },
      ];
      const total = calculateCollectAmount(items);
      expect(total).toBe(0);
    });

    it('returns 0 for empty items', () => {
      const total = calculateCollectAmount([]);
      expect(total).toBe(0);
    });
  });

  describe('formatCollectAmount', () => {
    it('formats collect amount', () => {
      expect(formatCollectAmount(16000)).toBe('Collect: ₹160.00');
      expect(formatCollectAmount(6000)).toBe('Collect: ₹60.00');
      expect(formatCollectAmount(0)).toBe('Collect: ₹0.00');
    });
  });
});
