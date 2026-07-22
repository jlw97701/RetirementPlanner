# Retirement Income Planner

An educational retirement-income planning application built with React and TypeScript. It compares Social Security
claiming ages and Roth-conversion strategies while modeling spending, investment returns, taxes, Medicare, IRMAA,
required minimum distributions, and portfolio withdrawals.

> This application is a planning and sensitivity-analysis tool, not financial, tax, legal, or investment advice.
> Results are projections based on the selected assumptions and are not forecasts or guarantees.

## Features

- Compares Social Security claiming ages 62 through 70 with no, base, and aggressive Roth-conversion strategies.
- Supports an entered benefit for someone already receiving Social Security.
- Projects Traditional IRA, Roth IRA, and non-interest-bearing taxable savings balances.
- Applies the withdrawal order Traditional IRA, taxable savings, then Roth IRA.
- Models annual spending, inflation, Social Security COLAs, taxes, RMDs, Medicare costs, and IRMAA.
- Includes Conservative, Balanced, Growth, and Aggressive Growth asset allocations plus a persistent custom allocation.
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
withdrawals, conversions, RMDs, taxable income, federal and state taxes, Medicare, IRMAA, account balances, and any
unfunded spending.

### Retirement Risk Analysis

Retirement Risk Analysis is an optional multi-path stress test. Every active claiming and conversion strategy is run
against the same seeded market and inflation paths so strategy comparisons use identical economic conditions.

When the active scenario method is Deterministic, the selected Market Assumption supplies the risk analysis target
average portfolio return. Custom Market values become the simulated asset-class averages. Volatility, correlations,
return limits, inflation, and the seed remain controlled by the Single Simulated Path settings. The risk panel displays
the effective market assumption and target return used for each run.

The analysis reports:

- modeled probability of covering all spending through the Primary Horizon Age;
- modeled probability of covering all spending through the Ending Age;
- median inflation-adjusted portfolio balance at the Primary Horizon Age;
- typical first spending-shortfall age among paths that experienced a shortfall;
- typical total inflation-adjusted shortfall among paths that experienced a shortfall; and
- an age-by-age chart showing the P10-to-P90 portfolio range and median result.

“Modeled probability of success” is the percentage of generated paths that cover all modeled spending through the
stated age. It is a sensitivity result based on the configured assumptions, not the user's actual probability of
success, a forecast, or a guarantee.

## Economic scenarios

The default experience uses a deterministic Below Average Market profile. Deterministic market presets are derived
from rolling 10- or 20-year annualized portfolio returns in the bundled 1975–2025 historical dataset. A Custom Market
profile accepts user-entered asset-class returns.

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
alternative tax.

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

Planner inputs, scenario settings, custom allocations, tax tables, and IRMAA configurations are saved in browser local
storage. Clearing the site's local storage restores application defaults on the next load.
