import {
  RothConversionType,
  type AssetAllocation,
  type PlannerInputs,
  type RetirementScenario,
  type RetirementYear,
  type SSColaSettings,
  type SSMonthlyIncome
} from '../models/RetirementTypes';

import {
  calculateRetirementProjection,
  resolveProjectionTaxConfigurations,
  type RetirementCalculationContext
} from './RetirementEngine';

import {
  runRetirementRiskAnalysis,
  type RetirementRiskAnalysisOptions,
  type RetirementRiskAnalysisResult
} from './RetirementRiskAnalysisService';

import type { FederalTaxConfig, StateTaxConfig, TaxBracket } from '../models/TaxTypes';
import type { EconomicScenario } from './EconomicScenarioEngine';
import type { IrmaaConfiguration } from '../data/irmaaTables';
import type { EconomicScenarioSettings } from '../models/EconomicScenarioSettings';
import type { RothConversionOptimizerSettings } from '../models/RothConversionOptimizerTypes';
import { getProjectionPeriod } from '../utils/projectionDates';

const CONVERSION_TOLERANCE = 0.01;
const BRACKET_TOLERANCE = 0.01;
const BISECTION_ITERATIONS = 24;

export type RothConversionCandidateKind = 'no-conversion' | 'fixed' | 'bracket-target';

export interface RothConversionScheduleRow {
  age: number;
  year: number;
  requestedConversion: number;
  actualConversion: number;
  federalTaxableIncome: number;
  targetFederalBracketRate: number | null;
  irmaaPremiumAge: number | null;
  irmaaPremiumYear: number | null;
  irmaaTier: number | null;
}

export interface RothConversionOptimizerCandidate {
  id: string;
  kind: RothConversionCandidateKind;
  policyLabel: string;
  targetFederalBracketRate: number | null;
  scenario: RetirementScenario;
  rows: RetirementYear[];
  schedule: RothConversionScheduleRow[];
  totalConversion: number;
  totalTaxesCurrentDollars: number;
  totalIrmaaCurrentDollars: number;
  totalUnfundedNeedCurrentDollars: number;
  withinSelectedLimits: boolean;
  fullyFundedThroughHorizon: boolean;
  fullyFundedThroughEnd: boolean;
  afterTaxHorizonPortfolioCurrentDollars: number;
  afterTaxEndPortfolioCurrentDollars: number;
}

export interface RothConversionOptimizerResult {
  baseline: RothConversionOptimizerCandidate;
  recommended: RothConversionOptimizerCandidate;
  candidates: RothConversionOptimizerCandidate[];
  settings: RothConversionOptimizerSettings;
  claimAge: RetirementScenario['claimAge'];
}

export interface RothConversionOptimizerParameters {
  inputs: PlannerInputs;
  ssIncome: SSMonthlyIncome[];
  colaSettings: SSColaSettings;
  assetAllocation: AssetAllocation;
  retirementScenario: RetirementScenario;
  federalTaxConfigurations: readonly FederalTaxConfig[];
  stateTaxConfigurations: readonly StateTaxConfig[];
  economicScenario: EconomicScenario;
  irmaaConfigurations: readonly IrmaaConfiguration[];
  settings: RothConversionOptimizerSettings;
}

export interface RothConversionOptimizerRiskParameters extends Omit<
  RothConversionOptimizerParameters,
  'economicScenario' | 'settings'
> {
  economicScenarioSettings: EconomicScenarioSettings;
}

function getRequestedConversion(inputs: PlannerInputs, scenario: RetirementScenario, age: number): number {
  const scheduled = scenario.rothConversionSchedule?.[age];
  if (scheduled !== undefined) return scheduled;
  if (scenario.rothConvType === RothConversionType.Fixed) return inputs.annualRothConversion;
  return 0;
}

function getIrmaaTierLimit(settings: RothConversionOptimizerSettings): number | null {
  if (settings.irmaaGuardrail === 'ignore') return null;
  if (settings.irmaaGuardrail === 'allow-first-tier') return 1;
  return 0;
}

function project(parameters: RothConversionOptimizerParameters, scenario: RetirementScenario): RetirementYear[] {
  const context: RetirementCalculationContext = {
    federalTaxConfigurations: parameters.federalTaxConfigurations,
    stateTaxConfigurations: parameters.stateTaxConfigurations,
    economicScenario: parameters.economicScenario,
    irmaaConfigurations: parameters.irmaaConfigurations
  };

  return calculateRetirementProjection(
    parameters.inputs,
    parameters.ssIncome,
    parameters.colaSettings,
    parameters.assetAllocation,
    scenario,
    context
  );
}

