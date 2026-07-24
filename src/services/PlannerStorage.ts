import { EconomicScenarioMethod } from './EconomicScenarioEngine';

import {
  ColaStrategyType,
  MedicareModelType,
  RothConversionType
} from '../models/RetirementTypes';
import {
  NO_STATE_TAX_INFLATION_INDEXING,
  type StateTaxConfig,
  type TaxConfigurationSet
} from '../models/TaxTypes';
import { STATE_OPTIONS } from '../data/stateTax2026';
import type { EconomicScenarioSettings } from '../models/EconomicScenarioSettings';
import type {
  RothConversionIrmaaGuardrail,
  RothConversionOptimizerSettings
} from '../models/RothConversionOptimizerTypes';

import type { IrmaaConfiguration } from '../data/irmaaTables';

import {
  ASSET_ALLOCATION_PROFILES,
  CUSTOM_ALLOCATION_ID,
  type AssetAllocationPreferences
} from '../data/assetAllocationProfiles';

import type {
  AssetAllocation,
  PlannerInputs,
  SSColaSettings,
  SSMonthlyIncome,
  RetirementScenario
} from '../models/RetirementTypes';

const INPUTS_KEY = 'retirement-planner-inputs-v2',
  INCOME_KEY = 'retirement-planner-income',
  COLA_KEY = 'retirement-planner-cola',
  ASSET_ALLOCATION_KEY = 'retirement-planner-asset-allocation',
  ASSET_ALLOCATION_PREFERENCES_KEY = 'retirement-planner-asset-allocation-preferences',
  ECONOMIC_SCENARIO_SETTINGS_KEY = 'retirement-planner-economic-scenario-settings',
  ROTH_CONVERSION_OPTIMIZER_SETTINGS_KEY = 'retirement-planner-roth-conversion-optimizer-settings',
  APPLIED_ROTH_CONVERSION_SCENARIOS_KEY = 'retirement-planner-applied-roth-conversion-scenarios-v2',
  SCENARIO_KEY = 'retirement-planner-scenarios-v2',
  TAX_CONFIG_KEY = 'retirement-planner-tax-config',
  IRMAA_CONFIGURATIONS_KEY = 'retirement-planner-irmaa-configurations';

export function loadPlannerInputs(defaults: PlannerInputs): PlannerInputs {
  //console.log('loadPlannerInputs: defaults = ', defaults);
  try {
    const stored = localStorage.getItem(INPUTS_KEY);

    if (!stored) {
      return defaults;
    }

    const parsed = JSON.parse(stored) as Partial<PlannerInputs>;

    const inputs: PlannerInputs = {
      ...defaults,
      ...parsed
    };

    if (!Number.isInteger(inputs.ssEstimateYear) || inputs.ssEstimateYear < 1900 || inputs.ssEstimateYear > 2200) {
      inputs.ssEstimateYear = defaults.ssEstimateYear;
    }

    if (
      inputs.medicareModel !== MedicareModelType.SimpleDeterministic &&
      inputs.medicareModel !== MedicareModelType.Custom
    ) {
      inputs.medicareModel = defaults.medicareModel;
    }

    if (
      !['single', 'marriedFilingJointly', 'marriedFilingSeparately', 'headOfHousehold'].includes(
        inputs.filingStatus
      )
    ) {
      inputs.filingStatus = defaults.filingStatus;
    }

    if (!STATE_OPTIONS.some((state) => state.value === inputs.residenceState)) {
      inputs.residenceState = defaults.residenceState;
    }

    return inputs;
  } catch {
    return defaults;
  }
}

export function savePlannerInputs(value: PlannerInputs): void {
  //console.log('savePlannerInputs: value = ', value);
  localStorage.setItem(INPUTS_KEY, JSON.stringify(value));
}

export function loadSocialSecurityIncome(defaults: SSMonthlyIncome[]): SSMonthlyIncome[] {
  //console.log('loadSocialSecurityIncome: defaults = ', defaults);
  try {
    const stored = localStorage.getItem(INCOME_KEY);

    if (!stored) {
      return defaults;
    }

    const parsed: unknown = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as SSMonthlyIncome[]) : defaults;
  } catch {
    return defaults;
  }
}

export function saveSocialSecurityIncome(value: SSMonthlyIncome[]): void {
  //console.log('saveSocialSecurityIncome: value = ', value);
  localStorage.setItem(INCOME_KEY, JSON.stringify(value));
}

