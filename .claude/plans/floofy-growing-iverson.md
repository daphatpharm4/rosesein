# Plan: Create `workflow/` Folder with 7 Operational Deliverables

## Context
The user needs a dedicated `workflow/` folder consolidating the Bonamoussadi data acquisition strategy into 7 actionable deliverable files. Extensive research already exists in `research/` (10 strategy docs) and `docs/` (team deliverables, ops runbooks). The task is to **synthesize and operationalize** this material — not copy it. Each file must be self-contained and field-ready, with checklists, decision tables, and status tracking columns that the research docs lack.

**This is a document creation task — no code changes.**

---

## Folder Structure

```
workflow/
  README.md                    -- Index and navigation hub
  01-vertical-matrix.md        -- Vertical-by-vertical reference matrix
  02-collection-mix.md         -- Recommended data source mix per vertical
  03-pilot-plan-6-week.md      -- 6-week Bonamoussadi pilot with budget/KPIs
  04-contact-list.md           -- Priority company/org contacts per vertical
  05-risk-register.md          -- Risk register with mitigations and triggers
  06-eighty-twenty-focus.md    -- 80/20 analysis: high-value data points
  07-validation-sop.md         -- Capture → Verify → Score → Publish SOP
```

---

## Source Material (all already in repo)

| Source File | Used For |
|---|---|
| `research/10-FINAL-STRATEGY-synthesis.md` | Primary source for all 7 deliverables (Sections 1-7 map 1:1) |
| `research/09-project-leader-execution-plan.md` | Deep detail for pilot plan: day-by-day schedules, RAID log, budget, Go/No-Go |
| `research/01-data-analyst-local-context.md` | POI estimates, update frequencies, field realities per vertical |
| `research/06-fraud-specialist-anti-fraud.md` | Fraud detection algorithms, risk heat map for risk register + SOP |
| `research/07-marketing-commercial-strategy.md` | Buyer personas, pricing tiers, outreach templates for contact list |
| `research/02-system-design-collection-workflow.md` | Data model, delta computation, confidence scoring for SOP |
| `docs/vertical-delta-templates/00_verticals_overview_matrix.csv` | Structured vertical data columns |

---

## Implementation Steps

### Step 1: Create folder + README
- `mkdir workflow/`
- Write `workflow/README.md`: title, "how to use" bullets, deliverable index table, source doc links, 7 canonical vertical names

### Step 2: `workflow/01-vertical-matrix.md`
- **Source:** research/10 §1 + research/01 §2 + CSV matrix
- **Structure:** Summary table (all 7 verticals: priority P0/P1/P2, estimated POI count, capture complexity, update frequency), then 7 individual vertical tables
- **Columns per vertical:** Data Needed, Actors, Products/Services, Likely Problems, Data Gaps, Delta Method, Est. POI Count, Update Frequency
- **Add vs source:** POI estimates from research/01 §5, update frequency row

### Step 3: `workflow/02-collection-mix.md`
- **Source:** research/10 §2
- **Structure:** Mix percentage table (field ops / satellite / partner / public / competitor per vertical), then "What this means operationally" section with effort estimates, then "Data source acquisition actions" table with who/when/action per source type
- **Cross-ref:** Link to `04-contact-list.md` for partner contacts

### Step 4: `workflow/03-pilot-plan-6-week.md`
- **Source:** research/10 §3 + research/09 (full detail)
- **Structure:**
  - Team table (1 CEO, 1 Team Lead, 3 Field Agents — roles, responsibilities, compensation)
  - Budget table with week-by-week cash flow (total ~CFA 2M)
  - Equipment procurement checklist
  - KPI table (20 WAC, 200+ verified points, <14d freshness, >70% approval rate)
  - Week-by-week milestone table (W1 setup, W2 baseline, W3-4 enrichment, W5 delta+outreach, W6 review)
  - Go/No-Go decision matrix (7 criteria, 4 outcomes: STRONG GO / CONDITIONAL / PIVOT / STOP)
  - Daily field ops checklist template

### Step 5: `workflow/04-contact-list.md`
- **Source:** research/10 §4 + research/07
- **Structure:**
  - Top 10 Priority Accounts table (cross-vertical, ordered by revenue potential)
  - Per-vertical contact tables with columns: Organization, Type, Contact Role, Priority, Status (not contacted/contacted/meeting/proposal/closed)
  - International organizations section (World Bank, WHO, USAID, Gates Foundation, UNDP)
  - Outreach templates section (WhatsApp, email, LinkedIn — 2-3 templates)

### Step 6: `workflow/05-risk-register.md`
- **Source:** research/10 §5 + research/06 §1 + research/09 §6
- **Structure:**
  - Risk heat map (probability × impact grid)
  - Risk table grouped by category (Fraud, Operational, Commercial, Technical, Regulatory, Security)
  - Columns: ID, Risk, Category, Probability, Impact, Score, Mitigation, Owner, Trigger, Escalation, Status
  - Weekly risk review checklist (5-6 questions for Friday reviews)

### Step 7: `workflow/06-eighty-twenty-focus.md`
- **Source:** research/10 §6
- **Structure:**
  - Executive summary box: "Focus 30% of agent time on Roads + MoMo + Fuel → 65% of revenue"
  - Revenue/Effort ratio table per vertical
  - Must-have vs nice-to-have fields (field agent cheat sheet format)
  - Highest-value delta types ranking with primary buyer
  - 6-month resource allocation calendar
  - "Field agent daily decision guide" — priority order when time is short

### Step 8: `workflow/07-validation-sop.md`
- **Source:** research/10 §7 + research/06 + research/02
- **Structure:**
  - Quick reference card (5 critical thresholds: publication ≥40, high-confidence ≥70, auto-reject fraud ≥71, GPS reject >200km/h, photo reject if >7d old)
  - Pipeline flowchart (ASCII): Capture → Client Checks → Upload → Server Validation → Risk Score → Route (auto-approve / review / reject)
  - Numbered SOP steps with sub-step checkboxes
  - Confidence scoring formula with exact weights
  - Auto-routing decision table (fraud score × quality score → action)
  - Admin review queue workflow
  - Spot-check audit protocol
  - Cross-ref to `docs/vertical-delta-templates/` for field schemas

---

## Execution Strategy

Use **3 parallel agents** to maximize speed:
- **Agent A:** README + 01 (vertical matrix) + 02 (collection mix)
- **Agent B:** 03 (pilot plan) + 04 (contact list) + 05 (risk register)
- **Agent C:** 06 (80/20 focus) + 07 (validation SOP)

Each agent reads the relevant source research docs and creates the workflow files. All agents use the 7 canonical vertical names: `billboard`, `alcohol_outlet`, `census_proxy`, `fuel_station`, `mobile_money`, `pharmacy`, `transport_road`.

---

## Verification
1. `ls workflow/` — confirm 8 files exist (README + 7 deliverables)
2. Each file has a "Sources" footer referencing research docs
3. Each file uses consistent vertical naming
4. No file is a verbatim copy of research content — each adds operational structure (checklists, status columns, decision guides)
5. Cross-references between files are valid (e.g., 02 links to 04)
6. Vite build still passes (no code changes, but verify no accidental breakage)
