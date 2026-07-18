import type { TaxConfigurationSet } from '../models/TaxTypes';

const KEY = 'retirement-planner-tax-config';

export function loadTaxConfigurations(
  d: TaxConfigurationSet
): TaxConfigurationSet {
  try {
    const v = localStorage.getItem(KEY);
    return v ? (JSON.parse(v) as TaxConfigurationSet) : d;
  } catch {
    return d;
  }
}

export function saveTaxConfigurations(c: TaxConfigurationSet): void {
  localStorage.setItem(KEY, JSON.stringify(c));
}
