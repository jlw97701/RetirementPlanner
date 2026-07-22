import { describe, expect, it } from 'vitest';
import { selectScenarioHighlights } from '../components/dashboard/ScenarioCards';
import { RothConversionType, type ScenarioSummary } from '../models/RetirementTypes';

function summary({
  scenarioId,
  ...overrides
}: Partial<ScenarioSummary> & Pick<ScenarioSummary, 'scenarioId'>): ScenarioSummary {
  return {
    scenarioId,
    claimAge: 67,
    rothConvType: RothConversionType.Base,
    firstAnnualSS: 30_000,
    horizonPortfolioAge: 0,
    endPortfolioAge: 0,
    horizonPortfolioCurrentDollars: 0,
    endPortfolioCurrentDollars: 0,
    totalTaxes: 0,
    totalIrmaaSurcharge: 0,
    totalMedicareHealthcareCost: 0,
    totalMedicareHealthcareAddedToSpending: 0,
    totalSSToHorizon: 0,
    depletionAge: null,
    ...overrides
  };
}

describe('scenario highlights', () => {
  it('selects six distinct scenarios for the configured significance categories', () => {
    const highlights = selectScenarioHighlights([
      summary({
        scenarioId: 'baseline',
        claimAge: 62,
        rothConvType: RothConversionType.None,
        horizonPortfolioCurrentDollars: 100,
        endPortfolioCurrentDollars: 100,
        totalTaxes: 50,
        totalSSToHorizon: 500,
        depletionAge: 80
      }),
      summary({
        scenarioId: 'horizon',
        horizonPortfolioCurrentDollars: 1_000,
        endPortfolioCurrentDollars: 200,
        totalTaxes: 60,
        totalSSToHorizon: 400,
        depletionAge: 82
      }),
      summary({
        scenarioId: 'ending',
        horizonPortfolioCurrentDollars: 300,
        endPortfolioCurrentDollars: 1_000,
        totalTaxes: 70,
        totalSSToHorizon: 300,
        depletionAge: 83
      }),
      summary({
        scenarioId: 'longest',
        horizonPortfolioCurrentDollars: 400,
        endPortfolioCurrentDollars: 500,
        totalTaxes: 90,
        totalSSToHorizon: 200
      }),
      summary({
        scenarioId: 'taxes',
        horizonPortfolioCurrentDollars: 450,
        endPortfolioCurrentDollars: 400,
        totalTaxes: 10,
        totalSSToHorizon: 100
      }),
      summary({
        scenarioId: 'social-security',
        horizonPortfolioCurrentDollars: 200,
        endPortfolioCurrentDollars: 300,
        totalTaxes: 80,
        totalSSToHorizon: 1_000,
        depletionAge: 84
      })
    ]);

    expect(highlights.map(({ reason, summary: item }) => [reason, item.scenarioId])).toEqual([
      ['Baseline', 'baseline'],
      ['Highest Horizon Balance', 'horizon'],
      ['Highest Ending Balance', 'ending'],
      ['Longest Funding', 'longest'],
      ['Lowest Taxes at Best Funding Duration', 'taxes'],
      ['Most Social Security by Horizon', 'social-security']
    ]);
    expect(new Set(highlights.map(({ summary: item }) => item.scenarioId)).size).toBe(6);
  });

  it('collapses duplicate winners instead of repeating a scenario', () => {
    const onlyScenario = summary({
      scenarioId: 'only',
      claimAge: 62,
      rothConvType: RothConversionType.None,
      horizonPortfolioCurrentDollars: 1_000,
      endPortfolioCurrentDollars: 1_000,
      totalSSToHorizon: 1_000
    });

    expect(selectScenarioHighlights([onlyScenario])).toEqual([{ reason: 'Baseline', summary: onlyScenario }]);
  });
});
