import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatMoney } from '../../utils/format';
import { CollapsiblePanel } from '../shared/CollapsiblePanel';
import { RothConversionType, type RetirementYear, type RetirementScenario } from '../../models/RetirementTypes';

export function ScenarioChart({ rows, scenario }: { rows: RetirementYear[]; scenario: RetirementScenario }) {
  let title = scenario.claimAge === null ? 'Actual Social Security' : `Social Security at ${scenario.claimAge}`;
  title +=
    ' | ' +
    (scenario.rothConvType === RothConversionType.None
      ? 'No'
      : scenario.rothConvType === RothConversionType.Base
        ? 'Base'
        : 'Aggressive') +
    ' Roth Conversion';

  const data = rows.map((row) => ({
    age: row.age,
    Traditional: Math.round(row.endTradlIra),
    Roth: Math.round(row.endRothIra),
    Savings: Math.round(row.endTaxableAcct),
    'Total Nominal': Math.round(row.endPortfolio),
    'Total Start-Year $': Math.round(row.endPortfolioCurrentDollars)
  }));

  const customOrder = ['Traditional', 'Roth', 'Savings', 'Total Nominal', 'Total Start-Year $'];

  return (
    <CollapsiblePanel
      title={title}
      icon={<TrendingUp />}
      info={`
        <h3>Portfolio Projection</h3>
        <p>
          This graph shows the projected December 31 account balances for each age. 
          Traditional IRA, Roth IRA, and Savings are shown in nominal future dollars.
        </p>
        <p>
          <strong>Total Nominal</strong> is the combined projected account balance in future dollars.
        </p>
        <p>
          <strong>Total Start-Year $</strong> shows the same total adjusted for inflation and expressed 
          in the purchasing power of the first projection year.</p><p>The projection assumes annual cash 
          flows occur at midyear and taxable savings do not earn interest.
        </p>
      `}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <XAxis dataKey="age" />
          <YAxis tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} />
          <Tooltip
            formatter={(v) => formatMoney(Number(v))}
            itemSorter={(item) => customOrder.indexOf(item.dataKey as string)}
          />
          <Legend iconType="plainline" itemSorter={(item) => customOrder.indexOf(item.dataKey as string)} />
          <Line type="monotone" dataKey="Traditional" stroke="#28b352" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Roth" stroke="#bd9831" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Savings" stroke="#a771d4" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Total Nominal" stroke="#3182bd" strokeWidth={3} dot={false} />
          <Line
            type="monotone"
            dataKey="Total Start-Year $"
            stroke="#43bfc4"
            strokeWidth={3}
            strokeDasharray="6 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </CollapsiblePanel>
  );
}
