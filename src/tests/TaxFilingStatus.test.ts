import { describe, expect, it } from 'vitest';

import { DEFAULT_TAX_CONFIG } from '../data/defaults';
import { IRMAA_CONFIGURATIONS } from '../data/irmaaTables';
import type { FilingStatus, StateCode } from '../models/TaxTypes';
import { calculateIrmaaEstimate } from '../services/IrmaaEngine';
import {
  calculateFederalTax,
  calculateStateTax,
  selectStateTaxConfiguration,
  selectTaxConfiguration
} from '../services/TaxEngine';

const filingStatuses: FilingStatus[] = [
  'single',
  'marriedFilingJointly',
  'marriedFilingSeparately',
  'headOfHousehold'
];

describe('filing-status tax configurations', () => {
  it('bundles federal and Oregon configurations for every planner filing status', () => {
    expect(DEFAULT_TAX_CONFIG.federal.map((configuration) => configuration.filingStatus)).toEqual(filingStatuses);
    expect(
      DEFAULT_TAX_CONFIG.state
        .filter((configuration) => configuration.stateCode === 'OR')
        .map((configuration) => configuration.filingStatus)
    ).toEqual(filingStatuses);
  });

  it('bundles four filing-status configurations for all 50 states and DC', () => {
    const stateCodes = new Set(DEFAULT_TAX_CONFIG.state.map((configuration) => configuration.stateCode));
    expect(stateCodes.size).toBe(51);
    for (const stateCode of stateCodes) {
      expect(
        DEFAULT_TAX_CONFIG.state.filter((configuration) => configuration.stateCode === stateCode)
      ).toHaveLength(4);
    }
  });

  it('selects the requested schedules and applies their brackets and deductions', () => {
    const singleFederal = selectTaxConfiguration(DEFAULT_TAX_CONFIG.federal, 'single');
    const jointFederal = selectTaxConfiguration(DEFAULT_TAX_CONFIG.federal, 'marriedFilingJointly');
    const singleState = selectStateTaxConfiguration(DEFAULT_TAX_CONFIG.state, 'OR', 'single');
    const jointState = selectStateTaxConfiguration(DEFAULT_TAX_CONFIG.state, 'OR', 'marriedFilingJointly');

    const singleFederalTax = calculateFederalTax(64, 100_000, 0, singleFederal);
    const jointFederalTax = calculateFederalTax(64, 100_000, 0, jointFederal);
    const singleStateTax = calculateStateTax(64, 100_000, 0, 0, singleState);
    const jointStateTax = calculateStateTax(64, 100_000, 0, 0, jointState);

    expect(singleFederal.filingStatus).toBe('single');
    expect(jointFederal.filingStatus).toBe('marriedFilingJointly');
    expect(jointFederalTax.tax).toBeLessThan(singleFederalTax.tax);
    expect(jointStateTax.tax).toBeLessThan(singleStateTax.tax);
  });

  it('supports no-tax states and configured retirement-income exclusions', () => {
    const texas = selectStateTaxConfiguration(DEFAULT_TAX_CONFIG.state, 'TX', 'single');
    const illinois = selectStateTaxConfiguration(DEFAULT_TAX_CONFIG.state, 'IL', 'single');
    const taxableDistribution = 100_000;

    expect(calculateStateTax(70, taxableDistribution, 0, 0, texas).tax).toBe(0);
    expect(calculateStateTax(70, taxableDistribution, 0, 0, illinois).tax).toBe(0);
    expect(calculateStateTax(70, taxableDistribution, 0, 0, illinois).stateRetirementIncomeExclusion).toBe(
      taxableDistribution
    );
  });

  it('applies configured state Social Security exemptions by income and age', () => {
    const connecticut = selectStateTaxConfiguration(DEFAULT_TAX_CONFIG.state, 'CT', 'single');
    const colorado = selectStateTaxConfiguration(DEFAULT_TAX_CONFIG.state, 'CO', 'single');

    expect(calculateStateTax(64, 40_000, 40_000, 30_000, connecticut).stateTaxableSocialSecurity).toBe(0);
    expect(calculateStateTax(64, 60_000, 40_000, 30_000, connecticut).stateTaxableSocialSecurity).toBe(30_000);
    expect(calculateStateTax(64, 30_000, 40_000, 20_000, colorado).stateTaxableSocialSecurity).toBe(20_000);
    expect(calculateStateTax(65, 30_000, 40_000, 20_000, colorado).stateTaxableSocialSecurity).toBe(0);
  });

  it('uses current enacted 2026 flat rates for Georgia and Utah', () => {
    const georgia = selectStateTaxConfiguration(DEFAULT_TAX_CONFIG.state, 'GA', 'single');
    const utah = selectStateTaxConfiguration(DEFAULT_TAX_CONFIG.state, 'UT', 'single');

    expect(georgia.brackets[0]?.rate).toBe(0.0499);
    expect(utah.brackets[0]?.rate).toBe(0.0445);
  });

  it('registers ordered, contiguous brackets and marks every state estimate as statewide only', () => {
    for (const configuration of DEFAULT_TAX_CONFIG.state) {
      expect(configuration.estimated).toBe(true);
      expect(configuration.localTaxesIncluded).toBe(false);

      for (let index = 0; index < configuration.brackets.length; index += 1) {
        const bracket = configuration.brackets[index];
        const nextBracket = configuration.brackets[index + 1];
        expect(bracket.rate).toBeGreaterThanOrEqual(0);
        expect(bracket.rate).toBeLessThan(1);
        expect(bracket.upperBound).toBe(nextBracket?.lowerBound ?? null);
        if (nextBracket) expect(nextBracket.lowerBound).toBeGreaterThan(bracket.lowerBound);
      }
    }
  });

  it('selects every registered state by state and filing status', () => {
    const codes = [...new Set(DEFAULT_TAX_CONFIG.state.map((configuration) => configuration.stateCode))];
    for (const code of codes) {
      for (const filingStatus of filingStatuses) {
        expect(
          selectStateTaxConfiguration(DEFAULT_TAX_CONFIG.state, code as StateCode, filingStatus).stateCode
        ).toBe(code);
      }
    }
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
