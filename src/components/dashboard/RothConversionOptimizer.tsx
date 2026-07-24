import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { CheckCircle2, Info, LoaderCircle, RefreshCw, Award } from 'lucide-react';

import type { RothConversionOptimizerSettings } from '../../models/RothConversionOptimizerTypes';
import { RothConversionType, type PlannerInputs, type RetirementScenario } from '../../models/RetirementTypes';
import type { FederalTaxConfig } from '../../models/TaxTypes';

import {
  getRothConversionTargetBrackets,
  type RothConversionOptimizerResult
} from '../../services/RothConversionOptimizer';

import { formatMoney } from '../../utils/format';
import { CollapsiblePanel } from '../shared/CollapsiblePanel';
import { Dropdown } from '../shared/Dropdown';
import { NumberInput } from '../shared/NumberInput';

import type {
  RetirementRiskAnalysisOptions,
  RetirementRiskAnalysisResult
} from '../../services/RetirementRiskAnalysisService';
import { getScenarioLabel } from '../../utils/scenario';

const optimizerInfo = `
  <h3>Roth Conversion Optimizer</h3>
  <p>
    This optional comparison builds annual conversion schedules for the currently selected
    Social Security claiming choice. It also compares No Conversion with the planner's
    annual Fixed conversion amount.
  </p>
  <p>
    Bracket-target schedules fill progressively higher federal brackets, up to the selected
    limit. Every trial uses the same projection engine, state taxes, spending, RMD rules,
    withdrawal order, market path, and Medicare assumptions as the rest of the planner.
  </p>
  <p>
    The IRMAA guardrail checks the modeled premium tier two years after each conversion.
    If income already creates a higher tier without that conversion, the optimizer allows
    the existing tier but does not let the conversion increase it further.
  </p>
  <p>
    Strategies first must cover modeled spending. Among similarly funded strategies, the
    optimizer favors the largest estimated after-tax and IRMAA-adjusted ending value. That estimate
    reduces the remaining Traditional IRA by the selected future combined tax rate. It also adjusts
    the comparison value for incremental modeled IRMAA changes when those surcharges were not
    separately added to spending.
    Roth and taxable cash are not reduced for terminal taxes.
  </p>
  <p>
    A recommendation is a planning comparison, not tax advice. It does not model tax-law
    changes, taxable-account investment gains, charitable distributions, married-spouse
    details, or every rule that may affect an actual conversion.
  </p>
`;

type OptimizerStatus = 'idle' | 'running' | 'complete' | 'error';
type RiskStatus = 'idle' | 'running' | 'complete' | 'error';

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatWholePercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function fundingLabel(funded: boolean): string {
  return funded ? 'Yes' : 'No';
}

