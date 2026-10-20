/**
 * Money and quantity helpers using integer arithmetic.
 * - Prices are stored in paise (₹1 = 100 paise)
 * - Quantities are stored in thousandths (1kg = 1000)
 * - All conversions use Math.round for precision
 */

/**
 * Convert a price string or number (₹) to paise (integer).
 * Example: "120.50" → 12050 paise
 */
export function priceToPaise(price: string | number): number {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return Math.round(num * 100);
}

/**
 * Convert paise (integer) back to price string (₹).
 * Example: 12050 → "₹120.50"
 */
export function paiseToPrice(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toFixed(2)}`;
}

/**
 * Convert a quantity string or number to thousandths (integer).
 * Example: "0.5" → 500 milliunits
 */
export function quantityToMilliunits(quantity: string | number): number {
  const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  return Math.round(num * 1000);
}

/**
 * Convert thousandths (integer) back to quantity display string.
 * Example: 500 → "0.5"
 */
export function milliunitsToQuantity(milliunits: number): string {
  const qty = milliunits / 1000;
  // Remove trailing zeros and unnecessary decimal points
  return qty.toString();
}

/**
 * Calculate line total in paise: quantity × price.
 * Uses integer math: (milliunits × paise) / 1000
 * Example: 500 milliunits × 12050 paise = 500 × 12050 / 1000 = 6025 paise
 */
export function calculateLineTotal(
  quantityMilliunits: number,
  pricePaise: number
): number {
  return Math.round((quantityMilliunits * pricePaise) / 1000);
}

/**
 * Format a line item display: "item name, 0.5 × 1kg @ ₹120 = ₹60"
 */
export function formatLineItem(
  name: string,
  quantity: string | number,
  unit: string,
  price: string | number,
  unavailable: boolean = false
): string {
  const qtyMilliunits = quantityToMilliunits(quantity);
  const pricePaise = priceToPaise(price);
  const lineTotalPaise = calculateLineTotal(qtyMilliunits, pricePaise);

  const qtyStr = milliunitsToQuantity(qtyMilliunits);
  const priceStr = paiseToPrice(pricePaise);
  const lineTotalStr = paiseToPrice(lineTotalPaise);

  const lineText = `${name}, ${qtyStr} × ${unit} @ ${priceStr} = ${lineTotalStr}`;

  if (unavailable) {
    return `${lineText} [UNAVAILABLE]`;
  }

  return lineText;
}

/**
 * Calculate total collect amount (sum of available line items in paise).
 */
export function calculateCollectAmount(
  items: Array<{
    quantity: string | number;
    price_snapshot: string | number;
    unavailable: boolean;
  }>
): number {
  return items
    .filter((item) => !item.unavailable)
    .reduce((total, item) => {
      const qtyMilliunits = quantityToMilliunits(item.quantity);
      const pricePaise = priceToPaise(item.price_snapshot);
      return total + calculateLineTotal(qtyMilliunits, pricePaise);
    }, 0);
}

/**
 * Format collect amount for display: "Collect: ₹120.50"
 */
export function formatCollectAmount(totalPaise: number): string {
  return `Collect: ${paiseToPrice(totalPaise)}`;
}
