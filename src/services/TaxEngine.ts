import type {
  DeductionConfig,
  FederalTaxConfig,
  FilingStatus,
  JurisdictionTaxConfig,
  StateCode,
  StateTaxConfig,
  SocialSecurityTaxConfig,
  TaxBracket
} from '../models/TaxTypes';
import { NO_STATE_TAX_INFLATION_INDEXING } from '../models/TaxTypes';

export interface ResolvedTaxConfiguration<T extends JurisdictionTaxConfig> {
  configuration: T;
  sourceYear: number;
  projectionYear: number;
  isEstimated: boolean;
}

export function selectTaxConfiguration<T extends JurisdictionTaxConfig>(
  configurations: readonly T[],
  filingStatus: FilingStatus
): T {
  const configuration = configurations
    .filter((item) => item.filingStatus === filingStatus)
    .sort((left, right) => right.year - left.year)[0];
  if (!configuration) throw new Error(`Missing ${filingStatus} tax configuration.`);
  return configuration;
}

export function selectStateTaxConfiguration(
  configurations: readonly StateTaxConfig[],
  stateCode: StateCode,
  filingStatus: FilingStatus
): StateTaxConfig {
  const configuration = configurations
    .filter((item) => item.stateCode === stateCode && item.filingStatus === filingStatus)
    .sort((left, right) => right.year - left.year)[0];
  if (!configuration) throw new Error(`Missing ${stateCode} ${filingStatus} tax configuration.`);
  return configuration;
}

function selectConfigurationForProjectionYear<T extends JurisdictionTaxConfig>(
  configurations: readonly T[],
  projectionYear: number,
  missingConfigurationMessage: string
): T {
  const ordered = [...configurations].sort((left, right) => left.year - right.year);
  const exact = ordered.find((configuration) => configuration.year === projectionYear);
  const latestPrior = ordered.filter((configuration) => configuration.year < projectionYear).at(-1);
  const source = exact ?? latestPrior ?? ordered[0];

  if (!source) throw new Error(missingConfigurationMessage);
  return source;
}

function requireInflationFactor(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Tax-table inflation factor must be a positive finite number.');
  }
  return value;
}

function projectTaxBrackets(brackets: readonly TaxBracket[], inflationFactor: number): TaxBracket[] {
  return brackets.map((bracket) => ({
    ...bracket,
    lowerBound: bracket.lowerBound * inflationFactor,
    upperBound: bracket.upperBound === null ? null : bracket.upperBound * inflationFactor
  }));
}

function projectDeductions(deductions: DeductionConfig, inflationFactor: number): DeductionConfig {
  return {
    standardDeduction: deductions.standardDeduction * inflationFactor,
    additionalDeduction65: deductions.additionalDeduction65 * inflationFactor
  };
}

function projectFederalTaxConfiguration(
  source: FederalTaxConfig,
  projectionYear: number,
  inflationFactor: number
): FederalTaxConfig {
  return {
    ...source,
    year: projectionYear,
    brackets: projectTaxBrackets(source.brackets, inflationFactor),
    deductions: projectDeductions(source.deductions, inflationFactor),
    // Federal Social Security provisional-income thresholds are statutory
    // fixed-dollar amounts and are not inflation indexed.
    socialSecurity: source.socialSecurity
  };
}

