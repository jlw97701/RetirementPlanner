import { COLA_HISTORY } from '../data/colaHistory';
import {
  calculateDeterministicMarketReturns,
  DETERMINISTIC_MARKET_PROFILES
} from '../data/deterministicMarketProfiles';
import { HISTORICAL_ECONOMIC_DATA } from '../data/historicalEconomicData';
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
import {
  EconomicScenarioEngine,
  EconomicScenarioMethod,
  type MonteCarloAssumptions
} from './EconomicScenarioEngine';
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
  medianFirstShortfallAge: number | null;
  medianTotalUnfundedSpending: number;
  endingPortfolioP10: number;
  endingPortfolioP50: number;
  endingPortfolioP90: number;
  portfolioPercentiles: RetirementRiskPercentilePoint[];
}

export interface RetirementRiskAnalysisResult {
  simulations: number;
  baseSeed: number;
  marketAssumptionLabel: string;
  targetPortfolioReturn: number;
  scenarios: RetirementRiskScenarioResult[];
}

export interface ResolvedRiskMarketAssumption {
  label: string;
  targetPortfolioReturn: number;
  assumptions: MonteCarloAssumptions;
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
  firstShortfallAges: number[];
  totalUnfundedSpending: number[];
  portfolioBalancesByAge: number[][];
}

function calculateWeightedReturn(
  allocation: AssetAllocation,
  returns: { stockReturn: number; bondReturn: number; cashReturn: number; otherReturn: number }
): number {
  return (
    allocation.stocks * returns.stockReturn +
    allocation.bonds * returns.bondReturn +
    allocation.cash * returns.cashReturn +
    allocation.other * returns.otherReturn
  );
}

function withReturnMeans(
  assumptions: MonteCarloAssumptions,
  means: { stockReturn: number; bondReturn: number; cashReturn: number; otherReturn: number }
): MonteCarloAssumptions {
  return {
    ...assumptions,
    stockReturn: { ...assumptions.stockReturn, mean: means.stockReturn },
    bondReturn: { ...assumptions.bondReturn, mean: means.bondReturn },
    cashReturn: { ...assumptions.cashReturn, mean: means.cashReturn },
    otherReturn: { ...assumptions.otherReturn, mean: means.otherReturn }
  };
}

export function resolveRiskMarketAssumption(
  economicScenarioSettings: EconomicScenarioSettings,
  assetAllocation: AssetAllocation
): ResolvedRiskMarketAssumption {
  const baseAssumptions = economicScenarioSettings.monteCarlo.assumptions;
  const baseMeans = {
    stockReturn: baseAssumptions.stockReturn.mean,
    bondReturn: baseAssumptions.bondReturn.mean,
    cashReturn: baseAssumptions.cashReturn.mean,
    otherReturn: baseAssumptions.otherReturn.mean
  };

  if (economicScenarioSettings.method !== EconomicScenarioMethod.DETERMINISTIC) {
    return {
      label: 'Single Simulated Path Averages',
      targetPortfolioReturn: calculateWeightedReturn(assetAllocation, baseMeans),
      assumptions: baseAssumptions
    };
  }

  const profileId = economicScenarioSettings.deterministic.profile;
  if (profileId === 'custom-market') {
    const customMeans = {
      stockReturn: economicScenarioSettings.deterministic.stockReturn,
      bondReturn: economicScenarioSettings.deterministic.bondReturn,
      cashReturn: economicScenarioSettings.deterministic.cashReturn,
      otherReturn: economicScenarioSettings.deterministic.otherReturn
    };
    return {
      label: 'Custom Market',
      targetPortfolioReturn: calculateWeightedReturn(assetAllocation, customMeans),
      assumptions: withReturnMeans(baseAssumptions, customMeans)
    };
  }

  const targetPortfolioReturn = calculateDeterministicMarketReturns(
    HISTORICAL_ECONOMIC_DATA,
    assetAllocation,
    economicScenarioSettings.deterministic.rollingPeriod
  )[profileId];
  const basePortfolioReturn = calculateWeightedReturn(assetAllocation, baseMeans);
  const returnShift = targetPortfolioReturn - basePortfolioReturn;
  const shiftedMeans = {
    stockReturn: baseMeans.stockReturn + returnShift,
    bondReturn: baseMeans.bondReturn + returnShift,
    cashReturn: baseMeans.cashReturn + returnShift,
    otherReturn: baseMeans.otherReturn + returnShift
  };
  const profileLabel =
    DETERMINISTIC_MARKET_PROFILES.find((profile) => profile.id === profileId)?.label ?? profileId;

  return {
    label: `${profileLabel} (${economicScenarioSettings.deterministic.rollingPeriod}-Year Rolling Target)`,
    targetPortfolioReturn,
    assumptions: withReturnMeans(baseAssumptions, shiftedMeans)
  };
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
  const marketAssumption = resolveRiskMarketAssumption(economicScenarioSettings, assetAllocation);
  const engine = new EconomicScenarioEngine();
  const accumulators: ScenarioAccumulator[] = retirementScenarios.map((scenario) => ({
    scenario,
    horizonFullyFundedCount: 0,
    fullyFundedCount: 0,
    depletionCount: 0,
    firstShortfallAges: [],
    totalUnfundedSpending: [],
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
      assumptions: marketAssumption.assumptions,
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
      const shortfallRows = rows.filter((row) => row.unfundedNeed > UNFUNDED_NEED_TOLERANCE);
      const hasUnfundedSpending = shortfallRows.length > 0;

      if (!hasUnfundedSpendingThroughHorizon) accumulator.horizonFullyFundedCount += 1;
      if (hasUnfundedSpending) {
        accumulator.depletionCount += 1;
        accumulator.firstShortfallAges.push(shortfallRows[0].age);
        accumulator.totalUnfundedSpending.push(
          shortfallRows.reduce((sum, row) => sum + row.unfundedNeed / row.inflationIndex, 0)
        );
      } else {
        accumulator.fullyFundedCount += 1;
      }

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
    marketAssumptionLabel: marketAssumption.label,
    targetPortfolioReturn: marketAssumption.targetPortfolioReturn,
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
        medianFirstShortfallAge:
          accumulator.firstShortfallAges.length > 0
            ? Math.round(percentile(accumulator.firstShortfallAges, 0.5))
            : null,
        medianTotalUnfundedSpending:
          accumulator.totalUnfundedSpending.length > 0
            ? percentile(accumulator.totalUnfundedSpending, 0.5)
            : 0,
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
