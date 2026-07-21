import {
  IRMAA_CONFIGURATIONS,
  type IrmaaConfiguration,
  type IrmaaFilingStatus,
  type IrmaaTier
} from '../data/irmaaTables';

export interface IrmaaEstimate {
  tier: number;
  threshold: number;
  monthlyPartBAdjustment: number;
  monthlyPartDAdjustment: number;
  standardPartBMonthlyPremium: number;
  annualSurcharge: number;
  configurationYear: number;
  isEstimated: boolean;
  isPublished: boolean;
}

export interface ResolvedIrmaaConfiguration {
  configuration: IrmaaConfiguration;
  isEstimated: boolean;
}

export function resolveIrmaaConfiguration(
  premiumYear: number,
  filingStatus: IrmaaFilingStatus = 'single',
  configurations: readonly IrmaaConfiguration[] = IRMAA_CONFIGURATIONS
): ResolvedIrmaaConfiguration {
  const matching = configurations.filter((item) => item.filingStatus === filingStatus).sort(
    (a, b) => a.premiumYear - b.premiumYear
  );
  if (matching.length === 0) throw new Error(`No IRMAA configuration is available for ${filingStatus}.`);

  const exact = matching.find((item) => item.premiumYear === premiumYear);
  if (exact) return { configuration: exact, isEstimated: false };

  const latestPriorPublished = [...matching]
    .reverse()
    .find((item) => item.premiumYear < premiumYear && item.published);
  const latestPrior = [...matching].reverse().find((item) => item.premiumYear < premiumYear);
  const configuration = latestPriorPublished ?? latestPrior ?? matching.find((item) => item.published) ?? matching[0];
  return { configuration, isEstimated: true };
}

export function calculateIrmaaEstimate(
  magi: number,
  premiumYear: number,
  projectedInflationFactor = 1,
  filingStatus: IrmaaFilingStatus = 'single',
  configurations: readonly IrmaaConfiguration[] = IRMAA_CONFIGURATIONS
): IrmaaEstimate {
  const resolved = resolveIrmaaConfiguration(premiumYear, filingStatus, configurations);
  const factor =
    resolved.isEstimated && Number.isFinite(projectedInflationFactor) && projectedInflationFactor > 0
      ? projectedInflationFactor
      : 1;
  const normalizedMagi = Math.max(0, magi);
  const selected =
    resolved.configuration.tiers.find(
      (tier) =>
        tier.upperMagi === null ||
        (tier.upperMagiInclusive === false
          ? normalizedMagi < tier.upperMagi * factor
          : normalizedMagi <= tier.upperMagi * factor)
    ) ?? resolved.configuration.tiers[resolved.configuration.tiers.length - 1];

  return toEstimate(selected, factor, resolved);
}

function toEstimate(
  tier: IrmaaTier,
  factor: number,
  resolved: ResolvedIrmaaConfiguration
): IrmaaEstimate {
  return {
    tier: tier.tier,
    threshold: tier.upperMagi === null ? Number.POSITIVE_INFINITY : tier.upperMagi * factor,
    monthlyPartBAdjustment: tier.monthlyPartBAdjustment * factor,
    monthlyPartDAdjustment: tier.monthlyPartDAdjustment * factor,
    standardPartBMonthlyPremium: resolved.configuration.standardPartBPremium * factor,
    annualSurcharge: (tier.monthlyPartBAdjustment + tier.monthlyPartDAdjustment) * 12 * factor,
    configurationYear: resolved.configuration.premiumYear,
    isEstimated: resolved.isEstimated,
    isPublished: !resolved.isEstimated && resolved.configuration.published
  };
}
