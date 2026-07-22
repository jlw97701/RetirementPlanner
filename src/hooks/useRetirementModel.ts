import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_INPUTS,
  DEFAULT_MONTHLY_SS,
  DEFAULT_COLA_SETTINGS,
  DEFAULT_ASSET_ALLOCATION,
  DEFAULT_RETIREMENT_SCENARIOS,
  DEFAULT_TAX_CONFIG,
  ACTUAL_BENEFIT_SCENARIOS,
  DEFAULT_ECONOMIC_SCENARIO_SETTINGS
} from '../data/defaults';

import { SSBenefitValueType } from '../models/RetirementTypes';

import { calculateRetirementProjection } from '../services/RetirementEngine';
import { selectStateTaxConfiguration, selectTaxConfiguration } from '../services/TaxEngine';
import { summarizeRetirementScenario } from '../services/ScenarioService';
import { createEconomicScenario } from '../services/EconomicScenarioService';
import { HISTORICAL_ECONOMIC_DATA } from '../data/historicalEconomicData';
import { EconomicScenarioMethod } from '../services/EconomicScenarioEngine';
import {
  runRetirementRiskAnalysis,
  type RetirementRiskAnalysisOptions
} from '../services/RetirementRiskAnalysisService';

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
  saveTaxConfigurations,
  loadEconomicScenarioSettings,
  saveEconomicScenarioSettings,
  loadIrmaaConfigurations,
  saveIrmaaConfigurations
} from '../services/PlannerStorage';
import { getProjectionPeriod } from '../utils/projectionDates';
import { IRMAA_CONFIGURATIONS } from '../data/irmaaTables';

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
  const [irmaaConfigurations, setIrmaaConfigurations] = useState(() =>
    loadIrmaaConfigurations(IRMAA_CONFIGURATIONS)
  );
  const [economicScenarioSettings, setEconomicScenarioSettings] = useState(() => {
    const loaded = loadEconomicScenarioSettings(DEFAULT_ECONOMIC_SCENARIO_SETTINGS);
    const hasStoredHistoricalStart = HISTORICAL_ECONOMIC_DATA.some(
      (item) => item.year === loaded.historicalSequence.historicalStartYear
    );
    const normalized = hasStoredHistoricalStart
      ? loaded
      : {
          ...loaded,
          historicalSequence: {
            ...loaded.historicalSequence,
            historicalStartYear:
              HISTORICAL_ECONOMIC_DATA[0]?.year ?? loaded.historicalSequence.historicalStartYear
          }
        };
    const requiresHistoricalData =
      normalized.method === EconomicScenarioMethod.HISTORICAL_SEQUENCE ||
      normalized.method === EconomicScenarioMethod.HISTORICAL_BOOTSTRAP;

    return requiresHistoricalData && HISTORICAL_ECONOMIC_DATA.length === 0
      ? { ...normalized, method: EconomicScenarioMethod.DETERMINISTIC }
      : normalized;
  });

  useEffect(() => savePlannerInputs(inputs), [inputs]);
  useEffect(() => saveSocialSecurityIncome(ssIncome), [ssIncome]);
  useEffect(() => saveSSCOLASettings(colaSettings), [colaSettings]);
  useEffect(() => saveRetirementScenarios(scenarios), [scenarios]);
  useEffect(() => saveTaxConfigurations(taxConfig), [taxConfig]);
  useEffect(() => savePlannerInputs(inputs), [inputs]);
  useEffect(() => saveAssetAllocation(assetAllocation), [assetAllocation]);
  useEffect(() => saveEconomicScenarioSettings(economicScenarioSettings), [economicScenarioSettings]);
  useEffect(() => saveIrmaaConfigurations(irmaaConfigurations), [irmaaConfigurations]);

  const federalTaxConfig = selectTaxConfiguration(taxConfig.federal, inputs.filingStatus);
  const stateTaxConfig = selectStateTaxConfiguration(
    taxConfig.state,
    inputs.residenceState,
    inputs.filingStatus
  );

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
    return createEconomicScenario(
      economicScenarioSettings,
      inputs,
      colaSettings,
      period.startYear,
      period.yearCount,
      HISTORICAL_ECONOMIC_DATA,
      assetAllocation
    );
  }, [economicScenarioSettings, inputs, colaSettings, period.startYear, period.yearCount, assetAllocation]);

  const projections = useMemo(
    () =>
      activeScenarios
        // .filter((scenario) => scenario.claimAge === null || scenario.claimAge >= inputs.startAge)
        .map((scenario) => {
          const rows = calculateRetirementProjection(inputs, ssIncome, colaSettings, assetAllocation, scenario, {
            federalTaxConfig,
            stateTaxConfig,
            economicScenario,
            irmaaConfigurations
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
      economicScenario,
      irmaaConfigurations
    ]
  );

  const runRiskAnalysis = useCallback(
    (options?: RetirementRiskAnalysisOptions) =>
      runRetirementRiskAnalysis(
        {
          inputs,
          ssIncome,
          colaSettings,
          assetAllocation,
          retirementScenarios: activeScenarios,
          economicScenarioSettings,
          federalTaxConfig,
          stateTaxConfig,
          irmaaConfigurations
        },
        options
      ),
    [
      inputs,
      ssIncome,
      colaSettings,
      assetAllocation,
      activeScenarios,
      economicScenarioSettings,
      federalTaxConfig,
      stateTaxConfig,
      irmaaConfigurations
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
    irmaaConfigurations,
    setIrmaaConfigurations,
    economicScenarioSettings,
    setEconomicScenarioSettings,
    runRiskAnalysis,
    projections
  };
}
