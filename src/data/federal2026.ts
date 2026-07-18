import type { FederalTaxConfig } from '../models/TaxTypes';

// Tax configuration assumes the first federal and state entries and currently defaults to 2026 single-filer/Oregon rules.

export const federal2026Single: FederalTaxConfig = {
  jurisdiction: 'federal',
  year: 2026,
  filingStatus: 'single',
  brackets: [
    { id: 'fed-10', lowerBound: 0, upperBound: 12400, rate: 0.1 },
    { id: 'fed-12', lowerBound: 12400, upperBound: 50400, rate: 0.12 },
    { id: 'fed-22', lowerBound: 50400, upperBound: 105700, rate: 0.22 },
    { id: 'fed-24', lowerBound: 105700, upperBound: 201775, rate: 0.24 },
    { id: 'fed-32', lowerBound: 201775, upperBound: 256225, rate: 0.32 },
    { id: 'fed-35', lowerBound: 256225, upperBound: 640600, rate: 0.35 },
    { id: 'fed-37', lowerBound: 640600, upperBound: null, rate: 0.37 }
  ],
  deductions: { standardDeduction: 16100, additionalDeduction65: 2050 },
  socialSecurity: {
    baseThreshold: 25000,
    secondThreshold: 34000,
    firstInclusionRate: 0.5,
    maximumInclusionRate: 0.85
  },
  metadata: {
    sourceName: 'IRS 2026 inflation adjustments',
    sourceUrl:
      'https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill',
    lastVerified: '2026-07-14'
  }
};
