import type {
  DeductionConfig,
  FederalTaxConfig,
  StateTaxConfig,
  SocialSecurityTaxConfig,
  TaxBracket
} from '../models/TaxTypes';

export function calculateProgressiveTax(
  taxableIncome: number,
  brackets: TaxBracket[]
): number {
  if (!Number.isFinite(taxableIncome) || taxableIncome <= 0) return 0;
  return [...brackets]
    .sort((a, b) => a.lowerBound - b.lowerBound)
    .reduce((total, b) => {
      const upper = b.upperBound ?? Number.POSITIVE_INFINITY;
      return (
        total +
        Math.max(0, Math.min(taxableIncome, upper) - b.lowerBound) * b.rate
      );
    }, 0);
}

export function calculateStandardDeduction(
  age: number,
  d: DeductionConfig
): number {
  return d.standardDeduction + (age >= 65 ? d.additionalDeduction65 : 0);
}

export function calculateTaxableSocialSecurity(
  ss: number,
  other: number,
  c: SocialSecurityTaxConfig
): number {
  if (ss <= 0) return 0;
  const p = other + ss * 0.5;
  if (p <= c.baseThreshold) return 0;
  if (p <= c.secondThreshold)
    return Math.min(
      ss * c.firstInclusionRate,
      (p - c.baseThreshold) * c.firstInclusionRate
    );
  const first = (c.secondThreshold - c.baseThreshold) * c.firstInclusionRate;
  return Math.min(
    ss * c.maximumInclusionRate,
    first + (p - c.secondThreshold) * c.maximumInclusionRate
  );
}

export function calculateFederalTax(
  age: number,
  dist: number,
  ss: number,
  c: FederalTaxConfig
) {
  const taxableSS = calculateTaxableSocialSecurity(
    ss,
    dist,
    c.socialSecurity
  );
  const agi = dist + taxableSS;
  const taxableIncome = Math.max(
    0,
    agi - calculateStandardDeduction(age, c.deductions)
  );
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
  taxableSS: number,
  c: StateTaxConfig
) {
  const before = dist + (c.taxesSocialSecurity ? taxableSS : 0);
  const taxableIncome = Math.max(
    0,
    before - calculateStandardDeduction(age, c.deductions)
  );
  return {
    taxableIncome,
    tax: calculateProgressiveTax(taxableIncome, c.brackets)
  };
}
