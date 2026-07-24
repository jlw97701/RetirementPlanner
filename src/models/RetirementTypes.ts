import type { FilingStatus, StateCode } from './TaxTypes';

export enum RothConversionType {
  None,
  Fixed,
  Optimized
}

export enum ColaStrategyType {
  FixedRate,
  LastRate,
  InflationRate,
  HistoricalAverage
}

export enum SSBenefitValueType {
  CurrentDollars,
  ClaimYearDollars,
  ActualCurrentBenefit
}

export enum MedicareModelType {
  SimpleDeterministic,
  Custom
}
export type SSClaimAge = 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70;

export interface PlannerInputs {
  birthDate: string;
  filingStatus: FilingStatus;
  residenceState: StateCode;
  startAge: number;
  endAge: number;
  horizonAge: number;
  stopConvAge: number;

  // Accounts and spending
  tradIra: number;
  rothIra: number;
  taxableAcct: number;
  futureTradIraDeposit: number;
  futureTradIraDepositYear: number;
  annualSpend: number;
  medicareModel: MedicareModelType;
  annualSpendingIncludesHealthcare: boolean;
  medicareStartAge: number;
  monthlyPartDOtherPremium: number;
  annualOutOfPocketHealthcare: number;
  annualRothConversion: number;
  inflation: number;
  irmaaMagiTwoYearsPrior: number;
  irmaaMagiOneYearPrior: number;

  // SS benefit estimates
  ssBenefitValueType: SSBenefitValueType; // determines how SS estimates are adjusted annually
  ssEstimateYear: number; // applies to CurrentDollars estimates
  actualMonthlySS: number; // applies to ActualCurrentBenefit
  actualBenefitYear: number;
}

export interface SSMonthlyIncome {
  age: SSClaimAge;
  amount: number;
}

export interface SSColaSettings {
  strategy: ColaStrategyType;
  fixedRate: number;
  averageRate: number;
  lastRate: number;
}

export interface AssetAllocation {
  domesticStocks: number;
  internationalStocks: number;
  bonds: number;
  cash: number;
  other: number;
}

export interface RetirementScenario {
  id: string;
  claimAge: SSClaimAge | null; // Null means the user is already receiving an actual benefit
  rothConvType: RothConversionType;
  rothConversionLabel?: string;
  optimizerSourceKey?: string;
  /**
   * Optional requested Roth-conversion amounts by attained age.
   * When present, the schedule takes precedence over the Fixed amount.
   * The engine can still reduce a requested amount to preserve the RMD,
   * fund spending and taxes, and stay within the Traditional IRA balance.
   */
  rothConversionSchedule?: Readonly<Record<number, number>>;
}

export interface RetirementYear {
  age: number;
  year: number;
  inflationIndex: number; // Cumulative inflation relative to the first projection year. The first year is 1

  spending: number;
  medicareEligible: boolean;
  standardPartBPremium: number;
  partDOtherPremium: number;
  outOfPocketHealthcare: number;
  totalMedicareHealthcareCost: number;
  medicareHealthcareAddedToSpending: number;
  socialSecurity: number;

  startTradIra: number;
  startRothIra: number;
  startTaxableAcct: number;

  futureTradIraDeposit: number;
  tradGrowth: number;
  rothGrowth: number;

  rmd: number;
  tradCashWithdraw: number;
  rothConv: number;
  traditionalDist: number;

  taxableSS: number;
  federalAgi: number;
  federalTaxableIncome: number;
  federalTax: number;
  federalTaxConfigurationYear: number;
  federalTaxIsEstimated: boolean;
  stateTaxableIncome: number;
  stateTax: number;
  stateCode: StateCode;
  stateTaxableSocialSecurity: number;
  stateRetirementIncomeExclusion: number;
  statePersonalCredit: number;
  stateTaxConfigurationYear: number;
  stateTaxIsEstimated: boolean;
  totalTax: number;

  irmaaMagi: number;
  irmaaMagiWithoutRothConversion: number;
  irmaaLookbackMagi: number;
  irmaaTier: number;
  annualIrmaaSurcharge: number;
  irmaaConfigurationYear: number;
  irmaaIsEstimated: boolean;
  irmaaIsPublished: boolean;
  rothConversionRaisesIrmaaTier: boolean;

  taxableAcctDeposit: number;
  taxableAcctWithdraw: number;
  rothWithdraw: number;

  endTradlIra: number;
  endRothIra: number;
  endTaxableAcct: number;
  endPortfolio: number;
  endPortfolioCurrentDollars: number; // Ending portfolio expressed in first-projection-year purchasing power (inflation adjusted)

  unfundedNeed: number;
}

export interface ScenarioSummary {
  scenarioId: string;
  claimAge: SSClaimAge | null;
  rothConvType: RothConversionType;
  rothConversionLabel?: string;
  firstAnnualSS: number;

  //Existing fields are nominal future dollars
  horizonPortfolioAge: number;
  endPortfolioAge: number;

  //Values expressed in first-projection-year dollars (inflation adjusted)
  horizonPortfolioCurrentDollars: number;
  endPortfolioCurrentDollars: number;

  totalTaxes: number;
  totalIrmaaSurcharge: number;
  totalMedicareHealthcareCost: number;
  totalMedicareHealthcareAddedToSpending: number;
  totalSSToHorizon: number;
  depletionAge: number | null;
}
