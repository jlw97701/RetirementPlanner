import { RothConversionType, type ScenarioSummary } from '../../models/RetirementTypes';
import { formatMoney } from '../../utils/format';

export function ScenarioCards({
  summaries,
  selectedId,
  onSelect
}: {
  summaries: ScenarioSummary[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="scenario-grid">
      {summaries.map((s) => (
        <button
          key={s.scenarioId}
          className={
            s.scenarioId === selectedId
              ? 'scenario-card selected'
              : 'scenario-card'
          }
          onClick={() => onSelect(s.scenarioId)}>
          <strong>{s.scenarioId}</strong>
          <span>Claim Age: {s.claimAge}</span>
          <span>Roth Conversion: {s.rothConvType === RothConversionType.None ? 'None' : s.rothConvType === RothConversionType.Base ? 'Base' : 'Aggressive'}</span>
          <span>Age 80: {formatMoney(s.horizonPortfolioAge)}</span>
          <span>Taxes: {formatMoney(s.totalTaxes)}</span>
          <span>
            {s.depletionAge
              ? `Depletes around ${s.depletionAge}`
              : 'No modeled depletion'}
          </span>
        </button>
      ))}
    </div>
  );
}
