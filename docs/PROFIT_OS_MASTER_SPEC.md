# PROFIT OS — MASTER SPEC v1.0

## Product
Offline Profit & Pricing Calculator for creators, freelancers, marketplace sellers and small operators.

## Commercial promise
One-time purchase. No mandatory account, subscription, VPS, cloud database or backend. Core calculations work offline.

## Target price
- Standard: $79 lifetime
- Launch/test price may be $59
- No recurring subscription in V1

## Core modes
1. Product Pricing
2. Target Profit
3. What-if / Scenario
4. Break-even
5. Product Comparison
6. Monthly Projection
7. Freelancer Quote
8. Real Estate Deal Analysis

## Core inputs
- Selling price
- Quantity
- Material/product cost
- Labor
- Packaging
- Shipping
- Advertising
- Marketplace/platform fee %
- Payment fee %
- Fixed transaction fee
- Tax reserve %
- Other costs

All fee values must be editable. No critical marketplace fee may be hard-coded without an editable override.

## Core outputs
- Revenue
- Total variable costs
- Total fixed costs
- Platform fees
- Payment fees
- Tax reserve
- Net profit
- Profit margin
- Break-even price
- Required price for target profit
- Effective hourly rate where hours are supplied
- Monthly revenue/profit projection

## Required scenario engine
User can change any major input and compare at least 3 scenarios:
- Base
- Lower price / worse costs
- Higher price / better economics

Show absolute and percentage differences.

## Product comparison
Compare up to 10 products/projects:
- price
- cost
- fees
- profit
- margin
- target-profit gap
- effective hourly rate when applicable

## Data model
Local-first. Use browser local storage/IndexedDB as appropriate.
- Products
- Scenarios
- Fee profiles
- Settings
- Saved calculations

## Import/export
- JSON full backup/restore
- CSV product import/export
- CSV comparison export
- Printable/PDF-ready reports

## Privacy
No analytics or remote data transfer in core app.
Do not require login.
No personal/business data leaves the device.

## Localization
Required UI languages:
- English
- Russian
- Italian
- Spanish
- German
- French

English is the primary commercial language. Translation keys must be centralized; no hard-coded UI strings.

## Currency
Support:
EUR, USD, GBP, CAD, AUD, CHF, PLN and custom currency symbol.
Currency conversion is NOT required in V1. Calculations operate in the selected currency.

## UX screens
1. Welcome / Quick Start
2. Dashboard
3. New Calculation
4. Target Profit
5. Scenarios
6. Product Comparison
7. Monthly Projection
8. Freelancer
9. Real Estate
10. Fee Profiles
11. Saved Calculations
12. Settings / Language / Currency
13. Import / Export
14. Help

## Critical UX rules
- Every primary button must work.
- No dead-end screens.
- Clear empty states.
- Confirm destructive actions.
- Autosave saved calculations.
- Responsive desktop/mobile layout.
- Keyboard-accessible forms.
- Visible calculation result after valid input.
- Validation messages must identify the exact field/problem.

## Calculation principles
All money calculations must use decimal-safe arithmetic; avoid binary floating-point errors for displayed financial totals.
Round displayed money to 2 decimals, but preserve internal precision.
Never silently convert negative profit into positive values.
Clearly distinguish revenue, cost, profit and margin.

## Real Estate V1
Inputs:
- purchase price
- down payment
- loan amount
- interest rate
- loan term
- renovation
- closing costs
- monthly rent
- vacancy
- property tax
- insurance
- maintenance
- management
- other monthly costs
- expected sale price

Outputs:
- initial cash required
- monthly cash flow
- annual cash flow
- cap rate
- cash-on-cash return
- estimated ROI
- break-even occupancy
- projected sale profit

This is an analysis calculator, not financial advice.

## Freelancer V1
Inputs:
- project price
- hours
- hourly target
- expenses
- platform fee
- payment fee
- tax reserve

Outputs:
- net profit
- effective hourly rate
- target-price gap
- required quote

## Marketplace fee profiles
Provide editable presets as convenience examples. Presets must be clearly labeled and editable. Fee assumptions must show a source/date in documentation where applicable.

## Packaging
Deliverable ZIP:
- app/
- README
- LICENSE
- CHANGELOG
- QUICK_START
- privacy statement
- version information

The app must run from local files where technically supported. If browser security restrictions prevent a feature from working via file://, provide a zero-server local launch option that does not require a paid service.

## QA gates
Q1 Functional
- every calculator
- every save/load action
- every import/export
- every primary button

Q2 Calculation
- positive values
- zero values
- negative/invalid values
- large values
- decimal values
- fee edge cases
- rounding

Q3 Localization
- all six languages
- no English leakage in translated UI
- no duplicated labels
- no clipped text

Q4 Responsive
- phone
- tablet
- desktop
- landscape

Q5 Accessibility
- keyboard navigation
- focus visibility
- labels
- contrast
- readable errors

Q6 Data integrity
- save
- reload
- backup
- restore
- corrupted import handling

Q7 Commercial
- clean onboarding
- product branding
- screenshots
- license
- documentation
- version/build identifier

## Release gate
Do not label the product sale-ready until:
- all critical tests pass
- zero known broken primary buttons
- zero known calculation defects
- zero untranslated required UI strings
- import/export round trip passes
- responsive smoke tests pass
- clean ZIP tested on a fresh environment

## Progress blocks
P00 Market validation — 100%
P01 Product specification — 100%
P02 Design system — 0%
P03 App shell/navigation — 0%
P04 Calculation engine — 0%
P05 Product Pricing — 0%
P06 Target Profit — 0%
P07 Break-even — 0%
P08 What-if Scenarios — 0%
P09 Product Comparison — 0%
P10 Monthly Projection — 0%
P11 Freelancer Mode — 0%
P12 Real Estate Mode — 0%
P13 Fee Profiles — 0%
P14 Persistence — 0%
P15 Import/Export — 0%
P16 Localization — 0%
P17 Responsive/mobile — 0%
P18 Accessibility — 0%
P19 Functional QA — 0%
P20 Calculation QA — 0%
P21 Commercial packaging — 0%
P22 Release QA — 0%
P23 Marketplace launch package — 0%

## Non-goals for V1
- mandatory cloud backend
- subscriptions
- user accounts
- team collaboration
- payment processing
- live bank integrations
- automatic tax filing
- legal/tax advice
