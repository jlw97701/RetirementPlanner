import type {
  PlannerInputs,
  RetirementYear,
  Scenario,
  ScenarioSummary
} from '../models/RetirementTypes';

export function summarizeScenario(
  inputs: PlannerInputs,
  scenario: Scenario,
  rows: RetirementYear[]
): ScenarioSummary {
  const h =
      rows.find((r) => r.age === inputs.horizonAge) ?? rows[rows.length - 1],
    f = rows[rows.length - 1];
  return {
    scenarioId: scenario.id,
    claimAge: scenario.claimAge,
    rothConvType: scenario.rothConvType,
    horizonPortfolioAge: h.endPortfolio,
    endPortfolioAge: f.endPortfolio,
    totalTaxes: rows.reduce((s, r) => s + r.totalTax, 0),
    totalSSToHorizon: rows
      .filter((r) => r.age <= inputs.horizonAge)
      .reduce((s, r) => s + r.socialSecurity, 0),
    depletionAge:
      rows.find((r) => r.endPortfolio <= 1 && r.unfundedNeed > 0)?.age ?? null
  };
}
