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

export function loadPlannerInputs(d: PlannerInputs): PlannerInputs {
  //console.log('loadPlannerInputs: d = ', d);
  try {
    const v = localStorage.getItem(INPUTS_KEY);
    return v ? { ...d, ...JSON.parse(v) } : d;
  } catch {
    return d;
  }
}

export function savePlannerInputs(v: PlannerInputs): void {
  //console.log('savePlannerInputs: v = ', v);
  localStorage.setItem(INPUTS_KEY, JSON.stringify(v));
}

export function loadSocialSecurityIncome(d: SSMonthlyIncome[]): SSMonthlyIncome[] {
  //console.log('loadSocialSecurityIncome: d = ', d);
  try {
    const v = localStorage.getItem(INCOME_KEY);
    return v ? (JSON.parse(v) as SSMonthlyIncome[]) : d;
  } catch {
    return d;
  }
}

export function saveSocialSecurityIncome(v: SSMonthlyIncome[]): void {
  //console.log('saveSocialSecurityIncome: v = ', v);
  localStorage.setItem(INCOME_KEY, JSON.stringify(v));
}

export function loadSSCOLASettings(d: SSColaSettings): SSColaSettings {
  //console.log('loadSSCOLASettings: d = ', d);
  try {
    const v = localStorage.getItem(COLA_KEY);
    return v ? (JSON.parse(v) as SSColaSettings) : d;
  } catch {
    return d;
  }
}

export function saveSSCOLASettings(v: SSColaSettings): void {
  //console.log('saveSSCOLASettings: v = ', v);
  localStorage.setItem(COLA_KEY, JSON.stringify(v));
}

export function loadAssetAllocation(d: AssetAllocation): AssetAllocation {
  //onsole.log('loadAssetAllocation: d = ', d);
  try {
    const v = localStorage.getItem(ASSET_ALLOCATION_KEY);
    return v ? (JSON.parse(v) as AssetAllocation) : d;
  } catch {
    return d;
  }
}

export function saveAssetAllocation(v: AssetAllocation): void {
  //console.log('saveAssetAllocation: v = ', v);
  localStorage.setItem(ASSET_ALLOCATION_KEY, JSON.stringify(v));
}

export function loadRetirementScenarios(d: RetirementScenario[]): RetirementScenario[] {
  //console.log('loadScenarios: d = ', d);
  try {
    const v = localStorage.getItem(SCENARIO_KEY);
    return v ? (JSON.parse(v) as RetirementScenario[]) : d;
  } catch {
    return d;
  }
}

export function saveRetirementScenarios(v: RetirementScenario[]): void {
  //console.log('saveScenarios: v = ', v);
  localStorage.setItem(SCENARIO_KEY, JSON.stringify(v));
}

export function loadTaxConfigurations(d: TaxConfigurationSet): TaxConfigurationSet {
  //console.log('loadTaxConfigurations: d = ', d);
  try {
    const v = localStorage.getItem(TAX_CONFIG_KEY);
    return v ? (JSON.parse(v) as TaxConfigurationSet) : d;
  } catch {
    return d;
  }
}

export function saveTaxConfigurations(c: TaxConfigurationSet): void {
  //console.log('saveTaxConfigurations: c = ', c);
  localStorage.setItem(TAX_CONFIG_KEY, JSON.stringify(c));
}