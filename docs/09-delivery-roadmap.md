# ROSE-SEIN Delivery Roadmap

## Roadmap Objective

Move from scaffold to safe, association-operable product in deliberate phases without overreaching the current foundation.

## Phase 0: Documentation and Architecture Consolidation

Goals:

- establish the full doc set
- normalize target route and shell strategy
- define role model, cloud model, and service model

Acceptance criteria:

- documentation package exists
- target architecture decisions are explicit
- implementation priorities are clear

## Phase 1: Architecture Cleanup and Auth Foundation

Status:

- in progress
- route and shell consolidation completed
- auth entrypoint and protected layouts completed
- profile and role hydration still pending

Goals:

- consolidate duplicate shell and route patterns
- implement Supabase authentication
- establish protected layouts and role resolution

Acceptance criteria:

- canonical shell path selected
- `/messages` and `/messagerie` strategy resolved
- signed-in and signed-out states exist
- profile and role lookup works server-side

## Phase 2: Content and Association Surfaces

Goals:

- implement actualités and association content model
- support imported or curated website-aligned content
- implement event model and event display

Acceptance criteria:

- live content query path exists
- event model is wired
- editorial publishing workflow is documented

## Phase 3: Messaging and Moderation Foundation

Goals:

- connect messaging UI to live thread and message data
- enforce participant-based access
- add moderation and reporting foundations

Acceptance criteria:

- users can only see authorized threads
- server-side send flow exists
- moderation data model exists

## Phase 4: Journey and Secure Documents

Goals:

- add appointments
- add notes
- add secure document storage and retrieval

Acceptance criteria:

- private storage path exists
- journey surfaces are protected
- access model is validated

## Phase 5: Analytics, Operations, and Readiness

Goals:

- add privacy-safe analytics
- add service delivery workflows
- formalize monitoring and incident readiness

Acceptance criteria:

- event taxonomy approved
- key dashboards specified or implemented
- release and incident runbooks are ready

## Dependency Highlights

- auth precedes messaging and journey
- content model precedes full actualités rollout
- moderation model precedes community scale-up
- storage policy precedes document upload
- analytics schema precedes instrumentation rollout

## Do-Not-Ship Criteria

Do not ship major authenticated features if:

- auth is not enforced correctly
- RLS policies do not match route behavior
- legacy aliases create conflicting navigation instead of clean redirects
- support and moderation owners are undefined
- rollback steps are undocumented
