import { describe, expect, test } from 'vitest';

import {
  ACTUAL_BENEFIT_SCENARIOS,
  DEFAULT_INPUTS,
  DEFAULT_RETIREMENT_SCENARIOS,
  DEFAULT_TAX_CONFIG
} from '../data/defaults';
import { IRMAA_CONFIGURATIONS } from '../data/irmaaTables';
import {
  ColaStrategyType,
  RothConversionType,
  type AssetAllocation,
  type PlannerInputs,
  type RetirementScenario,
  type SSColaSettings,
  type SSMonthlyIncome
} from '../models/RetirementTypes';
import {
  EconomicScenarioMethod,
  type EconomicScenario
} from '../services/EconomicScenarioEngine';
import { calculateRetirementProjection } from '../services/RetirementEngine';
import {
  createAppliedRothConversionScenario,
  optimizeRothConversions
} from '../services/RothConversionOptimizer';

const ssIncome: SSMonthlyIncome[] = [
  { age: 62, amount: 0 },
  { age: 63, amount: 0 },
  { age: 64, amount: 0 },
  { age: 65, amount: 0 },
  { age: 66, amount: 0 },
  { age: 67, amount: 0 },
  { age: 68, amount: 0 },
  { age: 69, amount: 0 },
  { age: 70, amount: 0 }
];

const colaSettings: SSColaSettings = {
  strategy: ColaStrategyType.FixedRate,
  fixedRate: 0,
  averageRate: 0,
  lastRate: 0
};

const assetAllocation: AssetAllocation = {
  domesticStocks: 0,
  internationalStocks: 0,
  bonds: 0,
  cash: 1,
  other: 0
};

function createEconomicScenario(startYear: number, years: number): EconomicScenario {
  return {
    id: 'optimizer-zero-return',
    method: EconomicScenarioMethod.DETERMINISTIC,
    years: Array.from({ length: years }, (_, index) => ({
      year: startYear + index,
      inflation: 0,
      socialSecurityCola: 0,
      domesticStockReturn: 0,
      internationalStockReturn: 0,
      bondReturn: 0,
      cashReturn: 0,
      otherReturn: 0
    }))
  };
}

function createInputs(overrides: Partial<PlannerInputs> = {}): PlannerInputs {
  return {
    ...DEFAULT_INPUTS,
    birthDate: '1970-01-01',
    filingStatus: 'single',
    residenceState: 'AK',
    startAge: 62,
    endAge: 66,
    horizonAge: 65,
    stopConvAge: 65,
    tradIra: 300_000,
    rothIra: 0,
    taxableAcct: 100_000,
    annualSpend: 0,
    inflation: 0,
    annualRothConversion: 50_000,
    ...overrides
  };
}

const federalTaxConfig = DEFAULT_TAX_CONFIG.federal.find(
  (configuration) => configuration.filingStatus === 'single'
)!;
const stateTaxConfig = DEFAULT_TAX_CONFIG.state.find(
  (configuration) =>
    configuration.stateCode === 'AK' && configuration.filingStatus === 'single'
)!;

describe('Roth conversion modes', () => {
  test('creates only No Conversion and Fixed scenarios by default', () => {
    expect(DEFAULT_RETIREMENT_SCENARIOS).toHaveLength(18);
    expect(
      new Set(DEFAULT_RETIREMENT_SCENARIOS.map((scenario) => scenario.rothConvType))
    ).toEqual(new Set([RothConversionType.None, RothConversionType.Fixed]));
    expect(ACTUAL_BENEFIT_SCENARIOS).toHaveLength(2);
    expect(ACTUAL_BENEFIT_SCENARIOS.map((scenario) => scenario.rothConvType)).toEqual([
      RothConversionType.None,
      RothConversionType.Fixed
    ]);
  });
});

describe('Roth conversion schedules', () => {
  test('uses an age-specific schedule before fixed conversion amounts and honors the stop age', () => {
    const inputs = createInputs({ endAge: 64, horizonAge: 64, stopConvAge: 64 });
    const scenario: RetirementScenario = {
      id: 'scheduled',
      claimAge: 70,
      rothConvType: RothConversionType.Fixed,
      rothConversionSchedule: {
        62: 7_000,
        63: 9_000,
        64: 11_000
      }
    };

    const rows = calculateRetirementProjection(
      inputs,
      ssIncome,
      colaSettings,
      assetAllocation,
      scenario,
      {
        federalTaxConfigurations: [federalTaxConfig],
        stateTaxConfigurations: [stateTaxConfig],
        economicScenario: createEconomicScenario(2032, 3),
        irmaaConfigurations: IRMAA_CONFIGURATIONS
      }
    );

    expect(rows[0].rothConv).toBeCloseTo(7_000, 2);
    expect(rows[1].rothConv).toBeCloseTo(9_000, 2);
    expect(rows[2].rothConv).toBe(0);
  });
});

