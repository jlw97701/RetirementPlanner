export enum RothConversionType {
  None,
  Base,
  Aggressive
}

export enum ColaStrategyType {
  FixedRate,
  LastRate,
  InflationRate,
  HistoricalAverage,
  MonteCarlo
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
  startAge: number;
  endAge: number;
  horizonAge: number;
  stopConvAge: number;

  // Accounts and spending
  tradIra: number;
  rothIra: number;
  taxableAcct: number;
  annualSpend: number;
  medicareModel: MedicareModelType;
  annualSpendingIncludesHealthcare: boolean;
  medicareStartAge: number;
  monthlyPartDOtherPremium: number;
  annualOutOfPocketHealthcare: number;
  rothBaseConv: number;
  rothAggressiveConv: number;
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
  monteCarloRate: number;
}

export interface AssetAllocation {
  stocks: number;
  bonds: number;
  cash: number;
  other: number;
}

export interface RetirementScenario {
  id: string;
  claimAge: SSClaimAge | null; // Null means the user is already receiving an actual benefit
  rothConvType: RothConversionType;
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
  stateTaxableIncome: number;
  stateTax: number;
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
