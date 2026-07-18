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
  tradIra: number;
  rothIra: number;
  annualSpend: number;
  rothBaseConv: number;
  rothAggressiveConv: number;
  expectedReturn: number;
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

export interface Scenario {
  id: string;
  claimAge: 62 | 63 | 64 | 65 | 66 | 67 | 70;
  rothConvType: RothConversionType;
}

export interface EconomicYear {
    inflation: number;
    socialSecurityCola: number;
    stockReturn: number;
    bondReturn: number;
    cashReturn: number;
}

export interface RetirementYear {
  age: number;
  year: number;
  spending: number;
  socialSecurity: number;
  startTradIra: number;
  startRothIra: number;
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
  rothWithdraw: number;
  endTradlIra: number;
  endRothIra: number;
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
