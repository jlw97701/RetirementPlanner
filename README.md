# Retirement Income Planner

An educational retirement-income planning application built with React and TypeScript. It compares Social Security
claiming ages and Roth-conversion strategies while modeling spending, investment returns, taxes, Medicare, IRMAA,
required minimum distributions, and portfolio withdrawals.

> This application is a planning and sensitivity-analysis tool, not financial, tax, legal, or investment advice.
> Results are projections based on the selected assumptions and are not forecasts or guarantees.

## Positioning and scope

Retirement Income Planner is a transparent, do-it-yourself retirement-income strategy tool. It goes beyond a
single-result retirement calculator by comparing Social Security claiming ages and Roth-conversion approaches inside
the same annual cash-flow model. Users can see how spending, withdrawals, taxes, Medicare, IRMAA, required minimum
distributions, and market assumptions interact instead of reviewing those decisions in separate calculators.

The application is most useful for exploring questions such as:

- How does claiming Social Security earlier or later affect portfolio longevity?
- Does a fixed or bracket-targeted Roth-conversion schedule improve the projected after-tax outcome?
- What are the tax and IRMAA tradeoffs of converting more Traditional IRA assets?
- How does a strategy perform under below-average, historical, or simulated market conditions?
- When and why does a projected spending shortfall occur?

Its principal advantage is calculation transparency. Scenario summaries provide comparisons, while the chart and
Year-by-Year Details expose the annual balances, income, withdrawals, conversions, taxes, healthcare costs, and
shortfalls behind each result.

The application is not intended to replace a comprehensive household financial plan, tax-preparation software,
investment management, or professional advice. It currently does not model:

- separate spouses, spousal or survivor Social Security benefits, or filing-status changes after a spouse's death;
- recurring pensions, annuities, employment or rental income, debts, real estate, estate planning, or general
  one-time financial events beyond the single future Traditional IRA rollover or deposit;
- changing spending phases or separate essential and discretionary spending goals;
- taxable-investment cost basis, dividends, capital gains, qualified charitable distributions, the net investment
  income tax, ACA subsidies, itemized deductions, local taxes, or every federal and state tax provision; or
- linked financial accounts, automatic data imports, cloud synchronization, advisor collaboration, or automatic
  regulatory-data updates.

The intended use is to compare plausible strategies and understand their sensitivities, then verify important
decisions and current rules with qualified financial and tax professionals.

## Features

- Compares Social Security claiming ages 62 through 70 using No Conversion and one user-entered Fixed Conversion.
- Includes an optional Roth Conversion Optimizer with federal-bracket, annual-cap, IRMAA, and future-tax-rate controls.
- Supports an entered benefit for someone already receiving Social Security.
- Projects Traditional IRA, Roth IRA, and non-interest-bearing taxable savings balances.
- Supports one dated, tax-free future rollover or deposit into the Traditional IRA.
- Applies the withdrawal order Traditional IRA, taxable savings, then Roth IRA.
- Models annual spending, inflation, Social Security COLAs, taxes, RMDs, Medicare costs, and IRMAA.
- Includes Conservative, Balanced, Growth, and Aggressive Growth asset allocations plus a persistent custom allocation.
  Every allocation models U.S. and international developed-market stocks separately; presets use a 70/30 split within
  their total stock allocation.
- Supports deterministic, single simulated path, historical sequence, and historical bootstrap economic scenarios.
- Includes editable federal and state tax configurations for four filing statuses and all 50 states plus the District of
  Columbia.
- Includes editable, year-specific Medicare IRMAA tables.
- Stores planner settings in browser local storage; no application server or user account is required.

## Planner output

### Scenario Highlights

Up to six cards call out notable strategies, including the baseline, highest horizon or ending balance, longest funding,
lowest taxes among the longest-funded strategies, and most Social Security received through the horizon. Duplicate
winners are collapsed. A highlight identifies one favorable characteristic and is not an overall recommendation.
Selecting a card opens that strategy in the summary, chart, and year-by-year details.

### Scenario Summary

The summary compares claiming and conversion strategies at the Primary Horizon Age and Ending Age. It includes
portfolio balances, Social Security, taxes, Medicare and healthcare costs, IRMAA when applicable, and the first age at
which the portfolio cannot fully cover projected spending.

