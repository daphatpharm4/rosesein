# 02. System Design

## Objective

Define a canonical product architecture that closes current drift and supports a safe MVP.

## Current Implemented Surfaces

- Public:
  - `/`
  - `/actualites`
  - `/association`
  - `/account`
- Protected:
  - `/messages`
  - `/parcours`
  - `/parametres`
- Compatibility alias:
  - `/messagerie` redirects to `/messages`

## Canonical Route Map

| Route | Status | Current state | Target state |
| --- | --- | --- | --- |
| `/` | canonical | live | public orientation hub |
| `/account` | canonical | live | auth, profile bootstrap, privacy explanation |
| `/messages` | canonical | protected, mock-backed | live participant-scoped inbox |
| `/actualites` | canonical | public scaffold | website-aligned editorial feed |
| `/association` | canonical | public scaffold | association story, events, partners, CTA |
| `/parcours` | canonical | protected placeholder | appointments, notes, later documents |
| `/parametres` | canonical | protected placeholder | profile, privacy, notifications |
| `/messagerie` | temporary alias | redirect only | keep until links are cleaned up |
| `/soins` | planned | not built | curated support-care categories |
| `/aide` | planned | not built | help, support, orientation, non-emergency resources |
| `/admin` | planned | not built | content, moderation, operations control plane |

## Module Boundaries

### App layer

- route files and layouts
- metadata
- route-level server loading
- route protection boundaries

### Shell and navigation layer

- `components/shell`
- `components/navigation`
- brand-consistent framing

### Feature layer

- account
- messages
- actualités
- association
- parcours
- paramètres
- later: soins, aide, communaute, admin

### Platform layer

- `lib/env.ts`
- `lib/auth.ts`
- `lib/supabase/*`
- future validation and domain access modules

## Canonical Domain Separation

| Domain | Visibility | Storage | Notes |
| --- | --- | --- | --- |
| Public editorial content | public | Postgres | website-linked or app-published |
| Association operations | staff-only | Postgres | events, publishing state, admin actions |
| Profiles and preferences | user or staff-scoped | Postgres | personal but not content-heavy |
| Messaging | participant-scoped | Postgres | never exposed to public analytics content |
| Journey data | strictly private | Postgres plus private storage later | highest sensitivity in product scope |
| Moderation and audit | moderator and admin-scoped | Postgres | must be append-friendly and traceable |

## Entity Model Direction

Existing baseline entities already cover:

- profiles
- user roles
- articles
- events
- conversation threads
- thread participants
- messages
- notification preferences

Next entities required before community or document launch:

- content reports
- moderation actions
- audit log
- appointments
- personal notes
- secure documents
- event registrations

## Baseline vs Snapshot vs Delta Rules

ROSE-SEIN is not a geographic delta platform. Its delta model should be operational:

- Baseline:
  - canonical profile
  - published article or event
  - thread membership
  - notification preference state
- Snapshot:
  - draft article version
  - moderation queue status
  - current onboarding completion state
  - current support backlog
- Delta:
  - what changed since last approved version
  - who changed it
  - whether the change needs validation before exposure

## Validation Boundaries

| Workflow | Author | Validator | Publisher | Notes |
| --- | --- | --- | --- | --- |
| Articles | association editor | reviewer or medical validator where needed | admin or publisher | website-aligned governance |
| Events | association staff | operations owner | admin | must include support contact |
| Messages | authenticated participant | none before send, moderation after report | not applicable | participant scope enforced |
| Sensitive settings | authenticated user | server authorization only | immediate write | audit selective changes later |
| Moderation actions | moderator | admin for severe actions | immediate recorded action | must be auditable |

## Immediate Design Decisions

1. Keep `/messages` as the only canonical messaging route.
2. Keep public and protected surfaces sharply separated at the route-group level.
3. Add server-side profile bootstrap before wiring any live messaging.
4. Introduce moderation and audit entities before community posting features.
