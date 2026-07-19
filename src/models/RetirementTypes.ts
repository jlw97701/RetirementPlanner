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

export interface PlannerInputs {
  birthDate: string;
  startAge: number;
  endAge: number;
  horizonAge: number;
  rmdStartAge: number;
  stopConvAge: number;
  taxableAcct: number;
  tradIra: number;
  rothIra: number;
  annualSpend: number;
  rothBaseConv: number;
  rothAggressiveConv: number;
  //expectedReturn: number;
  inflation: number;
}

export interface SSMonthlyIncome {
  age: 62 | 63 | 64 | 65 | 66 | 67 | 70;
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
  claimAge: 62 | 63 | 64 | 65 | 66 | 67 | 70;
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
  claimAge: 62 | 63 | 64 | 65 | 66 | 67 | 70;
  rothConvType: RothConversionType;
  horizonPortfolioAge: number;
  endPortfolioAge: number;
  totalTaxes: number;
  totalSSToHorizon: number;
  depletionAge: number | null;
}
