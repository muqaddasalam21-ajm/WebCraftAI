/**
 * Currency formatting utility for WebCraftAI
 * Defaults to Pakistani Rupee (PKR - ₨) with support for historical USD records.
 */

export function formatPKR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '₨0';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]/g, '')) || 0;
  return `₨${Math.round(num).toLocaleString('en-US')}`;
}

export function formatCurrency(amount: number | string | null | undefined, currency?: string): string {
  if (amount === null || amount === undefined || amount === '') {
    return currency === 'USD' ? '$0 USD' : '₨0';
  }
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]/g, '')) || 0;
  if (currency === 'USD') {
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USD`;
  }
  return `₨${Math.round(num).toLocaleString('en-US')}`;
}
