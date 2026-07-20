import { describe, expect, test } from 'vitest';

import { DEFAULT_INPUTS, DEFAULT_TAX_CONFIG } from '../data/defaults';
import {
  ColaStrategyType,
  PlannerInputs,
  RothConversionType,
  type AssetAllocation,
  type RetirementScenario,
  type SSColaSettings,
  type SSMonthlyIncome
} from '../models/RetirementTypes';
import { EconomicScenarioMethod, type EconomicScenario } from '../services/EconomicScenarioEngine';
import { calculateRetirementProjection } from '../services/RetirementEngine';

describe('calculateRetirementProjection', () => {
  function createTestProjection(inputOverrides: Partial<PlannerInputs> = {}) {
    const inputs = {
      ...DEFAULT_INPUTS,
      birthDate: '1964-03-30',
      startAge: 75,
      endAge: 76,
      horizonAge: 76,
      stopConvAge: 75,
      tradIra: 50_000,
      rothIra: 5_000,
      taxableAcct: 10_000,
      annualSpend: 3_000,
      rothBaseConv: 0,
      rothAggressiveConv: 0,
      inflation: 0,

      // Apply test-specific values last.
      ...inputOverrides
    };

    const socialSecurityIncome: SSMonthlyIncome[] = [
      { age: 62, amount: 0 },
      { age: 63, amount: 0 },
      { age: 64, amount: 0 },
      { age: 65, amount: 0 },
      { age: 66, amount: 0 },
      { age: 67, amount: 0 },
      { age: 70, amount: 0 }
    ];

    const colaSettings: SSColaSettings = {
      strategy: ColaStrategyType.FixedRate,
      fixedRate: 0,
      averageRate: 0,
      lastRate: 0,
      monteCarloRate: 0
    };

    const assetAllocation: AssetAllocation = {
      stocks: 0,
      bonds: 0,
      cash: 1,
      other: 0
    };

    const retirementScenario: RetirementScenario = {
      id: 'test-cash-flow',
      claimAge: 70,
      rothConvType: RothConversionType.None
    };

    const economicScenario: EconomicScenario = {
      id: 'test-zero-return',
      method: EconomicScenarioMethod.DETERMINISTIC,
      years: [
        {
          year: 2039,
          inflation: 0,
          socialSecurityCola: 0,
          stockReturn: 0,
          bondReturn: 0,
          cashReturn: 0,
          otherReturn: 0
        },
        {
          year: 2040,
          inflation: 0,
          socialSecurityCola: 0,
          stockReturn: 0,
          bondReturn: 0,
          cashReturn: 0,
          otherReturn: 0
        }
      ]
    };

    return calculateRetirementProjection(
      inputs,
      socialSecurityIncome,
      colaSettings,
      assetAllocation,
      retirementScenario,
      {
        federalTaxConfig: DEFAULT_TAX_CONFIG.federal[0],
        stateTaxConfig: DEFAULT_TAX_CONFIG.state[0],
        economicScenario
      }
    );
  }

  /* 
    This test creates no spending, so the RMD is genuinely surplus and must move into taxable cash.
  */
  test('deposits excess RMD cash into taxable cash', () => {
    const rows = createTestProjection({
      startAge: 75,
      endAge: 75,
      horizonAge: 75,
      annualSpend: 0
    });

    expect(rows).toHaveLength(1);

    const row = rows[0];
    const expectedRmd = 50_000 / 24.6;

    expect(row.rmd).toBeCloseTo(expectedRmd, 2);
    expect(row.tradCashWithdraw).toBeCloseTo(expectedRmd, 2);
    expect(row.totalTax).toBeCloseTo(0, 2);
    expect(row.startTaxableAcct).toBe(10_000);
    expect(row.taxableAcctDeposit).toBeCloseTo(expectedRmd, 2);
    expect(row.taxableAcctWithdraw).toBe(0);
    expect(row.endTaxableAcct).toBeCloseTo(10_000 + expectedRmd, 2);
    expect(row.endTradlIra).toBeCloseTo(50_000 - expectedRmd, 2);

    /*
     * Initial portfolio:
     * $50,000 traditional + $5,000 Roth + $10,000 cash.
     */
    expect(row.endPortfolio).toBeCloseTo(65_000, 2);
    expect(row.unfundedNeed).toBe(0);
  });

  /* 
    This test includes spending and verifies that all annual sources, uses, and account balances reconcile.
  */
  test('reconciles annual cash flows', () => {
    const rows = createTestProjection();

    for (const row of rows) {
      const cashSources = row.socialSecurity + row.tradCashWithdraw + row.taxableAcctWithdraw + row.rothWithdraw;
      const cashUses = row.spending + row.totalTax + row.taxableAcctDeposit - row.unfundedNeed;

      expect(cashSources).toBeCloseTo(cashUses, 2);

      expect(row.endTaxableAcct).toBeCloseTo(
        row.startTaxableAcct + row.taxableAcctDeposit - row.taxableAcctWithdraw,
        2
      );

      expect(row.endPortfolio).toBeCloseTo(row.endTradlIra + row.endRothIra + row.endTaxableAcct, 2);
    }
  });

  test('carries ending balances into the following year', () => {
    const rows = createTestProjection();

    expect(rows.length).toBeGreaterThan(1);

    for (let index = 1; index < rows.length; index++) {
      const previous = rows[index - 1];
      const current = rows[index];

      expect(current.startTradIra).toBeCloseTo(previous.endTradlIra, 2);

      expect(current.startRothIra).toBeCloseTo(previous.endRothIra, 2);

      expect(current.startTaxableAcct).toBeCloseTo(previous.endTaxableAcct, 2);
    }
  });

  test('reconciles annual account balances', () => {
    const rows = createTestProjection();

    for (const row of rows) {
      expect(row.endTradlIra).toBeCloseTo(row.startTradIra + row.tradGrowth - row.traditionalDist, 2);

      expect(row.endRothIra).toBeCloseTo(row.startRothIra + row.rothGrowth + row.rothConv - row.rothWithdraw, 2);

      expect(row.endTaxableAcct).toBeCloseTo(
        row.startTaxableAcct + row.taxableAcctDeposit - row.taxableAcctWithdraw,
        2
      );

      expect(row.endPortfolio).toBeCloseTo(row.endTradlIra + row.endRothIra + row.endTaxableAcct, 2);
    }
  });

  test('reports ending portfolio in start-year dollars', () => {
    const rows = createTestProjection();

    /*
     * Override the fixture's second economic
     * year inflation to 10%, or extend the helper
     * to accept economic scenario overrides.
     */

    expect(rows[0].inflationIndex).toBeCloseTo(1, 8);

    expect(rows[0].endPortfolioCurrentDollars).toBeCloseTo(rows[0].endPortfolio, 2);

    expect(rows[1].inflationIndex).toBeCloseTo(1.1, 8);

    expect(rows[1].endPortfolioCurrentDollars).toBeCloseTo(rows[1].endPortfolio / 1.1, 2);
  });
});
