export function formatMoney(v: number): string {
  const s = v.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });
  return s === '-$0' ? '$0' : s;
}

export function formatDecimal(v: number): number {
  return Math.round(v * 1000) / 1000;
}

export function roundRate(value: number, decimalPlaces = 4): number {
  const scale = 10 ** decimalPlaces;
  return Math.round(value * scale) / scale;
}
