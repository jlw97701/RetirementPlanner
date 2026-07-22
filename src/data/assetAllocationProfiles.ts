import type { AssetAllocation } from '../models/RetirementTypes';

export type AssetAllocationMethod = 'conservative' | 'balanced' | 'growth' | 'aggressive-growth';
export const CUSTOM_ALLOCATION_ID = 'custom';
export type AssetAllocationSelection = AssetAllocationMethod | typeof CUSTOM_ALLOCATION_ID;

export interface AssetAllocationPreferences {
  selection: AssetAllocationSelection;
  customAllocation: AssetAllocation;
}

export interface AssetAllocationProfile {
  id: AssetAllocationMethod;
  label: string;
  description: string;
  allocation: AssetAllocation;
}

export const ASSET_ALLOCATION_PROFILES: readonly AssetAllocationProfile[] = [
  {
    id: 'conservative',
    label: 'Conservative',
    description: 'Lower stock exposure with greater emphasis on bonds and cash.',
    allocation: { domesticStocks: 0.21, internationalStocks: 0.09, bonds: 0.5, cash: 0.2, other: 0 }
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'A balance between growth-oriented and income-oriented assets.',
    allocation: { domesticStocks: 0.35, internationalStocks: 0.15, bonds: 0.4, cash: 0.1, other: 0 }
  },
  {
    id: 'growth',
    label: 'Growth',
    description: 'Greater stock exposure for long-term growth with moderate bonds and cash.',
    allocation: { domesticStocks: 0.42, internationalStocks: 0.18, bonds: 0.3, cash: 0.1, other: 0 }
  },
  {
    id: 'aggressive-growth',
    label: 'Aggressive Growth',
    description: 'High stock exposure with greater expected volatility.',
    allocation: { domesticStocks: 0.56, internationalStocks: 0.24, bonds: 0.15, cash: 0.05, other: 0 }
  }
];

const ALLOCATION_TOLERANCE = 0.000001;

export function getAssetAllocationProfile(method: AssetAllocationMethod): AssetAllocationProfile {
  const profile = ASSET_ALLOCATION_PROFILES.find((item) => item.id === method);

  if (!profile) {
    throw new Error(`Unknown asset-allocation method: ${method}`);
  }

  return profile;
}

export function identifyAssetAllocationProfile(allocation: AssetAllocation): AssetAllocationMethod | null {
  const profile = ASSET_ALLOCATION_PROFILES.find(
    (item) =>
      Math.abs(item.allocation.domesticStocks - allocation.domesticStocks) <= ALLOCATION_TOLERANCE &&
      Math.abs(item.allocation.internationalStocks - allocation.internationalStocks) <= ALLOCATION_TOLERANCE &&
      Math.abs(item.allocation.bonds - allocation.bonds) <= ALLOCATION_TOLERANCE &&
      Math.abs(item.allocation.cash - allocation.cash) <= ALLOCATION_TOLERANCE &&
      Math.abs(item.allocation.other - allocation.other) <= ALLOCATION_TOLERANCE
  );

  return profile?.id ?? null;
}
