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

export interface RetirementRiskBalanceOutcomes {
  /** About 90% of simulated balances are at or above this amount. */
  veryCautious: number;
  /** About 75% of simulated balances are at or above this amount. */
  cautious: number;
  /** Half of simulated balances are below and half are above this amount. */
  middle: number;
  /** About 10% of simulated balances are above this amount. */
  higher: number;
}

export interface RetirementRiskBalanceViews {
  futureDollars: RetirementRiskBalanceOutcomes;
  inflationAdjustedDollars: RetirementRiskBalanceOutcomes;
}

export interface RetirementRiskPercentilePoint extends RetirementRiskBalanceViews {
  age: number;
}

export interface RetirementRiskScenarioResult {
  scenarioId: string;
  claimAge: SSClaimAge | null;
  rothConvType: RothConversionType;
  rothConversionLabel?: string;
  horizonFullyFundedRate: number;
  fullyFundedRate: number;
  depletionRisk: number;
  medianFirstShortfallAge: number | null;
  medianTotalUnfundedSpending: number;
  endingBalances: RetirementRiskBalanceViews;
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
  federalTaxConfigurations: readonly FederalTaxConfig[];
  stateTaxConfigurations: readonly StateTaxConfig[];
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
  futureDollarBalancesByAge: number[][];
  inflationAdjustedBalancesByAge: number[][];
}

function calculateWeightedReturn(
  allocation: AssetAllocation,
  returns: {
    domesticStockReturn: number;
    internationalStockReturn: number;
    bondReturn: number;
    cashReturn: number;
    otherReturn: number;
  }
): number {
  return (
    allocation.domesticStocks * returns.domesticStockReturn +
    allocation.internationalStocks * returns.internationalStockReturn +
    allocation.bonds * returns.bondReturn +
    allocation.cash * returns.cashReturn +
    allocation.other * returns.otherReturn
  );
}

function withReturnMeans(
  assumptions: MonteCarloAssumptions,
  means: {
    domesticStockReturn: number;
    internationalStockReturn: number;
    bondReturn: number;
    cashReturn: number;
    otherReturn: number;
  }
): MonteCarloAssumptions {
  return {
    ...assumptions,
    domesticStockReturn: { ...assumptions.domesticStockReturn, mean: means.domesticStockReturn },
    internationalStockReturn: {
      ...assumptions.internationalStockReturn,
      mean: means.internationalStockReturn
    },
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
    domesticStockReturn: baseAssumptions.domesticStockReturn.mean,
    internationalStockReturn: baseAssumptions.internationalStockReturn.mean,
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
      domesticStockReturn: economicScenarioSettings.deterministic.domesticStockReturn,
      internationalStockReturn: economicScenarioSettings.deterministic.internationalStockReturn,
      bondReturn: economicScenarioSettings.deterministic.bondReturn,
      cashReturn: economicScenarioSettings.deterministic.cashReturn,
      otherReturn: economicScenarioSettings.deterministic.otherReturn
    };
    return {
      label: 'Custom Return',
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
    domesticStockReturn: baseMeans.domesticStockReturn + returnShift,
    internationalStockReturn: baseMeans.internationalStockReturn + returnShift,
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
    federalTaxConfigurations,
    stateTaxConfigurations,
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
    futureDollarBalancesByAge: Array.from({ length: period.yearCount }, () => []),
    inflationAdjustedBalancesByAge: Array.from({ length: period.yearCount }, () => [])
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
          federalTaxConfigurations,
          stateTaxConfigurations,
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
        accumulator.futureDollarBalancesByAge[rowIndex].push(row.endPortfolio);
        accumulator.inflationAdjustedBalancesByAge[rowIndex].push(row.endPortfolioCurrentDollars);
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
      const portfolioPercentiles = accumulator.futureDollarBalancesByAge.map((futureDollarBalances, index) => ({
        age: inputs.startAge + index,
        futureDollars: summarizeBalanceOutcomes(futureDollarBalances),
        inflationAdjustedDollars: summarizeBalanceOutcomes(
          accumulator.inflationAdjustedBalancesByAge[index]
        )
      }));
      const ending = portfolioPercentiles[portfolioPercentiles.length - 1] ?? createEmptyBalanceViews();

      return {
        scenarioId: accumulator.scenario.id,
        claimAge: accumulator.scenario.claimAge,
        rothConvType: accumulator.scenario.rothConvType,
        rothConversionLabel: accumulator.scenario.rothConversionLabel,
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
        endingBalances: {
          futureDollars: ending.futureDollars,
          inflationAdjustedDollars: ending.inflationAdjustedDollars
        },
        portfolioPercentiles
      };
    })
  };
}

function summarizeBalanceOutcomes(values: readonly number[]): RetirementRiskBalanceOutcomes {
  return {
    veryCautious: percentile(values, 0.1),
    cautious: percentile(values, 0.25),
    middle: percentile(values, 0.5),
    higher: percentile(values, 0.9)
  };
}

function createEmptyBalanceViews(): RetirementRiskPercentilePoint {
  const empty = summarizeBalanceOutcomes([]);

  return {
    age: 0,
    futureDollars: empty,
    inflationAdjustedDollars: empty
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
