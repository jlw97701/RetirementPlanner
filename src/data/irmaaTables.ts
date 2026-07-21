export type IrmaaFilingStatus = 'single' | 'marriedJoint' | 'marriedSeparate';

export interface IrmaaTier {
  tier: number;
  upperMagi: number | null;
  upperMagiInclusive?: boolean;
  monthlyPartBAdjustment: number;
  monthlyPartDAdjustment: number;
}

export interface IrmaaConfiguration {
  premiumYear: number;
  filingStatus: IrmaaFilingStatus;
  standardPartBPremium: number;
  published: boolean;
  sourceUrl: string;
  tiers: readonly IrmaaTier[];
}

const IRMAA_2026_SINGLE_TIERS: readonly IrmaaTier[] = [
  { tier: 0, upperMagi: 109000, monthlyPartBAdjustment: 0, monthlyPartDAdjustment: 0 },
  { tier: 1, upperMagi: 137000, monthlyPartBAdjustment: 81.2, monthlyPartDAdjustment: 14.5 },
  { tier: 2, upperMagi: 171000, monthlyPartBAdjustment: 202.9, monthlyPartDAdjustment: 37.5 },
  { tier: 3, upperMagi: 205000, monthlyPartBAdjustment: 324.6, monthlyPartDAdjustment: 60.4 },
  {
    tier: 4,
    upperMagi: 500000,
    upperMagiInclusive: false,
    monthlyPartBAdjustment: 446.3,
    monthlyPartDAdjustment: 83.3
  },
  { tier: 5, upperMagi: null, monthlyPartBAdjustment: 487, monthlyPartDAdjustment: 91 }
];

/**
 * Published IRMAA tables. Add a configuration when SSA publishes a new premium year.
 * Future years are estimated from the latest configuration for the requested filing status.
 */
export const IRMAA_CONFIGURATIONS: readonly IrmaaConfiguration[] = [
  {
    premiumYear: 2026,
    filingStatus: 'single',
    standardPartBPremium: 202.9,
    published: true,
    sourceUrl: 'https://www.ssa.gov/benefits/medicare/medicare-premiums.html',
    tiers: IRMAA_2026_SINGLE_TIERS
  }
];
