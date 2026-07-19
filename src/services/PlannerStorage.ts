import type {
  AssetAllocation,
  PlannerInputs,
  SSColaSettings,
  SSMonthlyIncome,
  RetirementScenario
} from '../models/RetirementTypes';
import type { TaxConfigurationSet } from '../models/TaxTypes';

const INPUTS_KEY = 'retirement-planner-inputs',
  INCOME_KEY = 'retirement-planner-income',
  COLA_KEY = 'retirement-planner-cola',
  ASSET_ALLOCATION_KEY = 'retirement-planner-asset-allocation',
  SCENARIO_KEY = 'retirement-planner-scenarios',
  TAX_CONFIG_KEY = 'retirement-planner-tax-config';

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
