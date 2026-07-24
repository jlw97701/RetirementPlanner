import { useEffect, useRef, useState } from 'react';
import { Area, AreaChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Info, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { RothConversionType } from '../../models/RetirementTypes';
import type { PlannerInputs } from '../../models/RetirementTypes';
import { Popover } from '../shared/Popover';
import { CollapsiblePanel } from '../shared/CollapsiblePanel';

import { formatMoney } from '../../utils/format';

type AnalysisStatus = 'idle' | 'running' | 'complete' | 'error';

import type {
  RetirementRiskAnalysisOptions,
  RetirementRiskAnalysisResult,
  RetirementRiskScenarioResult,
  ResolvedRiskMarketAssumption
} from '../../services/RetirementRiskAnalysisService';

interface RiskChartPoint {
  age: number;
  p10: number;
  p50: number;
  p90: number;
  percentileFloor: number;
  percentileRange: number;
}

const riskAnalysisInfo = `
  <h3>Retirement Risk Analysis</h3>
  <p>
    When Deterministic is selected, the chosen Market Assumption supplies the target average portfolio return.
    The analysis shifts the configured asset-class return averages so their weighted portfolio average matches
    that target while preserving their relative differences.
  </p>
  <p>
    Custom Market values become the simulated asset-class averages. Volatility, correlations, return limits,
    inflation assumptions, and the seed continue to come from Single Simulated Path. When another scenario method
    is selected, the analysis uses the Single Simulated Path return averages as well.
  </p>
  <p>
    Every Social Security claiming and Roth-conversion strategy is evaluated against the same
    generated paths. Paired paths make strategy comparisons fair and keep repeated runs reproducible.
  </p>
  <p>
    <strong>Fully Funded Paths</strong> is the percentage of paths with no unfunded spending through the ending age. 
  </p>
  <p>
    <strong>Depletion Risk</strong> is the percentage with at least one unfunded need.
  </p>
  <p>
    P10 means 10% of outcomes ended at or below that balance, the median divides outcomes in half,
    and P90 means 90% ended at or below that balance. Balances use inflation-adjusted dollars expressed
    in first-projection-year purchasing power.
  </p>
  <p>
    In the comparison table, <strong>Typical First Shortfall Age</strong> and
    <strong>Typical Total Shortfall</strong> describe only paths that experienced a spending shortfall.
    Total shortfall adds unmet spending across the projection using inflation-adjusted dollars. A dash
    means none of the simulated paths had a shortfall.
  </p>
  <p>
    Results are sensitivity analysis, not forecasts, probabilities guaranteed by history, or financial
    advice. Changing planner or simulated-path assumptions clears the results and requires a new run.
  </p>
`;

const riskChartInfo = `
  <h3>How to read this chart</h3>
  <p>
    The <strong>blue line</strong> is the middle result at each age: half of the simulated paths
    finished above it and half finished below it.
  </p>
  <p>
    The <strong>shaded area</strong> contains the middle 80% of results. About 1 in 10 paths fell
    below its lower edge and about 1 in 10 rose above its upper edge. A wider area means the
    possible outcomes vary more.
  </p>
  <p>
    Dollar amounts use <strong>Inflation-Adjusted Dollars</strong>, removing projected inflation and using
    first-projection-year purchasing power
    so a balance at age 90 can be compared meaningfully with a balance at age 65.
  </p>
  <p>
    If the shaded area reaches zero, some paths used the entire portfolio. Check
    <strong>Depletion Risk</strong> to see how often the plan could not fully cover spending; a zero
    portfolio does not always mean a shortfall when Social Security or other income still covers expenses.
  </p>
  <p>
    Focus on whether the plan remains workable across weaker outcomes, not on treating the blue
    line as the future that is most likely to occur.
  </p>
`;

function scenarioLabel(scenario: RetirementRiskScenarioResult): string {
  const socialSecurity = scenario.claimAge === null ? 'Already Claimed' : `Claim at ${scenario.claimAge}`;
  return `${socialSecurity} · ${
    scenario.rothConversionLabel ?? rothConversionLabel(scenario.rothConvType)
  } Roth Conversion`;
}

function rothConversionLabel(type: RothConversionType): string {
  if (type === RothConversionType.None) return 'No';
  if (type === RothConversionType.Fixed) return 'Fixed';
  return 'Optimized';
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCount(value: number): string {
  return Math.trunc(value).toLocaleString('en-US');
}

function getMedianPortfolioAtAge(scenario: RetirementRiskScenarioResult, age: number): number {
  return scenario.portfolioPercentiles.find((point) => point.age === age)?.p50 ?? 0;
}

function formatNaturalPercent(value: number): string {
  const percentage = Number((value * 100).toFixed(1));
  return `${percentage.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
}

function describeModeledFrequency(rate: number): string {
  if (rate <= 0) return 'none of the simulated futures';
  if (rate >= 1) return 'every simulated future';

  if (rate <= 0.25) {
    return `about 1 in ${Math.max(2, Math.round(1 / rate))}`;
  }

  if (rate >= 0.75) {
    const denominator = Math.max(4, Math.round(1 / (1 - rate)));
    return `about ${denominator - 1} in ${denominator}`;
  }

  return `about ${Math.round(rate * 10)} in 10`;
}

function describeSuccessLevel(rate: number): string {
  if (rate >= 0.9) return 'high';
  if (rate >= 0.75) return 'relatively high';
  if (rate >= 0.5) return 'moderate';
  if (rate >= 0.25) return 'low';
  return 'very low';
}

function describeSustainability(rate: number): string {
  if (rate >= 0.9) return 'appears sustainable across most modeled futures';
  if (rate >= 0.75) return 'appears sustainable in most modeled futures but remains vulnerable in weaker markets';
  if (rate >= 0.5) return 'may be sustainable but carries a meaningful risk of a spending shortfall';
  if (rate >= 0.25) return 'may not be sustainable without changes';
  return 'is unlikely to be sustainable without changes';
}

function describeLongevityRisk(horizonRate: number, endingRate: number, horizonAge: number): string {
  const rateDecline = horizonRate - endingRate;

  if (rateDecline >= 0.25) {
    return `The sharp decline indicates substantial longevity risk after age ${horizonAge}.`;
  }
  if (rateDecline >= 0.1) {
    return `The decline indicates meaningful longevity risk after age ${horizonAge}.`;
  }
  if (rateDecline >= 0.025) {
    return `The lower full-projection rate indicates some additional longevity risk after age ${horizonAge}.`;
  }
  return `The similar rates indicate little additional modeled shortfall risk after age ${horizonAge}.`;
}

function RiskMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="risk-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RiskChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: RiskChartPoint }> }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="risk-chart-tooltip">
      <strong>Age {point.age}</strong>
      <span>10th percentile: {formatMoney(point.p10)}</span>
      <span>Median: {formatMoney(point.p50)}</span>
      <span>90th percentile: {formatMoney(point.p90)}</span>
    </div>
  );
}

export function RetirementRiskAnalysis({
  inputs,
  simulations,
  marketAssumption,
  selectedId,
  onSelect,
  runAnalysis
}: {
  inputs: PlannerInputs;
  simulations: number;
  marketAssumption: ResolvedRiskMarketAssumption;
  selectedId: string;
  onSelect: (scenarioId: string) => void;
  runAnalysis: (options?: RetirementRiskAnalysisOptions) => Promise<RetirementRiskAnalysisResult>;
}) {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [progress, setProgress] = useState({ completed: 0, total: simulations });
  const [result, setResult] = useState<RetirementRiskAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortControllerRef.current?.abort();
    setStatus('idle');
    setProgress({ completed: 0, total: simulations });
    setResult(null);
    setError('');
    return () => abortControllerRef.current?.abort();
  }, [runAnalysis, simulations]);

  const startAnalysis = async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStatus('running');
    setResult(null);
    setError('');
    setProgress({ completed: 0, total: simulations });

    try {
      const analysis = await runAnalysis({
        signal: controller.signal,
        onProgress: (completed, total) => {
          const updateInterval = Math.max(1, Math.ceil(total / 100));
          if (completed === total || completed % updateInterval === 0) setProgress({ completed, total });
        }
      });
      if (controller.signal.aborted) return;
      setResult(analysis);
      setProgress({ completed: analysis.simulations, total: analysis.simulations });
      setStatus('complete');
    } catch (analysisError) {
      if (controller.signal.aborted) return;
      setError(analysisError instanceof Error ? analysisError.message : 'The risk analysis could not be completed.');
      setStatus('error');
    }
  };

  const selectedResult =
    result?.scenarios.find((scenario) => scenario.scenarioId === selectedId) ?? result?.scenarios[0];
  const chartData: RiskChartPoint[] = (selectedResult?.portfolioPercentiles ?? []).map((point) => ({
    ...point,
    percentileFloor: point.p10,
    percentileRange: Math.max(0, point.p90 - point.p10)
  }));
  const horizonResult = selectedResult?.portfolioPercentiles.find((point) => point.age === inputs.horizonAge);

  return (
    <CollapsiblePanel title="Retirement Risk Analysis" icon={<ShieldCheck />} info={riskAnalysisInfo}>
      <div className="risk-analysis-heading">
        <div>
          <p className="risk-analysis-description">
            Optionally test every retirement strategy across the same {formatCount(simulations)} seeded market and
            inflation paths.
          </p>
          <p className="risk-market-assumption">
            <strong>Effective market assumption:</strong> {marketAssumption.label}; target average portfolio return{' '}
            {formatNaturalPercent(marketAssumption.targetPortfolioReturn)}
          </p>
        </div>
      </div>

      <div className="risk-analysis-run">
        <p className="risk-analysis-disclaimer">
          This is sensitivity analysis, not a forecast. A path is fully funded only when all modeled spending is met
          through the ending age. Results depend on the planner inputs and simulated-path assumptions.
        </p>
        <button className="risk-analysis-button" type="button" disabled={status === 'running'} onClick={startAnalysis}>
          {status === 'running' ? <LoaderCircle className="spinning" /> : result ? <RefreshCw /> : <ShieldCheck />}
          {status === 'running' ? 'Running Risk Analysis' : result ? 'Run Again' : 'Run Retirement Risk Analysis'}
        </button>
      </div>

      {status === 'running' && (
        <div className="risk-analysis-progress" aria-live="polite">
          <progress value={progress.completed} max={Math.max(1, progress.total)} />
          <span>
            {formatCount(progress.completed)} of {formatCount(progress.total)} paths
          </span>
        </div>
      )}

      {status === 'error' && <p className="risk-analysis-error">{error}</p>}

      {result && selectedResult && (
        <>
          <div className="risk-analysis-context">
            <strong>{scenarioLabel(selectedResult)}</strong>
            <span>
              {formatCount(result.simulations)} reproducible paths · base seed {result.baseSeed}
            </span>
          </div>

          <div className="risk-metrics">
            <RiskMetric label="Fully Funded Paths" value={formatPercent(selectedResult.fullyFundedRate)} />
            <RiskMetric label="Depletion Risk" value={formatPercent(selectedResult.depletionRisk)} />
            <RiskMetric
              label="P10 Ending (Inflation-Adjusted Dollars)"
              value={formatMoney(selectedResult.endingPortfolioP10)}
            />
            <RiskMetric
              label="Median Ending (Inflation-Adjusted Dollars)"
              value={formatMoney(selectedResult.endingPortfolioP50)}
            />
            <RiskMetric
              label="P90 Ending (Inflation-Adjusted Dollars)"
              value={formatMoney(selectedResult.endingPortfolioP90)}
            />
          </div>

          <div className="risk-chart-heading">
            <div className="risk-chart-title">
              <h3>Portfolio Range in Inflation-Adjusted Dollars</h3>
              <Popover trigger={<Info />} html={riskChartInfo} placement="bottom-start" />
            </div>
            <p>The shaded area contains the middle 80% of simulated outcomes; the line is the median.</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <XAxis dataKey="age" />
              <YAxis tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`} />
              <Tooltip content={<RiskChartTooltip />} />
              <Area
                type="monotone"
                dataKey="percentileFloor"
                stackId="percentile-band"
                stroke="none"
                fill="transparent"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="percentileRange"
                stackId="percentile-band"
                stroke="none"
                fill="#93c5fd"
                fillOpacity={0.38}
                isAnimationActive={false}
              />
              <Line type="monotone" dataKey="p50" stroke="#2563eb" strokeWidth={3} dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          <div className="risk-result-summary">
            <p>
              Based on the current planner inputs and simulated market assumptions, this projection covered all planned
              spending through your primary horizon age of {inputs.horizonAge} in{' '}
              {selectedResult.horizonFullyFundedRate < 0.5 ? 'only ' : ''}
              <strong>{formatNaturalPercent(selectedResult.horizonFullyFundedRate)}</strong> of simulations, or{' '}
              <strong>{describeModeledFrequency(selectedResult.horizonFullyFundedRate)}</strong>. That represents a{' '}
              <strong>
                {describeSuccessLevel(selectedResult.horizonFullyFundedRate)} modeled probability of success through the
                primary horizon
              </strong>
              .{' '}
              {inputs.horizonAge !== inputs.endAge && (
                <>
                  When the projection extends through the ending age of {inputs.endAge}, the modeled success rate{' '}
                  {selectedResult.fullyFundedRate < selectedResult.horizonFullyFundedRate ? 'falls to ' : 'remains at '}
                  {selectedResult.fullyFundedRate < 0.5 ? 'only ' : ''}
                  <strong>{formatNaturalPercent(selectedResult.fullyFundedRate)}</strong>, or{' '}
                  <strong>{describeModeledFrequency(selectedResult.fullyFundedRate)}</strong>, representing a{' '}
                  <strong>{describeSuccessLevel(selectedResult.fullyFundedRate)} full-projection success rate</strong>.{' '}
                  {describeLongevityRisk(
                    selectedResult.horizonFullyFundedRate,
                    selectedResult.fullyFundedRate,
                    inputs.horizonAge
                  )}{' '}
                </>
              )}
              A spending shortfall occurred by age {inputs.endAge} in the remaining{' '}
              <strong>{formatNaturalPercent(selectedResult.depletionRisk)}</strong> of simulations. The typical result
              had about{' '}
              {horizonResult && inputs.horizonAge !== inputs.endAge && (
                <>
                  <strong>{formatMoney(horizonResult.p50)}</strong> remaining at age {inputs.horizonAge} and{' '}
                </>
              )}
              <strong>{formatMoney(selectedResult.endingPortfolioP50)}</strong> remaining by age {inputs.endAge},
              suggesting the current spending level {describeSustainability(selectedResult.fullyFundedRate)}.
            </p>
          </div>

          <div className="table-container risk-results-table">
            <table className="sticky-table selectable">
              <thead>
                <tr>
                  <th>Claim Age</th>
                  <th>Roth</th>
                  <th>
                    Success Through
                    <br />
                    Age {inputs.horizonAge}
                  </th>
                  <th>
                    Success Through
                    <br />
                    Age {inputs.endAge}
                  </th>
                  <th>
                    Median Balance at Age {inputs.horizonAge}
                    <br />
                    (Inflation-Adjusted Dollars)
                  </th>
                  <th>
                    Typical First
                    <br />
                    Shortfall Age
                  </th>
                  <th>
                    Typical Total Shortfall
                    <br />
                    (Inflation-Adjusted Dollars)
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map((scenario) => (
                  <tr
                    key={scenario.scenarioId}
                    className={scenario.scenarioId === selectedResult.scenarioId ? 'scenario selected' : 'scenario'}
                    onClick={() => onSelect(scenario.scenarioId)}>
                    <td>{scenario.claimAge ?? 'Already Claimed'}</td>
                    <td>
                      {scenario.rothConversionLabel ??
                        (scenario.rothConvType === RothConversionType.None
                          ? 'None'
                          : scenario.rothConvType === RothConversionType.Fixed
                            ? 'Fixed'
                            : 'Optimized')}
                    </td>
                    <td>{formatPercent(scenario.horizonFullyFundedRate)}</td>
                    <td>{formatPercent(scenario.fullyFundedRate)}</td>
                    <td>{formatMoney(getMedianPortfolioAtAge(scenario, inputs.horizonAge))}</td>
                    <td>{scenario.medianFirstShortfallAge ?? '—'}</td>
                    <td>
                      {scenario.medianFirstShortfallAge === null
                        ? '—'
                        : formatMoney(scenario.medianTotalUnfundedSpending)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </CollapsiblePanel>
  );
}
