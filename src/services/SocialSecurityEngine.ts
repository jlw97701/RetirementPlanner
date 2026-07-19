import { COLA_HISTORY } from '../data/colaHistory';
import { DEFAULT_COLA_SETTINGS } from '../data/defaults';

import {
  ColaStrategyType,
  type PlannerInputs,
  type SSColaSettings,
  type SSMonthlyIncome,
  type RetirementScenario
} from '../models/RetirementTypes';

import { formatDecimal } from '../utils/format';

function projectFutureCOLA(colaSettings: SSColaSettings, inputs: PlannerInputs): number {
  let cola = inputs.inflation; // Default to inflation if no other strategy is specified

  switch (colaSettings.strategy) {
    case ColaStrategyType.FixedRate:
      cola = colaSettings.fixedRate;
      break;
    case ColaStrategyType.LastRate:
      cola = colaSettings.lastRate;
      break;
    case ColaStrategyType.InflationRate:
      cola = inputs.inflation;
      break;
    case ColaStrategyType.HistoricalAverage:
      cola = colaSettings.averageRate;
      break;
    case ColaStrategyType.MonteCarlo:
      cola = colaSettings.monteCarloRate;
      break;
    default:
      console.warn(`Unknown COLA strategy: ${colaSettings.strategy}. Using default.`);
  }

  return cola;
}

export function getAnnualSSCola(year: number, colaSettings: SSColaSettings, inputs: PlannerInputs): number {
  if (COLA_HISTORY[year] !== undefined) return COLA_HISTORY[year];
  return projectFutureCOLA(colaSettings, inputs);
}

export function calculateHistoricalAverageCOLA(): number {
  const historicalRates = Object.values(COLA_HISTORY);
  if (historicalRates.length === 0) return DEFAULT_COLA_SETTINGS.fixedRate;
  const sum = historicalRates.reduce((acc, rate) => acc + rate, 0);
  const cola = sum / historicalRates.length;
  return formatDecimal(cola);
}

export function calculateMonteCarloCOLA(): number {
  // For demonstration purposes, we will return a random value between 1% and 5%.
  // In a real application, you would implement a proper Monte Carlo simulation here.
  const randomRate = (Math.random() * (0.05 - 0.01) + 0.01) * 100;
  return formatDecimal(randomRate);
}

export function calculateAnnualSocialSecurity(
  year: number,
  age: number,
  inputs: PlannerInputs,
  ssIncome: SSMonthlyIncome[],
  colaSettings: SSColaSettings,
  scenario: RetirementScenario
): number {
  if (age < scenario.claimAge) return 0;
  const monthly = ssIncome.find((i) => i.age === scenario.claimAge)?.amount ?? 0;
  const cola = getAnnualSSCola(year, colaSettings, inputs);
  //console.log(`calculateAnnualSocialSecurity: year=${year}, cola=${cola}`);
  return monthly * 12 * Math.pow(1 + cola, age - scenario.claimAge);
}
