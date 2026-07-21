import { EconomicScenarioMethod, type MonteCarloAssumptions } from '../services/EconomicScenarioEngine';

export interface EconomicScenarioSettings {
  method: EconomicScenarioMethod;
  deterministic: {
    stockReturn: number;
    bondReturn: number;
    cashReturn: number;
    otherReturn: number;
  };
  historicalSequence: {
    historicalStartYear: number;
    wrap: boolean;
  };
  historicalBootstrap: {
    blockSize: number;
    seed: number;
  };
  monteCarlo: {
    seed: number;
    simulations: number;
    assumptions: MonteCarloAssumptions;
  };
}
