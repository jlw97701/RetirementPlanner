import { useEffect, useMemo, useState } from 'react';
import { CopyPlus, Info, Plus, RotateCcw, Save, TableConfig, Trash2 } from 'lucide-react';
import { Popover } from '../shared/Popover';

import {
  IRMAA_CONFIGURATIONS,
  type IrmaaConfiguration,
  type IrmaaFilingStatus,
  type IrmaaTier
} from '../../data/irmaaTables';

const filingStatusLabels: Record<IrmaaFilingStatus, string> = {
  single: 'Single / Head of Household',
  marriedJoint: 'Married Filing Jointly',
  marriedSeparate: 'Married Filing Separately'
};

const configurationKey = (configuration: Pick<IrmaaConfiguration, 'premiumYear' | 'filingStatus'>) =>
  `${configuration.premiumYear}:${configuration.filingStatus}`;

const cloneConfiguration = (configuration: IrmaaConfiguration): IrmaaConfiguration => structuredClone(configuration);

export function IrmaaTableEditor({
  configurations,
  onChange
}: {
  configurations: IrmaaConfiguration[];
  onChange: (configurations: IrmaaConfiguration[]) => void;
}) {
  const sortedConfigurations = useMemo(
    () => [...configurations].sort((a, b) => b.premiumYear - a.premiumYear || a.filingStatus.localeCompare(b.filingStatus)),
    [configurations]
  );
  const [selectedKey, setSelectedKey] = useState(() => configurationKey(sortedConfigurations[0]));
  const selected = configurations.find((item) => configurationKey(item) === selectedKey) ?? sortedConfigurations[0];
  const [draft, setDraft] = useState(() => cloneConfiguration(selected));

  useEffect(() => {
    setDraft(cloneConfiguration(selected));
  }, [selected]);

  const errors = validateConfiguration(draft, configurations, selectedKey);

  const updateTier = (index: number, changes: Partial<IrmaaTier>) => {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.map((tier, tierIndex) => (tierIndex === index ? { ...tier, ...changes } : tier))
    }));
  };

  const apply = () => {
    if (errors.length > 0) return;
    const normalized = {
      ...draft,
      tiers: draft.tiers.map((tier, index) => ({ ...tier, tier: index }))
    };
    onChange(configurations.map((item) => (configurationKey(item) === selectedKey ? normalized : item)));
    setSelectedKey(configurationKey(normalized));
  };

  const copyToNextYear = () => {
    let premiumYear = Math.max(...configurations.map((item) => item.premiumYear)) + 1;
    while (configurations.some((item) => item.premiumYear === premiumYear && item.filingStatus === selected.filingStatus)) {
      premiumYear += 1;
    }
    const copy: IrmaaConfiguration = {
      ...cloneConfiguration(selected),
      premiumYear,
      published: false,
      sourceUrl: ''
    };
    onChange([...configurations, copy]);
    setSelectedKey(configurationKey(copy));
  };

  const removeSelected = () => {
    const sameStatusCount = configurations.filter((item) => item.filingStatus === selected.filingStatus).length;
    if (sameStatusCount <= 1) return;
    const remaining = configurations.filter((item) => configurationKey(item) !== selectedKey);
    onChange(remaining);
    setSelectedKey(configurationKey(remaining[0]));
  };

  const restoreDefaults = () => {
    const restored = structuredClone(IRMAA_CONFIGURATIONS) as IrmaaConfiguration[];
    onChange(restored);
    setSelectedKey(configurationKey(restored[0]));
  };

  const addTier = () => {
    setDraft((current) => {
      const tiers = [...current.tiers];
      const finalTier = tiers.pop();
      const priorUpper = tiers[tiers.length - 1]?.upperMagi ?? 0;
      tiers.push({
        tier: tiers.length,
        upperMagi: priorUpper + 25_000,
        monthlyPartBAdjustment: 0,
        monthlyPartDAdjustment: 0
      });
      if (finalTier) tiers.push(finalTier);
      return { ...current, tiers };
    });
  };

  return (
    <main className="irmaa-layout">
      <section className="panel irmaa-editor">
        <div className="irmaa-editor-heading">
          <h2>
            <TableConfig />
            IRMAA Tables
          </h2>
          <Popover
            trigger={<Info />}
            html={`
              <h3>IRMAA Tables</h3>
              <p>
                This page maintains the premium-year tables used to estimate Medicare Part B and Part D
                income-related adjustments. The retirement projection uses the table corresponding to the
                filing status selected in Planner Inputs; Head of Household uses the individual table.
              </p>
              <p>
                Each tier contains a MAGI upper limit and monthly Part B and Part D adjustment. The final tier
                must have no upper limit. The standard Part B premium contributes to the displayed Medicare/Health
                cost, while IRMAA reports the additional income-related Part B and Part D amounts.
              </p>
              <p>
                <strong>Published</strong> tables should match an official source and require its URL.
              </p>
              <p>
                <strong> Custom</strong> tables apply exactly to their specified year but do not become the basis
                for later estimates. If a year has no exact table, the planner inflates the latest earlier published
                table and labels the result as estimated.
              </p>
              <p>
                Use <strong>Copy to Next Year</strong> to create a draft, edit its values, and choose
                <strong> Apply Changes</strong> after all validation errors are resolved. Saved configurations are
                stored in this browser and immediately recalculate the retirement scenarios.
              </p>
              <p>
                IRMAA uses income from two years before the Medicare premium year. The resulting surcharge remains
                visible separately and is added to Spending only when the user indicates that Annual Spending excludes
                Medicare and healthcare costs.
              </p>
            `}
          />
        </div>
        <p className="input-help">
          Maintain premium-year IRMAA configurations for each filing status. Exact configurations override
          inflation-based estimates for that year.
        </p>

        <div className="irmaa-toolbar">
          <label>
            Configuration
            <select value={selectedKey} onChange={(event) => setSelectedKey(event.target.value)}>
              {sortedConfigurations.map((configuration) => (
                <option key={configurationKey(configuration)} value={configurationKey(configuration)}>
                  {configuration.premiumYear} — {filingStatusLabels[configuration.filingStatus]}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={copyToNextYear}>
            <CopyPlus size={16} /> Copy to Next Year
          </button>
          <button
            type="button"
            onClick={removeSelected}
            disabled={
              configurations.filter((item) => item.filingStatus === selected.filingStatus).length <= 1
            }>
            <Trash2 size={16} /> Delete
          </button>
          <button type="button" onClick={restoreDefaults}>
            <RotateCcw size={16} /> Restore Bundled Defaults
          </button>
        </div>

        <div className="irmaa-fields">
          <label>
            Premium Year
            <input
              type="number"
              min="2000"
              max="2200"
              value={draft.premiumYear}
              onChange={(event) => setDraft({ ...draft, premiumYear: Number(event.target.value) })}
            />
          </label>
          <label>
            Filing Status
            <select
              value={draft.filingStatus}
              onChange={(event) =>
                setDraft({ ...draft, filingStatus: event.target.value as IrmaaFilingStatus, published: false })
              }>
              {Object.entries(filingStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Standard Part B Monthly Premium
            <input
              type="number"
              min="0"
              step="0.1"
              value={draft.standardPartBPremium}
              onChange={(event) => setDraft({ ...draft, standardPartBPremium: Number(event.target.value) })}
            />
          </label>
          <label className="irmaa-checkbox">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(event) => setDraft({ ...draft, published: event.target.checked })}
            />
            Published table
          </label>
          <label className="irmaa-source-field">
            Official Source URL
            <input
              type="url"
              value={draft.sourceUrl}
              onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })}
            />
          </label>
        </div>

        <div className="table-container irmaa-table-container">
          <table>
            <thead>
              <tr>
                <th>Tier</th>
                <th>MAGI Upper Limit</th>
                <th>Upper Limit Included</th>
                <th>Part B Monthly Adjustment</th>
                <th>Part D Monthly Adjustment</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {draft.tiers.map((tier, index) => (
                <tr key={index}>
                  <td>{index}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={tier.upperMagi ?? ''}
                      placeholder="No limit"
                      onChange={(event) =>
                        updateTier(index, {
                          upperMagi: event.target.value === '' ? null : Number(event.target.value)
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={tier.upperMagiInclusive !== false}
                      disabled={tier.upperMagi === null}
                      onChange={(event) => updateTier(index, { upperMagiInclusive: event.target.checked })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={tier.monthlyPartBAdjustment}
                      onChange={(event) => updateTier(index, { monthlyPartBAdjustment: Number(event.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={tier.monthlyPartDAdjustment}
                      onChange={(event) => updateTier(index, { monthlyPartDAdjustment: Number(event.target.value) })}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      aria-label={`Remove tier ${index}`}
                      disabled={draft.tiers.length <= 1}
                      onClick={() =>
                        setDraft({ ...draft, tiers: draft.tiers.filter((_, tierIndex) => tierIndex !== index) })
                      }>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="irmaa-editor-footer">
          <button type="button" onClick={addTier}>
            <Plus size={16} /> Add Tier
          </button>
          <button type="button" className="primary-button" disabled={errors.length > 0} onClick={apply}>
            <Save size={16} /> Apply Changes
          </button>
        </div>
        {errors.length > 0 && (
          <ul className="validation-errors">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function validateConfiguration(
  draft: IrmaaConfiguration,
  configurations: readonly IrmaaConfiguration[],
  originalKey: string
): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(draft.premiumYear) || draft.premiumYear < 2000 || draft.premiumYear > 2200) {
    errors.push('Premium year must be an integer from 2000 through 2200.');
  }
  if (configurations.some((item) => configurationKey(item) === configurationKey(draft) && configurationKey(item) !== originalKey)) {
    errors.push('A configuration already exists for this premium year and filing status.');
  }
  const original = configurations.find((item) => configurationKey(item) === originalKey);
  const originalStatusCount = configurations.filter((item) => item.filingStatus === original?.filingStatus).length;
  if (original && draft.filingStatus !== original.filingStatus && originalStatusCount <= 1) {
    errors.push(`At least one ${filingStatusLabels[original.filingStatus]} configuration is required.`);
  }
  if (!Number.isFinite(draft.standardPartBPremium) || draft.standardPartBPremium < 0) {
    errors.push('The standard Part B premium must be nonnegative.');
  }
  if (draft.published && !draft.sourceUrl.trim()) errors.push('A published table requires an official source URL.');
  if (draft.published && draft.sourceUrl.trim()) {
    try {
      const source = new URL(draft.sourceUrl);
      if (source.protocol !== 'https:' && source.protocol !== 'http:') throw new Error();
    } catch {
      errors.push('The official source must be a valid HTTP or HTTPS URL.');
    }
  }
  if (draft.tiers.length === 0) errors.push('At least one tier is required.');

  let priorUpper = -1;
  draft.tiers.forEach((tier, index) => {
    const isLast = index === draft.tiers.length - 1;
    if (!isLast && (tier.upperMagi === null || !Number.isFinite(tier.upperMagi) || tier.upperMagi <= priorUpper)) {
      errors.push(`Tier ${index} must have an upper MAGI limit greater than the preceding tier.`);
    }
    if (isLast && tier.upperMagi !== null) errors.push('The final tier must have no upper MAGI limit.');
    if (tier.upperMagi !== null) priorUpper = tier.upperMagi;
    if (!Number.isFinite(tier.monthlyPartBAdjustment) || tier.monthlyPartBAdjustment < 0) {
      errors.push(`Tier ${index} Part B adjustment must be nonnegative.`);
    }
    if (!Number.isFinite(tier.monthlyPartDAdjustment) || tier.monthlyPartDAdjustment < 0) {
      errors.push(`Tier ${index} Part D adjustment must be nonnegative.`);
    }
  });
  return errors;
}
