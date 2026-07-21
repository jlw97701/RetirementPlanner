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
            A deterministic scenario applies the entered stock, bond, cash, and other returns every year. The planner's
            inflation input controls annual spending inflation.
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
                  <td>Baseline</td>
                  <td>Enter reasonable long-term assumptions to create an understandable reference result.</td>
                </tr>
                <tr>
                  <td>Conservative</td>
                  <td>Use lower returns and higher inflation to test whether essential spending remains funded.</td>
                </tr>
                <tr>
                  <td>Favorable</td>
                  <td>Use stronger returns or lower inflation to understand the plan's upside range.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="help-callout">
            Limitation: steady annual returns do not capture market volatility or the timing of gains and losses.
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
            <li>Run a baseline deterministic scenario.</li>
            <li>Run a conservative deterministic scenario with weaker returns and higher inflation.</li>
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
