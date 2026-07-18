import type {
  PlannerInputs,
  SSColaSettings,
  SSMonthlyIncome,
  Scenario
} from '../models/RetirementTypes';

const INPUTS_KEY = 'retirement-planner-inputs',
  INCOME_KEY = 'retirement-planner-income',
  SCENARIO_KEY = 'retirement-planner-scenarios';

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

export function loadSSCOLASettings(d: SSColaSettings): SSColaSettings {
  //console.log('loadSSCOLASettings: d = ', d);
  try {
    const v = localStorage.getItem('retirement-planner-cola');
    return v ? (JSON.parse(v) as SSColaSettings) : d;
  } catch {
    return d;
  }
}

export function saveSSCOLASettings(v: SSColaSettings): void {
  //console.log('saveSSCOLASettings: v = ', v);
  localStorage.setItem('retirement-planner-cola', JSON.stringify(v));
}

export function saveSocialSecurityIncome(v: SSMonthlyIncome[]): void {
  //console.log('saveSocialSecurityIncome: v = ', v);
  localStorage.setItem(INCOME_KEY, JSON.stringify(v));
}

export function loadScenarios(d: Scenario[]): Scenario[] {
  //console.log('loadScenarios: d = ', d);
  try {
    const v = localStorage.getItem(SCENARIO_KEY);
    return v ? (JSON.parse(v) as Scenario[]) : d;
  } catch {
    return d;
  }
}

export function saveScenarios(v: Scenario[]): void {
  //console.log('saveScenarios: v = ', v);
  localStorage.setItem(SCENARIO_KEY, JSON.stringify(v));
}
