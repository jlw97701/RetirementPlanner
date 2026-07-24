import { CircleHelp } from 'lucide-react';

export function EconomicScenarioHelp() {
  return (
    <main className="help-layout">
      <article className="help-page panel">
        <div className="help-title">
          <CircleHelp size={28} />
          <div>
            <h2>Understanding Economic Scenarios</h2>
            <p>Use scenarios to test whether a retirement plan remains workable under different conditions.</p>
          </div>
        </div>

        <section>
          <h3>Scenarios are illustrations, not forecasts</h3>
          <p>
            No economic scenario predicts the future or guarantees a retirement outcome. A more useful question is
            whether the plan can fund essential spending across several plausible return and inflation environments.
          </p>
          <p>
            FINRA notes that investment returns are difficult to predict and recommends trying different assumptions to
            understand how they affect retirement results. Return assumptions should reflect investment expenses.
          </p>
        </section>

        <section>
          <h3>Deterministic</h3>
          <p>
            The four predefined profiles are calculated from rolling 10- or 20-year annualized portfolio returns in the
            1975–2025 historical dataset. Each historical year is weighted using the selected asset allocation, the
            window's returns are compounded and annualized, and the resulting long-term returns are sorted from weakest
            to strongest.
          </p>
          <p>
            The selected portfolio-level rate is then applied smoothly every projection year. It does not reproduce the
            annual gains and losses that occurred inside the historical periods. Custom Return instead lets you
            enter separate U.S. stock, foreign stock, bond, cash, and Other assumptions. The planner's inflation input
            controls annual spending inflation for either approach.
          </p>
          <p>Use deterministic scenarios to establish a baseline and run controlled stress tests:</p>
          <div className="help-table-container">
            <table>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>How to use it</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Very Low Historical Return</td>
                  <td>
                    Uses a low-end long-term return. Only about 1 out of 10 rolling historical periods was weaker.
                  </td>
                </tr>
                <tr>
                  <td>Lower Historical Return</td>
                  <td>
                    Uses a cautious long-term return. About 1 out of 4 rolling historical periods was weaker.
                  </td>
                </tr>
                <tr>
                  <td>Middle Historical Return</td>
                  <td>Uses the middle historical result: half of the rolling periods were weaker and half stronger.</td>
                </tr>
                <tr>
                  <td>Higher Historical Return</td>
                  <td>Uses a stronger result that about 3 out of 4 rolling historical periods finished below.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="help-callout">
            Limitation: overlapping rolling periods are not independent observations, and steady annual returns do not
            capture market volatility or the timing of gains and losses. These historical return levels are planning
            assumptions, not forecasts or probabilities. Very Low Historical Return is not a prediction of a particular
            recession or market event.
          </p>
        </section>

        <section>
          <h3>Single Simulated Path</h3>
          <p>
            A simulated path generates a different inflation rate and asset-class return for each projection year. The
            random seed identifies the sequence and makes it reproducible.
          </p>
          <p>Use simulated paths to explore:</p>
          <ul>
            <li>market volatility and early-retirement losses;</li>
            <li>sequence-of-returns risk while withdrawals are occurring;</li>
            <li>periods of higher inflation; and</li>
            <li>how quickly accounts may be depleted during unfavorable sequences.</li>
          </ul>
          <p>
            Test several predetermined seeds while leaving the retirement inputs unchanged. Do not repeatedly change the
            seed until a favorable result appears.
          </p>
          <p className="help-callout">
            A single simulated path is not a complete risk analysis. It does not calculate probability of success or
            show a range of possible results.
          </p>
        </section>

        <section>
          <h3>Retirement Risk Analysis</h3>
          <p>
            Retirement Risk Analysis is an optional multi-path stress test. When Deterministic is selected, the active
            Market Assumption supplies its target average portfolio return. Custom Return supplies the asset-class
            averages directly. The analysis continues to use the Single Simulated Path volatility, correlation, return
            limits, inflation, and seed assumptions. The normal deterministic projection remains the default experience.
          </p>
          <p>
            Every Social Security claiming and Roth-conversion strategy is evaluated against the same generated paths
            (1,000 by default). Using identical paths makes the strategy comparison fair and keeps the result
            reproducible. At least 1,000 simulated futures is recommended when comparing results with another planner.
          </p>
          <p>
            <strong>Spending Covered Through an Age</strong> is the percentage of simulated futures in which every
            modeled spending need is met through that stated age. The Primary Horizon Age and Ending Age rates answer
            different questions, so compare planners only when they use the same age.
          </p>
          <p>
            The possible-balance table shows a Very Cautious result, a Cautious result, and the Middle result from the
            same simulations. It shows each result in both Future Dollars and Inflation-Adjusted Dollars. About 9 out
            of 10 simulated futures finish above the Very Cautious result, about 3 out of 4 finish above the Cautious
            result, and half finish above the Middle result.
          </p>
          <p className="help-callout">
            These percentages measure sensitivity to the configured assumptions; they are not forecasts or guarantees.
            Changing expected returns, volatility, correlations, inflation, spending, or longevity can materially change
            the results.
          </p>
        </section>

        <section>
          <h3>Historical scenarios</h3>
          <p>
            Historical Sequence and Historical Bootstrap use the planner's reviewed 1975–2025 annual dataset. A sequence
            replays consecutive historical years; a bootstrap samples contiguous blocks of historical years to produce
            new paths. Historical results are useful stress tests, but past performance does not guarantee future
            results.
          </p>
          <p>
            The dataset uses S&amp;P 500 total returns including dividends for U.S. stocks; value-weighted international
            developed-market returns in U.S. dollars for foreign stocks; modeled total returns on a constant-maturity
            10-year U.S. Treasury bond; average 3-month Treasury-bill rates; CPI-U inflation; and official Social
            Security COLAs. The Other return is zero because that category can contain assets with very different
            behavior and has no single defensible historical proxy.
          </p>
          <p>
            With wrapping enabled, a sequence that reaches 2025 continues again at 1975. With wrapping disabled, the
            selected start year must leave enough consecutive historical years to cover the complete projection.
          </p>
        </section>

        <section>
          <h3>Historical data sources</h3>
          <ul>
            <li>
              <a
                href="https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html"
                target="_blank"
                rel="noopener noreferrer">
                Kenneth R. French Data Library: International Research Returns
              </a>{' '}
              â€” annual value-weighted developed-market returns in U.S. dollars using EAFE plus Canada country weights.
            </li>
            <li>
              <a
                href="https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histret.html"
                target="_blank"
                rel="noopener noreferrer">
                NYU Stern: Historical Returns on Stocks, Bonds and Bills
              </a>{' '}
              — annual stock total returns, Treasury bond total returns, Treasury-bill rates, and CPI-U inflation.
            </li>
            <li>
              <a href="https://www.ssa.gov/oact/cola/colaseries.html" target="_blank" rel="noopener noreferrer">
                Social Security Administration: Official COLA History
              </a>{' '}
              — annual automatic Social Security cost-of-living adjustments beginning in 1975.
            </li>
            <li>
              <a href="https://www.bls.gov/cpi/" target="_blank" rel="noopener noreferrer">
                U.S. Bureau of Labor Statistics: Consumer Price Index
              </a>{' '}
              — official CPI definitions, methodology, and supporting inflation data.
            </li>
          </ul>
          <p className="help-callout">
            Historical data is stored with the application so results remain reproducible. The international source is
            published to two decimal percentage points; other return series are stored to six decimal places. Data
            sources and methodologies may be revised after the version included by the planner.
          </p>
        </section>

        <section>
          <h3>Recommended workflow</h3>
          <ol>
            <li>Verify balances, spending, Social Security, allocation, conversion amounts, and projection ages.</li>
            <li>Run the Middle Historical Return deterministic profile as a baseline.</li>
            <li>Run the Lower Historical Return profile and test a higher inflation input.</li>
            <li>Run several single simulated paths using predetermined seeds.</li>
            <li>Run Retirement Risk Analysis with at least 1,000 simulated futures.</li>
            <li>Keep the same assumptions and ages when comparing claiming or Roth-conversion strategies.</li>
            <li>Look for results that remain workable across unfavorable conditions, not only the best result.</li>
          </ol>
        </section>

        <section>
          <h3>What to review</h3>
          <ul>
            <li>portfolio value at the horizon and ending ages;</li>
            <li>Inflation-Adjusted Dollars, which show values using first-projection-year purchasing power;</li>
            <li>depletion age and any unfunded need;</li>
            <li>the effect of early losses on withdrawals; and</li>
            <li>whether essential spending depends on favorable assumptions.</li>
          </ul>
          <p>
            Future-Dollar values are expressed in the dollars projected for a future year. Inflation-Adjusted Dollars
            express the same balance using the purchasing power of the first projection year.
          </p>
        </section>

        <section>
          <h3>State income-tax estimates</h3>
          <p>
            Select the state where you expect to reside in Planner Inputs. The planner applies that residence for every
            projection year and estimates tax on modeled traditional-account distributions and any Social Security
            amount included by that state. States without a broad individual income tax produce a zero ordinary-income
            estimate.
          </p>
          <p>
            The bundled tables include 2026 statewide schedules for all 50 states and the District of Columbia, plus
            basic Social Security and retirement-income exclusions. Published Single and Married Filing Jointly
            schedules are used directly. Married Filing Separately and Head of Household use the Single schedule as a
            planning approximation unless you edit the table.
          </p>
          <p className="help-callout">
            State results are planning estimates, not tax-return calculations. They assume one residence for the entire
            projection and do not include local income taxes, planned moves, a spouse's separate age or retirement
            exclusion, or every state-specific adjustment, phaseout, credit, recapture, and alternative tax. Review the
            selected state's current instructions before making a tax decision.
          </p>
          <ul>
            <li>
              <a
                href="https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/"
                target="_blank"
                rel="noopener noreferrer">
                Tax Foundation: 2026 State Individual Income Tax Rates and Brackets
              </a>{' '}
              — baseline statewide rates, brackets, deductions, and exemptions.
            </li>
            <li>
              <a
                href="https://www.irs.gov/businesses/small-businesses-self-employed/state-government-websites"
                target="_blank"
                rel="noopener noreferrer">
                IRS: State Government Websites
              </a>{' '}
              — links to each state's tax authority for current filing instructions.
            </li>
            <li>
              <a
                href="https://www.aarp.org/social-security/faq/which-states-do-not-tax-benefits/"
                target="_blank"
                rel="noopener noreferrer">
                AARP: State taxation of Social Security benefits
              </a>{' '}
              — overview of states that may include benefits in taxable income.
            </li>
          </ul>
          <p>
            Later-enacted 2026 flat-rate updates are taken from the{' '}
            <a href="https://dor.georgia.gov/taxes/important-tax-updates" target="_blank" rel="noopener noreferrer">
              Georgia Department of Revenue
            </a>{' '}
            and{' '}
            <a
              href="https://le.utah.gov/xcode/Title59/Chapter10/59-10-S104.html"
              target="_blank"
              rel="noopener noreferrer">
              Utah Code §59-10-104
            </a>
            .
          </p>
        </section>

        <section>
          <h3>Additional guidance</h3>
          <p>
            <a href="https://retirementcalculator.nga.finra.org/" target="_blank" rel="noopener noreferrer">
              FINRA Retirement Calculator guidance
            </a>
            {' · '}
            <a
              href="https://www.finra.org/investors/learn-to-invest/types-investments/retirement/managing-retirement-income/managing-your-retirement-portfolio"
              target="_blank"
              rel="noopener noreferrer">
              FINRA: Managing Your Retirement Portfolio
            </a>
            {' · '}
            <a
              href="https://www.investor.gov/additional-resources/retirement-toolkit/managing-lifetime-income"
              target="_blank"
              rel="noopener noreferrer">
              Investor.gov: Managing Lifetime Income
            </a>
          </p>
        </section>

        <div className="notice">
          Educational planning model only. Review assumptions and retirement decisions with qualified financial and tax
          professionals.
        </div>
      </article>
    </main>
  );
}
