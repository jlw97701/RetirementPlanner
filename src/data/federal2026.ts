import type { FederalTaxConfig, FilingStatus, TaxBracket } from '../models/TaxTypes';

const SOURCE_URL = 'https://www.irs.gov/publications/p505#en_US_2026_publink1000194749';
const SOURCE_NAME = 'IRS Publication 505 (2026)';
const LAST_VERIFIED = '2026-07-21';

const brackets = (prefix: string, upperBounds: number[]): TaxBracket[] => {
  const rates = [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];

  return rates.map((rate, index) => ({
    id: `${prefix}-${Math.round(rate * 100)}`,
    lowerBound: index === 0 ? 0 : upperBounds[index - 1],
    upperBound: index < upperBounds.length ? upperBounds[index] : null,
    rate
  }));
};

function createFederalConfig(
  filingStatus: FilingStatus,
  upperBounds: number[],
  standardDeduction: number,
  additionalDeduction65: number,
  socialSecurityThresholds: [number, number],
  notes?: string
): FederalTaxConfig {
  return {
    jurisdiction: 'federal',
    year: 2026,
    filingStatus,
    brackets: brackets(`fed-${filingStatus}`, upperBounds),
    deductions: { standardDeduction, additionalDeduction65 },
    socialSecurity: {
      baseThreshold: socialSecurityThresholds[0],
      secondThreshold: socialSecurityThresholds[1],
      firstInclusionRate: 0.5,
      maximumInclusionRate: 0.85
    },
    metadata: {
      sourceName: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      lastVerified: LAST_VERIFIED,
      notes
    }
  };
}

export const federal2026Single = createFederalConfig(
  'single',
  [12400, 50400, 105700, 201775, 256225, 640600],
  16100,
  2050,
  [25000, 34000]
);

export const federal2026MarriedFilingJointly = createFederalConfig(
  'marriedFilingJointly',
  [24800, 100800, 211400, 403550, 512450, 768700],
  32200,
  1650,
  [32000, 44000],
  'The age-based amount is per qualifying spouse; this single-person projection applies it once.'
);

export const federal2026MarriedFilingSeparately = createFederalConfig(
  'marriedFilingSeparately',
  [12400, 50400, 105700, 201775, 256225, 384350],
  16100,
  1650,
  [0, 0],
  'Social Security thresholds assume the filer lived with their spouse during the year. A filer who lived apart all year may use the Single thresholds.'
);

export const federal2026HeadOfHousehold = createFederalConfig(
  'headOfHousehold',
  [17700, 67450, 105700, 201750, 256200, 640600],
  24150,
  2050,
  [25000, 34000]
);

export const FEDERAL_2026_CONFIGURATIONS: FederalTaxConfig[] = [
  federal2026Single,
  federal2026MarriedFilingJointly,
  federal2026MarriedFilingSeparately,
  federal2026HeadOfHousehold
];
