import {
  RothConversionType,
  RetirementYear,
  PlannerInputs,
  SSMonthlyIncome,
  SSColaSettings,
  RetirementScenario,
  AssetAllocation,
  SSBenefitValueType,
  MedicareModelType
} from '../models/RetirementTypes';

import { convertCurrentDollarsToYear, getAnnualSSCola, getDefaultRmdStartAge } from './SocialSecurityEngine';
import {
  calculateFederalTax,
  calculateStateTax,
  resolveFederalTaxConfiguration,
  resolveStateTaxConfiguration,
  type ResolvedTaxConfiguration
} from './TaxEngine';
import { EconomicScenario, EconomicYear } from './EconomicScenarioEngine';

import { RMD_FACTORS } from '../data/rmdFactors';

import type { FederalTaxConfig, StateTaxConfig } from '../models/TaxTypes';
import { getBirthYear, getProjectionPeriod } from '../utils/projectionDates';
import { calculateIrmaaEstimate, resolveIrmaaConfiguration } from './IrmaaEngine';
import type { IrmaaConfiguration, IrmaaFilingStatus } from '../data/irmaaTables';

/*
 * Projection timing contract:
 *
 * - Every row is a complete calendar year.
 * - Initial balances are January 1 balances.
 * - Ending balances are December 31 balances.
 * - Age is the age attained during the calendar year.
 * - Investment returns are split into two compounded
 *   half-year periods.
 * - Annual income, spending, taxes, withdrawals, RMDs,
 *   and conversions are modeled at midyear.
 * - Taxable cash is non-interest-bearing.
 */

const WITHDRAWAL_TOLERANCE = 0.01;
const MAX_SOLVER_ITERATIONS = 100;

export interface RetirementCalculationContext {
  federalTaxConfigurations: readonly FederalTaxConfig[];
  stateTaxConfigurations: readonly StateTaxConfig[];
  economicScenario: EconomicScenario;
  irmaaConfigurations?: readonly IrmaaConfiguration[];
}

interface AnnualTaxCalculationContext {
  federalTaxConfig: FederalTaxConfig;
  stateTaxConfig: StateTaxConfig;
}

export interface ResolvedProjectionTaxConfigurations {
  federal: ResolvedTaxConfiguration<FederalTaxConfig>;
  state: ResolvedTaxConfiguration<StateTaxConfig>;
}

