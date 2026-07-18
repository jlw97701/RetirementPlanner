import type { StateTaxConfig } from '../models/TaxTypes';

// Tax configuration assumes the first federal and state entries and currently defaults to 2026 single-filer/Oregon rules.

export const oregon2026Single: StateTaxConfig = {
  jurisdiction: 'state',
  year: 2026,
  filingStatus: 'single',
  brackets: [
    { id: 'or-475', lowerBound: 0, upperBound: 4300, rate: 0.0475 },
    { id: 'or-675', lowerBound: 4300, upperBound: 10750, rate: 0.0675 },
    { id: 'or-875', lowerBound: 10750, upperBound: 125000, rate: 0.0875 },
    { id: 'or-99', lowerBound: 125000, upperBound: null, rate: 0.099 }
  ],
  deductions: { standardDeduction: 2745, additionalDeduction65: 0 },
  taxesSocialSecurity: false,
  metadata: {
    sourceName: 'Oregon DOR planning table',
    sourceUrl: 'https://www.oregon.gov/dor/programs/individuals/pages/pit.aspx',
    lastVerified: '2026-07-14',
    notes: 'Planning approximation. Confirm filing-year values.'
  }
};