Portfolio balances use two dollar views:

- **Future Dollars** are the projected dollars in the future year.
- **Inflation-Adjusted Dollars** express the same amount using the purchasing power of the first projection year.

### Portfolio chart

The chart shows Traditional IRA, Roth IRA, taxable savings, total Future Dollars, and total Inflation-Adjusted Dollars
for the selected strategy.

### Year-by-Year Details

The detailed table exposes the annual cash flow and calculation results, including investment growth, Social Security,
a future Traditional IRA rollover or deposit, withdrawals, conversions, RMDs, taxable income, federal and state taxes,
Medicare, IRMAA, account balances, and any unfunded spending.

### Roth Conversion Optimizer

The optional optimizer evaluates the selected Social Security claiming choice using No Conversion, the user-entered
Fixed Conversion, and annual schedules that fill federal tax brackets up to a user-selected limit. Scheduled conversions
use the same projection engine, RMD rules, withdrawal order, taxes, market path, and Medicare assumptions as the other
scenarios.

Users can set a maximum annual conversion, an IRMAA guardrail, and an estimated future combined tax rate for the
Traditional IRA remaining at the horizon and ending ages. Strategies must satisfy the selected limits before they can
be recommended. The comparison prioritizes covering spending and then estimated after-tax portfolio value; fixed
strategies that exceed a selected limit remain visible as reference-only results. The recommended annual schedule shows
both requested and actual conversions because taxes, spending, RMDs, and available Traditional IRA funds can reduce the
amount completed. Incremental IRMAA changes are included in the comparison when the surcharge is not already added
separately to spending.

The recommendation can be tested against the planner's seeded simulated market and inflation paths. This produces
modeled spending-success rates for the recommended schedule and No Conversion. The optimizer is an educational
comparison, not a tax recommendation or a substitute for year-by-year review with a qualified professional.

When a bracket-target policy is recommended, selecting **Use Optimized Schedule** adds it as an Optimized Roth scenario in the Scenario Summary,
portfolio chart, Year-by-Year Details, Scenario Highlights, and Retirement Risk Analysis. Reapplying replaces the
previous optimized schedule for the same Social Security claiming choice. The schedule is saved in browser storage.
If the assumptions used to create it later change, its label becomes **Optimized (Review)** until the optimizer is run
again and the updated schedule is applied. No Conversion and Fixed Conversion are already standard scenarios and are
not duplicated as Optimized schedules.

### Retirement Risk Analysis

Retirement Risk Analysis is an optional multi-path stress test. Every active claiming and conversion strategy is run
against the same seeded market and inflation paths so strategy comparisons use identical economic conditions.

When the active scenario method is Deterministic, the selected Market Assumption supplies the risk analysis target
average portfolio return. Custom Return values become the simulated asset-class averages. Volatility, correlations,
return limits, inflation, and the seed remain controlled by the Single Simulated Path settings. The risk panel displays
the effective market assumption and target return used for each run.

The analysis reports:

- modeled probability of covering all spending through the Primary Horizon Age;
- modeled probability of covering all spending through the Ending Age;
- Very Cautious, Cautious, and Middle portfolio balances at the Primary Horizon Age in both Future Dollars and
  Inflation-Adjusted Dollars;
- typical first spending-shortfall age among paths that experienced a shortfall;
- typical total inflation-adjusted shortfall among paths that experienced a shortfall; and
- an age-by-age chart showing a broad range of simulated balances and the middle result.

About 9 out of 10 simulated futures finish above the Very Cautious balance, about 3 out of 4 finish above the Cautious
balance, and half finish above the Middle balance. These are different outcomes from the same simulations, not separate
market-return assumptions. The default 1,000 simulated futures provides a more stable comparison than a small run;
larger runs take longer.

“Modeled probability of success” is the percentage of generated paths that cover all modeled spending through the
stated age. It is a sensitivity result based on the configured assumptions, not the user's actual probability of
success, a forecast, or a guarantee.

## Economic scenarios

