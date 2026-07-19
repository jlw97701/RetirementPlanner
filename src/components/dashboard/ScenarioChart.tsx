import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { TrendingUp } from 'lucide-react';

import { RothConversionType, type RetirementYear, type RetirementScenario } from '../../models/RetirementTypes';

import { formatMoney } from '../../utils/format';

export function ScenarioChart({ rows, scenario }: { rows: RetirementYear[]; scenario: RetirementScenario }) {
  const title = scenario.claimAge === null ? 'Actual Social Security' : `Social Security at ${scenario.claimAge}`;

  const data = rows.map((r) => ({
    age: r.age,
    Traditional: Math.round(r.endTradlIra),
    Roth: Math.round(r.endRothIra),
    Savings: Math.round(r.endTaxableAcct),
    Total: Math.round(r.endPortfolio)
  }));

  const customOrder = ['Traditional', 'Roth', 'Savings', 'Total'];

  return (
    <section className="panel">
      <h2>
        <TrendingUp />
        {title}
        {' | '}
        {scenario.rothConvType === RothConversionType.None
          ? 'No'
          : scenario.rothConvType === RothConversionType.Base
            ? 'Base'
            : 'Aggressive'}{' '}
        Roth Conversion
      </h2>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <XAxis dataKey="age" />
          <YAxis tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} />
          <Tooltip
            formatter={(v) => formatMoney(Number(v))}
            itemSorter={(item) => customOrder.indexOf(item.dataKey as string)}
          />
          <Legend itemSorter={(item) => customOrder.indexOf(item.dataKey as string)} />
          <Line type="monotone" dataKey="Traditional" stroke="#108533" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Roth" stroke="#bd6931" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Savings" stroke="#803d71" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Total" stroke="#3182bd" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
