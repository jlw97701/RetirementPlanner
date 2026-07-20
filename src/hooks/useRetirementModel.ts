import { useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_INPUTS,
  DEFAULT_MONTHLY_SS,
  DEFAULT_COLA_SETTINGS,
  DEFAULT_ASSET_ALLOCATION,
  DEFAULT_RETIREMENT_SCENARIOS,
  DEFAULT_TAX_CONFIG,
  ACTUAL_BENEFIT_SCENARIOS
} from '../data/defaults';

import { COLA_HISTORY } from '../data/colaHistory';

import { SSBenefitValueType } from '../models/RetirementTypes';

import { EconomicScenarioEngine } from '../services/EconomicScenarioEngine';
import { calculateRetirementProjection } from '../services/RetirementEngine';
import { summarizeRetirementScenario } from '../services/ScenarioService';

import {
  loadPlannerInputs,
  savePlannerInputs,
  loadSocialSecurityIncome,
  saveSocialSecurityIncome,
  loadSSCOLASettings,
  saveSSCOLASettings,
  loadAssetAllocation,
  saveAssetAllocation,
  loadRetirementScenarios,
  saveRetirementScenarios,
  loadTaxConfigurations,
  saveTaxConfigurations
} from '../services/PlannerStorage';

import { EconomicScenarioMethod } from '../services/EconomicScenarioEngine';
import { projectFutureCOLA } from '../services/SocialSecurityEngine';
import { getProjectionPeriod } from '../utils/projectionDates';

/**
 * Main application hook
 * Loads and saves retirement-planner settings, constructs the economic scenario, 
 * selects the applicable retirement scenarios, calculates each projection, 
 * and exposes the resulting data and state setters to the UI.
 */
export function useRetirementModel() {
  const [inputs, setInputs] = useState(() => loadPlannerInputs(DEFAULT_INPUTS));
  const [ssIncome, setSSIncome] = useState(() => loadSocialSecurityIncome(DEFAULT_MONTHLY_SS));
  const [colaSettings, setColaSettings] = useState(() => loadSSCOLASettings(DEFAULT_COLA_SETTINGS));
  const [assetAllocation, setAssetAllocation] = useState(() => loadAssetAllocation(DEFAULT_ASSET_ALLOCATION));
  const [scenarios, setScenarios] = useState(() => loadRetirementScenarios(DEFAULT_RETIREMENT_SCENARIOS));
  const [taxConfig, setTaxConfig] = useState(() => loadTaxConfigurations(DEFAULT_TAX_CONFIG));

  useEffect(() => savePlannerInputs(inputs), [inputs]);
  useEffect(() => saveSocialSecurityIncome(ssIncome), [ssIncome]);
  useEffect(() => saveSSCOLASettings(colaSettings), [colaSettings]);
  useEffect(() => saveRetirementScenarios(scenarios), [scenarios]);
  useEffect(() => saveTaxConfigurations(taxConfig), [taxConfig]);
  useEffect(() => savePlannerInputs(inputs), [inputs]);
  useEffect(() => saveAssetAllocation(assetAllocation), [assetAllocation]);

  const federalTaxConfig = taxConfig.federal[0],
    stateTaxConfig = taxConfig.state[0];

  // jlw - TO DO: Allow users to select the economic scenario method and parameters in the UI, and then pass those values to the EconomicScenarioEngine.

  const period = getProjectionPeriod(inputs.birthDate, inputs.startAge, inputs.endAge);

  const activeScenarios = useMemo(
    () =>
      inputs.ssBenefitValueType === SSBenefitValueType.ActualCurrentBenefit ? ACTUAL_BENEFIT_SCENARIOS : scenarios,
    [inputs.ssBenefitValueType, scenarios]
  );

  if (!Array.isArray(activeScenarios)) {
    throw new Error('Active retirement scenarios must be an array.');
  }

  const economicScenario = useMemo(() => {
    const engine = new EconomicScenarioEngine();

    return engine.generate({
      method: EconomicScenarioMethod.DETERMINISTIC,
      startYear: period.startYear,
      years: period.yearCount,
      inflation: inputs.inflation,
      socialSecurityCola: projectFutureCOLA(colaSettings, inputs),
      stockReturn: 0.07,
      bondReturn: 0.035,
      cashReturn: 0.025,
      otherReturn: 0.05,
      knownSocialSecurityColas: COLA_HISTORY
    });
  }, [period.startYear, period.yearCount, inputs.inflation, colaSettings]);

  const projections = useMemo(
    () =>
      activeScenarios
        // .filter((scenario) => scenario.claimAge === null || scenario.claimAge >= inputs.startAge)
        .map((scenario) => {
          const rows = calculateRetirementProjection(inputs, ssIncome, colaSettings, assetAllocation, scenario, {
            federalTaxConfig,
            stateTaxConfig,
            economicScenario
          });

          return {
            scenario,
            rows,
            summary: summarizeRetirementScenario(inputs, scenario, rows)
          };
        }),
    [
      inputs,
      ssIncome,
      colaSettings,
      assetAllocation,
      activeScenarios,
      federalTaxConfig,
      stateTaxConfig,
      economicScenario
    ]
  );
  //console.log('useRetirementModel: projections = ', projections);

  return {
    inputs,
    setInputs,
    ssIncome,
    setSSIncome,
    colaSettings,
    setColaSettings,
    assetAllocation,
    setAssetAllocation,
    scenarios,
    setScenarios,
    activeScenarios,
    taxConfig,
    setTaxConfig,
    projections
  };
}
