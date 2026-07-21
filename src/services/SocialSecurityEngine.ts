import { ColaStrategyType, type PlannerInputs, type SSColaSettings } from '../models/RetirementTypes';
import { COLA_HISTORY } from '../data/colaHistory';
import { formatDecimal } from '../utils/format';
import { parseIsoDate } from '../utils/projectionDates';

export function getDefaultRmdStartAge(birthDate: string): number {
  const birth = parseIsoDate(birthDate);

  const year = birth.getFullYear();

  if (year >= 1960) {
    return 75;
  }

  if (year >= 1951) {
    return 73;
  }

  const julyFirst1949 = new Date(1949, 6, 1);

  if (year === 1950 || (year === 1949 && birth >= julyFirst1949)) {
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

  return formatDecimal(rates.reduce((sum, rate) => sum + rate, 0) / rates.length);
}