export function loadSSCOLASettings(defaults: SSColaSettings): SSColaSettings {
  //console.log('loadSSCOLASettings: defaults = ', defaults);
  try {
    const stored = localStorage.getItem(COLA_KEY);

    if (!stored) {
      return defaults;
    }

    const parsed = JSON.parse(stored) as Partial<SSColaSettings>;

    const cola: SSColaSettings = {
      ...defaults,
      ...parsed
    };

    if (
      ![
        ColaStrategyType.FixedRate,
        ColaStrategyType.LastRate,
        ColaStrategyType.InflationRate,
        ColaStrategyType.HistoricalAverage
      ].includes(cola.strategy)
    ) {
      cola.strategy = defaults.strategy;
    }

    return cola;
  } catch {
    return defaults;
  }
}

export function saveSSCOLASettings(value: SSColaSettings): void {
  //console.log('saveSSCOLASettings: value = ', value);
  localStorage.setItem(COLA_KEY, JSON.stringify(value));
}

export function loadAssetAllocation(defaults: AssetAllocation): AssetAllocation {
  //onsole.log('loadAssetAllocation: defaults = ', defaults);
  try {
    const stored = localStorage.getItem(ASSET_ALLOCATION_KEY);

    if (!stored) {
      return defaults;
    }

    const parsed = JSON.parse(stored) as Partial<AssetAllocation> & { stocks?: unknown };
    return normalizeAssetAllocation(parsed, defaults);
  } catch {
    return defaults;
  }
}

export function saveAssetAllocation(value: AssetAllocation): void {
  //console.log('saveAssetAllocation: value = ', value);
  localStorage.setItem(ASSET_ALLOCATION_KEY, JSON.stringify(value));
}

