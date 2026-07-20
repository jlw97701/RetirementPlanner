# Retirement Planner TypeScript React Project

Architecture:

- models: typed domain contracts
- data: default tax tables, RMD factors, and planner defaults
- services: pure tax, Social Security, retirement, storage, and scenario logic
- hooks: React state orchestration
- components: UI only

## Projection timing

The planner uses complete calendar-year periods.

- The first period begins January 1 of the year in which the
  user reaches the selected start age.
- Initial account balances must be January 1 balances.
- Annual spending applies to the complete first calendar year.
- Investment returns are annual rates.
- Claim-age scenarios assume twelve Social Security payments
  in the calendar year in which the claim age is reached.
- Roth-conversion amounts are full-calendar-year targets.
- Ending balances represent December 31 balances.
- Each following year's starting balance equals the preceding
  year's ending balance.

Run:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

The included tax configuration is for planning and should be verified for the applicable filing year.
