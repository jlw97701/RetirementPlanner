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
export type SSClaimAge = 62 | 63 | 64 | 65 | 66 | 67 | 70;

export interface PlannerInputs {
  birthDate: string;
  startAge: number;
  endAge: number;
  horizonAge: number;
  stopConvAge: number;

  taxableAcct: number;
  tradIra: number;
  rothIra: number;
  annualSpend: number;
  rothBaseConv: number;
  rothAggressiveConv: number;
  inflation: number;

  ssBenefitValueType: SSBenefitValueType;
  /*
   * Applies to CurrentDollars estimates.
   */
  ssEstimateYear: number;
  /*
   * Applies to ActualCurrentBenefit.
   */
  actualMonthlySS: number;
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
  /*
   * Null means the user is already receiving an actual benefit.
   */
  claimAge: SSClaimAge | null;
  rothConvType: RothConversionType;
}

export interface RetirementYear {
  age: number;
  year: number;
  spending: number;
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

  taxableAcctDeposit: number;
  taxableAcctWithdraw: number;
  rothWithdraw: number;

  endTradlIra: number;
  endRothIra: number;
  endTaxableAcct: number;
  endPortfolio: number;

  unfundedNeed: number;
}

export interface ScenarioSummary {
  scenarioId: string;
  claimAge: SSClaimAge | null;
  rothConvType: RothConversionType;
  firstAnnualSS: number;
  horizonPortfolioAge: number;
  endPortfolioAge: number;
  totalTaxes: number;
  totalSSToHorizon: number;
  depletionAge: number | null;
}
