import { FEDERAL_2026_CONFIGURATIONS } from './federal2026';
import { STATE_2026_CONFIGURATIONS } from './stateTax2026';

import {
  PlannerInputs,
  SSMonthlyIncome,
  RetirementScenario,
  RothConversionType,
  SSClaimAge,
  ColaStrategyType,
  SSColaSettings,
  AssetAllocation,
  SSBenefitValueType,
  MedicareModelType
} from '../models/RetirementTypes';

import type { TaxConfigurationSet } from '../models/TaxTypes';
import { COLA_HISTORY } from './colaHistory';
import { calculateHistoricalAverageCOLA } from '../services/SocialSecurityEngine';
import { formatDecimal } from '../utils/format';
import { EconomicScenarioMethod } from '../services/EconomicScenarioEngine';
import type { EconomicScenarioSettings } from '../models/EconomicScenarioSettings';
import type { RothConversionOptimizerSettings } from '../models/RothConversionOptimizerTypes';

// export const DEFAULT_INPUTS: PlannerInputs = {
//   birthDate: '1970-01-01', // Using ISO date strings avoids ambiguous parsing
//   filingStatus: 'single',
//   residenceState: 'OR',
//   startAge: 62,
//   endAge: 95,
//   horizonAge: 80,
//   stopConvAge: 75,
//   taxableAcct: 50000,
//   tradIra: 500000,
//   rothIra: 0,
//   annualSpend: 50000,
//   medicareModel: MedicareModelType.SimpleDeterministic,
//   annualSpendingIncludesHealthcare: true,
//   medicareStartAge: 65,
//   monthlyPartDOtherPremium: 0,
//   annualOutOfPocketHealthcare: 0,
//   annualRothConversion: 25000,
//   inflation: 0.03,
//   ssBenefitValueType: SSBenefitValueType.CurrentDollars,
//   ssEstimateYear: 2026,
//   actualMonthlySS: 0,
//   actualBenefitYear: 2026,
//   irmaaMagiTwoYearsPrior: 0,
//   irmaaMagiOneYearPrior: 0
// };

// export const DEFAULT_MONTHLY_SS: SSMonthlyIncome[] = [
//   { age: 62, amount: 2500 },
//   { age: 63, amount: 2750 },
//   { age: 64, amount: 3000 },
//   { age: 65, amount: 3250 },
//   { age: 66, amount: 3500 },
//   { age: 67, amount: 3750 },
//   { age: 68, amount: 4000 },
//   { age: 69, amount: 4250 },
//   { age: 70, amount: 4500 }
// ];

// jlw - TO DO: remove my defaults after testing...

export const DEFAULT_INPUTS: PlannerInputs = {
  birthDate: '1964-03-30', // Using ISO date strings avoids ambiguous parsing
  filingStatus: 'headOfHousehold',
  residenceState: 'OR',
  startAge: 62,
  endAge: 95,
  horizonAge: 80,
  stopConvAge: 75,
  taxableAcct: 25000,
  tradIra: 590000,
  rothIra: 0,
  annualSpend: 60000,
  medicareModel: MedicareModelType.SimpleDeterministic,
  annualSpendingIncludesHealthcare: true,
  medicareStartAge: 65,
  monthlyPartDOtherPremium: 0,
  annualOutOfPocketHealthcare: 0,
  annualRothConversion: 25000,
  inflation: 0.03,
  ssBenefitValueType: SSBenefitValueType.CurrentDollars,
  ssEstimateYear: 2026,
  actualMonthlySS: 0,
  actualBenefitYear: 2026,
  irmaaMagiTwoYearsPrior: 0,
  irmaaMagiOneYearPrior: 0
};

export const DEFAULT_MONTHLY_SS: SSMonthlyIncome[] = [
  { age: 62, amount: 2685 },
  { age: 63, amount: 2830 },
  { age: 64, amount: 3038 },
  { age: 65, amount: 3311 },
  { age: 66, amount: 3582 },
  { age: 67, amount: 3854 },
  { age: 68, amount: 4126 },
  { age: 69, amount: 4451 },
  { age: 70, amount: 4831 }
];

export const DEFAULT_COLA_SETTINGS: SSColaSettings = {
  strategy: ColaStrategyType.InflationRate,
  fixedRate: 0.03,
  averageRate: calculateHistoricalAverageCOLA(),
  lastRate: formatDecimal(Object.values(COLA_HISTORY)[Object.values(COLA_HISTORY).length - 1])
};

export const DEFAULT_ASSET_ALLOCATION: AssetAllocation = {
  domesticStocks: 0.35,
  internationalStocks: 0.15,
  bonds: 0.4,
  cash: 0.1,
  other: 0
};

export const DEFAULT_ECONOMIC_SCENARIO_SETTINGS: EconomicScenarioSettings = {
  method: EconomicScenarioMethod.DETERMINISTIC,
  deterministic: {
    profile: 'below-average',
    rollingPeriod: 20,
    domesticStockReturn: 0.07,
    internationalStockReturn: 0.065,
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
    simulations: 100,
    assumptions: {
      inflation: { mean: 0.03, standardDeviation: 0.015, minimum: -0.02, maximum: 0.1 },
      domesticStockReturn: { mean: 0.07, standardDeviation: 0.18, minimum: -0.6, maximum: 0.6 },
      internationalStockReturn: { mean: 0.065, standardDeviation: 0.2, minimum: -0.65, maximum: 0.65 },
      bondReturn: { mean: 0.035, standardDeviation: 0.07, minimum: -0.3, maximum: 0.3 },
      cashReturn: { mean: 0.025, standardDeviation: 0.015, minimum: 0, maximum: 0.1 },
      otherReturn: { mean: 0.05, standardDeviation: 0.15, minimum: -0.5, maximum: 0.5 },
      correlationMatrix: [
        [1, 0, 0, 0, 0, 0],
        [0, 1, 0.75, 0, 0, 0],
        [0, 0.75, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 1]
      ]
    }
  }
};

export const DEFAULT_ROTH_CONVERSION_OPTIMIZER_SETTINGS: RothConversionOptimizerSettings = {
  maxFederalBracketRate: 0.22,
  maxAnnualConversion: 50_000,
  terminalTraditionalTaxRate: 0.2,
  irmaaGuardrail: 'avoid-increase'
};

const DEFAULT_CLAIM_AGES: SSClaimAge[] = [62, 63, 64, 65, 66, 67, 68, 69, 70];

export const DEFAULT_RETIREMENT_SCENARIOS: RetirementScenario[] = DEFAULT_CLAIM_AGES.flatMap((claimAge) => [
  {
    id: `ss${claimAge}-none`,
    claimAge,
    rothConvType: RothConversionType.None
  },
  {
    id: `ss${claimAge}-fixed`,
    claimAge,
    rothConvType: RothConversionType.Fixed
  }
]);

export const ACTUAL_BENEFIT_SCENARIOS: RetirementScenario[] = [
  {
    id: 'actual-ss-none',
    claimAge: null,
    rothConvType: RothConversionType.None
  },
  {
    id: 'actual-ss-fixed',
    claimAge: null,
    rothConvType: RothConversionType.Fixed
  }
];

export const DEFAULT_TAX_CONFIG: TaxConfigurationSet = {
  federal: FEDERAL_2026_CONFIGURATIONS,
  state: STATE_2026_CONFIGURATIONS
};
