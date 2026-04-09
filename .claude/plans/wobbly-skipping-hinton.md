# Delta Aggregation, Dashboard & Predictions Plan

## Context

The app collects field data via event sourcing (`point_events` table). Currently all analytics are computed on-the-fly — no snapshots, no week-over-week deltas, no historical trends. The goal is to:

1. **Weekly automated snapshots** of projected point state per vertical
2. **Delta computation** (new/removed/changed/unchanged) comparing this week to last
3. **Pre-computed stats** with trend metrics and anomaly detection
4. **In-app admin dashboard** with charts and anomaly alerts
5. Statistical methods: moving averages, week-over-week growth, z-score anomaly flagging

---

## Phase 1: Database Schema

**New file**: `supabase/migrations/20260303_snapshot_delta_tables.sql`

### Table: `snapshots`
Frozen projected state per point per snapshot date.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| snapshot_date | date NOT NULL | "YYYY-MM-DD", represents the week |
| vertical_id | text NOT NULL | |
| point_id | text NOT NULL | |
| category | text NOT NULL | |
| site_name | text | |
| latitude / longitude | double precision | |
| details | jsonb | Full frozen details |
| gaps | text[] | Missing enrichable fields |
| events_count | integer | |
| photo_url, source, external_id | text | |
| UNIQUE(snapshot_date, point_id) | | Prevents double-runs |

### Table: `snapshot_deltas`
One row per point per delta type per changed field.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| snapshot_date | date NOT NULL | |
| baseline_snapshot_date | date NOT NULL | Previous snapshot |
| vertical_id | text NOT NULL | |
| point_id | text NOT NULL | |
| delta_type | text NOT NULL | `new`, `removed`, `changed`, `unchanged` |
| delta_field | text | Which field changed (null for new/removed/unchanged) |
| previous_value / current_value | text | |
| delta_magnitude | numeric | Numeric diff for prices etc. |
| delta_direction | text | `increase`, `decrease`, `stable`, `not_applicable` |
| delta_summary | text | Human-readable one-liner |

### Table: `snapshot_stats`
One row per vertical per snapshot date — pre-aggregated for fast dashboard reads.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| snapshot_date | date NOT NULL | |
| vertical_id | text NOT NULL | |
| total_points | integer | |
| completed_points | integer | Points with no gaps |
| completion_rate | numeric | Percentage |
| new_count / removed_count / changed_count / unchanged_count | integer | Delta breakdown |
| avg_price | numeric | Fuel verticals only |
| week_over_week_growth | numeric | (current - prev) / prev |
| moving_avg_4w | numeric | 4-week smoothed total_points |
| z_score_total_points / z_score_new_count / z_score_removed_count | numeric | |
| anomaly_flags | jsonb | `[{"metric":"removed_count","z_score":2.4,"direction":"increase"}]` |
| UNIQUE(snapshot_date, vertical_id) | | |

Indexes on `(snapshot_date DESC, vertical_id)`, `(vertical_id, snapshot_date DESC)`, `(point_id, snapshot_date DESC)`.

---

## Phase 2: Snapshot Engine

**New file**: `lib/server/snapshotEngine.ts`

### Core function: `runWeeklySnapshot()`

```
Step 1: buildCurrentProjection()
  → reuses projectPointsFromEvents() from lib/server/pointProjection.ts
  → reuses getPointEvents(), getLegacySubmissions() from lib/server/storage/index.ts

Step 2: buildSnapshotRows(snapshotDate, points)
  → maps ProjectedPoint[] to SnapshotRow[] (one per point)

Step 3: insertSnapshotRows() → bulk INSERT with ON CONFLICT DO NOTHING

Step 4: getPreviousSnapshotDate() → find most recent snapshot before today
  → if exists: load previous snapshot, call computeDeltas()
  → insertDeltaRows()

Step 5: Per vertical, compute StatsRow:
  - total_points, completed_points, completion_rate
  - new/removed/changed/unchanged counts from deltas
  - avg_price (fuel verticals: average of details.fuelPrice)
  - week_over_week_growth from previous stats row
  - moving_avg_4w from last 4 stats rows
  - z_score_* from last 8 stats rows
  - anomaly_flags where |z_score| > 2
  → insertStatsRow() with UPSERT
```

### Delta computation: `computeDeltas(currentMap, previousMap)`

- **new**: point_id in current but not in previous
- **removed**: point_id in previous but not in current
- **changed**: point_id in both, `detectChangedFields()` compares details JSONB field-by-field (skipping metadata fields like fraudCheck, clientDevice)
- **unchanged**: point_id in both, no field changes

### Statistical helpers (same file)

- `computeMovingAverage(values[], windowSize)` — average of last N values
- `computeZScore(value, historicalValues[])` — `(x - mean) / stddev`, needs >= 3 data points
- `detectAnomalies(value, history[], metricName, threshold=2)` — returns flag if |z| > 2

---

## Phase 3: Vercel Cron Job

**New file**: `api/cron/snapshot.ts`

- `GET` handler, authenticated via `Authorization: Bearer <CRON_SECRET>`
- Calls `runWeeklySnapshot()`, returns JSON result
- Error handling with console.error logging

**Modify**: `vercel.json` — add cron config:
```json
"crons": [{ "path": "/api/cron/snapshot", "schedule": "0 3 * * 1" }]
```
(Monday 03:00 UTC)

**Env var needed**: `CRON_SECRET` (set in Vercel project settings)

**Timeout**: Export `maxDuration = 60` from the cron endpoint (snapshot may take time with many points)

