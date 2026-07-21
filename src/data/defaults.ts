import { federal2026Single } from './federal2026';
import { oregon2026Single } from './oregon2026';

import {
  PlannerInputs,
  SSMonthlyIncome,
  RetirementScenario,
  RothConversionType,
  ColaStrategyType,
  SSColaSettings,
  AssetAllocation,
  SSBenefitValueType
} from '../models/RetirementTypes';

import type { TaxConfigurationSet } from '../models/TaxTypes';
import { COLA_HISTORY } from './colaHistory';
import { calculateHistoricalAverageCOLA, calculateMonteCarloCOLA } from '../services/SocialSecurityEngine';
import { formatDecimal } from '../utils/format';
import { EconomicScenarioMethod } from '../services/EconomicScenarioEngine';
import type { EconomicScenarioSettings } from '../models/EconomicScenarioSettings';

export const DEFAULT_INPUTS: PlannerInputs = {
  birthDate: '1964-03-30', // Using ISO date strings avoids ambiguous parsing
  startAge: 62,
  endAge: 95,
  horizonAge: 80,
  stopConvAge: 75,
  taxableAcct: 25000,
  tradIra: 600000,
  rothIra: 0,
  annualSpend: 60000,
  rothBaseConv: 30000,
  rothAggressiveConv: 60000,
  inflation: 0.03,
  ssBenefitValueType: SSBenefitValueType.CurrentDollars,
  ssEstimateYear: 2026,
  actualMonthlySS: 0,
  actualBenefitYear: 2026
};

export const DEFAULT_MONTHLY_SS: SSMonthlyIncome[] = [
  { age: 62, amount: 2685 },
  { age: 63, amount: 2830 },
  { age: 64, amount: 3038 },
  { age: 65, amount: 3311 },
  { age: 66, amount: 3582 },
  { age: 67, amount: 3854 },
  { age: 68, amount: 4124 }, // ???
  { age: 69, amount: 4394 }, // ???
  { age: 70, amount: 4831 }
];

export const DEFAULT_COLA_SETTINGS: SSColaSettings = {
  strategy: ColaStrategyType.InflationRate,
  fixedRate: 0.03,
  averageRate: calculateHistoricalAverageCOLA(),
  lastRate: formatDecimal(Object.values(COLA_HISTORY)[Object.values(COLA_HISTORY).length - 1]),
  monteCarloRate: calculateMonteCarloCOLA()
};

export const DEFAULT_ASSET_ALLOCATION: AssetAllocation = {
  stocks: 0.6,
  bonds: 0.3,
  cash: 0.1,
  other: 0
};

export const DEFAULT_ECONOMIC_SCENARIO_SETTINGS: EconomicScenarioSettings = {
  method: EconomicScenarioMethod.DETERMINISTIC,
  deterministic: {
    stockReturn: 0.07,
    bondReturn: 0.035,
    cashReturn: 0.025,
    otherReturn: 0.05
  },
  historicalSequence: {
    historicalStartYear: 1975,
    wrap: true
  },
  historicalBootstrap: {
    blockSize: 3,
    seed: 12345
  },
  monteCarlo: {
    seed: 12345,
    simulations: 1000,
    assumptions: {
      inflation: { mean: 0.03, standardDeviation: 0.015, minimum: -0.02, maximum: 0.1 },
      stockReturn: { mean: 0.07, standardDeviation: 0.18, minimum: -0.6, maximum: 0.6 },
      bondReturn: { mean: 0.035, standardDeviation: 0.07, minimum: -0.3, maximum: 0.3 },
      cashReturn: { mean: 0.025, standardDeviation: 0.015, minimum: 0, maximum: 0.1 },
      otherReturn: { mean: 0.05, standardDeviation: 0.15, minimum: -0.5, maximum: 0.5 },
      correlationMatrix: [
        [1, 0, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0],
        [0, 0, 0, 0, 1]
      ]
    }
  }
};

export const DEFAULT_RETIREMENT_SCENARIOS: RetirementScenario[] = [
  {
    id: 'ss62-none',
    claimAge: 62,
    rothConvType: RothConversionType.None
  },
  {
    id: 'ss62-base',
    claimAge: 62,
    rothConvType: RothConversionType.Base
  },
  {
    id: 'ss62-aggressive',
    claimAge: 62,
    rothConvType: RothConversionType.Aggressive
  },
  {
    id: 'ss63-none',
    claimAge: 63,
    rothConvType: 0
  },
  {
    id: 'ss63-base',
    claimAge: 63,
    rothConvType: RothConversionType.Base
  },
  {
    id: 'ss63-aggressive',
    claimAge: 63,
    rothConvType: RothConversionType.Aggressive
  },
  {
    id: 'ss64-none',
    claimAge: 64,
    rothConvType: 0
  },
  {
    id: 'ss64-base',
    claimAge: 64,
    rothConvType: RothConversionType.Base
  },
  {
    id: 'ss64-aggressive',
    claimAge: 64,
    rothConvType: RothConversionType.Aggressive
  },
  {
    id: 'ss65-none',
    claimAge: 65,
    rothConvType: 0
  },
  {
    id: 'ss65-base',
    claimAge: 65,
    rothConvType: RothConversionType.Base
  },
  {
    id: 'ss65-aggressive',
    claimAge: 65,
    rothConvType: RothConversionType.Aggressive
  },
  {
    id: 'ss66-none',
    claimAge: 66,
    rothConvType: 0
  },
  {
    id: 'ss66-base',
    claimAge: 66,
    rothConvType: RothConversionType.Base
  },
  {
    id: 'ss66-aggressive',
    claimAge: 66,
    rothConvType: RothConversionType.Aggressive
  },
  {
    id: 'ss67-none',
    claimAge: 67,
    rothConvType: 0
  },
  {
    id: 'ss67-base',
    claimAge: 67,
    rothConvType: RothConversionType.Base
  },
  {
    id: 'ss67-aggressive',
    claimAge: 67,
    rothConvType: RothConversionType.Aggressive
  },
  {
    id: 'ss68-none',
    claimAge: 68,
    rothConvType: 0
  },
  {
    id: 'ss68-base',
    claimAge: 68,
    rothConvType: RothConversionType.Base
  },
  {
    id: 'ss68-aggressive',
    claimAge: 68,
    rothConvType: RothConversionType.Aggressive
  },
  {
    id: 'ss69-none',
    claimAge: 69,
    rothConvType: 0
  },
  {
    id: 'ss69-base',
    claimAge: 69,
    rothConvType: RothConversionType.Base
  },
  {
    id: 'ss69-aggressive',
    claimAge: 69,
    rothConvType: RothConversionType.Aggressive
  },
  {
    id: 'ss70-none',
    claimAge: 70,
    rothConvType: 0
  },
  {
    id: 'ss70-base',
    claimAge: 70,
    rothConvType: RothConversionType.Base
  },
  {
    id: 'ss70-aggressive',
    claimAge: 70,
    rothConvType: RothConversionType.Aggressive
  }
];

export const ACTUAL_BENEFIT_SCENARIOS: RetirementScenario[] = [
  {
    id: 'actual-ss-none',
    claimAge: null,
    rothConvType: RothConversionType.None
  },
  {
    id: 'actual-ss-base',
    claimAge: null,
    rothConvType: RothConversionType.Base
  },
  {
    id: 'actual-ss-aggressive',
    claimAge: null,
    rothConvType: RothConversionType.Aggressive
  }
];

export const DEFAULT_TAX_CONFIG: TaxConfigurationSet = {
  federal: [federal2026Single],
  state: [oregon2026Single]
};
