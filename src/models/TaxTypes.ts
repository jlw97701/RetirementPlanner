export type FilingStatus =
  | 'single'
  | 'marriedFilingJointly'
  | 'marriedFilingSeparately'
  | 'headOfHousehold';

export type StateCode =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA'
  | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD'
  | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ'
  | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC'
  | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY'
  | 'DC';

export type StateTaxModel = 'none' | 'flat' | 'progressive' | 'custom';
export type StateIncomeBase = 'retirementIncome' | 'federalAgi' | 'federalTaxableIncome';
export type StateSocialSecurityTreatment = 'exempt' | 'federalTaxableAmount';

export interface TaxBracket {
  id: string;
  lowerBound: number;
  upperBound: number | null;
  rate: number;
}

export interface DeductionConfig {
  standardDeduction: number;
  additionalDeduction65: number;
}

export interface SocialSecurityTaxConfig {
  baseThreshold: number;
  secondThreshold: number;
  firstInclusionRate: number;
  maximumInclusionRate: number;
}

export interface TaxConfigMetadata {
  sourceUrl: string;
  sourceName: string;
  lastVerified: string;
  notes?: string;
}

export interface JurisdictionTaxConfig {
  jurisdiction: 'federal' | 'state';
  year: number;
  filingStatus: FilingStatus;
  brackets: TaxBracket[];
  deductions: DeductionConfig;
  metadata: TaxConfigMetadata;
}

export interface FederalTaxConfig extends JurisdictionTaxConfig {
  jurisdiction: 'federal';
  socialSecurity: SocialSecurityTaxConfig;
}

/**
 * Controls which state-table amounts may be inflation-adjusted when an exact
 * table is unavailable for a projection year. State rules vary, so each field
 * is explicit rather than assuming every dollar amount is indexed.
 */
export interface StateTaxInflationIndexing {
  bracketThresholds: boolean;
  standardDeduction: boolean;
  additionalDeduction65: boolean;
  socialSecurityExemptionIncomeLimit: boolean;
  personalExemption: boolean;
  personalCredit: boolean;
}

export const NO_STATE_TAX_INFLATION_INDEXING: Readonly<StateTaxInflationIndexing> = {
  bracketThresholds: false,
  standardDeduction: false,
  additionalDeduction65: false,
  socialSecurityExemptionIncomeLimit: false,
  personalExemption: false,
  personalCredit: false
};

export interface StateTaxConfig extends JurisdictionTaxConfig {
  jurisdiction: 'state';
  stateCode: StateCode;
  stateName: string;
  taxModel: StateTaxModel;
  incomeBase: StateIncomeBase;
  socialSecurityTreatment: StateSocialSecurityTreatment;
  socialSecurityExemptionAge?: number;
  socialSecurityExemptionIncomeLimit?: number;
  personalExemption: number;
  personalCredit: number;
  inflationIndexing: StateTaxInflationIndexing;
  retirementIncomeExclusions: RetirementIncomeExclusion[];
  localTaxesIncluded: boolean;
  estimated: boolean;
}

export interface RetirementIncomeExclusion {
  minimumAge: number;
  maximumAmount: number | null;
  maximumAmountInflationIndexed: boolean;
  incomeLimit?: number;
  incomeLimitInflationIndexed: boolean;
  phaseoutStart?: number;
  phaseoutStartInflationIndexed: boolean;
  reducedBySocialSecurity?: boolean;
}

export interface TaxConfigurationSet {
  federal: FederalTaxConfig[];
  state: StateTaxConfig[];
}
