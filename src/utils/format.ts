export function formatMoney(v: number): string {
  return v.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });
}

export function formatDecimal(v: number): number {
  return Math.round((v / 100) * 1000) / 1000;
}
