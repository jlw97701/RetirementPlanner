import type { PlannerInputs, RetirementYear, RetirementScenario, ScenarioSummary } from '../models/RetirementTypes';

export function summarizeRetirementScenario(
  inputs: PlannerInputs,
  scenario: RetirementScenario,
  rows: RetirementYear[]
): ScenarioSummary {
  const firstSSRow = rows.find((row) => row.socialSecurity > 0),
    horizon = rows.find((r) => r.age === inputs.horizonAge) ?? rows[rows.length - 1],
    final = rows[rows.length - 1];

  return {
    scenarioId: scenario.id,
    claimAge: scenario.claimAge,
    rothConvType: scenario.rothConvType,
    firstAnnualSS: firstSSRow?.socialSecurity ?? 0,

    horizonPortfolioAge: horizon.endPortfolio,
    horizonPortfolioCurrentDollars: horizon.endPortfolioCurrentDollars,

    endPortfolioAge: final.endPortfolio,
    endPortfolioCurrentDollars: final.endPortfolioCurrentDollars,

    totalTaxes: rows.reduce((sum, row) => sum + row.totalTax, 0),
    totalIrmaaSurcharge: rows.reduce((sum, row) => sum + row.annualIrmaaSurcharge, 0),

    totalSSToHorizon: rows
      .filter((row) => row.age <= inputs.horizonAge)
      .reduce((sum, row) => sum + row.socialSecurity, 0),

    depletionAge: rows.find((row) => row.endPortfolio <= 1 && row.unfundedNeed > 0)?.age ?? null
  };
}
