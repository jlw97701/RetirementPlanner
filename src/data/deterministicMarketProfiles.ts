import type { AssetAllocation } from '../models/RetirementTypes';
import type { HistoricalEconomicYear } from '../services/EconomicScenarioEngine';

export type DeterministicMarketProfileId =
  | 'significantly-below-average'
  | 'below-average'
  | 'average'
  | 'above-average'
  | 'custom-market';
export type RollingReturnPeriod = 10 | 20;

export interface DeterministicMarketProfile {
  id: DeterministicMarketProfileId;
  label: string;
  percentile: number | null;
}

export const DETERMINISTIC_MARKET_PROFILES: readonly DeterministicMarketProfile[] = [
  { id: 'significantly-below-average', label: 'Very Low Historical Return', percentile: 0.1 },
  { id: 'below-average', label: 'Lower Historical Return', percentile: 0.25 },
  { id: 'average', label: 'Middle Historical Return', percentile: 0.5 },
  { id: 'above-average', label: 'Higher Historical Return', percentile: 0.75 },
  { id: 'custom-market', label: 'Custom Return', percentile: null }
];

export function calculateRollingAnnualizedPortfolioReturns(
  historicalData: readonly HistoricalEconomicYear[],
  allocation: AssetAllocation,
  period: RollingReturnPeriod
): number[] {
  if (historicalData.length < period) return [];

  const results: number[] = [];
  for (let start = 0; start <= historicalData.length - period; start += 1) {
    let growth = 1;
    for (let offset = 0; offset < period; offset += 1) {
      const year = historicalData[start + offset];
      const portfolioReturn =
        allocation.domesticStocks * year.domesticStockReturn +
        allocation.internationalStocks * year.internationalStockReturn +
        allocation.bonds * year.bondReturn +
        allocation.cash * year.cashReturn +
        allocation.other * year.otherReturn;
      growth *= 1 + portfolioReturn;
    }
    results.push(Math.pow(growth, 1 / period) - 1);
  }
  return results;
}

export function calculateDeterministicMarketReturns(
  historicalData: readonly HistoricalEconomicYear[],
  allocation: AssetAllocation,
  period: RollingReturnPeriod
): Record<Exclude<DeterministicMarketProfileId, 'custom-market'>, number> {
  const returns = calculateRollingAnnualizedPortfolioReturns(historicalData, allocation, period).sort((a, b) => a - b);
  if (returns.length === 0) throw new Error(`At least ${period} historical years are required.`);

  return {
    'significantly-below-average': percentile(returns, 0.1),
    'below-average': percentile(returns, 0.25),
    average: percentile(returns, 0.5),
    'above-average': percentile(returns, 0.75)
  };
}

function percentile(sortedValues: readonly number[], position: number): number {
  const index = (sortedValues.length - 1) * position;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower);
}