describe('optimizeRothConversions', () => {
  test('keeps recommended schedules within the annual cap and selected tax bracket', () => {
    const inputs = createInputs();
    const result = optimizeRothConversions({
      inputs,
      ssIncome,
      colaSettings,
      assetAllocation,
      retirementScenario: {
        id: 'selected',
        claimAge: 70,
        rothConvType: RothConversionType.None
      },
      federalTaxConfigurations: [federalTaxConfig],
      stateTaxConfigurations: [stateTaxConfig],
      economicScenario: createEconomicScenario(2032, 5),
      irmaaConfigurations: IRMAA_CONFIGURATIONS,
      settings: {
        maxFederalBracketRate: 0.12,
        maxAnnualConversion: 20_000,
        terminalTraditionalTaxRate: 0.2,
        irmaaGuardrail: 'avoid-increase'
      }
    });

    const bracketCandidate = result.candidates.find(
      (candidate) =>
        candidate.kind === 'bracket-target' && candidate.targetFederalBracketRate === 0.12
    );
    const fixedReference = result.candidates.find(
      (candidate) => candidate.kind === 'fixed'
    );

    expect(bracketCandidate).toBeDefined();
    expect(bracketCandidate!.totalConversion).toBeGreaterThan(0);
    expect(bracketCandidate!.schedule.every((row) => row.age < inputs.stopConvAge)).toBe(true);
    expect(
      bracketCandidate!.schedule.every((row) => row.actualConversion <= 20_000.01)
    ).toBe(true);
    expect(
      bracketCandidate!.schedule.every((row) => row.federalTaxableIncome <= 50_400.01)
    ).toBe(true);
    expect(result.recommended.withinSelectedLimits).toBe(true);
    expect(fixedReference?.withinSelectedLimits).toBe(false);
    expect(
      fixedReference?.schedule.every(
        (row) => row.requestedConversion <= 20_000.01
      )
    ).toBe(false);

    expect(() =>
      createAppliedRothConversionScenario(
        inputs,
        { ...result, recommended: fixedReference! },
        'fixed-source-key'
      )
    ).toThrow(/Only a bracket-target recommendation/);

    const appliedScenario = createAppliedRothConversionScenario(
      inputs,
      result,
      'test-source-key'
    );
    const appliedRows = calculateRetirementProjection(
      inputs,
      ssIncome,
      colaSettings,
      assetAllocation,
      appliedScenario,
      {
        federalTaxConfigurations: [federalTaxConfig],
        stateTaxConfigurations: [stateTaxConfig],
        economicScenario: createEconomicScenario(2032, 5),
        irmaaConfigurations: IRMAA_CONFIGURATIONS
      }
    );

    expect(appliedScenario.id).toBe('applied-optimized-70');
    expect(appliedScenario.rothConvType).toBe(RothConversionType.Optimized);
    expect(appliedScenario.rothConversionLabel).toBe('Optimized');
    expect(appliedScenario.optimizerSourceKey).toBe('test-source-key');
    expect(appliedRows.map((row) => row.rothConv)).toEqual(
      result.recommended.rows.map((row) => row.rothConv)
    );
    expect(appliedRows.at(-1)?.endPortfolio).toBeCloseTo(
      result.recommended.rows.at(-1)?.endPortfolio ?? 0,
      2
    );
  });

  test('includes incremental IRMAA in after-tax candidate comparisons without double counting the baseline', () => {
    const inputs = createInputs({
      startAge: 65,
      endAge: 69,
      horizonAge: 67,
      stopConvAge: 67,
      tradIra: 2_000_000,
      annualRothConversion: 0
    });
    const terminalTraditionalTaxRate = 0.2;
    const result = optimizeRothConversions({
      inputs,
      ssIncome,
      colaSettings,
      assetAllocation,
      retirementScenario: {
        id: 'selected-irmaa',
        claimAge: 70,
        rothConvType: RothConversionType.None
      },
      federalTaxConfigurations: [federalTaxConfig],
      stateTaxConfigurations: [stateTaxConfig],
      economicScenario: createEconomicScenario(2035, 5),
      irmaaConfigurations: IRMAA_CONFIGURATIONS,
      settings: {
        maxFederalBracketRate: 0.35,
        maxAnnualConversion: 300_000,
        terminalTraditionalTaxRate,
        irmaaGuardrail: 'ignore'
      }
    });
    const candidate = result.candidates.find(
      (item) =>
        item.kind === 'bracket-target' &&
        item.totalIrmaaCurrentDollars >
          result.baseline.totalIrmaaCurrentDollars + 0.01
    );

    expect(candidate).toBeDefined();

    const endingRow = candidate!.rows.at(-1)!;
    const rawAfterTaxValue =
      (endingRow.endRothIra +
        endingRow.endTaxableAcct +
        endingRow.endTradlIra * (1 - terminalTraditionalTaxRate)) /
      endingRow.inflationIndex;
    const incrementalIrmaa =
      candidate!.totalIrmaaCurrentDollars -
      result.baseline.totalIrmaaCurrentDollars;

    expect(candidate!.afterTaxEndPortfolioCurrentDollars).toBeCloseTo(
      rawAfterTaxValue - incrementalIrmaa,
      2
    );
  });
});
