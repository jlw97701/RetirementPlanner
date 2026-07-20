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
      info={`
        <h3>Scenario Summary</h3>
        <p>
          This table compares Social Security claiming and Roth conversion strategies. 
          Portfolio values are shown at the selected horizon age and final projection age.
        </p>
        <p>
          <strong>Nominal</strong> values are projected future account balances.
        </p>
        <p>
          <strong>Start-Year $</strong> values show the same balances adjusted for inflation 
          and expressed in the purchasing power of the first projection year.
        </p>
        <p>
          The table also shows first-year Social Security, cumulative Social Security and taxes, 
          and the age when the portfolio can no longer fully fund projected spending.
        </p>
      `}>
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
              <th>
                Age {inputs.horizonAge}
                <br />
                Nominal
              </th>
              <th>
                Age {inputs.horizonAge}
                <br />
                Start-Year $
              </th>
              <th>
                Age {inputs.endAge}
                <br />
                Nominal
              </th>
              <th>
                Age {inputs.endAge}
                <br />
                Start-Year $
              </th>
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
                <td>{formatMoney(s.horizonPortfolioCurrentDollars)}</td>
                <td>{formatMoney(s.endPortfolioAge)}</td>
                <td>{formatMoney(s.endPortfolioCurrentDollars)}</td> 
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
