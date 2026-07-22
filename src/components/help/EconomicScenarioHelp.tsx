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
            FINRA notes that investment returns are difficult to predict and recommends trying different assumptions
            to understand how they affect retirement results. Return assumptions should reflect investment expenses.
          </p>
        </section>

        <section>
          <h3>Deterministic</h3>
          <p>
            The three predefined profiles are calculated from rolling 10- or 20-year annualized portfolio returns in
            the 1975–2025 historical dataset. Each historical year is weighted using the selected asset allocation,
            the window's returns are compounded and annualized, and the resulting windows form a distribution.
            Significantly Below Average uses its 10th percentile as a severe stress test; Below Average, Average, and
            Above Average use its 25th, 50th, and 75th percentiles, respectively.
          </p>
          <p>
            The selected portfolio-level rate is then applied every projection year. Custom Market instead lets you
            enter separate stock, bond, cash, and Other assumptions. The planner's inflation input controls annual
            spending inflation for either approach.
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
                  <td>Significantly Below Avg Market</td>
                  <td>Uses the 10th-percentile return to test prolonged, unusually weak portfolio performance.</td>
                </tr>
                <tr>
                  <td>Average Market</td>
                  <td>Uses the baseline long-term return assumptions to create an understandable reference result.</td>
                </tr>
                <tr>
                  <td>Below Average Market</td>
                  <td>Uses lower returns to test whether essential spending remains funded.</td>
                </tr>
                <tr>
                  <td>Above Average Market</td>
                  <td>Uses stronger returns to illustrate the plan's upside range.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="help-callout">
            Limitation: overlapping rolling periods are not independent observations, and steady annual returns do
            not capture market volatility or the timing of gains and losses. These historical percentiles are planning
            assumptions, not forecasts or confidence intervals. Significantly Below Average is not a prediction of a
            particular recession.
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
            Test several predetermined seeds while leaving the retirement inputs unchanged. Do not repeatedly change
            the seed until a favorable result appears.
          </p>
          <p className="help-callout">
            A single simulated path is not a complete Monte Carlo analysis. It does not calculate probability of
            success, percentiles, or confidence intervals.
          </p>
        </section>

        <section>
          <h3>Retirement Risk Analysis</h3>
          <p>
            Retirement Risk Analysis is an optional multi-path stress test. It uses the selected asset allocation and
            the Single Simulated Path return, volatility, inflation, correlation, and seed assumptions. The normal
            deterministic projection remains the default experience.
          </p>
          <p>
            Every Social Security claiming and Roth-conversion strategy is evaluated against the same generated paths
            (100 by default). Using identical paths makes the strategy comparison fair and keeps the result reproducible.
          </p>
          <p>
            <strong>Fully Funded Paths</strong> is the percentage of paths in which every modeled spending need is met
            through the ending age. <strong>Depletion Risk</strong> is the percentage with at least one unfunded need.
            Ending-balance percentiles and the shaded chart are expressed in first-projection-year purchasing power.
          </p>
          <p className="help-callout">
            These percentages measure sensitivity to the configured assumptions; they are not forecasts or guarantees.
            Changing expected returns, volatility, correlations, inflation, spending, or longevity can materially
            change the results.
          </p>
        </section>

        <section>
          <h3>Historical scenarios</h3>
          <p>
            Historical Sequence and Historical Bootstrap use the planner's reviewed 1975–2025 annual dataset. A
            sequence replays consecutive historical years; a bootstrap samples contiguous blocks of historical years
            to produce new paths. Historical results are useful stress tests, but past performance does not guarantee
            future results.
          </p>
          <p>
            The dataset uses S&amp;P 500 total returns including dividends, modeled total returns on a
            constant-maturity 10-year U.S. Treasury bond, average 3-month Treasury-bill rates, CPI-U inflation, and
            official Social Security COLAs. The Other return is zero because that category can contain assets with very
            different behavior and has no single defensible historical proxy.
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
                href="https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histret.html"
                target="_blank"
                rel="noopener noreferrer">
                NYU Stern: Historical Returns on Stocks, Bonds and Bills
              </a>{' '}
              — annual stock total returns, Treasury bond total returns, Treasury-bill rates, and CPI-U inflation.
            </li>
            <li>
              <a
                href="https://www.ssa.gov/oact/cola/colaseries.html"
                target="_blank"
                rel="noopener noreferrer">
                Social Security Administration: Official COLA History
              </a>{' '}
              — annual automatic Social Security cost-of-living adjustments beginning in 1975.
            </li>
            <li>
              <a
                href="https://www.bls.gov/cpi/"
                target="_blank"
                rel="noopener noreferrer">
                U.S. Bureau of Labor Statistics: Consumer Price Index
              </a>{' '}
              — official CPI definitions, methodology, and supporting inflation data.
            </li>
          </ul>
          <p className="help-callout">
            Historical data is rounded to six decimal places and stored with the application so results remain
            reproducible. Data sources and methodologies may be revised after the version included by the planner.
          </p>
        </section>

        <section>
          <h3>Recommended workflow</h3>
          <ol>
            <li>Verify balances, spending, Social Security, allocation, conversion amounts, and projection ages.</li>
            <li>Run the Average Market deterministic profile as a baseline.</li>
            <li>Run the Below Average Market profile and test a higher inflation input.</li>
            <li>Run several single simulated paths using predetermined seeds.</li>
            <li>Keep the same scenario and seed when comparing claiming or Roth-conversion strategies.</li>
            <li>Look for results that remain workable across unfavorable conditions, not only the best result.</li>
          </ol>
        </section>

        <section>
          <h3>What to review</h3>
          <ul>
            <li>portfolio value at the horizon and ending ages;</li>
            <li>Start-Year dollars, which show inflation-adjusted purchasing power;</li>
            <li>depletion age and any unfunded need;</li>
            <li>the effect of early losses on withdrawals; and</li>
            <li>whether essential spending depends on favorable assumptions.</li>
          </ul>
          <p>
            Nominal values are the dollars projected for a future year. Start-Year values express the same balance in
            the purchasing power of the first projection year.
          </p>
        </section>

        <section>
          <h3>State income-tax estimates</h3>
          <p>
            Select the state where you expect to reside in Planner Inputs. The planner applies that residence for
            every projection year and estimates tax on modeled traditional-account distributions and any Social
            Security amount included by that state. States without a broad individual income tax produce a zero
            ordinary-income estimate.
          </p>
          <p>
            The bundled tables include 2026 statewide schedules for all 50 states and the District of Columbia, plus
            basic Social Security and retirement-income exclusions. Published Single and Married Filing Jointly
            schedules are used directly. Married Filing Separately and Head of Household use the Single schedule as a
            planning approximation unless you edit the table.
          </p>
          <p className="help-callout">
            State results are planning estimates, not tax-return calculations. They assume one residence for the
            entire projection and do not include local income taxes, planned moves, a spouse's separate age or
            retirement exclusion, or every state-specific adjustment, phaseout, credit, recapture, and alternative
            tax. Review the selected state's current instructions before making a tax decision.
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
          Educational planning model only. Review assumptions and retirement decisions with qualified financial and
          tax professionals.
        </div>
      </article>
    </main>
  );
}
