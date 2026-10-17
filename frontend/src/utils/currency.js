/**
 * Reloop Currency Utilities
 * Formats monetary amounts in Indian Rupees (₹) with paise precision.
 */

export function formatRupees(amountInRupees) {
  if (amountInRupees === null || amountInRupees === undefined || isNaN(amountInRupees)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amountInRupees) ? 0 : 2,
  }).format(amountInRupees);
}

export function paiseToRupees(paise) {
  if (!paise || isNaN(paise)) return 0;
  return paise / 100.0;
}

export function rupeesToPaise(rupees) {
  if (!rupees || isNaN(rupees)) return 0;
  return Math.round(Number(rupees) * 100);
}

export function calculateNextMinimumBid(startingPriceRupees, highestBidRupees, minIncrementRupees) {
  const start = Number(startingPriceRupees) || 0;
  const highest = highestBidRupees !== null && highestBidRupees !== undefined ? Number(highestBidRupees) : null;
  const inc = Number(minIncrementRupees) || 0;

  if (highest === null || highest <= 0) {
    return start;
  }
  return highest + inc;
}
