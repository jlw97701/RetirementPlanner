import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_INPUTS,
  DEFAULT_MONTHLY_SS,
  DEFAULT_COLA_SETTINGS,
  DEFAULT_ASSET_ALLOCATION,
  DEFAULT_RETIREMENT_SCENARIOS,
  DEFAULT_TAX_CONFIG,
  ACTUAL_BENEFIT_SCENARIOS,
  DEFAULT_ECONOMIC_SCENARIO_SETTINGS,
  DEFAULT_ROTH_CONVERSION_OPTIMIZER_SETTINGS
} from '../data/defaults';

import { SSBenefitValueType, type RetirementScenario } from '../models/RetirementTypes';

import { calculateRetirementProjection, resolveProjectionTaxConfigurations } from '../services/RetirementEngine';
import { summarizeRetirementScenario } from '../services/ScenarioService';
import { createEconomicScenario } from '../services/EconomicScenarioService';
import { HISTORICAL_ECONOMIC_DATA } from '../data/historicalEconomicData';
import { EconomicScenarioMethod } from '../services/EconomicScenarioEngine';
import {
  runRetirementRiskAnalysis,
  type RetirementRiskAnalysisOptions
} from '../services/RetirementRiskAnalysisService';
import {
  createAppliedRothConversionScenario,
  optimizeRothConversions,
  runRothConversionOptimizerRiskAnalysis,
  type RothConversionOptimizerResult
} from '../services/RothConversionOptimizer';

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
  saveIrmaaConfigurations,
  loadRothConversionOptimizerSettings,
  saveRothConversionOptimizerSettings,
  loadAppliedRothConversionScenarios,
  saveAppliedRothConversionScenarios
} from '../services/PlannerStorage';
import { getProjectionPeriod } from '../utils/projectionDates';
import { IRMAA_CONFIGURATIONS } from '../data/irmaaTables';

