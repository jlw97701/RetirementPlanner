import {
  RothConversionType,
  RetirementYear,
  PlannerInputs,
  SSMonthlyIncome,
  SSColaSettings,
  RetirementScenario,
  AssetAllocation
} from '../models/RetirementTypes';

import { calculateFederalTax, calculateStateTax } from './TaxEngine';
import { calculateAnnualSocialSecurity } from './SocialSecurityEngine';
import { EconomicScenario, EconomicYear } from './EconomicScenarioEngine';
import { RMD_FACTORS } from '../data/rmdFactors';

import type { FederalTaxConfig, StateTaxConfig } from '../models/TaxTypes';
import { isValid } from 'date-fns';

const WITHDRAWAL_TOLERANCE = 0.01;
const MAX_SOLVER_ITERATIONS = 100;

interface RetirementCalculationContext {
  federalTaxConfig: FederalTaxConfig;
  stateTaxConfig: StateTaxConfig;
  economicScenario: EconomicScenario;
}

interface WithdrawalEvaluation {
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

  /**
   * Positive: withdrawal produces excess cash.
   * Negative: withdrawal does not fully cover spending and taxes.
   */
  cashSurplus: number;
}

interface WithdrawalSolution extends WithdrawalEvaluation {
  converged: boolean;
  iterations: number;
}

/**
 * Evaluates one proposed traditional-IRA cash withdrawal.
 *
 * The Roth conversion is reduced when necessary so that:
 *
 *     cash withdrawal + Roth conversion <= traditional IRA balance
 *
 * This function is pure and does not modify account balances.
 */
function evaluateTraditionalWithdrawal(
  age: number,
  availableTradIra: number,
  proposedCashWithdrawal: number,
  requestedRothConversion: number,
  spending: number,
  socialSecurity: number,
  context: RetirementCalculationContext
): WithdrawalEvaluation {
  const tradCashWithdraw = Math.min(availableTradIra, Math.max(0, proposedCashWithdrawal));
  const rothConv = Math.min(requestedRothConversion, Math.max(0, availableTradIra - tradCashWithdraw));
  const traditionalDist = tradCashWithdraw + rothConv;
  const federal = calculateFederalTax(age, traditionalDist, socialSecurity, context.federalTaxConfig);
  const state = calculateStateTax(age, traditionalDist, federal.taxableSS, context.stateTaxConfig);
  const totalTax = federal.tax + state.tax;

  return {
    tradCashWithdraw,
    rothConv,
    traditionalDist,
    taxableSS: federal.taxableSS,
    federalAgi: federal.agi,
    federalTaxableIncome: federal.taxableIncome,
    federalTax: federal.tax,
    stateTaxableIncome: state.taxableIncome,
    stateTax: state.tax,
    totalTax,
    cashSurplus: socialSecurity + tradCashWithdraw - spending - totalTax
  };
}

/**
 * Finds the traditional-IRA cash withdrawal required to cover spending
 * and taxes.
 *
 * The target equation is:
 *
 *     Social Security
 *     + traditional cash withdrawal
 *     - spending
 *     - taxes(total traditional distribution)
 *     = 0
 *
 * A bounded bisection solver is appropriate because the available
 * traditional IRA gives us a finite search interval and the net-cash
 * function should normally be monotonic.
 */
function solveTraditionalWithdrawal(
  age: number,
  availableTradIra: number,
  requestedRothConversion: number,
  rmd: number,
  spending: number,
  socialSecurity: number,
  context: RetirementCalculationContext
): WithdrawalSolution {
  const minimumWithdrawal = Math.min(availableTradIra, Math.max(0, rmd));
  const maximumWithdrawal = availableTradIra;

  const evaluate = (cashWithdrawal: number): WithdrawalEvaluation =>
    evaluateTraditionalWithdrawal(
      age,
      availableTradIra,
      cashWithdrawal,
      requestedRothConversion,
      spending,
      socialSecurity,
      context
    );

  const minimumResult = evaluate(minimumWithdrawal);

  /*
   * The RMD or other minimum withdrawal already covers spending and taxes.
   * No root search is needed.
   */
  if (minimumResult.cashSurplus >= 0) {
    return {
      ...minimumResult,
      converged: true,
      iterations: 0
    };
  }

  const maximumResult = evaluate(maximumWithdrawal);

  /*
   * Even withdrawing the entire traditional IRA does not cover the need.
   * Return the maximum feasible withdrawal. The remaining need can then
   * be funded from the Roth account.
   */
  if (maximumResult.cashSurplus < 0) {
    return {
      ...maximumResult,
      converged: false,
      iterations: 0
    };
  }

  let lower = minimumWithdrawal;
  let upper = maximumWithdrawal;
  let result = minimumResult;

  for (let iteration = 1; iteration <= MAX_SOLVER_ITERATIONS; iteration++) {
    const midpoint = lower + (upper - lower) / 2;

    result = evaluate(midpoint);

    if (Math.abs(result.cashSurplus) <= WITHDRAWAL_TOLERANCE || upper - lower <= WITHDRAWAL_TOLERANCE) {
      return {
        ...result,
        converged: true,
        iterations: iteration
      };
    }

    if (result.cashSurplus < 0) {
      /*
       * Withdrawal is too small.
       */
      lower = midpoint;
    } else {
      /*
       * Withdrawal is larger than necessary.
       */
      upper = midpoint;
    }
  }

  return {
    ...result,
    converged: false,
    iterations: MAX_SOLVER_ITERATIONS
  };
}

