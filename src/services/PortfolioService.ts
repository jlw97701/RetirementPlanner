import { EconomicYear } from "./EconomicScenarioEngine";

export interface AssetAllocation {
  stocks: number;
  bonds: number;
  cash: number;
}

export function calculatePortfolioReturn(
  economicYear: EconomicYear,
  allocation: AssetAllocation
): number {
  const totalWeight =
    allocation.stocks +
    allocation.bonds +
    allocation.cash;

  if (Math.abs(totalWeight - 1) > 0.000001) {
    throw new Error(
      'Asset-allocation weights must total 100%.'
    );
  }

  return (
    allocation.stocks * economicYear.stockReturn +
    allocation.bonds * economicYear.bondReturn +
    allocation.cash * economicYear.cashReturn
  );
}