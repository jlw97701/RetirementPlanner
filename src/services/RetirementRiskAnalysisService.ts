import { COLA_HISTORY } from '../data/colaHistory';
import type { IrmaaConfiguration } from '../data/irmaaTables';
import type { EconomicScenarioSettings } from '../models/EconomicScenarioSettings';
import type {
  AssetAllocation,
  PlannerInputs,
  RetirementScenario,
  RothConversionType,
  SSClaimAge,
  SSColaSettings,
  SSMonthlyIncome
} from '../models/RetirementTypes';
import type { FederalTaxConfig, StateTaxConfig } from '../models/TaxTypes';
import { getProjectionPeriod } from '../utils/projectionDates';
import { EconomicScenarioEngine, EconomicScenarioMethod } from './EconomicScenarioEngine';
import { calculateRetirementProjection } from './RetirementEngine';

const UNFUNDED_NEED_TOLERANCE = 0.01;
const MAX_SIMULATIONS = 5_000;

export interface RetirementRiskPercentilePoint {
  age: number;
  p10: number;
  p50: number;
  p90: number;
}

export interface RetirementRiskScenarioResult {
  scenarioId: string;
  claimAge: SSClaimAge | null;
  rothConvType: RothConversionType;
  horizonFullyFundedRate: number;
  fullyFundedRate: number;
  depletionRisk: number;
  endingPortfolioP10: number;
  endingPortfolioP50: number;
  endingPortfolioP90: number;
  portfolioPercentiles: RetirementRiskPercentilePoint[];
}

export interface RetirementRiskAnalysisResult {
  simulations: number;
  baseSeed: number;
  scenarios: RetirementRiskScenarioResult[];
}

export interface RetirementRiskAnalysisParameters {
  inputs: PlannerInputs;
  ssIncome: SSMonthlyIncome[];
  colaSettings: SSColaSettings;
  assetAllocation: AssetAllocation;
  retirementScenarios: readonly RetirementScenario[];
  economicScenarioSettings: EconomicScenarioSettings;
  federalTaxConfig: FederalTaxConfig;
  stateTaxConfig: StateTaxConfig;
  irmaaConfigurations: readonly IrmaaConfiguration[];
}

export interface RetirementRiskAnalysisOptions {
  signal?: AbortSignal;
  onProgress?: (completed: number, total: number) => void;
}

interface ScenarioAccumulator {
  scenario: RetirementScenario;
  horizonFullyFundedCount: number;
  fullyFundedCount: number;
  depletionCount: number;
  portfolioBalancesByAge: number[][];
}

export async function runRetirementRiskAnalysis(
  parameters: RetirementRiskAnalysisParameters,
  options: RetirementRiskAnalysisOptions = {}
): Promise<RetirementRiskAnalysisResult> {
  const {
    inputs,
    ssIncome,
    colaSettings,
    assetAllocation,
    retirementScenarios,
    economicScenarioSettings,
    federalTaxConfig,
    stateTaxConfig,
    irmaaConfigurations
  } = parameters;
  const period = getProjectionPeriod(inputs.birthDate, inputs.startAge, inputs.endAge);
  const simulations = normalizeSimulationCount(economicScenarioSettings.monteCarlo.simulations);
  const baseSeed = Math.trunc(economicScenarioSettings.monteCarlo.seed);
  const engine = new EconomicScenarioEngine();
  const accumulators: ScenarioAccumulator[] = retirementScenarios.map((scenario) => ({
    scenario,
    horizonFullyFundedCount: 0,
    fullyFundedCount: 0,
    depletionCount: 0,
    portfolioBalancesByAge: Array.from({ length: period.yearCount }, () => [])
  }));
  const simulationsPerYield = Math.max(1, Math.floor(25 / Math.max(1, retirementScenarios.length)));

  if (retirementScenarios.length === 0) {
    throw new Error('Retirement risk analysis requires at least one retirement strategy.');
  }

  options.onProgress?.(0, simulations);

  for (let simulationIndex = 0; simulationIndex < simulations; simulationIndex += 1) {
    throwIfAborted(options.signal);

    const economicScenario = engine.generate({
      method: EconomicScenarioMethod.MONTE_CARLO,
      startYear: period.startYear,
      years: period.yearCount,
      assumptions: economicScenarioSettings.monteCarlo.assumptions,
      seed: deriveSimulationSeed(baseSeed, simulationIndex),
      knownSocialSecurityColas: COLA_HISTORY
    });

    for (const accumulator of accumulators) {
      const rows = calculateRetirementProjection(
        inputs,
        ssIncome,
        colaSettings,
        assetAllocation,
        accumulator.scenario,
        {
          federalTaxConfig,
          stateTaxConfig,
          economicScenario,
          irmaaConfigurations
        }
      );
      const hasUnfundedSpendingThroughHorizon = rows.some(
        (row) => row.age <= inputs.horizonAge && row.unfundedNeed > UNFUNDED_NEED_TOLERANCE
      );
      const hasUnfundedSpending = rows.some((row) => row.unfundedNeed > UNFUNDED_NEED_TOLERANCE);

      if (!hasUnfundedSpendingThroughHorizon) accumulator.horizonFullyFundedCount += 1;
      if (hasUnfundedSpending) accumulator.depletionCount += 1;
      else accumulator.fullyFundedCount += 1;

      rows.forEach((row, rowIndex) => {
        accumulator.portfolioBalancesByAge[rowIndex].push(row.endPortfolioCurrentDollars);
      });
    }

    const completed = simulationIndex + 1;
    options.onProgress?.(completed, simulations);
    if (completed < simulations && completed % simulationsPerYield === 0) await yieldToBrowser();
  }

  return {
    simulations,
    baseSeed,
    scenarios: accumulators.map((accumulator) => {
      const portfolioPercentiles = accumulator.portfolioBalancesByAge.map((balances, index) => ({
        age: inputs.startAge + index,
        p10: percentile(balances, 0.1),
        p50: percentile(balances, 0.5),
        p90: percentile(balances, 0.9)
      }));
      const ending = portfolioPercentiles[portfolioPercentiles.length - 1];

      return {
        scenarioId: accumulator.scenario.id,
        claimAge: accumulator.scenario.claimAge,
        rothConvType: accumulator.scenario.rothConvType,
        horizonFullyFundedRate: accumulator.horizonFullyFundedCount / simulations,
        fullyFundedRate: accumulator.fullyFundedCount / simulations,
        depletionRisk: accumulator.depletionCount / simulations,
        endingPortfolioP10: ending?.p10 ?? 0,
        endingPortfolioP50: ending?.p50 ?? 0,
        endingPortfolioP90: ending?.p90 ?? 0,
        portfolioPercentiles
      };
    })
  };
}

export function percentile(values: readonly number[], probability: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = Math.min(1, Math.max(0, probability)) * (sorted.length - 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const weight = position - lowerIndex;
  return sorted[lowerIndex] + (sorted[upperIndex] - sorted[lowerIndex]) * weight;
}

function normalizeSimulationCount(value: number): number {
  if (!Number.isFinite(value)) return 1_000;
  return Math.min(MAX_SIMULATIONS, Math.max(1, Math.trunc(value)));
}

function deriveSimulationSeed(baseSeed: number, simulationIndex: number): number {
  if (simulationIndex === 0) return Math.trunc(baseSeed) >>> 0;
  return (Math.trunc(baseSeed) + Math.imul(simulationIndex, 0x9e3779b9)) >>> 0;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (!signal?.aborted) return;
  const error = new Error('Retirement risk analysis was cancelled.');
  error.name = 'AbortError';
  throw error;
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
