import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar, Settings } from 'lucide-react';
import { format } from 'date-fns';

import { AccordionPanel } from '../shared/AccordionPanel';
import { NumberInput } from '../shared/NumberInput';
import { Dropdown } from '../shared/Dropdown';

import type { EconomicScenarioSettings } from '../../models/EconomicScenarioSettings';
import type { FilingStatus, StateCode } from '../../models/TaxTypes';
import { STATE_OPTIONS } from '../../data/stateTax2026';

import { loadAssetAllocationPreferences, saveAssetAllocationPreferences } from '../../services/PlannerStorage';
import { EconomicScenarioMethod } from '../../services/EconomicScenarioEngine';

import { parseIsoDate } from '../../utils/projectionDates';

import { COLA_HISTORY } from '../../data/colaHistory';

import {
  ASSET_ALLOCATION_PROFILES,
  CUSTOM_ALLOCATION_ID,
  getAssetAllocationProfile,
  identifyAssetAllocationProfile,
  type AssetAllocationPreferences,
  type AssetAllocationSelection
} from '../../data/assetAllocationProfiles';

import { HISTORICAL_ECONOMIC_DATA } from '../../data/historicalEconomicData';

import {
  calculateDeterministicMarketReturns,
  DETERMINISTIC_MARKET_PROFILES,
  type DeterministicMarketProfileId,
  type RollingReturnPeriod
} from '../../data/deterministicMarketProfiles';

import {
  AssetAllocation,
  ColaStrategyType,
  MedicareModelType,
  SSBenefitValueType,
  type PlannerInputs,
  type SSColaSettings,
  type SSMonthlyIncome
} from '../../models/RetirementTypes';

import 'react-datepicker/dist/react-datepicker.css';

interface InputsInterface {
  inputs: PlannerInputs;
  setInputs: (v: PlannerInputs) => void;
  ssIncome: SSMonthlyIncome[];
  setSSIncome: (v: SSMonthlyIncome[]) => void;
  colaSettings: SSColaSettings;
  setColaSettings: (v: SSColaSettings) => void;
  assetAllocation: AssetAllocation;
  setAssetAllocation: (v: AssetAllocation) => void;
  economicScenarioSettings: EconomicScenarioSettings;
  setEconomicScenarioSettings: (v: EconomicScenarioSettings) => void;
}