function getCalculationContext(parameters: RothConversionOptimizerParameters): RetirementCalculationContext {
  return {
    federalTaxConfigurations: parameters.federalTaxConfigurations,
    stateTaxConfigurations: parameters.stateTaxConfigurations,
    economicScenario: parameters.economicScenario,
    irmaaConfigurations: parameters.irmaaConfigurations
  };
}

function getBracketAtOrBelowRate(federalTaxConfig: FederalTaxConfig, maximumRate: number): TaxBracket | undefined {
  return federalTaxConfig.brackets
    .filter((bracket) => bracket.upperBound !== null && bracket.rate <= maximumRate + Number.EPSILON)
    .sort((left, right) => left.lowerBound - right.lowerBound)
    .at(-1);
}

function createScheduledScenario(
  claimAge: RetirementScenario['claimAge'],
  id: string,
  schedule: Readonly<Record<number, number>>
): RetirementScenario {
  return {
    id,
    claimAge,
    rothConvType: RothConversionType.Optimized,
    rothConversionSchedule: schedule
  };
}

function isConversionWithinPolicy(
  rows: RetirementYear[],
  baselineRows: RetirementYear[],
  rowIndex: number,
  bracketUpperBound: number,
  settings: RothConversionOptimizerSettings
): boolean {
  const row = rows[rowIndex];
  if (!row || row.federalTaxableIncome > bracketUpperBound + BRACKET_TOLERANCE) {
    return false;
  }

  const configuredTierLimit = getIrmaaTierLimit(settings);
  if (configuredTierLimit === null) return true;

  const premiumRowIndex = rowIndex + 2;
  const premiumRow = rows[premiumRowIndex];
  const baselinePremiumRow = baselineRows[premiumRowIndex];

  if (!premiumRow || !baselinePremiumRow) return true;

  /*
   * Do not reject a strategy merely because income unrelated to this
   * conversion already exceeds the selected tier. The conversion may not
   * push the premium-year tier above the higher of the baseline tier and the
   * user's selected limit.
   */
  const allowedTier = Math.max(configuredTierLimit, baselinePremiumRow.irmaaTier);
  return premiumRow.irmaaTier <= allowedTier;
}

function buildBracketTargetSchedule(
  parameters: RothConversionOptimizerParameters,
  targetBracketRate: number
): Readonly<Record<number, number>> {
  const schedule: Record<number, number> = {};
  const claimAge = parameters.retirementScenario.claimAge;
  const period = getProjectionPeriod(parameters.inputs.birthDate, parameters.inputs.startAge, parameters.inputs.endAge);
  const calculationContext = getCalculationContext(parameters);

  for (
    let age = parameters.inputs.startAge;
    age <= parameters.inputs.endAge && age < parameters.inputs.stopConvAge;
    age += 1
  ) {
    const baselineScenario = createScheduledScenario(claimAge, 'optimizer-working-baseline', schedule);
    const baselineRows = project(parameters, baselineScenario);
    const rowIndex = age - parameters.inputs.startAge;
    const baselineRow = baselineRows[rowIndex];
    const federalTaxConfig = baselineRow
      ? resolveProjectionTaxConfigurations(parameters.inputs, baselineRow.year, calculationContext, period.startYear)
          .federal.configuration
      : undefined;
    const bracket = federalTaxConfig ? getBracketAtOrBelowRate(federalTaxConfig, targetBracketRate) : undefined;

    if (
      !baselineRow ||
      !bracket ||
      bracket.upperBound === null ||
      baselineRow.federalTaxableIncome >= bracket.upperBound - BRACKET_TOLERANCE ||
      parameters.settings.maxAnnualConversion <= CONVERSION_TOLERANCE
    ) {
      continue;
    }

    let lower = 0;
    let upper = parameters.settings.maxAnnualConversion;
    let bestRequestedConversion = 0;

    for (let iteration = 0; iteration < BISECTION_ITERATIONS; iteration += 1) {
      const requestedConversion = lower + (upper - lower) / 2;
      const trialSchedule = { ...schedule, [age]: requestedConversion };
      const trialScenario = createScheduledScenario(claimAge, 'optimizer-working-trial', trialSchedule);
      const trialRows = project(parameters, trialScenario);

      if (isConversionWithinPolicy(trialRows, baselineRows, rowIndex, bracket.upperBound, parameters.settings)) {
        bestRequestedConversion = requestedConversion;
        lower = requestedConversion;
      } else {
        upper = requestedConversion;
      }
    }

    if (bestRequestedConversion > CONVERSION_TOLERANCE) {
      schedule[age] = bestRequestedConversion;
    }
  }

  return schedule;
}