function getAnnualRothConversion(inputs: PlannerInputs, scenario: RetirementScenario): number {
  switch (scenario.rothConvType) {
    case RothConversionType.Base:
      return inputs.rothBaseConv;

    case RothConversionType.Aggressive:
      return inputs.rothAggressiveConv;

    default:
      return 0;
  }
}

function getBirthYear(birthDate: string): number {
  const parsedDate = new Date(birthDate);

  if (!isValid(parsedDate)) {
    throw new Error(`Invalid birth date: ${birthDate}`);
  }

  return parsedDate.getFullYear();
}

function validateProjectionInputs(inputs: PlannerInputs): void {
  if (inputs.startAge > inputs.endAge) {
    throw new Error('startAge cannot be greater than endAge.');
  }

  if (inputs.tradIra < 0 || inputs.rothIra < 0) {
    throw new Error('Retirement account balances cannot be negative.');
  }

  if (inputs.annualSpend < 0) {
    throw new Error('Annual spending cannot be negative.');
  }

  if (inputs.inflation <= -1) {
    throw new Error('Inflation must be greater than -100%.');
  }
}

function calculatePortfolioReturn(economicYear: EconomicYear, allocation: AssetAllocation): number {
  const totalWeight = allocation.stocks + allocation.bonds + allocation.cash + allocation.other;

  if (Math.abs(totalWeight - 1) > 0.000001) {
    throw new Error('Asset-allocation weights must total 100%.');
  }

  return (
    allocation.stocks * economicYear.stockReturn +
    allocation.bonds * economicYear.bondReturn +
    allocation.cash * economicYear.cashReturn +
    allocation.other * economicYear.otherReturn
  );
}

