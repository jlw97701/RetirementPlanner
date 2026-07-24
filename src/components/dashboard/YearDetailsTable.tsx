import { Table } from 'lucide-react';
import { formatMoney } from '../../utils/format';
import { CollapsiblePanel } from '../shared/CollapsiblePanel';
import type { RetirementScenario, RetirementYear } from '../../models/RetirementTypes';

export function YearDetailsTable({ rows, scenario }: { rows: RetirementYear[]; scenario: RetirementScenario }) {
  const subtitle = scenario.claimAge === null ? 'Actual Social Security' : `Social Security at ${scenario.claimAge}`;
  const showIrmaa = rows.some((row) => row.annualIrmaaSurcharge > 0);

  return (
    <CollapsiblePanel
      title="Year-By-Year Details"
      subtitle={subtitle}
      icon={<Table />}
      info={`
        <h3>Year-By-Year Details</h3>
        <p>
          This table shows the annual cash flows and December 31 account balances for the selected scenario. 
          Each row represents one complete calendar year, with the listed age being the age reached during that year.
        </p>
        <p>
          It includes spending, Social Security, investment growth, RMDs, withdrawals, Roth conversions, taxes, and taxable savings activity. 
          Account balances and annual amounts are shown in the dollars projected for each future year.
        </p>
        <p>
          <strong>State Taxable Income</strong> reflects the selected residence state's configured Social Security
          treatment, retirement-income exclusion, deductions, and exemptions. <strong>Federal Basis</strong> and
          <strong> State Basis</strong> identify the source configuration year. A federal “estimate” is
          inflation-adjusted from that source year. A state “estimate” may also indicate that the source
          configuration itself is approximate. Local income taxes are not included.
        </p>
        <p>
          Medicare/healthcare details show standard Part B, user-entered Part D or other coverage, out-of-pocket
          healthcare, and IRMAA. <strong>Added to Spending</strong> is zero when Annual Spending already includes
          these costs; otherwise it is included in Spending and funded by the withdrawal calculation.
        </p>
        <p>
          <strong>IRMAA MAGI</strong> is the income used for the current tax year. <strong>IRMAA Lookback</strong>
          is the MAGI from two years earlier used to estimate the listed year's Medicare surcharge. The estimate
          uses the filing status selected in Planner Inputs and includes Part B and Part D adjustments. Head of
          Household uses the individual IRMAA table. It is added to Spending only when
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
              <th>
                Part
                <br />
                D/Other
              </th>
              <th>
                Health
                <br />
                OOP
              </th>
              <th>
                Total
                <br />
                Medicare/Health
              </th>
              <th>
                Added to
                <br />
                Spending
              </th>
              <th>
                Social
                <br />
                Security
              </th>
              <th>
                Trad IRA
                <br />
                Distribution
              </th>
              <th>
                Roth IRA
                <br />
                Conversion
              </th>
              <th>
                Federal
                <br />
                Tax
              </th>
              <th>Federal Basis</th>
              <th>
                {rows[0]?.stateCode ?? 'State'} Taxable
                <br />
                Income
              </th>
              <th>
                Retirement
                <br />
                Exclusion
              </th>
              <th>{rows[0]?.stateCode ?? 'State'} Tax</th>
              <th>State Basis</th>
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
              <th>
                Cash
                <br />
                Flow
              </th>
              <th>
                End
                <br />
                Savings
              </th>
              <th>
                End
                <br />
                Trad IRA
              </th>
              <th>
                End
                <br />
                Roth IRA
              </th>
              <th>
                End
                <br />
                Total
              </th>
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
                <td>{`${r.federalTaxConfigurationYear}${r.federalTaxIsEstimated ? ' estimate' : ''}`}</td>
                <td>{formatMoney(r.stateTaxableIncome)}</td>
                <td>{formatMoney(r.stateRetirementIncomeExclusion)}</td>
                <td>{formatMoney(r.stateTax)}</td>
                <td>{`${r.stateCode} ${r.stateTaxConfigurationYear}${r.stateTaxIsEstimated ? ' estimate' : ''}`}</td>
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
