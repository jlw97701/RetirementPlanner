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
import { EconomicScenarioMethod, type EconomicScenario } from './EconomicScenarioEngine';
import { calculateRetirementProjection } from './RetirementEngine';

describe('calculateRetirementProjection', () => {
  function createTestProjection(inputOverrides: Partial<PlannerInputs> = {}) {
    const inputs = {
      ...DEFAULT_INPUTS,
      birthDate: '1964-03-30',
      startAge: 75,
      endAge: 76,
      horizonAge: 76,
      rmdStartAge: 75,
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
    This tests fails as expected with the shared fixture: it sets annualSpend: 3_000. The $2,032.52 RMD is not enough to cover spending, 
    so the solver correctly increases the traditional cash withdrawal to about $3,012.72.
    The scenario has no excess RMD cash to deposit. Give the RMD-surplus test its own annualSpend: 0 override.  
  */
  test('deposits excess RMD cash into taxable cash', () => {
    /*
     * Age 75 has an RMD factor of 24.6. A $50,000 traditional
     * balance produces an RMD of approximately $2,032.52.
     *
     * With no spending, Social Security, growth, or tax, that
     * entire distribution should move into taxable cash.
     */
    const rows = createTestProjection({
      startAge: 75,
      endAge: 75,
      horizonAge: 75,
      annualSpend: 0
    });

    const row = rows[0];
    const expectedRmd = 50_000 / 24.6;

    expect(row.rmd).toBeCloseTo(expectedRmd, 2);
    expect(row.tradCashWithdraw).toBeCloseTo(expectedRmd, 2);

    /*
     * This RMD is below both configured standard deductions,
     * so the test expects no income tax.
     */
    expect(row.totalTax).toBeCloseTo(0, 2);

    expect(row.startTaxableAcct).toBe(10_000);
    expect(row.taxableAcctDeposit).toBeCloseTo(expectedRmd, 2);
    expect(row.taxableAcctWithdraw).toBe(0);
    expect(row.endTaxableAcct).toBeCloseTo(10_000 + expectedRmd, 2);

    expect(row.endTradlIra).toBeCloseTo(50_000 - expectedRmd, 2);

    /*
     * Moving money from traditional IRA to taxable cash should
     * not change total portfolio value when there are no taxes,
     * spending, or investment returns.
     */
    expect(row.endPortfolio).toBeCloseTo(60_000, 2);
    expect(row.unfundedNeed).toBe(0);
  });
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
});
