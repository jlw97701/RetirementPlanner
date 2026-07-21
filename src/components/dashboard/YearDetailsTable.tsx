import { Table } from 'lucide-react';
import { formatMoney } from '../../utils/format';
import { CollapsiblePanel } from '../shared/CollapsiblePanel';
import type { RetirementYear } from '../../models/RetirementTypes';

export function YearDetailsTable({ rows }: { rows: RetirementYear[] }) {
  const showIrmaa = rows.some((row) => row.annualIrmaaSurcharge > 0);

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
          Medicare/healthcare details show standard Part B, user-entered Part D or other coverage, out-of-pocket
          healthcare, and IRMAA. <strong>Added to Spending</strong> is zero when Annual Spending already includes
          these costs; otherwise it is included in Spending and funded by the withdrawal calculation.
        </p>
        <p>
          <strong>IRMAA MAGI</strong> is the income used for the current tax year. <strong>IRMAA Lookback</strong>
          is the MAGI from two years earlier used to estimate the listed year's Medicare surcharge. The estimate
          assumes single filing status and includes Part B and Part D adjustments. It is added to Spending only when
          the user indicates that Annual Spending excludes Medicare and healthcare costs.
          <strong> Conversion Impact</strong> identifies a Roth conversion from two years earlier that raised the
          estimated IRMAA tier.
        </p>
        <p>
          <strong>IRMAA Basis</strong> identifies an exact published premium-year table or an inflation-based estimate
          derived from the most recent published table.
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
              <th>Part B</th>
              <th>Part D/Other</th>
              <th>Health OOP</th>
              <th>Total Medicare/Health</th>
              <th>Added to Spending</th>
              <th>Social Sec</th>
              <th>Trad Dist</th>
              <th>Roth Conv</th>
              <th>Fed Tax</th>
              <th>State Tax</th>
              {showIrmaa && (
                <>
                  <th>IRMAA MAGI</th>
                  <th>IRMAA Lookback</th>
                  <th>IRMAA Tier</th>
                  <th>IRMAA Surcharge</th>
                  <th>IRMAA Basis</th>
                  <th>Conversion Impact</th>
                </>
              )}
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
                <td>{formatMoney(r.standardPartBPremium)}</td>
                <td>{formatMoney(r.partDOtherPremium)}</td>
                <td>{formatMoney(r.outOfPocketHealthcare)}</td>
                <td>{formatMoney(r.totalMedicareHealthcareCost)}</td>
                <td>{formatMoney(r.medicareHealthcareAddedToSpending)}</td>
                <td>{formatMoney(r.socialSecurity)}</td>
                <td>{formatMoney(r.traditionalDist)}</td>
                <td>{formatMoney(r.rothConv)}</td>
                <td>{formatMoney(r.federalTax)}</td>
                <td>{formatMoney(r.stateTax)}</td>
                {showIrmaa && (
                  <>
                    <td>{formatMoney(r.irmaaMagi)}</td>
                    <td>{formatMoney(r.irmaaLookbackMagi)}</td>
                    <td>{r.medicareEligible ? r.irmaaTier : '—'}</td>
                    <td>{formatMoney(r.annualIrmaaSurcharge)}</td>
                    <td>
                      {r.irmaaIsEstimated
                        ? `Estimated from ${r.irmaaConfigurationYear}`
                        : r.irmaaIsPublished
                          ? `Published ${r.irmaaConfigurationYear}`
                          : `Custom ${r.irmaaConfigurationYear}`}
                    </td>
                    <td>{r.rothConversionRaisesIrmaaTier ? 'Raised tier' : '—'}</td>
                  </>
                )}
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
