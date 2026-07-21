import { describe, expect, it } from 'vitest';

import { calculateIrmaaEstimate, resolveIrmaaConfiguration } from '../services/IrmaaEngine';
import { IRMAA_CONFIGURATIONS, type IrmaaConfiguration } from '../data/irmaaTables';

describe('calculateIrmaaEstimate', () => {
  it('uses the 2026 single-filer tier boundaries', () => {
    expect(calculateIrmaaEstimate(109_000, 2026).tier).toBe(0);
    expect(calculateIrmaaEstimate(109_000.01, 2026).tier).toBe(1);
    expect(calculateIrmaaEstimate(137_000, 2026).tier).toBe(1);
    expect(calculateIrmaaEstimate(137_000.01, 2026).tier).toBe(2);
    expect(calculateIrmaaEstimate(499_999.99, 2026).tier).toBe(4);
    expect(calculateIrmaaEstimate(500_000, 2026).tier).toBe(5);
    expect(calculateIrmaaEstimate(500_000.01, 2026).tier).toBe(5);
  });

  it('calculates the combined annual Part B and Part D adjustment', () => {
    const estimate = calculateIrmaaEstimate(110_000, 2026);

    expect(estimate.monthlyPartBAdjustment).toBeCloseTo(81.2, 2);
    expect(estimate.monthlyPartDAdjustment).toBeCloseTo(14.5, 2);
    expect(estimate.annualSurcharge).toBeCloseTo((81.2 + 14.5) * 12, 2);
  });

  it('inflates thresholds and adjustment amounts for future planning years', () => {
    expect(calculateIrmaaEstimate(114_450, 2027, 1.05).tier).toBe(0);
    expect(calculateIrmaaEstimate(114_450.01, 2027, 1.05).tier).toBe(1);
    expect(calculateIrmaaEstimate(110_000, 2027, 1.05).annualSurcharge).toBe(0);
  });

  it('labels exact tables as published and future fallbacks as estimated', () => {
    expect(resolveIrmaaConfiguration(2026).isEstimated).toBe(false);
    expect(resolveIrmaaConfiguration(2027).isEstimated).toBe(true);
    expect(resolveIrmaaConfiguration(2027).configuration.premiumYear).toBe(2026);
    expect(calculateIrmaaEstimate(110_000, 2026).isEstimated).toBe(false);
    expect(calculateIrmaaEstimate(110_000, 2027, 1.03).isEstimated).toBe(true);
  });

  it('uses an exact user-maintained table instead of the projected fallback', () => {
    const custom2027: IrmaaConfiguration = {
      ...structuredClone(IRMAA_CONFIGURATIONS[0]),
      premiumYear: 2027,
      published: false,
      sourceUrl: '',
      tiers: [
        { tier: 0, upperMagi: 120_000, monthlyPartBAdjustment: 0, monthlyPartDAdjustment: 0 },
        { tier: 1, upperMagi: null, monthlyPartBAdjustment: 100, monthlyPartDAdjustment: 20 }
      ]
    };
    const configurations = [...IRMAA_CONFIGURATIONS, custom2027];
    const estimate = calculateIrmaaEstimate(115_000, 2027, 1.5, 'single', configurations);

    expect(estimate.tier).toBe(0);
    expect(estimate.configurationYear).toBe(2027);
    expect(estimate.isEstimated).toBe(false);
    expect(estimate.isPublished).toBe(false);
    expect(resolveIrmaaConfiguration(2028, 'single', configurations).configuration.premiumYear).toBe(2026);
  });
});
