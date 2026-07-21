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

export function selectTaxConfiguration<T extends JurisdictionTaxConfig>(
  configurations: readonly T[],
  filingStatus: FilingStatus
): T {
  const configuration = configurations.find((item) => item.filingStatus === filingStatus);
  if (!configuration) throw new Error(`Missing ${filingStatus} tax configuration.`);
  return configuration;
}

export function selectStateTaxConfiguration(
  configurations: readonly StateTaxConfig[],
  stateCode: StateCode,
  filingStatus: FilingStatus
): StateTaxConfig {
  const configuration = configurations.find(
    (item) => item.stateCode === stateCode && item.filingStatus === filingStatus
  );
  if (!configuration) throw new Error(`Missing ${stateCode} ${filingStatus} tax configuration.`);
  return configuration;
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