export function loadAssetAllocationPreferences(defaults: AssetAllocationPreferences): AssetAllocationPreferences {
  try {
    const stored = localStorage.getItem(ASSET_ALLOCATION_PREFERENCES_KEY);

    if (!stored) {
      return defaults;
    }

    const parsed = JSON.parse(stored) as Partial<AssetAllocationPreferences>;
    const custom = parsed.customAllocation as
      | (Partial<AssetAllocation> & { stocks?: unknown })
      | undefined;
    const normalizedCustom = custom ? normalizeAssetAllocation(custom, defaults.customAllocation) : null;

    const validSelections = new Set<string>([
      CUSTOM_ALLOCATION_ID,
      ...ASSET_ALLOCATION_PROFILES.map((profile) => profile.id)
    ]);

    if (
      typeof parsed.selection !== 'string' ||
      !validSelections.has(parsed.selection) ||
      !normalizedCustom ||
      ![
        normalizedCustom.domesticStocks,
        normalizedCustom.internationalStocks,
        normalizedCustom.bonds,
        normalizedCustom.cash,
        normalizedCustom.other
      ].every(
        (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0
      )
    ) {
      return defaults;
    }

    return {
      selection: parsed.selection as AssetAllocationPreferences['selection'],
      customAllocation: normalizedCustom
    };
  } catch {
    return defaults;
  }
}

export function saveAssetAllocationPreferences(value: AssetAllocationPreferences): void {
  localStorage.setItem(ASSET_ALLOCATION_PREFERENCES_KEY, JSON.stringify(value));
}

export function loadEconomicScenarioSettings(defaults: EconomicScenarioSettings): EconomicScenarioSettings {
  try {
    const stored = localStorage.getItem(ECONOMIC_SCENARIO_SETTINGS_KEY);

    if (!stored) {
      return defaults;
    }

    const parsed = JSON.parse(stored) as Partial<EconomicScenarioSettings>;
    const legacyDeterministic = parsed.deterministic as
      | (Partial<EconomicScenarioSettings['deterministic']> & { stockReturn?: number })
      | undefined;
    const legacyStockAssumption = (
      parsed.monteCarlo?.assumptions as
        | (Partial<EconomicScenarioSettings['monteCarlo']['assumptions']> & {
            stockReturn?: EconomicScenarioSettings['monteCarlo']['assumptions']['domesticStockReturn'];
          })
        | undefined
    )?.stockReturn;
    const storedCorrelationMatrix = parsed.monteCarlo?.assumptions?.correlationMatrix;
    const validMethods = new Set(Object.values(EconomicScenarioMethod));
    const method = validMethods.has(parsed.method as EconomicScenarioMethod) ? parsed.method! : defaults.method;

    return {
      ...defaults,
      ...parsed,
      method,
      deterministic: {
        ...defaults.deterministic,
        ...parsed.deterministic,
        domesticStockReturn:
          parsed.deterministic?.domesticStockReturn ??
          legacyDeterministic?.stockReturn ??
          defaults.deterministic.domesticStockReturn,
        internationalStockReturn:
          parsed.deterministic?.internationalStockReturn ??
          legacyDeterministic?.stockReturn ??
          defaults.deterministic.internationalStockReturn
      },
      historicalSequence: { ...defaults.historicalSequence, ...parsed.historicalSequence },
      historicalBootstrap: { ...defaults.historicalBootstrap, ...parsed.historicalBootstrap },
      monteCarlo: {
        ...defaults.monteCarlo,
        ...parsed.monteCarlo,
        assumptions: {
          ...defaults.monteCarlo.assumptions,
          ...parsed.monteCarlo?.assumptions,
          inflation: {
            ...defaults.monteCarlo.assumptions.inflation,
            ...parsed.monteCarlo?.assumptions?.inflation
          },
          domesticStockReturn: {
            ...defaults.monteCarlo.assumptions.domesticStockReturn,
            ...legacyStockAssumption,
            ...parsed.monteCarlo?.assumptions?.domesticStockReturn
          },
          internationalStockReturn: {
            ...defaults.monteCarlo.assumptions.internationalStockReturn,
            ...legacyStockAssumption,
            ...parsed.monteCarlo?.assumptions?.internationalStockReturn
          },
          bondReturn: {
            ...defaults.monteCarlo.assumptions.bondReturn,
            ...parsed.monteCarlo?.assumptions?.bondReturn
          },
          cashReturn: {
            ...defaults.monteCarlo.assumptions.cashReturn,
            ...parsed.monteCarlo?.assumptions?.cashReturn
          },
          otherReturn: {
            ...defaults.monteCarlo.assumptions.otherReturn,
            ...parsed.monteCarlo?.assumptions?.otherReturn
          },
          correlationMatrix: isSixBySixMatrix(storedCorrelationMatrix)
            ? storedCorrelationMatrix
            : defaults.monteCarlo.assumptions.correlationMatrix
        }
      }
    };
  } catch {
    return defaults;
  }
}

function normalizeAssetAllocation(
  value: Partial<AssetAllocation> & { stocks?: unknown },
  defaults: AssetAllocation
): AssetAllocation {
  const legacyStocks =
    typeof value.stocks === 'number' && Number.isFinite(value.stocks) && value.stocks >= 0
      ? value.stocks
      : undefined;

  return {
    domesticStocks: value.domesticStocks ?? (legacyStocks === undefined ? defaults.domesticStocks : legacyStocks * 0.7),
    internationalStocks:
      value.internationalStocks ?? (legacyStocks === undefined ? defaults.internationalStocks : legacyStocks * 0.3),
    bonds: value.bonds ?? defaults.bonds,
    cash: value.cash ?? defaults.cash,
    other: value.other ?? defaults.other
  };
}

function isSixBySixMatrix(
  value: unknown
): value is EconomicScenarioSettings['monteCarlo']['assumptions']['correlationMatrix'] {
  return Array.isArray(value) && value.length === 6 && value.every((row) => Array.isArray(row) && row.length === 6);
}

export function saveEconomicScenarioSettings(value: EconomicScenarioSettings): void {
  localStorage.setItem(ECONOMIC_SCENARIO_SETTINGS_KEY, JSON.stringify(value));
}

export function loadRothConversionOptimizerSettings(
  defaults: RothConversionOptimizerSettings
): RothConversionOptimizerSettings {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(ROTH_CONVERSION_OPTIMIZER_SETTINGS_KEY) ?? 'null'
    ) as Partial<RothConversionOptimizerSettings> | null;
    const validGuardrails = new Set<RothConversionIrmaaGuardrail>([
      'avoid-increase',
      'allow-first-tier',
      'ignore'
    ]);

    if (
      !parsed ||
      !Number.isFinite(parsed.maxFederalBracketRate) ||
      parsed.maxFederalBracketRate! <= 0 ||
      !Number.isFinite(parsed.maxAnnualConversion) ||
      parsed.maxAnnualConversion! < 0 ||
      !Number.isFinite(parsed.terminalTraditionalTaxRate) ||
      parsed.terminalTraditionalTaxRate! < 0 ||
      parsed.terminalTraditionalTaxRate! > 1 ||
      !validGuardrails.has(parsed.irmaaGuardrail as RothConversionIrmaaGuardrail)
    ) {
      return defaults;
    }

    return {
      maxFederalBracketRate: parsed.maxFederalBracketRate!,
      maxAnnualConversion: parsed.maxAnnualConversion!,
      terminalTraditionalTaxRate: parsed.terminalTraditionalTaxRate!,
      irmaaGuardrail: parsed.irmaaGuardrail!
    };
  } catch {
    return defaults;
  }
}

export function saveRothConversionOptimizerSettings(value: RothConversionOptimizerSettings): void {
  localStorage.setItem(ROTH_CONVERSION_OPTIMIZER_SETTINGS_KEY, JSON.stringify(value));
}

