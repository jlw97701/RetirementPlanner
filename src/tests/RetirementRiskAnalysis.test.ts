import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ASSET_ALLOCATION,
  DEFAULT_COLA_SETTINGS,
  DEFAULT_ECONOMIC_SCENARIO_SETTINGS,
  DEFAULT_INPUTS,
  DEFAULT_MONTHLY_SS,
  DEFAULT_RETIREMENT_SCENARIOS,
  DEFAULT_TAX_CONFIG
} from '../data/defaults';
import { IRMAA_CONFIGURATIONS } from '../data/irmaaTables';
import { HISTORICAL_ECONOMIC_DATA } from '../data/historicalEconomicData';
import { calculateDeterministicMarketReturns } from '../data/deterministicMarketProfiles';
import { RothConversionType, type RetirementScenario } from '../models/RetirementTypes';
import { EconomicScenarioMethod } from '../services/EconomicScenarioEngine';
import {
  percentile,
  resolveRiskMarketAssumption,
  runRetirementRiskAnalysis
} from '../services/RetirementRiskAnalysisService';

describe('retirement risk analysis', () => {
  it('calculates linearly interpolated percentiles', () => {
    expect(percentile([0, 10, 20, 30, 40], 0.1)).toBe(4);
    expect(percentile([0, 10, 20, 30, 40], 0.5)).toBe(20);
    expect(percentile([0, 10, 20, 30, 40], 0.9)).toBe(36);
  });

  it('uses a deterministic preset as the target average portfolio return', () => {
    const resolved = resolveRiskMarketAssumption(DEFAULT_ECONOMIC_SCENARIO_SETTINGS, DEFAULT_ASSET_ALLOCATION);
    const expectedTarget = calculateDeterministicMarketReturns(
      HISTORICAL_ECONOMIC_DATA,
      DEFAULT_ASSET_ALLOCATION,
      DEFAULT_ECONOMIC_SCENARIO_SETTINGS.deterministic.rollingPeriod
    )[DEFAULT_ECONOMIC_SCENARIO_SETTINGS.deterministic.profile as 'below-average'];
    const weightedResolvedMean =
      DEFAULT_ASSET_ALLOCATION.domesticStocks * resolved.assumptions.domesticStockReturn.mean +
      DEFAULT_ASSET_ALLOCATION.internationalStocks * resolved.assumptions.internationalStockReturn.mean +
      DEFAULT_ASSET_ALLOCATION.bonds * resolved.assumptions.bondReturn.mean +
      DEFAULT_ASSET_ALLOCATION.cash * resolved.assumptions.cashReturn.mean +
      DEFAULT_ASSET_ALLOCATION.other * resolved.assumptions.otherReturn.mean;

    expect(resolved.label).toContain('Below Average');
    expect(resolved.targetPortfolioReturn).toBeCloseTo(expectedTarget, 12);
    expect(weightedResolvedMean).toBeCloseTo(expectedTarget, 12);
    expect(resolved.assumptions.domesticStockReturn.standardDeviation).toBe(
      DEFAULT_ECONOMIC_SCENARIO_SETTINGS.monteCarlo.assumptions.domesticStockReturn.standardDeviation
    );
    expect(resolved.assumptions.correlationMatrix).toBe(
      DEFAULT_ECONOMIC_SCENARIO_SETTINGS.monteCarlo.assumptions.correlationMatrix
    );
  });

  it('uses Custom Market returns as the simulated asset-class averages', () => {
    const settings = {
      ...DEFAULT_ECONOMIC_SCENARIO_SETTINGS,
      deterministic: {
        ...DEFAULT_ECONOMIC_SCENARIO_SETTINGS.deterministic,
        profile: 'custom-market' as const,
        domesticStockReturn: 0.11,
        internationalStockReturn: 0.08,
        bondReturn: 0.04,
        cashReturn: 0.02,
        otherReturn: 0.07
      }
    };
    const resolved = resolveRiskMarketAssumption(settings, DEFAULT_ASSET_ALLOCATION);

    expect(resolved.label).toBe('Custom Market');
    expect(resolved.assumptions.domesticStockReturn.mean).toBe(0.11);
    expect(resolved.assumptions.internationalStockReturn.mean).toBe(0.08);
    expect(resolved.assumptions.bondReturn.mean).toBe(0.04);
    expect(resolved.assumptions.cashReturn.mean).toBe(0.02);
    expect(resolved.assumptions.otherReturn.mean).toBe(0.07);
  });

  it('changes risk outcomes when the deterministic Market Assumption changes', async () => {
    const retirementScenarios: RetirementScenario[] = [
      { id: 'no-spending', claimAge: 70, rothConvType: RothConversionType.None }
    ];
    const baseParameters = {
      inputs: {
        ...DEFAULT_INPUTS,
        startAge: 62,
        endAge: 65,
        horizonAge: 64,
        annualSpend: 0
      },
      ssIncome: DEFAULT_MONTHLY_SS,
      colaSettings: DEFAULT_COLA_SETTINGS,
      assetAllocation: DEFAULT_ASSET_ALLOCATION,
      retirementScenarios,
      federalTaxConfigurations: DEFAULT_TAX_CONFIG.federal,
      stateTaxConfigurations: DEFAULT_TAX_CONFIG.state,
      irmaaConfigurations: IRMAA_CONFIGURATIONS
    };
    const belowAverage = await runRetirementRiskAnalysis({
      ...baseParameters,
      economicScenarioSettings: {
        ...DEFAULT_ECONOMIC_SCENARIO_SETTINGS,
        method: EconomicScenarioMethod.DETERMINISTIC,
        deterministic: { ...DEFAULT_ECONOMIC_SCENARIO_SETTINGS.deterministic, profile: 'below-average' },
        monteCarlo: { ...DEFAULT_ECONOMIC_SCENARIO_SETTINGS.monteCarlo, simulations: 4, seed: 24680 }
      }
    });
    const aboveAverage = await runRetirementRiskAnalysis({
      ...baseParameters,
      economicScenarioSettings: {
        ...DEFAULT_ECONOMIC_SCENARIO_SETTINGS,
        method: EconomicScenarioMethod.DETERMINISTIC,
        deterministic: { ...DEFAULT_ECONOMIC_SCENARIO_SETTINGS.deterministic, profile: 'above-average' },
        monteCarlo: { ...DEFAULT_ECONOMIC_SCENARIO_SETTINGS.monteCarlo, simulations: 4, seed: 24680 }
      }
    });

    expect(aboveAverage.targetPortfolioReturn).toBeGreaterThan(belowAverage.targetPortfolioReturn);
    expect(aboveAverage.scenarios[0].endingPortfolioP50).toBeGreaterThan(
      belowAverage.scenarios[0].endingPortfolioP50
    );
  });

  it('is reproducible and applies identical economic paths to every strategy', async () => {
    const equivalentStrategies: RetirementScenario[] = [
      { id: 'equivalent-a', claimAge: 62, rothConvType: RothConversionType.None },
      { id: 'equivalent-b', claimAge: 62, rothConvType: RothConversionType.None }
    ];
    const parameters = {
      inputs: {
        ...DEFAULT_INPUTS,
        startAge: 62,
        endAge: 65,
        horizonAge: 64,
        annualSpend: 40_000
      },
      ssIncome: DEFAULT_MONTHLY_SS,
      colaSettings: DEFAULT_COLA_SETTINGS,
      assetAllocation: DEFAULT_ASSET_ALLOCATION,
      retirementScenarios: equivalentStrategies,
      economicScenarioSettings: {
        ...DEFAULT_ECONOMIC_SCENARIO_SETTINGS,
        monteCarlo: {
          ...DEFAULT_ECONOMIC_SCENARIO_SETTINGS.monteCarlo,
          simulations: 12,
          seed: 24680
        }
      },
      federalTaxConfigurations: DEFAULT_TAX_CONFIG.federal,
      stateTaxConfigurations: DEFAULT_TAX_CONFIG.state,
      irmaaConfigurations: IRMAA_CONFIGURATIONS
    };

    const first = await runRetirementRiskAnalysis(parameters);
    const second = await runRetirementRiskAnalysis(parameters);

    expect(second).toEqual(first);
    expect(first.simulations).toBe(12);
    expect(first.scenarios).toHaveLength(2);
    expect(first.scenarios[0].portfolioPercentiles).toEqual(first.scenarios[1].portfolioPercentiles);
    expect(first.scenarios[0].horizonFullyFundedRate).toBe(first.scenarios[1].horizonFullyFundedRate);
    expect(first.scenarios[0].fullyFundedRate).toBe(first.scenarios[1].fullyFundedRate);

    for (const scenario of first.scenarios) {
      expect(scenario.horizonFullyFundedRate).toBeGreaterThanOrEqual(scenario.fullyFundedRate);
      expect(scenario.fullyFundedRate + scenario.depletionRisk).toBeCloseTo(1, 10);
      expect(scenario.medianTotalUnfundedSpending).toBeGreaterThanOrEqual(0);
      if (scenario.depletionRisk === 0) {
        expect(scenario.medianFirstShortfallAge).toBeNull();
        expect(scenario.medianTotalUnfundedSpending).toBe(0);
      } else {
        expect(scenario.medianFirstShortfallAge).toBeGreaterThanOrEqual(parameters.inputs.startAge);
        expect(scenario.medianFirstShortfallAge).toBeLessThanOrEqual(parameters.inputs.endAge);
      }
      expect(scenario.endingPortfolioP10).toBeLessThanOrEqual(scenario.endingPortfolioP50);
      expect(scenario.endingPortfolioP50).toBeLessThanOrEqual(scenario.endingPortfolioP90);
    }
  });

  it('evaluates the complete default strategy set against a shared path', async () => {
    const result = await runRetirementRiskAnalysis({
      inputs: DEFAULT_INPUTS,
      ssIncome: DEFAULT_MONTHLY_SS,
      colaSettings: DEFAULT_COLA_SETTINGS,
      assetAllocation: DEFAULT_ASSET_ALLOCATION,
      retirementScenarios: DEFAULT_RETIREMENT_SCENARIOS,
      economicScenarioSettings: {
        ...DEFAULT_ECONOMIC_SCENARIO_SETTINGS,
        monteCarlo: { ...DEFAULT_ECONOMIC_SCENARIO_SETTINGS.monteCarlo, simulations: 1 }
      },
      federalTaxConfigurations: DEFAULT_TAX_CONFIG.federal,
      stateTaxConfigurations: DEFAULT_TAX_CONFIG.state,
      irmaaConfigurations: IRMAA_CONFIGURATIONS
    });

    expect(result.scenarios).toHaveLength(DEFAULT_RETIREMENT_SCENARIOS.length);
  });
});
