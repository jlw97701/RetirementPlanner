import type { FilingStatus, StateTaxConfig } from '../models/TaxTypes';
import { STATE_2026_CONFIGURATIONS } from './stateTax2026';

function oregonConfiguration(filingStatus: FilingStatus): StateTaxConfig {
  const configuration = STATE_2026_CONFIGURATIONS.find(
    (item) => item.stateCode === 'OR' && item.filingStatus === filingStatus
  );
  if (!configuration) throw new Error(`Missing Oregon ${filingStatus} tax configuration.`);
  return configuration;
}

export const oregon2026Single = oregonConfiguration('single');
export const oregon2026MarriedFilingJointly = oregonConfiguration('marriedFilingJointly');
export const oregon2026MarriedFilingSeparately = oregonConfiguration('marriedFilingSeparately');
export const oregon2026HeadOfHousehold = oregonConfiguration('headOfHousehold');

export const OREGON_2026_CONFIGURATIONS: StateTaxConfig[] = [
  oregon2026Single,
  oregon2026MarriedFilingJointly,
  oregon2026MarriedFilingSeparately,
  oregon2026HeadOfHousehold
];
