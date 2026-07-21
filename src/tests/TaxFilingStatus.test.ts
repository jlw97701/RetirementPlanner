import { describe, expect, it } from 'vitest';

import { DEFAULT_TAX_CONFIG } from '../data/defaults';
import { IRMAA_CONFIGURATIONS } from '../data/irmaaTables';
import type { FilingStatus } from '../models/TaxTypes';
import { calculateIrmaaEstimate } from '../services/IrmaaEngine';
import { calculateFederalTax, calculateStateTax, selectTaxConfiguration } from '../services/TaxEngine';

const filingStatuses: FilingStatus[] = [
  'single',
  'marriedFilingJointly',
  'marriedFilingSeparately',
  'headOfHousehold'
];

describe('filing-status tax configurations', () => {
  it('bundles federal and Oregon configurations for every planner filing status', () => {
    expect(DEFAULT_TAX_CONFIG.federal.map((configuration) => configuration.filingStatus)).toEqual(filingStatuses);
    expect(DEFAULT_TAX_CONFIG.state.map((configuration) => configuration.filingStatus)).toEqual(filingStatuses);
  });

  it('selects the requested schedules and applies their brackets and deductions', () => {
    const singleFederal = selectTaxConfiguration(DEFAULT_TAX_CONFIG.federal, 'single');
    const jointFederal = selectTaxConfiguration(DEFAULT_TAX_CONFIG.federal, 'marriedFilingJointly');
    const singleState = selectTaxConfiguration(DEFAULT_TAX_CONFIG.state, 'single');
    const jointState = selectTaxConfiguration(DEFAULT_TAX_CONFIG.state, 'marriedFilingJointly');

    const singleFederalTax = calculateFederalTax(64, 100_000, 0, singleFederal);
    const jointFederalTax = calculateFederalTax(64, 100_000, 0, jointFederal);
    const singleStateTax = calculateStateTax(64, 100_000, 0, singleState);
    const jointStateTax = calculateStateTax(64, 100_000, 0, jointState);

    expect(singleFederal.filingStatus).toBe('single');
    expect(jointFederal.filingStatus).toBe('marriedFilingJointly');
    expect(jointFederalTax.tax).toBeLessThan(singleFederalTax.tax);
    expect(jointStateTax.tax).toBeLessThan(singleStateTax.tax);
  });

  it('bundles and applies the three SSA IRMAA filing categories', () => {
    expect(new Set(IRMAA_CONFIGURATIONS.map((configuration) => configuration.filingStatus))).toEqual(
      new Set(['single', 'marriedJoint', 'marriedSeparate'])
    );

    expect(calculateIrmaaEstimate(150_000, 2026, 1, 'single').tier).toBe(2);
    expect(calculateIrmaaEstimate(150_000, 2026, 1, 'marriedJoint').tier).toBe(0);
    expect(calculateIrmaaEstimate(150_000, 2026, 1, 'marriedSeparate').tier).toBe(1);
  });
});