function afterTaxPortfolioCurrentDollars(row: RetirementYear | undefined, terminalTraditionalTaxRate: number): number {
  if (!row) return 0;

  return (
    (row.endRothIra + row.endTaxableAcct + row.endTradlIra * (1 - terminalTraditionalTaxRate)) / row.inflationIndex
  );
}

function irmaaNotSeparatelyAddedToSpendingCurrentDollars(rows: readonly RetirementYear[], throughAge: number): number {
  return rows
    .filter((row) => row.age <= throughAge && row.medicareHealthcareAddedToSpending <= CONVERSION_TOLERANCE)
    .reduce((sum, row) => sum + row.annualIrmaaSurcharge / row.inflationIndex, 0);
}

function createCandidate(
  parameters: RothConversionOptimizerParameters,
  scenario: RetirementScenario,
  kind: RothConversionCandidateKind,
  policyLabel: string,
  targetBracketRate: number | null
): RothConversionOptimizerCandidate {
  const rows = project(parameters, scenario);
  const horizonRow =
    rows.find((row) => row.age === parameters.inputs.horizonAge) ??
    rows.filter((row) => row.age <= parameters.inputs.horizonAge).at(-1);
  const endingRow = rows.at(-1);
  const schedule = rows
    .filter(
      (row) =>
        row.age < parameters.inputs.stopConvAge &&
        getRequestedConversion(parameters.inputs, scenario, row.age) > CONVERSION_TOLERANCE
    )
    .map((row) => {
      const premiumRow = rows.find((candidate) => candidate.age === row.age + 2);

      return {
        age: row.age,
        year: row.year,
        requestedConversion: getRequestedConversion(parameters.inputs, scenario, row.age),
        actualConversion: row.rothConv,
        federalTaxableIncome: row.federalTaxableIncome,
        targetFederalBracketRate: targetBracketRate,
        irmaaPremiumAge: premiumRow?.age ?? null,
        irmaaPremiumYear: premiumRow?.year ?? null,
        irmaaTier: premiumRow?.irmaaTier ?? null
      };
    });

  return {
    id: scenario.id,
    kind,
    policyLabel,
    targetFederalBracketRate: targetBracketRate,
    scenario,
    rows,
    schedule,
    totalConversion: rows.reduce((sum, row) => sum + row.rothConv, 0),
    totalTaxesCurrentDollars: rows.reduce((sum, row) => sum + row.totalTax / row.inflationIndex, 0),
    totalIrmaaCurrentDollars: rows.reduce((sum, row) => sum + row.annualIrmaaSurcharge / row.inflationIndex, 0),
    totalUnfundedNeedCurrentDollars: rows.reduce((sum, row) => sum + row.unfundedNeed / row.inflationIndex, 0),
    withinSelectedLimits: kind === 'no-conversion',
    fullyFundedThroughHorizon: rows
      .filter((row) => row.age <= parameters.inputs.horizonAge)
      .every((row) => row.unfundedNeed <= CONVERSION_TOLERANCE),
    fullyFundedThroughEnd: rows.every((row) => row.unfundedNeed <= CONVERSION_TOLERANCE),
    afterTaxHorizonPortfolioCurrentDollars: afterTaxPortfolioCurrentDollars(
      horizonRow,
      parameters.settings.terminalTraditionalTaxRate
    ),
    afterTaxEndPortfolioCurrentDollars: afterTaxPortfolioCurrentDollars(
      endingRow,
      parameters.settings.terminalTraditionalTaxRate
    )
  };
}

