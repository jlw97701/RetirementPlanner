import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_COLA_SETTINGS, DEFAULT_INPUTS, DEFAULT_MONTHLY_SS, DEFAULT_SCENARIOS, DEFAULT_TAX_CONFIG } from '../data/defaults';
import { calculateRetirementProjection } from '../services/RetirementEngine';
import { summarizeScenario } from '../services/ScenarioService';
import {
  loadPlannerInputs,
  loadSocialSecurityIncome,
  loadSSCOLASettings,
  loadScenarios,
  savePlannerInputs,
  saveSocialSecurityIncome,
  saveSSCOLASettings,
  saveScenarios
} from '../services/PlannerStorage';
import { loadTaxConfigurations, saveTaxConfigurations } from '../services/TaxConfigRepository';

export function useRetirementModel() {
  const [inputs, setInputs] = useState(() => loadPlannerInputs(DEFAULT_INPUTS));
  const [ssIncome, setSSIncome] = useState(() => loadSocialSecurityIncome(DEFAULT_MONTHLY_SS));
  const [colaSettings, setColaSettings] = useState(() => loadSSCOLASettings(DEFAULT_COLA_SETTINGS));
  const [scenarios, setScenarios] = useState(() => loadScenarios(DEFAULT_SCENARIOS));
  const [taxConfig, setTaxConfig] = useState(() => loadTaxConfigurations(DEFAULT_TAX_CONFIG));

  useEffect(() => savePlannerInputs(inputs), [inputs]);
  useEffect(() => saveSocialSecurityIncome(ssIncome), [ssIncome]);
  useEffect(() => saveSSCOLASettings(colaSettings), [colaSettings]);
  useEffect(() => saveScenarios(scenarios), [scenarios]);
  useEffect(() => saveTaxConfigurations(taxConfig), [taxConfig]);

  const federal = taxConfig.federal[0],
    state = taxConfig.state[0];

  const projections = useMemo(
    () =>
      scenarios
        .filter((s) => s.claimAge >= inputs.startAge)
        .map((s) => {
          const rows = calculateRetirementProjection(inputs, ssIncome, colaSettings, s, {
            federalTaxConfig: federal,
            stateTaxConfig: state
          });
          return {
            scenario: s,
            rows,
            summary: summarizeScenario(inputs, s, rows)
          };
        }),
    [inputs, ssIncome, colaSettings, scenarios, federal, state]
  );
  //console.log('useRetirementModel: projections = ', projections);

  return {
    inputs,
    setInputs,
    ssIncome,
    setSSIncome,
    colaSettings,
    setColaSettings,
    scenarios,
    setScenarios,
    taxConfig,
    setTaxConfig,
    projections
  };
}