The default experience uses the deterministic Lower Historical Return profile. Deterministic market presets are
derived from rolling 10- or 20-year annualized portfolio returns in the bundled 1975–2025 historical dataset. The
available profiles are Very Low, Lower, Middle, and Higher Historical Return, plus a Custom Return profile that accepts
user-entered asset-class returns. A deterministic profile applies one smooth return every year; it is not a probability
result and does not model the timing of annual gains and losses.

The bundled historical model uses separate annual U.S. and international stock returns. U.S. stocks use S&amp;P 500
total returns from the NYU Stern dataset. International stocks use the value-weighted market return from the
[Kenneth R. French International Index Portfolios](https://mba.tuck.dartmouth.edu/pages/Faculty/ken.french/Data_Library/int_index_port_formed.html),
weighted using EAFE plus Canada country weights and expressed in U.S. dollars. Historical replay and bootstrap paths
preserve both stock series. Single Simulated Path and Retirement Risk Analysis generate the two stock returns
separately and model their correlation.

Other scenario methods include:

- **Single Simulated Path:** generates one reproducible annual sequence from the configured means, volatility,
  correlations, limits, and seed.
- **Historical Sequence:** replays consecutive years from the bundled historical dataset.
- **Historical Bootstrap:** creates a reproducible path by sampling blocks of historical years.

The in-app Help page explains the methodology, recommended workflow, limitations, and published data sources.

## Tax, Medicare, and IRMAA configuration

The planner supports Single, Married Filing Jointly, Married Filing Separately, and Head of Household filing statuses.
Federal and state tax tables can be maintained from the application header. State estimates cover all 50 states and
the District of Columbia, but do not include local taxes or every state-specific credit, phaseout, recapture, or
alternative tax. Each projection year uses an exact-year table when available. Otherwise, indexed monetary values are
inflation-adjusted from the most recent prior table (or the earliest available table for an earlier projection), and
the Year-by-Year Details identify the source year and estimated basis. Federal brackets and deductions use the
inflation-adjusted fallback. State amounts are carried forward unchanged unless their individual bracket, deduction,
credit, exemption, or retirement-income-exclusion indexing setting is enabled in Tax Tables.

The default Medicare model requires no additional user input. Optional Medicare inputs can add standard Part B,
Part D or other coverage, out-of-pocket healthcare, and calculated IRMAA to spending when those costs are not already
included in the annual spending input. IRMAA uses the modeled two-year MAGI lookback and year-specific configuration
tables.

Tax rules, Medicare premiums, IRMAA thresholds, RMD rules, and Social Security amounts change over time. Verify all
configured values for the applicable year before relying on a projection.

## Projection timing and cash-flow contract

The planner uses complete calendar-year periods:

- The first period begins January 1 of the calendar year in which the user reaches the selected Start Age.
- Initial account balances are January 1 balances.
- Annual spending applies to the complete first calendar year and increases in later years using modeled inflation.
- Claim-age scenarios assume 12 Social Security payments in the year the selected claim age is reached.
- RMDs are based on the January 1 Traditional IRA balance.
- A configured future Traditional IRA rollover or deposit arrives near the beginning of its selected year, after that
  year's RMD balance is measured and before investment growth. It is treated as a tax-free account deposit.
- Investment growth is split into compounded first-half and second-half periods.
- Spending, Social Security, taxes, withdrawals, RMDs, and Roth conversions are modeled at midyear.
- Same-year Roth conversions cannot be used to fund that year's spending.
- Ending balances represent December 31 balances and become the following year's January 1 balances.
- Taxable savings are treated as a non-interest-bearing cash account.

## Local development

### Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm

### Install and run

```bash
npm install
npm run dev
```

### Test

```bash
npm run test:run
```

### Production build

```bash
npm run build
npm run preview
```

## Project structure

- `src/models`: typed domain contracts
- `src/data`: defaults, tax and IRMAA tables, RMD factors, allocation profiles, and historical data
- `src/services`: projection, tax, Social Security, economic scenario, risk analysis, and storage logic
- `src/hooks`: React state orchestration
- `src/components`: planner inputs, dashboards, configuration editors, shared controls, and help content
- `src/tests`: service and calculation tests

## Local data

Planner inputs, scenario settings, Roth optimizer settings, custom allocations, tax tables, and IRMAA configurations
are saved in browser local storage. Clearing the site's local storage restores application defaults on the next load.