export function calculateRetirementProjection(
  inputs: PlannerInputs,
  ssIncome: SSMonthlyIncome[],
  colaSettings: SSColaSettings,
  assetAllocation: AssetAllocation,
  retirementScenario: RetirementScenario,
  context: RetirementCalculationContext
): RetirementYear[] {
  //console.log('calculateRetirementProjection: inputs=', inputs);
  //console.log('calculateRetirementProjection: ssIncome=', ssIncome);
  //console.log('calculateRetirementProjection: colaSettings=', colaSettings);
  //console.log('calculateRetirementProjection: retirementScenario=', retirementScenario);
  validateProjectionInputs(inputs);

  const birthYear = getBirthYear(inputs.birthDate);
  const startYear = birthYear + inputs.startAge;
  const projectionYears = inputs.endAge - inputs.startAge + 1;
  const configuredAnnualRothConv = getAnnualRothConversion(inputs, retirementScenario);
  const years: RetirementYear[] = [];

  let tradIra = inputs.tradIra;
  let rothIra = inputs.rothIra;
  let taxableAcct = inputs.taxableAcct;

  if (inputs.tradIra < 0 || inputs.rothIra < 0 || inputs.taxableAcct < 0) {
    throw new Error('Account balances cannot be negative.');
  }

  if (projectionYears <= 0) {
    throw new Error(`Invalid projection range: startAge=${inputs.startAge}, endAge=${inputs.endAge}.`);
  }

  if (context.economicScenario.years.length < projectionYears) {
    throw new Error(
      `Economic scenario contains ${context.economicScenario.years.length} years, but the retirement projection requires ${projectionYears}.`
    );
  }

  for (let age = inputs.startAge; age <= inputs.endAge; age++) {
    const yearIndex = age - inputs.startAge;
    const year = startYear + yearIndex;

    // Spending inflation should also come from the scenario
    let spending = inputs.annualSpend;

    for (let age = inputs.startAge; age <= inputs.endAge; age++) {
      // Calculate this year using spending
      const yearIndex = age - inputs.startAge;
      const economicYear = context.economicScenario.years[yearIndex];
      if (yearIndex > 0) {
        spending *= 1 + economicYear.inflation;
      }
    }

    // Social Security should similarly apply each year's COLA sequentially:
    const baseAnnualSS = (ssIncome.find((i) => i.age === retirementScenario.claimAge)?.amount ?? 0) * 12;

    let socialSecurity = 0;

    for (let age = inputs.startAge; age <= inputs.endAge; age++) {
      const yearIndex = age - inputs.startAge;
      const economicYear = context.economicScenario.years[yearIndex];

      if (age === retirementScenario.claimAge) {
        socialSecurity = baseAnnualSS;
      } else if (age > retirementScenario.claimAge) {
        socialSecurity *= 1 + economicYear.socialSecurityCola;
      }
    }

    const startTradIra = tradIra;
    const startRothIra = rothIra;
    const startTaxableAcct = taxableAcct;

    /*
     * Use an economic scenario to calculate the portfolio return for this year.
     * If no scenario is provided, use the expected return from inputs.
     */
    const economicYear = context.economicScenario.years[yearIndex];

    if (!economicYear) {
      throw new Error(`Economic assumptions are missing for projection year ${year}.`);
    }

    const portfolioReturn = calculatePortfolioReturn(economicYear, assetAllocation);

    const tradGrowth = startTradIra * portfolioReturn;
    const rothGrowth = startRothIra * portfolioReturn;

    /*
     * This model applies the annual return before distributions.
     * A production model could instead support monthly cash flows or
     * configurable beginning/middle/end-of-year timing.
     */
    const availableTradIra = Math.max(0, startTradIra + tradGrowth);
    const availableRothIra = Math.max(0, startRothIra + rothGrowth);
    const availableTaxableAcct = startTaxableAcct; // Assumes a non-interest-bearing account

    const rmdFactor = RMD_FACTORS[age];
    const rmd = age >= inputs.rmdStartAge ? Math.min(startTradIra, startTradIra / rmdFactor) : 0;

    const requestedRothConversion =
      age < inputs.stopConvAge ? Math.min(configuredAnnualRothConv, Math.max(0, availableTradIra - rmd)) : 0;

    const withdrawalSolution = solveTraditionalWithdrawal(
      age,
      availableTradIra,
      requestedRothConversion,
      rmd,
      spending,
      socialSecurity,
      context
    );

    const {
      tradCashWithdraw,
      rothConv,
      traditionalDist,
      taxableSS,
      federalAgi,
      federalTaxableIncome,
      federalTax,
      stateTaxableIncome,
      stateTax,
      totalTax,
      cashSurplus
    } = withdrawalSolution;

    /*
     * Preserve excess Social Security or mandatory traditional
     * distributions in the non-interest-bearing taxable cash account.
     */
    const taxableAcctDeposit = Math.max(0, cashSurplus);

    /*
     * Traditional withdrawals retain first priority. Taxable cash is used
     * only when the traditional-withdrawal solver cannot cover the entire
     * spending and tax requirement.
     */
    const cashNeedAfterTraditional = Math.max(0, -cashSurplus);
    const taxableAcctWithdraw = Math.min(availableTaxableAcct, cashNeedAfterTraditional);
    const cashNeedAfterTaxable = cashNeedAfterTraditional - taxableAcctWithdraw;

    /*
     * The conversion is added to the Roth balance before any Roth
     * withdrawal is taken. This matches the behavior of the original
     * implementation, but a more detailed model may need to enforce
     * Roth conversion seasoning rules and distinguish contributions,
     * conversions, and earnings.
     */
    const rothFundsAvailable = availableRothIra + rothConv;
    const rothWithdraw = Math.min(rothFundsAvailable, cashNeedAfterTaxable);
    const unfundedNeed = Math.max(0, cashNeedAfterTaxable - rothWithdraw);

    tradIra = Math.max(0, availableTradIra - traditionalDist);
    rothIra = Math.max(0, rothFundsAvailable - rothWithdraw);
    taxableAcct = Math.max(0, availableTaxableAcct + taxableAcctDeposit - taxableAcctWithdraw);

    const endPortfolio = tradIra + rothIra + taxableAcct;

    years.push({
      age,
      year,
      spending,
      socialSecurity,

      startTradIra,
      startRothIra,
      startTaxableAcct,

      tradGrowth,
      rothGrowth,

      rmd,
      tradCashWithdraw,
      rothConv,
      traditionalDist,

      taxableSS,
      federalAgi,
      federalTaxableIncome,
      federalTax,
      stateTaxableIncome,
      stateTax,
      totalTax,

      taxableAcctDeposit,
      taxableAcctWithdraw,
      rothWithdraw,

      endTradlIra: tradIra,
      endRothIra: rothIra,
      endTaxableAcct: taxableAcct,
      endPortfolio: endPortfolio,

      unfundedNeed
    });
  }

  return years;
}
