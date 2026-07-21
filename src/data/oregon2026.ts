import type { FilingStatus, StateTaxConfig, TaxBracket } from '../models/TaxTypes';

const SOURCE_URL = 'https://www.oregon.gov/dor/forms/FormsPubs/form-or-40-inst_101-040-1_2025.pdf';
const SOURCE_NAME = 'Oregon DOR 2025 Form OR-40 instructions';
const LAST_VERIFIED = '2026-07-21';

const brackets = (prefix: string, upperBounds: [number, number, number]): TaxBracket[] => [
  { id: `${prefix}-475`, lowerBound: 0, upperBound: upperBounds[0], rate: 0.0475 },
  { id: `${prefix}-675`, lowerBound: upperBounds[0], upperBound: upperBounds[1], rate: 0.0675 },
  { id: `${prefix}-875`, lowerBound: upperBounds[1], upperBound: upperBounds[2], rate: 0.0875 },
  { id: `${prefix}-99`, lowerBound: upperBounds[2], upperBound: null, rate: 0.099 }
];

function createOregonConfig(
  filingStatus: FilingStatus,
  upperBounds: [number, number, number],
  standardDeduction: number,
  additionalDeduction65: number,
  notes?: string
): StateTaxConfig {
  return {
    jurisdiction: 'state',
    year: 2026,
    filingStatus,
    brackets: brackets(`or-${filingStatus}`, upperBounds),
    deductions: { standardDeduction, additionalDeduction65 },
    taxesSocialSecurity: false,
    metadata: {
      sourceName: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      lastVerified: LAST_VERIFIED,
      notes: [
        'Planning estimate using the latest published 2025 Oregon schedules; replace when Oregon publishes tax-year 2026 tables.',
        notes
      ]
        .filter(Boolean)
        .join(' ')
    }
  };
}

export const oregon2026Single = createOregonConfig('single', [4400, 11100, 125000], 2835, 1200);

export const oregon2026MarriedFilingJointly = createOregonConfig(
  'marriedFilingJointly',
  [8800, 22200, 250000],
  5670,
  1000,
  'The age-based amount is per qualifying spouse; this single-person projection applies it once.'
);

export const oregon2026MarriedFilingSeparately = createOregonConfig(
  'marriedFilingSeparately',
  [4400, 11100, 125000],
  2835,
  1000,
  'The standard deduction is zero when the other spouse itemizes; the planner assumes the standard deduction is allowed.'
);

export const oregon2026HeadOfHousehold = createOregonConfig(
  'headOfHousehold',
  [8800, 22200, 250000],
  4560,
  1200
);

export const OREGON_2026_CONFIGURATIONS: StateTaxConfig[] = [
  oregon2026Single,
  oregon2026MarriedFilingJointly,
  oregon2026MarriedFilingSeparately,
  oregon2026HeadOfHousehold
];