function applyIncrementalIrmaaAdjustment(
  candidate: RothConversionOptimizerCandidate,
  baseline: RothConversionOptimizerCandidate,
  inputs: PlannerInputs
): void {
  const candidateHorizonIrmaa = irmaaNotSeparatelyAddedToSpendingCurrentDollars(candidate.rows, inputs.horizonAge);
  const baselineHorizonIrmaa = irmaaNotSeparatelyAddedToSpendingCurrentDollars(baseline.rows, inputs.horizonAge);
  const candidateEndIrmaa = irmaaNotSeparatelyAddedToSpendingCurrentDollars(candidate.rows, inputs.endAge);
  const baselineEndIrmaa = irmaaNotSeparatelyAddedToSpendingCurrentDollars(baseline.rows, inputs.endAge);

  candidate.afterTaxHorizonPortfolioCurrentDollars -= candidateHorizonIrmaa - baselineHorizonIrmaa;
  candidate.afterTaxEndPortfolioCurrentDollars -= candidateEndIrmaa - baselineEndIrmaa;
}

function compareCandidates(left: RothConversionOptimizerCandidate, right: RothConversionOptimizerCandidate): number {
  if (left.withinSelectedLimits !== right.withinSelectedLimits) {
    return left.withinSelectedLimits ? -1 : 1;
  }
  if (left.fullyFundedThroughEnd !== right.fullyFundedThroughEnd) {
    return left.fullyFundedThroughEnd ? -1 : 1;
  }
  if (left.fullyFundedThroughHorizon !== right.fullyFundedThroughHorizon) {
    return left.fullyFundedThroughHorizon ? -1 : 1;
  }

  const unfundedDifference = left.totalUnfundedNeedCurrentDollars - right.totalUnfundedNeedCurrentDollars;
  if (Math.abs(unfundedDifference) > CONVERSION_TOLERANCE) return unfundedDifference;

  const endingDifference = right.afterTaxEndPortfolioCurrentDollars - left.afterTaxEndPortfolioCurrentDollars;
  if (Math.abs(endingDifference) > CONVERSION_TOLERANCE) return endingDifference;

  const horizonDifference = right.afterTaxHorizonPortfolioCurrentDollars - left.afterTaxHorizonPortfolioCurrentDollars;
  if (Math.abs(horizonDifference) > CONVERSION_TOLERANCE) return horizonDifference;

  return left.totalTaxesCurrentDollars - right.totalTaxesCurrentDollars;
}

function candidateIsWithinSelectedLimits(
  candidate: RothConversionOptimizerCandidate,
  baseline: RothConversionOptimizerCandidate,
  parameters: RothConversionOptimizerParameters
): boolean {
  if (candidate.kind === 'no-conversion') return true;

  const configuredTierLimit = getIrmaaTierLimit(parameters.settings);
  const period = getProjectionPeriod(parameters.inputs.birthDate, parameters.inputs.startAge, parameters.inputs.endAge);
  const calculationContext = getCalculationContext(parameters);

  return candidate.rows.every((row) => {
    const requestedConversion =
      row.age < parameters.inputs.stopConvAge
        ? getRequestedConversion(parameters.inputs, candidate.scenario, row.age)
        : 0;

    if (requestedConversion <= CONVERSION_TOLERANCE) return true;

    const federalTaxConfig = resolveProjectionTaxConfigurations(
      parameters.inputs,
      row.year,
      calculationContext,
      period.startYear
    ).federal.configuration;
    const highestBracket = getBracketAtOrBelowRate(federalTaxConfig, parameters.settings.maxFederalBracketRate);

    if (
      !highestBracket ||
      highestBracket.upperBound === null ||
      requestedConversion > parameters.settings.maxAnnualConversion + CONVERSION_TOLERANCE ||
      row.federalTaxableIncome > highestBracket.upperBound + BRACKET_TOLERANCE
    ) {
      return false;
    }

    const premiumRow = candidate.rows.find((candidateRow) => candidateRow.age === row.age + 2);
    if (configuredTierLimit === null || !premiumRow) {
      return true;
    }

    const baselinePremiumTier = baseline.rows.find((baselineRow) => baselineRow.age === premiumRow.age)?.irmaaTier ?? 0;

    return premiumRow.irmaaTier <= Math.max(configuredTierLimit, baselinePremiumTier);
  });
}

export function getRothConversionTargetBrackets(
  federalTaxConfig: FederalTaxConfig,
  maxFederalBracketRate = Number.POSITIVE_INFINITY
): TaxBracket[] {
  return federalTaxConfig.brackets.filter(
    (bracket) => bracket.upperBound !== null && bracket.rate <= maxFederalBracketRate + Number.EPSILON
  );
}

