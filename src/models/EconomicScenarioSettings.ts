import { EconomicScenarioMethod, type MonteCarloAssumptions } from '../services/EconomicScenarioEngine';
import type { DeterministicMarketProfileId, RollingReturnPeriod } from '../data/deterministicMarketProfiles';

export interface EconomicScenarioSettings {
  method: EconomicScenarioMethod;
  deterministic: {
    profile: DeterministicMarketProfileId;
    rollingPeriod: RollingReturnPeriod;
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
