import { useState } from 'react';
import { Info, TableConfig } from 'lucide-react';
import { Popover } from '../shared/Popover';
import type {
  FederalTaxConfig,
  FilingStatus,
  JurisdictionTaxConfig,
  SocialSecurityTaxConfig,
  DeductionConfig,
  TaxBracket
} from '../../models/TaxTypes';

type EditableTaxConfigChanges = {
  brackets?: TaxBracket[];
  deductions?: DeductionConfig;
  socialSecurity?: SocialSecurityTaxConfig;
};

function isFederalTaxConfig(configuration: JurisdictionTaxConfig): configuration is FederalTaxConfig {
  return configuration.jurisdiction === 'federal';
}

const federalPanelInfo = `
  <h3>Federal Tax Brackets</h3>
  <p>
    Select a filing status to review or edit its federal brackets, standard deduction,
    age-based deduction, and Social Security provisional-income thresholds.
  </p>
  <p>
    The filing-status selector on this page chooses the table being maintained. It does not
    change the active retirement projection; use <strong>Tax Filing Status</strong> in Planner
    Inputs for that.
  </p>
  <p>
    <strong>From</strong> is the beginning of a taxable-income bracket and <strong>To</strong>
    is the beginning of the next bracket. Leave To blank only for the final, unlimited bracket.
    Enter rates as decimals—for example, <strong>0.12</strong> means 12%.
  </p>
  <p>
    The additional age-65 deduction is applied once based on the modeled person's age.
    Social Security thresholds determine how much of the annual benefit is included in federal AGI.
  </p>
  <p>
    Changes are saved in this browser and immediately recalculate projections. The selected
    configuration remains a planning estimate and is currently used for all projection years.
  </p>
`;

const statePanelInfo = `
  <h3>State Tax Brackets</h3>
  <p>
    Select a filing status to review or edit its Oregon brackets, standard deduction, and
    age-based deduction. Oregon uses one bracket schedule for Single and Married Filing
    Separately, and another for Married Filing Jointly and Head of Household.
  </p>
  <p>
    The filing-status selector on this page chooses the table being maintained. It does not
    change the active retirement projection; use <strong>Tax Filing Status</strong> in Planner
    Inputs for that.
  </p>
  <p>
    <strong>From</strong> is the beginning of a taxable-income bracket and <strong>To</strong>
    is the beginning of the next bracket. Leave To blank only for the final, unlimited bracket.
    Enter rates as decimals—for example, <strong>0.0875</strong> means 8.75%.
  </p>
  <p>
    Oregon Social Security benefits are excluded. The state result is an estimate and does not
    yet model every Oregon addition, subtraction, credit, or the federal-tax subtraction.
  </p>
  <p>
    Changes are saved in this browser and immediately recalculate projections. The bundled
    2026 planning configuration uses the latest published 2025 Oregon schedules until tax-year
    2026 tables are available.
  </p>
`;

const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  marriedFilingJointly: 'Married Filing Jointly',
  marriedFilingSeparately: 'Married Filing Separately',
  headOfHousehold: 'Head of Household'
};

export function TaxTableEditor<T extends JurisdictionTaxConfig>({
  title,
  configurations,
  initialFilingStatus,
  onChange
}: {
  title: string;
  configurations: T[];
  initialFilingStatus: FilingStatus;
  onChange: (configurations: T[]) => void;
}) {
  const [selectedFilingStatus, setSelectedFilingStatus] = useState(initialFilingStatus);
  const selected = configurations.find((configuration) => configuration.filingStatus === selectedFilingStatus);

  if (!selected) {
    return (
      <section className="panel">
        <h2>
          <TableConfig />
          {title}
        </h2>
        <p>No {FILING_STATUS_LABELS[selectedFilingStatus]} configuration is available.</p>
      </section>
    );
  }

  const updateConfiguration = (changes: EditableTaxConfigChanges) =>
    onChange(configurations.map((configuration) => (configuration === selected ? { ...configuration, ...changes } : configuration)));

  const updateBracket = (id: string, changes: Partial<TaxBracket>) =>
    updateConfiguration({
      brackets: selected.brackets.map((bracket) => (bracket.id === id ? { ...bracket, ...changes } : bracket))
    });

  const federal = isFederalTaxConfig(selected) ? selected : null;

  return (
    <section className="panel tax-table-editor">
      <div className="tax-editor-heading">
        <h2>
          <TableConfig />
          {title}
        </h2>
        <Popover
          trigger={<Info />}
          html={selected.jurisdiction === 'federal' ? federalPanelInfo : statePanelInfo}
        />
      </div>

      <label className="tax-configuration-select">
        Filing Status
        <select
          value={selectedFilingStatus}
          onChange={(event) => setSelectedFilingStatus(event.target.value as FilingStatus)}>
          {Object.entries(FILING_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className="tax-deduction-fields">
        <label>
          Standard Deduction
          <input
            type="number"
            min="0"
            value={selected.deductions.standardDeduction}
            onChange={(event) =>
              updateConfiguration({
                deductions: { ...selected.deductions, standardDeduction: Number(event.target.value) }
              })
            }
          />
        </label>
        <label>
          Additional Deduction at 65
          <input
            type="number"
            min="0"
            value={selected.deductions.additionalDeduction65}
            onChange={(event) =>
              updateConfiguration({
                deductions: { ...selected.deductions, additionalDeduction65: Number(event.target.value) }
              })
            }
          />
        </label>
        {federal && (
          <>
            <label>
              Social Security Base Threshold
              <input
                type="number"
                min="0"
                value={federal.socialSecurity.baseThreshold}
                onChange={(event) =>
                  updateConfiguration({
                    socialSecurity: { ...federal.socialSecurity, baseThreshold: Number(event.target.value) }
                  })
                }
              />
            </label>
            <label>
              Social Security Second Threshold
              <input
                type="number"
                min="0"
                value={federal.socialSecurity.secondThreshold}
                onChange={(event) =>
                  updateConfiguration({
                    socialSecurity: { ...federal.socialSecurity, secondThreshold: Number(event.target.value) }
                  })
                }
              />
            </label>
          </>
        )}
      </div>

      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          {selected.brackets.map((bracket) => (
            <tr key={bracket.id}>
              <td>
                <input
                  type="number"
                  value={bracket.lowerBound}
                  onChange={(event) => updateBracket(bracket.id, { lowerBound: Number(event.target.value) })}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={bracket.upperBound ?? ''}
                  placeholder="No limit"
                  onChange={(event) =>
                    updateBracket(bracket.id, {
                      upperBound: event.target.value === '' ? null : Number(event.target.value)
                    })
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  step=".001"
                  value={bracket.rate}
                  onChange={(event) => updateBracket(bracket.id, { rate: Number(event.target.value) })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="input-help">
        {selected.year} · {selected.metadata.sourceName}.{' '}
        <a href={selected.metadata.sourceUrl} target="_blank" rel="noopener noreferrer">
          View source
        </a>
        {selected.metadata.notes ? ` ${selected.metadata.notes}` : ''}
      </p>
    </section>
  );
}