export function optimizeRothConversions(parameters: RothConversionOptimizerParameters): RothConversionOptimizerResult {
  const claimAge = parameters.retirementScenario.claimAge;
  const baselineScenario: RetirementScenario = {
    id: 'optimizer-no-conversion',
    claimAge,
    rothConvType: RothConversionType.None
  };
  const baseline = createCandidate(parameters, baselineScenario, 'no-conversion', 'No Roth conversions', null);
  const candidates: RothConversionOptimizerCandidate[] = [baseline];

  if (parameters.inputs.annualRothConversion > CONVERSION_TOLERANCE) {
    candidates.push(
      createCandidate(
        parameters,
        {
          id: 'optimizer-fixed',
          claimAge,
          rothConvType: RothConversionType.Fixed
        },
        'fixed',
        `Fixed ${parameters.inputs.annualRothConversion.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        })} per year`,
        null
      )
    );
  }

  const targetBrackets = getRothConversionTargetBrackets(
    resolveProjectionTaxConfigurations(
      parameters.inputs,
      getProjectionPeriod(parameters.inputs.birthDate, parameters.inputs.startAge, parameters.inputs.endAge).startYear,
      getCalculationContext(parameters)
    ).federal.configuration,
    parameters.settings.maxFederalBracketRate
  );

  for (const bracket of targetBrackets) {
    const schedule = buildBracketTargetSchedule(parameters, bracket.rate);
    const scenario = createScheduledScenario(
      claimAge,
      `optimizer-bracket-${Math.round(bracket.rate * 10_000)}`,
      schedule
    );
    const candidate = createCandidate(
      parameters,
      scenario,
      'bracket-target',
      `Fill up to the ${(bracket.rate * 100).toFixed(0)}% federal bracket`,
      bracket.rate
    );

    if (candidate.totalConversion > CONVERSION_TOLERANCE) candidates.push(candidate);
  }

  for (const candidate of candidates) {
    applyIncrementalIrmaaAdjustment(candidate, baseline, parameters.inputs);
    candidate.withinSelectedLimits = candidateIsWithinSelectedLimits(candidate, baseline, parameters);
  }

  candidates.sort(compareCandidates);

  return {
    baseline,
    recommended: candidates[0],
    candidates,
    settings: parameters.settings,
    claimAge
  };
}

export function createAppliedRothConversionScenario(
  inputs: PlannerInputs,
  result: RothConversionOptimizerResult,
  optimizerSourceKey: string
): RetirementScenario {
  if (result.recommended.kind !== 'bracket-target') {
    throw new Error('Only a bracket-target recommendation can be applied as an optimized Roth schedule.');
  }

  const schedule: Record<number, number> = {};

  for (let age = inputs.startAge; age <= inputs.endAge && age < inputs.stopConvAge; age += 1) {
    const requestedConversion = getRequestedConversion(inputs, result.recommended.scenario, age);

    if (requestedConversion > CONVERSION_TOLERANCE) {
      schedule[age] = requestedConversion;
    }
  }

  return {
    id: `applied-optimized-${result.claimAge ?? 'actual'}`,
    claimAge: result.claimAge,
    rothConvType: RothConversionType.Optimized,
    rothConversionLabel: 'Optimized',
    optimizerSourceKey,
    rothConversionSchedule: schedule
  };
}

export async function runRothConversionOptimizerRiskAnalysis(
  parameters: RothConversionOptimizerRiskParameters,
  result: RothConversionOptimizerResult,
  options?: RetirementRiskAnalysisOptions
): Promise<RetirementRiskAnalysisResult> {
  const scenarios =
    result.recommended.id === result.baseline.id
      ? [result.baseline.scenario]
      : [result.recommended.scenario, result.baseline.scenario];

  return runRetirementRiskAnalysis(
    {
      inputs: parameters.inputs,
      ssIncome: parameters.ssIncome,
      colaSettings: parameters.colaSettings,
      assetAllocation: parameters.assetAllocation,
      retirementScenarios: scenarios,
      economicScenarioSettings: parameters.economicScenarioSettings,
      federalTaxConfigurations: parameters.federalTaxConfigurations,
      stateTaxConfigurations: parameters.stateTaxConfigurations,
      irmaaConfigurations: parameters.irmaaConfigurations
    },
    options
  );
}
