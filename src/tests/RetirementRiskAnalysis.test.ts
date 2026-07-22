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
import { RothConversionType, type RetirementScenario } from '../models/RetirementTypes';
import { percentile, runRetirementRiskAnalysis } from '../services/RetirementRiskAnalysisService';
import { selectStateTaxConfiguration, selectTaxConfiguration } from '../services/TaxEngine';

describe('retirement risk analysis', () => {
  it('calculates linearly interpolated percentiles', () => {
    expect(percentile([0, 10, 20, 30, 40], 0.1)).toBe(4);
    expect(percentile([0, 10, 20, 30, 40], 0.5)).toBe(20);
    expect(percentile([0, 10, 20, 30, 40], 0.9)).toBe(36);
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
      federalTaxConfig: selectTaxConfiguration(DEFAULT_TAX_CONFIG.federal, DEFAULT_INPUTS.filingStatus),
      stateTaxConfig: selectStateTaxConfiguration(
        DEFAULT_TAX_CONFIG.state,
        DEFAULT_INPUTS.residenceState,
        DEFAULT_INPUTS.filingStatus
      ),
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
      federalTaxConfig: selectTaxConfiguration(DEFAULT_TAX_CONFIG.federal, DEFAULT_INPUTS.filingStatus),
      stateTaxConfig: selectStateTaxConfiguration(
        DEFAULT_TAX_CONFIG.state,
        DEFAULT_INPUTS.residenceState,
        DEFAULT_INPUTS.filingStatus
      ),
      irmaaConfigurations: IRMAA_CONFIGURATIONS
    });

    expect(result.scenarios).toHaveLength(DEFAULT_RETIREMENT_SCENARIOS.length);
  });
});