export function PlannerInputsPanel({
  inputs,
  setInputs,
  ssIncome,
  setSSIncome,
  colaSettings,
  setColaSettings,
  assetAllocation,
  setAssetAllocation,
  economicScenarioSettings,
  setEconomicScenarioSettings
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
  const usesSimpleMedicareDefaults = inputs.medicareModel === MedicareModelType.SimpleDeterministic;

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

  const filingStatusOptions: { value: FilingStatus; label: string }[] = [
    { value: 'single', label: 'Single' },
    { value: 'marriedFilingJointly', label: 'Married Filing Jointly' },
    { value: 'marriedFilingSeparately', label: 'Married Filing Separately' },
    { value: 'headOfHousehold', label: 'Head of Household' }
  ];

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

  const economicScenarioOptions = [
    { value: EconomicScenarioMethod.DETERMINISTIC, label: 'Deterministic' },
    { value: EconomicScenarioMethod.MONTE_CARLO, label: 'Single Simulated Path' },
    ...(HISTORICAL_ECONOMIC_DATA.length > 0
      ? [
          { value: EconomicScenarioMethod.HISTORICAL_SEQUENCE, label: 'Historical Sequence' },
          { value: EconomicScenarioMethod.HISTORICAL_BOOTSTRAP, label: 'Historical Bootstrap' }
        ]
      : [])
  ];
  const projectionYearCount = inputs.endAge - inputs.startAge + 1;
  const historicalStartYearOptions = HISTORICAL_ECONOMIC_DATA.filter(
    (_, index) =>
      economicScenarioSettings.historicalSequence.wrap || index + projectionYearCount <= HISTORICAL_ECONOMIC_DATA.length
  ).map((item) => ({ value: item.year, label: String(item.year) }));

  const selectDeterministicMarketProfile = (value: string | number) => {
    setEconomicScenarioSettings({
      ...economicScenarioSettings,
      deterministic: {
        ...economicScenarioSettings.deterministic,
        profile: String(value) as DeterministicMarketProfileId
      }
    });
  };

  const deterministicPortfolioReturns = calculateDeterministicMarketReturns(
    HISTORICAL_ECONOMIC_DATA,
    assetAllocation,
    economicScenarioSettings.deterministic.rollingPeriod
  );
  const selectedCalculatedReturn =
    economicScenarioSettings.deterministic.profile === 'custom-market'
      ? null
      : deterministicPortfolioReturns[economicScenarioSettings.deterministic.profile];

  const updateCustomMarketReturn = (
    key: 'stockReturn' | 'bondReturn' | 'cashReturn' | 'otherReturn',
    percent: number
  ) => {
    const normalizedPercent = key === 'otherReturn' ? Math.round(percent * 10) / 10 : percent;
    setEconomicScenarioSettings({
      ...economicScenarioSettings,
      deterministic: { ...economicScenarioSettings.deterministic, [key]: normalizedPercent / 100 }
    });
  };

  const updateMonteCarloVariable = (
    key: 'inflation' | 'stockReturn' | 'bondReturn' | 'cashReturn' | 'otherReturn',
    field: 'mean' | 'standardDeviation',
    value: number
  ) => {
    setEconomicScenarioSettings({
      ...economicScenarioSettings,
      monteCarlo: {
        ...economicScenarioSettings.monteCarlo,
        assumptions: {
          ...economicScenarioSettings.monteCarlo.assumptions,
          [key]: {
            ...economicScenarioSettings.monteCarlo.assumptions[key],
            [field]: value
          }
        }
      }
    });
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
              Tax Filing Status selects the matching federal and selected-state brackets, deductions,
              Social Security taxation thresholds, and Medicare IRMAA table. Residence State
              selects the statewide income-tax estimate. Local and municipal income taxes are
              not included.
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
            </p>
            <p>
              <a href="https://www.irs.gov/retirement-plans/required-minimum-distributions-rmds"
                target="_blank"
                rel="noopener noreferrer">
                Learn more about RMDs from the IRS.
              </a>
            </p>
          `}
          isOpen={expandedIndex === 0}
          onToggle={() => setSelectedPanel(0)}>
          <Dropdown
            label="Residence State"
            options={STATE_OPTIONS}
            selectedValue={inputs.residenceState}
            onChange={(value) => setInputs({ ...inputs, residenceState: value as StateCode })}
          />
          <Dropdown
            label="Tax Filing Status"
            options={filingStatusOptions}
            selectedValue={inputs.filingStatus}
            onChange={(value) => setInputs({ ...inputs, filingStatus: value as FilingStatus })}
          />
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
            label={`Taxable Savings on<br/>Jan 1, ${projectionStartYear}`}
            value={inputs.taxableAcct}
            min={0}
            step={1000}
            onChange={(v) => setInputs({ ...inputs, taxableAcct: v })}
          />
          <NumberInput
            label={`Traditional IRA on<br/>Jan 1, ${projectionStartYear}`}
            value={inputs.tradIra}
            min={0}
            step={1000}
            onChange={(v) => setInputs({ ...inputs, tradIra: v })}
          />
          <NumberInput
            label={`Roth IRA on<br/>Jan 1, ${projectionStartYear}`}
            value={inputs.rothIra}
            min={0}
            step={1000}
            onChange={(v) => setInputs({ ...inputs, rothIra: v })}
          />
          <NumberInput
            label={`Annual Spending<br/>for ${projectionStartYear}`}
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
          title="Social Security"
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
              Enter Social Security benefits before Medicare premiums or other deductions. Using a net bank-deposit
              amount while also adding Medicare costs would count those costs twice.
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
          isOpen={expandedIndex === 2}
          onToggle={() => setSelectedPanel(2)}>
          <Dropdown
            label="Benefit Values"
            options={ssBenefitValueOptions}
            selectedValue={selectedBenefitValue}
            onChange={(v) => setInputs({ ...inputs, ssBenefitValueType: Number(v) as SSBenefitValueType })}
          />
          {inputs.ssBenefitValueType === SSBenefitValueType.ActualCurrentBenefit && (
            <>
              <NumberInput
                label="Gross SS / month (before Medicare)"
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
            </p>
            <p>
              <strong>Last Rate</strong> continues the most recent available rate.
            </p>
            <p>
              <strong>Inflation Rate</strong> uses the planner’s general inflation assumption.
            </p>
            <p>
              <strong>Historical Average</strong> uses the average of the available historical COLA values. 
            </p>
            <p>
              COLAs affect Social Security benefits after payments begin. They do not directly increase account balances or annual spending.
            </p>
            <p>
              <a href="https://www.ssa.gov/cola/"
                target="_blank"
                rel="noopener noreferrer">
                Learn more about COLAs from the Social Security Administration.
              </a>
            </p>
          `}
          isOpen={expandedIndex === 3}
          onToggle={() => setSelectedPanel(3)}>
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
        </AccordionPanel>
        <AccordionPanel
          title="Medicare/IRMAA"
          icon={<Settings />}
          info={`
            <h3>Medicare/IRMAA Inputs</h3>
            <p>
              The default Simple Deterministic model requires no additional input. It starts Medicare at age 65,
              reads the standard Part B premium from the applicable maintained table, assumes Annual Spending already
              includes healthcare, and initializes optional coverage, out-of-pocket costs, and unavailable prior MAGI
              to zero.
            </p>
            <p>
              Change these inputs when you want Medicare and healthcare costs displayed in more detail or added to
              spending. If Annual Spending excludes healthcare, the planner adds standard Part B, calculated IRMAA,
              Part D or other coverage, and out-of-pocket healthcare beginning at the selected Medicare start age.
            </p>
            <p>
              IRMAA normally uses MAGI from two years earlier. Enter the two pre-projection values only when the
              projection starts close enough to Medicare enrollment for those years to affect the results. Later MAGI
              is calculated automatically from the projection.
            </p>
            <p>
              Under the full-calendar-year contract, Medicare costs apply for the complete year in which the selected
              Medicare start age is reached.
            </p>
            <p>
              <a href="https://www.ssa.gov/benefits/medicare/medicare-premiums.html"
                target="_blank" rel="noopener noreferrer">Review Medicare premiums and IRMAA brackets from SSA.</a>
            </p>
            <p>
              <a href="https://secure.ssa.gov/poms.nsf/links/0601101010"
                target="_blank" rel="noopener noreferrer">See SSA's IRMAA MAGI definition and Form 1040 lines.</a>
            </p>
          `}
          isOpen={expandedIndex === 1}
          onToggle={() => setSelectedPanel(1)}>
          <label className="checkbox-row">
            <span>Annual Spending Includes Medicare/Healthcare</span>
            <input
              type="checkbox"
              checked={inputs.annualSpendingIncludesHealthcare}
              onChange={(event) =>
                setInputs({
                  ...inputs,
                  medicareModel: MedicareModelType.Custom,
                  annualSpendingIncludesHealthcare: event.target.checked
                })
              }
            />
          </label>
          <NumberInput
            label="Medicare Start Age"
            value={inputs.medicareStartAge}
            min={65}
            max={95}
            step={1}
            onChange={(v) => setInputs({ ...inputs, medicareModel: MedicareModelType.Custom, medicareStartAge: v })}
          />
          <NumberInput
            label={`Part D/Other Coverage per Month (${projectionStartYear} $)`}
            value={inputs.monthlyPartDOtherPremium}
            min={0}
            step={10}
            onChange={(v) =>
              setInputs({ ...inputs, medicareModel: MedicareModelType.Custom, monthlyPartDOtherPremium: v })
            }
          />
          <NumberInput
            label={`Annual Out-of-Pocket Healthcare (${projectionStartYear} $)`}
            value={inputs.annualOutOfPocketHealthcare}
            min={0}
            step={100}
            onChange={(v) =>
              setInputs({ ...inputs, medicareModel: MedicareModelType.Custom, annualOutOfPocketHealthcare: v })
            }
          />
          <NumberInput
            label={`IRMAA MAGI for ${projectionStartYear - 2}`}
            value={inputs.irmaaMagiTwoYearsPrior}
            min={0}
            step={1000}
            onChange={(v) =>
              setInputs({ ...inputs, medicareModel: MedicareModelType.Custom, irmaaMagiTwoYearsPrior: v })
            }
          />
          <NumberInput
            label={`IRMAA MAGI for ${projectionStartYear - 1}`}
            value={inputs.irmaaMagiOneYearPrior}
            min={0}
            step={1000}
            onChange={(v) =>
              setInputs({ ...inputs, medicareModel: MedicareModelType.Custom, irmaaMagiOneYearPrior: v })
            }
          />
          {!usesSimpleMedicareDefaults && (
            <button
              type="button"
              className="apply-allocation-button"
              onClick={() =>
                setInputs({
                  ...inputs,
                  medicareModel: MedicareModelType.SimpleDeterministic,
                  annualSpendingIncludesHealthcare: true,
                  medicareStartAge: 65,
                  monthlyPartDOtherPremium: 0,
                  annualOutOfPocketHealthcare: 0,
                  irmaaMagiTwoYearsPrior: 0,
                  irmaaMagiOneYearPrior: 0
                })
              }>
              Restore Defaults
            </button>
          )}
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
          isOpen={expandedIndex === 4}
          onToggle={() => setSelectedPanel(4)}>
          <Dropdown
            label="Allocation Method"
            options={assetAllocationOptions}
            selectedValue={selectedAllocation}
            onChange={selectAssetAllocation}
          />

          <div className="info-container">
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
          </div>
        </AccordionPanel>
        <AccordionPanel
          title="Economic Scenario"
          icon={<Settings />}
          info={`
            <h3>Economic Scenario</h3>
            <p>
              Choose how annual investment returns and inflation are generated for the projection.
              No scenario predicts the future or guarantees a particular result.
            </p>
            <p>
              <strong>Deterministic</strong> applies the selected market return every year. Significantly Below
              Average is a 10th-percentile stress test; Below Average, Average, and Above Average use the 25th, 50th,
              and 75th percentiles of rolling annualized historical portfolio returns for the selected asset
              allocation. Custom Market accepts your own asset-class assumptions.
            </p>
            <p>
              <strong>Single Simulated Path</strong> generates one repeatable sequence of variable annual results.
              It illustrates volatility and sequence-of-returns risk, but is not a probability-of-success analysis.
            </p>
            <p>
              <strong>Historical Sequence</strong> replays consecutive years from the 1975–2025 dataset.
            </p>
            <p>
              <strong> Historical Bootstrap</strong> randomly samples years from that dataset, preserving the
              relationships among returns and inflation within each sampled year.
            </p>
            <p>
              Compare several methods and starting years. A more resilient plan can fund essential spending
              across steady assumptions, unfavorable historical periods, and volatile simulated paths.
            </p>
          `}
          isOpen={expandedIndex === 5}
          onToggle={() => setSelectedPanel(5)}>
          <Dropdown
            label="Scenario Method"
            options={economicScenarioOptions}
            selectedValue={economicScenarioSettings.method}
            onChange={(value) =>
              setEconomicScenarioSettings({
                ...economicScenarioSettings,
                method: String(value) as EconomicScenarioMethod
              })
            }
          />

          {economicScenarioSettings.method === EconomicScenarioMethod.DETERMINISTIC && (
            <>
              <Dropdown
                label="Market Assumption"
                options={DETERMINISTIC_MARKET_PROFILES.map((profile) => ({
                  value: profile.id,
                  label: profile.label
                }))}
                selectedValue={economicScenarioSettings.deterministic.profile}
                onChange={selectDeterministicMarketProfile}
              />
              {economicScenarioSettings.deterministic.profile !== 'custom-market' && (
                <>
                  <Dropdown
                    label="Rolling Return Period"
                    options={[
                      { value: 10, label: '10 Years' },
                      { value: 20, label: '20 Years' }
                    ]}
                    selectedValue={economicScenarioSettings.deterministic.rollingPeriod}
                    onChange={(rollingPeriod) =>
                      setEconomicScenarioSettings({
                        ...economicScenarioSettings,
                        deterministic: {
                          ...economicScenarioSettings.deterministic,
                          rollingPeriod: Number(rollingPeriod) as RollingReturnPeriod
                        }
                      })
                    }
                  />
                  <div className="info-container">
                    <div>Annualized portfolio return:&nbsp;&nbsp;{((selectedCalculatedReturn ?? 0) * 100).toFixed(2)}%</div>
                    <br/>
                    <div>
                      Based on {economicScenarioSettings.deterministic.rollingPeriod}-year rolling periods from
                      1975–2025
                    </div>
                  </div>
                </>
              )}
              {economicScenarioSettings.deterministic.profile === 'custom-market' && (
                <>
                  {(
                    [
                      ['stockReturn', 'Stock Return (%)'],
                      ['bondReturn', 'Bond Return (%)'],
                      ['cashReturn', 'Cash Return (%)'],
                      ['otherReturn', 'Other Return (%)']
                    ] as const
                  ).map(([key, label]) => (
                    <NumberInput
                      key={key}
                      label={label}
                      value={
                        key === 'otherReturn'
                          ? Number((economicScenarioSettings.deterministic[key] * 100).toFixed(1))
                          : economicScenarioSettings.deterministic[key] * 100
                      }
                      min={-100}
                      max={100}
                      step={0.1}
                      onChange={(value) => updateCustomMarketReturn(key, value)}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {economicScenarioSettings.method === EconomicScenarioMethod.HISTORICAL_SEQUENCE && (
            <>
              <Dropdown
                label="Historical Start Year"
                options={historicalStartYearOptions}
                selectedValue={economicScenarioSettings.historicalSequence.historicalStartYear}
                onChange={(historicalStartYear) =>
                  setEconomicScenarioSettings({
                    ...economicScenarioSettings,
                    historicalSequence: {
                      ...economicScenarioSettings.historicalSequence,
                      historicalStartYear: Number(historicalStartYear)
                    }
                  })
                }
              />
              <Dropdown
                label="Wrap Historical Data"
                options={[
                  { value: 1, label: 'Yes' },
                  { value: 0, label: 'No' }
                ]}
                selectedValue={economicScenarioSettings.historicalSequence.wrap ? 1 : 0}
                onChange={(value) => {
                  const wrap = Number(value) === 1;
                  const latestStartIndex = Math.max(0, HISTORICAL_ECONOMIC_DATA.length - projectionYearCount);
                  const currentStartIndex = HISTORICAL_ECONOMIC_DATA.findIndex(
                    (item) => item.year === economicScenarioSettings.historicalSequence.historicalStartYear
                  );
                  const historicalStartYear =
                    !wrap && currentStartIndex > latestStartIndex
                      ? HISTORICAL_ECONOMIC_DATA[latestStartIndex].year
                      : economicScenarioSettings.historicalSequence.historicalStartYear;

                  setEconomicScenarioSettings({
                    ...economicScenarioSettings,
                    historicalSequence: {
                      ...economicScenarioSettings.historicalSequence,
                      wrap,
                      historicalStartYear
                    }
                  });
                }}
              />
            </>
          )}

          {economicScenarioSettings.method === EconomicScenarioMethod.HISTORICAL_BOOTSTRAP && (
            <>
              <NumberInput
                label="Block Size"
                value={economicScenarioSettings.historicalBootstrap.blockSize}
                min={1}
                step={1}
                onChange={(blockSize) =>
                  setEconomicScenarioSettings({
                    ...economicScenarioSettings,
                    historicalBootstrap: {
                      ...economicScenarioSettings.historicalBootstrap,
                      blockSize
                    }
                  })
                }
              />
              <NumberInput
                label="Random Seed"
                value={economicScenarioSettings.historicalBootstrap.seed}
                step={1}
                onChange={(seed) =>
                  setEconomicScenarioSettings({
                    ...economicScenarioSettings,
                    historicalBootstrap: {
                      ...economicScenarioSettings.historicalBootstrap,
                      seed
                    }
                  })
                }
              />
            </>
          )}

          {economicScenarioSettings.method === EconomicScenarioMethod.MONTE_CARLO && (
            <>
              <NumberInput
                label="Random Seed"
                value={economicScenarioSettings.monteCarlo.seed}
                step={1}
                onChange={(seed) =>
                  setEconomicScenarioSettings({
                    ...economicScenarioSettings,
                    monteCarlo: { ...economicScenarioSettings.monteCarlo, seed }
                  })
                }
              />
              {(
                [
                  ['inflation', 'Inflation'],
                  ['stockReturn', 'Stock Return'],
                  ['bondReturn', 'Bond Return'],
                  ['cashReturn', 'Cash Return'],
                  ['otherReturn', 'Other Return']
                ] as const
              ).map(([key, label]) => (
                <div className="scenario-assumption" key={key}>
                  <strong>{label}</strong>
                  <NumberInput
                    label="Average"
                    value={economicScenarioSettings.monteCarlo.assumptions[key].mean}
                    min={-1}
                    max={1}
                    step={0.001}
                    onChange={(value) => updateMonteCarloVariable(key, 'mean', value)}
                  />
                  <NumberInput
                    label="Volatility"
                    value={economicScenarioSettings.monteCarlo.assumptions[key].standardDeviation}
                    min={0}
                    max={1}
                    step={0.001}
                    onChange={(value) => updateMonteCarloVariable(key, 'standardDeviation', value)}
                  />
                </div>
              ))}
            </>
          )}
        </AccordionPanel>
      </div>
    </aside>
  );
}
