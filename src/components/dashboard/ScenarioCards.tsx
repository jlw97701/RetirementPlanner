import { Sparkles } from 'lucide-react';
import { RothConversionType, type ScenarioSummary } from '../../models/RetirementTypes';
import { formatMoney } from '../../utils/format';
import { CollapsiblePanel } from '../shared/CollapsiblePanel';

export interface ScenarioHighlight {
  reason: string;
  summary: ScenarioSummary;
}

function rothConversionLabel(type: RothConversionType): string {
  if (type === RothConversionType.None) return 'No Roth';
  if (type === RothConversionType.Base) return 'Base Roth';
  return 'Aggressive Roth';
}

function scenarioLabel(summary: ScenarioSummary): string {
  const socialSecurity = summary.claimAge === null ? 'Already Receiving Benefits' : `Claim at ${summary.claimAge}`;
  return `${socialSecurity} | ${rothConversionLabel(summary.rothConvType)}`;
}

function fundingScore(summary: ScenarioSummary): number {
  return summary.depletionAge ?? Number.POSITIVE_INFINITY;
}

export function selectScenarioHighlights(summaries: readonly ScenarioSummary[]): ScenarioHighlight[] {
  if (summaries.length === 0) return [];

  const highlights: ScenarioHighlight[] = [];
  const usedScenarioIds = new Set<string>();
  const addFirstUnused = (reason: string, candidates: readonly ScenarioSummary[]) => {
    const summary = candidates.find((candidate) => !usedScenarioIds.has(candidate.scenarioId));
    if (!summary || highlights.length >= 6) return;
    highlights.push({ reason, summary });
    usedScenarioIds.add(summary.scenarioId);
  };

  const baselineCandidates = [
    ...summaries.filter(
      (summary) => summary.claimAge === 62 && summary.rothConvType === RothConversionType.None
    ),
    ...summaries.filter((summary) => summary.rothConvType === RothConversionType.None),
    ...summaries
  ];
  addFirstUnused('Baseline', baselineCandidates);

  const highestHorizonBalance = Math.max(...summaries.map((summary) => summary.horizonPortfolioCurrentDollars));
  addFirstUnused(
    'Highest Horizon Balance',
    summaries.filter((summary) => summary.horizonPortfolioCurrentDollars === highestHorizonBalance)
  );

  const highestEndingBalance = Math.max(...summaries.map((summary) => summary.endPortfolioCurrentDollars));
  addFirstUnused(
    'Highest Ending Balance',
    summaries.filter((summary) => summary.endPortfolioCurrentDollars === highestEndingBalance)
  );

  const bestFundingScore = Math.max(...summaries.map(fundingScore));
  const longestFundedScenarios = summaries
    .filter((summary) => fundingScore(summary) === bestFundingScore)
    .sort((left, right) => right.endPortfolioCurrentDollars - left.endPortfolioCurrentDollars);
  addFirstUnused('Longest Funding', longestFundedScenarios);

  const lowestTaxAtBestFunding = Math.min(...longestFundedScenarios.map((summary) => summary.totalTaxes));
  addFirstUnused(
    'Lowest Taxes at Best Funding Duration',
    longestFundedScenarios.filter((summary) => summary.totalTaxes === lowestTaxAtBestFunding)
  );

  const highestSocialSecurity = Math.max(...summaries.map((summary) => summary.totalSSToHorizon));
  addFirstUnused(
    'Most Social Security by Horizon',
    summaries.filter((summary) => summary.totalSSToHorizon === highestSocialSecurity)
  );

  return highlights;
}

export function ScenarioCards({
  summaries,
  horizonAge,
  endAge,
  selectedId,
  onSelect
}: {
  summaries: ScenarioSummary[];
  horizonAge: number;
  endAge: number;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const highlights = selectScenarioHighlights(summaries);

  if (highlights.length === 0) return null;

  return (
    <CollapsiblePanel
      title="Scenario Highlights"
      icon={<Sparkles />}
      info={`
        <h3>Scenario Highlights</h3>
        <p>
          These cards identify strategies with notable individual characteristics, such as the highest balance,
          longest funding duration, or lowest taxes among the longest-funded strategies.
        </p>
        <p>
          A highlighted characteristic does not make a scenario the best overall strategy or a financial
          recommendation. Select a card to view its full projection in the tables and chart below.
        </p>
      `}>
      <div className="scenario-grid">
        {highlights.map(({ reason, summary }) => (
          <button
            key={summary.scenarioId}
            type="button"
            aria-pressed={summary.scenarioId === selectedId}
            className={summary.scenarioId === selectedId ? 'scenario-card selected' : 'scenario-card'}
            onClick={() => onSelect(summary.scenarioId)}>
            <span className="scenario-card-reason">{reason}</span>
            <strong>{scenarioLabel(summary)}</strong>
            <span>
              Age {horizonAge} balance: {formatMoney(summary.horizonPortfolioCurrentDollars)}
            </span>
            <span>
              Age {endAge} balance: {formatMoney(summary.endPortfolioCurrentDollars)}
            </span>
            <span>Projected taxes: {formatMoney(summary.totalTaxes)}</span>
            <span>
              {summary.depletionAge === null
                ? `No spending shortfall through age ${endAge}`
                : `First spending shortfall at age ${summary.depletionAge}`}
            </span>
          </button>
        ))}
      </div>
    </CollapsiblePanel>
  );
}
