import { useState } from 'react';
import { Info, TableConfig } from 'lucide-react';
import { Popover } from '../shared/Popover';
import type {
  FederalTaxConfig,
  FilingStatus,
  JurisdictionTaxConfig,
  SocialSecurityTaxConfig,
  DeductionConfig,
  StateCode,
  StateSocialSecurityTreatment,
  StateTaxConfig,
  StateTaxModel,
  TaxBracket
} from '../../models/TaxTypes';
import { STATE_OPTIONS } from '../../data/stateTax2026';

type EditableTaxConfigChanges = {
  brackets?: TaxBracket[];
  deductions?: DeductionConfig;
  socialSecurity?: SocialSecurityTaxConfig;
  taxModel?: StateTaxModel;
  personalExemption?: number;
  personalCredit?: number;
  socialSecurityTreatment?: StateSocialSecurityTreatment;
};

function isFederalTaxConfig(configuration: JurisdictionTaxConfig): configuration is FederalTaxConfig {
  return configuration.jurisdiction === 'federal';
}

function isStateTaxConfig(configuration: JurisdictionTaxConfig): configuration is StateTaxConfig {
  return configuration.jurisdiction === 'state';
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
    Changes are saved in this browser and immediately recalculate projections. The planner uses
    an exact configuration-year table when one is available. For other projection years, it
    inflation-adjusts the nearest usable table's indexed monetary brackets and deductions.
    Federal Social Security provisional-income thresholds remain fixed because they are not
    inflation indexed under current law.
  </p>
`;

const statePanelInfo = `
  <h3>State Tax Brackets</h3>
  <p>
    Select a residence state and filing status to review or edit its statewide brackets,
    deductions, exemptions, credits, and Social Security treatment. States without a broad
    individual income tax have no ordinary-income brackets.
  </p>
  <p>
    The state and filing-status selectors on this page choose the table being maintained. They do
    not change the active retirement projection; use <strong>Residence State</strong> and
    <strong>Tax Filing Status</strong> in Planner Inputs for that.
  </p>
  <p>
    <strong>From</strong> is the beginning of a taxable-income bracket and <strong>To</strong>
    is the beginning of the next bracket. Leave To blank only for the final, unlimited bracket.
    Enter rates as decimals—for example, <strong>0.0875</strong> means 8.75%.
  </p>
  <p>
    The state result is a planning estimate. It includes configured retirement-income and
    Social Security treatment but does not model every state adjustment, credit, recapture,
    alternative tax, or federal-tax subtraction.
  </p>
  <p>
    Changes are saved in this browser and immediately recalculate projections. The bundled
    configurations use published 2026 statewide schedules. Local, county, and municipal income
    taxes are not included. The planner uses an exact configuration-year table when available
    and otherwise inflation-adjusts the nearest usable table's monetary amounts.
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
  initialStateCode,
  onChange
}: {
  title: string;
  configurations: T[];
  initialFilingStatus: FilingStatus;
  initialStateCode?: StateCode;
  onChange: (configurations: T[]) => void;
}) {
  const [selectedFilingStatus, setSelectedFilingStatus] = useState(initialFilingStatus);
  const availableStateCodes = new Set(
    configurations.flatMap((configuration) =>
      isStateTaxConfig(configuration) ? [configuration.stateCode] : []
    )
  );
  const [selectedStateCode, setSelectedStateCode] = useState<StateCode | undefined>(
    initialStateCode ?? STATE_OPTIONS.find((state) => availableStateCodes.has(state.value))?.value
  );
  const matchingConfigurations = configurations
    .filter(
      (configuration) =>
        configuration.filingStatus === selectedFilingStatus &&
        (!isStateTaxConfig(configuration) || configuration.stateCode === selectedStateCode)
    )
    .sort((left, right) => right.year - left.year);
  const [selectedYear, setSelectedYear] = useState(
    () =>
      configurations
        .filter(
          (configuration) =>
            configuration.filingStatus === initialFilingStatus &&
            (!isStateTaxConfig(configuration) ||
              configuration.stateCode ===
                (initialStateCode ??
                  STATE_OPTIONS.find((state) => availableStateCodes.has(state.value))?.value))
        )
        .sort((left, right) => right.year - left.year)[0]?.year ??
      configurations[0]?.year ??
      new Date().getFullYear()
  );
  const selected =
    matchingConfigurations.find((configuration) => configuration.year === selectedYear) ??
    matchingConfigurations[0];
  const availableYears = Array.from(
    new Set(matchingConfigurations.map((configuration) => configuration.year))
  ).sort((left, right) => right - left);

  if (!selected) {
    return (
      <section className="panel">
        <h2>
          <TableConfig />
          {title}
        </h2>
        <p>No matching {FILING_STATUS_LABELS[selectedFilingStatus]} configuration is available.</p>
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
  const state = isStateTaxConfig(selected) ? selected : null;

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

      {state && (
        <label className="tax-configuration-select">
          Residence State
          <select value={selectedStateCode} onChange={(event) => setSelectedStateCode(event.target.value as StateCode)}>
            {STATE_OPTIONS.filter((option) => availableStateCodes.has(option.value)).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}

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

      <label className="tax-configuration-select">
        Configuration Year
        <select
          value={selected.year}
          onChange={(event) => setSelectedYear(Number(event.target.value))}>
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
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
        {state && (
          <>
            <label>
              Personal Exemption
              <input
                type="number"
                min="0"
                value={state.personalExemption}
                onChange={(event) => updateConfiguration({ personalExemption: Number(event.target.value) })}
              />
            </label>
            <label>
              Nonrefundable Personal Credit
              <input
                type="number"
                min="0"
                value={state.personalCredit}
                onChange={(event) => updateConfiguration({ personalCredit: Number(event.target.value) })}
              />
            </label>
            <label>
              Tax Model
              <select
                value={state.taxModel}
                onChange={(event) => updateConfiguration({ taxModel: event.target.value as StateTaxModel })}>
                <option value="none">No broad income tax</option>
                <option value="flat">Flat</option>
                <option value="progressive">Progressive</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label>
              Social Security Treatment
              <select
                value={state.socialSecurityTreatment}
                onChange={(event) =>
                  updateConfiguration({
                    socialSecurityTreatment: event.target.value as StateSocialSecurityTreatment
                  })
                }>
                <option value="exempt">Exempt</option>
                <option value="federalTaxableAmount">Use federal taxable amount</option>
              </select>
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

      {state && state.retirementIncomeExclusions.length > 0 && (
        <p className="input-help">
          Configured retirement-income exclusion:{' '}
          {state.retirementIncomeExclusions
            .map((exclusion) =>
              exclusion.maximumAmount === null
                ? `all modeled traditional retirement distributions beginning at age ${exclusion.minimumAge}`
                : `${exclusion.maximumAmount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0
                  })} beginning at age ${exclusion.minimumAge}`
            )
            .join('; ')}.
        </p>
      )}

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
