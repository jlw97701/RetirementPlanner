import { useEffect, useMemo, useState } from 'react';
import { isValid } from 'date-fns';

import {
  DEFAULT_INPUTS,
  DEFAULT_MONTHLY_SS,
  DEFAULT_COLA_SETTINGS,
  DEFAULT_ASSET_ALLOCATION,
  DEFAULT_RETIREMENT_SCENARIOS,
  DEFAULT_TAX_CONFIG
} from '../data/defaults';

import { COLA_HISTORY } from '../data/colaHistory';

import { PlannerInputs } from '../models/RetirementTypes';

import { EconomicScenarioConfig, EconomicScenarioEngine } from '../services/EconomicScenarioEngine';
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

function getProjectionPeriod(inputs: PlannerInputs): {
  startYear: number;
  endYear: number;
  yearCount: number;
} {
  const birthDate = new Date(inputs.birthDate);
  //console.log('getProjectionPeriod: birthDate = ', birthDate, ', inputs.birthDate = ', inputs.birthDate);

  if (!isValid(birthDate)) {
    throw new Error(`Invalid birth date: ${inputs.birthDate}`);
  }

  if (inputs.endAge < inputs.startAge) {
    throw new Error('endAge cannot be less than startAge.');
  }

  const startYear = birthDate.getFullYear() + inputs.startAge;
  const endYear = birthDate.getFullYear() + inputs.endAge;

  return {
    startYear,
    endYear,
    yearCount: inputs.endAge - inputs.startAge + 1
  };
}

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
  // jlw - TO DO: Allow users to enter investment return assumptions in the UI, and then pass those values to the EconomicScenarioEngine.

  const economicScenarioEngine = new EconomicScenarioEngine();
  const period = getProjectionPeriod(inputs);

  const economicScenarioConfig: EconomicScenarioConfig = {
    method: EconomicScenarioMethod.DETERMINISTIC,
    startYear: period.startYear,
    years: period.yearCount,
    inflation: inputs.inflation,
    stockReturn: 0.07,
    bondReturn: 0.035,
    cashReturn: 0.025,
    otherReturn: 0.05,
    knownSocialSecurityColas: COLA_HISTORY
  };

  const economicScenario = economicScenarioEngine.generate(economicScenarioConfig);

  const projections = useMemo(
    () =>
      scenarios
        .filter((s) => s.claimAge >= inputs.startAge)
        .map((s) => {
          const rows = calculateRetirementProjection(inputs, ssIncome, colaSettings, assetAllocation, s, {
            federalTaxConfig,
            stateTaxConfig,
            economicScenario
          });
          return {
            scenario: s,
            rows,
            summary: summarizeRetirementScenario(inputs, s, rows)
          };
        }),
    [inputs, ssIncome, colaSettings, assetAllocation, scenarios, federalTaxConfig, stateTaxConfig, economicScenario]
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
    taxConfig,
    setTaxConfig,
    projections
  };
}
