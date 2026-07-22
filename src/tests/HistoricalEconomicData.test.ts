import { describe, expect, test } from 'vitest';

import { HISTORICAL_ECONOMIC_DATA } from '../data/historicalEconomicData';
import { EconomicScenarioEngine, EconomicScenarioMethod } from '../services/EconomicScenarioEngine';

describe('historical economic data', () => {
  test('contains finite rates for consecutive years', () => {
    expect(HISTORICAL_ECONOMIC_DATA).toHaveLength(51);
    expect(HISTORICAL_ECONOMIC_DATA[0].year).toBe(1975);
    expect(HISTORICAL_ECONOMIC_DATA.at(-1)?.year).toBe(2025);
    expect(HISTORICAL_ECONOMIC_DATA[0].internationalStockReturn).toBe(0.3595);
    expect(HISTORICAL_ECONOMIC_DATA.at(-1)?.internationalStockReturn).toBe(0.3217);

    for (let index = 0; index < HISTORICAL_ECONOMIC_DATA.length; index++) {
      const item = HISTORICAL_ECONOMIC_DATA[index];
      const values = [
        item.inflation,
        item.socialSecurityCola,
        item.domesticStockReturn,
        item.internationalStockReturn,
        item.bondReturn,
        item.cashReturn,
        item.otherReturn
      ];

      expect(values.every(Number.isFinite)).toBe(true);
      expect(item.inflation).toBeGreaterThan(-1);
      expect(item.domesticStockReturn).toBeGreaterThanOrEqual(-1);
      expect(item.internationalStockReturn).toBeGreaterThanOrEqual(-1);
      expect(item.bondReturn).toBeGreaterThanOrEqual(-1);
      expect(item.cashReturn).toBeGreaterThanOrEqual(-1);
      expect(item.otherReturn).toBeGreaterThanOrEqual(-1);

      if (index > 0) {
        expect(item.year).toBe(HISTORICAL_ECONOMIC_DATA[index - 1].year + 1);
      }
    }
  });

  test('replays and wraps a historical sequence', () => {
    const scenario = new EconomicScenarioEngine().generate({
      method: EconomicScenarioMethod.HISTORICAL_SEQUENCE,
      startYear: 2030,
      years: 3,
      historicalData: HISTORICAL_ECONOMIC_DATA,
      historicalStartYear: 2024,
      wrap: true
    });

    expect(scenario.years.map((item) => item.year)).toEqual([2030, 2031, 2032]);
    expect(scenario.years.map((item) => item.sourceYear)).toEqual([2024, 2025, 1975]);
    expect(scenario.years[0].domesticStockReturn).toBe(HISTORICAL_ECONOMIC_DATA[49].domesticStockReturn);
    expect(scenario.years[0].internationalStockReturn).toBe(
      HISTORICAL_ECONOMIC_DATA[49].internationalStockReturn
    );
  });

  test('creates a reproducible historical bootstrap path', () => {
    const engine = new EconomicScenarioEngine();
    const config = {
      method: EconomicScenarioMethod.HISTORICAL_BOOTSTRAP as const,
      startYear: 2030,
      years: 10,
      historicalData: HISTORICAL_ECONOMIC_DATA,
      blockSize: 3,
      seed: 24680
    };

    const first = engine.generate(config);
    const second = engine.generate(config);

    expect(first.years).toEqual(second.years);
    expect(first.years).toHaveLength(10);
    expect(first.years.every((item) => item.sourceYear !== undefined)).toBe(true);
  });
});
