import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar, Settings } from 'lucide-react';
import { format } from 'date-fns';

import { AccordionPanel } from '../shared/AccordionPanel';
import { NumberInput } from '../shared/NumberInput';
import { Dropdown } from '../shared/Dropdown';

import {
  AssetAllocation,
  ColaStrategyType,
  SSBenefitValueType,
  type PlannerInputs,
  type SSColaSettings,
  type SSMonthlyIncome
} from '../../models/RetirementTypes';

import { COLA_HISTORY } from '../../data/colaHistory';

import 'react-datepicker/dist/react-datepicker.css';
import { parseIsoDate } from '../../utils/projectionDates';
import {
  ASSET_ALLOCATION_PROFILES,
  CUSTOM_ALLOCATION_ID,
  getAssetAllocationProfile,
  identifyAssetAllocationProfile,
  type AssetAllocationPreferences,
  type AssetAllocationSelection
} from '../../data/assetAllocationProfiles';
import { loadAssetAllocationPreferences, saveAssetAllocationPreferences } from '../../services/PlannerStorage';

interface InputsInterface {
  inputs: PlannerInputs;
  setInputs: (v: PlannerInputs) => void;
  ssIncome: SSMonthlyIncome[];
  setSSIncome: (v: SSMonthlyIncome[]) => void;
  colaSettings: SSColaSettings;
  setColaSettings: (v: SSColaSettings) => void;
  assetAllocation: AssetAllocation;
  setAssetAllocation: (v: AssetAllocation) => void;
}

