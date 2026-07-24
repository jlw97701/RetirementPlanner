import { afterEach, describe, expect, test, vi } from 'vitest';

import { DEFAULT_INPUTS, DEFAULT_TAX_CONFIG } from '../data/defaults';
import {
  loadPlannerInputs,
  loadTaxConfigurations,
  savePlannerInputs
} from '../services/PlannerStorage';

function createLocalStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value)
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tax configuration storage migration', () => {
  test('treats missing legacy state indexing flags as not indexed', () => {
    const storage = createLocalStorage();
    vi.stubGlobal('localStorage', storage);

    const source = DEFAULT_TAX_CONFIG.state.find(
      (configuration) =>
        configuration.stateCode === 'NY' &&
        configuration.filingStatus === 'single'
    )!;
    const legacyState = structuredClone(source) as unknown as Record<
      string,
      unknown
    >;
    delete legacyState.inflationIndexing;

    const legacyExclusions =
      legacyState.retirementIncomeExclusions as Array<Record<string, unknown>>;
    for (const exclusion of legacyExclusions) {
      delete exclusion.maximumAmountInflationIndexed;
      delete exclusion.incomeLimitInflationIndexed;
      delete exclusion.phaseoutStartInflationIndexed;
    }

    storage.setItem(
      'retirement-planner-tax-config',
      JSON.stringify({
        federal: DEFAULT_TAX_CONFIG.federal,
        state: [legacyState]
      })
    );

    const loaded = loadTaxConfigurations(DEFAULT_TAX_CONFIG);
    const migrated = loaded.state[0];

    expect(
      Object.values(migrated.inflationIndexing).every(
        (isIndexed) => isIndexed === false
      )
    ).toBe(true);
    expect(
      migrated.retirementIncomeExclusions.every(
        (exclusion) =>
          exclusion.maximumAmountInflationIndexed === false &&
          exclusion.incomeLimitInflationIndexed === false &&
          exclusion.phaseoutStartInflationIndexed === false
      )
    ).toBe(true);
  });
});

describe('planner input storage', () => {
  test('saves and restores a future Traditional IRA rollover', () => {
    const storage = createLocalStorage();
    vi.stubGlobal('localStorage', storage);

    savePlannerInputs({
      ...DEFAULT_INPUTS,
      futureTradIraDeposit: 72_821,
      futureTradIraDepositYear: 2027
    });

    const loaded = loadPlannerInputs(DEFAULT_INPUTS);

    expect(loaded.futureTradIraDeposit).toBe(72_821);
    expect(loaded.futureTradIraDepositYear).toBe(2027);
  });
});
