import { federal2026Single } from './federal2026';
import { oregon2026Single } from './oregon2026';

import {
  PlannerInputs,
  SSMonthlyIncome,
  RetirementScenario,
  RothConversionType,
  ColaStrategyType,
  SSColaSettings,
  AssetAllocation
} from '../models/RetirementTypes';

import type { TaxConfigurationSet } from '../models/TaxTypes';
import { COLA_HISTORY } from './colaHistory';
import { calculateHistoricalAverageCOLA, calculateMonteCarloCOLA } from '../services/SocialSecurityEngine';
import { formatDecimal } from '../utils/format';

export const DEFAULT_INPUTS: PlannerInputs = {
  birthDate: '3/30/1964',
  startAge: 62,
  endAge: 95,
  horizonAge: 80,
  rmdStartAge: 75,
  stopConvAge: 75,
  taxableAcct: 25000,
  tradIra: 600000,
  rothIra: 0,
  annualSpend: 60000,
  rothBaseConv: 30000,
  rothAggressiveConv: 60000,
  //expectedReturn: 0.055,
  inflation: 0.03
};

export const DEFAULT_MONTHLY_SS: SSMonthlyIncome[] = [
  { age: 62, amount: 2685 },
  { age: 63, amount: 2830 },
  { age: 64, amount: 3038 },
  { age: 65, amount: 3311 },
  { age: 66, amount: 3582 },
  { age: 67, amount: 3854 },
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

export const DEFAULT_TAX_CONFIG: TaxConfigurationSet = {
  federal: [federal2026Single],
  state: [oregon2026Single]
};
