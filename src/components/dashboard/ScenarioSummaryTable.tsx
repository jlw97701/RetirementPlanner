import { Summary } from 'lucide-react';
import { RothConversionType, SSBenefitValueType, type ScenarioSummary } from '../../models/RetirementTypes';
import { formatMoney } from '../../utils/format';
import { CollapsiblePanel } from '../shared/CollapsiblePanel';
import type { PlannerInputs } from '../../models/RetirementTypes';

export function ScenarioSummaryTable({
  summaries,
  inputs,
  selectedId,
  onSelect
}: {
  summaries: ScenarioSummary[];
  inputs: PlannerInputs;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <CollapsiblePanel
      title="Scenario Summary"
      icon={<Summary />}
      info="<h3>Scenario Summary</h3><p>Each projection row represents one complete calendar year. The first row begins January 1 of the calendar year in which the user reaches 'Start Age'. Account balances are January 1 balances. Spending, returns, Social Security, conversions, RMDs, and taxes are full-calendar-year amounts.</p>">
      <div className="table-container">
        <table className="sticky-table selectable">
          <thead>
            <tr>
              <th>
                {inputs.ssBenefitValueType === SSBenefitValueType.ActualCurrentBenefit
                  ? 'Social Security'
                  : 'Claim Age'}
              </th>
              <th>Roth</th>
              <th>Age {inputs.horizonAge}</th>
              <th>Age {inputs.endAge}</th>
              <th>First-Year SS</th>
              <th>SS to {inputs.horizonAge}</th>
              <th>Total taxes</th>
              <th>Depletion</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr
                key={s.scenarioId}
                className={s.scenarioId === selectedId ? 'scenario selected' : 'scenario'}
                onClick={() => onSelect(s.scenarioId)}>
                <td>{s.claimAge === null ? 'Already Claimed' : s.claimAge}</td>
                <td>
                  {s.rothConvType === RothConversionType.None
                    ? 'None'
                    : s.rothConvType === RothConversionType.Base
                      ? 'Base'
                      : 'Aggressive'}
                </td>
                <td>{formatMoney(s.horizonPortfolioAge)}</td>
                <td>{formatMoney(s.endPortfolioAge)}</td>
                <td>{formatMoney(s.firstAnnualSS)}</td>
                <td>{formatMoney(s.totalSSToHorizon)}</td>
                <td>{formatMoney(s.totalTaxes)}</td>
                <td>{s.depletionAge ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsiblePanel>
  );
}