export function loadRetirementScenarios(defaults: RetirementScenario[]): RetirementScenario[] {
  try {
    const stored = localStorage.getItem(SCENARIO_KEY);

    if (!stored) {
      return defaults;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return defaults;
    }

    return parsed as RetirementScenario[];
  } catch {
    return defaults;
  }
}

export function saveRetirementScenarios(value: RetirementScenario[]): void {
  //console.log('saveScenarios: value = ', value);
  localStorage.setItem(SCENARIO_KEY, JSON.stringify(value));
}

export function loadAppliedRothConversionScenarios(): RetirementScenario[] {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(APPLIED_ROTH_CONVERSION_SCENARIOS_KEY) ?? '[]'
    );

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((scenario): scenario is RetirementScenario => {
      if (typeof scenario !== 'object' || scenario === null) return false;

      const candidate = scenario as Partial<RetirementScenario>;
      const validClaimAge =
        candidate.claimAge === null ||
        (Number.isInteger(candidate.claimAge) &&
          candidate.claimAge! >= 62 &&
          candidate.claimAge! <= 70);
      const schedule = candidate.rothConversionSchedule;
      const validSchedule =
        typeof schedule === 'object' &&
        schedule !== null &&
        Object.entries(schedule).every(
          ([age, amount]) =>
            Number.isInteger(Number(age)) &&
            Number.isFinite(amount) &&
            amount >= 0
        );

      return (
        typeof candidate.id === 'string' &&
        validClaimAge &&
        candidate.rothConvType === RothConversionType.Optimized &&
        typeof candidate.optimizerSourceKey === 'string' &&
        validSchedule
      );
    });
  } catch {
    return [];
  }
}

export function saveAppliedRothConversionScenarios(value: readonly RetirementScenario[]): void {
  localStorage.setItem(APPLIED_ROTH_CONVERSION_SCENARIOS_KEY, JSON.stringify(value));
}

function normalizeStateTaxConfiguration(
  configuration: StateTaxConfig
): StateTaxConfig {
  return {
    ...configuration,
    inflationIndexing: {
      ...NO_STATE_TAX_INFLATION_INDEXING,
      ...(configuration.inflationIndexing ?? {})
    },
    retirementIncomeExclusions: Array.isArray(
      configuration.retirementIncomeExclusions
    )
      ? configuration.retirementIncomeExclusions.map((exclusion) => ({
          ...exclusion,
          maximumAmountInflationIndexed:
            exclusion.maximumAmountInflationIndexed === true,
          incomeLimitInflationIndexed:
            exclusion.incomeLimitInflationIndexed === true,
          phaseoutStartInflationIndexed:
            exclusion.phaseoutStartInflationIndexed === true
        }))
      : []
  };
}

export function loadTaxConfigurations(defaults: TaxConfigurationSet): TaxConfigurationSet {
  //console.log('loadTaxConfigurations: defaults = ', defaults);
  try {
    const stored = localStorage.getItem(TAX_CONFIG_KEY);

    if (!stored) {
      return defaults;
    }

    const parsed = JSON.parse(stored) as Partial<TaxConfigurationSet>;

    const federal = Array.isArray(parsed.federal)
      ? parsed.federal
      : defaults.federal;
    const state = (
      Array.isArray(parsed.state) ? parsed.state : defaults.state
    ).map(normalizeStateTaxConfiguration);

    return { federal, state };
  } catch {
    return defaults;
  }
}

export function saveTaxConfigurations(value: TaxConfigurationSet): void {
  //console.log('saveTaxConfigurations: value = ', value);
  localStorage.setItem(TAX_CONFIG_KEY, JSON.stringify(value));
}

export function loadIrmaaConfigurations(defaults: readonly IrmaaConfiguration[]): IrmaaConfiguration[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(IRMAA_CONFIGURATIONS_KEY) ?? 'null');
    if (!Array.isArray(parsed) || parsed.length === 0) return structuredClone(defaults) as IrmaaConfiguration[];

    const configurations = parsed.filter(
      (item): item is IrmaaConfiguration =>
        typeof item === 'object' &&
        item !== null &&
        Number.isInteger((item as IrmaaConfiguration).premiumYear) &&
        Array.isArray((item as IrmaaConfiguration).tiers)
    );
    return configurations.length > 0 ? configurations : (structuredClone(defaults) as IrmaaConfiguration[]);
  } catch {
    return structuredClone(defaults) as IrmaaConfiguration[];
  }
}

export function saveIrmaaConfigurations(value: readonly IrmaaConfiguration[]): void {
  localStorage.setItem(IRMAA_CONFIGURATIONS_KEY, JSON.stringify(value));
}
