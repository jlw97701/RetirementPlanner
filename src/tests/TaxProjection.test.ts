import { describe, expect, test, vi } from 'vitest';

import { DEFAULT_TAX_CONFIG } from '../data/defaults';
import type { FederalTaxConfig, StateTaxConfig } from '../models/TaxTypes';
import {
  resolveFederalTaxConfiguration,
  resolveStateTaxConfiguration
} from '../services/TaxEngine';

const federalSingle2026 = DEFAULT_TAX_CONFIG.federal.find(
  (configuration) =>
    configuration.filingStatus === 'single' && configuration.year === 2026
)!;
const alaskaSingle2026 = DEFAULT_TAX_CONFIG.state.find(
  (configuration) =>
    configuration.stateCode === 'AK' &&
    configuration.filingStatus === 'single' &&
    configuration.year === 2026
)!;

describe('projection-year tax configuration resolution', () => {
  test('uses an exact-year federal table without inflation adjustment', () => {
    const federalSingle2030: FederalTaxConfig = {
      ...federalSingle2026,
      year: 2030,
      deductions: {
        ...federalSingle2026.deductions,
        standardDeduction: 20_300
      }
    };
    const inflationFactor = vi.fn(() => 99);

    const resolved = resolveFederalTaxConfiguration(
      [federalSingle2026, federalSingle2030],
      'single',
      2030,
      inflationFactor
    );

    expect(resolved.configuration).toBe(federalSingle2030);
    expect(resolved.sourceYear).toBe(2030);
    expect(resolved.isEstimated).toBe(false);
    expect(resolved.configuration.deductions.standardDeduction).toBe(20_300);
    expect(inflationFactor).not.toHaveBeenCalled();
  });

  test('inflation-adjusts all monetary state fields when an exact year is unavailable', () => {
    const stateWithExclusion: StateTaxConfig = {
      ...alaskaSingle2026,
      taxModel: 'progressive',
      brackets: [
        { id: 'test', lowerBound: 1_000, upperBound: 10_000, rate: 0.05 },
        { id: 'test-top', lowerBound: 10_000, upperBound: null, rate: 0.07 }
      ],
      deductions: {
        standardDeduction: 5_000,
        additionalDeduction65: 1_000
      },
      socialSecurityExemptionIncomeLimit: 25_000,
      personalExemption: 2_000,
      personalCredit: 100,
      retirementIncomeExclusions: [
        {
          minimumAge: 65,
          maximumAmount: 8_000,
          incomeLimit: 40_000,
          phaseoutStart: 30_000
        }
      ]
    };

    const resolved = resolveStateTaxConfiguration(
      [stateWithExclusion],
      'AK',
      'single',
      2030,
      () => 1.1
    );

    expect(resolved.sourceYear).toBe(2026);
    expect(resolved.projectionYear).toBe(2030);
    expect(resolved.isEstimated).toBe(true);
    expect(resolved.configuration.year).toBe(2030);
    expect(resolved.configuration.brackets[0].lowerBound).toBeCloseTo(1_100);
    expect(resolved.configuration.brackets[0].upperBound).toBeCloseTo(11_000);
    expect(resolved.configuration.deductions.standardDeduction).toBeCloseTo(5_500);
    expect(resolved.configuration.socialSecurityExemptionIncomeLimit).toBeCloseTo(27_500);
    expect(resolved.configuration.personalExemption).toBeCloseTo(2_200);
    expect(resolved.configuration.personalCredit).toBeCloseTo(110);
    expect(resolved.configuration.retirementIncomeExclusions[0].maximumAmount).toBeCloseTo(8_800);
    expect(resolved.configuration.retirementIncomeExclusions[0].incomeLimit).toBeCloseTo(44_000);
    expect(resolved.configuration.retirementIncomeExclusions[0].phaseoutStart).toBeCloseTo(33_000);
  });
});