export function PlannerInputsPanel({
  inputs,
  setInputs,
  ssIncome,
  setSSIncome,
  colaSettings,
  setColaSettings,
  assetAllocation,
  setAssetAllocation
}: InputsInterface) {
  //console.log('PlannerInputsPanel: inputs = ', inputs);
  //console.log('PlannerInputsPanel: income = ', income);

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const initialAllocationPreferences: AssetAllocationPreferences = {
    selection: identifyAssetAllocationProfile(assetAllocation) ?? CUSTOM_ALLOCATION_ID,
    customAllocation: { ...assetAllocation }
  };
  const [allocationPreferences, setAllocationPreferences] = useState<AssetAllocationPreferences>(() =>
    loadAssetAllocationPreferences(initialAllocationPreferences)
  );
  const selectedAllocation = allocationPreferences.selection;
  const customAllocation = allocationPreferences.customAllocation;

  useEffect(() => saveAssetAllocationPreferences(allocationPreferences), [allocationPreferences]);

  const setSelectedPanel = (index: number) =>
    setExpandedIndex((prevIndex: number | null) => (prevIndex === index ? null : index));

  // Format birthDate for the date picker
  const d = new Date(inputs.birthDate + 'T00:00:00');
  const birthDate: string = format(d, 'MM/dd/yyyy');

  const setBirthDate = (v: Date | null) => {
    if (v) {
      const bd: string = format(v, 'yyyy-MM-dd');
      setInputs({ ...inputs, birthDate: bd });
    } else {
      setInputs({ ...inputs, birthDate: '' });
    }
  };

  const parsedBirthDate = parseIsoDate(inputs.birthDate);
  const birthYear = parsedBirthDate.getFullYear();
  const projectionStartYear = birthYear + inputs.startAge;

  const updateIncome = (v: SSMonthlyIncome) => {
    const updatedIncome = ssIncome.map((ss) => (ss.age === v.age ? { ...ss, amount: v.amount } : ss));
    setSSIncome(updatedIncome);
  };

  const colaStrategyOptions = [
    {
      value: ColaStrategyType.FixedRate,
      label: 'Fixed Rate'
    },
    {
      value: ColaStrategyType.LastRate,
      label: `${Object.keys(COLA_HISTORY)[Object.keys(COLA_HISTORY).length - 1]} Rate`
    },
    {
      value: ColaStrategyType.InflationRate,
      label: 'Inflation Rate'
    },
    {
      value: ColaStrategyType.HistoricalAverage,
      label: 'Historical Average'
    },
    {
      value: ColaStrategyType.MonteCarlo,
      label: 'Monte Carlo'
    }
  ];

  const selectedColaStrategy = colaStrategyOptions.find((o) => o.value === colaSettings.strategy)?.value ?? 0;

  const ssBenefitValueOptions = [
    {
      value: SSBenefitValueType.CurrentDollars,
      label: `Current Dollars (${inputs.ssEstimateYear})`
    },
    {
      value: SSBenefitValueType.ClaimYearDollars,
      label: 'Claim-Year Dollars'
    },
    {
      value: SSBenefitValueType.ActualCurrentBenefit,
      label: 'Receiving Benefits'
    }
  ];

  const selectedBenefitValue = ssBenefitValueOptions.find((o) => o.value === inputs.ssBenefitValueType)?.value ?? 0;

  const assetAllocationOptions = [
    ...ASSET_ALLOCATION_PROFILES.map((profile) => ({ value: profile.id, label: profile.label })),
    { value: CUSTOM_ALLOCATION_ID, label: 'Custom' }
  ];

  const selectedAllocationProfile =
    selectedAllocation === CUSTOM_ALLOCATION_ID ? null : getAssetAllocationProfile(selectedAllocation);

  const customAllocationTotal =
    customAllocation.stocks + customAllocation.bonds + customAllocation.cash + customAllocation.other;
  const customAllocationIsValid =
    [customAllocation.stocks, customAllocation.bonds, customAllocation.cash, customAllocation.other].every(
      (value) => Number.isFinite(value) && value >= 0
    ) && Math.abs(customAllocationTotal - 1) <= 0.000001;

  const selectAssetAllocation = (value: string | number) => {
    const selection = String(value) as AssetAllocationSelection;

    if (selection === CUSTOM_ALLOCATION_ID) {
      setAllocationPreferences((current) => ({ ...current, selection }));
      return;
    }

    setAllocationPreferences((current) => ({ ...current, selection }));
    setAssetAllocation({ ...getAssetAllocationProfile(selection).allocation });
  };

  const updateCustomAllocation = (key: keyof AssetAllocation, percent: number) => {
    setAllocationPreferences((current) => ({
      ...current,
      customAllocation: { ...current.customAllocation, [key]: percent / 100 }
    }));
  };

  return (
    <aside className="sidebar">
      <div className="accordion-group">
        <AccordionPanel
          title="Planner Inputs"
          icon={<Settings />}
          info={`
            <h3>Planner Inputs</h3>
            <p>
              Enter the dates, ages, account balances, spending, and Roth conversion
              assumptions used by the retirement projection.
            </p>
            <p>
              The projection begins January 1, ${projectionStartYear}, the calendar year
              in which you reach age ${inputs.startAge}. Enter your Traditional IRA,
              Roth IRA, and taxable savings balances as of that date.
            </p>
            <p>
              Each projection row represents a complete calendar year. Investment returns
              are split around midyear cash flows. Spending, Social Security, taxes,
              withdrawals, RMDs, and Roth conversions are modeled at midyear.
            </p>
            <p>
              Annual spending is the amount expected during ${projectionStartYear}.
              It increases in subsequent years using the entered inflation rate.
            </p>
            <p>
              The withdrawal order is Traditional IRA, taxable savings, then Roth IRA.
              Excess Social Security or mandatory RMD cash is deposited into taxable
              savings, which is assumed to earn no interest.
            </p>
            <p>
              “First Age With No Conversion” is the first age at which scheduled Roth
              conversions stop. Conversions may occur only at earlier ages and are also
              limited by the available Traditional IRA balance.
            </p>
            <p>
              Required Minimum Distributions are calculated using the applicable starting
              age and the January 1 Traditional IRA balance.
              <a href="https://www.irs.gov/retirement-plans/required-minimum-distributions-rmds"
                target="_blank"
                rel="noopener noreferrer">
                Learn more about RMDs from the IRS.
              </a>
            </p>
          `}
          isOpen={expandedIndex === 0}
          onToggle={() => setSelectedPanel(0)}>
          <div className="input-row">
            <label>
              <span>Birth Date:</span>
            </label>
            <DatePicker
              icon={<Calendar />}
              showIcon
              showMonthDropdown
              showYearDropdown
              scrollableYearDropdown
              selected={parseIsoDate(inputs.birthDate)}
              onChange={(v: Date | null) => setBirthDate(v)}
            />
          </div>
          <NumberInput
            label="Start Age"
            value={inputs.startAge}
            min={62}
            max={95}
            step={1}
            onChange={(v) => setInputs({ ...inputs, startAge: v })}
          />
          <NumberInput
            label="End Age"
            value={inputs.endAge}
            min={62}
            max={95}
            step={1}
            onChange={(v) => setInputs({ ...inputs, endAge: v })}
          />
          <NumberInput
            label="Primary Horizon Age"
            value={inputs.horizonAge}
            min={62}
            max={95}
            onChange={(v) => setInputs({ ...inputs, horizonAge: v })}
          />
          <NumberInput
            label="First Age With No Conversion"
            value={inputs.stopConvAge}
            min={62}
            max={95}
            onChange={(v) => setInputs({ ...inputs, stopConvAge: v })}
          />
          <NumberInput
            label={`Taxable Savings on Jan 1, ${projectionStartYear}`}
            value={inputs.taxableAcct}
            min={0}
            step={1000}
            onChange={(v) => setInputs({ ...inputs, taxableAcct: v })}
          />
          <NumberInput
            label={`Traditional IRA on Jan 1, ${projectionStartYear}`}
            value={inputs.tradIra}
            min={0}
            step={1000}
            onChange={(v) => setInputs({ ...inputs, tradIra: v })}
          />
          <NumberInput
            label={`Roth IRA on Jan 1, ${projectionStartYear}`}
            value={inputs.rothIra}
            min={0}
            step={1000}
            onChange={(v) => setInputs({ ...inputs, rothIra: v })}
          />
          <NumberInput
            label={`Annual Spending for ${projectionStartYear}`}
            value={inputs.annualSpend}
            min={0}
            step={1000}
            onChange={(v) => setInputs({ ...inputs, annualSpend: v })}
          />
          <NumberInput
            label="Annual Base Roth Conversion"
            value={inputs.rothBaseConv}
            min={0}
            step={1000}
            onChange={(v) => setInputs({ ...inputs, rothBaseConv: v })}
          />
          <NumberInput
            label="Annual Aggressive Conversion"
            value={inputs.rothAggressiveConv}
            min={0}
            step={1000}
            onChange={(v) => setInputs({ ...inputs, rothAggressiveConv: v })}
          />
          <NumberInput
            label="Inflation"
            value={inputs.inflation}
            step={0.001}
            onChange={(v) => setInputs({ ...inputs, inflation: v })}
          />
        </AccordionPanel>
        <AccordionPanel
          title="SSI Inputs"
          icon={<Settings />}
          info={`
            <h3>Social Security Inputs</h3>
            <p>
              Select how the entered Social Security benefit amounts should be interpreted.
              The selected method determines which scenarios are projected and how benefits
              are adjusted over time.
            </p>
            <p>
              <strong>Current Dollar Estimates</strong> treats the age-based amounts as
              values from the selected estimate year. Each amount is adjusted to its
              applicable claiming year before projected COLAs are applied.
            </p>
            <p>
              <strong>Claim Year Estimates</strong> treats each age-based amount as the
              monthly benefit payable in that specific claiming year. No estimate-year
              adjustment is made.
            </p>
            <p>
              Claim-age scenarios assume twelve monthly payments during the calendar year
              in which the selected claiming age is reached.
            </p>
            <p>
              <strong>Already Receiving Benefits</strong> uses the actual monthly payment
              and benefit year entered below. Age-based estimates and claiming-age
              comparisons are ignored, and the scenarios compare only Roth conversion
              strategies.
            </p>
            <p>
              For an existing benefit, enter the monthly amount that applied during the
              selected benefit year. The projection applies subsequent COLAs through the
              first projection year.
            </p>
            <p>
              You can review your benefit estimates through
              <a href="https://www.ssa.gov/myaccount/"
                target="_blank"
                rel="noopener noreferrer">
                your my Social Security account.
              </a>
            </p>
          `}
          isOpen={expandedIndex === 1}
          onToggle={() => setSelectedPanel(1)}>
          <Dropdown
            label="Benefit Values"
            options={ssBenefitValueOptions}
            selectedValue={selectedBenefitValue}
            onChange={(v) => setInputs({ ...inputs, ssBenefitValueType: Number(v) as SSBenefitValueType })}
          />
          {inputs.ssBenefitValueType === SSBenefitValueType.ActualCurrentBenefit && (
            <>
              <NumberInput
                label="Current SS / month"
                value={inputs.actualMonthlySS}
                min={0}
                step={50}
                onChange={(value) =>
                  setInputs({
                    ...inputs,
                    actualMonthlySS: value
                  })
                }
              />
              <div className="input-row">
                <label>
                  <span>Benefit Year:</span>
                </label>
                <DatePicker
                  icon={<Calendar />}
                  showIcon
                  showYearPicker
                  dateFormat="yyyy"
                  selected={new Date(inputs.actualBenefitYear, 0, 1)}
                  onChange={(value: Date | null) => {
                    if (!value) {
                      return;
                    }
                    setInputs({
                      ...inputs,
                      actualBenefitYear: value.getFullYear()
                    });
                  }}
                />
              </div>
            </>
          )}
          {inputs.ssBenefitValueType !== SSBenefitValueType.ActualCurrentBenefit && (
            <>
              {inputs.ssBenefitValueType === SSBenefitValueType.CurrentDollars && (
                <div className="input-row">
                  <label>
                    <span>Estimate Year:</span>
                  </label>
                  <DatePicker
                    icon={<Calendar />}
                    showIcon
                    showYearPicker
                    dateFormat="yyyy"
                    selected={new Date(inputs.ssEstimateYear, 0, 1)}
                    onChange={(value: Date | null) => {
                      if (!value) {
                        return;
                      }
                      setInputs({
                        ...inputs,
                        ssEstimateYear: value.getFullYear()
                      });
                    }}
                  />
                </div>
              )}
              {ssIncome.map((ss) => (
                <NumberInput
                  key={ss.age}
                  label={`SS at ${ss.age} / month`}
                  value={ss.amount}
                  min={0}
                  onChange={(value) =>
                    updateIncome({
                      ...ss,
                      amount: value
                    })
                  }
                />
              ))}
            </>
          )}
        </AccordionPanel>
        <AccordionPanel
          title="Projected COLA"
          icon={<Settings />}
          info={`
            <h3>Projected Social Security COLA</h3>
            <p>
              Cost-of-Living Adjustments increase Social Security benefits over time.
              Published COLA values are used when available. The selected strategy supplies
              COLAs for future years that do not yet have a published rate.
            </p>
            <p>
              <strong>Fixed Rate</strong> uses the entered rate for every future year.
              <strong>Last Rate</strong> continues the most recent available rate.
              <strong>Inflation Rate</strong> uses the planner’s general inflation
              assumption.
            </p>
            <p>
              <strong>Historical Average</strong> uses the average of the available
              historical COLA values. <strong>Monte Carlo</strong> uses the generated COLA
              assumption shown below.
            </p>
            <p>
              COLAs affect Social Security benefits after payments begin. They do not
              directly increase account balances or annual spending.
            </p>
            <p>
              <a href="https://www.ssa.gov/cola/"
                target="_blank"
                rel="noopener noreferrer">
                Learn more about COLAs from the Social Security Administration.
              </a>
            </p>
          `}
          isOpen={expandedIndex === 2}
          onToggle={() => setSelectedPanel(2)}>
          <Dropdown
            label="Strategy"
            options={colaStrategyOptions}
            selectedValue={selectedColaStrategy}
            onChange={(v) => setColaSettings({ ...colaSettings, strategy: Number(v) })}
          />
          <NumberInput
            label="Fixed Rate"
            value={colaSettings.fixedRate}
            step={0.001}
            readonly={colaSettings.strategy !== ColaStrategyType.FixedRate}
            selected={selectedColaStrategy === ColaStrategyType.FixedRate}
            onChange={(v) => setColaSettings({ ...colaSettings, fixedRate: v })}
          />
          <NumberInput
            label={`${Object.keys(COLA_HISTORY)[Object.keys(COLA_HISTORY).length - 1]} Rate`}
            value={colaSettings.lastRate}
            readonly={true}
            selected={selectedColaStrategy === ColaStrategyType.LastRate}
          />
          <NumberInput
            label="Inflation Rate"
            value={inputs.inflation}
            readonly={true}
            selected={selectedColaStrategy === ColaStrategyType.InflationRate}
          />
          <NumberInput
            label="Average Rate"
            value={colaSettings.averageRate}
            readonly={true}
            selected={selectedColaStrategy === ColaStrategyType.HistoricalAverage}
          />
          <NumberInput
            label="Monte Carlo Rate"
            value={colaSettings.monteCarloRate}
            readonly={true}
            selected={selectedColaStrategy === ColaStrategyType.MonteCarlo}
          />
        </AccordionPanel>
        <AccordionPanel
          title="Portfolio"
          icon={<Settings />}
          info={`
            <h3>Portfolio Asset Allocation</h3>
            <p>
              Select a predefined allocation or create a custom mix of stocks, bonds,
              cash equivalents, and other investments. A custom allocation must total 100%.
            </p>
            <p>
              The same allocation and calculated return are applied to the Traditional
              IRA and Roth IRA. Each annual return is divided into two compounded
              half-year periods so that midyear withdrawals and conversions receive an
              appropriate portion of the year’s growth.
            </p>
            <p>
              The projection assumes the Traditional and Roth accounts are maintained at
              the selected target allocation throughout the projection. Annual portfolio
              returns are calculated by weighting each asset class return according to
              that allocation.
            </p>
            <p>
              Taxable savings are modeled separately as a non-interest-bearing cash
              account. The portfolio allocation does not apply to that account.
            </p>
            <p>
              <strong>Other</strong> may include investments such as REITs, precious
              metals, or cryptocurrency. These assets can have substantially different
              risks and returns, so they are excluded from the predefined allocations.
              Use a custom allocation only if you understand the investment and the
              model's simplified return assumption for this category.
            </p>
            <p>
              The current projection uses deterministic return assumptions for each asset
              class. These projections illustrate possible outcomes and do not guarantee
              future investment performance.
            </p>
          `}
          isOpen={expandedIndex === 3}
          onToggle={() => setSelectedPanel(3)}>
          <Dropdown
            label="Allocation Method"
            options={assetAllocationOptions}
            selectedValue={selectedAllocation}
            onChange={selectAssetAllocation}
          />

          {selectedAllocationProfile && <p className="input-help">{selectedAllocationProfile.description}</p>}

          {selectedAllocation === CUSTOM_ALLOCATION_ID && (
            <>
              <NumberInput
                label="Stocks %"
                value={customAllocation.stocks * 100}
                min={0}
                max={100}
                step={1}
                onChange={(value) => updateCustomAllocation('stocks', value)}
              />
              <NumberInput
                label="Bonds %"
                value={customAllocation.bonds * 100}
                min={0}
                max={100}
                step={1}
                onChange={(value) => updateCustomAllocation('bonds', value)}
              />
              <NumberInput
                label="Cash %"
                value={customAllocation.cash * 100}
                min={0}
                max={100}
                step={1}
                onChange={(value) => updateCustomAllocation('cash', value)}
              />
              <NumberInput
                label="Other %"
                value={customAllocation.other * 100}
                min={0}
                max={100}
                step={1}
                onChange={(value) => updateCustomAllocation('other', value)}
              />
              <div className={customAllocationIsValid ? 'allocation-total valid' : 'allocation-total invalid'}>
                Total: {(customAllocationTotal * 100).toFixed(1)}%
              </div>
              <button
                type="button"
                className="apply-allocation-button"
                disabled={!customAllocationIsValid}
                onClick={() => setAssetAllocation({ ...customAllocation })}>
                Apply Custom Allocation
              </button>
            </>
          )}

          {selectedAllocation !== CUSTOM_ALLOCATION_ID && (
            <div className="allocation-summary">
              <span>Stocks: {(assetAllocation.stocks * 100).toFixed(0)}%</span>
              <span>Bonds: {(assetAllocation.bonds * 100).toFixed(0)}%</span>
              <span>Cash: {(assetAllocation.cash * 100).toFixed(0)}%</span>
              <span>Other: {(assetAllocation.other * 100).toFixed(0)}%</span>
            </div>
          )}
        </AccordionPanel>
      </div>
    </aside>
  );
}
