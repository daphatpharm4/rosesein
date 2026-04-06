# ROSE-SEIN System Design

## Current Technical Shape

The application currently runs on:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase client helpers
- static and mock-driven route rendering

The current system is functional enough to build and render, but it is not yet a fully unified architecture.

## Current Issues in the Code Structure

The main structural drift from the first scaffold has now been reduced:

- canonical shell path: `components/shell` and `components/navigation`
- canonical Supabase helper path: `lib/supabase`
- canonical messaging route: `/messages`

The remaining legacy behavior is:

- `/messagerie` is kept as a compatibility redirect to `/messages`

## Target Module Boundaries

### App layer

- App Router route files
- route-level layout boundaries
- server-side data loading
- metadata definitions

### UI shell layer

- top app bar
- bottom navigation
- shell framing
- floating action patterns

### Feature layer

- messages
- content
- association
- journey
- account
- notifications
- support and help
- future community

### Platform layer

- Supabase browser and server helpers
- environment access
- typed route and API patterns
- validation utilities

### Data access layer

- domain-specific queries
- server-side mutations
- policy-aware data access
- file and storage access rules

## Frontend Architecture Direction

### Rendering model

- Use server components by default for data-backed pages.
- Use client components only for interaction-heavy surfaces such as search, tabs, compose flows, and local state transitions.
- Keep sensitive data access out of client-only code wherever possible.

### Styling model

- Keep semantic design tokens in Tailwind config and global CSS.
- Continue the editorial “Digital Sanctuary” direction:
  - tonal hierarchy
  - no hard divider dependency
  - large tap targets
  - ambient depth
  - restrained gradients

### Accessibility model

- semantic form controls
- explicit labels
- clear focus treatment
- no placeholder-only labeling
- reduced cognitive noise
- fatigue-aware typography and spacing

## Backend and Server Boundary Direction

### Current state

- Supabase client helpers exist under `lib/supabase`
- middleware refreshes session state
- protected route group now guards:
  - `/messages`
  - `/parcours`
  - `/parametres`
- initial RLS-aware schema exists
- app is not yet using live feature queries against those tables

### Target state

- use server components and server-side helpers for protected reads
- use explicit server-side mutation boundaries for:
  - profile updates
  - messaging sends
  - content moderation
  - event publishing
  - notification preference updates
- avoid direct privileged decisions in client code

## Data Flow Narrative

### Public editorial flow

1. association-authored content is created or imported
2. content is validated and published
3. public or semi-public routes render validated content

### Authenticated user flow

1. user authenticates with Supabase
2. profile and roles are resolved server-side
3. route access and data access are filtered by role and participation
4. updates are written through server-controlled mutation paths

### Messaging flow

1. thread list loads for current participant
2. thread access is filtered by participant or staff role
3. messages load within allowed thread scope only
4. sends are accepted only for authenticated participants

## Integration Map

### Core integrations

- Vercel for hosting and build
- Supabase Auth
- Supabase Postgres
- Supabase Storage

### Future integrations

- email or SMS notification provider
- analytics and reporting destination
- moderation notification channel
- optional content import or CMS bridge for public site alignment

## System Design Decisions

- consolidate onto the newer shell under `components/shell` and `components/navigation`
- consolidate auth and session handling onto `lib/supabase/*`, `middleware.ts`, and the protected route group
- keep route handlers and actions lean; place domain logic in shared server-side modules
- protect any sensitive read or write behind authenticated, server-side boundaries
- make moderation and admin actions auditable

## Immediate Technical Cleanup Recommendations

1. introduce a dedicated domain folder strategy for data-backed features
2. add schema-aware data access wrappers once live Supabase integration begins
3. replace placeholder protected-page content with live queries
4. expand auth from magic-link entry point to profile hydration and role-aware UX
