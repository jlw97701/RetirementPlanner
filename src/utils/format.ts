export function formatMoney(v: number): string {
  const s = v.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });
  return s === '-$0' ? '$0' : s;
}

export function formatDecimal(v: number): number {
  return Math.round((v / 100) * 1000) / 1000;
}
