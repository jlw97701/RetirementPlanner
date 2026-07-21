import { describe, expect, it } from 'vitest';

import { ASSET_ALLOCATION_PROFILES } from '../data/assetAllocationProfiles';
import { HISTORICAL_ECONOMIC_DATA } from '../data/historicalEconomicData';
import {
  calculateDeterministicMarketReturns,
  calculateRollingAnnualizedPortfolioReturns
} from '../data/deterministicMarketProfiles';

describe('deterministic market profiles', () => {
  it.each(ASSET_ALLOCATION_PROFILES)('derives ordered 10- and 20-year returns for $label', ({ allocation }) => {
    for (const period of [10, 20] as const) {
      const result = calculateDeterministicMarketReturns(HISTORICAL_ECONOMIC_DATA, allocation, period);

      expect(Number.isFinite(result['significantly-below-average'])).toBe(true);
      expect(Number.isFinite(result['below-average'])).toBe(true);
      expect(result['significantly-below-average']).toBeLessThanOrEqual(result['below-average']);
      expect(result['below-average']).toBeLessThanOrEqual(result.average);
      expect(result.average).toBeLessThanOrEqual(result['above-average']);
    }
  });

  it('compounds and annualizes each rolling portfolio window', () => {
    const constantData = Array.from({ length: 11 }, (_, index) => ({
      year: 2000 + index,
      inflation: 0,
      socialSecurityCola: 0,
      stockReturn: 0.1,
      bondReturn: 0,
      cashReturn: 0,
      otherReturn: 0
    }));

    const returns = calculateRollingAnnualizedPortfolioReturns(
      constantData,
      { stocks: 1, bonds: 0, cash: 0, other: 0 },
      10
    );

    expect(returns).toHaveLength(2);
    expect(returns[0]).toBeCloseTo(0.1, 10);
    expect(returns[1]).toBeCloseTo(0.1, 10);
  });
});
