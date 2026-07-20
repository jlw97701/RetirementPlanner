import { useState } from 'react';
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

  return (
    <aside className="sidebar">
      <div className="accordion-group">
        <AccordionPanel
          title="Planner Inputs"
          icon={<Settings />}
          info={`<h3>Planner Inputs</h3><p>Enter your personal information and financial assumptions. These inputs will be used to calculate your retirement projections.</p><p>This projection uses complete calendar years. The first period is January 1 through December 31, ${projectionStartYear}, the year you turn ${inputs.startAge}. Enter account balances as of January 1, ${projectionStartYear}. Annual spending is the amount expected for that complete calendar year.</p><p>This model factors in Required Minimum Distributions (RMDs). Information on RMDs can be found at <a href='https://www.irs.gov/retirement-plans/required-minimum-distributions-rmds' target='_blank' rel='noopener noreferrer'>https://www.irs.gov/retirement-plans/required-minimum-distributions-rmds</a>.</p><p>Inflation is calculated from the Consumer Price Index (CPI) by the Bureau of Labor Statistics. Information on historical inflation can be found at <a href='https://www.usinflationcalculator.com/inflation/historical-inflation-rates/' target='_blank' rel='noopener noreferrer'>https://www.usinflationcalculator.com/inflation/historical-inflation-rates/</a>.</p>`}
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
          info="<h3>Social Security Income</h3><p>Enter your expected Social Security income at each age. These values will be used to calculate your total income and taxes.</p><p>Claim-age scenarios assume twelve monthly payments during the calendar year in which the selected age is reached.</p><p>Current-dollar estimates are adjusted from the estimate year to each claiming year. Claim-year estimates are used exactly as entered.</p><p>If you are already receiving Social Security, enter the monthly benefit and the year that amount applies to. Claim-age estimates are ignored, and the scenarios compare Roth conversion strategies only.</p><p>Information on Social Security benefits can be found at <a href='https://www.ssa.gov/benefits/retirement/' target='_blank' rel='noopener noreferrer'>https://www.ssa.gov/benefits/retirement/</a>.</p><p>Note: The Social Security Administration (SSA) provides an online tool called the <a href='https://www.ssa.gov/myaccount/' target='_blank' rel='noopener noreferrer'>my Social Security</a> account, where you can view your estimated benefits based on your earnings history and expected retirement age.</p>"
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
          info="<h3>Cost of Living Adjustment (COLA)</h3><p>Cost of Living Adjustment (COLA) is the annual increase in Social Security benefits to keep up with inflation. Current year calculations use the published COLA rate. For future years, you can choose a strategy for how to calculate the projected COLA.</p><p>Information on Social Security COLA can be found at <a href='https://www.ssa.gov/cola/' target='_blank' rel='noopener noreferrer'>https://www.ssa.gov/cola/</a>.</p>"
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
          info="<h3>Asset Allocation</h3><p>Portfolio asset allocation refers to the distribution of your investments across different asset classes, such as stocks, bonds, and cash. The allocation you choose can significantly impact your portfolio's risk and return profile.</p>"
          isOpen={expandedIndex === 3}
          onToggle={() => setSelectedPanel(3)}>
          <NumberInput
            label="Stocks"
            value={assetAllocation.stocks}
            min={0}
            step={0.001}
            onChange={(v) => setAssetAllocation({ ...assetAllocation, stocks: v })}
          />
          <NumberInput
            label="Bonds"
            value={assetAllocation.bonds}
            min={0}
            step={0.001}
            onChange={(v) => setAssetAllocation({ ...assetAllocation, bonds: v })}
          />
          <NumberInput
            label="Cash"
            value={assetAllocation.cash}
            min={0}
            step={0.001}
            onChange={(v) => setAssetAllocation({ ...assetAllocation, cash: v })}
          />
          <NumberInput
            label="Other"
            value={assetAllocation.other}
            min={0}
            step={0.001}
            onChange={(v) => setAssetAllocation({ ...assetAllocation, other: v })}
          />
        </AccordionPanel>
      </div>
    </aside>
  );
}