function toIrmaaFilingStatus(filingStatus: PlannerInputs['filingStatus']): IrmaaFilingStatus {
  if (filingStatus === 'marriedFilingJointly') return 'marriedJoint';
  if (filingStatus === 'marriedFilingSeparately') return 'marriedSeparate';
  return 'single';
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
  stateTaxableSocialSecurity: number;
  stateRetirementIncomeExclusion: number;
  statePersonalCredit: number;

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
  context: AnnualTaxCalculationContext
): WithdrawalEvaluation {
  const tradCashWithdraw = Math.min(availableTradIra, Math.max(0, proposedCashWithdrawal));
  const rothConv = Math.min(requestedRothConversion, Math.max(0, availableTradIra - tradCashWithdraw));
  const traditionalDist = tradCashWithdraw + rothConv;
  const federal = calculateFederalTax(age, traditionalDist, socialSecurity, context.federalTaxConfig);
  const state = calculateStateTax(
    age,
    traditionalDist,
    socialSecurity,
    federal.taxableSS,
    context.stateTaxConfig
  );
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
    stateTaxableSocialSecurity: state.stateTaxableSocialSecurity,
    stateRetirementIncomeExclusion: state.stateRetirementIncomeExclusion,
    statePersonalCredit: state.personalCredit,
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
  context: AnnualTaxCalculationContext
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

function getAnnualRothConversion(inputs: PlannerInputs, scenario: RetirementScenario, age: number): number {
  const scheduledConversion = scenario.rothConversionSchedule?.[age];

  if (scheduledConversion !== undefined) {
    return Math.max(0, scheduledConversion);
  }

  switch (scenario.rothConvType) {
    case RothConversionType.Fixed:
      return inputs.annualRothConversion;

    default:
      return 0;
  }
}

function requireNonnegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative finite number.`);
  }
}

function validateProjectionInputs(inputs: PlannerInputs): void {
  if (!Number.isInteger(inputs.startAge) || !Number.isInteger(inputs.endAge)) {
    throw new Error('Start and end ages must be integers.');
  }

  if (inputs.startAge > inputs.endAge) {
    throw new Error('Start age cannot exceed end age.');
  }

  if (
    !Number.isInteger(inputs.horizonAge) ||
    inputs.horizonAge < inputs.startAge ||
    inputs.horizonAge > inputs.endAge
  ) {
    throw new Error('Horizon age must be an integer within the projection.');
  }

  if (!Number.isInteger(inputs.stopConvAge)) {
    throw new Error('First age with no conversion must be an integer.');
  }

  requireNonnegativeFinite(inputs.tradIra, 'Traditional IRA balance');
  requireNonnegativeFinite(inputs.rothIra, 'Roth IRA balance');
  requireNonnegativeFinite(inputs.taxableAcct, 'Taxable account balance');
  requireNonnegativeFinite(inputs.annualSpend, 'Annual spending');
  requireNonnegativeFinite(inputs.annualRothConversion, 'Annual fixed Roth conversion');
  if (inputs.medicareModel === MedicareModelType.Custom) {
    requireNonnegativeFinite(inputs.monthlyPartDOtherPremium, 'Monthly Part D or other coverage premium');
    requireNonnegativeFinite(inputs.annualOutOfPocketHealthcare, 'Annual out-of-pocket healthcare');
    requireNonnegativeFinite(inputs.irmaaMagiTwoYearsPrior, 'IRMAA MAGI from two years before the projection');
    requireNonnegativeFinite(inputs.irmaaMagiOneYearPrior, 'IRMAA MAGI from one year before the projection');

    if (!Number.isInteger(inputs.medicareStartAge) || inputs.medicareStartAge < 65 || inputs.medicareStartAge > 95) {
      throw new Error('Medicare start age must be an integer from 65 through 95.');
    }
  }

  if (!Number.isFinite(inputs.inflation) || inputs.inflation <= -1) {
    throw new Error('Inflation must be finite and greater than -100%.');
  }
}

function calculatePortfolioReturn(economicYear: EconomicYear, allocation: AssetAllocation): number {
  const weights = [
    allocation.domesticStocks,
    allocation.internationalStocks,
    allocation.bonds,
    allocation.cash,
    allocation.other
  ];

  if (weights.some((weight) => !Number.isFinite(weight) || weight < 0)) {
    throw new Error('Asset-allocation weights must be nonnegative finite numbers.');
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  if (Math.abs(totalWeight - 1) > 0.000001) {
    throw new Error('Asset-allocation weights must total 100%.');
  }

  const portfolioReturn =
    allocation.domesticStocks * economicYear.domesticStockReturn +
    allocation.internationalStocks * economicYear.internationalStockReturn +
    allocation.bonds * economicYear.bondReturn +
    allocation.cash * economicYear.cashReturn +
    allocation.other * economicYear.otherReturn;

  if (!Number.isFinite(portfolioReturn) || portfolioReturn < -1) {
    throw new Error(`Invalid portfolio return for ${economicYear.year}.`);
  }

  return portfolioReturn;
}

function annualToHalfYearReturn(annualReturn: number): number {
  if (!Number.isFinite(annualReturn) || annualReturn < -1) {
    throw new Error('Annual return must be finite and cannot be below -100%.');
  }

  return Math.sqrt(1 + annualReturn) - 1;
}

function calculateProjectionInflationFactor(
  configurationYear: number,
  premiumYear: number,
  projectionStartYear: number,
  economicScenario: EconomicScenario,
  defaultInflation: number
): number {
  if (configurationYear === premiumYear) return 1;

  const inflationForYear = (year: number) => {
    if (year <= projectionStartYear) return defaultInflation;
    return economicScenario.years[year - projectionStartYear]?.inflation ?? defaultInflation;
  };

  let factor = 1;
  if (premiumYear > configurationYear) {
    for (let year = configurationYear + 1; year <= premiumYear; year += 1) {
      factor *= 1 + inflationForYear(year);
    }
  } else {
    for (let year = premiumYear + 1; year <= configurationYear; year += 1) {
      factor /= 1 + inflationForYear(year);
    }
  }
  return factor;
}

/**
 * Resolves the tax tables used for a single projection year.
 *
 * An exact table for the requested year wins. Otherwise, monetary thresholds,
 * deductions, credits, and exclusions from the nearest usable source table are
 * adjusted by the modeled inflation path.
 */
export function resolveProjectionTaxConfigurations(
  inputs: PlannerInputs,
  projectionYear: number,
  context: RetirementCalculationContext,
  projectionStartYear = getProjectionPeriod(inputs.birthDate, inputs.startAge, inputs.endAge).startYear
): ResolvedProjectionTaxConfigurations {
  const inflationFactorForSourceYear = (sourceYear: number) =>
    calculateProjectionInflationFactor(
      sourceYear,
      projectionYear,
      projectionStartYear,
      context.economicScenario,
      inputs.inflation
    );

  return {
    federal: resolveFederalTaxConfiguration(
      context.federalTaxConfigurations,
      inputs.filingStatus,
      projectionYear,
      inflationFactorForSourceYear
    ),
    state: resolveStateTaxConfiguration(
      context.stateTaxConfigurations,
      inputs.residenceState,
      inputs.filingStatus,
      projectionYear,
      inflationFactorForSourceYear
    )
  };
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
  const period = getProjectionPeriod(inputs.birthDate, inputs.startAge, inputs.endAge);
  const startYear = period.startYear;
  const projectionYears = period.yearCount;
  const rmdStartAge = getDefaultRmdStartAge(inputs.birthDate);
  const years: RetirementYear[] = [];

  let tradIra = inputs.tradIra;
  let rothIra = inputs.rothIra;
  let taxableAcct = inputs.taxableAcct;

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

  const claimAge = alreadyReceivingBenefits ? null : retirementScenario.claimAge;

  if (!alreadyReceivingBenefits && claimAge === null) {
    throw new Error('Estimated-benefit scenario requires a claim age.');
  }

  let annualSpending = inputs.annualSpend;
  let inflationIndex = 1;
  const usesSimpleMedicareModel = inputs.medicareModel === MedicareModelType.SimpleDeterministic;
  const medicareStartAge = usesSimpleMedicareModel ? 65 : inputs.medicareStartAge;
  const annualSpendingIncludesHealthcare = usesSimpleMedicareModel ? true : inputs.annualSpendingIncludesHealthcare;
  const monthlyPartDOtherPremium = usesSimpleMedicareModel ? 0 : inputs.monthlyPartDOtherPremium;
  const annualOutOfPocketHealthcare = usesSimpleMedicareModel ? 0 : inputs.annualOutOfPocketHealthcare;
  const irmaaMagiTwoYearsPrior = usesSimpleMedicareModel ? 0 : inputs.irmaaMagiTwoYearsPrior;
  const irmaaMagiOneYearPrior = usesSimpleMedicareModel ? 0 : inputs.irmaaMagiOneYearPrior;
  const irmaaFilingStatus = toIrmaaFilingStatus(inputs.filingStatus);

  // Update benefits inside the annual loop
  for (let age = inputs.startAge; age <= inputs.endAge; age++) {
    // The age value is the age attained during this calendar year.
    // It does not necessarily mean the person is already that age on January 1.
    const yearIndex = age - inputs.startAge;
    const year = startYear + yearIndex;

    const economicYear = context.economicScenario.years[yearIndex];

    if (!economicYear) {
      throw new Error(`Economic assumptions are missing for projection year ${year}.`);
    }

    if (economicYear.year !== year) {
      throw new Error(
        `Economic scenario year mismatch at index ${yearIndex}: ` + `expected ${year}, received ${economicYear.year}.`
      );
    }

    const resolvedTaxConfigurations = resolveProjectionTaxConfigurations(
      inputs,
      year,
      context,
      startYear
    );
    const annualTaxContext: AnnualTaxCalculationContext = {
      federalTaxConfig: resolvedTaxConfigurations.federal.configuration,
      stateTaxConfig: resolvedTaxConfigurations.state.configuration
    };

    if (yearIndex > 0) {
      const annualInflationFactor = 1 + economicYear.inflation;
      annualSpending *= annualInflationFactor;
      inflationIndex *= annualInflationFactor;
    }

    const irmaaLookbackMagi =
      yearIndex >= 2
        ? years[yearIndex - 2].irmaaMagi
        : yearIndex === 1
          ? irmaaMagiOneYearPrior
          : irmaaMagiTwoYearsPrior;
    const resolvedIrmaa = resolveIrmaaConfiguration(year, irmaaFilingStatus, context.irmaaConfigurations);
    const irmaaInflationFactor = calculateProjectionInflationFactor(
      resolvedIrmaa.configuration.premiumYear,
      year,
      startYear,
      context.economicScenario,
      inputs.inflation
    );
    const irmaaEstimate = calculateIrmaaEstimate(
      irmaaLookbackMagi,
      year,
      irmaaInflationFactor,
      irmaaFilingStatus,
      context.irmaaConfigurations
    );
    const isMedicareEligible = age >= medicareStartAge;
    const irmaaTier = isMedicareEligible ? irmaaEstimate.tier : 0;
    const annualIrmaaSurcharge = isMedicareEligible ? irmaaEstimate.annualSurcharge : 0;
    const standardPartBPremium = isMedicareEligible ? irmaaEstimate.standardPartBMonthlyPremium * 12 : 0;
    const partDOtherPremium = isMedicareEligible ? monthlyPartDOtherPremium * 12 * inflationIndex : 0;
    const outOfPocketHealthcare = isMedicareEligible ? annualOutOfPocketHealthcare * inflationIndex : 0;
    const totalMedicareHealthcareCost =
      standardPartBPremium + partDOtherPremium + outOfPocketHealthcare + annualIrmaaSurcharge;
    const medicareHealthcareAddedToSpending = annualSpendingIncludesHealthcare ? 0 : totalMedicareHealthcareCost;
    const spending = annualSpending + medicareHealthcareAddedToSpending;

    if (alreadyReceivingBenefits) {
      if (yearIndex > 0) {
        socialSecurity *= 1 + economicYear.socialSecurityCola;
      }
    } else {
      if (claimAge !== null && age < claimAge) {
        socialSecurity = 0;
      } else if (claimAge !== null && age === claimAge) {
        socialSecurity = baseAnnualSS;
      } else if (age > inputs.startAge) {
        socialSecurity *= 1 + economicYear.socialSecurityCola;
      }
    }

    const startTradIra = tradIra;
    const startRothIra = rothIra;
    const startTaxableAcct = taxableAcct;

    const portfolioReturn = calculatePortfolioReturn(economicYear, assetAllocation);
    const halfYearReturn = annualToHalfYearReturn(portfolioReturn);

    /*
     * First-half investment growth.
     */
    const firstHalfTradGrowth = startTradIra * halfYearReturn;
    const tradIraAtMidyear = Math.max(0, startTradIra + firstHalfTradGrowth);
    const firstHalfRothGrowth = startRothIra * halfYearReturn;
    const rothIraAtMidyear = Math.max(0, startRothIra + firstHalfRothGrowth);
    const availableTaxableAcct = startTaxableAcct;

    /*
     * RMD remains based on the January 1 balance.
     */
    const rmdFactor = RMD_FACTORS[age];

    if (age >= rmdStartAge && rmdFactor === undefined) {
      throw new Error(`Missing RMD factor for age ${age}.`);
    }

    const rmd = age >= rmdStartAge ? startTradIra / rmdFactor : 0;

    /*
     * Conversions and withdrawals occur at midyear.
     */
    const requestedRothConversion =
      age < inputs.stopConvAge
        ? Math.min(
            getAnnualRothConversion(inputs, retirementScenario, age),
            Math.max(0, tradIraAtMidyear - rmd)
          )
        : 0;

    const withdrawalSolution = solveTraditionalWithdrawal(
      age,
      tradIraAtMidyear,
      requestedRothConversion,
      rmd,
      spending,
      socialSecurity,
      annualTaxContext
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
      stateTaxableSocialSecurity,
      stateRetirementIncomeExclusion,
      statePersonalCredit,
      totalTax,
      cashSurplus
    } = withdrawalSolution;

    const taxableAcctDeposit = Math.max(0, cashSurplus);
    const cashNeedAfterTraditional = Math.max(0, -cashSurplus);

    const taxableAcctWithdraw = Math.min(availableTaxableAcct, cashNeedAfterTraditional);

    const cashNeedAfterTaxable = cashNeedAfterTraditional - taxableAcctWithdraw;

    /*
     * Same-year conversions cannot fund spending.
     */
    const existingRothFundsAvailable = rothIraAtMidyear;
    const rothWithdraw = Math.min(existingRothFundsAvailable, cashNeedAfterTaxable);

    /*
     * Midyear balances after cash flows.
     */
    const tradIraAfterCashFlows = Math.max(0, tradIraAtMidyear - traditionalDist);
    const rothIraAfterCashFlows = Math.max(0, rothIraAtMidyear - rothWithdraw + rothConv);
    const taxableAcctAfterCashFlows = Math.max(0, availableTaxableAcct + taxableAcctDeposit - taxableAcctWithdraw);

    /*
     * Second-half investment growth.
     */
    const secondHalfTradGrowth = tradIraAfterCashFlows * halfYearReturn;
    const secondHalfRothGrowth = rothIraAfterCashFlows * halfYearReturn;

    const endTradlIra = Math.max(0, tradIraAfterCashFlows + secondHalfTradGrowth);
    const endRothIra = Math.max(0, rothIraAfterCashFlows + secondHalfRothGrowth);
    const endTaxableAcct = taxableAcctAfterCashFlows;

    const tradGrowth = firstHalfTradGrowth + secondHalfTradGrowth;
    const rothGrowth = firstHalfRothGrowth + secondHalfRothGrowth;
    const endPortfolio = endTradlIra + endRothIra + endTaxableAcct;
    const endPortfolioCurrentDollars = endPortfolio / inflationIndex;

    const unfundedNeed = Math.max(0, cashNeedAfterTaxable - rothWithdraw);

    // Under the planner's current assumptions, IRMAA MAGI equals federal AGI because
    // taxable savings earn no interest and no tax-exempt interest is modeled.
    const irmaaMagi = federalAgi;
    const irmaaMagiWithoutRothConversion = calculateFederalTax(
      age,
      tradCashWithdraw,
      socialSecurity,
      annualTaxContext.federalTaxConfig
    ).agi;
    const lookbackMagiWithoutRothConversion =
      yearIndex >= 2 ? years[yearIndex - 2].irmaaMagiWithoutRothConversion : irmaaLookbackMagi;
    const tierWithoutRothConversion = calculateIrmaaEstimate(
      lookbackMagiWithoutRothConversion,
      year,
      irmaaInflationFactor,
      irmaaFilingStatus,
      context.irmaaConfigurations
    ).tier;
    const rothConversionRaisesIrmaaTier = isMedicareEligible && yearIndex >= 2 && irmaaTier > tierWithoutRothConversion;

    /*
     * Carry December 31 balances into the following
     * year's January 1 balances.
     */
    tradIra = endTradlIra;
    rothIra = endRothIra;
    taxableAcct = endTaxableAcct;

    years.push({
      age,
      year,
      inflationIndex,
      spending,
      medicareEligible: isMedicareEligible,
      standardPartBPremium,
      partDOtherPremium,
      outOfPocketHealthcare,
      totalMedicareHealthcareCost,
      medicareHealthcareAddedToSpending,
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
      federalTaxConfigurationYear: resolvedTaxConfigurations.federal.sourceYear,
      federalTaxIsEstimated: resolvedTaxConfigurations.federal.isEstimated,
      stateTaxableIncome,
      stateTax,
      stateCode: annualTaxContext.stateTaxConfig.stateCode,
      stateTaxableSocialSecurity,
      stateRetirementIncomeExclusion,
      statePersonalCredit,
      stateTaxConfigurationYear: resolvedTaxConfigurations.state.sourceYear,
      stateTaxIsEstimated: resolvedTaxConfigurations.state.isEstimated,
      totalTax,
      irmaaMagi,
      irmaaMagiWithoutRothConversion,
      irmaaLookbackMagi,
      irmaaTier,
      annualIrmaaSurcharge,
      irmaaConfigurationYear: irmaaEstimate.configurationYear,
      irmaaIsEstimated: irmaaEstimate.isEstimated,
      irmaaIsPublished: irmaaEstimate.isPublished,
      rothConversionRaisesIrmaaTier,
      taxableAcctDeposit,
      taxableAcctWithdraw,
      rothWithdraw,
      endTradlIra,
      endRothIra,
      endTaxableAcct,
      endPortfolio,
      endPortfolioCurrentDollars,
      unfundedNeed
    });
  }

  return years;
}
