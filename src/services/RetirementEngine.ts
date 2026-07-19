import {
  RothConversionType,
  RetirementYear,
  PlannerInputs,
  SSMonthlyIncome,
  SSColaSettings,
  RetirementScenario,
  AssetAllocation,
  SSBenefitValueType
} from '../models/RetirementTypes';

import { convertCurrentDollarsToYear, getAnnualSSCola, getDefaultRmdStartAge } from './SocialSecurityEngine';
import { calculateFederalTax, calculateStateTax } from './TaxEngine';
import { EconomicScenario, EconomicYear } from './EconomicScenarioEngine';

import { RMD_FACTORS } from '../data/rmdFactors';
import { isValid } from 'date-fns';

import type { FederalTaxConfig, StateTaxConfig } from '../models/TaxTypes';

/*
  jlw - TO DO: First-year timing can materially overstate or understate results

  The model treats every age/year as a complete calendar year:
  year = birthYear + age;

  It applies:
  A full year of spending.
  A full year of investment growth.
  Twelve months of Social Security in the claiming year.
  A full annual conversion and distribution.

  For someone starting a projection partway through the current year, that can be materially inaccurate.

  Add an asOfDate to PlannerInputs and prorate the first calendar year:
  const firstYearFraction = remainingDaysInYear / totalDaysInYear;

  Use the fraction for first-year spending and deterministic returns:
  firstYearSpending = inputs.annualSpend * firstYearFraction;

  firstYearReturn = Math.pow(1 + annualReturn, firstYearFraction) - 1;

  Social Security should use the number of payable months in the claiming year rather than automatically paying 12 months.
*/

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
  const rmdStartAge = getDefaultRmdStartAge(inputs.birthDate);
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

  if (inputs.ssBenefitValueType === SSBenefitValueType.ActualCurrentBenefit) {
    if (!Number.isFinite(inputs.actualMonthlySS) || inputs.actualMonthlySS < 0) {
      throw new Error('Actual monthly Social Security must be nonnegative.');
    }

    if (
      !Number.isInteger(inputs.actualBenefitYear) ||
      inputs.actualBenefitYear < 1900 ||
      inputs.actualBenefitYear > startYear
    ) {
      throw new Error('Actual benefit year cannot be after the projection start year.');
    }
  }

  // Init Social Security
  let spending = inputs.annualSpend;
  // let socialSecurity = 0;

  // // Adjust SS benefits to current dollar estimates
  // // baseAnnualSS is the annual nominal Social Security benefit in the hypothetical claiming year
  // const monthlyAtClaimAge = ssIncome.find((item) => item.age === retirementScenario.claimAge)?.amount ?? 0;

  // const claimYear = birthYear + retirementScenario.claimAge;

  // let baseAnnualSS = monthlyAtClaimAge * 12;

  // if (inputs.ssBenefitValueType === SSBenefitValueType.CurrentDollars) {
  //   baseAnnualSS = convertCurrentDollarsToYear(baseAnnualSS, inputs.ssEstimateYear, claimYear, colaSettings, inputs);
  // }

  // // Initialize the benefit through the projection start age
  // if (inputs.startAge >= retirementScenario.claimAge) {
  //   socialSecurity = baseAnnualSS;

  //   for (let benefitAge = retirementScenario.claimAge + 1; benefitAge <= inputs.startAge; benefitAge++) {
  //     const benefitYear = birthYear + benefitAge;
  //     const cola = getAnnualSSCola(benefitYear, colaSettings, inputs);
  //     socialSecurity *= 1 + cola;
  //   }
  // }
  let socialSecurity = 0;
  let baseAnnualSS = 0;

  const alreadyReceivingBenefits = inputs.ssBenefitValueType === SSBenefitValueType.ActualCurrentBenefit;

  if (alreadyReceivingBenefits) {
    /*
     * The entered payment is the amount being received in
     * actualBenefitYear.
     */
    baseAnnualSS = inputs.actualMonthlySS * 12;

    /*
     * Advance that payment to the projection start year if the
     * projection begins later.
     */
    for (let year = inputs.actualBenefitYear + 1; year <= startYear; year++) {
      baseAnnualSS *= 1 + getAnnualSSCola(year, colaSettings, inputs);
    }

    socialSecurity = baseAnnualSS;
  } else {
    if (retirementScenario.claimAge === null) {
      throw new Error('Estimated-benefit scenario requires a claim age.');
    }

    const monthlyAtClaimAge = ssIncome.find((item) => item.age === retirementScenario.claimAge)?.amount ?? 0;

    const claimYear = birthYear + retirementScenario.claimAge;

    baseAnnualSS = monthlyAtClaimAge * 12;

    if (inputs.ssBenefitValueType === SSBenefitValueType.CurrentDollars) {
      baseAnnualSS = convertCurrentDollarsToYear(baseAnnualSS, inputs.ssEstimateYear, claimYear, colaSettings, inputs);
    }

    /*
     * Initialize a hypothetical benefit that began before the
     * projection start.
     */
    if (inputs.startAge >= retirementScenario.claimAge) {
      socialSecurity = baseAnnualSS;

      for (let benefitAge = retirementScenario.claimAge + 1; benefitAge <= inputs.startAge; benefitAge++) {
        const benefitYear = birthYear + benefitAge;

        socialSecurity *= 1 + getAnnualSSCola(benefitYear, colaSettings, inputs);
      }
    }
  }

  // Update benefits inside the annual loop
  const claimAge = alreadyReceivingBenefits ? null : retirementScenario.claimAge;

  if (!alreadyReceivingBenefits && claimAge === null) {
    throw new Error('Estimated-benefit scenario requires a claim age.');
  }

  for (let age = inputs.startAge; age <= inputs.endAge; age++) {
    const yearIndex = age - inputs.startAge;
    const year = startYear + yearIndex;
    const economicYear = context.economicScenario.years[yearIndex];

    if (!economicYear) {
      throw new Error(`Economic assumptions are missing for projection year ${year}.`);
    }

    // Do we keep the "spending" change???
    // if (yearIndex > 0) {
    //   spending *= 1 + economicYear.inflation;
    // }

    // if (age < retirementScenario.claimAge) {
    //   socialSecurity = 0;
    // } else if (age === retirementScenario.claimAge) {
    //   socialSecurity = baseAnnualSS;
    // } else if (age > inputs.startAge) {
    //   socialSecurity *= 1 + economicYear.socialSecurityCola;
    // }
    if (alreadyReceivingBenefits) {
      if (yearIndex > 0) {
        socialSecurity *= 1 + economicYear.socialSecurityCola;
      }
    } else {
      if (age < claimAge) {
        socialSecurity = 0;
      } else if (age === claimAge) {
        socialSecurity = baseAnnualSS;
      } else if (age > inputs.startAge) {
        socialSecurity *= 1 + economicYear.socialSecurityCola;
      }
    }

    const startTradIra = tradIra;
    const startRothIra = rothIra;
    const startTaxableAcct = taxableAcct;

    const portfolioReturn = calculatePortfolioReturn(economicYear, assetAllocation);

    /*
     * This model applies the annual return before distributions.
     * A production model could instead support monthly cash flows or
     * configurable beginning/middle/end-of-year timing.
     */

    /*
      jlw - TO DO: Full-year growth before withdrawals remains optimistic
      
      The engine currently applies a full annual return to the entire starting balance before any spending withdrawals:
      const tradGrowth = startTradIra * portfolioReturn;

      That assumes all withdrawals occur at year-end. A midpoint approximation would be more neutral, but it requires calculating cash flows before finalizing growth.
      
      A simpler initial approach is to expose timing:
      type CashFlowTiming = 'beginning' | 'midyear' | 'end';

      ***Or use a monthly engine. For a long retirement projection, sequence and withdrawal timing can significantly affect depletion age.  
      
      A monthly projection is better, but midpoint timing is a meaningful improvement without greatly increasing complexity:
      const growth = startTradIra * portfolioReturn - 0.5 * netAnnualOutflow * annualReturn;

      Or, a simpler approximation:
      const estimatedTradOutflow = estimatedCashWithdrawal + requestedRothConversion;
      const averageTradBalance = Math.max(0, startTradIra - estimatedTradOutflow / 2);
      const tradGrowth = averageTradBalance * portfolioReturn;
    */

    const tradGrowth = startTradIra * portfolioReturn;
    const availableTradIra = Math.max(0, startTradIra + tradGrowth);

    const rothGrowth = startRothIra * portfolioReturn;
    const availableRothIra = Math.max(0, startRothIra + rothGrowth);

    const availableTaxableAcct = startTaxableAcct; // Assumes a non-interest-bearing account

    const rmdFactor = RMD_FACTORS[age];

    if (age >= rmdStartAge && rmdFactor === undefined) {
      throw new Error(`Missing RMD factor for age ${age}.`);
    }

    const rmd = age >= rmdStartAge ? Math.min(startTradIra, startTradIra / rmdFactor) : 0;

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

    /*
      A Roth conversion made during the year can immediately fund that same year’s spending. 
      This can make the conversion scenarios behave unexpectedly, especially when the traditional account is nearly depleted.

      Whether converted principal is legally or strategically available depends on age and Roth holding-period details, 
      but excluding same-year conversions from spendable funds is the safer planning assumption.
    */
    // Track converted funds separately
    const existingRothFundsAvailable = availableRothIra;
    const rothWithdraw = Math.min(existingRothFundsAvailable, cashNeedAfterTaxable);

    //const rothFundsAvailable = availableRothIra + rothConv;
    //const rothWithdraw = Math.min(rothFundsAvailable, cashNeedAfterTaxable);

    tradIra = Math.max(0, availableTradIra - traditionalDist);
    //rothIra = Math.max(0, rothFundsAvailable - rothWithdraw);
    rothIra = existingRothFundsAvailable + rothConv - rothWithdraw;
    taxableAcct = Math.max(0, availableTaxableAcct + taxableAcctDeposit - taxableAcctWithdraw);

    const endPortfolio = tradIra + rothIra + taxableAcct;
    const unfundedNeed = Math.max(0, cashNeedAfterTaxable - rothWithdraw);

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