function projectStateTaxConfiguration(
  source: StateTaxConfig,
  projectionYear: number,
  inflationFactor: number
): StateTaxConfig {
  const indexing = {
    ...NO_STATE_TAX_INFLATION_INDEXING,
    ...source.inflationIndexing
  };

  return {
    ...source,
    year: projectionYear,
    brackets: indexing.bracketThresholds
      ? projectTaxBrackets(source.brackets, inflationFactor)
      : source.brackets,
    deductions: {
      standardDeduction:
        source.deductions.standardDeduction *
        (indexing.standardDeduction ? inflationFactor : 1),
      additionalDeduction65:
        source.deductions.additionalDeduction65 *
        (indexing.additionalDeduction65 ? inflationFactor : 1)
    },
    socialSecurityExemptionIncomeLimit:
      source.socialSecurityExemptionIncomeLimit === undefined
        ? undefined
        : source.socialSecurityExemptionIncomeLimit *
          (indexing.socialSecurityExemptionIncomeLimit ? inflationFactor : 1),
    personalExemption:
      source.personalExemption *
      (indexing.personalExemption ? inflationFactor : 1),
    personalCredit:
      source.personalCredit * (indexing.personalCredit ? inflationFactor : 1),
    inflationIndexing: indexing,
    retirementIncomeExclusions: source.retirementIncomeExclusions.map((exclusion) => ({
      ...exclusion,
      maximumAmount:
        exclusion.maximumAmount === null
          ? null
          : exclusion.maximumAmount *
            (exclusion.maximumAmountInflationIndexed ? inflationFactor : 1),
      incomeLimit:
        exclusion.incomeLimit === undefined
          ? undefined
          : exclusion.incomeLimit *
            (exclusion.incomeLimitInflationIndexed ? inflationFactor : 1),
      phaseoutStart:
        exclusion.phaseoutStart === undefined
          ? undefined
          : exclusion.phaseoutStart *
            (exclusion.phaseoutStartInflationIndexed ? inflationFactor : 1)
    }))
  };
}

/**
 * Resolves the federal table for one projection year.
 *
 * Exact-year tables are used unchanged. If one is not available, the most
 * recent prior table (or the earliest future table for an earlier projection)
 * is inflation-adjusted to the projection year.
 */
export function resolveFederalTaxConfiguration(
  configurations: readonly FederalTaxConfig[],
  filingStatus: FilingStatus,
  projectionYear: number,
  inflationFactorForSourceYear: (sourceYear: number) => number
): ResolvedTaxConfiguration<FederalTaxConfig> {
  const matching = configurations.filter(
    (configuration) => configuration.filingStatus === filingStatus
  );
  const source = selectConfigurationForProjectionYear(
    matching,
    projectionYear,
    `Missing ${filingStatus} federal tax configuration.`
  );
  const isEstimated = source.year !== projectionYear;
  const inflationFactor = isEstimated
    ? requireInflationFactor(inflationFactorForSourceYear(source.year))
    : 1;

  return {
    configuration: isEstimated
      ? projectFederalTaxConfiguration(source, projectionYear, inflationFactor)
      : source,
    sourceYear: source.year,
    projectionYear,
    isEstimated
  };
}

/**
 * Resolves the state table for one projection year using the same exact-year
 * then inflation-adjusted fallback contract as the federal resolver.
 */
export function resolveStateTaxConfiguration(
  configurations: readonly StateTaxConfig[],
  stateCode: StateCode,
  filingStatus: FilingStatus,
  projectionYear: number,
  inflationFactorForSourceYear: (sourceYear: number) => number
): ResolvedTaxConfiguration<StateTaxConfig> {
  const matching = configurations.filter(
    (configuration) =>
      configuration.stateCode === stateCode &&
      configuration.filingStatus === filingStatus
  );
  const source = selectConfigurationForProjectionYear(
    matching,
    projectionYear,
    `Missing ${stateCode} ${filingStatus} state tax configuration.`
  );
  const usesProjectedYear = source.year !== projectionYear;
  const inflationFactor = usesProjectedYear
    ? requireInflationFactor(inflationFactorForSourceYear(source.year))
    : 1;

  return {
    configuration: usesProjectedYear
      ? projectStateTaxConfiguration(source, projectionYear, inflationFactor)
      : source,
    sourceYear: source.year,
    projectionYear,
    isEstimated: usesProjectedYear || source.estimated
  };
}

export function calculateProgressiveTax(taxableIncome: number, brackets: TaxBracket[]): number {
  if (!Number.isFinite(taxableIncome) || taxableIncome <= 0) return 0;
  return [...brackets]
    .sort((a, b) => a.lowerBound - b.lowerBound)
    .reduce((total, b) => {
      const upper = b.upperBound ?? Number.POSITIVE_INFINITY;
      return total + Math.max(0, Math.min(taxableIncome, upper) - b.lowerBound) * b.rate;
    }, 0);
}