function createOptimizerSourceKey(value: unknown): string {
  const serialized = JSON.stringify(value);
  let hash = 0x811c9dc5;

  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `v1-${serialized.length}-${(hash >>> 0).toString(36)}`;
}

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
  const [irmaaConfigurations, setIrmaaConfigurations] = useState(() => loadIrmaaConfigurations(IRMAA_CONFIGURATIONS));
  const [rothConversionOptimizerSettings, setRothConversionOptimizerSettings] = useState(() =>
    loadRothConversionOptimizerSettings(DEFAULT_ROTH_CONVERSION_OPTIMIZER_SETTINGS)
  );
  const [appliedRothConversionScenarios, setAppliedRothConversionScenarios] = useState(() =>
    loadAppliedRothConversionScenarios()
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
            historicalStartYear: HISTORICAL_ECONOMIC_DATA[0]?.year ?? loaded.historicalSequence.historicalStartYear
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
  useEffect(() => saveAssetAllocation(assetAllocation), [assetAllocation]);
  useEffect(() => saveEconomicScenarioSettings(economicScenarioSettings), [economicScenarioSettings]);
  useEffect(() => saveIrmaaConfigurations(irmaaConfigurations), [irmaaConfigurations]);
  useEffect(
    () => saveRothConversionOptimizerSettings(rothConversionOptimizerSettings),
    [rothConversionOptimizerSettings]
  );
  useEffect(() => saveAppliedRothConversionScenarios(appliedRothConversionScenarios), [appliedRothConversionScenarios]);

  const period = getProjectionPeriod(inputs.birthDate, inputs.startAge, inputs.endAge);

  const optimizerSourceKey = useMemo(
    () =>
      createOptimizerSourceKey({
        inputs,
        ssIncome,
        colaSettings,
        assetAllocation,
        economicScenarioSettings,
        taxConfig,
        irmaaConfigurations,
        rothConversionOptimizerSettings
      }),
    [
      inputs,
      ssIncome,
      colaSettings,
      assetAllocation,
      economicScenarioSettings,
      taxConfig,
      irmaaConfigurations,
      rothConversionOptimizerSettings
    ]
  );

  const activeScenarios = useMemo(() => {
    const usesActualBenefit = inputs.ssBenefitValueType === SSBenefitValueType.ActualCurrentBenefit;
    const baseScenarios = usesActualBenefit ? ACTUAL_BENEFIT_SCENARIOS : scenarios;
    const visibleAppliedScenarios = appliedRothConversionScenarios
      .filter((scenario) => (usesActualBenefit ? scenario.claimAge === null : scenario.claimAge !== null))
      .map((scenario) => ({
        ...scenario,
        rothConversionLabel: scenario.optimizerSourceKey === optimizerSourceKey ? 'Optimized' : 'Optimized (Review)'
      }));

    return [...baseScenarios, ...visibleAppliedScenarios];
  }, [inputs.ssBenefitValueType, scenarios, appliedRothConversionScenarios, optimizerSourceKey]);

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

  const federalTaxConfig = useMemo(
    () =>
      resolveProjectionTaxConfigurations(
        inputs,
        period.startYear,
        {
          federalTaxConfigurations: taxConfig.federal,
          stateTaxConfigurations: taxConfig.state,
          economicScenario,
          irmaaConfigurations
        },
        period.startYear
      ).federal.configuration,
    [inputs, period.startYear, taxConfig, economicScenario, irmaaConfigurations]
  );

  const projections = useMemo(
    () =>
      activeScenarios
        // .filter((scenario) => scenario.claimAge === null || scenario.claimAge >= inputs.startAge)
        .map((scenario) => {
          const rows = calculateRetirementProjection(inputs, ssIncome, colaSettings, assetAllocation, scenario, {
            federalTaxConfigurations: taxConfig.federal,
            stateTaxConfigurations: taxConfig.state,
            economicScenario,
            irmaaConfigurations
          });

          return {
            scenario,
            rows,
            summary: summarizeRetirementScenario(inputs, scenario, rows)
          };
        }),
    [inputs, ssIncome, colaSettings, assetAllocation, activeScenarios, taxConfig, economicScenario, irmaaConfigurations]
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
          federalTaxConfigurations: taxConfig.federal,
          stateTaxConfigurations: taxConfig.state,
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
      taxConfig,
      irmaaConfigurations
    ]
  );

  const runRothConversionOptimizer = useCallback(
    (retirementScenario: RetirementScenario) =>
      optimizeRothConversions({
        inputs,
        ssIncome,
        colaSettings,
        assetAllocation,
        retirementScenario,
        federalTaxConfigurations: taxConfig.federal,
        stateTaxConfigurations: taxConfig.state,
        economicScenario,
        irmaaConfigurations,
        settings: rothConversionOptimizerSettings
      }),
    [
      inputs,
      ssIncome,
      colaSettings,
      assetAllocation,
      taxConfig,
      economicScenario,
      irmaaConfigurations,
      rothConversionOptimizerSettings
    ]
  );

  const runOptimizerRiskAnalysis = useCallback(
    (
      retirementScenario: RetirementScenario,
      result: RothConversionOptimizerResult,
      options?: RetirementRiskAnalysisOptions
    ) =>
      runRothConversionOptimizerRiskAnalysis(
        {
          inputs,
          ssIncome,
          colaSettings,
          assetAllocation,
          retirementScenario,
          economicScenarioSettings,
          federalTaxConfigurations: taxConfig.federal,
          stateTaxConfigurations: taxConfig.state,
          irmaaConfigurations
        },
        result,
        options
      ),
    [inputs, ssIncome, colaSettings, assetAllocation, economicScenarioSettings, taxConfig, irmaaConfigurations]
  );

  const applyOptimizedRothConversionSchedule = useCallback(
    (result: RothConversionOptimizerResult): string => {
      const appliedScenario = createAppliedRothConversionScenario(inputs, result, optimizerSourceKey);

      setAppliedRothConversionScenarios((current) => [
        ...current.filter((scenario) => scenario.id !== appliedScenario.id),
        appliedScenario
      ]);

      return appliedScenario.id;
    },
    [inputs, optimizerSourceKey]
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
    federalTaxConfig,
    rothConversionOptimizerSettings,
    setRothConversionOptimizerSettings,
    runRothConversionOptimizer,
    runOptimizerRiskAnalysis,
    applyOptimizedRothConversionSchedule,
    runRiskAnalysis,
    projections
  };
}
