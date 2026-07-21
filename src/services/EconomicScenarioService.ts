import { COLA_HISTORY } from '../data/colaHistory';
import type { EconomicScenarioSettings } from '../models/EconomicScenarioSettings';
import type { PlannerInputs, SSColaSettings } from '../models/RetirementTypes';
import {
  EconomicScenarioEngine,
  EconomicScenarioMethod,
  type EconomicScenario,
  type HistoricalEconomicYear
} from './EconomicScenarioEngine';
import { projectFutureCOLA } from './SocialSecurityEngine';

export function createEconomicScenario(
  settings: EconomicScenarioSettings,
  inputs: PlannerInputs,
  colaSettings: SSColaSettings,
  startYear: number,
  years: number,
  historicalData: readonly HistoricalEconomicYear[]
): EconomicScenario {
  const engine = new EconomicScenarioEngine();

  switch (settings.method) {
    case EconomicScenarioMethod.DETERMINISTIC:
      return engine.generate({
        method: EconomicScenarioMethod.DETERMINISTIC,
        startYear,
        years,
        inflation: inputs.inflation,
        socialSecurityCola: projectFutureCOLA(colaSettings, inputs),
        stockReturn: settings.deterministic.stockReturn,
        bondReturn: settings.deterministic.bondReturn,
        cashReturn: settings.deterministic.cashReturn,
        otherReturn: settings.deterministic.otherReturn,
        knownSocialSecurityColas: COLA_HISTORY
      });

    case EconomicScenarioMethod.HISTORICAL_SEQUENCE:
      requireHistoricalData(historicalData);
      return engine.generate({
        method: EconomicScenarioMethod.HISTORICAL_SEQUENCE,
        startYear,
        years,
        historicalData,
        historicalStartYear: settings.historicalSequence.historicalStartYear,
        wrap: settings.historicalSequence.wrap,
        knownSocialSecurityColas: COLA_HISTORY
      });

    case EconomicScenarioMethod.HISTORICAL_BOOTSTRAP:
      requireHistoricalData(historicalData);
      return engine.generate({
        method: EconomicScenarioMethod.HISTORICAL_BOOTSTRAP,
        startYear,
        years,
        historicalData,
        blockSize: settings.historicalBootstrap.blockSize,
        seed: settings.historicalBootstrap.seed,
        knownSocialSecurityColas: COLA_HISTORY
      });

    case EconomicScenarioMethod.MONTE_CARLO:
      return engine.generate({
        method: EconomicScenarioMethod.MONTE_CARLO,
        startYear,
        years,
        assumptions: settings.monteCarlo.assumptions,
        seed: settings.monteCarlo.seed,
        knownSocialSecurityColas: COLA_HISTORY
      });
  }
}

function requireHistoricalData(data: readonly HistoricalEconomicYear[]): void {
  if (data.length === 0) {
    throw new Error('Historical economic data is not available.');
  }
}
