import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import { AccordionPanel } from '../shared/AccordionPanel';
import { NumberInput } from '../shared/NumberInput';
import {
  ColaStrategyType,
  type PlannerInputs,
  type SSColaSettings,
  type SSMonthlyIncome
} from '../../models/RetirementTypes';
import 'react-datepicker/dist/react-datepicker.css';
import { Dropdown } from '../shared/Dropdown';
import { COLA_HISTORY } from '../../data/colaHistory';

interface InputsInterface {
  inputs: PlannerInputs;
  setInputs: (v: PlannerInputs) => void;
  ssIncome: SSMonthlyIncome[];
  setSSIncome: (v: SSMonthlyIncome[]) => void;
  colaSettings: SSColaSettings;
  setColaSettings: (v: SSColaSettings) => void;
}

export function PlannerInputsPanel({
  inputs,
  setInputs,
  ssIncome,
  setSSIncome,
  colaSettings,
  setColaSettings
}: InputsInterface) {
  //console.log('PlannerInputsPanel: inputs = ', inputs);
  //console.log('PlannerInputsPanel: income = ', income);

  const updateInput = <K extends keyof PlannerInputs>(k: K, v: PlannerInputs[K]) => setInputs({ ...inputs, [k]: v });

  const updateIncome = (v: SSMonthlyIncome) => {
    const updatedIncome = ssIncome.map((ss) => (ss.age === v.age ? { ...ss, amount: v.amount } : ss));
    setSSIncome(updatedIncome);
  };

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const strategyOptions = [
    { value: ColaStrategyType.FixedRate, label: 'Fixed Rate' },
    { value: ColaStrategyType.LastRate, label: 'Last Rate' },
    { value: ColaStrategyType.InflationRate, label: 'Inflation Rate' },
    { value: ColaStrategyType.HistoricalAverage, label: 'Historical Average' },
    { value: ColaStrategyType.MonteCarlo, label: 'Monte Carlo' }
  ];

  const selectedStrategy = strategyOptions.find((o) => o.value === colaSettings.strategy)?.value ?? 0;

  const setSelectedPanel = (index: number) =>
    setExpandedIndex((prevIndex: number | null) => (prevIndex === index ? null : index));

  return (
    <aside className="sidebar">
      <div className="accordion-group">
        <AccordionPanel 
        title="Planner Inputs" 
        info="<h3>Planner Inputs</h3><p>Enter your personal information and financial assumptions. These inputs will be used to calculate your retirement projections.</p>Note: The retirement planner assumes that you will not make any additional contributions to your retirement accounts after the current year. If you plan to make additional contributions, please adjust your account balances accordingly.</p><p>This model factors in Required Minimum Distributions (RMDs). Information on RMDs can be found at <a href='https://www.irs.gov/retirement-plans/required-minimum-distributions-rmds' target='_blank' rel='noopener noreferrer'>https://www.irs.gov/retirement-plans/required-minimum-distributions-rmds</a>.</p><p>Inflation is calculated from the Consumer Price Index (CPI) by the Bureau of Labor Statistics. Information on historical inflation can be found at <a href='https://www.usinflationcalculator.com/inflation/historical-inflation-rates/' target='_blank' rel='noopener noreferrer'>https://www.usinflationcalculator.com/inflation/historical-inflation-rates/</a>.</p>"
        isOpen={expandedIndex === 0} 
        onToggle={() => setSelectedPanel(0)}>
          <label className="input-row">
            <span>Birth Date:</span>
            <DatePicker
              icon={<Calendar />}
              showIcon
              showMonthDropdown
              showYearDropdown
              scrollableYearDropdown
              selected={new Date(inputs.birthDate)}
              onChange={(v: Date | null) => updateInput('birthDate', v?.toLocaleDateString('en-US') ?? '')}
            />
          </label>
          <NumberInput
            label="Start Age"
            value={inputs.startAge}
            min={62}
            step={1}
            onChange={(v) => updateInput('startAge', v)}
          />
          <NumberInput
            label="End Age"
            value={inputs.endAge}
            min={62}
            step={1}
            onChange={(v) => updateInput('endAge', v)}
          />
          <NumberInput
            label="Primary Horizon Age"
            value={inputs.horizonAge}
            min={62}
            onChange={(v) => updateInput('horizonAge', v)}
          />
          <NumberInput
            label="Stop Conversion Age"
            value={inputs.stopConvAge}
            min={62}
            onChange={(v) => updateInput('stopConvAge', v)}
          />
          <NumberInput
            label="Traditional IRA"
            value={inputs.tradIra}
            step={1000}
            onChange={(v) => updateInput('tradIra', v)}
          />
          <NumberInput
            label="Annual spending"
            value={inputs.annualSpend}
            step={1000}
            onChange={(v) => updateInput('annualSpend', v)}
          />
          <NumberInput
            label="Base Roth Conversion"
            value={inputs.rothBaseConv}
            step={1000}
            onChange={(v) => updateInput('rothBaseConv', v)}
          />
          <NumberInput
            label="Aggressive Conversion"
            value={inputs.rothAggressiveConv}
            step={1000}
            onChange={(v) => updateInput('rothAggressiveConv', v)}
          />
          <NumberInput
            label="Expected return"
            value={inputs.expectedReturn}
            step={0.001}
            onChange={(v) => updateInput('expectedReturn', v)}
          />
          <NumberInput
            label="Inflation"
            value={inputs.inflation}
            step={0.001}
            onChange={(v) => updateInput('inflation', v)}
          />
        </AccordionPanel>
        <AccordionPanel 
        title="SSI Inputs" 
        info="<h3>Social Security Income</h3><p>Enter your expected Social Security income at each age. These values will be used to calculate your total income and taxes.</p><p>Information on Social Security benefits can be found at <a href='https://www.ssa.gov/benefits/retirement/' target='_blank' rel='noopener noreferrer'>https://www.ssa.gov/benefits/retirement/</a>.</p><p>Note: The Social Security Administration (SSA) provides an online tool called the <a href='https://www.ssa.gov/myaccount/' target='_blank' rel='noopener noreferrer'>my Social Security</a> account, where you can view your estimated benefits based on your earnings history and expected retirement age.</p>"
        isOpen={expandedIndex === 1} 
        onToggle={() => setSelectedPanel(1)}>
          {ssIncome.map((ss, i) => (
            <NumberInput
              key={i}
              label={`SS at ${ss.age} / month`}
              value={ss.amount}
              onChange={(v) => updateIncome({ ...ss, amount: v })}
            />
          ))}
        </AccordionPanel>
        <AccordionPanel
          title="Projected COLA"
          info="<h3>Cost of Living Adjustment (COLA)</h3><p>Cost of Living Adjustment (COLA) is the annual increase in Social Security benefits to keep up with inflation. Current year calculations use the published COLA rate. For future years, you can choose a strategy for how to calculate the projected COLA.</p><p>Information on Social Security COLA can be found at <a href='https://www.ssa.gov/cola/' target='_blank' rel='noopener noreferrer'>https://www.ssa.gov/cola/</a>.</p>"
          isOpen={expandedIndex === 2}
          onToggle={() => setSelectedPanel(2)}>
          <Dropdown
            label="Strategy"
            options={strategyOptions}
            selectedValue={selectedStrategy}
            onChange={(v) => setColaSettings({ ...colaSettings, strategy: Number(v) })}
          />
          <NumberInput
            label="Fixed Rate"
            value={colaSettings.fixedRate}
            step={0.001}
            readonly={colaSettings.strategy !== ColaStrategyType.FixedRate}
            selected={selectedStrategy === ColaStrategyType.FixedRate}
            onChange={(v) => setColaSettings({ ...colaSettings, fixedRate: v })}
          />
          <NumberInput
            label={`${Object.keys(COLA_HISTORY)[Object.keys(COLA_HISTORY).length - 1]} Rate`}
            value={colaSettings.lastRate}
            readonly={true}
            selected={selectedStrategy === ColaStrategyType.LastRate}
          />
          <NumberInput
            label="Inflation Rate"
            value={inputs.inflation}
            readonly={true}
            selected={selectedStrategy === ColaStrategyType.InflationRate}
          />
          <NumberInput
            label="Average Rate"
            value={colaSettings.averageRate}
            readonly={true}
            selected={selectedStrategy === ColaStrategyType.HistoricalAverage}
          />
          <NumberInput
            label="Monte Carlo Rate"
            value={colaSettings.monteCarloRate}
            readonly={true}
            selected={selectedStrategy === ColaStrategyType.MonteCarlo}
          />
        </AccordionPanel>
      </div>
    </aside>
  );
}