export function calculateStandardDeduction(age: number, d: DeductionConfig): number {
  return d.standardDeduction + (age >= 65 ? d.additionalDeduction65 : 0);
}

export function calculateTaxableSocialSecurity(ss: number, other: number, c: SocialSecurityTaxConfig): number {
  if (ss <= 0) return 0;
  const p = other + ss * 0.5;
  if (p <= c.baseThreshold) return 0;
  if (p <= c.secondThreshold) return Math.min(ss * c.firstInclusionRate, (p - c.baseThreshold) * c.firstInclusionRate);
  const first = (c.secondThreshold - c.baseThreshold) * c.firstInclusionRate;
  return Math.min(ss * c.maximumInclusionRate, first + (p - c.secondThreshold) * c.maximumInclusionRate);
}

export function calculateFederalTax(age: number, dist: number, ss: number, c: FederalTaxConfig) {
  const taxableSS = calculateTaxableSocialSecurity(ss, dist, c.socialSecurity);
  const agi = dist + taxableSS;
  const taxableIncome = Math.max(0, agi - calculateStandardDeduction(age, c.deductions));
  return {
    taxableSS,
    agi,
    taxableIncome,
    tax: calculateProgressiveTax(taxableIncome, c.brackets)
  };
}

export function calculateStateTax(
  age: number,
  dist: number,
  socialSecurity: number,
  federalTaxableSocialSecurity: number,
  c: StateTaxConfig
) {
  let stateTaxableSocialSecurity =
    c.socialSecurityTreatment === 'federalTaxableAmount' ? federalTaxableSocialSecurity : 0;
  const incomeBeforeSocialSecurityExemption = dist + stateTaxableSocialSecurity;

  if (
    (c.socialSecurityExemptionAge !== undefined && age >= c.socialSecurityExemptionAge) ||
    (c.socialSecurityExemptionIncomeLimit !== undefined &&
      incomeBeforeSocialSecurityExemption <= c.socialSecurityExemptionIncomeLimit)
  ) {
    stateTaxableSocialSecurity = 0;
  }

  const incomeBeforeRetirementExclusion = dist + stateTaxableSocialSecurity;
  const applicableRetirementExclusion = [...c.retirementIncomeExclusions]
    .filter((exclusion) => age >= exclusion.minimumAge)
    .sort((a, b) => b.minimumAge - a.minimumAge)[0];

  let stateRetirementIncomeExclusion = 0;
  if (
    applicableRetirementExclusion &&
    (applicableRetirementExclusion.incomeLimit === undefined ||
      incomeBeforeRetirementExclusion <= applicableRetirementExclusion.incomeLimit)
  ) {
    let maximumAmount = applicableRetirementExclusion.maximumAmount ?? dist;
    if (applicableRetirementExclusion.reducedBySocialSecurity) {
      maximumAmount = Math.max(0, maximumAmount - socialSecurity);
    }
    if (applicableRetirementExclusion.phaseoutStart !== undefined) {
      maximumAmount = Math.max(
        0,
        maximumAmount - Math.max(0, incomeBeforeRetirementExclusion - applicableRetirementExclusion.phaseoutStart)
      );
    }
    stateRetirementIncomeExclusion = Math.min(dist, maximumAmount);
  }

  const beforeDeductions = Math.max(
    0,
    dist - stateRetirementIncomeExclusion + stateTaxableSocialSecurity
  );
  const taxableIncome = Math.max(
    0,
    beforeDeductions - calculateStandardDeduction(age, c.deductions) - c.personalExemption
  );
  const taxBeforeCredits = c.taxModel === 'none' ? 0 : calculateProgressiveTax(taxableIncome, c.brackets);
  const personalCredit = Math.min(taxBeforeCredits, c.personalCredit);
  return {
    stateTaxableSocialSecurity,
    stateRetirementIncomeExclusion,
    personalCredit,
    taxableIncome,
    tax: Math.max(0, taxBeforeCredits - personalCredit)
  };
}