export function RothConversionOptimizer({
  inputs,
  selectedScenario,
  federalTaxConfig,
  simulations,
  settings,
  setSettings,
  runOptimizer,
  runRiskAnalysis,
  onUseSchedule
}: {
  inputs: PlannerInputs;
  selectedScenario: RetirementScenario;
  federalTaxConfig: FederalTaxConfig;
  simulations: number;
  settings: RothConversionOptimizerSettings;
  setSettings: Dispatch<SetStateAction<RothConversionOptimizerSettings>>;
  runOptimizer: (scenario: RetirementScenario) => RothConversionOptimizerResult;
  runRiskAnalysis: (
    scenario: RetirementScenario,
    result: RothConversionOptimizerResult,
    options?: RetirementRiskAnalysisOptions
  ) => Promise<RetirementRiskAnalysisResult>;
  onUseSchedule: (result: RothConversionOptimizerResult) => string;
}) {
  const [status, setStatus] = useState<OptimizerStatus>('idle');
  const [result, setResult] = useState<RothConversionOptimizerResult | null>(null);
  const [error, setError] = useState('');
  const [riskStatus, setRiskStatus] = useState<RiskStatus>('idle');
  const [riskResult, setRiskResult] = useState<RetirementRiskAnalysisResult | null>(null);
  const [riskProgress, setRiskProgress] = useState({ completed: 0, total: simulations });
  const [riskError, setRiskError] = useState('');
  const [appliedScenarioId, setAppliedScenarioId] = useState<string | null>(null);
  const optimizerRunIdRef = useRef(0);
  const riskAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    optimizerRunIdRef.current += 1;
    riskAbortControllerRef.current?.abort();
    setStatus('idle');
    setResult(null);
    setError('');
    setRiskStatus('idle');
    setRiskResult(null);
    setRiskProgress({ completed: 0, total: simulations });
    setRiskError('');
    setAppliedScenarioId(null);
    return () => riskAbortControllerRef.current?.abort();
  }, [runOptimizer, selectedScenario.id, simulations]);

  const bracketOptions = getRothConversionTargetBrackets(federalTaxConfig).map((bracket) => ({
    label: `${formatWholePercent(bracket.rate)} federal bracket`,
    value: bracket.rate
  }));

  const startOptimizer = async () => {
    const runId = optimizerRunIdRef.current + 1;
    optimizerRunIdRef.current = runId;
    setStatus('running');
    setResult(null);
    setError('');
    setRiskStatus('idle');
    setRiskResult(null);
    setRiskError('');
    setAppliedScenarioId(null);

    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      const optimizerResult = runOptimizer(selectedScenario);
      if (optimizerRunIdRef.current !== runId) return;
      setResult(optimizerResult);
      setStatus('complete');
    } catch (optimizerError) {
      if (optimizerRunIdRef.current !== runId) return;
      setError(
        optimizerError instanceof Error
          ? optimizerError.message
          : 'The Roth conversion comparison could not be completed.'
      );
      setStatus('error');
    }
  };

  const startRiskAnalysis = async () => {
    if (!result) return;

    riskAbortControllerRef.current?.abort();
    const controller = new AbortController();
    riskAbortControllerRef.current = controller;
    setRiskStatus('running');
    setRiskResult(null);
    setRiskError('');
    setRiskProgress({ completed: 0, total: simulations });

    try {
      const analysis = await runRiskAnalysis(selectedScenario, result, {
        signal: controller.signal,
        onProgress: (completed, total) => {
          const updateInterval = Math.max(1, Math.ceil(total / 100));
          if (completed === total || completed % updateInterval === 0) {
            setRiskProgress({ completed, total });
          }
        }
      });
      if (controller.signal.aborted) return;
      setRiskResult(analysis);
      setRiskProgress({ completed: analysis.simulations, total: analysis.simulations });
      setRiskStatus('complete');
    } catch (analysisError) {
      if (controller.signal.aborted) return;
      setRiskError(
        analysisError instanceof Error
          ? analysisError.message
          : 'The recommendation could not be tested across simulated paths.'
      );
      setRiskStatus('error');
    }
  };

  const useOptimizedSchedule = () => {
    if (!result || result.recommended.kind !== 'bracket-target' || result.recommended.totalConversion <= 0.01) {
      return;
    }
    setAppliedScenarioId(onUseSchedule(result));
  };

  const baseline = result?.baseline;
  const recommended = result?.recommended;

  const afterTaxDifference =
    baseline && recommended
      ? recommended.afterTaxEndPortfolioCurrentDollars - baseline.afterTaxEndPortfolioCurrentDollars
      : 0;

  const recommendedRisk = riskResult?.scenarios.find((scenario) => scenario.scenarioId === recommended?.id);
  const baselineRisk = riskResult?.scenarios.find((scenario) => scenario.scenarioId === baseline?.id);
  const fixedCandidate = result?.candidates.find((candidate) => candidate.kind === 'fixed');

  const emptyScheduleMessage = (() => {
    if (!recommended || recommended.kind !== 'no-conversion') {
      return 'No conversion could be scheduled under the current assumptions.';
    }

    const selectedPlan =
      selectedScenario.claimAge === null
        ? 'the plan for benefits already being received'
        : `the plan where Social Security starts at age ${selectedScenario.claimAge}`;

    if (!fixedCandidate) {
      return `For ${selectedPlan}, the optimizer estimates that making no Roth conversions produces the best result. No Fixed strategy was tested because Annual Fixed Roth Conversion is $0.`;
    }

    if (fixedCandidate.totalConversion <= 0.01) {
      return `For ${selectedPlan}, the optimizer estimates that making no Roth conversions produces the best result. The Fixed strategy was requested, but the planner could not complete a conversion. This can happen when the conversion period has ended or the Traditional IRA is needed for required withdrawals, spending, and taxes.`;
    }

    if (!fixedCandidate.withinSelectedLimits) {
      return `For ${selectedPlan}, the optimizer estimates that making no Roth conversions produces the best result. The Fixed strategy of ${formatMoney(inputs.annualRothConversion)} per year would convert ${formatMoney(fixedCandidate.totalConversion)} over several years, but at least one year exceeds a conversion, tax-bracket, or Medicare premium limit you selected.`;
    }

    return `For ${selectedPlan}, the optimizer estimates that making no Roth conversions produces the best result. It tested the Fixed strategy of ${formatMoney(inputs.annualRothConversion)} per year, which would convert ${formatMoney(fixedCandidate.totalConversion)} over several years, but the added taxes and possible Medicare premium increases outweighed its projected benefits.`;
  })();

  return (
    <CollapsiblePanel
      title="Roth Conversion Optimizer"
      subtitle={getScenarioLabel(selectedScenario)}
      icon={<Award />}
      info={optimizerInfo}>
      <p className="optimizer-description">
        Optionally compare conversion policies. Existing scenario calculations remain unchanged.
      </p>

      <div className="optimizer-settings">
        <div>
          <Dropdown
            label="Highest federal bracket to fill"
            options={bracketOptions}
            selectedValue={settings.maxFederalBracketRate}
            onChange={(value) =>
              setSettings((current) => ({
                ...current,
                maxFederalBracketRate: Number(value)
              }))
            }
          />
          <NumberInput
            label="Maximum annual conversion"
            value={settings.maxAnnualConversion}
            min={0}
            step={1000}
            onChange={(value) => setSettings((current) => ({ ...current, maxAnnualConversion: value }))}
          />
        </div>
        <div>
          <Dropdown
            label="IRMAA guardrail"
            options={[
              { label: 'Avoid conversion-caused increases', value: 'avoid-increase' },
              { label: 'Allow first surcharge tier', value: 'allow-first-tier' },
              { label: 'Ignore IRMAA tiers', value: 'ignore' }
            ]}
            selectedValue={settings.irmaaGuardrail}
            onChange={(value) =>
              setSettings((current) => ({
                ...current,
                irmaaGuardrail: value as RothConversionOptimizerSettings['irmaaGuardrail']
              }))
            }
          />
          <NumberInput
            label="Estimated future combined tax rate (%)"
            value={settings.terminalTraditionalTaxRate * 100}
            min={0}
            max={100}
            step={0.1}
            decimalPlaces={1}
            onChange={(value) =>
              setSettings((current) => ({
                ...current,
                terminalTraditionalTaxRate: value / 100
              }))
            }
          />
        </div>
      </div>

      <div className="optimizer-run">
        <p className="optimizer-disclaimer">
          Conversions begin at age {inputs.startAge} and stop before age {inputs.stopConvAge}, using the current Planner
          Inputs setting. Taxes are funded using the planner's existing withdrawal order.
        </p>
        <button
          className="risk-analysis-button optimizer-run-button"
          type="button"
          disabled={status === 'running'}
          onClick={startOptimizer}>
          {status === 'running' ? <LoaderCircle className="spinning" /> : result ? <RefreshCw /> : <Award />}
          {status === 'running'
            ? 'Comparing Conversion Policies'
            : result
              ? 'Run Optimizer Again'
              : 'Run Roth Conversion Optimizer'}
        </button>
      </div>

      {status === 'error' && <p className="risk-analysis-error">{error}</p>}

      {result && recommended && baseline && (
        <>
          <div className="optimizer-recommendation">
            <div>
              <span>Recommended modeled policy</span>
              <strong>{recommended.policyLabel}</strong>
            </div>
            <div>
              <span>Total modeled conversions</span>
              <strong>{formatMoney(recommended.totalConversion)}</strong>
            </div>
            <div>
              <span>After-tax/IRMAA value at age {inputs.endAge}</span>
              <strong>{formatMoney(recommended.afterTaxEndPortfolioCurrentDollars)}</strong>
            </div>
            <div>
              <span>Difference from no conversions</span>
              <strong className={afterTaxDifference >= 0 ? 'positive' : 'negative'}>
                {afterTaxDifference >= 0 ? '+' : ''}
                {formatMoney(afterTaxDifference)}
              </strong>
            </div>
          </div>

          <p className="optimizer-result-summary">
            {recommended.id === baseline.id
              ? 'Under these assumptions, no tested conversion policy improved the modeled outcome over making no conversions.'
              : `${recommended.policyLabel} produced the strongest modeled result while ${
                  recommended.fullyFundedThroughEnd
                    ? `covering planned spending through age ${inputs.endAge}`
                    : 'minimizing modeled shortfalls before comparing ending values'
                }.`}{' '}
            Comparison values are inflation-adjusted, apply a {formatPercent(settings.terminalTraditionalTaxRate)}{' '}
            estimated future tax reduction to the remaining Traditional IRA, and account for incremental modeled IRMAA
            changes not separately added to spending.
          </p>

          <div className="optimizer-result-actions">
            {recommended.kind === 'bracket-target' ? (
              <>
                <button
                  className="apply-optimized-schedule-button"
                  type="button"
                  disabled={recommended.totalConversion <= 0.01}
                  title={
                    recommended.totalConversion <= 0.01
                      ? 'The recommended policy does not include a Roth conversion schedule.'
                      : 'Add or replace the Optimized Roth scenario for this Social Security claiming choice.'
                  }
                  onClick={useOptimizedSchedule}>
                  <CheckCircle2 />
                  {appliedScenarioId ? 'Optimized Schedule Added' : 'Use Optimized Schedule'}
                </button>
                <p>
                  Adds this age-by-age schedule to the Scenario Summary, chart, yearly details, and Retirement Risk
                  Analysis. Reapplying replaces the prior optimized schedule for the same claiming choice.
                </p>
              </>
            ) : (
              <p>
                This policy is already included in the standard projections, so there is no separate optimized schedule
                to apply.
              </p>
            )}
          </div>

          <div className="table-container optimizer-results-table">
            <table className="sticky-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Policy</th>
                  <th>
                    Within Selected
                    <br />
                    Limits
                  </th>
                  <th>
                    Funds Through
                    <br />
                    Age {inputs.horizonAge}
                  </th>
                  <th>
                    Funds Through
                    <br />
                    Age {inputs.endAge}
                  </th>
                  <th>
                    After-Tax/IRMAA
                    <br />
                    at Age {inputs.horizonAge}
                  </th>
                  <th>
                    After-Tax/IRMAA
                    <br />
                    at Age {inputs.endAge}
                  </th>
                  <th>
                    Total
                    <br />
                    Conversions
                  </th>
                  <th>
                    Total
                    <br />
                    Taxes
                  </th>
                  <th>
                    IRMAA
                    <br />
                    Surcharges
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.candidates.map((candidate, index) => (
                  <tr key={candidate.id}>
                    <td>{index + 1}</td>
                    <td>{candidate.policyLabel}</td>
                    <td>{candidate.withinSelectedLimits ? 'Yes' : 'Reference only'}</td>
                    <td>{fundingLabel(candidate.fullyFundedThroughHorizon)}</td>
                    <td>{fundingLabel(candidate.fullyFundedThroughEnd)}</td>
                    <td>{formatMoney(candidate.afterTaxHorizonPortfolioCurrentDollars)}</td>
                    <td>{formatMoney(candidate.afterTaxEndPortfolioCurrentDollars)}</td>
                    <td>{formatMoney(candidate.totalConversion)}</td>
                    <td>{formatMoney(candidate.totalTaxesCurrentDollars)}</td>
                    <td>{formatMoney(candidate.totalIrmaaCurrentDollars)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="optimizer-schedule-heading">
            <h3>Recommended Annual Schedule</h3>
            <p>
              Requested amounts are policy limits; actual conversions can be smaller when spending, taxes, an RMD, or
              the available Traditional IRA requires it.
            </p>
          </div>

          {recommended.schedule.length > 0 ? (
            <div className="table-container optimizer-schedule-table">
              <table className="sticky-table">
                <thead>
                  <tr>
                    <th>Age</th>
                    <th>Year</th>
                    <th>Requested</th>
                    <th>Actual</th>
                    <th>
                      Federal Taxable
                      <br />
                      Income
                    </th>
                    <th>
                      Target
                      <br />
                      Bracket
                    </th>
                    <th>
                      IRMAA
                      <br />2 Years Later
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recommended.schedule.map((row) => (
                    <tr key={row.age}>
                      <td>{row.age}</td>
                      <td>{row.year}</td>
                      <td>{formatMoney(row.requestedConversion)}</td>
                      <td>{formatMoney(row.actualConversion)}</td>
                      <td>{formatMoney(row.federalTaxableIncome)}</td>
                      <td>
                        {row.targetFederalBracketRate === null
                          ? 'Fixed amount'
                          : formatWholePercent(row.targetFederalBracketRate)}
                      </td>
                      <td>
                        {row.irmaaTier === null
                          ? 'Outside projection'
                          : row.irmaaTier === 0
                            ? `No surcharge (age ${row.irmaaPremiumAge})`
                            : `Tier ${row.irmaaTier} (age ${row.irmaaPremiumAge})`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="optimizer-empty-schedule">{emptyScheduleMessage}</p>
          )}

          <div className="optimizer-risk-validation">
            <div>
              <h3>Test the Recommendation Against Market Uncertainty</h3>
              <p>
                {recommended.kind === 'no-conversion'
                  ? 'Test the recommended No Conversion policy'
                  : 'Compare the recommended conversion schedule with No Conversion'}{' '}
                across the same {simulations.toLocaleString('en-US')} simulated market and inflation paths.
              </p>
            </div>
            <button
              className="risk-analysis-button"
              type="button"
              disabled={riskStatus === 'running'}
              onClick={startRiskAnalysis}>
              {riskStatus === 'running' ? (
                <LoaderCircle className="spinning" />
              ) : riskResult ? (
                <RefreshCw />
              ) : (
                <Award />
              )}
              {riskStatus === 'running'
                ? 'Testing Recommendation'
                : riskResult
                  ? 'Run Risk Test Again'
                  : 'Risk-Test Recommendation'}
            </button>
          </div>

          {riskStatus === 'running' && (
            <div className="risk-analysis-progress" aria-live="polite">
              <progress value={riskProgress.completed} max={Math.max(1, riskProgress.total)} />
              <span>
                {riskProgress.completed.toLocaleString('en-US')} of {riskProgress.total.toLocaleString('en-US')} paths
              </span>
            </div>
          )}

          {riskStatus === 'error' && <p className="risk-analysis-error">{riskError}</p>}

          {riskResult && recommendedRisk && (
            <div className="optimizer-risk-result">
              <Info />
              <p>
                The recommended schedule covered spending through age {inputs.horizonAge} in{' '}
                <strong>{formatPercent(recommendedRisk.horizonFullyFundedRate)}</strong> of modeled paths and through
                age {inputs.endAge} in <strong>{formatPercent(recommendedRisk.fullyFundedRate)}</strong>.
                {baselineRisk && recommended.id !== baseline.id && (
                  <>
                    {' '}
                    No Conversion covered those ages in{' '}
                    <strong>{formatPercent(baselineRisk.horizonFullyFundedRate)}</strong> and{' '}
                    <strong>{formatPercent(baselineRisk.fullyFundedRate)}</strong>, respectively.
                  </>
                )}{' '}
                These are modeled probabilities of success, not guarantees.
              </p>
            </div>
          )}
        </>
      )}
    </CollapsiblePanel>
  );
}
