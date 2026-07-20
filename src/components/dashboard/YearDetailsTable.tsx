import { Table } from 'lucide-react';
import { formatMoney } from '../../utils/format';
import { CollapsiblePanel } from '../shared/CollapsiblePanel';
import type { RetirementYear } from '../../models/RetirementTypes';

export function YearDetailsTable({ rows }: { rows: RetirementYear[] }) {
  return (
    <CollapsiblePanel
      title="Year-By-Year Details"
      icon={<Table />}
      info="<h3>Year-By-Year Details</h3><p>Each row represents January 1 through December 31. 'Age' is the age attained during that calendar year.</p>">
      <div className="table-container">
        <table className="sticky-table">
          <thead>
            <tr>
              <th>Age</th>
              <th>Year</th>
              {/* <th>Period</th> */}
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
    </CollapsiblePanel>
  );
}
