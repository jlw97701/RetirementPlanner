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
  retirementIncomeExclusions: RetirementIncomeExclusion[];
  localTaxesIncluded: boolean;
  estimated: boolean;
}

export interface RetirementIncomeExclusion {
  minimumAge: number;
  maximumAmount: number | null;
  incomeLimit?: number;
  phaseoutStart?: number;
  reducedBySocialSecurity?: boolean;
}

export interface TaxConfigurationSet {
  federal: FederalTaxConfig[];
  state: StateTaxConfig[];
}