---

## Phase 4: API Endpoints (admin-only)

All use existing patterns from `api/submissions/index.ts`: `requireUser()`, admin check, `jsonResponse`/`errorResponse`, `query()` from `lib/server/db.ts`.

### `GET /api/analytics/snapshots`
**File**: `api/analytics/snapshots.ts`
- Params: `?vertical=pharmacy&limit=12`
- Returns: `StatsRow[]` from `snapshot_stats`, ordered by date DESC

### `GET /api/analytics/deltas`
**File**: `api/analytics/deltas.ts`
- Params: `?date=2026-03-03&vertical=pharmacy&type=changed&limit=100`
- Returns: `{ deltas: DeltaRow[], total: number }`

### `GET /api/analytics/trends`
**File**: `api/analytics/trends.ts`
- Params: `?vertical=fuel_station&metric=total_points&weeks=12`
- Returns: `{ data: Array<{ date: string; value: number; movingAvg: number | null }> }`
- Metrics: `total_points`, `completion_rate`, `new_count`, `removed_count`, `avg_price`, `week_over_week_growth`

### `GET /api/analytics/anomalies`
**File**: `api/analytics/anomalies.ts`
- Returns all recent anomaly flags from `snapshot_stats` where `jsonb_array_length(anomaly_flags) > 0`

---

## Phase 5: Dashboard Component

**New file**: `components/Screens/DeltaDashboard.tsx`

Admin-only screen, accessed from a button in `Analytics.tsx`. Uses existing `recharts` (already a dependency) and `apiJson` from `lib/client/api.ts`.

### Layout

```
┌─ Header (back button, "Delta Intelligence") ─────────────┐
│                                                            │
│ ┌─ AnomalyBanner (red, shown when anomalies exist) ─────┐ │
│ │ ⚠ 2 Anomalies: fuel_station removed_count z=2.4 ...   │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Summary Cards (4 across) ─────────────────────────────┐ │
│ │ Total Points │ WoW Growth │ Completion │ Anomalies     │ │
│ │    142  ▲3%  │   +8.2%    │   67.3%    │     2         │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ [Vertical Tabs: All | Pharmacy | Fuel | Kiosk | ...]       │
│                                                            │
│ ┌─ Point Count Trend (LineChart) ────────────────────────┐ │
│ │ solid line = actual, dashed = 4-week moving avg        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Delta Breakdown (StackedBarChart) ────────────────────┐ │
│ │ green=new, red=removed, yellow=changed, gray=unchanged │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Price Trend (LineChart, fuel only) ───────────────────┐ │
│ │ avg fuel price over time                               │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Recent Deltas (scrollable list) ──────────────────────┐ │
│ │ Point X: price changed 800→845 XAF (+5.6%)            │ │
│ │ Point Y: NEW alcohol_outlet added                      │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Integration

- Add `Screen.DELTA_DASHBOARD = 'DELTA_DASHBOARD'` to `types.ts` enum
- Add navigation button in `Analytics.tsx` admin section → opens DeltaDashboard
- Wire in `App.tsx` screen routing

---

## Phase 6: Types

**Modify**: `shared/types.ts` — add:
- `DeltaType`, `DeltaDirection` union types
- `SnapshotStats`, `SnapshotDelta`, `TrendDataPoint` interfaces

---

## Files Summary

| Action | File |
|--------|------|
| CREATE | `supabase/migrations/20260303_snapshot_delta_tables.sql` |
| CREATE | `lib/server/snapshotEngine.ts` |
| CREATE | `api/cron/snapshot.ts` |
| CREATE | `api/analytics/snapshots.ts` |
| CREATE | `api/analytics/deltas.ts` |
| CREATE | `api/analytics/trends.ts` |
| CREATE | `api/analytics/anomalies.ts` |
| CREATE | `components/Screens/DeltaDashboard.tsx` |
| MODIFY | `vercel.json` (add crons) |
| MODIFY | `shared/types.ts` (add delta types) |
| MODIFY | `types.ts` (add DELTA_DASHBOARD screen) |
| MODIFY | `components/Screens/Analytics.tsx` (add nav button) |
| MODIFY | `App.tsx` (add screen routing) |

## Key Reuse

- `projectPointsFromEvents()` from `lib/server/pointProjection.ts`
- `getPointEvents()`, `getLegacySubmissions()` from `lib/server/storage/index.ts`
- `query()` from `lib/server/db.ts`
- `requireUser()` from `lib/auth.ts`
- `jsonResponse`/`errorResponse` from `lib/server/http.ts`
- `apiJson` from `lib/client/api.ts`
- `VERTICAL_IDS`, `VERTICALS` from `shared/verticals.ts`
- `recharts` components (already installed)

## Implementation Order

1. Migration file (run against Supabase)
2. `shared/types.ts` delta types
3. `lib/server/snapshotEngine.ts`
4. `api/cron/snapshot.ts` + `vercel.json`
5. API endpoints (4 files)
6. `DeltaDashboard.tsx` + Analytics/App integration

## Verification

1. **Run migration** against Supabase
2. **Trigger snapshot manually**: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/snapshot`
3. **Verify DB**: Check `snapshots`, `snapshot_stats` tables have rows
4. **Trigger again next week** (or manually insert a 2nd snapshot with different date) to verify deltas
5. **Dashboard**: Open admin analytics → Delta Intelligence, verify charts render
6. **Anomaly test**: Manually insert a stats row with extreme values, verify banner appears
