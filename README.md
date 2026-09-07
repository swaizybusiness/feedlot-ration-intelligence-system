# Cattle Economic Intelligence System

Enterprise web calculator for integrated cattle economics.

## Current modules

- Procurement and landed cattle cost
- Arrival shrink and pre-slaughter shrink
- ADG, DMI, FCR, feed cost of gain, all-in cost of gain
- Mortality-adjusted animal-days and expected revenue
- Gross dressing, trim/condemnation, net HCW, cold carcass
- Boning yield, saleable meat, live-to-meat yield
- Slaughterhouse / jagal P&L
- Reverse solver for dressing, HCW, carcass price, ADG, live cattle bid ceiling, feed price, by-product, and meat price
- Target profit, margin, and ROI solvers
- Sensitivity matrix for carcass price and dressing
- Jagal purchase bid ceiling by expected dressing
- Formula audit trail

## Architecture

The calculation layer lives in `src/lib/engine.js` and is intentionally separated from the UI. The website consumes that engine as a single source of truth so formula definitions do not get duplicated across screens.

The original concept prototype in `test1` is retained as a design reference and rollback artifact.

## Run locally

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Production build

```bash
npm run build
```

## Calculation governance

Gross dressing, net dressing, cold-carcass yield, boning yield, and live-to-meat yield are separate metrics. Company-specific weighing protocols, fasting rules, trim definitions, condemnations, ownership of offal, financing assumptions, and accounting policy must be standardized before outputs are treated as official corporate KPIs.

## Status

`v0.1` calculation-first implementation. Next layers: saved scenarios, supplier analytics, lot history, authentication/RBAC, database persistence, audit logs, and executive BI.
