import { EconomicScenarioMethod } from './EconomicScenarioEngine';

import { MedicareModelType } from '../models/RetirementTypes';
import type { TaxConfigurationSet } from '../models/TaxTypes';
import type { EconomicScenarioSettings } from '../models/EconomicScenarioSettings';

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

const INPUTS_KEY = 'retirement-planner-inputs',
  INCOME_KEY = 'retirement-planner-income',
  COLA_KEY = 'retirement-planner-cola',
  ASSET_ALLOCATION_KEY = 'retirement-planner-asset-allocation',
  ASSET_ALLOCATION_PREFERENCES_KEY = 'retirement-planner-asset-allocation-preferences',
  ECONOMIC_SCENARIO_SETTINGS_KEY = 'retirement-planner-economic-scenario-settings',
  SCENARIO_KEY = 'retirement-planner-scenarios',
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

    const parsed = JSON.parse(stored) as Partial<AssetAllocation>;

    const assets: AssetAllocation = {
      ...defaults,
      ...parsed
    };

    return assets;
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
    const custom = parsed.customAllocation;

    const validSelections = new Set<string>([
      CUSTOM_ALLOCATION_ID,
      ...ASSET_ALLOCATION_PROFILES.map((profile) => profile.id)
    ]);

    if (
      typeof parsed.selection !== 'string' ||
      !validSelections.has(parsed.selection) ||
      !custom ||
      ![custom.stocks, custom.bonds, custom.cash, custom.other].every(
        (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0
      )
    ) {
      return defaults;
    }

    return {
      selection: parsed.selection as AssetAllocationPreferences['selection'],
      customAllocation: custom
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
    const validMethods = new Set(Object.values(EconomicScenarioMethod));
    const method = validMethods.has(parsed.method as EconomicScenarioMethod) ? parsed.method! : defaults.method;

    return {
      ...defaults,
      ...parsed,
      method,
      deterministic: { ...defaults.deterministic, ...parsed.deterministic },
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
          stockReturn: {
            ...defaults.monteCarlo.assumptions.stockReturn,
            ...parsed.monteCarlo?.assumptions?.stockReturn
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
          }
        }
      }
    };
  } catch {
    return defaults;
  }
}

export function saveEconomicScenarioSettings(value: EconomicScenarioSettings): void {
  localStorage.setItem(ECONOMIC_SCENARIO_SETTINGS_KEY, JSON.stringify(value));
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

export function loadTaxConfigurations(defaults: TaxConfigurationSet): TaxConfigurationSet {
  //console.log('loadTaxConfigurations: defaults = ', defaults);
  try {
    const stored = localStorage.getItem(TAX_CONFIG_KEY);

    if (!stored) {
      return defaults;
    }

    const parsed = JSON.parse(stored) as Partial<TaxConfigurationSet>;

    const config: TaxConfigurationSet = {
      ...defaults,
      ...parsed
    };

    return config;
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
