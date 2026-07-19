import { COLA_HISTORY } from '../data/colaHistory';
import { roundRate } from '../utils/format';
import { ColaStrategyType, type PlannerInputs, type SSColaSettings } from '../models/RetirementTypes';

export function getDefaultRmdStartAge(birthDate: string): number {
  /*
   * People born before July 1, 1949 generally had the
   * age-70½ rules. This annual model cannot represent that
   * accurately with an integer starting age.
   */
  const birth = new Date(birthDate);

  if (!Number.isFinite(birth.getTime())) {
    throw new Error(`Invalid birth date: ${birthDate}`);
  }

  const year = birth.getFullYear();

  if (year >= 1960) {
    return 75;
  }

  if (year >= 1951) {
    return 73;
  }

  if (year >= 1950) {
    return 72;
  }

  return 71;
}

export function getAnnualSSCola(year: number, colaSettings: SSColaSettings, inputs: PlannerInputs): number {
  if (COLA_HISTORY[year] !== undefined) return COLA_HISTORY[year];
  return projectFutureCOLA(colaSettings, inputs);
}

export function projectFutureCOLA(colaSettings: SSColaSettings, inputs: PlannerInputs): number {
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

export function convertCurrentDollarsToYear(
  amount: number,
  estimateYear: number,
  targetYear: number,
  colaSettings: SSColaSettings,
  inputs: PlannerInputs
): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Social Security amount must be a nonnegative finite number.');
  }

  if (!Number.isInteger(estimateYear)) {
    throw new Error(`Invalid Social Security estimate year: ${estimateYear}.`);
  }

  if (!Number.isInteger(targetYear)) {
    throw new Error(`Invalid Social Security target year: ${targetYear}.`);
  }

  let convertedAmount = amount;

  if (targetYear > estimateYear) {
    /*
     * Move an estimate-year amount forward into future
     * nominal dollars.
     */
    for (let year = estimateYear + 1; year <= targetYear; year++) {
      convertedAmount *= 1 + getAnnualSSCola(year, colaSettings, inputs);
    }
  } else if (targetYear < estimateYear) {
    /*
     * Move an estimate-year amount backward into an earlier
     * year's nominal dollars.
     */
    for (let year = estimateYear; year > targetYear; year--) {
      convertedAmount /= 1 + getAnnualSSCola(year, colaSettings, inputs);
    }
  }

  return convertedAmount;
}

export function calculateHistoricalAverageCOLA(): number {
  const rates = Object.values(COLA_HISTORY);

  if (rates.length === 0) {
    return 0.03;
  }

  return roundRate(rates.reduce((sum, rate) => sum + rate, 0) / rates.length);
}

export function calculateMonteCarloCOLA(): number {
  // For demonstration purposes, we will return a random value between 1% and 5%.
  // In a real application, you would implement a proper Monte Carlo simulation here.
  const randomRate = Math.random() * (0.05 - 0.01) + 0.01;
  return roundRate(randomRate);
}
