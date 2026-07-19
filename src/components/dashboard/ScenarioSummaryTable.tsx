import { Summary } from 'lucide-react';
import { RothConversionType, type ScenarioSummary } from '../../models/RetirementTypes';
import type { PlannerInputs } from '../../models/RetirementTypes';
import { formatMoney } from '../../utils/format';

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
    <section className="panel">
      <h2>
        <Summary /> Scenario Summary
      </h2>
      <div className="table-container">
        <table className="sticky-table selectable">
          <thead>
            <tr>
              <th>Claim Age</th>
              <th>Roth</th>
              <th>Age {inputs.horizonAge}</th>
              <th>Age {inputs.endAge}</th>
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
                <td>{s.claimAge}</td>
                <td>{s.rothConvType === RothConversionType.None ? 'None' : s.rothConvType === RothConversionType.Base ? 'Base' : 'Aggressive'}</td>
                <td>{formatMoney(s.horizonPortfolioAge)}</td>
                <td>{formatMoney(s.endPortfolioAge)}</td>
                <td>{formatMoney(s.totalSSToHorizon)}</td>
                <td>{formatMoney(s.totalTaxes)}</td>
                <td>{s.depletionAge ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
