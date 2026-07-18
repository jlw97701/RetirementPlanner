# Retirement Planner TypeScript React Project

Architecture:
- models: typed domain contracts
- data: default tax tables, RMD factors, and planner defaults
- services: pure tax, Social Security, retirement, storage, and scenario logic
- hooks: React state orchestration
- components: UI only

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
