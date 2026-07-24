import { Summary } from 'lucide-react';
import { RothConversionType, SSBenefitValueType, type ScenarioSummary } from '../../models/RetirementTypes';
import { formatMoney } from '../../utils/format';
import { CollapsiblePanel } from '../shared/CollapsiblePanel';
import type { PlannerInputs } from '../../models/RetirementTypes';
import { useEffect, useRef } from 'react';

export interface ScenarioSummaryScrollRequest {
  scenarioId: string;
  requestId: number;
}

export function sortScenarioSummaries(summaries: readonly ScenarioSummary[]): ScenarioSummary[] {
  return [...summaries].sort((left, right) => {
    const leftClaimAge = left.claimAge ?? Number.NEGATIVE_INFINITY;
    const rightClaimAge = right.claimAge ?? Number.NEGATIVE_INFINITY;

    if (leftClaimAge !== rightClaimAge) return leftClaimAge - rightClaimAge;
    if (left.rothConvType !== right.rothConvType) {
      return left.rothConvType - right.rothConvType;
    }

    return left.scenarioId.localeCompare(right.scenarioId);
  });
}

export function ScenarioSummaryTable({
  summaries,
  inputs,
  selectedId,
  onSelect,
  scrollRequest
}: {
  summaries: ScenarioSummary[];
  inputs: PlannerInputs;
  selectedId: string;
  onSelect: (id: string) => void;
  scrollRequest?: ScenarioSummaryScrollRequest;
}) {
  const showIrmaa = summaries.some((summary) => summary.totalIrmaaSurcharge > 0);
  const sortedSummaries = sortScenarioSummaries(summaries);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

  useEffect(() => {
    if (!scrollRequest) return;

    const tableIsCollapsed = (tableContainerRef.current?.clientHeight ?? 0) === 0;
    const scrollDelay = tableIsCollapsed ? 350 : 0;
    const timeoutId = window.setTimeout(() => {
      const row = rowRefs.current.get(scrollRequest.scenarioId);
      if (!row) return;

      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      row.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }, scrollDelay);

    return () => window.clearTimeout(timeoutId);
  }, [scrollRequest]);

  return (
    <CollapsiblePanel
      title="Scenario Summary"
      icon={<Summary />}
      expandRequestKey={scrollRequest?.requestId}
      info={`
        <h3>Scenario Summary</h3>
        <p>
          This table compares Social Security claiming and Roth conversion strategies. 
          Portfolio values are shown at the selected horizon age and final projection age.
        </p>
        <p>
          <strong>Future Dollars</strong> are projected account balances expressed in the dollars of that future year.
        </p>
        <p>
          <strong>Inflation-Adjusted Dollars</strong> show the same balances using the purchasing power of the first projection year.
        </p>
        <p>
          The table also shows first-year Social Security, cumulative Social Security and taxes, 
          estimated IRMAA surcharges, and the age when the portfolio can no longer fully fund projected spending.
          Medicare/Health is the total modeled standard Part B, Part D or other coverage, out-of-pocket healthcare,
          and IRMAA. It is added to withdrawals only when Annual Spending excludes those costs.
        </p>
      `}>
      <div className="table-container" ref={tableContainerRef}>
        <table className="sticky-table selectable">
          <thead>
            <tr>
              <th>
                {inputs.ssBenefitValueType === SSBenefitValueType.ActualCurrentBenefit
                  ? 'Social Security'
                  : 'Claim Age'}
              </th>
              <th>Roth</th>
              <th>
                Age {inputs.horizonAge}
                <br />
                Future Dollars
              </th>
              <th>
                Age {inputs.horizonAge}
                <br />
                Inflation-Adjusted
              </th>
              <th>
                Age {inputs.endAge}
                <br />
                Future Dollars
              </th>
              <th>
                Age {inputs.endAge}
                <br />
                Inflation-Adjusted
              </th>
              <th>
                First-Year
                <br />
                Social Sec
              </th>
              <th>
                Social Sec
                <br />
                to {inputs.horizonAge}
              </th>
              <th>
                Total
                <br />
                Taxes
              </th>
              {showIrmaa && (
                <th>
                  Estimated
                  <br />
                  IRMAA
                </th>
              )}
              <th>
                Medicare/
                <br />
                Health
              </th>
              <th>
                Depletion
                <br />
                Age
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedSummaries.map((s) => (
              <tr
                key={s.scenarioId}
                ref={(row) => {
                  if (row) rowRefs.current.set(s.scenarioId, row);
                  else rowRefs.current.delete(s.scenarioId);
                }}
                className={s.scenarioId === selectedId ? 'scenario selected' : 'scenario'}
                onClick={() => onSelect(s.scenarioId)}>
                <td>{s.claimAge === null ? 'Already Claimed' : s.claimAge}</td>
                <td>
                  {s.rothConversionLabel ??
                    (s.rothConvType === RothConversionType.None
                      ? 'None'
                      : s.rothConvType === RothConversionType.Fixed
                        ? 'Fixed'
                        : 'Optimized')}
                </td>
                <td>{formatMoney(s.horizonPortfolioAge)}</td>
                <td>{formatMoney(s.horizonPortfolioCurrentDollars)}</td>
                <td>{formatMoney(s.endPortfolioAge)}</td>
                <td>{formatMoney(s.endPortfolioCurrentDollars)}</td>
                <td>{formatMoney(s.firstAnnualSS)}</td>
                <td>{formatMoney(s.totalSSToHorizon)}</td>
                <td>{formatMoney(s.totalTaxes)}</td>
                {showIrmaa && <td>{formatMoney(s.totalIrmaaSurcharge)}</td>}
                <td>{formatMoney(s.totalMedicareHealthcareCost)}</td>
                <td>{s.depletionAge ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsiblePanel>
  );
}
