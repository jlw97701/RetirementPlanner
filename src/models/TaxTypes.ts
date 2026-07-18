export type FilingStatus =
  | 'single'
  | 'marriedFilingJointly'
  | 'marriedFilingSeparately'
  | 'headOfHousehold';

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
  taxesSocialSecurity: boolean;
}

export interface TaxConfigurationSet {
  federal: FederalTaxConfig[];
  state: StateTaxConfig[];
}
