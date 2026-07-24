import { describe, expect, test } from 'vitest';

import { sortScenarioSummaries } from '../components/dashboard/ScenarioSummaryTable';
import {
  RothConversionType,
  type ScenarioSummary,
  type SSClaimAge
} from '../models/RetirementTypes';

function createSummary(
  scenarioId: string,
  claimAge: SSClaimAge,
  rothConvType: RothConversionType
): ScenarioSummary {
  return {
    scenarioId,
    claimAge,
    rothConvType,
    firstAnnualSS: 0,
    horizonPortfolioAge: 0,
    endPortfolioAge: 0,
    horizonPortfolioCurrentDollars: 0,
    endPortfolioCurrentDollars: 0,
    totalTaxes: 0,
    totalIrmaaSurcharge: 0,
    totalMedicareHealthcareCost: 0,
    totalMedicareHealthcareAddedToSpending: 0,
    totalSSToHorizon: 0,
    depletionAge: null
  };
}

describe('sortScenarioSummaries', () => {
  test('groups claim ages and places Optimized after None and Fixed', () => {
    const original = [
      createSummary('67-optimized', 67, RothConversionType.Optimized),
      createSummary('62-fixed', 62, RothConversionType.Fixed),
      createSummary('67-none', 67, RothConversionType.None),
      createSummary('62-optimized', 62, RothConversionType.Optimized),
      createSummary('62-none', 62, RothConversionType.None),
      createSummary('67-fixed', 67, RothConversionType.Fixed)
    ];

    expect(sortScenarioSummaries(original).map((summary) => summary.scenarioId)).toEqual([
      '62-none',
      '62-fixed',
      '62-optimized',
      '67-none',
      '67-fixed',
      '67-optimized'
    ]);
    expect(original[0].scenarioId).toBe('67-optimized');
  });
});
