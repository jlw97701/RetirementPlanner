import { Table } from 'lucide-react';
import type { RetirementYear } from '../../models/RetirementTypes';
import { formatMoney } from '../../utils/format';

export function YearDetailsTable({ rows }: { rows: RetirementYear[] }) {
  return (
    <section className="panel table-panel">
      <h2>
        <Table /> Year-by-year details
      </h2>
      <div className="table-container">
        <table className="sticky-table">
          <thead>
            <tr>
              <th>Age</th>
              <th>Year</th>
              <th>Spending</th>
              <th>Social Sec</th>
              <th>Trad Dist</th>
              <th>Roth Conv</th>
              <th>Fed Tax</th>
              <th>State Tax</th>
              <th>Cash Flow</th>
              <th>End Savings</th>
              <th>End Trad</th>
              <th>End Roth</th>
              <th>End Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.age}>
                <td>{r.age}</td>
                <td>{r.year}</td>
                <td>{formatMoney(r.spending)}</td>
                <td>{formatMoney(r.socialSecurity)}</td>
                <td>{formatMoney(r.traditionalDist)}</td>
                <td>{formatMoney(r.rothConv)}</td>
                <td>{formatMoney(r.federalTax)}</td>
                <td>{formatMoney(r.stateTax)}</td>
                <td>{formatMoney(r.taxableAcctDeposit - r.taxableAcctWithdraw)}</td>
                <td>{formatMoney(r.endTaxableAcct)}</td>
                <td>{formatMoney(r.endTradlIra)}</td>
                <td>{formatMoney(r.endRothIra)}</td>
                <td>{formatMoney(r.endPortfolio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
