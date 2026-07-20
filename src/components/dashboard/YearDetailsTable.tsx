import { Table } from 'lucide-react';
import { formatMoney } from '../../utils/format';
import { CollapsiblePanel } from '../shared/CollapsiblePanel';
import type { RetirementYear } from '../../models/RetirementTypes';

export function YearDetailsTable({ rows }: { rows: RetirementYear[] }) {
  return (
    <CollapsiblePanel
      title="Year-By-Year Details"
      icon={<Table />}
      info={`
        <h3>Year-By-Year Details</h3>
        <p>
          This table shows the annual cash flows and December 31 account balances for the selected scenario. 
          Each row represents one complete calendar year, with the listed age being the age reached during that year.
        </p>
        <p>
          It includes spending, Social Security, investment growth, RMDs, withdrawals, Roth conversions, taxes, and taxable savings activity. 
          Account balances and annual amounts are shown in nominal dollars.
        </p>
        <p>
          Investment returns are split around midyear cash flows, and taxable savings are assumed to earn no interest.
        </p>
        <p>
          <strong>Unfunded Need</strong> is spending and tax expense that could not be covered by the available accounts.
        </p>
      `}>
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
    </CollapsiblePanel>
  );
}
