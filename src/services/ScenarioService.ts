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
    endPortfolioAge: final.endPortfolio,
    totalTaxes: rows.reduce((s, r) => s + r.totalTax, 0),
    totalSSToHorizon: rows.filter((r) => r.age <= inputs.horizonAge).reduce((s, r) => s + r.socialSecurity, 0),
    depletionAge: rows.find((r) => r.endPortfolio <= 1 && r.unfundedNeed > 0)?.age ?? null
  };
}
